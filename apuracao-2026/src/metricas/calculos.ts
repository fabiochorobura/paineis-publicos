/**
 * Cálculos da evolução da apuração, feitos no navegador sobre a tabela de seções (já ordenada pela
 * hora de chegada do boletim). Cada função percorre as seções do recorte uma ou duas vezes.
 *
 * "Esperado pela geografia": a cada momento, quanto o candidato A teria se cada seção já chegada
 * votasse exatamente como o seu município (ou UF) votou no fim. Se a curva real acompanha essa,
 * a forma da apuração (quem liderou, quando virou) se explica pela ordem em que os lugares chegaram.
 * A faixa do acaso é a variação que sobraria se, dentro de cada município, as seções chegassem em
 * ordem aleatória (amostragem sem reposição, ±3 desvios).
 */
import { UF_POR_SIGLA, REGIOES, ORDEM_REGIOES, Regiao } from '../data/ufs';
import type { Meta, Tabela } from './dados';

export type Abrangencia = string; // 'BR' | 'R:<região>' | 'ZZ' | sigla da UF
export type NivelEsperado = 'municipio' | 'uf';

export function opcoesAbrangencia(meta: Meta) {
  const ufs = meta.ufs.filter((u) => u !== 'ZZ').sort((a, b) => (UF_POR_SIGLA[a]?.nome ?? a).localeCompare(UF_POR_SIGLA[b]?.nome ?? b, 'pt-BR'));
  return [
    { valor: 'BR', rotulo: 'Brasil e exterior' },
    ...ORDEM_REGIOES.map((r) => ({ valor: `R:${r}`, rotulo: `Região ${REGIOES[r]}` })),
    ...(meta.ufs.includes('ZZ') ? [{ valor: 'ZZ', rotulo: 'Exterior' }] : []),
    ...ufs.map((u) => ({ valor: u, rotulo: UF_POR_SIGLA[u]?.nome ?? u })),
  ];
}

export function regiaoDaUf(sigla: string): Regiao | 'EX' {
  return UF_POR_SIGLA[sigla]?.regiao ?? 'EX';
}

/** 1 para cada UF (índice de meta.ufs) dentro da abrangência */
export function mascaraUfs(meta: Meta, abr: Abrangencia): Uint8Array {
  return Uint8Array.from(meta.ufs, (u) => {
    if (abr === 'BR') return 1;
    if (abr.startsWith('R:')) return regiaoDaUf(u) === abr.slice(2) ? 1 : 0;
    return u === abr ? 1 : 0;
  });
}

export function indicesDoRecorte(t: Tabela, mascara: Uint8Array): Uint32Array {
  let total = 0;
  for (let i = 0; i < t.n; i++) total += mascara[t.uf[i]];
  const idx = new Uint32Array(total);
  for (let i = 0, j = 0; i < t.n; i++) if (mascara[t.uf[i]]) idx[j++] = i;
  return idx;
}

interface Grupos {
  chave: (i: number) => number;
  /** proporção final de A em A+B no grupo */
  razao: Float64Array;
  /** variância de e = A - razao·(A+B) por seção do grupo (com divisor N-1) */
  variancia: Float64Array;
  secoes: Uint32Array;
}

function agrupar(t: Tabela, idx: Uint32Array, a: number, b: number, nivel: NivelEsperado): Grupos {
  const tam = nivel === 'municipio' ? t.meta.municipios.length : t.meta.ufs.length;
  const chaveArr = nivel === 'municipio' ? t.mun : t.uf;
  const chave = (i: number) => chaveArr[i];
  const va = t.votos[a];
  const vb = t.votos[b];
  const somaA = new Float64Array(tam);
  const somaT = new Float64Array(tam);
  const secoes = new Uint32Array(tam);
  for (const i of idx) {
    const g = chave(i);
    somaA[g] += va[i];
    somaT[g] += va[i] + vb[i];
    secoes[g]++;
  }
  const razao = new Float64Array(tam);
  for (let g = 0; g < tam; g++) razao[g] = somaT[g] > 0 ? somaA[g] / somaT[g] : 0;
  const quad = new Float64Array(tam);
  for (const i of idx) {
    const g = chave(i);
    const e = va[i] - razao[g] * (va[i] + vb[i]);
    quad[g] += e * e;
  }
  const variancia = new Float64Array(tam);
  for (let g = 0; g < tam; g++) variancia[g] = secoes[g] > 1 ? quad[g] / (secoes[g] - 1) : 0;
  return { chave, razao, variancia, secoes };
}

export interface Evolucao {
  n: number;
  ordem: Float64Array;
  hora: Float64Array;
  pctSecoes: Float64Array;
  pctA: Float64Array;
  pctB: Float64Array;
  /** % de A em A+B */
  razao: Float64Array;
  esperado: Float64Array;
  difVotos: Float64Array;
  /** real − esperado, em pontos percentuais de A+B */
  residuo: Float64Array;
  bandaSup: Float64Array;
  bandaInf: Float64Array;
  viradas: number;
  ultimaVirada: number | null;
  maiorA: { valor: number; indice: number };
  maiorB: { valor: number; indice: number };
  /** fração dos pontos (depois de 1% das seções) com o resíduo fora da faixa do acaso */
  foraDaFaixa: number;
  maiorResiduo: { valor: number; indice: number };
  /** por seção, na ordem de chegada: votos de A, de A+B e o A esperado pela geografia */
  votosA: Float64Array;
  votosT: Float64Array;
  esperadoA: Float64Array;
}

/** a partir daqui as contagens ignoram o começo, quando poucas seções decidem tudo */
export const INICIO_ESTAVEL = 0.01;

export function calcularEvolucao(t: Tabela, idx: Uint32Array, a: number, b: number, nivel: NivelEsperado): Evolucao {
  const n = idx.length;
  const g = agrupar(t, idx, a, b, nivel);
  const va = t.votos[a];
  const vb = t.votos[b];
  const ordem = new Float64Array(n);
  const hora = new Float64Array(n);
  const pctSecoes = new Float64Array(n);
  const pctA = new Float64Array(n);
  const pctB = new Float64Array(n);
  const razao = new Float64Array(n);
  const esperado = new Float64Array(n);
  const difVotos = new Float64Array(n);
  const residuo = new Float64Array(n);
  const votosA = new Float64Array(n);
  const votosT = new Float64Array(n);
  const esperadoA = new Float64Array(n);
  const bandaSup = new Float64Array(n);
  const bandaInf = new Float64Array(n);
  const chegadas = new Uint32Array(g.secoes.length);
  let ca = 0;
  let cb = 0;
  let cv = 0;
  let ce = 0;
  let variancia = 0;
  let viradas = 0;
  let ultimaVirada: number | null = null;
  let sinal = 0;
  let fora = 0;
  const maiorA = { valor: -Infinity, indice: 0 };
  const maiorB = { valor: -Infinity, indice: 0 };
  const maiorResiduo = { valor: 0, indice: 0 };
  const inicio = Math.floor(n * INICIO_ESTAVEL);
  for (let j = 0; j < n; j++) {
    const i = idx[j];
    const k = g.chave(i);
    const ti = va[i] + vb[i];
    ca += va[i];
    cb += vb[i];
    for (const v of t.votos) cv += v[i];
    ce += g.razao[k] * ti;
    votosA[j] = va[i];
    votosT[j] = ti;
    esperadoA[j] = g.razao[k] * ti;
    // sem reposição dentro do grupo: Var(soma de e) = c·(N−c)/(N−1)·σ², somada incrementalmente
    const N = g.secoes[k];
    if (N > 1) variancia += ((N - 2 * chegadas[k] - 1) / N) * g.variancia[k];
    chegadas[k]++;
    const ct = ca + cb;
    ordem[j] = j + 1;
    hora[j] = t.rec[i];
    pctSecoes[j] = ((j + 1) * 100) / n;
    pctA[j] = cv ? (ca * 100) / cv : NaN;
    pctB[j] = cv ? (cb * 100) / cv : NaN;
    razao[j] = ct ? (ca * 100) / ct : NaN;
    esperado[j] = ct ? (ce * 100) / ct : NaN;
    difVotos[j] = ca - cb;
    residuo[j] = ct ? ((ca - ce) * 100) / ct : NaN;
    const faixa = ct ? (3 * Math.sqrt(Math.max(0, variancia)) * 100) / ct : NaN;
    bandaSup[j] = faixa;
    bandaInf[j] = -faixa;
    if (j >= inicio) {
      const s = Math.sign(ca - cb);
      if (s !== 0 && sinal !== 0 && s !== sinal) {
        viradas++;
        ultimaVirada = j;
      }
      if (s !== 0) sinal = s;
      const vantagem = pctA[j] - pctB[j];
      if (vantagem > maiorA.valor) Object.assign(maiorA, { valor: vantagem, indice: j });
      if (-vantagem > maiorB.valor) Object.assign(maiorB, { valor: -vantagem, indice: j });
      if (Math.abs(residuo[j]) > faixa) fora++;
      if (Math.abs(residuo[j]) > Math.abs(maiorResiduo.valor)) Object.assign(maiorResiduo, { valor: residuo[j], indice: j });
    } else if (ca !== cb) {
      sinal = Math.sign(ca - cb);
    }
  }
  return {
    n,
    ordem,
    hora,
    pctSecoes,
    pctA,
    pctB,
    razao,
    esperado,
    difVotos,
    residuo,
    bandaSup,
    bandaInf,
    viradas,
    ultimaVirada,
    maiorA,
    maiorB,
    foraDaFaixa: n > inicio ? fora / (n - inicio) : 0,
    maiorResiduo,
    votosA,
    votosT,
    esperadoA,
  };
}

/**
 * % de A (entre A e B) só nas últimas `janela` seções que chegaram, em cada ponto da apuração: em vez
 * do total acumulado (que quase não se mexe depois do começo), mostra o que estava chegando naquele
 * momento, com os picos e vales de cada lote.
 */
export function janelaMovel(evo: Evolucao, janela: number) {
  const n = evo.n;
  const razao = new Float64Array(n);
  const esperado = new Float64Array(n);
  let sa = 0;
  let st = 0;
  let se = 0;
  for (let j = 0; j < n; j++) {
    sa += evo.votosA[j];
    st += evo.votosT[j];
    se += evo.esperadoA[j];
    if (j >= janela) {
      sa -= evo.votosA[j - janela];
      st -= evo.votosT[j - janela];
      se -= evo.esperadoA[j - janela];
    }
    // antes de completar a primeira janela não há ponto (seria a média de poucas seções)
    razao[j] = j >= janela - 1 && st > 0 ? (sa * 100) / st : NaN;
    esperado[j] = j >= janela - 1 && st > 0 ? (se * 100) / st : NaN;
  }
  return { razao, esperado };
}

export interface Chegada {
  minuto: Float64Array;
  secoes: Float64Array;
  /** % de A em A+B entre os boletins que chegaram naquele minuto */
  loteRazao: Float64Array;
  loteEsperado: Float64Array;
  /** desvio do lote em relação ao esperado pela geografia, em desvios-padrão */
  z: Float64Array;
  porRegiao: { regiao: Regiao | 'EX'; rotulo: string; pct: Float64Array }[];
}

export function calcularChegada(t: Tabela, idx: Uint32Array, a: number, b: number, nivel: NivelEsperado): Chegada {
  if (!idx.length) {
    const vazio = new Float64Array(0);
    return { minuto: vazio, secoes: vazio, loteRazao: vazio, loteEsperado: vazio, z: vazio, porRegiao: [] };
  }
  const g = agrupar(t, idx, a, b, nivel);
  const va = t.votos[a];
  const vb = t.votos[b];
  const primeiro = Math.floor(t.rec[idx[0]] / 60);
  const ultimo = Math.floor(t.rec[idx[idx.length - 1]] / 60);
  const m = ultimo - primeiro + 1;
  const minuto = Float64Array.from({ length: m }, (_, k) => (primeiro + k) * 60);
  const secoes = new Float64Array(m);
  const somaA = new Float64Array(m);
  const somaT = new Float64Array(m);
  const somaE = new Float64Array(m);
  const somaV = new Float64Array(m);
  const regiaoUf = t.meta.ufs.map(regiaoDaUf);
  const regioes = [...new Set(Array.from(idx, (i) => regiaoUf[t.uf[i]]))];
  const ordemReg: (Regiao | 'EX')[] = [...ORDEM_REGIOES, 'EX'];
  regioes.sort((x, y) => ordemReg.indexOf(x) - ordemReg.indexOf(y));
  const totalReg = new Map(regioes.map((r) => [r, 0]));
  for (const i of idx) totalReg.set(regiaoUf[t.uf[i]], (totalReg.get(regiaoUf[t.uf[i]]) ?? 0) + 1);
  const contReg = new Map(regioes.map((r) => [r, new Float64Array(m)]));
  for (const i of idx) {
    const k = Math.floor(t.rec[i] / 60) - primeiro;
    const grp = g.chave(i);
    const ti = va[i] + vb[i];
    secoes[k]++;
    somaA[k] += va[i];
    somaT[k] += ti;
    somaE[k] += g.razao[grp] * ti;
    somaV[k] += g.variancia[grp];
    contReg.get(regiaoUf[t.uf[i]])![k]++;
  }
  const loteRazao = new Float64Array(m);
  const loteEsperado = new Float64Array(m);
  const z = new Float64Array(m);
  for (let k = 0; k < m; k++) {
    loteRazao[k] = somaT[k] ? (somaA[k] * 100) / somaT[k] : NaN;
    loteEsperado[k] = somaT[k] ? (somaE[k] * 100) / somaT[k] : NaN;
    z[k] = somaV[k] > 0 ? (somaA[k] - somaE[k]) / Math.sqrt(somaV[k]) : NaN;
  }
  const porRegiao = regioes.map((r) => {
    const c = contReg.get(r)!;
    const pct = new Float64Array(m);
    let acc = 0;
    const tot = totalReg.get(r) ?? 1;
    for (let k = 0; k < m; k++) {
      acc += c[k];
      pct[k] = (acc * 100) / tot;
    }
    return { regiao: r, rotulo: r === 'EX' ? 'Exterior' : REGIOES[r], pct };
  });
  return { minuto, secoes, loteRazao, loteEsperado, z, porRegiao };
}

/** seções do mesmo local de votação, em ordem de número */
export function secoesDoLocal(t: Tabela, i: number): number[] {
  const lista: number[] = [];
  for (let j = 0; j < t.n; j++) {
    if (t.local[j] === t.local[i] && t.mun[j] === t.mun[i] && t.zona[j] === t.zona[i]) lista.push(j);
  }
  return lista.sort((x, y) => t.secao[x] - t.secao[y]);
}

// ---------------------------------------------------------------- formatos

const nf = (casas: number) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
const inteiro = new Intl.NumberFormat('pt-BR');

export const fmtInt = (n: number) => inteiro.format(Math.round(n));
export const fmtNum = (n: number, casas = 1) => (Number.isFinite(n) ? nf(casas).format(n) : '—');
export const fmtPct = (n: number, casas = 1) => (Number.isFinite(n) ? `${nf(casas).format(n)}%` : '—');

export function fmtHora(seg: number) {
  if (!Number.isFinite(seg)) return '—';
  const dia = Math.floor(seg / 86400);
  const s = ((seg % 86400) + 86400) % 86400;
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(Math.floor(s % 60)).padStart(2, '0');
  return `${hh}:${mm}:${ss}${dia > 0 ? ` (+${dia}d)` : ''}`;
}

export const fmtHoraCurta = (seg: number) => fmtHora(seg).slice(0, 5);

/** "1 em 4,7 milhões" a partir do log10 da chance */
export function fmtChance(l10p: number) {
  const x = -l10p;
  if (x < 0.3) return 'comum';
  const v = 10 ** x;
  const escalas: [number, string, string][] = [
    [1e12, 'trilhão', 'trilhões'],
    [1e9, 'bilhão', 'bilhões'],
    [1e6, 'milhão', 'milhões'],
    [1e3, 'mil', 'mil'],
  ];
  if (x >= 15) return `1 em 10^${Math.floor(x)}`;
  for (const [base, um, varios] of escalas) {
    if (v >= base) {
      const q = v / base;
      return `1 em ${q < 10 ? nf(1).format(q) : inteiro.format(Math.round(q))} ${q < 2 ? um : varios}`;
    }
  }
  return `1 em ${inteiro.format(Math.round(v))}`;
}

const SOBRESCRITO: Record<string, string> = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };

/** 0,000031 -> "3,1 × 10⁻⁵" */
export function fmtCientifico(v: number) {
  if (!(v > 0)) return '0';
  const exp = Math.floor(Math.log10(v));
  const mant = v / 10 ** exp;
  return `${nf(1).format(mant)} × 10${String(exp).replace(/./g, (c) => SOBRESCRITO[c] ?? c)}`;
}

/** quantas seções tão raras quanto esta o acaso produziria entre as testadas */
export function fmtEsperado(testadas: number, l10p: number) {
  const e = testadas * 10 ** l10p;
  if (e >= 10) return fmtInt(e);
  if (e >= 0.01) return fmtNum(e, 2);
  return fmtCientifico(e);
}
