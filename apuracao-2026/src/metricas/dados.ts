/**
 * Boletins de urna processados neste PC (metricas/processar_boletins.py e analisar_boletins.py).
 *
 * O dev/preview do Vite serve a pasta ratrador/.cache/eleicoes-metricas em /metricas-dados/:
 *   t<turno>/meta.json     candidatos, UFs, municípios e o mapa das colunas
 *   t<turno>/secoes.bin    uma posição por seção, na ordem em que o boletim chegou à totalização
 *   t<turno>/analise.json  seções improváveis e padrões (calculados com todas as seções juntas)
 */
import { useEffect, useState } from 'react';

export type Turno = 1 | 2;

export interface CandidatoMeta {
  coluna: string;
  numero: string;
  nome: string;
  partido: string;
  votos: number;
}

export interface Meta {
  turno: Turno;
  dia: string;
  geradoEm: string;
  fonte: string;
  secoes: number;
  colunas: { nome: string; tipo: 'i32' | 'u16' | 'u8'; deslocamento: number }[];
  candidatos: CandidatoMeta[];
  ufs: string[];
  municipios: { uf: string; cd: string; nome: string }[];
}

export interface Tabela {
  meta: Meta;
  n: number;
  /** segundos desde 00:00 do dia da eleição (Brasília) em que o boletim chegou */
  rec: Int32Array;
  mun: Uint16Array;
  zona: Uint16Array;
  secao: Uint16Array;
  local: Uint16Array;
  aptos: Uint16Array;
  comp: Uint16Array;
  br: Uint16Array;
  nu: Uint16Array;
  uf: Uint8Array;
  agreg: Uint8Array;
  /** votos por candidato, na ordem de meta.candidatos (mais votado primeiro) */
  votos: Uint16Array[];
}

export interface PontoExcesso {
  limite: number;
  observadas: number;
  esperadas: number;
}

export interface SecaoRara {
  /** posição da seção em secoes.bin */
  i: number;
  k: number;
  n: number;
  /** proporção esperada pelas vizinhas */
  p: number;
  z: number;
  /** log10 da chance */
  l10p: number;
  vizinhas: number;
  posicao: number;
  /** virada: posição no 1º turno e o resultado lá */
  j?: number;
  k1?: number;
  n1?: number;
}

export type NivelVizinhanca = 'local' | 'zona' | 'municipio';

export interface NivelRaro {
  testadas: number;
  alfa?: number;
  beta?: number;
  gl?: number | null;
  excesso: PontoExcesso[];
  secoes: SecaoRara[];
}

export interface TesteRaro {
  testadas: number;
  forma: string;
  calibracao: number;
  excesso: PontoExcesso[];
  niveis: Record<NivelVizinhanca, NivelRaro>;
}

export interface TesteDigito {
  minimo: number;
  total: number;
  contagem: number[];
  esperado: number[];
  referencia: number[];
  qui2: number;
  p: number;
}

export interface PadraoProporcao {
  secoes: number;
  histograma: number[];
  histogramaAcaso: number[];
  inteiros: { observados: number; esperados: number; desvio: number };
  empates: { observados: number; esperados: number };
}

export type TesteRaroId = 'votos' | 'comparecimento' | 'virada';

export interface Analise {
  turno: Turno;
  geradoEm: string;
  minimoSecao: number;
  minimoPadrao: number;
  raros: Partial<Record<TesteRaroId, TesteRaro>>;
  padroes: {
    ultimoDigito: Record<'c0' | 'c1', TesteDigito | null>;
    segundoDigito: Record<'c0' | 'c1', TesteDigito | null>;
    proporcao: PadraoProporcao;
    comparecimento: PadraoProporcao;
    identicos: { secoes: number; grupos: number; secoesRepetidas: number; lista: number[][] };
    impressaoDigital: Record<'c0' | 'c1', [number, number, number][]>;
  };
}

export interface DadosTurno {
  tabela: Tabela;
  analise: Analise | null;
}

const BASE = `${import.meta.env.BASE_URL}metricas-dados`;

export class DadosAusentesError extends Error {}

async function buscar(url: string) {
  const r = await fetch(url, { cache: 'no-cache' });
  // sem o arquivo, o Vite devolve o index.html (200, text/html)
  if (!r.ok || (r.headers.get('content-type') ?? '').includes('text/html')) throw new DadosAusentesError(url);
  return r;
}

function montar(meta: Meta, bruto: ArrayBuffer): Tabela {
  const n = meta.secoes;
  const col = (nome: string) => {
    const c = meta.colunas.find((x) => x.nome === nome);
    if (!c) throw new Error(`coluna ${nome} ausente em meta.json`);
    if (c.tipo === 'i32') return new Int32Array(bruto, c.deslocamento, n);
    if (c.tipo === 'u16') return new Uint16Array(bruto, c.deslocamento, n);
    return new Uint8Array(bruto, c.deslocamento, n);
  };
  return {
    meta,
    n,
    rec: col('rec') as Int32Array,
    mun: col('mun') as Uint16Array,
    zona: col('zona') as Uint16Array,
    secao: col('secao') as Uint16Array,
    local: col('local') as Uint16Array,
    aptos: col('aptos') as Uint16Array,
    comp: col('comp') as Uint16Array,
    br: col('br') as Uint16Array,
    nu: col('nu') as Uint16Array,
    uf: col('uf') as Uint8Array,
    agreg: col('agreg') as Uint8Array,
    votos: meta.candidatos.map((c) => col(c.coluna) as Uint16Array),
  };
}

const cache = new Map<Turno, Promise<DadosTurno>>();

export function carregarTurno(turno: Turno): Promise<DadosTurno> {
  let p = cache.get(turno);
  if (!p) {
    p = (async () => {
      const [meta, bruto] = await Promise.all([
        buscar(`${BASE}/t${turno}/meta.json`).then((r) => r.json() as Promise<Meta>),
        buscar(`${BASE}/t${turno}/secoes.bin`).then((r) => r.arrayBuffer()),
      ]);
      const analise = await buscar(`${BASE}/t${turno}/analise.json`)
        .then((r) => r.json() as Promise<Analise>)
        .catch(() => null);
      return { tabela: montar(meta, bruto), analise };
    })();
    p.catch(() => cache.delete(turno));
    cache.set(turno, p);
  }
  return p;
}

export function useDadosTurno(turno: Turno) {
  const [estado, setEstado] = useState<{ turno: Turno; dados?: DadosTurno; erro?: Error }>({ turno });
  useEffect(() => {
    let vivo = true;
    carregarTurno(turno).then(
      (dados) => vivo && setEstado({ turno, dados }),
      (erro: Error) => vivo && setEstado({ turno, erro }),
    );
    return () => {
      vivo = false;
    };
  }, [turno]);
  // enquanto troca de turno, segura o anterior na tela (sem piscar vazio)
  return estado;
}
