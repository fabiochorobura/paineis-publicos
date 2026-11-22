export type CargoId = 'presidente' | 'governador' | 'senador' | 'depFederal' | 'depEstadual';

export interface CargoInfo {
  id: CargoId;
  codigo: number;
  nome: string;
  /** eleição federal (presidente) ou estadual (demais) */
  esfera: 'federal' | 'estadual';
  majoritario: boolean;
}

export const CARGOS: Record<CargoId, CargoInfo> = {
  presidente: { id: 'presidente', codigo: 1, nome: 'Presidente', esfera: 'federal', majoritario: true },
  governador: { id: 'governador', codigo: 3, nome: 'Governador', esfera: 'estadual', majoritario: true },
  senador: { id: 'senador', codigo: 5, nome: 'Senador', esfera: 'estadual', majoritario: true },
  depFederal: { id: 'depFederal', codigo: 6, nome: 'Deputado Federal', esfera: 'estadual', majoritario: false },
  depEstadual: { id: 'depEstadual', codigo: 7, nome: 'Deputado Estadual', esfera: 'estadual', majoritario: false },
};

export interface Candidato {
  /** chave estável da entidade (número na urna) */
  numero: string;
  sqcand: string;
  nome: string;
  partido: string;
  coligacao: string;
  vice: string;
  votos: number;
  /** % dos votos válidos */
  pct: number;
  eleito: boolean;
  situacao: string;
  valido: boolean;
  fotoUrl: string | null;
}

export interface Resultado {
  abrangencia: string; // 'br' ou sigla da UF minúscula
  cargo: CargoId;
  atualizadoEm: Date | null;
  secoesTotal: number;
  secoesTotalizadas: number;
  pctSecoes: number;
  eleitorado: number;
  comparecimento: number;
  pctComparecimento: number;
  abstencao: number;
  pctAbstencao: number;
  brancos: number;
  pctBrancos: number;
  nulos: number;
  pctNulos: number;
  validos: number;
  pctValidos: number;
  /** número de vagas informado pelo TSE (null se não vier no arquivo) */
  vagas: number | null;
  candidatos: Candidato[];
  simulado: boolean;
}

export interface Eleicoes {
  ciclo: string;
  federal: string;
  estadual: string;
  turno: 1 | 2;
  segundoTurnoDisponivel: boolean;
}
