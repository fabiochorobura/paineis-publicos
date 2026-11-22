import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CargoId, Eleicoes, Resultado } from '../api/tipos';
import { buscarResultado, descobrirEleicoes, eleicoesPadrao, NaoPublicadoError, temApuracao } from '../api/tse';
import { reiniciarSimulacao, simularResultado } from '../api/simulacao';
import { reiniciarCores } from '../utils/cores';
import { UFS } from '../data/ufs';
import { gravar, ler } from '../utils/storage';
import { aCadaVirada, PERIODO_ATUALIZACAO_MS, proximaVirada } from '../utils/relogio';

export type Modo = 'oficial' | 'simulacao';
export type Status = 'carregando' | 'aovivo' | 'aguardando' | 'erro';

export interface PontoHistorico {
  t: number;
  pctSecoes: number;
  pcts: Record<string, number>;
}

interface Ctx {
  modo: Modo;
  setModo: (m: Modo) => void;
  turno: 1 | 2;
  setTurno: (t: 1 | 2) => void;
  eleicoes: Eleicoes | null;
  intervalo: number;
  setIntervalo: (s: number) => void;
  status: Status;
  erro: string | null;
  brasil: Resultado | null;
  estados: Record<string, Resultado>;
  historico: PontoHistorico[];
  ultimaAtualizacao: Date | null;
  /** timestamp da próxima atualização automática */
  proximaEm: number;
  atualizando: boolean;
  atualizar: () => void;
  /** contador que muda a cada ciclo de atualização — páginas usam para recarregar seus dados */
  ciclo: number;
  buscar: (cargo: CargoId, abrangencia: string, signal?: AbortSignal) => Promise<Resultado>;
  /** Modo TV: não pausa com a aba oculta (ex.: aba transmitida pelo Chromecast em segundo plano) */
  setSempreAtivo: (v: boolean) => void;
}

const EleicaoContext = createContext<Ctx | null>(null);

/** intervalo legado (só a simulação usa); o oficial segue PERIODO_ATUALIZACAO_MS, no minuto cheio */
export const INTERVALOS = [180];
// chave nova: descarta intervalos menores salvos antes
const CHAVE_INTERVALO = 'intervalo-v4';
const INTERVALO_SIMULACAO = 5;

export function EleicaoProvider({ children }: { children: ReactNode }) {
  // apuração em andamento: sempre dados oficiais (os botões de simulação foram retirados)
  const [modo, setModoState] = useState<Modo>('oficial');
  const [turno, setTurno] = useState<1 | 2>(() => ler('turno-tv-v2', 2));
  const [intervalo, setIntervaloState] = useState<number>(() => ler(CHAVE_INTERVALO, 180));
  const [eleicoes, setEleicoes] = useState<Eleicoes | null>(() =>
    eleicoesPadrao(ler('turno-tv-v2', 2)),
  );
  const [status, setStatus] = useState<Status>('carregando');
  const [erro, setErro] = useState<string | null>(null);
  const [brasil, setBrasil] = useState<Resultado | null>(null);
  const [estados, setEstados] = useState<Record<string, Resultado>>({});
  const [ultimaAtualizacao, setUltima] = useState<Date | null>(null);
  const [atualizando, setAtualizando] = useState(false);
  const [ciclo, setCiclo] = useState(0);
  const [proximaEm, setProximaEm] = useState(0);
  const chaveHist = `hist-${modo}-${eleicoes?.federal ?? ''}`;
  const [historico, setHistorico] = useState<PontoHistorico[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const segundos = modo === 'simulacao' ? INTERVALO_SIMULACAO : intervalo;

  const setModo = (m: Modo) => {
    setModoState(m);
    gravar('modo', m);
    reiniciarCores();
    if (m === 'simulacao') {
      reiniciarSimulacao();
      gravar(`hist-simulacao-${eleicoes?.federal ?? ''}`, []);
    }
  };
  const setIntervalo = (s: number) => {
    setIntervaloState(s);
    gravar(CHAVE_INTERVALO, s);
  };
  useEffect(() => {
    gravar('turno-tv-v2', turno);
    reiniciarCores();
  }, [turno]);

  // descobre os códigos das eleições do turno escolhido
  useEffect(() => {
    const ac = new AbortController();
    // começa com os códigos conhecidos; a lista oficial confirma (ou corrige) em seguida
    setEleicoes((atual) => (atual?.turno === turno ? atual : eleicoesPadrao(turno)));
    descobrirEleicoes(turno, ac.signal)
      .then((e) =>
        // mesmos códigos: mantém o objeto para não cancelar/reiniciar a busca em andamento
        setEleicoes((atual) =>
          atual && atual.federal === e.federal && atual.estadual === e.estadual && atual.segundoTurnoDisponivel === e.segundoTurnoDisponivel
            ? atual
            : e,
        ),
      )
      .catch(() => undefined);
    return () => ac.abort();
  }, [turno]);

  useEffect(() => setHistorico(ler(chaveHist, [])), [chaveHist]);

  const buscar = useCallback(
    async (cargo: CargoId, abrangencia: string, signal?: AbortSignal) => {
      if (modo === 'simulacao') return simularResultado(cargo, abrangencia);
      if (!eleicoes) throw new Error('Configuração das eleições ainda não carregada');
      return buscarResultado(eleicoes, cargo, abrangencia, signal);
    },
    [modo, eleicoes],
  );

  const atualizar = useCallback(async () => {
    if (modo === 'oficial' && !eleicoes) return;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setAtualizando(true);
    try {
      const ufs = UFS.map((u) => u.sigla.toLowerCase());
      // os estados vão em paralelo, mas o Brasil aparece assim que chega (não espera os 27)
      const porUfP = Promise.allSettled(ufs.map((uf) => buscar('presidente', uf, ac.signal)));
      const br = await buscar('presidente', 'br', ac.signal).then(
        (value) => ({ status: 'fulfilled' as const, value }),
        (reason: unknown) => ({ status: 'rejected' as const, reason }),
      );
      if (ac.signal.aborted) return;

      if (br.status === 'fulfilled') {
        setBrasil(br.value);
        // o TSE publica os arquivos zerados antes da apuração: "AO VIVO" só com seções apuradas
        setStatus(temApuracao(br.value) ? 'aovivo' : 'aguardando');
        setErro(null);
        const ponto: PontoHistorico = {
          t: Date.now(),
          pctSecoes: br.value.pctSecoes,
          pcts: Object.fromEntries(br.value.candidatos.map((c) => [c.numero, c.pct])),
        };
        if (temApuracao(br.value))
          setHistorico((h) => {
            if (h.length && h[h.length - 1].pctSecoes === ponto.pctSecoes) return h;
            const novo = [...h, ponto].slice(-500);
            gravar(chaveHist, novo);
            return novo;
          });
      } else if (br.reason instanceof NaoPublicadoError) {
        setBrasil(null);
        setStatus('aguardando');
      } else {
        setStatus((s) => (s === 'aovivo' ? s : 'erro')); // mantém os últimos dados se já havia
        setErro((br.reason as Error).message);
      }

      const porUf = await porUfP;
      if (ac.signal.aborted) return;
      const novosEstados: Record<string, Resultado> = {};
      porUf.forEach((r, i) => {
        if (r.status === 'fulfilled') novosEstados[ufs[i]] = r.value;
      });
      setEstados(novosEstados);
      setUltima(new Date());
      setCiclo((c) => c + 1);
    } finally {
      if (!ac.signal.aborted) setAtualizando(false);
    }
  }, [buscar, modo, eleicoes, chaveHist]);

  // ao trocar de modo/turno, limpa a tela e busca de novo
  useEffect(() => {
    setStatus('carregando');
    setBrasil(null);
    setEstados({});
  }, [modo, eleicoes?.federal]);

  // polling preso ao relógio: todas as telas atualizam juntas no minuto cheio (não a partir da
  // hora em que abriram); pausa com a aba oculta e atualiza ao voltar
  const atualizarRef = useRef(atualizar);
  atualizarRef.current = atualizar;
  const sempreAtivo = useRef(false);
  const setSempreAtivo = useCallback((v: boolean) => {
    sempreAtivo.current = v;
  }, []);
  useEffect(() => {
    const periodo = modo === 'simulacao' ? segundos * 1000 : PERIODO_ATUALIZACAO_MS;
    const disparar = () => {
      setProximaEm(proximaVirada(periodo));
      if (document.hidden && !sempreAtivo.current) return;
      atualizarRef.current();
    };
    disparar();
    const cancelar = aCadaVirada(disparar, periodo);
    const onVisible = () => {
      if (!document.hidden) disparar();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelar();
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [segundos, modo, eleicoes]);

  const value = useMemo<Ctx>(
    () => ({
      modo,
      setModo,
      turno,
      setTurno,
      eleicoes,
      intervalo: segundos,
      setIntervalo,
      status,
      erro,
      brasil,
      estados,
      historico,
      ultimaAtualizacao,
      proximaEm,
      atualizando,
      atualizar,
      ciclo,
      buscar,
      setSempreAtivo,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [modo, turno, eleicoes, segundos, status, erro, brasil, estados, historico, ultimaAtualizacao, proximaEm, atualizando, atualizar, ciclo, buscar, setSempreAtivo],
  );

  return <EleicaoContext.Provider value={value}>{children}</EleicaoContext.Provider>;
}

export function useEleicao() {
  const ctx = useContext(EleicaoContext);
  if (!ctx) throw new Error('useEleicao fora do EleicaoProvider');
  return ctx;
}
