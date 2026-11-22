import Chart from './Grafico';
import type { ApexOptions } from 'apexcharts';
import { IconChartLine } from '@tabler/icons-react';
import { Resultado } from '../api/tipos';
import { PontoHistorico } from '../context/EleicaoContext';
import { useCores } from '../utils/cores';
import { nomeProprio, pct } from '../utils/formato';
import { EstadoVazio, useApexBase } from './shared';

/** Como o % de cada candidato mudou conforme as urnas foram apuradas. */
export function GraficoEvolucao({
  historico,
  atual,
  escopo,
  largura,
  altura = 320,
  fonte,
}: {
  historico: PontoHistorico[];
  atual: Resultado;
  escopo: string;
  largura?: number;
  altura?: number;
  /** tamanho da fonte dos eixos/legenda (o modo TV usa maior) */
  fonte?: number;
}) {
  const base = useApexBase();
  const { cor } = useCores();
  const top = atual.candidatos.slice(0, 4);

  if (historico.length < 2) {
    return (
      <EstadoVazio
        icone={<IconChartLine size={48} stroke={1.2} />}
        titulo="A linha do tempo vai se formando"
        texto="Este gráfico registra cada atualização enquanto a página fica aberta. Volte em alguns minutos."
      />
    );
  }

  const series = top.map((c) => ({
    name: nomeProprio(c.nome),
    data: historico.filter((p) => p.pcts[c.numero] !== undefined).map((p) => ({ x: +p.pctSecoes.toFixed(2), y: +p.pcts[c.numero].toFixed(2) })),
  }));

  const tam = fonte ? `${fonte}px` : '12px';
  const options: ApexOptions = {
    ...base,
    chart: { ...base.chart, type: 'line' },
    colors: top.map((c) => cor(escopo, c, atual.candidatos)),
    stroke: { width: 2.5, curve: 'smooth' },
    markers: { size: 0, hover: { size: 6 } },
    legend: { ...base.legend, position: 'top', horizontalAlign: 'left', ...(fonte ? { fontSize: `${fonte}px` } : {}) },
    xaxis: {
      type: 'numeric',
      min: 0,
      max: 100,
      tickAmount: 4,
      labels: { formatter: (v) => `${Math.round(+v)}%`, style: { fontSize: tam } },
      title: { text: 'Urnas apuradas', style: { fontWeight: 500 } },
      tooltip: { enabled: false },
    },
    yaxis: { labels: { formatter: (v) => `${Math.round(v)}%`, style: { fontSize: tam } }, title: { text: '% dos votos válidos', style: { fontWeight: 500 } } },
    annotations: {
      yaxis: [{ y: 50, borderColor: '#898781', strokeDashArray: 4, label: { text: '50% (vence no 1º turno)', style: { background: 'transparent', color: '#898781' } } }],
    },
    tooltip: { ...base.tooltip, shared: true, x: { formatter: (v) => `${pct(+v, 1)} apurado` }, y: { formatter: (v) => pct(v) } },
  };

  return <Chart type="line" height={altura} width={largura ?? '100%'} series={series} options={options} />;
}
