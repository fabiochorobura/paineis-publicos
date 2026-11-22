import { useEffect, useState } from 'react';
import {
  Box,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Chart from '../components/Grafico';
import type { ApexOptions } from 'apexcharts';
import {
  IconClockHour4,
  IconFingerprint,
  IconKeyboard,
  IconRefreshAlert,
  IconFileAnalytics,
} from '@tabler/icons-react';
import { CarregandoCards, DashboardCard, EstadoVazio, useApexBase } from '../components/shared';
import { UF_POR_SIGLA } from '../data/ufs';
import { num, pct } from '../utils/formato';

interface Metricas {
  secoes: number;
  eleitores: number;
  tempoMediano: number | null;
  pctBiometria: number | null;
  teclasPorEleitor: number | null;
  teclas: number;
  reiniciadas: number;
}

interface Logs {
  atualizado: string;
  secoesLidas: number;
  secoesTotal: number;
  brasil: Metricas;
  votosPorHora: number[];
  porUF: Record<string, Metricas>;
}

const ATUALIZA_MS = 30_000;

/** resumo gerado no servidor (servidor/logs_urna.py) lendo os logs das urnas seção por seção */
function useLogs() {
  const [logs, setLogs] = useState<Logs | null>(null);
  const [erro, setErro] = useState(false);
  useEffect(() => {
    let vivo = true;
    const carregar = () =>
      fetch(`${import.meta.env.BASE_URL}mapa-dados/logs.json`, { cache: 'no-cache' })
        .then((r) =>
          r.ok ? (r.json() as Promise<Logs>) : Promise.reject(new Error(String(r.status))),
        )
        .then((j) => vivo && (setLogs(j), setErro(false)))
        .catch(() => vivo && setErro(true));
    carregar();
    const id = window.setInterval(carregar, ATUALIZA_MS);
    return () => {
      vivo = false;
      window.clearInterval(id);
    };
  }, []);
  return { logs, erro };
}

const segundos = (s: number | null) =>
  s === null ? '—' : s < 120 ? `${s} s` : `${Math.floor(s / 60)} min ${s % 60} s`;

function Metrica({
  icone,
  valor,
  titulo,
  detalhe,
  cor,
}: {
  icone: React.ReactNode;
  valor: string;
  titulo: string;
  detalhe?: string;
  cor: string;
}) {
  return (
    <DashboardCard>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box sx={{ color: cor, display: 'flex', flexShrink: 0 }}>{icone}</Box>
        <Box minWidth={0}>
          <Typography
            fontSize={{ xs: 26, sm: 30 }}
            fontWeight={800}
            lineHeight={1.15}
            sx={{ color: cor, fontVariantNumeric: 'tabular-nums' }}
          >
            {valor}
          </Typography>
          <Typography fontWeight={600}>{titulo}</Typography>
          {detalhe && (
            <Typography variant="body2" color="text.secondary">
              {detalhe}
            </Typography>
          )}
        </Box>
      </Stack>
    </DashboardCard>
  );
}

export default function LogsUrna() {
  const { logs, erro } = useLogs();
  const theme = useTheme();
  const base = useApexBase();

  if (!logs) {
    return erro ? (
      <DashboardCard>
        <EstadoVazio
          icone={<IconFileAnalytics size={64} stroke={1.2} />}
          titulo="Lendo os primeiros logs"
          texto="O servidor está baixando os logs das urnas, seção por seção. As métricas aparecem aqui em instantes."
        />
      </DashboardCard>
    ) : (
      <CarregandoCards qtd={4} altura={110} />
    );
  }

  const b = logs.brasil;
  const lidoPct = (logs.secoesLidas / Math.max(1, logs.secoesTotal)) * 100;
  const horas = logs.votosPorHora.map((v, h) => ({ h, v })).filter((x) => x.v > 0);
  const pico = horas.length ? horas.reduce((m, x) => (x.v > m.v ? x : m), horas[0]) : null;
  const opcoes: ApexOptions = {
    ...base,
    chart: { ...base.chart, type: 'bar' },
    plotOptions: { bar: { borderRadius: 4, columnWidth: '70%' } },
    dataLabels: { enabled: false },
    colors: [theme.palette.primary.main],
    xaxis: { categories: horas.map((x) => `${x.h}h`) },
    yaxis: { labels: { formatter: (v: number) => num(v) } },
    tooltip: { y: { formatter: (v: number) => `${num(v)} votos` } },
    grid: { borderColor: theme.palette.divider, strokeDashArray: 4 },
  };
  const ufs = Object.entries(logs.porUF).sort((x, y) => x[0].localeCompare(y[0]));

  return (
    <Stack spacing={{ xs: 1.5, sm: 3 }}>
      <DashboardCard>
        <Typography variant="body2" color="text.secondary">
          Cada urna grava um log de tudo o que acontece nela. O TSE publica esses arquivos seção por
          seção; o servidor da Chorobura Sistemas baixa cada um, lê linha por linha e soma as
          métricas abaixo. As seções são lidas numa ordem embaralhada, com todos os estados
          misturados, então os números já valem para o Brasil mesmo antes de terminar.
        </Typography>
        <Stack direction="row" justifyContent="space-between" mt={2} mb={0.75} spacing={1}>
          <Typography fontWeight={700}>
            {num(logs.secoesLidas)} de {num(logs.secoesTotal)} seções lidas
          </Typography>
          <Typography color="text.secondary" noWrap>
            {pct(lidoPct, 1)} ·{' '}
            {new Date(logs.atualizado).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={Math.min(100, lidoPct)}
          sx={{ height: 8, borderRadius: 4 }}
        />
        <Typography variant="body2" color="text.secondary" mt={0.75}>
          {num(b.eleitores)} eleitores nos logs lidos até agora · 1º turno · 04/10/2026
        </Typography>
      </DashboardCard>

      <Box
        sx={{
          display: 'grid',
          gap: { xs: 1.5, sm: 3 },
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' },
        }}
      >
        <Metrica
          icone={<IconClockHour4 size={40} stroke={1.5} />}
          valor={segundos(b.tempoMediano)}
          titulo="tempo mediano para votar"
          detalhe="da liberação do eleitor ao voto computado"
          cor={theme.palette.primary.main}
        />
        <Metrica
          icone={<IconFingerprint size={40} stroke={1.5} />}
          valor={b.pctBiometria === null ? '—' : pct(b.pctBiometria, 1)}
          titulo="dos eleitores liberados pela digital"
          cor={theme.palette.success.main}
        />
        <Metrica
          icone={<IconKeyboard size={40} stroke={1.5} />}
          valor={b.teclasPorEleitor === null ? '—' : b.teclasPorEleitor.toLocaleString('pt-BR')}
          titulo="“teclas indevidas” por eleitor"
          detalhe={`${num(b.teclas)} no total`}
          cor={theme.palette.warning.main}
        />
        <Metrica
          icone={<IconRefreshAlert size={40} stroke={1.5} />}
          valor={num(b.reiniciadas)}
          titulo="urnas que reiniciaram com a votação aberta"
          detalhe={`${pct((b.reiniciadas / Math.max(1, b.secoes)) * 100, 1)} das seções lidas`}
          cor={theme.palette.error.main}
        />
      </Box>

      <DashboardCard
        titulo="Votos por hora"
        subtitulo={pico ? `Pico às ${pico.h}h · horário local de cada urna` : undefined}
      >
        <Chart
          type="bar"
          height={300}
          options={opcoes}
          series={[{ name: 'Votos', data: horas.map((x) => x.v) }]}
        />
      </DashboardCard>

      <DashboardCard titulo="Por estado" subtitulo="Métricas dos logs lidos em cada UF">
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>UF</TableCell>
                <TableCell align="right">Seções</TableCell>
                <TableCell align="right">Eleitores</TableCell>
                <TableCell align="right">Tempo</TableCell>
                <TableCell align="right">Digital</TableCell>
                <TableCell align="right">Teclas</TableCell>
                <TableCell align="right">Reinícios</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ufs.map(([uf, m]) => (
                <TableRow key={uf} hover>
                  <TableCell sx={{ fontWeight: 700 }} title={UF_POR_SIGLA[uf.toUpperCase()]?.nome}>
                    {uf.toUpperCase()}
                  </TableCell>
                  <TableCell align="right">{num(m.secoes)}</TableCell>
                  <TableCell align="right">{num(m.eleitores)}</TableCell>
                  <TableCell align="right">{segundos(m.tempoMediano)}</TableCell>
                  <TableCell align="right">
                    {m.pctBiometria === null ? '—' : pct(m.pctBiometria, 1)}
                  </TableCell>
                  <TableCell align="right">
                    {m.teclasPorEleitor === null ? '—' : m.teclasPorEleitor.toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell align="right">{num(m.reiniciadas)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DashboardCard>
    </Stack>
  );
}
