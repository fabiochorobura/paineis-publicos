/**
 * Votos para Presidente no exterior: total ("zz") e as 186 cidades onde há seções.
 * O total acompanha o minuto cheio; as cidades vêm uma a uma do TSE (arquivos pequenos),
 * em lotes, a cada 3 minutos cheios — todas as telas juntas.
 */
import { useEffect, useState } from 'react';
import { Resultado } from './tipos';
import { buscarResultado } from './tse';
import { useEleicao } from '../context/EleicaoContext';
import { aCadaVirada, PERIODO_ATUALIZACAO_MS } from '../utils/relogio';

export interface CidadeExterior {
  cd: string;
  nome: string;
  r: Resultado | null;
}

// 186 arquivos: devagar e poucos de cada vez, para não levar 429 do TSE
const ATUALIZA_CIDADES_MS = 180_000;
const CONCORRENCIA = 8;

let listaCidades: Promise<[string, string][]> | null = null;
const carregarLista = () =>
  (listaCidades ??= fetch(`${import.meta.env.BASE_URL}exterior.json`)
    .then((r) => r.json() as Promise<[string, string][]>)
    .catch((e) => {
      listaCidades = null;
      throw e;
    }));

export function useExterior() {
  const { modo, eleicoes, buscar } = useEleicao();
  const [total, setTotal] = useState<Resultado | null>(null);
  const [cidades, setCidades] = useState<CidadeExterior[]>([]);

  useEffect(() => {
    let vivo = true;
    const carregar = () =>
      // a simulação não tem exterior: usa o DF como amostra só para preencher a tela
      (modo === 'simulacao'
        ? buscar('presidente', 'df').then((r) => ({ ...r, abrangencia: 'zz' }))
        : buscar('presidente', 'zz')
      )
        .then((r) => vivo && setTotal(r))
        .catch(() => undefined);
    carregar();
    const cancelar = aCadaVirada(carregar, modo === 'simulacao' ? 5000 : PERIODO_ATUALIZACAO_MS);
    return () => {
      vivo = false;
      cancelar();
    };
  }, [modo, buscar]);

  useEffect(() => {
    let vivo = true;
    const ac = new AbortController();
    const carregar = async () => {
      const lista = await carregarLista().catch(() => [] as [string, string][]);
      if (!vivo) return;
      if (modo !== 'oficial' || !eleicoes) {
        setCidades(lista.map(([cd, nome]) => ({ cd, nome, r: null })));
        return;
      }
      const saida = new Map<string, Resultado>();
      let i = 0;
      const trabalhador = async () => {
        while (i < lista.length && vivo) {
          const [cd] = lista[i++];
          try {
            saida.set(
              cd,
              await buscarResultado(eleicoes, 'presidente', `zz${cd}`, ac.signal, 'zz'),
            );
          } catch {
            /* não publicado / rede: segue */
          }
        }
      };
      await Promise.all(Array.from({ length: CONCORRENCIA }, trabalhador));
      if (vivo) setCidades(lista.map(([cd, nome]) => ({ cd, nome, r: saida.get(cd) ?? null })));
    };
    carregar();
    const cancelar = aCadaVirada(carregar, ATUALIZA_CIDADES_MS);
    return () => {
      vivo = false;
      ac.abort();
      cancelar();
    };
  }, [modo, eleicoes]);

  return { total, cidades };
}
