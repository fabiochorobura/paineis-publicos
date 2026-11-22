/**
 * Atualizações presas ao relógio: em vez de contar a partir da hora em que a tela abriu,
 * todas as telas disparam no mesmo instante (minuto cheio, múltiplo do período).
 */

/** Atualização dos resultados: todas as telas buscam juntas no minuto cheio. */
export const PERIODO_ATUALIZACAO_MS = 60_000;

/** Instante (ms) da próxima virada do período, contado a partir de 1970 (UTC). */
export function proximaVirada(periodoMs: number, agora = Date.now()) {
  return (Math.floor(agora / periodoMs) + 1) * periodoMs;
}

/** Chama `acao` em toda virada do período; devolve a função que cancela. */
export function aCadaVirada(acao: () => void, periodoMs: number) {
  let id = 0;
  const agendar = () => {
    id = window.setTimeout(() => {
      acao();
      agendar();
    }, proximaVirada(periodoMs) - Date.now());
  };
  agendar();
  return () => window.clearTimeout(id);
}
