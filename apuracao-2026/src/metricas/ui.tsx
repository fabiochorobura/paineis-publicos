import { ReactNode } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { IconInfoCircle } from '@tabler/icons-react';

/** card no mesmo desenho dos cards do Modo TV */
export function Painel({ titulo, subtitulo, acoes, children }: { titulo: string; subtitulo?: ReactNode; acoes?: ReactNode; children: ReactNode }) {
  return (
    <Box component="section" sx={{ minWidth: 0, bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: '18px', p: { xs: 1.5, sm: 2 } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'flex-start' }} mb={1.5}>
        <Box minWidth={0}>
          <Typography component="h2" fontSize={17} fontWeight={800}>
            {titulo}
          </Typography>
          {subtitulo && (
            <Typography fontSize={13} color="text.secondary">
              {subtitulo}
            </Typography>
          )}
        </Box>
        {acoes && <Box flexShrink={0}>{acoes}</Box>}
      </Stack>
      {children}
    </Box>
  );
}

export function Indicador({ rotulo, valor, detalhe }: { rotulo: string; valor: ReactNode; detalhe?: ReactNode }) {
  return (
    <Box sx={{ minWidth: 0, bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: '16px', p: 1.75, height: '100%' }}>
      <Typography fontSize={12} fontWeight={700} color="text.secondary" letterSpacing={0.4}>
        {rotulo}
      </Typography>
      <Typography fontSize={24} fontWeight={800} lineHeight={1.25} mt={0.25}>
        {valor}
      </Typography>
      {detalhe && (
        <Typography fontSize={12.5} color="text.secondary" mt={0.25}>
          {detalhe}
        </Typography>
      )}
    </Box>
  );
}

/** explicação curta de como ler o gráfico; fica colada a ele */
export function Nota({ children }: { children: ReactNode }) {
  return (
    <Stack direction="row" spacing={1} sx={{ mt: 1.5, p: 1.25, borderRadius: '12px', bgcolor: (t) => alpha(t.palette.primary.main, 0.06) }}>
      <Box sx={{ color: 'primary.main', flexShrink: 0, pt: '1px' }}>
        <IconInfoCircle size={18} />
      </Box>
      <Typography component="div" fontSize={13} color="text.secondary" sx={{ '& b': { color: 'text.primary' } }}>
        {children}
      </Typography>
    </Stack>
  );
}

/** grade responsiva de indicadores */
export function Indicadores({ children }: { children: ReactNode }) {
  return <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, minmax(0, 1fr))' } }}>{children}</Box>;
}
