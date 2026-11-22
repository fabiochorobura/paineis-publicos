import { useTheme, alpha } from '@mui/material/styles';
import { ESTADOS_SVG, VIEWBOX } from '../data/brasilSvg';

/** deslocamento dos rótulos de estados pequenos do litoral, que não cabem dentro do contorno */
const RotuloFora: Record<string, [number, number]> = {
  RN: [52, -8],
  PB: [62, 6],
  PE: [70, 22],
  AL: [52, 34],
  SE: [44, 44],
  ES: [44, 14],
  RJ: [34, 34],
  DF: [0, 0],
};

export interface PreenchimentoUF {
  cor: string | null;
  /** 0..1 — estados pouco apurados ficam mais transparentes */
  intensidade: number;
  rotulo?: string;
}

interface Props {
  preenchimento: Record<string, PreenchimentoUF>;
  largura: number | string;
  altura: number | string;
  /** site normal: toque no estado abre os detalhes (a TV não usa) */
  onSelect?: (uf: string) => void;
  /** aumenta siglas e percentuais quando o mapa é desenhado pequeno (celular) */
  escalaRotulo?: number;
}

export function MapaBrasil({ preenchimento, largura, altura, onSelect, escalaRotulo = 1 }: Props) {
  const k = escalaRotulo;
  const theme = useTheme();
  const vazio = alpha(theme.palette.text.primary, 0.1);
  const borda = theme.palette.background.paper;
  const tinta = theme.palette.text.primary;

  return (
    <svg
      viewBox={VIEWBOX}
      width={largura}
      height={altura}
      role="img"
      aria-label="Mapa do Brasil por estado"
      style={{ overflow: 'visible' }}
    >
      {ESTADOS_SVG.map((e) => {
        const p = preenchimento[e.sigla.toLowerCase()];
        return (
          <path
            key={e.sigla}
            d={e.d}
            fill={p?.cor ?? vazio}
            fillOpacity={p?.cor ? 0.4 + 0.6 * Math.min(1, p.intensidade) : 1}
            stroke={borda}
            strokeWidth={2}
            strokeLinejoin="round"
            style={{
              transition: 'fill .6s ease, fill-opacity .6s ease',
              cursor: onSelect ? 'pointer' : undefined,
            }}
            onClick={onSelect ? () => onSelect(e.sigla.toLowerCase()) : undefined}
          >
            <title>{e.sigla}</title>
          </path>
        );
      })}
      {ESTADOS_SVG.map((e) => {
        const p = preenchimento[e.sigla.toLowerCase()];
        const fora = RotuloFora[e.sigla];
        const externo = fora && (fora[0] !== 0 || fora[1] !== 0);
        const x = e.cx + (fora?.[0] ?? 0);
        const y = e.cy + (fora?.[1] ?? 0);
        const corTexto = externo ? tinta : p?.cor ? '#fff' : tinta;
        return (
          <g key={e.sigla} style={{ pointerEvents: 'none' }}>
            {externo && (
              <line
                x1={e.cx}
                y1={e.cy}
                x2={x - 14}
                y2={y - 4}
                stroke={tinta}
                strokeOpacity={0.35}
                strokeWidth={1.2}
              />
            )}
            <text
              x={x}
              y={y}
              textAnchor={externo ? 'start' : 'middle'}
              fontSize={(e.sigla === 'DF' ? 15 : 20) * k}
              fontWeight={800}
              fill={corTexto}
              style={{ paintOrder: 'stroke' }}
              stroke={externo ? 'none' : 'rgba(0,0,0,.25)'}
              strokeWidth={externo ? 0 : 3}
            >
              {e.sigla}
              {/* estados pequenos (rótulo fora do contorno) e o DF: o percentual vai ao lado da sigla */}
              {p?.rotulo && (externo || e.sigla === 'DF') && (
                <tspan fontSize={(e.sigla === 'DF' ? 12 : 16) * k} fontWeight={700} dx={5 * k} opacity={0.85}>
                  {p.rotulo}
                </tspan>
              )}
            </text>
            {p?.rotulo && !externo && e.sigla !== 'DF' && (
              <text
                x={x}
                y={y + 20 * k}
                textAnchor="middle"
                fontSize={15 * k}
                fontWeight={600}
                fill={corTexto}
                opacity={0.95}
              >
                {p.rotulo}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
