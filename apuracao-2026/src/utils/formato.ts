const nf = new Intl.NumberFormat('pt-BR');
const nfCompact = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });

export const num = (n: number) => nf.format(Math.round(n));
export const compacto = (n: number) => nfCompact.format(n);
export const pct = (n: number, casas = 2) =>
  `${n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })}%`;

export const hora = (d: Date | null) =>
  d
    ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—';

export const dataHora = (d: Date | null) =>
  d
    ? d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

/** "HELENA DUARTE" -> "Helena Duarte" (o TSE publica nomes em caixa alta) */
export function nomeProprio(s: string) {
  const minusc = new Set(['da', 'de', 'do', 'das', 'dos', 'e']);
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((p, i) => (i > 0 && minusc.has(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(' ');
}

export const iniciais = (s: string) =>
  s
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
