import { ReactNode } from 'react';
import {
  Box,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  Theme,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Link,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  IconFlag,
  IconMap2,
  IconChartBar,
  IconMapPin,
  IconExternalLink,
  IconDeviceTv,
  IconWorld,
  IconFileAnalytics,
} from '@tabler/icons-react';
import MapaTopo from './MapaTopo';
import Header from './Header';
import StatusBanner from './StatusBanner';

export type Pagina = 'nacional' | 'mapa' | 'regioes' | 'estado' | 'internacionais' | 'logs' | 'tv';

export const NAV: {
  id: Pagina;
  titulo: string;
  curto: string;
  icon: typeof IconFlag;
  descricao: string;
}[] = [
  {
    id: 'nacional',
    titulo: 'Presidente · Brasil',
    curto: 'Brasil',
    icon: IconFlag,
    descricao: 'Resultado nacional para Presidente',
  },
  {
    id: 'mapa',
    titulo: 'Mapa por estado',
    curto: 'Mapa',
    icon: IconMap2,
    descricao: 'Quem lidera em cada estado',
  },
  {
    id: 'regioes',
    titulo: 'Regiões',
    curto: 'Regiões',
    icon: IconChartBar,
    descricao: 'Comparativo entre as 5 regiões',
  },
  {
    id: 'estado',
    titulo: 'Meu estado',
    curto: 'Meu estado',
    icon: IconMapPin,
    descricao: 'Governador, Senado e Deputados',
  },
  {
    id: 'internacionais',
    titulo: 'Internacionais',
    curto: 'Exterior',
    icon: IconWorld,
    descricao: 'Votos para Presidente no exterior',
  },
  {
    id: 'logs',
    titulo: 'Logs da urna',
    curto: 'Logs',
    icon: IconFileAnalytics,
    descricao: 'O que as urnas registraram',
  },
];

const LARGURA_SIDEBAR = 264;

interface Props {
  pagina: Pagina;
  navegar: (p: Pagina, uf?: string) => void;
  alternarTema: () => void;
  children: ReactNode;
}

/** páginas que abrem com o mapa no topo, logo abaixo do cabeçalho */
// 'Meu estado' monta o próprio topo: mapa nacional + estado/cargo + mapa das cidades
// 'Regiões' e 'Mapa por estado' montam o topo com os cards ao lado do mapa
const COM_MAPA: Pagina[] = ['nacional'];

function Logo() {
  return (
    <Stack direction="row" alignItems="center" spacing={1.5} px={3} py={3}>
      <Box
        component="img"
        src={`${import.meta.env.BASE_URL}icone-chorobura.png`}
        alt="Chorobura Sistemas"
        sx={{ width: 40, height: 40, display: 'block', flexShrink: 0 }}
      />
      <Box>
        <Typography variant="h5" fontWeight={800} lineHeight={1.1}>
          Apuração 2026
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Eleições gerais · ao vivo
        </Typography>
      </Box>
    </Stack>
  );
}

function Sidebar({ pagina, navegar }: Pick<Props, 'pagina' | 'navegar'>) {
  return (
    <Box
      component="nav"
      aria-label="Navegação principal"
      sx={{
        width: LARGURA_SIDEBAR,
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
        borderRight: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Logo />
      <Typography
        variant="caption"
        fontWeight={700}
        color="text.secondary"
        px={3}
        mt={1}
        mb={1}
        sx={{ letterSpacing: 1 }}
      >
        PAINÉIS
      </Typography>
      <List sx={{ px: 2 }}>
        {NAV.map(({ id, titulo, icon: Icon, descricao }) => {
          const ativo = pagina === id;
          return (
            <ListItemButton
              key={id}
              selected={ativo}
              onClick={() => navegar(id)}
              aria-current={ativo ? 'page' : undefined}
              sx={{
                borderRadius: '10px',
                mb: 0.5,
                py: 1.1,
                '&.Mui-selected, &.Mui-selected:hover': { bgcolor: 'primary.main', color: '#fff' },
                '&.Mui-selected .MuiListItemIcon-root, &.Mui-selected .MuiListItemText-secondary': {
                  color: '#fff',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 38, color: 'text.secondary' }}>
                <Icon size={21} stroke={1.6} />
              </ListItemIcon>
              <ListItemText
                primary={titulo}
                secondary={descricao}
                primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }}
                secondaryTypographyProps={{ fontSize: 11.5, sx: { opacity: 0.8 } }}
              />
            </ListItemButton>
          );
        })}
      </List>
      <Box px={2} mt={2}>
        <ListItemButton
          onClick={() => navegar('tv')}
          sx={{
            borderRadius: '10px',
            py: 1.1,
            border: 1,
            borderColor: 'primary.main',
            color: 'primary.main',
          }}
        >
          <ListItemIcon sx={{ minWidth: 38, color: 'primary.main' }}>
            <IconDeviceTv size={21} stroke={1.6} />
          </ListItemIcon>
          <ListItemText
            primary="Modo TV"
            secondary="Tela cheia com painéis alternando"
            primaryTypographyProps={{ fontWeight: 700, fontSize: 14 }}
            secondaryTypographyProps={{ fontSize: 11.5 }}
          />
        </ListItemButton>
      </Box>
      <Box mt="auto" p={2}>
        <Box
          sx={{ p: 2, borderRadius: '14px', bgcolor: (t) => alpha(t.palette.primary.main, 0.08) }}
        >
          <Typography variant="subtitle2" fontWeight={700} mb={0.5}>
            Informações oficiais coletadas no TSE
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={1}>
            Os números vêm direto da divulgação pública do Tribunal Superior Eleitoral. Painel
            independente feito pela Chorobura Sistemas.
          </Typography>
          <Link
            href="https://resultados.tse.jus.br/oficial/app/index.html"
            target="_blank"
            rel="noopener"
            variant="body2"
            fontWeight={600}
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
          >
            Ver no site do TSE <IconExternalLink size={14} />
          </Link>
        </Box>
      </Box>
    </Box>
  );
}

export default function Layout({ pagina, navegar, alternarTema, children }: Props) {
  const desktop = useMediaQuery((t: Theme) => t.breakpoints.up('lg'));
  const atual = NAV.find((n) => n.id === pagina) ?? NAV[0];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {desktop && <Sidebar pagina={pagina} navegar={navegar} />}
      <Box sx={{ flexGrow: 1, minWidth: 0, pb: desktop ? 4 : 11 }}>
        <Header
          titulo={atual.titulo}
          subtitulo={atual.descricao}
          alternarTema={alternarTema}
          compacto={!desktop}
        />
        <Box component="main" sx={{ px: { xs: 2, sm: 3, lg: 4 }, maxWidth: 1480, mx: 'auto' }}>
          {COM_MAPA.includes(pagina) && <MapaTopo onSelect={(uf) => navegar('estado', uf)} />}
          <StatusBanner />
          {children}
          <Typography
            component="footer"
            variant="body2"
            color="text.secondary"
            textAlign="center"
            sx={{ mt: 5, mb: 1, opacity: 0.85 }}
          >
            Chorobura Sistemas · Informações oficiais coletadas no{' '}
            <Link href="https://resultados.tse.jus.br" target="_blank" rel="noopener">
              TSE
            </Link>{' '}
            · Clima: Open-Meteo
          </Typography>
        </Box>
      </Box>
      {!desktop && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1200,
            pb: 'env(safe-area-inset-bottom)',
          }}
        >
          <BottomNavigation
            showLabels
            value={pagina}
            onChange={(_, v) => navegar(v)}
            component="nav"
            aria-label="Navegação"
          >
            {NAV.map(({ id, curto, icon: Icon }) => (
              <BottomNavigationAction
                key={id}
                value={id}
                label={curto}
                icon={<Icon size={22} />}
                sx={{ minWidth: 0 }}
              />
            ))}
          </BottomNavigation>
        </Paper>
      )}
    </Box>
  );
}
