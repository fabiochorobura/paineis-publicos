import { Box, Chip, LinearProgress, Stack, Tooltip, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import Chart from './Grafico';
import type { ApexOptions } from 'apexcharts';
import { IconUsers, IconUserOff, IconSquare, IconBan, IconTrophy, IconArrowsSplit, IconHourglass } from '@tabler/icons-react';
import { Candidato, Resultado } from '../api/tipos';
import { agruparOutros, useCores } from '../utils/cores';
import { compacto, nomeProprio, num, pct } from '../utils/formato';
import { CandidatoAvatar, DashboardCard, useApexBase } from './shared';

// ---------------------------------------------------------------- Urnas apuradas

export function CardApuracao({ r, titulo = 'Urnas apuradas' }: { r: Resultado; titulo?: string }) {
  const theme = useTheme();
  const v = r.pctSecoes;
  return (
    <DashboardCard>
      <Stack direction="row" alignItems="center" spacing={2.5}>
        <Box sx={{ position: 'relative', width: 96, height: 96, flexShrink: 0 }}>
          <svg viewBox="0 0 36 36" width="96" height="96" role="img" aria-label={`${pct(v)} das urnas apuradas`}>
            <circle cx="18" cy="18" r="15.5" fill="none" stroke={alpha(theme.palette.primary.main, 0.15)} strokeWidth="3.5" />
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke={theme.palette.primary.main}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray={`${(v / 100) * 97.4} 97.4`}
              transform="rotate(-90 18 18)"
              style={{ transition: 'stroke-dasharray .6s ease' }}
            />
          </svg>
          <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
            <Typography variant="h5" fontWeight={800}>
              {v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%
            </Typography>
          </Box>
        </Box>
        <Box minWidth={0}>
          <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
            {titulo}
          </Typography>
          <Typography variant="h3" fontWeight={800} mt={0.25}>
            {pct(v)}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {num(r.secoesTotalizadas)} de {num(r.secoesTotal)} seções
          </Typography>
        </Box>
      </Stack>
    </DashboardCard>
  );
}

// ---------------------------------------------------------------- KPIs

function Kpi({ icone, cor, rotulo, valor, detalhe }: { icone: React.ReactNode; cor: string; rotulo: string; valor: string; detalhe: string }) {
  return (
    <DashboardCard>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1.25, sm: 2 }} alignItems={{ xs: 'flex-start', sm: 'center' }}>
        <Box sx={{ width: 48, height: 48, borderRadius: '12px', display: 'grid', placeItems: 'center', bgcolor: alpha(cor, 0.14), color: cor, flexShrink: 0 }}>
          {icone}
        </Box>
        <Box minWidth={0}>
          <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
            {rotulo}
          </Typography>
          <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: '1.2rem', sm: '1.3125rem' } }}>
            {valor}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {detalhe}
          </Typography>
        </Box>
      </Stack>
    </DashboardCard>
  );
}

export function Kpis({ r }: { r: Resultado }) {
  const theme = useTheme();
  return (
    <Box sx={{ display: 'grid', gap: { xs: 2, sm: 3 }, gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' } }}>
      <Kpi icone={<IconUsers size={24} />} cor={theme.palette.primary.main} rotulo="Comparecimento" valor={pct(r.pctComparecimento)} detalhe={`${compacto(r.comparecimento)} eleitores`} />
      <Kpi icone={<IconUserOff size={24} />} cor={theme.palette.grey[500]} rotulo="Abstenção" valor={pct(r.pctAbstencao)} detalhe={`${compacto(r.abstencao)} eleitores`} />
      <Kpi icone={<IconSquare size={24} />} cor={theme.palette.info.main} rotulo="Brancos" valor={pct(r.pctBrancos)} detalhe={`${compacto(r.brancos)} votos`} />
      <Kpi icone={<IconBan size={24} />} cor={theme.palette.error.main} rotulo="Nulos" valor={pct(r.pctNulos)} detalhe={`${compacto(r.nulos)} votos`} />
    </Box>
  );
}

// ---------------------------------------------------------------- Situação / projeção

export function CardSituacao({ r, escopo, vagas = 1 }: { r: Resultado; escopo: string; vagas?: number }) {
  const theme = useTheme();
  const { cor } = useCores();
  const [a, b] = r.candidatos;
  if (!a) return null;
  const eleitos = r.candidatos.filter((c) => c.eleito);
  const segundoTurno = r.candidatos.filter((c) => /2º/.test(c.situacao));
  const finalizado = r.pctSecoes >= 100 || eleitos.length > 0 || segundoTurno.length > 0;

  let icone = <IconHourglass size={22} />;
  let titulo = '';
  let texto = '';
  let corDestaque = theme.palette.warning.main;

  if (!r.secoesTotalizadas && !a.votos) {
    icone = <IconHourglass size={22} />;
    corDestaque = theme.palette.info.main;
    titulo = 'Apuração ainda não começou';
    texto = `${r.candidatos.length} candidatos. Os votos começam a aparecer depois que as urnas fecham, às 17h (Brasília).`;
  } else if (eleitos.length) {
    icone = <IconTrophy size={22} />;
    corDestaque = theme.palette.success.main;
    titulo = eleitos.length > 1 ? 'Eleitos' : 'Eleito(a)';
    texto = eleitos.map((c) => nomeProprio(c.nome)).join(' e ');
  } else if (segundoTurno.length >= 2) {
    icone = <IconArrowsSplit size={22} />;
    corDestaque = theme.palette.info.main;
    titulo = 'Haverá 2º turno';
    texto = `${nomeProprio(segundoTurno[0].nome)} × ${nomeProprio(segundoTurno[1].nome)}`;
  } else if (vagas === 1 && a.pct > 50) {
    titulo = 'Tendência: vitória no 1º turno';
    texto = `${nomeProprio(a.nome)} tem mais de 50% dos votos válidos até agora.`;
  } else if (vagas === 1 && b) {
    icone = <IconArrowsSplit size={22} />;
    titulo = 'Tendência: 2º turno';
    texto = `Até agora ninguém passa de 50% dos válidos. Disputa: ${nomeProprio(a.nome)} × ${nomeProprio(b.nome)}.`;
  } else {
    titulo = 'Apuração em andamento';
    texto = `${vagas} vagas em disputa.`;
  }

  const diferenca = b ? a.votos - b.votos : 0;

  return (
    <DashboardCard sx={{ borderColor: alpha(corDestaque, 0.5), bgcolor: alpha(corDestaque, 0.06) }}>
      <Stack spacing={1.5} height="100%">
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box sx={{ color: corDestaque, display: 'flex' }}>{icone}</Box>
          <Typography variant="h6">{titulo}</Typography>
          {!finalizado && <Chip size="small" label="parcial" variant="outlined" sx={{ ml: 'auto !important' }} />}
        </Stack>
        <Typography variant="body1" color="text.secondary">
          {texto}
        </Typography>
        {b && a.votos > 0 && (
          <Box sx={{ mt: 'auto !important', pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Diferença entre 1º e 2º colocados
            </Typography>
            <Stack direction="row" alignItems="baseline" spacing={1} flexWrap="wrap">
              <Typography variant="h4" fontWeight={800}>
                {num(diferenca)}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                votos · {(a.pct - b.pct).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} p.p.
              </Typography>
            </Stack>
            <Stack direction="row" spacing={0.25} mt={1} height={10} borderRadius={5} overflow="hidden" aria-hidden>
              <Box sx={{ flex: a.votos || 1, bgcolor: cor(escopo, a, r.candidatos) }} />
              <Box sx={{ flex: b.votos || 1, bgcolor: cor(escopo, b, r.candidatos) }} />
            </Stack>
          </Box>
        )}
      </Stack>
    </DashboardCard>
  );
}

// ---------------------------------------------------------------- Ranking

function BadgeSituacao({ c }: { c: Candidato }) {
  if (c.eleito) return <Chip size="small" color="success" icon={<IconTrophy size={14} />} label="Eleito" sx={{ fontWeight: 700, height: 22 }} />;
  if (/2º/.test(c.situacao)) return <Chip size="small" color="info" label="2º turno" sx={{ fontWeight: 700, height: 22 }} />;
  if (c.situacao && !/não eleito|suplente/i.test(c.situacao)) return <Chip size="small" label={c.situacao} sx={{ height: 22 }} />;
  return null;
}

export function ListaCandidatos({ r, escopo, max, mostrarVice = false }: { r: Resultado; escopo: string; max?: number; mostrarVice?: boolean }) {
  const { cor } = useCores();
  const lista = max ? r.candidatos.slice(0, max) : r.candidatos;
  const lider = r.candidatos[0]?.pct || 1;

  return (
    <Stack component="ol" spacing={2.25} sx={{ listStyle: 'none', m: 0, p: 0 }}>
      {lista.map((c, i) => {
        const corC = cor(escopo, c, r.candidatos);
        return (
          <Box component="li" key={c.numero}>
            <Stack direction="row" spacing={1.75} alignItems="center">
              <Typography variant="body2" color="text.secondary" fontWeight={700} width={18} textAlign="right" flexShrink={0} sx={{ display: { xs: 'none', sm: 'block' } }}>
                {i + 1}º
              </Typography>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <CandidatoAvatar nome={c.nome} foto={c.fotoUrl} cor={corC} tamanho={i === 0 ? 56 : 46} />
              </Box>
              <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                <CandidatoAvatar nome={c.nome} foto={c.fotoUrl} cor={corC} tamanho={40} />
              </Box>
              <Box flexGrow={1} minWidth={0}>
                <Stack direction="row" alignItems="center" spacing={1} justifyContent="space-between">
                  <Box minWidth={0}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant={i === 0 ? 'h6' : 'subtitle1'} fontWeight={700} sx={{ lineHeight: 1.25 }}>
                        {nomeProprio(c.nome)}
                      </Typography>
                      <BadgeSituacao c={c} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {c.partido} · nº {c.numero}
                      {mostrarVice && c.vice ? ` · vice: ${nomeProprio(c.vice)}` : ''}
                    </Typography>
                  </Box>
                  <Box textAlign="right" flexShrink={0}>
                    <Typography variant={i === 0 ? 'h4' : 'h6'} fontWeight={800} sx={{ fontVariantNumeric: 'tabular-nums', fontSize: { xs: i === 0 ? '1.15rem' : '0.95rem', sm: undefined } }}>
                      {pct(c.pct)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {num(c.votos)} votos
                    </Typography>
                  </Box>
                </Stack>
                <Tooltip title={`${pct(c.pct)} dos votos válidos`} placement="top">
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, (c.pct / Math.max(lider, 50)) * 100)}
                    aria-label={`${nomeProprio(c.nome)}: ${pct(c.pct)}`}
                    sx={{
                      mt: 1,
                      height: 8,
                      borderRadius: 4,
                      bgcolor: (t) => alpha(t.palette.text.primary, 0.06),
                      '& .MuiLinearProgress-bar': { bgcolor: corC, borderRadius: 4, transition: 'transform .6s ease' },
                    }}
                  />
                </Tooltip>
              </Box>
            </Stack>
          </Box>
        );
      })}
    </Stack>
  );
}

// ---------------------------------------------------------------- Gráficos

export function GraficoBarras({ r, escopo, altura }: { r: Resultado; escopo: string; altura?: number }) {
  const base = useApexBase();
  const { cor, outros: corOutros } = useCores();
  const { top, outros } = agruparOutros(r.candidatos);
  const nomes = [...top.map((c) => nomeProprio(c.nome)), ...(outros ? [`Outros (${outros.qtd})`] : [])];
  const valores = [...top.map((c) => c.pct), ...(outros ? [outros.pct] : [])];
  const votos = [...top.map((c) => c.votos), ...(outros ? [outros.votos] : [])];
  const cores = [...top.map((c) => cor(escopo, c, r.candidatos)), ...(outros ? [corOutros] : [])];

  const options: ApexOptions = {
    ...base,
    chart: { ...base.chart, type: 'bar' },
    plotOptions: { bar: { horizontal: true, distributed: true, borderRadius: 4, borderRadiusApplication: 'end', barHeight: '62%', dataLabels: { position: 'top' } } },
    colors: cores,
    legend: { show: false },
    xaxis: { categories: nomes, max: Math.min(100, Math.ceil((Math.max(...valores, 10) + 8) / 10) * 10), labels: { formatter: (v) => `${v}%` } },
    yaxis: { labels: { maxWidth: 150, style: { fontSize: '12px', fontWeight: 600 } } },
    grid: { ...base.grid, xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
    dataLabels: {
      enabled: true,
      formatter: (v: number) => pct(v, 1),
      textAnchor: 'start',
      offsetX: 6,
      style: { colors: [base.chart?.foreColor as string], fontWeight: 700, fontSize: '12px' },
    },
    tooltip: { ...base.tooltip, y: { formatter: (v, o) => `${pct(v)} · ${num(votos[o?.dataPointIndex ?? 0])} votos`, title: { formatter: () => '' } } },
  };

  return <Chart type="bar" height={altura ?? Math.max(220, nomes.length * 46 + 40)} series={[{ name: '% válidos', data: valores }]} options={options} />;
}

export function GraficoDonut({ r, escopo }: { r: Resultado; escopo: string }) {
  const base = useApexBase();
  const theme = useTheme();
  const { cor, outros: corOutros } = useCores();
  const { top, outros } = agruparOutros(r.candidatos, 5);
  const nomes = [...top.map((c) => nomeProprio(c.nome).split(' ')[0]), ...(outros ? ['Outros'] : [])];
  const valores = [...top.map((c) => c.votos), ...(outros ? [outros.votos] : [])];
  const cores = [...top.map((c) => cor(escopo, c, r.candidatos)), ...(outros ? [corOutros] : [])];

  const options: ApexOptions = {
    ...base,
    labels: nomes,
    colors: cores,
    stroke: { width: 2, colors: [theme.palette.background.paper] },
    legend: { ...base.legend, position: 'bottom', horizontalAlign: 'center' },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            name: { fontSize: '13px', offsetY: -4 },
            value: { fontSize: '22px', fontWeight: 800, formatter: (v) => compacto(+v) },
            total: { show: true, label: 'Votos válidos', fontSize: '13px', formatter: () => compacto(r.validos || valores.reduce((s, v) => s + v, 0)) },
          },
        },
      },
    },
    tooltip: { ...base.tooltip, y: { formatter: (v) => `${num(v)} votos` } },
  };
  return <Chart type="donut" height={320} series={valores} options={options} />;
}
