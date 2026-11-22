export type Regiao = 'N' | 'NE' | 'CO' | 'SE' | 'S';

export interface UF {
  sigla: string;
  nome: string;
  regiao: Regiao;
  /** posição no mapa em grade (coluna, linha) */
  col: number;
  row: number;
  /** eleitorado aproximado em milhões — usado só no modo simulação */
  eleitoradoMi: number;
}

export const REGIOES: Record<Regiao, string> = {
  N: 'Norte',
  NE: 'Nordeste',
  CO: 'Centro-Oeste',
  SE: 'Sudeste',
  S: 'Sul',
};

export const ORDEM_REGIOES: Regiao[] = ['N', 'NE', 'CO', 'SE', 'S'];

export const UFS: UF[] = [
  { sigla: 'RR', nome: 'Roraima', regiao: 'N', col: 1, row: 0, eleitoradoMi: 0.37 },
  { sigla: 'AP', nome: 'Amapá', regiao: 'N', col: 3, row: 0, eleitoradoMi: 0.55 },
  { sigla: 'AM', nome: 'Amazonas', regiao: 'N', col: 1, row: 1, eleitoradoMi: 2.63 },
  { sigla: 'PA', nome: 'Pará', regiao: 'N', col: 3, row: 1, eleitoradoMi: 6.08 },
  { sigla: 'MA', nome: 'Maranhão', regiao: 'NE', col: 4, row: 1, eleitoradoMi: 5.03 },
  { sigla: 'CE', nome: 'Ceará', regiao: 'NE', col: 5, row: 1, eleitoradoMi: 6.82 },
  { sigla: 'RN', nome: 'Rio Grande do Norte', regiao: 'NE', col: 6, row: 1, eleitoradoMi: 2.55 },
  { sigla: 'AC', nome: 'Acre', regiao: 'N', col: 0, row: 2, eleitoradoMi: 0.59 },
  { sigla: 'RO', nome: 'Rondônia', regiao: 'N', col: 1, row: 2, eleitoradoMi: 1.24 },
  { sigla: 'MT', nome: 'Mato Grosso', regiao: 'CO', col: 2, row: 2, eleitoradoMi: 2.47 },
  { sigla: 'TO', nome: 'Tocantins', regiao: 'N', col: 3, row: 2, eleitoradoMi: 1.1 },
  { sigla: 'PI', nome: 'Piauí', regiao: 'NE', col: 4, row: 2, eleitoradoMi: 2.57 },
  { sigla: 'PE', nome: 'Pernambuco', regiao: 'NE', col: 5, row: 2, eleitoradoMi: 7.02 },
  { sigla: 'PB', nome: 'Paraíba', regiao: 'NE', col: 6, row: 2, eleitoradoMi: 3.09 },
  { sigla: 'MS', nome: 'Mato Grosso do Sul', regiao: 'CO', col: 2, row: 3, eleitoradoMi: 1.98 },
  { sigla: 'GO', nome: 'Goiás', regiao: 'CO', col: 3, row: 3, eleitoradoMi: 4.93 },
  { sigla: 'DF', nome: 'Distrito Federal', regiao: 'CO', col: 4, row: 3, eleitoradoMi: 2.2 },
  { sigla: 'BA', nome: 'Bahia', regiao: 'NE', col: 5, row: 3, eleitoradoMi: 11.29 },
  { sigla: 'AL', nome: 'Alagoas', regiao: 'NE', col: 6, row: 3, eleitoradoMi: 2.4 },
  { sigla: 'PR', nome: 'Paraná', regiao: 'S', col: 2, row: 4, eleitoradoMi: 8.48 },
  { sigla: 'SP', nome: 'São Paulo', regiao: 'SE', col: 3, row: 4, eleitoradoMi: 34.67 },
  { sigla: 'MG', nome: 'Minas Gerais', regiao: 'SE', col: 4, row: 4, eleitoradoMi: 16.29 },
  { sigla: 'ES', nome: 'Espírito Santo', regiao: 'SE', col: 5, row: 4, eleitoradoMi: 2.92 },
  { sigla: 'SE', nome: 'Sergipe', regiao: 'NE', col: 6, row: 4, eleitoradoMi: 1.68 },
  { sigla: 'SC', nome: 'Santa Catarina', regiao: 'S', col: 2, row: 5, eleitoradoMi: 5.49 },
  { sigla: 'RJ', nome: 'Rio de Janeiro', regiao: 'SE', col: 4, row: 5, eleitoradoMi: 12.83 },
  { sigla: 'RS', nome: 'Rio Grande do Sul', regiao: 'S', col: 2, row: 6, eleitoradoMi: 8.59 },
];

export const UF_POR_SIGLA: Record<string, UF> = Object.fromEntries(UFS.map((u) => [u.sigla, u]));

export const UFS_ORDENADAS = [...UFS].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
