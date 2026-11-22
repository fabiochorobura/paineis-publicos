import { useEffect, useLayoutEffect, useRef } from 'react';
import { Box } from '@mui/material';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';

/** tinta e grade dos gráficos (tema claro do painel) */
export const TINTA = { texto: '#52514e', grade: '#eceae4', neutro: '#8f8d86', faixa: 'rgba(143, 141, 134, 0.18)' };
export const FONTE = '12px "Plus Jakarta Sans", system-ui, sans-serif';

/** cores dos candidatos: seguem o partido, nunca a posição no ranking */
export function corDoPartido(partido: string, posicao: number) {
  const p = partido.toUpperCase();
  if (p === 'PT') return '#D32F2F';
  if (p === 'PL') return '#2a78d6';
  return ['#1baf7a', '#eda100'][posicao % 2];
}

// gráficos com a mesma chave de sincronia acompanham o zoom uns dos outros
const grupos = new Map<string, Set<uPlot>>();
// só depois de abrir: a escala inicial de um gráfico recém-criado desfaria o zoom dos outros
const prontos = new WeakSet<uPlot>();
let propagando = false;

function sincronizarZoom(chave: string): NonNullable<uPlot.Hooks.Arrays['setScale']> {
  return [
    (u: uPlot, escala: string) => {
      if (escala !== 'x' || propagando || !prontos.has(u)) return;
      const { min, max } = u.scales.x;
      if (min == null || max == null) return;
      propagando = true;
      grupos.get(chave)?.forEach((outro) => {
        if (outro !== u) outro.setScale('x', { min, max });
      });
      propagando = false;
    },
  ];
}

/**
 * Escala y que ignora o começo da apuração (quando poucas seções jogam a linha de 0% a 100%) se a
 * janela visível vai muito além dele; com zoom só no começo, mostra o começo inteiro.
 */
export function faixaEstavel(pular: number): uPlot.Range.Function {
  return (u) => {
    // janela visível que o próprio uPlot acabou de calcular (u.scales.x ainda é a anterior aqui)
    const n = u.data[0].length;
    let i0 = u.series[0].idxs?.[0] ?? 0;
    const i1 = u.series[0].idxs?.[1] ?? n - 1;
    if (i0 < pular && i1 > 4 * pular) i0 = pular;
    let lo = Infinity;
    let hi = -Infinity;
    for (let s = 1; s < u.data.length; s++) {
      if (!u.series[s]?.show) continue;
      const ys = u.data[s] as ArrayLike<number | null>;
      for (let i = i0; i <= i1; i++) {
        const v = ys[i];
        if (v != null && Number.isFinite(v)) {
          if (v < lo) lo = v;
          if (v > hi) hi = v;
        }
      }
    }
    if (!Number.isFinite(lo)) return [0, 1];
    const folga = Math.max((hi - lo) * 0.08, Math.abs(hi) * 1e-6, 1e-9);
    return [lo - folga, hi + folga];
  };
}

export function eixo(extra: Partial<uPlot.Axis> = {}): uPlot.Axis {
  return {
    stroke: TINTA.texto,
    font: FONTE,
    labelFont: FONTE,
    grid: { stroke: TINTA.grade, width: 1 },
    ticks: { stroke: TINTA.grade, width: 1, size: 4 },
    ...extra,
  };
}

type Formatador = (u: uPlot, v: number | null, serie: number, idx: number) => string;

/** rótulo junto ao ponto do cursor (x e o valor de cada linha), além da legenda embaixo */
function dicaFlutuante(): uPlot.Hooks.Arrays {
  let dica: HTMLDivElement | null = null;
  return {
    init: [
      (u: uPlot) => {
        dica = document.createElement('div');
        Object.assign(dica.style, {
          position: 'absolute',
          pointerEvents: 'none',
          zIndex: '10',
          display: 'none',
          padding: '6px 8px',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.96)',
          border: `1px solid ${TINTA.grade}`,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
          font: FONTE,
          color: '#33322e',
          whiteSpace: 'nowrap',
          fontVariantNumeric: 'tabular-nums',
        });
        u.over.appendChild(dica);
      },
    ],
    setCursor: [
      (u: uPlot) => {
        if (!dica) return;
        const { left, top, idx } = u.cursor;
        if (idx == null || left == null || top == null || left < 0) {
          dica.style.display = 'none';
          return;
        }
        const valor = (s: number) => (u.series[s].value as unknown as Formatador)(u, (u.data[s][idx] as number | null) ?? null, s, idx);
        const linhas = [`<b>${valor(0)}</b>`];
        for (let s = 1; s < u.series.length; s++) {
          const serie = u.series[s];
          // as bordas das faixas cinzas não entram no rótulo
          if (!serie.show || serie.stroke === TINTA.faixa || u.data[s][idx] == null) continue;
          const cor = typeof serie.stroke === 'function' ? serie.stroke(u, s) : serie.stroke;
          linhas.push(`<span style="color:${String(cor)}">●</span> ${serie.label}: <b>${valor(s)}</b>`);
        }
        dica.innerHTML = linhas.join('<br>');
        dica.style.display = 'block';
        const largura = dica.offsetWidth;
        const x = left + 14 + largura > u.over.clientWidth ? left - 14 - largura : left + 14;
        dica.style.left = `${Math.max(0, x)}px`;
        dica.style.top = `${Math.max(0, top - dica.offsetHeight - 10)}px`;
      },
    ],
  };
}

interface Props {
  opcoes: Omit<uPlot.Options, 'width' | 'height'>;
  dados: uPlot.AlignedData;
  altura: number;
  /** gráficos com a mesma chave compartilham cursor e zoom */
  sincronia?: string;
  rotulo: string;
}

export default function Grafico({ opcoes, dados, altura, sincronia, rotulo }: Props) {
  const caixa = useRef<HTMLDivElement>(null);
  const plot = useRef<uPlot | null>(null);
  const dadosRef = useRef(dados);
  dadosRef.current = dados;

  useLayoutEffect(() => {
    const el = caixa.current;
    if (!el) return;
    const hooks: uPlot.Hooks.Arrays = { ...opcoes.hooks };
    const dica = dicaFlutuante();
    hooks.init = [...(hooks.init ?? []), ...(dica.init ?? [])];
    hooks.setCursor = [...(hooks.setCursor ?? []), ...(dica.setCursor ?? [])];
    if (sincronia) {
      hooks.setScale = [...(hooks.setScale ?? []), ...sincronizarZoom(sincronia)];
      hooks.ready = [
        ...(hooks.ready ?? []),
        (u: uPlot) => {
          prontos.add(u);
          // entra no zoom em que os outros gráficos do grupo já estão
          const outro = [...(grupos.get(sincronia) ?? [])].find((g) => g !== u && prontos.has(g));
          const { min, max } = outro?.scales.x ?? {};
          if (min != null && max != null) u.setScale('x', { min, max });
        },
      ];
    }
    const u = new uPlot(
      {
        ...opcoes,
        width: Math.max(200, el.clientWidth),
        height: altura,
        hooks,
        cursor: { ...opcoes.cursor, ...(sincronia ? { sync: { key: sincronia } } : {}) },
      },
      dadosRef.current,
      el,
    );
    plot.current = u;
    if (sincronia) {
      if (!grupos.has(sincronia)) grupos.set(sincronia, new Set());
      grupos.get(sincronia)!.add(u);
    }
    const ro = new ResizeObserver(() => u.setSize({ width: Math.max(200, el.clientWidth), height: altura }));
    ro.observe(el);
    return () => {
      ro.disconnect();
      if (sincronia) grupos.get(sincronia)?.delete(u);
      u.destroy();
      plot.current = null;
    };
  }, [opcoes, altura, sincronia]);

  useEffect(() => {
    if (plot.current && plot.current.data !== dados) plot.current.setData(dados);
  }, [dados]);

  return (
    <Box
      ref={caixa}
      role="img"
      aria-label={rotulo}
      sx={{
        width: '100%',
        minWidth: 0,
        '& .u-legend': { font: FONTE, color: TINTA.texto, textAlign: 'left', mt: 0.5 },
        '& .u-legend .u-marker': { borderRadius: '3px' },
        '& .u-legend th': { fontWeight: 600 },
        '& .u-legend td': { fontVariantNumeric: 'tabular-nums' },
        '& .u-select': { background: 'rgba(42, 120, 214, 0.08)' },
      }}
    />
  );
}
