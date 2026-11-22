import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Box, CircularProgress, CssBaseline, ThemeProvider, useMediaQuery } from '@mui/material';
import { EleicaoProvider } from './context/EleicaoContext';
import Layout, { Pagina } from './layout/Layout';
import MenuLateral, { Tela } from './layout/MenuLateral';
import Nacional from './pages/Nacional';
import Mapa from './pages/Mapa';
import Regioes from './pages/Regioes';
import MeuEstado from './pages/MeuEstado';
import Internacionais from './pages/Internacionais';
import LogsUrna from './pages/Logs';
import { criarTema } from './theme/theme';
import TV from './tv/TV';
import { gravar, ler } from './utils/storage';
import { useNovaVersao } from './utils/useNovaVersao';

// Métricas: só no computador do Fabio (npm run dev); o build de produção nem gera o código delas
const Metricas = import.meta.env.DEV ? lazy(() => import('./metricas/Metricas')) : null;

type Rota = Pagina | 'metricas';
const ROTAS: Rota[] = ['nacional', 'mapa', 'regioes', 'estado', 'internacionais', 'logs', 'tv', ...(Metricas ? ['metricas' as const] : [])];

function rotaDoHash(): Rota {
  const h = window.location.hash.replace('#/', '').split('/')[0] as Rota;
  return ROTAS.includes(h) ? h : 'nacional';
}

export default function App() {
  useNovaVersao();
  const prefereEscuro = useMediaQuery('(prefers-color-scheme: dark)');
  const [modoTema, setModoTema] = useState<'light' | 'dark' | null>(() => ler('tema', null));
  const tema = useMemo(() => criarTema(modoTema ?? (prefereEscuro ? 'dark' : 'light')), [modoTema, prefereEscuro]);

  // navegação por hash: voltar/avançar funcionam e o link da página pode ser compartilhado
  const [rota, setRota] = useState<Rota>(rotaDoHash);
  useEffect(() => {
    const aoMudar = () => setRota(rotaDoHash());
    window.addEventListener('hashchange', aoMudar);
    return () => window.removeEventListener('hashchange', aoMudar);
  }, []);
  const navegar = (p: Rota, uf?: string) => {
    window.location.hash = `/${p}${uf ? `/${uf}` : ''}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const irPeloMenu = (t: Tela) => navegar(t === 'paineis' ? 'nacional' : t);

  const alternarTema = () => {
    const novo = tema.palette.mode === 'dark' ? 'light' : 'dark';
    setModoTema(novo);
    gravar('tema', novo);
  };

  return (
    <ThemeProvider theme={tema}>
      <CssBaseline />
      {rota === 'metricas' && Metricas ? (
        <MenuLateral tela="metricas" navegar={irPeloMenu}>
          <Suspense fallback={<Box sx={{ display: 'grid', placeItems: 'center', minHeight: '100dvh' }}><CircularProgress /></Box>}>
            <Metricas />
          </Suspense>
        </MenuLateral>
      ) : (
        <EleicaoProvider>
          {rota === 'tv' ? (
            <MenuLateral tela="tv" navegar={irPeloMenu}>
              <TV />
            </MenuLateral>
          ) : (
            <Layout pagina={rota as Pagina} navegar={navegar} alternarTema={alternarTema}>
              {rota === 'nacional' && <Nacional />}
              {rota === 'mapa' && <Mapa navegar={navegar} />}
              {rota === 'regioes' && <Regioes />}
              {rota === 'estado' && <MeuEstado />}
              {rota === 'internacionais' && <Internacionais />}
              {rota === 'logs' && <LogsUrna />}
            </Layout>
          )}
        </EleicaoProvider>
      )}
    </ThemeProvider>
  );
}
