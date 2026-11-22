import { useEffect, useRef, useState } from 'react';
import { useEleicao } from '../context/EleicaoContext';
import { aCadaVirada, PERIODO_ATUALIZACAO_MS } from '../utils/relogio';

/** líder + segundo colocado: [partido, número, %, % apurado, votos, número2, %2, votos2, partido2] */
export type LiderMunicipio = [string, string, number, number, number?, string?, number?, number?, string?];
export type MapaCargo = Record<string, LiderMunicipio>;
export type MapasMunicipios = { presidente?: MapaCargo };

export interface Geometria {
  w: number;
  h: number;
  municipios: {
    ibge: string;
    nome: string;
    path: Path2D;
    caixa: [number, number, number, number];
  }[];
  estados: Path2D[];
}

let geometria: Promise<Geometria> | null = null;

function caixaDoCaminho(d: string): [number, number, number, number] {
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const anel of d.split('M')) {
    if (!anel) continue;
    const numeros = anel.replace(/[lz]/g, ' ').trim().split(/\s+/).map(Number);
    let x = numeros[0];
    let y = numeros[1];
    for (let i = 0; i < numeros.length; i += 2) {
      if (i > 0) {
        x += numeros[i];
        y += numeros[i + 1];
      }
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    }
  }
  return [x0, y0, x1, y1];
}

export function carregarGeometria(): Promise<Geometria> {
  geometria ??= fetch(`${import.meta.env.BASE_URL}municipios.json`)
    .then(
      (resposta) =>
        resposta.json() as Promise<{
          w: number;
          h: number;
          m: [string, string, string][];
          uf: [string, string][];
        }>,
    )
    .then((dados) => ({
      w: dados.w,
      h: dados.h,
      municipios: dados.m.map(([ibge, desenho, nome]) => ({
        ibge,
        nome,
        path: new Path2D(desenho),
        caixa: caixaDoCaminho(desenho),
      })),
      estados: dados.uf.map(([, desenho]) => new Path2D(desenho)),
    }))
    .catch((erro) => {
      geometria = null;
      throw erro;
    });
  return geometria;
}

export function useGeometria() {
  const [dados, setDados] = useState<Geometria | null>(null);
  useEffect(() => {
    let ativo = true;
    carregarGeometria()
      .then((valor) => ativo && setDados(valor))
      .catch(() => undefined);
    return () => {
      ativo = false;
    };
  }, []);
  return dados;
}

export const UF_IBGE: Record<string, string> = {
  '11': 'ro', '12': 'ac', '13': 'am', '14': 'rr', '15': 'pa', '16': 'ap', '17': 'to',
  '21': 'ma', '22': 'pi', '23': 'ce', '24': 'rn', '25': 'pb', '26': 'pe', '27': 'al',
  '28': 'se', '29': 'ba', '31': 'mg', '32': 'es', '33': 'rj', '35': 'sp', '41': 'pr',
  '42': 'sc', '43': 'rs', '50': 'ms', '51': 'mt', '52': 'go', '53': 'df',
};

export function municipiosDaUF(geo: Geometria, uf: string) {
  return geo.municipios
    .filter((municipio) => UF_IBGE[municipio.ibge.slice(0, 2)] === uf)
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}


export function useMapasMunicipios(): MapasMunicipios {
  const { turno } = useEleicao();
  const [mapas, setMapas] = useState<MapasMunicipios>({});
  const versao = useRef('');

  useEffect(() => {
    setMapas({});
    versao.current = '';
    let controlador = new AbortController();

    const carregar = () => {
      controlador.abort();
      controlador = new AbortController();
      const opcoes = { cache: 'no-cache' as RequestCache, signal: controlador.signal };
      const principal = `${import.meta.env.BASE_URL}mapa-dados/mapa-presidente-t${turno}.json`;
      const legado = `${import.meta.env.BASE_URL}mapa-dados/mapa-presidente.json`;

      fetch(principal, opcoes)
        .then((resposta) =>
          resposta.ok || turno === 2 ? resposta : fetch(legado, opcoes),
        )
        .then((resposta) =>
          resposta.ok
            ? (resposta.json() as Promise<{ m: MapaCargo; atualizado?: string }>)
            : Promise.reject(new Error(String(resposta.status))),
        )
        .then((dados) => {
          if (dados.atualizado && dados.atualizado === versao.current) return;
          versao.current = dados.atualizado ?? '';
          setMapas({ presidente: dados.m });
        })
        .catch(() => undefined);
    };

    carregar();
    const cancelar = aCadaVirada(carregar, PERIODO_ATUALIZACAO_MS);
    return () => {
      cancelar();
      controlador.abort();
    };
  }, [turno]);

  return mapas;
}
