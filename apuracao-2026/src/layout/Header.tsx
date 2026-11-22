import { useEffect, useState } from 'react';
import {
  Box,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Popover,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha, keyframes, useTheme } from '@mui/material/styles';
import {
  IconRefresh,
  IconSettings,
  IconMoon,
  IconSun,
  IconFlask,
  IconPlugConnected,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { INTERVALOS, useEleicao } from '../context/EleicaoContext';
import { hora, num, pct } from '../utils/formato';
import ClimaHeader from '../clima/ClimaHeader';
import { useOnline } from '../utils/useOnline';

const pulso = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(19, 222, 185, .7); }
  70% { box-shadow: 0 0 0 8px rgba(19, 222, 185, 0); }
  100% { box-shadow: 0 0 0 0 rgba(19, 222, 185, 0); }
`;

/** mantém "Atualizando…" visível por pelo menos 900ms, para não piscar rápido demais */
function useAtualizandoVisivel(atualizando: boolean) {
  const [visivel, setVisivel] = useState(false);
  useEffect(() => {
    if (atualizando) {
      setVisivel(true);
      return;
    }
    const t = window.setTimeout(() => setVisivel(false), 900);
    return () => window.clearTimeout(t);
  }, [atualizando]);
  return visivel;
}

function IndicadorCiclo({ valor, aoVivo = false }: { valor: number; aoVivo?: boolean }) {
  return (
    <Box component="span" sx={{ position: 'relative', width: 18, height: 18, ml: '7px !important', display: 'inline-grid', placeItems: 'center' }}>
      <CircularProgress variant="determinate" value={valor} size={18} thickness={5} color="inherit" />
      {aoVivo ? (
        <Box component="span" sx={{ position: 'absolute', width: 5, height: 5, borderRadius: '50%', bgcolor: 'currentColor', animation: `${pulso} 1.6s infinite` }} />
      ) : (
        <IconPlugConnected size={9} style={{ position: 'absolute' }} />
      )}
    </Box>
  );
}

/**
 * Selo de status (largura fixa para não mexer o layout):
 * Conectando… → Conectado (TSE respondeu, sem resultados) → AO VIVO (com resultados);
 * "Atualizando…" durante cada busca.
 */
export function StatusChip({ compacto = false }: { compacto?: boolean } = {}) {
  const { status, modo, atualizando, proximaEm, intervalo } = useEleicao();
  const buscando = useAtualizandoVisivel(atualizando);
  const [agora, setAgora] = useState(Date.now());
  useEffect(() => {
    if (modo !== 'oficial') return;
    const id = window.setInterval(() => setAgora(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [modo]);
  const totalMs = Math.max(1, intervalo * 1000);
  const restanteMs = Math.max(0, proximaEm - agora);
  const progresso = proximaEm ? Math.max(0, Math.min(100, 100 - (restanteMs / totalMs) * 100)) : 0;
  const base = {
    fontWeight: 700,
    width: compacto ? 106 : 148,
    justifyContent: 'flex-start',
    '& .MuiChip-label': { flex: 1, textAlign: 'center', px: compacto ? 0.5 : undefined, fontSize: compacto ? 11 : undefined },
  };

  if (modo === 'simulacao')
    return (
      <Chip
        icon={<IconFlask size={16} />}
        label="SIMULAÇÃO"
        color="warning"
        size="small"
        sx={base}
      />
    );
  if (buscando && status !== 'carregando')
    return (
      <Chip
        icon={
          <CircularProgress size={12} thickness={6} color="inherit" sx={{ ml: '8px !important' }} />
        }
        label="Atualizando…"
        size="small"
        color="info"
        sx={base}
      />
    );
  if (status === 'aovivo')
    return (
      <Chip
        label="AO VIVO"
        size="small"
        color="success"
        icon={<IndicadorCiclo valor={progresso} aoVivo />}
        sx={{ ...base, fontWeight: 800, letterSpacing: 0.5 }}
      />
    );
  if (status === 'aguardando')
    return (
      <Tooltip title="O TSE está respondendo; os resultados aparecem quando a apuração começar">
        <Chip
          icon={<IndicadorCiclo valor={progresso} />}
          label="Conectado"
          size="small"
          color="primary"
          variant="outlined"
          sx={base}
        />
      </Tooltip>
    );
  if (status === 'erro')
    return (
      <Chip
        icon={<IconAlertTriangle size={16} />}
        label="Sem conexão"
        size="small"
        color="error"
        sx={base}
      />
    );
  return (
    <Chip
      icon={
        <CircularProgress size={12} thickness={6} color="inherit" sx={{ ml: '8px !important' }} />
      }
      label="Conectando…"
      size="small"
      variant="outlined"
      sx={base}
    />
  );
}

/** contagem regressiva com estado próprio para não re-renderizar o painel inteiro */
function Contagem() {
  const { proximaEm, intervalo, atualizando, ultimaAtualizacao } = useEleicao();
  const [agora, setAgora] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setAgora(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const restante = Math.max(0, Math.ceil((proximaEm - agora) / 1000));
  const progresso = atualizando ? undefined : 100 - (restante / intervalo) * 100;

  return (
    <Tooltip title={`Atualiza automaticamente a cada ${intervalo}s`}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
          <CircularProgress
            variant={atualizando ? 'indeterminate' : 'determinate'}
            value={progresso}
            size={30}
            thickness={4}
            aria-label="Próxima atualização"
          />
          <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
            <Typography variant="caption" fontSize={10} fontWeight={700}>
              {atualizando ? '' : restante}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
          <Typography variant="caption" color="text.secondary" display="block" lineHeight={1.1}>
            Atualizado às
          </Typography>
          <Typography variant="body2" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {hora(ultimaAtualizacao)}
          </Typography>
        </Box>
      </Stack>
    </Tooltip>
  );
}

function Configuracoes({ alternarTema }: { alternarTema: () => void }) {
  const theme = useTheme();
  const { modo, intervalo, setIntervalo } = useEleicao();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const Secao = ({ titulo, children }: { titulo: string; children: React.ReactNode }) => (
    <Box mb={2}>
      <Typography
        variant="caption"
        fontWeight={700}
        color="text.secondary"
        display="block"
        mb={0.75}
        sx={{ letterSpacing: 0.8 }}
      >
        {titulo.toUpperCase()}
      </Typography>
      {children}
    </Box>
  );

  return (
    <>
      <Tooltip title="Configurações">
        <IconButton onClick={(e) => setAnchor(e.currentTarget)} aria-label="Abrir configurações">
          <IconSettings size={22} />
        </IconButton>
      </Tooltip>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { p: 2.5, width: 320, maxWidth: 'calc(100vw - 32px)', mt: 1 } } }}
      >
        <Typography variant="h6" mb={2}>
          Configurações
        </Typography>
        <Secao titulo="Atualizar a cada">
          <ToggleButtonGroup
            fullWidth
            size="small"
            exclusive
            value={intervalo}
            disabled={modo === 'simulacao'}
            onChange={(_, v) => v && setIntervalo(v)}
          >
            {INTERVALOS.map((s) => (
              <ToggleButton key={s} value={s}>
                {s < 60
                  ? `${s}s`
                  : s % 60
                    ? `${Math.floor(s / 60)}min${String(s % 60).padStart(2, '0')}s`
                    : `${s / 60}min`}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Secao>
        <Divider sx={{ mb: 2 }} />
        <ToggleButton value="tema" fullWidth size="small" onChange={alternarTema}>
          {theme.palette.mode === 'dark' ? (
            <IconSun size={16} style={{ marginRight: 6 }} />
          ) : (
            <IconMoon size={16} style={{ marginRight: 6 }} />
          )}
          {theme.palette.mode === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}
        </ToggleButton>
      </Popover>
    </>
  );
}

/** 1º ou 2º turno, sempre à vista no topo: todas as telas mostram o turno escolhido */
function SeletorTurno({ compacto }: { compacto: boolean }) {
  const { turno, setTurno, eleicoes } = useEleicao();
  return (
    <ToggleButtonGroup
      size="small"
      exclusive
      value={turno}
      onChange={(_, v) => v && setTurno(v)}
      aria-label="Turno"
      sx={{
        flexShrink: 0,
        '& .MuiToggleButton-root': { px: compacto ? 1 : 1.75, fontWeight: 700, whiteSpace: 'nowrap' },
        '& .MuiToggleButton-root.Mui-selected, & .MuiToggleButton-root.Mui-selected:hover': { bgcolor: 'primary.main', color: 'primary.contrastText' },
      }}
    >
      <ToggleButton value={1}>{compacto ? '1º' : '1º turno'}</ToggleButton>
      <ToggleButton value={2} disabled={!eleicoes?.segundoTurnoDisponivel && turno !== 2}>
        {compacto ? '2º' : '2º turno'}
      </ToggleButton>
    </ToggleButtonGroup>
  );
}

interface Props {
  titulo: string;
  subtitulo: string;
  alternarTema: () => void;
  compacto: boolean;
}

export default function Header({ titulo, subtitulo, alternarTema, compacto }: Props) {
  const theme = useTheme();
  const { atualizar, atualizando, brasil } = useEleicao();
  const online = useOnline();

  return (
    <Box
      component="header"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 1100,
        backdropFilter: 'blur(10px)',
        bgcolor: alpha(theme.palette.background.default, 0.85),
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{ px: { xs: 2, sm: 3, lg: 4 }, py: 1.5, maxWidth: 1480, mx: 'auto' }}
      >
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography variant={compacto ? 'h6' : 'h4'} noWrap component="h1">
            {titulo}
          </Typography>
          {!compacto && (
            <Typography variant="body1" color="text.secondary" noWrap>
              {subtitulo}
            </Typography>
          )}
        </Box>
        <SeletorTurno compacto={compacto} />
        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
          <StatusChip />
        </Box>
        <Contagem />
        <Tooltip title="Atualizar agora">
          <span>
            <IconButton onClick={atualizar} disabled={atualizando} aria-label="Atualizar agora">
              <IconRefresh size={22} />
            </IconButton>
          </span>
        </Tooltip>
        {!compacto && (
          <Tooltip title={theme.palette.mode === 'dark' ? 'Tema claro' : 'Tema escuro'}>
            <IconButton onClick={alternarTema} aria-label="Alternar tema">
              {theme.palette.mode === 'dark' ? <IconSun size={22} /> : <IconMoon size={22} />}
            </IconButton>
          </Tooltip>
        )}
        <Configuracoes alternarTema={alternarTema} />
      </Stack>
      {/* mesmos indicadores do topo do modo TV; quebra linha no celular */}
      <Stack
        direction="row"
        alignItems="center"
        flexWrap="wrap"
        columnGap={2.5}
        rowGap={0.5}
        sx={{ px: { xs: 2, sm: 3, lg: 4 }, pb: 1, maxWidth: 1480, mx: 'auto' }}
      >
        <ClimaHeader compacto />
        {brasil && (
          <Typography fontSize={13} color="text.secondary" noWrap>
            Urnas apuradas{' '}
            <Box
              component="span"
              sx={{
                fontWeight: 800,
                fontSize: 15,
                color: 'text.primary',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {pct(brasil.pctSecoes)}
            </Box>
          </Typography>
        )}
        {online !== null && (
          <Typography fontSize={14} fontWeight={700} color="success.main" noWrap>
            ● {num(online)} online
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
