import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Box, ButtonBase, Drawer, Fab, Stack, Typography, useMediaQuery } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconChartDots3, IconDeviceTv, IconLayoutDashboard, IconMenu2 } from '@tabler/icons-react';

export type Tela = 'paineis' | 'tv' | 'metricas';

export const LARGURA_MENU = 88;

// Métricas só aparecem no computador do Fabio (npm run dev), nunca na produção
const ITENS: { id: Tela; rotulo: string; Icone: typeof IconDeviceTv }[] = [
  { id: 'paineis', rotulo: 'Painéis', Icone: IconLayoutDashboard },
  { id: 'tv', rotulo: 'Modo TV', Icone: IconDeviceTv },
  ...(import.meta.env.DEV ? [{ id: 'metricas' as const, rotulo: 'Métricas', Icone: IconChartDots3 }] : []),
];

const MargemMenu = createContext(0);

/** largura ocupada pelo menu à esquerda; 0 no celular e em tela cheia */
export const useMargemMenu = () => useContext(MargemMenu);

function Itens({ tela, navegar }: { tela: Tela; navegar: (t: Tela) => void }) {
  return (
    <>
      {ITENS.map(({ id, rotulo, Icone }) => {
        const ativo = tela === id;
        return (
          <ButtonBase
            key={id}
            onClick={() => navegar(id)}
            aria-current={ativo ? 'page' : undefined}
            sx={{
              width: 72,
              py: 1.25,
              borderRadius: '12px',
              flexDirection: 'column',
              gap: 0.5,
              color: ativo ? 'primary.main' : 'text.secondary',
              bgcolor: (t) => (ativo ? alpha(t.palette.primary.main, 0.1) : 'transparent'),
              '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, ativo ? 0.14 : 0.06) },
            }}
          >
            <Icone size={24} stroke={1.7} />
            <Typography fontSize={11.5} fontWeight={ativo ? 800 : 600} lineHeight={1.1}>
              {rotulo}
            </Typography>
          </ButtonBase>
        );
      })}
    </>
  );
}

export default function MenuLateral({ tela, navegar, children }: { tela: Tela; navegar: (t: Tela) => void; children: ReactNode }) {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const [telaCheia, setTelaCheia] = useState(Boolean(document.fullscreenElement));
  const [aberto, setAberto] = useState(false);
  useEffect(() => {
    const mudar = () => setTelaCheia(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', mudar);
    return () => document.removeEventListener('fullscreenchange', mudar);
  }, []);
  // em tela cheia (TV) o menu some e o painel volta a ocupar a largura toda
  const margem = desktop && !telaCheia ? LARGURA_MENU : 0;
  const ir = (t: Tela) => {
    setAberto(false);
    navegar(t);
  };

  return (
    <MargemMenu.Provider value={margem}>
      {margem > 0 && (
        <Stack
          component="nav"
          aria-label="Menu principal"
          alignItems="center"
          spacing={1}
          sx={{
            position: 'fixed',
            insetBlock: 0,
            left: 0,
            width: LARGURA_MENU,
            zIndex: theme.zIndex.appBar,
            py: 2,
            bgcolor: 'background.paper',
            borderRight: 1,
            borderColor: 'divider',
          }}
        >
          <Box
            component="img"
            src={`${import.meta.env.BASE_URL}icone-chorobura.png`}
            alt="Chorobura Sistemas"
            sx={{ width: 40, height: 40, mb: 1.5 }}
          />
          <Itens tela={tela} navegar={ir} />
        </Stack>
      )}
      {!desktop && (
        <>
          <Fab
            size="small"
            color="primary"
            aria-label="Abrir menu"
            onClick={() => setAberto(true)}
            sx={{ position: 'fixed', left: 12, bottom: 'calc(76px + env(safe-area-inset-bottom))', zIndex: theme.zIndex.speedDial }}
          >
            <IconMenu2 size={20} />
          </Fab>
          <Drawer anchor="left" open={aberto} onClose={() => setAberto(false)}>
            <Stack component="nav" aria-label="Menu principal" alignItems="center" spacing={1} sx={{ width: LARGURA_MENU, py: 2 }}>
              <Itens tela={tela} navegar={ir} />
            </Stack>
          </Drawer>
        </>
      )}
      <Box sx={{ ml: `${margem}px` }}>{children}</Box>
    </MargemMenu.Provider>
  );
}
