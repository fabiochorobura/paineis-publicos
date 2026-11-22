import { useEffect, useRef, useState } from 'react';
import { CargoId, Resultado } from '../api/tipos';
import { useEleicao } from '../context/EleicaoContext';
import { UFS } from '../data/ufs';

export type PorUF = Record<string, Resultado>;

export interface DadosTV {
  governador: PorUF;
  senador: PorUF;
  depFederal: PorUF;
  depEstadual: Resultado | null;
  /** deputados estaduais de todos os estados (letreiro: mais votado de cada UF) */
  depEstaduais: PorUF;
}

const UF_SIGLAS = UFS.map((u) => u.sigla.toLowerCase());
/** cargos estaduais mudam devagar e os arquivos de deputado são grandes: no máximo 1 rodada a cada 3 min (são 82 arquivos; evita o 429 do TSE) */
const INTERVALO_MIN_MS = 3 * 60_000;
const CONCORRENCIA = 3;

async function emLotes<T>(
  itens: string[],
  fn: (item: string) => Promise<T>,
): Promise<Record<string, T>> {
  const saida: Record<string, T> = {};
  let i = 0;
  const trabalhador = async () => {
    while (i < itens.length) {
      const item = itens[i++];
      try {
        saida[item] = await fn(item);
      } catch {
        /* 404 = ainda não publicado; mantém o restante */
      }
    }
  };
  await Promise.all(Array.from({ length: CONCORRENCIA }, trabalhador));
  return saida;
}

export function useDadosTV(ufDeputadosEstaduais: string): DadosTV {
  const { buscar, ciclo, modo, eleicoes } = useEleicao();
  const [dados, setDados] = useState<DadosTV>({
    governador: {},
    senador: {},
    depFederal: {},
    depEstadual: null,
    depEstaduais: {},
  });
  const ultima = useRef(0);
  const rodando = useRef(false);
  const geracao = useRef(0);

  // troca de fonte/turno: limpa tudo e força nova rodada
  useEffect(() => {
    setDados({ governador: {}, senador: {}, depFederal: {}, depEstadual: null, depEstaduais: {} });
    ultima.current = 0;
    rodando.current = false;
    geracao.current += 1;
  }, [modo, eleicoes?.estadual]);

  const montado = useRef(true);
  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  useEffect(() => {
    const intervaloMin = modo === 'simulacao' ? 0 : INTERVALO_MIN_MS;
    if (rodando.current || Date.now() - ultima.current < intervaloMin) return;
    if (modo === 'oficial' && !eleicoes) return;
    rodando.current = true;
    ultima.current = Date.now();
    const minhaGeracao = geracao.current;

    // a rodada não é cancelada quando o ciclo muda: pode levar mais que um ciclo
    const porCargo = (cargo: CargoId) => emLotes(UF_SIGLAS, (uf) => buscar(cargo, uf));
    (async () => {
      const governador = await porCargo('governador');
      const senador = await porCargo('senador');
      const depFederal = await porCargo('depFederal');
      const depEstaduais = await porCargo('depEstadual');
      const depEstadual =
        depEstaduais[ufDeputadosEstaduais] ??
        (await buscar('depEstadual', ufDeputadosEstaduais).catch(() => null));
      if (montado.current && minhaGeracao === geracao.current)
        setDados({ governador, senador, depFederal, depEstadual, depEstaduais });
    })().finally(() => {
      if (minhaGeracao === geracao.current) rodando.current = false;
    });
  }, [ciclo, buscar, modo, eleicoes, ufDeputadosEstaduais]);

  // trocou a UF dos deputados estaduais: busca só ela, na hora
  useEffect(() => {
    let vivo = true;
    buscar('depEstadual', ufDeputadosEstaduais)
      .then((r) => vivo && setDados((d) => ({ ...d, depEstadual: r })))
      .catch(() => vivo && setDados((d) => ({ ...d, depEstadual: null })));
    return () => {
      vivo = false;
    };
  }, [ufDeputadosEstaduais, buscar]);

  return dados;
}
