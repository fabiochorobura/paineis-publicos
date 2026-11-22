import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconSearch, IconX } from '@tabler/icons-react';
import { CARGOS, CargoId, Resultado } from '../api/tipos';
import { buscarResultado } from '../api/tse';
import { useEleicao } from '../context/EleicaoContext';
import { UF_POR_SIGLA } from '../data/ufs';
import { MapaCargo, municipiosDaUF, useGeometria } from '../tv/useMapaMunicipios';
import { useCores } from '../utils/cores';
import { nomeProprio, num, pct } from '../utils/formato';
import { DashboardCard } from './shared';
import { ListaCandidatos } from './resultado';

const ESCOPO_PRESIDENTE = 'presidente';
const ATUALIZA_MS = 60_000;
const ALTURA_MAX = 460;

/** resumo por município gerado pelo coletor do servidor (/mapa-dados/mapa-<cargo>.json) */
function useMapaCargo(cargo: CargoId) {
  const [mapa, setMapa] = useState<MapaCargo>({});
  useEffect(() => {
    let vivo = true;
    const carregar = () =>
      fetch(`${import.meta.env.BASE_URL}mapa-dados/mapa-${cargo}.json`, { cache: 'no-cache' })
        .then((r) => (r.ok ? (r.json() as Promise<{ m: MapaCargo }>) : null))
        .then((j) => vivo && j && setMapa(j.m))
        .catch(() => undefined);
    setMapa({});
    carregar();
    const id = window.setInterval(carregar, ATUALIZA_MS);
    return () => {
      vivo = false;
      window.clearInterval(id);
    };
  }, [cargo]);
  return mapa;
}

/** código IBGE -> código do município no TSE (para buscar o resultado completo de uma cidade) */
let codigosTse: Promise<Record<string, string>> | null = null;
const carregarCodigos = () =>
  (codigosTse ??= fetch(`${import.meta.env.BASE_URL}municipios-tse.json`)
    .then((r) => r.json() as Promise<Record<string, string>>)
    .catch((e) => {
      codigosTse = null;
      throw e;
    }));

/** largura disponível do elemento (o mapa acompanha a tela do celular) */
function useLargura<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [largura, setLargura] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setLargura(Math.floor(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, largura] as const;
}

/**
 * Mapa dos municípios de um estado, pintados por quem lidera, com busca e o resultado
 * completo da cidade tocada.
 */
export function MunicipiosDoEstado({
  uf,
  cargo,
  estadual,
  mostrar = 'tudo',
  escolhido: escolhidoFora,
  onEscolher,
}: {
  uf: string;
  cargo: CargoId;
  /** resultado do cargo no estado: dá o nome dos candidatos a governador/senador */
  estadual?: Resultado | null;
  /** 'mapa': só o mapa (topo da página); 'lista': busca, lista e resultado da cidade */
  mostrar?: 'tudo' | 'mapa' | 'lista';
  /** cidade escolhida controlada pela página (mapa e lista em lugares diferentes) */
  escolhido?: string | null;
  onEscolher?: (ibge: string | null) => void;
}) {
  const theme = useTheme();
  const { brasil, eleicoes } = useEleicao();
  const { cor, corChave } = useCores();
  const geo = useGeometria();
  const mapa = useMapaCargo(cargo);
  const [caixaRef, largura] = useLargura<HTMLDivElement>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [busca, setBusca] = useState('');
  const [escolhidoAqui, setEscolhidoAqui] = useState<string | null>(null);
  const escolhido = escolhidoFora !== undefined ? escolhidoFora : escolhidoAqui;
  const setEscolhido = onEscolher ?? setEscolhidoAqui;
  const [detalhe, setDetalhe] = useState<{
    ibge: string;
    r: Resultado | null;
    erro?: boolean;
  } | null>(null);

  const presidente = cargo === 'presidente';
  const porPartido = !presidente;
  const escopo = `site-mun-${cargo}`;
  const nomeUf = UF_POR_SIGLA[uf.toUpperCase()]?.nome ?? uf.toUpperCase();

  const lista = useMemo(() => (geo ? municipiosDaUF(geo, uf) : []), [geo, uf]);

  // enquadramento do estado na grade do mapa
  const enquadre = useMemo(() => {
    if (!lista.length) return null;
    let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
    for (const m of lista) {
      x0 = Math.min(x0, m.caixa[0]);
      y0 = Math.min(y0, m.caixa[1]);
      x1 = Math.max(x1, m.caixa[2]);
      y1 = Math.max(y1, m.caixa[3]);
    }
    return { x0, y0, w: Math.max(1, x1 - x0), h: Math.max(1, y1 - y0) };
  }, [lista]);

  const largCanvas = largura || 320;
  const altCanvas = enquadre
    ? Math.min(ALTURA_MAX, Math.round((largCanvas * enquadre.h) / enquadre.w))
    : 0;
  const escala = enquadre ? Math.min(largCanvas / enquadre.w, altCanvas / enquadre.h) : 1;
  const desloc = enquadre
    ? {
        x: (largCanvas - enquadre.w * escala) / 2 - enquadre.x0 * escala,
        y: (altCanvas - enquadre.h * escala) / 2 - enquadre.y0 * escala,
      }
    : { x: 0, y: 0 };

  // cores: presidente segue a cor do candidato no painel nacional; demais cargos, por partido
  const ordemPartidos = useMemo(() => {
    const cont = new Map<string, number>();
    for (const m of lista) {
      const l = mapa[m.ibge];
      if (l) cont.set(l[0], (cont.get(l[0]) ?? 0) + 1);
    }
    return [...cont.entries()].sort((a, b) => b[1] - a[1]);
  }, [lista, mapa]);
  const corDe = (partido: string, numero: string) => {
    if (presidente && brasil) {
      const c = brasil.candidatos.find((x) => x.numero === numero);
      if (c) return cor(ESCOPO_PRESIDENTE, c, brasil.candidatos);
    }
    return corChave(
      escopo,
      partido,
      ordemPartidos.map(([p]) => p),
    );
  };
  const rotulo = (partido: string, numero: string) => {
    if (porPartido && cargo !== 'governador' && cargo !== 'senador') return partido;
    const c = (presidente ? brasil : estadual)?.candidatos.find((x) => x.numero === numero);
    return c ? `${nomeProprio(c.nome)} (${partido})` : `${partido}${numero ? ` · ${numero}` : ''}`;
  };

  // desenho
  useEffect(() => {
    const cv = canvasRef.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx || !enquadre) return;
    const dpr = window.devicePixelRatio || 1;
    cv.width = largCanvas * dpr;
    cv.height = altCanvas * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, largCanvas, altCanvas);
    ctx.setTransform(dpr * escala, 0, 0, dpr * escala, dpr * desloc.x, dpr * desloc.y);
    const vazio = alpha(theme.palette.text.primary, 0.1);
    ctx.lineJoin = 'round';
    ctx.lineWidth = 0.8 / escala;
    ctx.strokeStyle = theme.palette.background.paper;
    for (const m of lista) {
      const l = mapa[m.ibge];
      ctx.globalAlpha = l ? 0.45 + 0.55 * Math.min(1, l[3] / 100) : 1;
      ctx.fillStyle = l ? corDe(l[0], l[1]) : vazio;
      ctx.fill(m.path);
      ctx.globalAlpha = 1;
      ctx.stroke(m.path);
    }
    const sel = lista.find((m) => m.ibge === escolhido);
    if (sel) {
      ctx.lineWidth = 3 / escala;
      ctx.strokeStyle = theme.palette.text.primary;
      ctx.stroke(sel.path);
    }
    // corDe depende de cores registradas: redesenha quando os dados mudam
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lista, mapa, enquadre, largCanvas, altCanvas, escolhido, theme, brasil]);

  // resultado completo da cidade escolhida (pelo cache do servidor)
  useEffect(() => {
    if (!escolhido || !eleicoes || mostrar === 'mapa') {
      setDetalhe(null);
      return;
    }
    const ac = new AbortController();
    setDetalhe({ ibge: escolhido, r: null });
    carregarCodigos()
      .then((codigos) => {
        const cd = codigos[escolhido];
        if (!cd) throw new Error('município sem código do TSE');
        return buscarResultado(eleicoes, cargo, `${uf}${cd}`, ac.signal, uf);
      })
      .then((r) => setDetalhe({ ibge: escolhido, r }))
      .catch((e) => {
        if ((e as Error).name !== 'AbortError')
          setDetalhe({ ibge: escolhido, r: null, erro: true });
      });
    return () => ac.abort();
  }, [escolhido, cargo, uf, eleicoes, mostrar]);

  // troca de estado: limpa a seleção e a busca
  useEffect(() => {
    if (mostrar !== 'mapa') setEscolhido(null);
    setBusca('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uf]);

  const tocar = (ev: React.MouseEvent<HTMLCanvasElement>) => {
    const cv = canvasRef.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx) return;
    const r = cv.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const px = (ev.clientX - r.left) * dpr;
    const py = (ev.clientY - r.top) * dpr;
    ctx.setTransform(dpr * escala, 0, 0, dpr * escala, dpr * desloc.x, dpr * desloc.y);
    const achado = lista.find((m) => ctx.isPointInPath(m.path, px, py));
    if (achado) setEscolhido(achado.ibge);
  };

  const termo = busca.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const filtrados = termo
    ? lista.filter((m) => m.nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(termo))
    : lista;
  const comVotos = lista.filter((m) => mapa[m.ibge]).length;
  const nomeEscolhido = lista.find((m) => m.ibge === escolhido)?.nome;
  const nomeCargo =
    cargo === 'depEstadual' && uf === 'df' ? 'Deputado Distrital' : CARGOS[cargo].nome;

  const desenho = (
    <Box ref={caixaRef} sx={{ width: '100%' }}>
      {!geo ? (
        <Typography color="text.secondary" py={4} textAlign="center">
          Carregando o mapa dos municípios…
        </Typography>
      ) : (
        <canvas
          ref={canvasRef}
          onClick={tocar}
          style={{
            width: largCanvas,
            height: altCanvas,
            display: 'block',
            cursor: 'pointer',
            touchAction: 'manipulation',
          }}
          aria-label={`Mapa dos municípios de ${nomeUf}`}
        />
      )}
    </Box>
  );
  const legendaMapa = `${num(comVotos)} de ${num(lista.length)} municípios com votos`;

  if (mostrar === 'mapa') {
    return (
      <Box>
        <Typography fontWeight={700} mb={0.5}>
          {nomeCargo} por município · {nomeUf}
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={1}>
          Toque numa cidade para ver o resultado completo · {legendaMapa}
        </Typography>
        {desenho}
      </Box>
    );
  }

  return (
    <DashboardCard
      titulo={
        mostrar === 'lista'
          ? `Cidades · ${nomeCargo} · ${nomeUf}`
          : `${nomeCargo} por município · ${nomeUf}`
      }
      subtitulo={
        mostrar === 'lista'
          ? `Busque a cidade ou toque nela no mapa acima para ver o resultado completo. ${legendaMapa}.`
          : `Toque numa cidade no mapa ou na lista para ver o resultado completo. ${legendaMapa}.`
      }
    >
      {mostrar === 'tudo' && desenho}
      {escolhido && (
        <Box
          sx={{
            mt: 2,
            p: { xs: 1.5, sm: 2 },
            borderRadius: '12px',
            border: 1,
            borderColor: 'divider',
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography variant="h6" fontWeight={800}>
              {nomeEscolhido}
            </Typography>
            <Button size="small" startIcon={<IconX size={16} />} onClick={() => setEscolhido(null)}>
              Fechar
            </Button>
          </Stack>
          {detalhe?.ibge === escolhido && detalhe.r ? (
            <>
              <Typography variant="body2" color="text.secondary" mb={1.5}>
                {pct(detalhe.r.pctSecoes)} das seções apuradas · {num(detalhe.r.comparecimento)}{' '}
                votantes
              </Typography>
              <ListaCandidatos
                r={detalhe.r}
                escopo={presidente ? ESCOPO_PRESIDENTE : escopo}
                max={presidente ? undefined : 10}
              />
            </>
          ) : (
            <Typography color="text.secondary" py={1}>
              {detalhe?.erro
                ? 'Resultado desta cidade ainda não disponível.'
                : 'Buscando o resultado da cidade…'}
            </Typography>
          )}
        </Box>
      )}

      <TextField
        fullWidth
        size="small"
        placeholder={`Buscar cidade em ${nomeUf}`}
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        sx={{ mt: 2, mb: 1 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <IconSearch size={18} />
            </InputAdornment>
          ),
        }}
      />
      <Box sx={{ maxHeight: 420, overflowY: 'auto' }}>
        {filtrados.map((m) => {
          const l = mapa[m.ibge];
          return (
            <Stack
              key={m.ibge}
              direction="row"
              spacing={1.25}
              alignItems="center"
              onClick={() => setEscolhido(m.ibge)}
              sx={{
                py: 1,
                px: 0.5,
                cursor: 'pointer',
                borderBottom: 1,
                borderColor: 'divider',
                bgcolor:
                  m.ibge === escolhido ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
              }}
            >
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  flexShrink: 0,
                  bgcolor: l ? corDe(l[0], l[1]) : 'action.disabled',
                }}
              />
              <Box flex={1} minWidth={0}>
                <Typography fontWeight={700} noWrap>
                  {m.nome}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {l ? `${rotulo(l[0], l[1])} · ${pct(l[3], 0)} apurado` : 'aguardando votos'}
                </Typography>
              </Box>
              {l && (
                <Typography fontWeight={800} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                  {pct(l[2], 0)}
                </Typography>
              )}
            </Stack>
          );
        })}
        {!filtrados.length && (
          <Typography color="text.secondary" textAlign="center" py={2}>
            Nenhuma cidade encontrada para “{busca}”.
          </Typography>
        )}
      </Box>
    </DashboardCard>
  );
}
