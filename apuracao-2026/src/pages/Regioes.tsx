import { useMemo } from 'react';
import { Box, LinearProgress, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Chart from '../components/Grafico';
import type { ApexOptions } from 'apexcharts';
import { useEleicao } from '../context/EleicaoContext';
import { Candidato, Resultado } from '../api/tipos';
import { CandidatoAvatar, DashboardCard, useApexBase } from '../components/shared';
import { ORDEM_REGIOES, REGIOES, Regiao, UFS } from '../data/ufs';
import { agruparOutros, useCores } from '../utils/cores';
import { compacto, nomeProprio, num, pct } from '../utils/formato';
import { ESCOPO_PRESIDENTE, SemDados } from './Nacional';
import MapaTopo from '../layout/MapaTopo';

interface DadosRegiao {
  regiao: Regiao;
  secoes: number;
  secoesTotal: number;
  pctSecoes: number;
  validos: number;
  eleitorado: number;
  comparecimento: number;
  candidatos: Candidato[];
  ufsComDados: number;
  ufsTotal: number;
}

function agregar(estados: Record<string, Resultado>, referencia: Candidato[]): DadosRegiao[] {
  return ORDEM_REGIOES.map((regiao) => {
    const ufs = UFS.filter((u) => u.regiao === regiao);
    const rs = ufs.map((u) => estados[u.sigla.toLowerCase()]).filter(Boolean);
    const votos = new Map<string, number>();
    rs.forEach((r) =>
      r.candidatos.forEach((c) => votos.set(c.numero, (votos.get(c.numero) ?? 0) + c.votos)),
    );
    const validos = [...votos.values()].reduce((s, v) => s + v, 0);
    const secoes = rs.reduce((s, r) => s + r.secoesTotalizadas, 0);
    const secoesTotal = rs.reduce((s, r) => s + r.secoesTotal, 0);
    const candidatos = referencia
      .map((c) => ({
        ...c,
        votos: votos.get(c.numero) ?? 0,
        pct: validos ? ((votos.get(c.numero) ?? 0) / validos) * 100 : 0,
      }))
      .sort((a, b) => b.votos - a.votos);
    return {
      regiao,
      secoes,
      secoesTotal,
      pctSecoes: secoesTotal ? (secoes / secoesTotal) * 100 : 0,
      validos,
      eleitorado: rs.reduce((s, r) => s + r.eleitorado, 0),
      comparecimento: rs.reduce((s, r) => s + r.comparecimento, 0),
      candidatos,
      ufsComDados: rs.length,
      ufsTotal: ufs.length,
    };
  });
}

function CardRegiao({ d, referencia }: { d: DadosRegiao; referencia: Candidato[] }) {
  const { cor } = useCores();
  const [a, b] = d.candidatos;
  const temVotos = a && a.votos > 0;
  return (
    <DashboardCard p={2.5}>
      <Stack spacing={1.5}>
        <Stack direction="row" justifyContent="space-between" alignItems="baseline">
          <Typography variant="h6">{REGIOES[d.regiao]}</Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {pct(d.pctSecoes, 1)} apurado
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={d.pctSecoes}
          sx={{ height: 5, borderRadius: 3 }}
          aria-label={`${REGIOES[d.regiao]}: ${pct(d.pctSecoes, 1)} apurado`}
        />
        {temVotos ? (
          <>
            <Stack direction="row" spacing={1.5} alignItems="center" pt={0.5}>
              <CandidatoAvatar
                nome={a.nome}
                foto={a.fotoUrl}
                cor={cor(ESCOPO_PRESIDENTE, a, referencia)}
                tamanho={44}
              />
              <Box minWidth={0}>
                <Typography variant="body2" color="text.secondary">
                  Lidera
                </Typography>
                <Typography fontWeight={700} noWrap>
                  {nomeProprio(a.nome)}
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight={800} ml="auto !important">
                {pct(a.pct, 1)}
              </Typography>
            </Stack>
            {b && (
              <Typography variant="body2" color="text.secondary">
                2º: {nomeProprio(b.nome)} · {pct(b.pct, 1)}
              </Typography>
            )}
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Sem votos apurados ainda.
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary">
          {compacto(d.eleitorado)} eleitores · {d.ufsTotal} estados
        </Typography>
      </Stack>
    </DashboardCard>
  );
}

export default function Regioes() {
  const { brasil, estados } = useEleicao();
  const base = useApexBase();
  const theme = useTheme();
  const { cor, outros: corOutros } = useCores();
  const referencia = brasil?.candidatos ?? [];
  const dados = useMemo(() => agregar(estados, referencia), [estados, referencia]);

  if (!brasil) return <SemDados />;

  // barras 100% empilhadas: top 5 candidatos + Outros, uma barra por região
  const { top } = agruparOutros(referencia, 5);
  const numerosTop = new Set(top.map((c) => c.numero));
  const pares = [
    ...top.map((c) => ({
      cor: cor(ESCOPO_PRESIDENTE, c, referencia),
      serie: {
        name: nomeProprio(c.nome),
        data: dados.map((d) => d.candidatos.find((x) => x.numero === c.numero)?.votos ?? 0),
      },
    })),
    {
      cor: corOutros,
      serie: {
        name: 'Outros',
        data: dados.map((d) =>
          d.candidatos.filter((x) => !numerosTop.has(x.numero)).reduce((s, x) => s + x.votos, 0),
        ),
      },
    },
  ].filter((p) => p.serie.data.some((v) => v > 0));
  const series = pares.map((p) => p.serie);
  const coresSeries = pares.map((p) => p.cor);

  const opcoesEmpilhado: ApexOptions = {
    ...base,
    chart: { ...base.chart, type: 'bar', stacked: true, stackType: '100%' },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '58%',
        borderRadius: 4,
        borderRadiusApplication: 'end',
        borderRadiusWhenStacked: 'last',
      },
    },
    colors: coresSeries,
    stroke: { width: 2, colors: [theme.palette.background.paper] },
    xaxis: {
      categories: dados.map((d) => REGIOES[d.regiao]),
      labels: { formatter: (v) => `${v}%` },
    },
    yaxis: { labels: { style: { fontSize: '13px', fontWeight: 600 } } },
    legend: { ...base.legend, position: 'top', horizontalAlign: 'left' },
    dataLabels: {
      enabled: true,
      formatter: (v: number) => (v >= 8 ? `${Math.round(v)}%` : ''),
      style: { fontSize: '12px', fontWeight: 700 },
      dropShadow: { enabled: false },
    },
    tooltip: {
      ...base.tooltip,
      shared: false,
      y: {
        formatter: (v, o) =>
          `${num(v)} votos · ${pct((v / (dados[o.dataPointIndex].validos || 1)) * 100)}`,
      },
    },
  };

  const opcoesApurado: ApexOptions = {
    ...base,
    chart: { ...base.chart, type: 'bar' },
    colors: [theme.palette.primary.main],
    plotOptions: {
      bar: {
        columnWidth: '45%',
        borderRadius: 4,
        borderRadiusApplication: 'end',
        dataLabels: { position: 'top' },
      },
    },
    xaxis: {
      categories: dados.map((d) => REGIOES[d.regiao]),
      labels: { rotate: 0, hideOverlappingLabels: false, trim: true },
    },
    yaxis: { min: 0, max: 100, tickAmount: 4, labels: { formatter: (v) => `${Math.round(v)}%` } },
    dataLabels: {
      enabled: true,
      formatter: (v: number) => pct(v, 1),
      offsetY: -22,
      style: { colors: [base.chart?.foreColor as string], fontWeight: 700 },
    },
    tooltip: { ...base.tooltip, y: { formatter: (v) => `${pct(v)} das urnas` } },
  };

  return (
    <Stack spacing={3}>
      {/* mapa nacional com os cards das regiões ao lado */}
      <MapaTopo
        onSelect={(uf) => (window.location.hash = `/estado/${uf}`)}
        lado={
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            }}
          >
            {dados.map((d) => (
              <CardRegiao key={d.regiao} d={d} referencia={referencia} />
            ))}
          </Box>
        }
      />

      <DashboardCard
        titulo="Presidente: divisão dos votos válidos por região"
        subtitulo="Cada barra soma 100% dos votos válidos daquela região"
      >
        <Chart type="bar" height={360} series={series} options={opcoesEmpilhado} />
      </DashboardCard>

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' } }}>
        <DashboardCard
          titulo="Andamento da apuração por região"
          subtitulo="Percentual de seções totalizadas"
        >
          <Chart
            type="bar"
            height={300}
            series={[{ name: 'Apurado', data: dados.map((d) => +d.pctSecoes.toFixed(2)) }]}
            options={opcoesApurado}
          />
        </DashboardCard>
        <DashboardCard titulo="Votos de cada candidato por região" subtitulo="Em milhões de votos">
          <Box sx={{ overflowX: 'auto' }}>
            <Box
              component="table"
              sx={{
                width: '100%',
                borderCollapse: 'collapse',
                '& td, & th': {
                  py: 1.1,
                  px: 1,
                  borderBottom: 1,
                  borderColor: 'divider',
                  textAlign: 'right',
                  fontVariantNumeric: 'tabular-nums',
                  fontSize: 13,
                  whiteSpace: 'nowrap',
                },
                '& th:first-of-type, & td:first-of-type': { textAlign: 'left' },
              }}
            >
              <thead>
                <tr>
                  <Typography component="th" variant="body2" fontWeight={700}>
                    Candidato
                  </Typography>
                  {dados.map((d) => (
                    <Typography key={d.regiao} component="th" variant="body2" fontWeight={700}>
                      {d.regiao}
                    </Typography>
                  ))}
                </tr>
              </thead>
              <tbody>
                {top.map((c) => (
                  <tr key={c.numero}>
                    <td>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            bgcolor: cor(ESCOPO_PRESIDENTE, c, referencia),
                          }}
                        />
                        <span>{nomeProprio(c.nome)}</span>
                      </Stack>
                    </td>
                    {dados.map((d) => {
                      const v = d.candidatos.find((x) => x.numero === c.numero)?.votos ?? 0;
                      return (
                        <td key={d.regiao}>
                          {(v / 1e6).toLocaleString('pt-BR', {
                            maximumFractionDigits: 2,
                            minimumFractionDigits: 2,
                          })}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </Box>
          </Box>
          <Typography variant="caption" color="text.secondary" display="block" mt={1.5}>
            N = Norte · NE = Nordeste · CO = Centro-Oeste · SE = Sudeste · S = Sul
          </Typography>
        </DashboardCard>
      </Box>
    </Stack>
  );
}
