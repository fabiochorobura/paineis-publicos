import { ReactNode, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { alpha, keyframes, useTheme } from '@mui/material/styles';
import { IconChevronRight, IconMaximize, IconMinimize, IconPlayerPause, IconPlayerPlay, IconRefresh, IconX } from '@tabler/icons-react';
import { Candidato, Resultado } from '../api/tipos';
import { CidadeExterior, useExterior } from '../api/useExterior';
import ClimaHeader from '../clima/ClimaHeader';
import { CandidatoAvatar } from '../components/shared';
import { useEleicao } from '../context/EleicaoContext';
import { UFS_ORDENADAS } from '../data/ufs';
import { StatusChip } from '../layout/Header';
import { useMargemMenu } from '../layout/MenuLateral';
import { useCores } from '../utils/cores';
import { hora, nomeProprio, num, pct } from '../utils/formato';
import { useOnline } from '../utils/useOnline';
import { MapaBrasil, PreenchimentoUF } from './MapaBrasil';
import { Geometria, MapaCargo, municipiosDaUF, UF_IBGE, useGeometria, useMapasMunicipios } from './useMapaMunicipios';

const LARGURA = 1920;
const ALTURA = 1080;
const ESCOPO = 'presidente';
const TROCA_EXTERIOR_MS = 7_000;

function Canvas({ children, mobile }: { children: ReactNode; mobile: boolean }) {
  const [escala, setEscala] = useState(1);
  // o menu lateral ocupa a esquerda; em tela cheia ele some e a margem volta a 0
  const margem = useMargemMenu();
  useEffect(() => {
    const recalcular = () => setEscala(Math.min((window.innerWidth - margem) / LARGURA, window.innerHeight / ALTURA));
    recalcular();
    window.addEventListener('resize', recalcular);
    return () => window.removeEventListener('resize', recalcular);
  }, [margem]);
  if (mobile) {
    return <Box sx={{ width: '100%', minHeight: '100dvh', overflowX: 'hidden', bgcolor: 'background.default' }}>{children}</Box>;
  }
  return (
    <Box sx={{ position: 'fixed', inset: 0, left: margem, overflow: 'hidden', bgcolor: 'background.default' }}>
      <Box sx={{ position: 'absolute', left: '50%', top: '50%', width: LARGURA, height: ALTURA, transform: `translate(-50%, -50%) scale(${escala})`, transformOrigin: 'center' }}>
        {children}
      </Box>
    </Box>
  );
}

function Relogio({ compacto = false }: { compacto?: boolean } = {}) {
  const [agora, setAgora] = useState(new Date());
  useEffect(() => {
    const id = window.setInterval(() => setAgora(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return <Typography fontSize={compacto ? 24 : 34} fontWeight={900} lineHeight={1} sx={{ fontVariantNumeric: 'tabular-nums' }}>{agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Typography>;
}

function Cronometro({ proximaEm }: { proximaEm: number }) {
  const [agora, setAgora] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setAgora(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const restante = Math.max(0, Math.ceil((proximaEm - agora) / 1000));
  const minutos = String(Math.floor(restante / 60)).padStart(2, '0');
  const segundos = String(restante % 60).padStart(2, '0');
  return <Typography fontSize={12} color="text.secondary" noWrap>Atualiza em {minutos}:{segundos}</Typography>;
}

const Divisor = () => <Box sx={{ width: 2, height: 52, bgcolor: 'divider', flexShrink: 0 }} />;

function Topo({ brasil, mobile }: { brasil: Resultado | null; mobile: boolean }) {
  const { turno, setTurno, ultimaAtualizacao, atualizar, atualizando, proximaEm } = useEleicao();
  const online = useOnline();
  if (mobile) {
    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gridTemplateRows: '46px 30px 38px', columnGap: 1, rowGap: .65, bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: '16px', p: 1 }}>
        <Stack direction="row" alignItems="center" spacing={.65} minWidth={0} overflow="hidden">
          <Box component="img" src={`${import.meta.env.BASE_URL}logo-chorobura.png?v=${__VERSAO__}`} alt="Chorobura Sistemas" sx={{ width: 'clamp(78px, 27vw, 108px)', height: 42, objectFit: 'contain', flexShrink: 0 }} />
          <Typography fontSize="clamp(15px, 4.5vw, 19px)" fontWeight={900} lineHeight={1} noWrap flex={1}>Eleições 2026</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={.15} sx={{ alignSelf: 'center', minWidth: 82 }}>
          <Box textAlign="right">
            <Typography fontSize={10} fontWeight={900} lineHeight={1}>TSE</Typography>
            <Typography fontSize={10} color="text.secondary" noWrap>{hora(ultimaAtualizacao)}</Typography>
          </Box>
          <Tooltip title="Atualizar agora"><span><IconButton onClick={atualizar} disabled={atualizando} sx={{ width: 32, height: 32 }}><IconRefresh size={21} /></IconButton></span></Tooltip>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={.8} minWidth={0} overflow="hidden">
          <StatusChip compacto />
          <Cronometro proximaEm={proximaEm} />
        </Stack>
        <Box sx={{ alignSelf: 'center', justifySelf: 'end', minWidth: 54 }}><ClimaHeader compacto mini /></Box>
        <Stack direction="row" alignItems="center" sx={{ bgcolor: 'action.hover', borderRadius: '11px', overflow: 'hidden', minWidth: 0 }}>
          <Typography fontSize={12} fontWeight={900} px={1}>Turno</Typography>
          <ToggleButtonGroup fullWidth exclusive value={turno} onChange={(_, valor) => valor && setTurno(valor)} sx={{ flex: 1, height: '100%', '& .MuiToggleButton-root': { p: 0, minWidth: 0, fontSize: 15, fontWeight: 900, borderTop: 0, borderBottom: 0 } }}>
            <ToggleButton value={1}>1</ToggleButton>
            <ToggleButton value={2}>2</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
        <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={.65} sx={{ minWidth: 0, px: .25 }}>
          <Relogio compacto />
          <Typography fontSize={10} fontWeight={800} color="success.main" noWrap>● {num(online ?? 0)} online</Typography>
        </Stack>
      </Box>
    );
  }
  return (
    <Stack direction="row" alignItems="center" spacing={2.5} height={82}>
      <Box component="img" src={`${import.meta.env.BASE_URL}logo-chorobura.png?v=${__VERSAO__}`} alt="Chorobura Sistemas" sx={{ height: 70, width: 'auto', display: 'block' }} />
      <Divisor />
      <Box minWidth={330}>
        <Typography fontSize={28} fontWeight={900} lineHeight={1.2}>Eleições 2026 · Presidente</Typography>
        <Stack direction="row" spacing={1.25} alignItems="center" mt={0.5}>
          <StatusChip />
          <Cronometro proximaEm={proximaEm} />
          <Typography fontSize={14} color="text.secondary">TSE · {hora(ultimaAtualizacao)}</Typography>
        </Stack>
      </Box>
      <ToggleButtonGroup exclusive value={turno} onChange={(_, valor) => valor && setTurno(valor)} sx={{ bgcolor: 'background.paper', '& .MuiToggleButton-root': { px: 2.5, py: 1.15, fontSize: 17, fontWeight: 900 } }}>
        <ToggleButton value={1}>1º turno</ToggleButton>
        <ToggleButton value={2}>2º turno</ToggleButton>
      </ToggleButtonGroup>
      <Box flex={1} />
      <ClimaHeader />
      <Divisor />
      <Box textAlign="right" minWidth={165}>
        <Typography fontSize={13} color="text.secondary" fontWeight={800} letterSpacing={1}>URNAS APURADAS</Typography>
        <Typography fontSize={34} fontWeight={900} lineHeight={1}>{pct(brasil?.pctSecoes ?? 0)}</Typography>
      </Box>
      <Divisor />
      <Stack alignItems="flex-end" minWidth={112}>
        <Relogio />
        <Typography fontSize={14} fontWeight={800} color="success.main">● {num(online ?? 0)} online</Typography>
      </Stack>
      <Tooltip title="Atualizar agora"><span><IconButton onClick={atualizar} disabled={atualizando}><IconRefresh size={27} /></IconButton></span></Tooltip>
    </Stack>
  );
}

function Card({ titulo, subtitulo, children }: { titulo: string; subtitulo?: string; children: ReactNode }) {
  return (
    <Stack sx={{ minWidth: 0, height: '100%', bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: '18px', p: 2, overflow: 'hidden' }}>
      <Typography fontSize={21} fontWeight={900} noWrap>{titulo}</Typography>
      {subtitulo && <Typography fontSize={13} color="text.secondary" noWrap>{subtitulo}</Typography>}
      <Box flex={1} minHeight={0} display="grid" sx={{ gridTemplateRows: 'minmax(0, 1fr)', gridTemplateColumns: 'minmax(0, 1fr)', placeItems: 'center', overflow: 'hidden' }}>{children}</Box>
    </Stack>
  );
}

function MapaMunicipalCanvas({ geo, mapa, brasil, uf }: { geo: Geometria | null; mapa?: MapaCargo; brasil: Resultado | null; uf?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const theme = useTheme();
  const { cor } = useCores();
  const itens = useMemo(() => !geo ? [] : uf ? municipiosDaUF(geo, uf) : geo.municipios, [geo, uf]);
  const enquadre = useMemo(() => {
    if (!geo || itens.length === 0) return { x0: 0, y0: 0, w: 1, h: 1 };
    if (!uf) return { x0: 0, y0: 0, w: geo.w, h: geo.h };
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    itens.forEach(({ caixa }) => { x0 = Math.min(x0, caixa[0]); y0 = Math.min(y0, caixa[1]); x1 = Math.max(x1, caixa[2]); y1 = Math.max(y1, caixa[3]); });
    return { x0, y0, w: Math.max(1, x1 - x0), h: Math.max(1, y1 - y0) };
  }, [geo, itens, uf]);
  const cores = useMemo(() => {
    const saida: Record<string, { cor: string; pst: number }> = {};
    if (!brasil) return saida;
    Object.entries(mapa ?? {}).forEach(([ibge, [, numero, , pst]]) => {
      const candidato = brasil.candidatos.find((c) => c.numero === numero);
      if (candidato) saida[ibge] = { cor: cor(ESCOPO, candidato, brasil.candidatos), pst };
    });
    return saida;
  }, [brasil, mapa, cor]);

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx || !geo) return;
    const W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);
    const escala = Math.min((W - 20) / enquadre.w, (H - 20) / enquadre.h);
    const dx = (W - enquadre.w * escala) / 2 - enquadre.x0 * escala;
    const dy = (H - enquadre.h * escala) / 2 - enquadre.y0 * escala;
    ctx.setTransform(escala, 0, 0, escala, dx, dy);
    const vazio = alpha(theme.palette.text.primary, 0.085);
    itens.forEach(({ ibge, path }) => {
      const c = cores[ibge];
      ctx.globalAlpha = c ? 0.42 + 0.58 * Math.min(1, c.pst / 100) : 1;
      ctx.fillStyle = c?.cor ?? vazio;
      ctx.fill(path);
    });
    ctx.globalAlpha = 1;
    ctx.strokeStyle = alpha(theme.palette.background.paper, uf ? 0.7 : 0.35);
    ctx.lineWidth = (uf ? 0.8 : 0.32) / escala;
    itens.forEach(({ path }) => ctx.stroke(path));
    if (!uf) {
      ctx.strokeStyle = alpha(theme.palette.text.primary, 0.55);
      ctx.lineWidth = 1.4 / escala;
      geo.estados.forEach((path) => ctx.stroke(path));
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }, [geo, itens, enquadre, cores, theme, uf]);

  if (!geo) return <Typography color="text.secondary">Carregando mapa…</Typography>;
  return <canvas ref={ref} width={760} height={760} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />;
}

function MapaEstados({ brasil, estados, onSelect }: { brasil: Resultado | null; estados: Record<string, Resultado>; onSelect?: (uf: string) => void }) {
  const { cor } = useCores();
  const preenchimento = useMemo(() => {
    const saida: Record<string, PreenchimentoUF> = {};
    if (!brasil) return saida;
    Object.entries(estados).forEach(([uf, r]) => {
      const lider = r.candidatos[0];
      if (lider?.votos > 0) saida[uf] = { cor: cor(ESCOPO, lider, brasil.candidatos), intensidade: r.pctSecoes / 100, rotulo: `${Math.round(lider.pct)}%` };
    });
    return saida;
  }, [brasil, estados, cor]);
  return <MapaBrasil preenchimento={preenchimento} largura="100%" altura="100%" escalaRotulo={1.12} onSelect={onSelect} />;
}

function MapaNacionalMobile({
  brasil,
  estados,
  geo,
  mapa,
  onSelect,
}: {
  brasil: Resultado | null;
  estados: Record<string, Resultado>;
  geo: Geometria | null;
  mapa?: MapaCargo;
  onSelect: (uf: string) => void;
}) {
  const [municipios, setMunicipios] = useState(false);
  const [pausado, setPausado] = useState(false);
  useEffect(() => {
    if (pausado) return;
    const id = window.setInterval(() => setMunicipios((valor) => !valor), 20_000);
    return () => window.clearInterval(id);
  }, [pausado, municipios]);
  return (
    <Stack sx={{ height: 410, minWidth: 0, bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: '18px', p: 1.5, overflow: 'hidden' }}>
      <Stack direction="row" alignItems="flex-start" spacing={1}>
        <Box flex={1} minWidth={0}>
          <Typography fontSize={21} fontWeight={900} noWrap>{municipios ? 'Brasil · por município' : 'Brasil · por estado'}</Typography>
          <Typography fontSize={12} color="text.secondary" noWrap>{municipios ? `${num(Object.keys(mapa ?? {}).length)} municípios com votos` : 'Toque em uma UF para ampliar e comparar'}</Typography>
        </Box>
        <Tooltip title={pausado ? 'Continuar alternância' : 'Pausar neste mapa'}>
          <IconButton size="small" onClick={() => setPausado((valor) => !valor)} aria-label={pausado ? 'Continuar alternância dos mapas' : 'Pausar alternância dos mapas'}>
            {pausado ? <IconPlayerPlay size={21} /> : <IconPlayerPause size={21} />}
          </IconButton>
        </Tooltip>
        <Tooltip title={municipios ? 'Ver por estado' : 'Ver por município'}>
          <IconButton size="small" onClick={() => setMunicipios((valor) => !valor)} aria-label={municipios ? 'Mostrar mapa por estado' : 'Mostrar mapa por município'}>
            <IconChevronRight size={21} />
          </IconButton>
        </Tooltip>
      </Stack>
      <Box key={municipios ? 'municipios' : 'estados'} flex={1} minHeight={0} display="grid" sx={{ gridTemplateRows: 'minmax(0, 1fr)', gridTemplateColumns: 'minmax(0, 1fr)', placeItems: 'center', overflow: 'hidden', px: .5, pt: .5, pb: 1.5, animation: `${entradaMapa} .35s ease` }}>
        {municipios ? <MapaMunicipalCanvas geo={geo} mapa={mapa} brasil={brasil} /> : <MapaEstados brasil={brasil} estados={estados} onSelect={onSelect} />}
      </Box>
    </Stack>
  );
}

const entradaMapa = keyframes`from { opacity: .25; transform: scale(.985); } to { opacity: 1; transform: none; }`;

// O próximo estado é montado escondido alguns segundos depois da troca: quando chega a vez dele,
// mapa e lista já estão desenhados e só passam a ficar visíveis, sem travar a TV.
const PREPARO_PROXIMO_MS = 4_000;

function EstadosTV({ geo, mapa, brasil, uf, proximaUf, pausado, onConcluirEstado }: { geo: Geometria | null; mapa?: MapaCargo; brasil: Resultado | null; uf: string; proximaUf: string; pausado: boolean; onConcluirEstado: () => void }) {
  const [preparada, setPreparada] = useState<string | null>(null);
  useEffect(() => {
    const id = window.setTimeout(() => setPreparada(proximaUf), PREPARO_PROXIMO_MS);
    return () => window.clearTimeout(id);
  }, [proximaUf]);
  const slots = preparada && preparada !== uf ? [uf, preparada] : [uf];
  return (
    <Box position="relative" width="100%" height="100%">
      {slots.map((sigla) => (
        <Box key={sigla} sx={{ position: 'absolute', inset: 0, visibility: sigla === uf ? 'visible' : 'hidden' }}>
          <PainelEstadoTV geo={geo} mapa={mapa} brasil={brasil} uf={sigla} ativo={sigla === uf} pausado={pausado} onConcluirEstado={onConcluirEstado} />
        </Box>
      ))}
    </Box>
  );
}

function PainelEstadoTV({ geo, mapa, brasil, uf, ativo, pausado, onConcluirEstado }: { geo: Geometria | null; mapa?: MapaCargo; brasil: Resultado | null; uf: string; ativo: boolean; pausado: boolean; onConcluirEstado: () => void }) {
  const { cor } = useCores();
  const lista = useMemo(() => geo ? municipiosDaUF(geo, uf) : [], [geo, uf]);
  const janelaRef = useRef<HTMLDivElement | null>(null);
  const trilhoRef = useRef<HTMLDivElement | null>(null);
  const animacaoRef = useRef<Animation | null>(null);
  const pausadoRef = useRef(pausado);
  useEffect(() => {
    pausadoRef.current = pausado;
    if (pausado) animacaoRef.current?.pause();
    else animacaoRef.current?.play();
  }, [pausado]);
  useLayoutEffect(() => {
    const janela = janelaRef.current;
    const trilho = trilhoRef.current;
    if (!ativo || !janela || !trilho || lista.length === 0) return;
    const distancia = Math.max(0, trilho.scrollHeight - janela.clientHeight);
    const animacao = trilho.animate(
      [{ transform: 'translateY(0)' }, { transform: `translateY(-${distancia}px)` }],
      { duration: distancia > 0 ? Math.max(18_000, distancia * 42) : 9_000, easing: 'linear', fill: 'forwards' },
    );
    animacaoRef.current = animacao;
    if (pausadoRef.current) animacao.pause();
    animacao.onfinish = onConcluirEstado;
    return () => {
      animacao.onfinish = null;
      animacao.cancel();
      if (animacaoRef.current === animacao) animacaoRef.current = null;
    };
  }, [ativo, lista.length, onConcluirEstado, uf]);
  return (
    <Stack width="100%" height="100%" minHeight={0} spacing={.65}>
      <Box height={390} flexShrink={0}><MapaMunicipalCanvas geo={geo} mapa={mapa} brasil={brasil} uf={uf} /></Box>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline">
        <Typography fontSize={12} fontWeight={900} color="text.secondary">MUNICÍPIOS · DUAS COLUNAS</Typography>
        <Typography fontSize={11} color="text.secondary">{lista.length} · rolagem automática</Typography>
      </Stack>
      <Box ref={janelaRef} sx={{ flex: 1, minHeight: 0, overflow: 'hidden', maskImage: 'linear-gradient(180deg, transparent, #000 2%, #000 98%, transparent)' }}>
        <Box ref={trilhoRef} sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: .35, willChange: 'transform' }}>
        {lista.map((municipio) => {
          const dados = mapa?.[municipio.ibge];
          const candidato = brasil?.candidatos.find((item) => item.numero === dados?.[1]);
          const tinta = candidato && brasil ? cor(ESCOPO, candidato, brasil.candidatos) : 'action.disabled';
          return (
            <Stack key={municipio.ibge} direction="row" alignItems="center" spacing={.45} sx={{ minWidth: 0, minHeight: 32, px: .5, py: .2, borderRadius: '7px', bgcolor: 'action.hover' }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: tinta, flexShrink: 0 }} />
              <Box flex={1} minWidth={0}>
                <Typography fontSize={10.5} fontWeight={800} noWrap lineHeight={1.05}>{municipio.nome}</Typography>
                <Typography fontSize={8} color="text.secondary" noWrap lineHeight={1.05}>{candidato ? nomeProprio(candidato.nome) : 'Aguardando votos'}</Typography>
              </Box>
              {dados && <Typography fontSize={9.5} fontWeight={900}>{pct(dados[2], 0)}</Typography>}
            </Stack>
          );
        })}
        </Box>
      </Box>
    </Stack>
  );
}

function ConfrontoMobile({ brasil }: { brasil: Resultado | null }) {
  const { cor } = useCores();
  const candidatos = [...(brasil?.candidatos ?? [])].sort((a, b) => b.votos - a.votos).slice(0, 2);
  // A barra é a disputa entre os dois: cada um ocupa a sua fatia dos votos válidos.
  const disputa = candidatos.map((c) => ({ rotulo: nomeProprio(c.nome), valor: c.pct, cor: cor(ESCOPO, c, brasil?.candidatos ?? candidatos) }));
  const legenda = [
    { rotulo: 'Brancos', valor: brasil?.pctBrancos ?? 0, cor: '#cbd5e1' },
    { rotulo: 'Nulos', valor: brasil?.pctNulos ?? 0, cor: '#94a3b8' },
    { rotulo: 'Abstenção', valor: brasil?.pctAbstencao ?? 0, cor: '#64748b' },
  ];
  return (
    <Box sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: '18px', p: .9 }}>
      <Stack direction="row" alignItems="baseline" justifyContent="space-between" mb={.35}>
        <Typography fontSize={18} fontWeight={900}>Presidente · Brasil</Typography>
        <Box textAlign="right">
          <Typography fontSize={9} color="text.secondary" fontWeight={800}>URNAS APURADAS</Typography>
          <Typography fontSize={14} fontWeight={900}>{pct(brasil?.pctSecoes ?? 0)}</Typography>
        </Box>
      </Stack>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1 }}>
        {candidatos.map((c, i) => {
          const tinta = cor(ESCOPO, c, brasil?.candidatos ?? candidatos);
          const nome = nomeProprio(c.nome);
          const partes = nome.split(' ');
          const quebrarNome = partes.length > 1 && nome.length > 12;
          return (
            <Stack key={c.numero} direction="row" alignItems="center" justifyContent="center" spacing={.7} sx={{ minWidth: 0, px: .7, borderLeft: i ? 1 : 0, borderColor: 'divider' }}>
              <CandidatoAvatar nome={c.nome} foto={c.fotoUrl} cor={tinta} tamanho={36} />
              <Box minWidth={0}>
                {quebrarNome ? (
                  <>
                    <Typography fontSize={11.5} fontWeight={900} lineHeight={1.05}>{partes[0]}</Typography>
                    <Stack direction="row" spacing={.4} alignItems="baseline">
                      <Typography fontSize={11.5} fontWeight={900} lineHeight={1.05} noWrap>{partes.slice(1).join(' ')}</Typography>
                      <Typography fontSize={12} fontWeight={900} flexShrink={0}>{pct(c.pct)}</Typography>
                    </Stack>
                  </>
                ) : (
                  <Stack direction="row" spacing={.4} alignItems="baseline">
                    <Typography fontSize={11.5} fontWeight={900} noWrap>{nome}</Typography>
                    <Typography fontSize={12} fontWeight={900} flexShrink={0}>{pct(c.pct)}</Typography>
                  </Stack>
                )}
                <Typography fontSize={8.5} color="text.secondary" noWrap>{c.partido} · {num(c.votos)} votos</Typography>
              </Box>
            </Stack>
          );
        })}
      </Box>
      <Stack direction="row" height={9} overflow="hidden" borderRadius={6} mt={.5} bgcolor="action.hover">
        {disputa.filter((item) => item.valor > 0).map((item) => <Box key={item.rotulo} title={`${item.rotulo}: ${pct(item.valor)}`} sx={{ width: `${item.valor}%`, bgcolor: item.cor, transition: 'width .7s ease' }} />)}
      </Stack>
      <Stack direction="row" spacing={.7} mt={.35} flexWrap="wrap" useFlexGap>
        {legenda.map((item) => <Stack key={item.rotulo} direction="row" spacing={.3} alignItems="center"><Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: item.cor }} /><Typography fontSize={8.5} color="text.secondary">{item.rotulo} {pct(item.valor, 1)}</Typography></Stack>)}
      </Stack>
    </Box>
  );
}

function DialogoEstado({
  uf,
  onClose,
  geo,
  mapa,
  brasil,
}: {
  uf: string | null;
  onClose: () => void;
  geo: Geometria | null;
  mapa?: MapaCargo;
  brasil: Resultado | null;
}) {
  const { cor } = useCores();
  const estado = uf ? UFS_ORDENADAS.find((item) => item.sigla.toLowerCase() === uf) : undefined;
  const municipios = useMemo(() => geo && uf ? municipiosDaUF(geo, uf) : [], [geo, uf]);
  const candidatosNacionais = [...(brasil?.candidatos ?? [])].sort((a, b) => b.votos - a.votos);

  return (
    <Dialog fullScreen open={Boolean(uf)} onClose={onClose} PaperProps={{ sx: { bgcolor: 'background.default' } }}>
      <DialogTitle sx={{ p: 1.5, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box flex={1} minWidth={0}>
            <Typography fontSize={21} fontWeight={900} noWrap>{estado?.nome ?? 'Estado'} · municípios</Typography>
            <Typography fontSize={12} color="text.secondary">Toque no X para voltar ao painel nacional</Typography>
          </Box>
          <IconButton onClick={onClose} aria-label="Fechar municípios"><IconX /></IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ p: 1.25 }}>
        <Box sx={{ height: 300, bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: '16px', p: 1, mb: 1.25 }}>
          {uf && <MapaMunicipalCanvas geo={geo} mapa={mapa} brasil={brasil} uf={uf} />}
        </Box>
        <Typography fontSize={14} fontWeight={900} mb={1}>{municipios.length} MUNICÍPIOS · COMPARAÇÃO DOS CANDIDATOS</Typography>
        <Stack spacing={1}>
          {municipios.map((municipio) => {
            const dados = mapa?.[municipio.ibge];
            const numeroA = dados?.[1] ?? candidatosNacionais[0]?.numero;
            const numeroB = dados?.[5] ?? candidatosNacionais.find((c) => c.numero !== numeroA)?.numero;
            const candidatoA = candidatosNacionais.find((c) => c.numero === numeroA);
            const candidatoB = candidatosNacionais.find((c) => c.numero === numeroB);
            const percentualA = dados?.[2] ?? 0;
            const percentualB = dados?.[6] ?? 0;
            const corA = candidatoA ? cor(ESCOPO, candidatoA, candidatosNacionais) : 'text.disabled';
            const corB = candidatoB ? cor(ESCOPO, candidatoB, candidatosNacionais) : 'text.disabled';
            return (
              <Box key={municipio.ibge} sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: '14px', p: 1.25 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="baseline" mb={1}>
                  <Typography fontSize={17} fontWeight={900}>{municipio.nome}</Typography>
                  <Typography fontSize={11} color="text.secondary">{dados ? `${pct(dados[3], 0)} apurado` : 'aguardando votos'}</Typography>
                </Stack>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.25 }}>
                  {[
                    { candidato: candidatoA, valor: percentualA, tinta: corA },
                    { candidato: candidatoB, valor: percentualB, tinta: corB },
                  ].map((item, indice) => (
                    <Box key={item.candidato?.numero ?? indice} minWidth={0}>
                      <Stack direction="row" justifyContent="space-between" spacing={.5} alignItems="baseline">
                        <Typography fontSize={13} fontWeight={800} noWrap>{item.candidato ? nomeProprio(item.candidato.nome) : 'Candidato'}</Typography>
                        <Typography fontSize={15} fontWeight={900}>{pct(item.valor)}</Typography>
                      </Stack>
                      <LinearProgress variant="determinate" value={item.valor} sx={{ mt: .5, height: 9, borderRadius: 5, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { bgcolor: item.tinta, borderRadius: 5 } }} />
                    </Box>
                  ))}
                </Box>
              </Box>
            );
          })}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

function DestaquesMunicipais({ geo, mapa, brasil, quantidade = 1 }: { geo: Geometria | null; mapa?: MapaCargo; brasil: Resultado | null; quantidade?: number }) {
  const candidatos = [...(brasil?.candidatos ?? [])].sort((a, b) => b.votos - a.votos).slice(0, 2);
  const nomes = useMemo(() => new Map((geo?.municipios ?? []).map((m) => [m.ibge, m.nome])), [geo]);
  const destaques = candidatos.flatMap((c) => {
    const melhores = Object.entries(mapa ?? {}).filter(([, v]) => v[1] === c.numero).sort((a, b) => (b[1][4] ?? b[1][2]) - (a[1][4] ?? a[1][2])).slice(0, quantidade);
    const preenchidos: Array<[string, MapaCargo[string]] | null> = [...melhores];
    while (preenchidos.length < quantidade) preenchidos.push(null);
    return preenchidos.map((melhor, indice) => ({ c, melhor, indice }));
  });
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: quantidade > 1 ? 'repeat(2, minmax(0, 1fr))' : '1fr', gap: .65 }}>
      {destaques.map(({ c, melhor, indice }) => {
        const uf = melhor ? UF_IBGE[melhor[0].slice(0, 2)]?.toUpperCase() : '';
        return (
          <Box key={`${c.numero}-${indice}`} sx={{ px: .85, py: .6, borderRadius: '10px', bgcolor: 'action.hover', minWidth: 0 }}>
            <Typography fontSize={9.5} fontWeight={800} color="text.secondary" noWrap>{indice + 1}ª CIDADE · {nomeProprio(c.nome).toUpperCase()}</Typography>
            <Stack direction="row" justifyContent="space-between" spacing={1}>
              <Typography fontSize={13} fontWeight={900} noWrap>{melhor ? `${nomes.get(melhor[0]) ?? melhor[0]} · ${uf}` : 'Aguardando apuração'}</Typography>
              {melhor && <Typography fontSize={13} fontWeight={900}>{pct(melhor[1][2])}</Typography>}
            </Stack>
          </Box>
        );
      })}
    </Box>
  );
}

function CardCandidatoMunicipios({
  posicao,
  candidato,
  adversario,
  geo,
  mapa,
  brasil,
}: {
  posicao: number;
  candidato: Candidato;
  adversario?: Candidato;
  geo: Geometria | null;
  mapa?: MapaCargo;
  brasil: Resultado;
}) {
  const { cor } = useCores();
  const tinta = cor(ESCOPO, candidato, brasil.candidatos);
  const tintaAdversario = adversario ? cor(ESCOPO, adversario, brasil.candidatos) : 'text.disabled';
  const nomes = useMemo(() => new Map((geo?.municipios ?? []).map((m) => [m.ibge, m.nome])), [geo]);
  const cidades = useMemo(
    () => Object.entries(mapa ?? {})
      .filter(([, dados]) => dados[1] === candidato.numero)
      .sort((a, b) => (b[1][4] ?? 0) - (a[1][4] ?? 0))
      .slice(0, 5),
    [candidato.numero, mapa],
  );
  const eleitorado = brasil.eleitorado || 0;
  const proporcao = (valor: number) => eleitorado > 0 ? Math.max(0, Math.min(100, valor / eleitorado * 100)) : 0;
  const segmentos = [
    { nome: nomeProprio(candidato.nome), valor: proporcao(candidato.votos), cor: tinta },
    { nome: adversario ? nomeProprio(adversario.nome) : 'Adversário', valor: proporcao(adversario?.votos ?? 0), cor: tintaAdversario },
    { nome: 'Brancos', valor: proporcao(brasil.brancos), cor: '#cbd5e1' },
    { nome: 'Nulos', valor: proporcao(brasil.nulos), cor: '#94a3b8' },
    { nome: 'Abstenção', valor: proporcao(brasil.abstencao), cor: '#64748b' },
  ];
  const restante = Math.max(0, 100 - segmentos.reduce((total, item) => total + item.valor, 0));
  const linhas: Array<[string, MapaCargo[string]] | null> = [...cidades];
  while (linhas.length < 5) linhas.push(null);
  return (
    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: '14px', p: 1, bgcolor: alpha(tinta, .035), minWidth: 0 }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <CandidatoAvatar nome={candidato.nome} foto={candidato.fotoUrl} cor={tinta} tamanho={38} />
        <Box flex={1} minWidth={0}>
          <Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={1}>
            <Stack direction="row" alignItems="baseline" spacing={.6} minWidth={0}>
              <Typography fontSize={13} fontWeight={900} color={tinta} flexShrink={0}>{posicao}º</Typography>
              <Typography fontSize={17} fontWeight={900} noWrap>{nomeProprio(candidato.nome)}</Typography>
            </Stack>
            <Typography fontSize={21} fontWeight={900}>{pct(candidato.pct)}</Typography>
          </Stack>
          <Typography fontSize={10} color="text.secondary">{candidato.partido} · {num(candidato.votos)} votos · cidades onde lidera</Typography>
        </Box>
      </Stack>
      <Stack direction="row" height={7} overflow="hidden" borderRadius={5} mt={.5} bgcolor="action.hover">
        {[...segmentos, { nome: 'Não apurado', valor: restante, cor: '#e5e7eb' }].filter((item) => item.valor > 0).map((item) => (
          <Box key={item.nome} title={`${item.nome}: ${pct(item.valor)}`} sx={{ width: `${item.valor}%`, bgcolor: item.cor, minWidth: 1 }} />
        ))}
      </Stack>
      <Stack direction="row" spacing={1.1} mt={.3} mb={.4}>
        <Typography fontSize={9} color="text.secondary">Brancos {pct(brasil.pctBrancos, 1)}</Typography>
        <Typography fontSize={9} color="text.secondary">Nulos {pct(brasil.pctNulos, 1)}</Typography>
        <Typography fontSize={9} color="text.secondary">Abstenção {pct(brasil.pctAbstencao, 1)}</Typography>
      </Stack>
      <Stack spacing={.35}>
        {linhas.map((cidade, indice) => {
          const dados = cidade?.[1];
          const valor = percentualMunicipio(dados, candidato.numero);
          const valorAdversario = percentualMunicipio(dados, adversario?.numero);
          return (
            <Box key={cidade?.[0] ?? indice} sx={{ px: .7, py: .3, bgcolor: 'background.paper', borderRadius: '8px' }}>
              <Stack direction="row" justifyContent="space-between" spacing={1}>
                <Typography fontSize={11} fontWeight={850} noWrap>{cidade ? nomes.get(cidade[0]) ?? cidade[0] : 'Aguardando apuração'}</Typography>
                <Typography fontSize={10} fontWeight={900} noWrap>{pct(valor)} × {pct(valorAdversario)}</Typography>
              </Stack>
              <Stack direction="row" height={5} mt={.3} borderRadius={4} overflow="hidden" bgcolor="action.hover">
                <Box sx={{ width: `${valor}%`, bgcolor: tinta }} />
                <Box sx={{ width: `${valorAdversario}%`, bgcolor: tintaAdversario }} />
              </Stack>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}

function CandidatosMunicipiosTV({ geo, mapa, brasil }: { geo: Geometria | null; mapa?: MapaCargo; brasil: Resultado | null }) {
  if (!brasil) return <Typography color="text.secondary">Aguardando candidatos.</Typography>;
  const candidatos = [...brasil.candidatos].sort((a, b) => b.votos - a.votos).slice(0, 2);
  if (!candidatos.length) return <Typography color="text.secondary">Aguardando candidatos.</Typography>;
  // quem tem mais votos fica em cima: o card segue o ranking, não um nome fixo
  return (
    <Stack spacing={.85} minHeight={0}>
      {candidatos.map((c, i) => (
        <CardCandidatoMunicipios key={c.numero} posicao={i + 1} candidato={c} adversario={candidatos[1 - i]} geo={geo} mapa={mapa} brasil={brasil} />
      ))}
    </Stack>
  );
}

function Exterior({ cidades, pausado, mobile }: { cidades: CidadeExterior[]; pausado: boolean; mobile: boolean }) {
  const [pagina, setPagina] = useState(0);
  const porPagina = mobile ? 4 : 16;
  const paginas = Math.max(1, Math.ceil(cidades.length / porPagina));
  useEffect(() => {
    if (pausado) return;
    const id = window.setInterval(() => setPagina((p) => (p + 1) % paginas), TROCA_EXTERIOR_MS);
    return () => window.clearInterval(id);
  }, [paginas, pausado]);
  const itens = cidades.slice((pagina % paginas) * porPagina, (pagina % paginas) * porPagina + porPagina);
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(4, minmax(0, 1fr))', gap: mobile ? 1 : .65 }}>
      {itens.map((item) => {
        const top = item.r?.candidatos.filter((c) => c.votos > 0).slice(0, 2) ?? [];
        return (
          <Box key={item.cd} sx={{ p: mobile ? 1 : .45, border: 1, borderColor: 'divider', borderRadius: '11px', minWidth: 0 }}>
            <Typography fontSize={mobile ? 15 : 10.5} fontWeight={900} lineHeight={1.08} minHeight={mobile ? 'auto' : 21} sx={{ whiteSpace: 'normal', overflowWrap: 'break-word' }}>{item.nome}</Typography>
            {top.length ? top.map((c) => <Stack key={c.numero} direction="row" justifyContent="space-between" spacing={.35}><Typography fontSize={mobile ? 12 : 9.5} noWrap>{mobile ? nomeProprio(c.nome) : nomeProprio(c.nome).split(' ')[0]}</Typography><Typography fontSize={mobile ? 12 : 9.5} fontWeight={900}>{pct(c.pct)}</Typography></Stack>) : <Typography fontSize={mobile ? 12 : 9.5} color="text.secondary" noWrap>Aguardando TSE</Typography>}
          </Box>
        );
      })}
    </Box>
  );
}

function proximoIndice(indice: number, evitar: number) {
  const proximo = (indice + 1) % UFS_ORDENADAS.length;
  return proximo === evitar ? (proximo + 1) % UFS_ORDENADAS.length : proximo;
}

function percentualMunicipio(dados: MapaCargo[string] | undefined, numero: string | undefined) {
  if (!dados || !numero) return 0;
  if (dados[1] === numero) return dados[2];
  if (dados[5] === numero) return dados[6] ?? 0;
  return 0;
}

function FaixaMunicipios({
  brasil,
  geo,
  mapa,
  uf,
  pausado,
  mobile,
  onConcluirEstado,
}: {
  brasil: Resultado | null;
  geo: Geometria | null;
  mapa?: MapaCargo;
  uf: string;
  pausado: boolean;
  mobile: boolean;
  onConcluirEstado: () => void;
}) {
  const { cor } = useCores();
  const municipios = useMemo(() => geo ? municipiosDaUF(geo, uf) : [], [geo, uf]);
  const candidatos = [...(brasil?.candidatos ?? [])].sort((a, b) => b.votos - a.votos).slice(0, 2);
  const lula = candidatos.find((c) => c.nome.toUpperCase().includes('LULA')) ?? candidatos[0];
  const flavio = candidatos.find((c) => c.nome.toUpperCase().includes('FLAVIO')) ?? candidatos.find((c) => c.numero !== lula?.numero) ?? candidatos[1];
  const janelaRef = useRef<HTMLDivElement | null>(null);
  const trilhoRef = useRef<HTMLDivElement | null>(null);
  const animacaoRef = useRef<Animation | null>(null);
  const pausadoRef = useRef(pausado);

  useEffect(() => {
    pausadoRef.current = pausado;
    if (pausado) animacaoRef.current?.pause();
    else animacaoRef.current?.play();
  }, [pausado]);

  useLayoutEffect(() => {
    const janela = janelaRef.current;
    const trilho = trilhoRef.current;
    if (!janela || !trilho || municipios.length === 0) return;
    const distancia = Math.max(0, trilho.scrollWidth - janela.clientWidth);
    const duracao = distancia > 0 ? Math.max(14_000, distancia * (mobile ? 34 : 28)) : 8_000;
    const animacao = trilho.animate(
      [{ transform: 'translateX(0)' }, { transform: `translateX(-${distancia}px)` }],
      { duration: duracao, easing: 'linear', fill: 'forwards' },
    );
    animacaoRef.current = animacao;
    if (pausadoRef.current) animacao.pause();
    animacao.onfinish = onConcluirEstado;
    return () => {
      animacao.onfinish = null;
      animacao.cancel();
      if (animacaoRef.current === animacao) animacaoRef.current = null;
    };
  }, [mobile, municipios.length, onConcluirEstado, uf]);

  return (
    <Box ref={janelaRef} flex={1} minWidth={0} overflow="hidden" sx={{ maskImage: 'linear-gradient(90deg, transparent, #000 1.5%, #000 98.5%, transparent)' }}>
      <Stack ref={trilhoRef} direction="row" alignItems="center" spacing={.55} width="max-content" sx={{ willChange: 'transform' }}>
        {municipios.map((municipio) => {
          const dados = mapa?.[municipio.ibge];
          const percentualLula = percentualMunicipio(dados, lula?.numero);
          const percentualFlavio = percentualMunicipio(dados, flavio?.numero);
          return (
            <Box key={municipio.ibge} sx={{ width: Math.min(390, Math.max(mobile ? 250 : 225, 158 + municipio.nome.length * 6.4)), flexShrink: 0, px: .55, py: .35, border: 1, borderColor: 'divider', borderRadius: '9px', bgcolor: 'background.default' }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '24px auto max-content auto auto 24px', alignItems: 'center', justifyContent: 'center', gap: .35 }}>
                {lula ? <CandidatoAvatar nome={lula.nome} foto={lula.fotoUrl} cor={cor(ESCOPO, lula, candidatos)} tamanho={24} /> : <Box />}
                <Typography fontSize={10.5} fontWeight={900}>{pct(percentualLula)}</Typography>
                <Typography fontSize={10.5} fontWeight={900} textAlign="center" whiteSpace="nowrap">{municipio.nome}</Typography>
                <Typography fontSize={9} fontWeight={900} color="text.secondary">X</Typography>
                <Typography fontSize={10.5} fontWeight={900}>{pct(percentualFlavio)}</Typography>
                {flavio ? <CandidatoAvatar nome={flavio.nome} foto={flavio.fotoUrl} cor={cor(ESCOPO, flavio, candidatos)} tamanho={24} /> : <Box />}
              </Box>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}

export default function PainelUnicoTV() {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('md'));
  const { brasil, estados, turno, setSempreAtivo } = useEleicao();
  const mapas = useMapasMunicipios();
  const geo = useGeometria();
  const { cidades } = useExterior();
  const [ufMapaIndice, setUfMapaIndice] = useState(0);
  const [ufFaixaIndice, setUfFaixaIndice] = useState(1);
  const ufMapaIndiceRef = useRef(0);
  const ufFaixaIndiceRef = useRef(1);
  const [estadoSelecionado, setEstadoSelecionado] = useState<string | null>(null);
  const [pausado, setPausado] = useState(false);
  const [telaCheia, setTelaCheia] = useState(Boolean(document.fullscreenElement));
  const ufMapa = UFS_ORDENADAS[ufMapaIndice % UFS_ORDENADAS.length];
  const ufFaixa = UFS_ORDENADAS[ufFaixaIndice % UFS_ORDENADAS.length];

  useEffect(() => { setSempreAtivo(true); return () => setSempreAtivo(false); }, [setSempreAtivo]);
  useEffect(() => {
    ufMapaIndiceRef.current = 0;
    ufFaixaIndiceRef.current = 1;
    setUfMapaIndice(0);
    setUfFaixaIndice(1);
  }, [turno]);
  const avancarMapa = useCallback(() => setUfMapaIndice((indice) => {
    const proximo = proximoIndice(indice, ufFaixaIndiceRef.current);
    ufMapaIndiceRef.current = proximo;
    return proximo;
  }), []);
  const ufMapaProxima = UFS_ORDENADAS[proximoIndice(ufMapaIndice, ufFaixaIndice)];
  const avancarFaixa = useCallback(() => setUfFaixaIndice((indice) => {
    const proximo = proximoIndice(indice, ufMapaIndiceRef.current);
    ufFaixaIndiceRef.current = proximo;
    return proximo;
  }), []);
  useEffect(() => {
    const mudar = () => setTelaCheia(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', mudar);
    return () => document.removeEventListener('fullscreenchange', mudar);
  }, []);
  const alternarTelaCheia = () => document.fullscreenElement ? document.exitFullscreen().catch(() => undefined) : document.documentElement.requestFullscreen().catch(() => undefined);

  return (
    <Canvas mobile={mobile}>
      <Stack sx={mobile ? { width: '100%', minHeight: '100dvh', px: 1.25, pt: 0, pb: 1.25, mt: '-7px', gap: 1.25 } : { position: 'absolute', inset: 0, p: 3, gap: 1.5 }}>
        <Topo brasil={brasil} mobile={mobile} />
        <Box sx={{ flex: mobile ? 'none' : 1, minHeight: 0, display: 'grid', gridTemplateColumns: mobile ? 'minmax(0, 1fr)' : 'repeat(3, minmax(0, 1fr)) minmax(0, .96fr)', gridTemplateRows: mobile ? 'auto' : 'minmax(0, 1fr)', gap: mobile ? 1.25 : 1.5 }}>
          {mobile && <ConfrontoMobile brasil={brasil} />}
          {mobile ? (
            <MapaNacionalMobile brasil={brasil} estados={estados} geo={geo} mapa={mapas.presidente} onSelect={setEstadoSelecionado} />
          ) : (
            <>
              <Box height="100%" minWidth={0}><Card titulo="Brasil · por estado" subtitulo="Cor de quem lidera em cada UF"><MapaEstados brasil={brasil} estados={estados} /></Card></Box>
              <Box height="100%" minWidth={0}><Card titulo="Brasil · por município" subtitulo={`${num(Object.keys(mapas.presidente ?? {}).length)} municípios com votos`}><MapaMunicipalCanvas geo={geo} mapa={mapas.presidente} brasil={brasil} /></Card></Box>
              <Box height="100%" minWidth={0}><Card titulo={`${ufMapa.nome} · municípios`} subtitulo="Mapa acima · municípios em duas colunas abaixo">
                <EstadosTV geo={geo} mapa={mapas.presidente} brasil={brasil} uf={ufMapa.sigla.toLowerCase()} proximaUf={ufMapaProxima.sigla.toLowerCase()} pausado={pausado} onConcluirEstado={avancarMapa} />
              </Card></Box>
            </>
          )}
          <Stack sx={{ minWidth: 0, height: mobile ? 'auto' : '100%', bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: '18px', p: 1.5, overflow: 'hidden' }} spacing={.9}>
            {!mobile && <Box><Typography fontSize={17} fontWeight={900} mb={.7}>Presidente · Brasil · {turno}º turno</Typography><CandidatosMunicipiosTV geo={geo} mapa={mapas.presidente} brasil={brasil} /></Box>}
            {mobile && <DestaquesMunicipais geo={geo} mapa={mapas.presidente} brasil={brasil} quantidade={1} />}
            <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 1, minHeight: 0, mt: mobile ? 0 : 'auto !important' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="baseline" mb={.7}><Typography fontSize={16} fontWeight={900}>Exterior</Typography><Typography fontSize={12} color="text.secondary">{mobile ? 4 : 16} locais por vez · automático</Typography></Stack>
              <Exterior cidades={cidades} pausado={pausado} mobile={mobile} />
            </Box>
          </Stack>
        </Box>
        <Stack direction="row" alignItems="center" height={54} spacing={mobile ? .25 : 1.5} sx={{ position: mobile ? 'sticky' : 'static', bottom: mobile ? 8 : 'auto', zIndex: mobile ? 5 : 'auto', bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: '14px', px: mobile ? .5 : 1, boxShadow: mobile ? 3 : 0 }}>
          <Typography fontSize={mobile ? 11 : 14} fontWeight={900} color="primary.main" sx={{ px: mobile ? .6 : 1.2, maxWidth: mobile ? 78 : 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ufFaixa.nome.toUpperCase()}</Typography>
          <FaixaMunicipios brasil={brasil} geo={geo} mapa={mapas.presidente} uf={ufFaixa.sigla.toLowerCase()} pausado={pausado} mobile={mobile} onConcluirEstado={avancarFaixa} />
          <Tooltip title={pausado ? 'Continuar' : 'Pausar'}><IconButton onClick={() => setPausado((v) => !v)}>{pausado ? <IconPlayerPlay /> : <IconPlayerPause />}</IconButton></Tooltip>
          {!mobile && <Tooltip title="Tela cheia"><IconButton onClick={alternarTelaCheia}>{telaCheia ? <IconMinimize /> : <IconMaximize />}</IconButton></Tooltip>}
        </Stack>
      </Stack>
      <DialogoEstado uf={estadoSelecionado} onClose={() => setEstadoSelecionado(null)} geo={geo} mapa={mapas.presidente} brasil={brasil} />
    </Canvas>
  );
}
