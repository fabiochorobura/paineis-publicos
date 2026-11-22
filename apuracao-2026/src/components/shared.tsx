import { ReactNode, useState } from 'react';
import { Avatar, Box, Card, CardContent, Skeleton, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { IconBox } from '@tabler/icons-react';
import type { ApexOptions } from 'apexcharts';
import { iniciais, nomeProprio } from '../utils/formato';

/** Card no padrão do template Modernize. */
export function DashboardCard({
  titulo,
  subtitulo,
  acao,
  children,
  sx,
  p = 3,
}: {
  titulo?: ReactNode;
  subtitulo?: ReactNode;
  acao?: ReactNode;
  children: ReactNode;
  sx?: object;
  p?: number;
}) {
  return (
    <Card variant="outlined" sx={{ height: '100%', borderRadius: '14px', ...sx }}>
      <CardContent sx={{ p: { xs: 1.75, sm: p }, '&:last-child': { pb: { xs: 1.75, sm: p } }, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {(titulo || acao) && (
          <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="flex-start" mb={{ xs: 1.5, sm: 2.5 }}>
            <Box minWidth={0}>
              {titulo && (
                <Typography variant="h5" component="h2">
                  {titulo}
                </Typography>
              )}
              {subtitulo && (
                <Typography variant="subtitle2" color="text.secondary" mt={0.25}>
                  {subtitulo}
                </Typography>
              )}
            </Box>
            {acao && <Box sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}>{acao}</Box>}
          </Stack>
        )}
        <Box flexGrow={1} minWidth={0}>
          {children}
        </Box>
      </CardContent>
    </Card>
  );
}

export function CandidatoAvatar({ nome, foto, cor, tamanho = 48 }: { nome: string; foto: string | null; cor: string; tamanho?: number }) {
  const [falhou, setFalhou] = useState(false);
  return (
    <Avatar
      src={!falhou && foto ? foto : undefined}
      alt={nomeProprio(nome)}
      imgProps={{ onError: () => setFalhou(true), loading: 'lazy' }}
      sx={{
        width: tamanho,
        height: tamanho,
        bgcolor: cor,
        color: '#fff',
        fontWeight: 700,
        fontSize: tamanho * 0.36,
        border: `3px solid ${cor}`,
        boxSizing: 'border-box',
      }}
    >
      {iniciais(nomeProprio(nome))}
    </Avatar>
  );
}

export function EstadoVazio({ titulo, texto, icone }: { titulo: string; texto: string; icone?: ReactNode }) {
  return (
    <Stack alignItems="center" textAlign="center" spacing={1.5} py={6} px={2}>
      <Box sx={{ color: 'text.secondary', opacity: 0.6 }}>{icone ?? <IconBox size={56} stroke={1.2} />}</Box>
      <Typography variant="h5">{titulo}</Typography>
      <Typography color="text.secondary" maxWidth={420}>
        {texto}
      </Typography>
    </Stack>
  );
}

export function CarregandoCards({ qtd = 4, altura = 120 }: { qtd?: number; altura?: number }) {
  return (
    <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: `repeat(${qtd}, 1fr)` } }}>
      {Array.from({ length: qtd }, (_, i) => (
        <Skeleton key={i} variant="rounded" height={altura} sx={{ borderRadius: '14px' }} />
      ))}
    </Box>
  );
}

/** Opções base dos gráficos ApexCharts: tipografia, cores de tinta e grade recessiva. */
export function useApexBase(): ApexOptions {
  const theme = useTheme();
  const escuro = theme.palette.mode === 'dark';
  return {
    chart: {
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      foreColor: escuro ? '#a7b0c0' : '#5A6A85',
      toolbar: { show: false },
      zoom: { enabled: false },
      background: 'transparent',
      animations: { enabled: true, easing: 'easeinout', speed: 500, dynamicAnimation: { enabled: true, speed: 450 } },
      locales: [
        {
          name: 'pt-br',
          options: {
            months: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
            shortMonths: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
            days: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
            shortDays: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
          },
        },
      ],
      defaultLocale: 'pt-br',
    },
    theme: { mode: escuro ? 'dark' : 'light' },
    grid: { borderColor: escuro ? '#2c3444' : '#e9edf3', strokeDashArray: 3 },
    dataLabels: { enabled: false },
    legend: { fontWeight: 500, markers: { radius: 12 } as never },
    tooltip: { theme: escuro ? 'dark' : 'light' },
    states: { hover: { filter: { type: 'darken', value: 0.9 } as never } },
  };
}
