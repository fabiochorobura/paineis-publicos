/**
 * Cliente da divulgação oficial de resultados do TSE.
 *
 * Os arquivos ficam em https://resultados.tse.jus.br/oficial/<ciclo>/<eleicao>/...
 *   - config/ele-c.json ...................... lista de pleitos e códigos de eleição
 *   - dados/<uf>/<uf>-c<cargo>-e<eleicao>-u.json ............... resultado por abrangência (formato 2026)
 *   - fotos/<uf>/<sqcand>.jpeg ................ foto do candidato
 *
 * O navegador consulta exclusivamente o proxy/cache do Nginx da Chorobura.
 * Antes da apuração o TSE já publica os arquivos, com os candidatos e tudo zerado.
 */
import { CARGOS, Candidato, CargoId, Eleicoes, Resultado } from './tipos';

export const TSE_BASE = 'https://resultados.tse.jus.br/oficial';
const CICLO = 'ele2026';

/** códigos conhecidos de 2026 — usados se a descoberta automática falhar */
const PADRAO: Record<1 | 2, { federal: string; estadual: string }> = {
  1: { federal: '6257', estadual: '6259' },
  2: { federal: '6258', estadual: '6260' },
};

/** códigos conhecidos, para começar a buscar sem esperar a lista de eleições do TSE */
export const eleicoesPadrao = (turno: 1 | 2): Eleicoes => ({
  ciclo: CICLO,
  turno,
  segundoTurnoDisponivel: false,
  ...PADRAO[turno],
});

export class NaoPublicadoError extends Error {
  constructor(url: string) {
    super(`Resultado ainda não publicado: ${url}`);
    this.name = 'NaoPublicadoError';
  }
}

/**
 * Todas as telas buscam exclusivamente no nosso servidor (/tse/, cache do Nginx de 3 min).
 * Assim, visitantes e TVs nunca multiplicam acessos diretos ao TSE.
 */
const TSE_ORIGEM = 'https://resultados.tse.jus.br/';
const CACHE_SERVIDOR = `${import.meta.env.BASE_URL}tse/`;
const noServidor = (url: string) =>
  url.startsWith(TSE_ORIGEM) ? CACHE_SERVIDOR + url.slice(TSE_ORIGEM.length) : url;

async function buscarTse(url: string, signal?: AbortSignal) {
  return fetch(noServidor(url), { cache: 'no-cache', signal });
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await buscarTse(url, signal);
  if (res.status === 429)
    throw new Error('TSE limitou as consultas (429); tentando de novo no próximo ciclo');
  if (res.status === 404 || res.status === 403) throw new NaoPublicadoError(url);
  if (!res.ok) throw new Error(`TSE respondeu ${res.status} em ${url}`);
  const text = await res.text();
  // O bucket devolve XML de erro em alguns casos mesmo com content-type json.
  if (text.trimStart().startsWith('<')) throw new NaoPublicadoError(url);
  return JSON.parse(text) as T;
}

interface ConfigPleitos {
  pl: { c: string; e: { cd: string; cdt2?: string; nm: string; t: string }[] }[];
}

/** Descobre os códigos das eleições federal/estadual de 2026 para o turno pedido. */
export async function descobrirEleicoes(turno: 1 | 2, signal?: AbortSignal): Promise<Eleicoes> {
  const fallback: Eleicoes = {
    ciclo: CICLO,
    turno,
    segundoTurnoDisponivel: false,
    ...PADRAO[turno],
  };
  try {
    const cfg = await getJson<ConfigPleitos>(`${TSE_BASE}/comum/config/ele-c.json`, signal);
    const eleicoes = cfg.pl.filter((p) => p.c === CICLO).flatMap((p) => p.e);
    const achar = (palavra: string, t: number) =>
      eleicoes.find((e) => e.nm.includes(palavra) && e.t === String(t))?.cd;
    const federal = achar('Federal', turno);
    const estadual = achar('Estadual', turno);
    return {
      ciclo: CICLO,
      turno,
      federal: federal ?? fallback.federal,
      estadual: estadual ?? fallback.estadual,
      segundoTurnoDisponivel: Boolean(achar('Federal', 2) || achar('Estadual', 2)),
    };
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    return fallback;
  }
}

// ---------- parsing ----------

type Raw = Record<string, unknown>;

const int = (v: unknown) => {
  const n = parseInt(String(v ?? '').replace(/\D/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
};
const pct = (v: unknown) => {
  const t = String(v ?? '').trim();
  // o TSE usa vírgula decimal ("48,43"); se vier com ponto, lê direto
  const n = parseFloat(t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t);
  return Number.isFinite(n) ? n : 0;
};
/** primeiro campo presente entre os nomes possíveis */
const pick = (o: Raw, ...keys: string[]) =>
  keys.map((k) => o[k]).find((v) => v !== undefined && v !== '');

function parseData(data: unknown, hora: unknown): Date | null {
  const m = String(data ?? '').match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!m) return null;
  const [h = '0', mi = '0', s = '0'] = String(hora ?? '').split(':');
  // horários do TSE são de Brasília (UTC-3)
  return new Date(Date.UTC(+m[3], +m[2] - 1, +m[1], +h + 3, +mi, +s));
}

interface CandidatoBruto {
  c: Raw;
  partido: string;
  coligacao: string;
}

/**
 * Formato 2026 ("-u.json"): candidatos aninhados em carg[0].agr[] (agremiação: partido isolado,
 * federação ou coligação) -> par[] (partido) -> cand[].
 * Formato antigo ("-r.json", 2022/2024): lista plana em cand[] com o partido em "cc".
 */
function extrairCandidatos(j: Raw): CandidatoBruto[] {
  const carg = (j.carg as Raw[] | undefined)?.[0];
  if (carg) {
    return ((carg.agr as Raw[]) ?? []).flatMap((agr) =>
      ((agr.par as Raw[]) ?? []).flatMap((par) =>
        ((par.cand as Raw[]) ?? []).map((c) => ({
          c,
          partido: String(par.sg ?? agr.com ?? ''),
          coligacao: String(agr.tp === 'i' ? (par.sg ?? '') : (agr.nm ?? agr.com ?? '')),
        })),
      ),
    );
  }
  return ((j.cand as Raw[]) ?? []).map((c) => {
    const cc = String(c.cc ?? '');
    return { c, partido: cc.split(' - ')[0].trim() || cc, coligacao: cc };
  });
}

function parseCandidato(
  { c, partido, coligacao }: CandidatoBruto,
  fotoBase: string,
): Candidato & { seq: number } {
  const sqcand = String(c.sqcand ?? '');
  const vices = c.vs as Raw[] | undefined;
  return {
    numero: String(c.n ?? sqcand),
    sqcand,
    // nmu = nome de urna (como aparece na urna); nm = nome completo
    nome: String(c.nmu || c.nm || '—'),
    partido,
    coligacao,
    vice: String(vices?.[0]?.nmu ?? c.nv ?? ''),
    votos: int(c.vap),
    pct: pct(c.pvap),
    eleito: c.e === 's' || c.e === 'S',
    situacao: String(c.st ?? ''),
    valido: !c.dvt || String(c.dvt).toLowerCase().startsWith('v'),
    // a foto também passa pelo nosso servidor: o navegador não fala direto com o TSE
    fotoUrl: sqcand ? noServidor(`${fotoBase}/${sqcand}.jpeg`) : null,
    seq: int(c.seq),
  };
}

export function parseResultado(
  j: Raw,
  cargo: CargoId,
  abrangencia: string,
  fotoBase: string,
): Resultado {
  const candidatos = extrairCandidatos(j)
    .map((b) => parseCandidato(b, fotoBase))
    // antes da apuração todos têm 0 votos: mantém a ordem oficial do TSE (seq)
    .sort((a, b) => b.votos - a.votos || a.seq - b.seq)
    .map(({ seq: _seq, ...c }) => c);
  const somaValidos = candidatos.filter((c) => c.valido).reduce((s, c) => s + c.votos, 0);

  // 2026 agrupa os totais em s (seções), e (eleitorado) e v (votos); o formato antigo era plano
  const s = (typeof j.s === 'object' && j.s) || j;
  const e = (typeof j.e === 'object' && j.e) || j;
  const v = (typeof j.v === 'object' && j.v) || j;
  const S = s as Raw;
  const E = e as Raw;
  const V = v as Raw;

  const comparecimento = int(pick(E, 'c') ?? pick(V, 'tv'));
  const validos = int(pick(V, 'vv', 'vvc', 'vnom')) || somaValidos;
  const brancos = int(V.vb);
  const nulos = int(pick(V, 'tvn', 'vn'));
  const porc = (n: number) => (comparecimento ? (n / comparecimento) * 100 : 0);
  const carg = (j.carg as Raw[] | undefined)?.[0];

  return {
    abrangencia,
    cargo,
    atualizadoEm: parseData(pick(j, 'dt', 'dg'), pick(j, 'ht', 'hg')),
    secoesTotal: int(pick(S, 'ts', 's')),
    secoesTotalizadas: int(S.st),
    pctSecoes: pct(S.pst),
    eleitorado: int(pick(E, 'te', 'e')),
    comparecimento,
    pctComparecimento: pct(E.pc),
    abstencao: int(E.a),
    pctAbstencao: pct(E.pa),
    brancos,
    pctBrancos: V.pvb !== undefined ? pct(V.pvb) : porc(brancos),
    nulos,
    pctNulos: V.ptvn !== undefined ? pct(V.ptvn) : V.pvn !== undefined ? pct(V.pvn) : porc(nulos),
    validos,
    pctValidos:
      V.pvv !== undefined ? pct(V.pvv) : V.pvvc !== undefined ? pct(V.pvvc) : porc(validos),
    vagas: carg?.nv ? int(carg.nv) : null,
    candidatos,
    simulado: false,
  };
}

/** a apuração começou nesta abrangência? (antes disso o TSE publica os arquivos zerados) */
export const temApuracao = (r: Resultado) =>
  r.secoesTotalizadas > 0 || r.candidatos.some((c) => c.votos > 0);

/** resultados que não mudam mais (totalização encerrada): não voltam a ser buscados */
const finalizados = new Map<string, Resultado>();

export async function buscarResultado(
  eleicoes: Eleicoes,
  cargo: CargoId,
  abrangencia: string,
  signal?: AbortSignal,
  /** pasta da UF quando a abrangência é um município (ex.: 'zz' para 'zz29254') */
  diretorio?: string,
): Promise<Resultado> {
  const info = CARGOS[cargo];
  const abr = abrangencia.toLowerCase();
  const ele = info.esfera === 'federal' ? eleicoes.federal : eleicoes.estadual;
  // no DF o cargo 7 (dep. estadual) se chama deputado distrital (cargo 8)
  const codigo = cargo === 'depEstadual' && abr === 'df' ? 8 : info.codigo;
  const c = String(codigo).padStart(4, '0');
  const e = ele.padStart(6, '0');
  const base = `${TSE_BASE}/${eleicoes.ciclo}/${ele}`;
  // mesmo arquivo "unificado" que o app oficial do TSE usa em 2026
  const url = `${base}/dados/${diretorio ?? abr}/${abr}-c${c}-e${e}-u.json`;
  const pronto = finalizados.get(url);
  if (pronto) return pronto;
  const raw = await getJson<Raw>(url, signal);
  // fotos de cargos federais (Presidente) ficam sempre em fotos/br, mesmo no resultado por UF
  const fotos = info.esfera === 'federal' ? `${base}/fotos/br` : `${base}/fotos/${abr}`;
  const r = parseResultado(raw, cargo, abr, fotos);
  // totalização encerrada (tf = "s"): o arquivo não muda mais, para de buscar no TSE.
  // Presidente fora do total do Brasil fica com tf = "n" até o fim nacional, mas com 100%
  // das seções os números daquele estado/cidade já não mudam.
  if (raw.tf === 's' || (cargo === 'presidente' && abr !== 'br' && r.pctSecoes >= 100)) finalizados.set(url, r);
  return r;
}
