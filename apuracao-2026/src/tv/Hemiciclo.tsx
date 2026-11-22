import { useMemo } from 'react';
import { alpha, useTheme } from '@mui/material/styles';

export interface Bancada {
  partido: string;
  cadeiras: number;
  cor: string;
}

/** Posições das cadeiras em semicírculo, ordenadas da esquerda para a direita. */
function posicoes(total: number) {
  const linhas = Math.max(3, Math.round(Math.sqrt(total / 4.2)));
  const r0 = 0.38; // raio interno (o raio externo é 1)
  const raios = Array.from({ length: linhas }, (_, i) => r0 + ((1 - r0) * i) / (linhas - 1 || 1));
  const somaRaios = raios.reduce((s, r) => s + r, 0);
  // cadeiras por linha proporcionais ao comprimento do arco
  const porLinha = raios.map((r) => Math.floor((total * r) / somaRaios));
  let falta = total - porLinha.reduce((s, n) => s + n, 0);
  for (let i = linhas - 1; falta > 0; i = (i - 1 + linhas) % linhas, falta--) porLinha[i]++;

  const pts: { x: number; y: number; ang: number }[] = [];
  raios.forEach((r, i) => {
    const n = porLinha[i];
    for (let k = 0; k < n; k++) {
      const ang = n === 1 ? Math.PI / 2 : Math.PI - (Math.PI * k) / (n - 1);
      pts.push({ x: r * Math.cos(ang), y: r * Math.sin(ang), ang });
    }
  });
  pts.sort((a, b) => b.ang - a.ang);
  const raioPonto = ((1 - r0) / (linhas - 1 || 1)) * 0.42;
  return { pts, raioPonto };
}

interface Props {
  total: number;
  bancadas: Bancada[];
  largura: number | string;
  rotuloCentro?: string;
  subtituloCentro?: string;
}

export function Hemiciclo({ total, bancadas, largura, rotuloCentro, subtituloCentro }: Props) {
  const theme = useTheme();
  const { pts, raioPonto } = useMemo(() => posicoes(total), [total]);
  const vazio = alpha(theme.palette.text.primary, 0.12);
  const cores: string[] = [];
  bancadas.forEach((b) => {
    for (let i = 0; i < b.cadeiras && cores.length < total; i++) cores.push(b.cor);
  });

  // número: tamanho fixo (TV); texto (ex.: '100%'): acompanha a largura do card
  const altura = typeof largura === 'number' ? largura * 0.54 : undefined;
  return (
    <svg
      width={largura}
      height={altura}
      style={typeof largura === 'number' ? undefined : { height: 'auto', display: 'block' }}
      viewBox="-1.05 -1.05 2.1 1.13"
      role="img"
      aria-label={`Plenário com ${total} cadeiras`}
    >
      {pts.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={-p.y}
          r={raioPonto}
          fill={cores[i] ?? vazio}
          style={{ transition: 'fill .6s ease' }}
        />
      ))}
      {rotuloCentro && (
        <text
          x={0}
          y={-0.1}
          textAnchor="middle"
          fontSize={0.2}
          fontWeight={800}
          fill={theme.palette.text.primary}
        >
          {rotuloCentro}
        </text>
      )}
      {subtituloCentro && (
        <text
          x={0}
          y={0.02}
          textAnchor="middle"
          fontSize={0.075}
          fontWeight={500}
          fill={theme.palette.text.secondary}
        >
          {subtituloCentro}
        </text>
      )}
    </svg>
  );
}
