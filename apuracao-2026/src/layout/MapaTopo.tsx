import { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import { useEleicao } from '../context/EleicaoContext';
import { DashboardCard } from '../components/shared';
import { LegendaMapa } from '../components/mapa';
import { MapaPresidente } from '../components/MapaPresidente';
import { ESCOPO_PRESIDENTE } from '../pages/Nacional';

/** Mapa de Presidente por estado no topo das páginas; os detalhes de cada página vêm abaixo. */
export default function MapaTopo({
  onSelect,
  lado,
}: {
  onSelect: (uf: string) => void;
  /** conteúdo ao lado do mapa (cards da página); sem ele, título e legenda */
  lado?: ReactNode;
}) {
  const { brasil, estados } = useEleicao();
  if (!brasil) return null;
  return (
    <DashboardCard sx={{ height: 'auto', mt: { xs: 1.5, sm: 2.5 } }}>
      <Box
        sx={{
          display: 'grid',
          gap: { xs: 1.5, md: 3 },
          gridTemplateColumns: lado
            ? { xs: '1fr', lg: 'minmax(0, 5fr) minmax(0, 7fr)' }
            : { xs: '1fr', md: 'minmax(0, 560px) 1fr' },
          alignItems: 'center',
        }}
      >
        {lado ? (
          <>
            <Box>
              <MapaPresidente
                brasil={brasil}
                estados={estados}
                escopo={ESCOPO_PRESIDENTE}
                onSelect={onSelect}
              />
              <Box mt={1}>
                <LegendaMapa
                  estados={estados}
                  referencia={brasil.candidatos}
                  escopo={ESCOPO_PRESIDENTE}
                />
              </Box>
            </Box>
            <Box minWidth={0}>{lado}</Box>
          </>
        ) : (
          <>
            <MapaPresidente
              brasil={brasil}
              estados={estados}
              escopo={ESCOPO_PRESIDENTE}
              onSelect={onSelect}
            />
            <Box>
              <Typography variant="h5" component="h2">
                Presidente: líder por estado
              </Typography>
              <Typography variant="subtitle2" color="text.secondary" mt={0.25} mb={1.5}>
                Toque em um estado para ver os detalhes. Cores mais claras = menos urnas apuradas.
              </Typography>
              <LegendaMapa
                estados={estados}
                referencia={brasil.candidatos}
                escopo={ESCOPO_PRESIDENTE}
              />
            </Box>
          </>
        )}
      </Box>
    </DashboardCard>
  );
}
