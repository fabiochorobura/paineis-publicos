/**
 * Recarrega uma única vez quando sobe uma versão nova do site. O id fica na sessão para
 * impedir loops em Smart TVs que insistem em reutilizar o HTML antigo mesmo sem cache.
 */
import { useEffect } from 'react';

const INTERVALO_MS = 180_000;
const CHAVE_RECARREGADA = 'eleicoes-versao-recarregada';

export function useNovaVersao() {
  useEffect(() => {
    if (import.meta.env.DEV) return;
    const conferir = () =>
      fetch(`${import.meta.env.BASE_URL}versao.json?t=${Date.now()}`, { cache: 'no-store' })
        .then((r) => (r.ok ? (r.json() as Promise<{ id?: string }>) : null))
        .then((j) => {
          if (!j?.id || j.id === __BUILD_ID__) return;
          const destino = new URL(window.location.href);
          if (destino.searchParams.get('versao') === j.id) return;
          try {
            if (sessionStorage.getItem(CHAVE_RECARREGADA) === j.id) return;
            sessionStorage.setItem(CHAVE_RECARREGADA, j.id);
          } catch {
            // Algumas Smart TVs bloqueiam storage; o parâmetro na URL ainda impede o loop.
          }
          destino.searchParams.set('versao', j.id);
          window.location.replace(destino.toString());
        })
        .catch(() => undefined);
    const id = window.setInterval(conferir, INTERVALO_MS);
    return () => window.clearInterval(id);
  }, []);
}
