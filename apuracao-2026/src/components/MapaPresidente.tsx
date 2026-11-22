import { Box, useMediaQuery } from '@mui/material';
import { Resultado } from '../api/tipos';
import { useCores } from '../utils/cores';
import { MapaBrasil, PreenchimentoUF } from '../tv/MapaBrasil';

/** O mesmo mapa do Brasil do modo TV, ocupando a largura do card; toque no estado abre os detalhes. */
export function MapaPresidente({
  brasil,
  estados,
  escopo,
  onSelect,
}: {
  brasil: Resultado;
  estados: Record<string, Resultado>;
  escopo: string;
  onSelect?: (uf: string) => void;
}) {
  const { cor } = useCores();
  const celular = useMediaQuery('(max-width:599px)');
  const preenchimento: Record<string, PreenchimentoUF> = {};
  Object.entries(estados).forEach(([uf, r]) => {
    const l = r.candidatos[0];
    if (!l || l.votos <= 0) return;
    preenchimento[uf] = {
      cor: cor(escopo, l, brasil.candidatos),
      intensidade: r.pctSecoes / 100,
      rotulo: `${Math.round(l.pct)}%`,
    };
  });
  // os rótulos dos estados pequenos do litoral ficam do lado de fora: sobra 9% à direita para eles
  return (
    <Box sx={{ width: '100%', maxWidth: 560, mx: 'auto', pr: '9%' }}>
      <MapaBrasil
        preenchimento={preenchimento}
        largura="100%"
        altura="auto"
        onSelect={onSelect}
        escalaRotulo={celular ? 1.6 : 1}
      />
    </Box>
  );
}
