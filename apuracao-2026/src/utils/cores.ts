import { useTheme } from '@mui/material/styles';
import { Candidato } from '../api/tipos';

/**
 * Paleta categórica validada para daltonismo (ordem fixa — a ordem é o mecanismo de
 * segurança, não estética). Uma cor por candidato; nunca reciclada.
 */
const CLARO = [
  '#2a78d6',
  '#eb6834',
  '#1baf7a',
  '#eda100',
  '#e87ba4',
  '#008300',
  '#4a3aa7',
  '#e34948',
];
const ESCURO = [
  '#3987e5',
  '#d95926',
  '#199e70',
  '#c98500',
  '#d55181',
  '#008300',
  '#9085e9',
  '#e66767',
];
export const COR_OUTROS = { light: '#a3a29b', dark: '#6b6a64' };
export const MAX_SERIES = 7; // 7 candidatos + "Outros"

/**
 * A cor segue o candidato, não a posição: o primeiro a aparecer em cada escopo
 * fica com o slot 1 para sempre, mesmo que troque de posição na apuração.
 */
const registros = new Map<string, Map<string, number>>();

/**
 * Cor de referência de cada partido (identidade do partido, ajustada para os vizinhos no mapa
 * não se confundirem). Partido fora da tabela usa a paleta por ordem de aparição.
 */
const CORES_PARTIDOS: Record<string, string> = {
  PT: '#D32F2F',
  PCDOB: '#8E0000',
  PV: '#43A047',
  PSOL: '#AD1457',
  REDE: '#26A69A',
  PSB: '#FB8C00',
  PDT: '#E64A19',
  PL: '#0D2C6C',
  PP: '#5E35B1',
  'UNIÃO': '#039BE5',
  REPUBLICANOS: '#00695C',
  MDB: '#7CB342',
  PSD: '#F9A825',
  PSDB: '#1E88E5',
  NOVO: '#FF6D00',
  PODE: '#00BCD4',
  AVANTE: '#EC407A',
  SOLIDARIEDADE: '#FFAB40',
  PRD: '#6D4C41',
  CIDADANIA: '#F06292',
  AGIR: '#9E9D24',
  MOBILIZA: '#78909C',
  DC: '#A1887F',
  DEMOCRATA: '#8D6E63',
  'MISSÃO': '#7E57C2',
  PRTB: '#33691E',
  PMB: '#F48FB1',
  PCO: '#B71C1C',
  PSTU: '#C62828',
  UP: '#D50000',
  PCB: '#880E4F',
};

/** "PC do B" -> "PCDOB": a chave da tabela ignora espaços e maiúsculas */
export function corDoPartido(sigla: string): string | undefined {
  return CORES_PARTIDOS[sigla.toUpperCase().replace(/\s+/g, '')];
}

/** troca de fonte (oficial/simulação) ou de turno: os candidatos mudam, as cores recomeçam */
export function reiniciarCores() {
  registros.clear();
}

function slot(escopo: string, numero: string, ordem: string[]) {
  let reg = registros.get(escopo);
  if (!reg) {
    reg = new Map();
    registros.set(escopo, reg);
  }
  if (!reg.has(numero)) {
    // registra todos os que ainda não têm cor na ordem do ranking atual
    for (const n of ordem) if (!reg.has(n) && reg.size < MAX_SERIES) reg.set(n, reg.size);
  }
  return reg.get(numero);
}

export function useCores() {
  const theme = useTheme();
  const escuro = theme.palette.mode === 'dark';
  const paleta = escuro ? ESCURO : CLARO;
  const outros = escuro ? COR_OUTROS.dark : COR_OUTROS.light;

  return {
    outros,
    cor(escopo: string, c: Candidato, todos: Candidato[]) {
      // antes do primeiro voto a ordem é só a do TSE: distribuir as cores agora deixaria
      // cinza para sempre quem estivesse do 8º lugar em diante nessa lista
      if (!todos.some((x) => x.votos > 0) && c.votos <= 0) return outros;
      // cor fixa do partido: a mesma em todo o site e na TV
      const doPartido = corDoPartido(c.partido);
      if (doPartido) return doPartido;
      const s = slot(
        escopo,
        c.numero,
        todos.map((x) => x.numero),
      );
      return s === undefined ? outros : paleta[s];
    },
    /** cor por uma chave qualquer (ex.: sigla do partido), registrada na ordem dada */
    corChave(escopo: string, chave: string, ordem: string[]) {
      const doPartido = corDoPartido(chave);
      if (doPartido) return doPartido;
      const s = slot(escopo, chave, ordem);
      return s === undefined ? outros : paleta[s];
    },
  };
}

/** Separa top N candidatos + soma do restante em "Outros". */
export function agruparOutros(candidatos: Candidato[], max = MAX_SERIES) {
  const top = candidatos.slice(0, max);
  const resto = candidatos.slice(max);
  return {
    top,
    outros: resto.length
      ? {
          votos: resto.reduce((s, c) => s + c.votos, 0),
          pct: resto.reduce((s, c) => s + c.pct, 0),
          qtd: resto.length,
        }
      : null,
  };
}
