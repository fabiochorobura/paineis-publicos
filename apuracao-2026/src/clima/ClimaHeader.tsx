import { useEffect, useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import {
  IconSun,
  IconMoon,
  IconCloud,
  IconCloudRain,
  IconCloudStorm,
  IconCloudFog,
  IconSunHigh,
  IconDroplet,
  IconWind,
} from '@tabler/icons-react';
import { ClimaCidade, descricaoTempo, useClima } from './useClima';

function IconeTempo({ codigo, dia, tamanho }: { codigo: number; dia: boolean; tamanho: number }) {
  const props = { size: tamanho, stroke: 1.6 };
  if (codigo === 0) return dia ? <IconSun {...props} color="#f5a300" /> : <IconMoon {...props} />;
  if (codigo <= 2) return <IconSunHigh {...props} color="#f5a300" />;
  if (codigo === 3) return <IconCloud {...props} />;
  if (codigo <= 48) return <IconCloudFog {...props} />;
  if (codigo <= 82) return <IconCloudRain {...props} color="#2a78d6" />;
  return <IconCloudStorm {...props} color="#6b4fd8" />;
}

const TROCA_CIDADE_MS = 12000;

/** versão pequena para a faixa de indicadores do site (celular e computador) */
function ClimaCompacto({ cidade, tempo, mini = false }: ClimaCidade & { mini?: boolean }) {
  return (
    <Stack direction="row" spacing={mini ? 0.4 : 1} alignItems="center" minWidth={0}>
      <IconeTempo codigo={tempo.codigo} dia={tempo.dia} tamanho={mini ? 20 : 26} />
      <Typography fontSize={mini ? 15 : 17} fontWeight={800} lineHeight={1.2}>
        {Math.round(tempo.temperatura)}°
      </Typography>
      <Typography fontSize={13} color="text.secondary" noWrap lineHeight={1.2} sx={{ display: mini ? 'none' : 'block' }}>
        {cidade.nome}-{cidade.uf} · {descricaoTempo(tempo.codigo)}
      </Typography>
      <Typography
        fontSize={13}
        color="text.secondary"
        noWrap
        lineHeight={1.2}
        sx={{ display: { xs: 'none', md: 'block' } }}
      >
        · {Math.round(tempo.min)}°/{Math.round(tempo.max)}° · umidade {tempo.umidade}% · chuva{' '}
        {tempo.chanceChuva}%
      </Typography>
    </Stack>
  );
}

export default function ClimaHeader({ compacto = false, mini = false }: { compacto?: boolean; mini?: boolean }) {
  const climas = useClima();
  const [c, setC] = useState(0);

  // alterna entre as cidades
  useEffect(() => {
    if (climas.length < 2) return;
    const id = window.setInterval(() => setC((x) => x + 1), TROCA_CIDADE_MS);
    return () => window.clearInterval(id);
  }, [climas.length]);

  const atual = climas.length ? climas[c % climas.length] : null;

  if (!atual) return null;
  if (compacto) return <ClimaCompacto {...atual} mini={mini} />;
  const { cidade, tempo } = atual;

  return (
    <Stack direction="row" spacing={2} alignItems="center">
      {/* larguras fixas: o topo da TV não pode "pular" quando os valores mudam */}
      <Stack direction="row" spacing={1.25} alignItems="center" width={450} flexShrink={0}>
        <IconeTempo codigo={tempo.codigo} dia={tempo.dia} tamanho={48} />
        <Box width={195} flexShrink={0}>
          <Stack direction="row" spacing={1} alignItems="baseline">
            <Typography fontSize={34} fontWeight={800} lineHeight={1}>
              {Math.round(tempo.temperatura)}°
            </Typography>
            <Typography
              fontSize={15}
              color="text.secondary"
              sx={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {Math.round(tempo.min)}° / {Math.round(tempo.max)}°
            </Typography>
          </Stack>
          <Typography fontSize={14} color="text.secondary" noWrap>
            {cidade.nome}-{cidade.uf} · {descricaoTempo(tempo.codigo)}
          </Typography>
        </Box>
        <Stack spacing={0.25} pl={0.5} minWidth={0}>
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: 'text.secondary' }}>
            <IconDroplet size={16} />
            <Typography fontSize={14} fontWeight={600}>
              {tempo.umidade}% · chuva {tempo.chanceChuva}%
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: 'text.secondary' }}>
            <IconWind size={16} />
            <Typography fontSize={14} fontWeight={600}>
              {Math.round(tempo.vento)} km/h · sensação {Math.round(tempo.sensacao)}°
            </Typography>
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
}
