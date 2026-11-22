import { createTheme } from '@mui/material/styles';
import { ptBR } from '@mui/material/locale';
import components from './Components';
import typography from './Typography';
import { shadows, darkshadows } from './Shadows';
import { baseDarkTheme, baselightTheme } from './DefaultColors';

export function criarTema(modo: 'light' | 'dark') {
  const base = modo === 'dark' ? baseDarkTheme : baselightTheme;
  const theme = createTheme(
    {
      ...(base as object),
      palette: {
        ...base.palette,
        mode: modo,
        background: modo === 'dark' ? base.palette.background : { default: '#f5f7fb', paper: '#ffffff' },
      },
      shape: { borderRadius: 10 },
      shadows: (modo === 'dark' ? darkshadows : shadows) as never,
      typography,
    },
    ptBR,
  );
  theme.components = components(theme);
  return theme;
}
