/**
 * Gerador de dados FICTÍCIOS para testar o painel antes da divulgação oficial.
 * Nomes, partidos e números são inventados e não representam candidatos reais.
 */
import { UF_POR_SIGLA, UFS, Regiao } from '../data/ufs';
import { CARGOS, Candidato, CargoId, Resultado } from './tipos';

const DURACAO_MS = 6 * 60 * 1000; // apuração simulada completa em ~6 min
let inicio = Date.now();

export function reiniciarSimulacao() {
  inicio = Date.now();
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function rng(seed: string) {
  let a = hash(seed);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NOMES = ['Helena', 'Rafael', 'Marina', 'Otávio', 'Beatriz', 'Caio', 'Lívia', 'Renato', 'Sofia', 'Diego', 'Clara', 'Tiago', 'Luana', 'Bruno', 'Alice', 'Murilo', 'Isadora', 'Vicente', 'Joana', 'Heitor'];
const SOBRENOMES = ['Duarte', 'Moreira', 'Teixeira', 'Albuquerque', 'Campos', 'Siqueira', 'Pacheco', 'Lacerda', 'Bastos', 'Fontes', 'Rezende', 'Valadares', 'Prado', 'Queiroz', 'Barreto', 'Nogueira'];
const PARTIDOS = ['PXA', 'PXB', 'PXC', 'PXD', 'PXE', 'PXF', 'PXG', 'PXH', 'PXI', 'PXJ'];

interface Base {
  numero: string;
  nome: string;
  partido: string;
  peso: number;
}

/** Presidência: base nacional + viés regional, para o mapa ter história. */
const PRESIDENCIAVEIS: (Base & { vies: Partial<Record<Regiao, number>> })[] = [
  { numero: '41', nome: 'Helena Duarte', partido: 'PXA', peso: 36, vies: { NE: 1.45, N: 1.15, S: 0.7, CO: 0.75 } },
  { numero: '52', nome: 'Rafael Moreira', partido: 'PXB', peso: 33, vies: { NE: 0.6, S: 1.35, CO: 1.3, N: 1.05 } },
  { numero: '63', nome: 'Marina Teixeira', partido: 'PXC', peso: 13, vies: { SE: 1.3 } },
  { numero: '74', nome: 'Otávio Campos', partido: 'PXD', peso: 8, vies: { S: 1.2 } },
  { numero: '85', nome: 'Beatriz Lacerda', partido: 'PXE', peso: 5, vies: {} },
  { numero: '96', nome: 'Caio Bastos', partido: 'PXF', peso: 3, vies: {} },
  { numero: '37', nome: 'Lívia Fontes', partido: 'PXG', peso: 2, vies: {} },
];

const VAGAS_FEDERAIS: Record<string, number> = { SP: 70, MG: 53, RJ: 46, BA: 39, RS: 31, PR: 30, PE: 25, CE: 22, MA: 18, GO: 17, PA: 17, SC: 16, PB: 12, ES: 10, PI: 10, AL: 9 };

export function vagas(cargo: CargoId, uf: string) {
  const fed = VAGAS_FEDERAIS[uf.toUpperCase()] ?? 8;
  if (cargo === 'depFederal') return fed;
  if (cargo === 'depEstadual') return fed <= 12 ? fed * 3 : 36 + (fed - 12);
  if (cargo === 'senador') return 2;
  return 1;
}

function candidatosBase(cargo: CargoId, uf: string): Base[] {
  const r = rng(`${cargo}-${uf}`);
  const pickNome = () => `${NOMES[Math.floor(r() * NOMES.length)]} ${SOBRENOMES[Math.floor(r() * SOBRENOMES.length)]}`;
  const usados = new Set<string>();
  const novoNumero = (digitos: number) => {
    let n = '';
    do n = String(Math.floor(10 ** (digitos - 1) + r() * 9 * 10 ** (digitos - 1)));
    while (usados.has(n));
    usados.add(n);
    return n;
  };
  if (cargo === 'governador' || cargo === 'senador') {
    const qtd = cargo === 'governador' ? 5 : 6;
    return Array.from({ length: qtd }, (_, i) => ({
      numero: cargo === 'governador' ? novoNumero(2) : novoNumero(3),
      nome: pickNome(),
      partido: PARTIDOS[Math.floor(r() * PARTIDOS.length)],
      peso: i === 0 ? 28 + r() * 12 : i === 1 ? 20 + r() * 16 : Math.max(1, 18 * r() * (1 - i * 0.15)),
    }));
  }
  const qtd = Math.min(160, vagas(cargo, uf) * 3);
  const digitos = cargo === 'depFederal' ? 4 : 5;
  return Array.from({ length: qtd }, () => ({
    numero: novoNumero(digitos),
    nome: pickNome(),
    partido: PARTIDOS[Math.floor(r() ** 1.6 * PARTIDOS.length)],
    peso: r() ** 3 * 100 + 0.3,
  }));
}

function progresso(abr: string) {
  const elapsed = Date.now() - inicio;
  // cada UF tem um ritmo diferente; o Brasil é a média ponderada
  const ritmo = 0.75 + rng(`ritmo-${abr}`)() * 0.55;
  return Math.min(1, (elapsed / DURACAO_MS) * ritmo + 0.02);
}

function gerar(cargo: CargoId, abr: string, bases: Base[], eleitorado: number, p: number): Resultado {
  const r = rng(`${cargo}-${abr}-${Math.floor(p * 200)}`);
  // ruído que diminui conforme a apuração avança (urnas iniciais são enviesadas)
  const ruido = (1 - p) * 0.25;
  const pesos = bases.map((b) => b.peso * (1 + (r() - 0.5) * ruido));
  const soma = pesos.reduce((s, x) => s + x, 0);
  const comparecimento = Math.round(eleitorado * 0.79 * p);
  const brancos = Math.round(comparecimento * 0.02);
  const nulos = Math.round(comparecimento * 0.033);
  const validos = comparecimento - brancos - nulos;
  const qtdVagas = vagas(cargo, abr);

  let candidatos: Candidato[] = bases
    .map((b, i) => ({
      numero: b.numero,
      sqcand: '',
      nome: b.nome,
      partido: b.partido,
      coligacao: b.partido,
      vice: '',
      votos: Math.round((validos * pesos[i]) / soma),
      pct: (pesos[i] / soma) * 100,
      eleito: false,
      situacao: '',
      valido: true,
      fotoUrl: null,
    }))
    .sort((a, b) => b.votos - a.votos);

  if (p >= 1) {
    const majoritario = CARGOS[cargo].majoritario && cargo !== 'senador';
    candidatos = candidatos.map((c, i) => {
      if (majoritario) {
        if (candidatos[0].pct > 50) return { ...c, eleito: i === 0, situacao: i === 0 ? 'Eleito' : 'Não eleito' };
        return { ...c, situacao: i < 2 ? '2º turno' : 'Não eleito' };
      }
      return { ...c, eleito: i < qtdVagas, situacao: i < qtdVagas ? 'Eleito' : 'Suplente' };
    });
  }

  const secoesTotal = Math.round(eleitorado / 330);
  return {
    abrangencia: abr,
    cargo,
    atualizadoEm: new Date(),
    secoesTotal,
    secoesTotalizadas: Math.round(secoesTotal * p),
    pctSecoes: p * 100,
    eleitorado,
    comparecimento,
    pctComparecimento: p ? 79 : 0,
    abstencao: Math.round(eleitorado * 0.21 * p),
    pctAbstencao: p ? 21 : 0,
    brancos,
    pctBrancos: p ? 2 : 0,
    nulos,
    pctNulos: p ? 3.3 : 0,
    validos,
    pctValidos: p ? 94.7 : 0,
    vagas: qtdVagas,
    candidatos,
    simulado: true,
  };
}

function presidenteUF(uf: string): Resultado {
  const info = UF_POR_SIGLA[uf.toUpperCase()];
  const r = rng(`vies-${uf}`);
  const bases = PRESIDENCIAVEIS.map((c) => ({ ...c, peso: c.peso * (c.vies[info.regiao] ?? 1) * (0.85 + r() * 0.3) }));
  return gerar('presidente', uf, bases, info.eleitoradoMi * 1e6, progresso(uf));
}

function presidenteBR(): Resultado {
  const ufs = UFS.map((u) => presidenteUF(u.sigla.toLowerCase()));
  const votos = new Map<string, number>();
  ufs.forEach((r) => r.candidatos.forEach((c) => votos.set(c.numero, (votos.get(c.numero) ?? 0) + c.votos)));
  const eleitorado = UFS.reduce((s, u) => s + u.eleitoradoMi * 1e6, 0);
  const sec = ufs.reduce((s, r) => s + r.secoesTotalizadas, 0);
  const secTot = ufs.reduce((s, r) => s + r.secoesTotal, 0);
  const p = sec / secTot;
  const bases = PRESIDENCIAVEIS.map((c) => ({ ...c, peso: votos.get(c.numero) ?? 0 }));
  const res = gerar('presidente', 'br', bases, eleitorado, p >= 0.9995 ? 1 : p);
  return { ...res, secoesTotal: secTot, secoesTotalizadas: sec };
}

export function simularResultado(cargo: CargoId, abrangencia: string): Resultado {
  const abr = abrangencia.toLowerCase();
  if (cargo === 'presidente') return abr === 'br' ? presidenteBR() : presidenteUF(abr);
  const info = UF_POR_SIGLA[abr.toUpperCase()];
  return gerar(cargo, abr, candidatosBase(cargo, abr), info.eleitoradoMi * 1e6, progresso(abr));
}
