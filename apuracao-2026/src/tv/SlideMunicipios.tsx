import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { alpha, keyframes, useTheme } from '@mui/material/styles';
import { Candidato, CargoId, Resultado } from '../api/tipos';
import { MAX_SERIES, useCores } from '../utils/cores';
import { nomeProprio, num, pct } from '../utils/formato';
import { CandidatoAvatar } from '../components/shared';
import { UF_POR_SIGLA } from '../data/ufs';
import { Geometria, MapaCargo, municipiosDaUF, UF_IBGE, useGeometria } from './useMapaMunicipios';
import { SLIDE_H } from './slides';
import { MarcaPartido } from '../components/MarcaPartido';

const ESCOPO_PRESIDENTE = 'presidente';
const VAZIO = {};
const ALTURA_MAPA = SLIDE_H - 20;
const LARGURA_MAXIMA_MAPA = 1080;

/** lista rolante: 7 municípios por vez, 2s cada página; o slide dura o tempo de todas */
export const MUNICIPIOS_POR_PAGINA = 7;
export const SEGUNDOS_POR_PAGINA = 2;

/** tamanho de cada linha da lista (fixo: a rolagem anda em velocidade constante) */
const ALTURA_LINHA = 50;

/** altura de um elemento acompanhando mudanças de layout */
function useAltura<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [altura, setAltura] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setAltura(Math.floor(e.contentRect.height)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, altura] as const;
}

/**
 * Municípios da UF rolando de forma contínua (de baixo para cima, velocidade constante).
 * Repete sem parar: depois do último município volta o primeiro, sem salto.
 */
function ListaMunicipios({
  geo,
  uf,
  mapa,
  pausado,
  rotulo,
  corDe,
}: {
  geo: Geometria;
  uf: string;
  mapa: MapaCargo | undefined;
  pausado: boolean;
  rotulo: (partido: string, numero: string) => string;
  corDe: (partido: string, numero: string) => string;
}) {
  const lista = useMemo(() => municipiosDaUF(geo, uf), [geo, uf]);
  const [caixaRef, visivel] = useAltura<HTMLDivElement>();
  const total = lista.length * ALTURA_LINHA;
  // só rola se a lista não couber; rolando, ela vai duplicada e emenda o fim no começo sem salto
  const rola = visivel > 0 && total > visivel;
  // 7 municípios a cada 2s, 5% + 5% mais devagar
  const segundos = (lista.length * SEGUNDOS_POR_PAGINA) / MUNICIPIOS_POR_PAGINA / (0.95 * 0.95);
  const rolar = useMemo(
    () => keyframes`from { transform: translateY(0); } to { transform: translateY(-${total}px); }`,
    [total],
  );

  return (
    <Stack flex={1} minHeight={0}>
      <Typography
        fontSize={14}
        fontWeight={800}
        color="text.secondary"
        sx={{ letterSpacing: 1 }}
        mb={0.75}
        noWrap
      >
        {UF_POR_SIGLA[uf.toUpperCase()]?.nome.toUpperCase()} · {lista.length} MUNICÍPIOS
      </Typography>
      <Box
        ref={caixaRef}
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          // some suave nas bordas de cima e de baixo
          maskImage: 'linear-gradient(transparent, #000 6%, #000 94%, transparent)',
          WebkitMaskImage: 'linear-gradient(transparent, #000 6%, #000 94%, transparent)',
        }}
      >
        <Box
          key={`${uf}-${total}-${rola}`}
          sx={{
            animation: rola ? `${rolar} ${segundos}s linear infinite` : 'none',
            animationPlayState: pausado ? 'paused' : 'running',
          }}
        >
          {(rola ? [...lista, ...lista] : lista).map((m, n) => {
            const l = mapa?.[m.ibge];
            return (
              <Box
                key={`${n < lista.length ? 'a' : 'b'}-${m.ibge}`}
                sx={{ height: ALTURA_LINHA, borderBottom: 1, borderColor: 'divider', pt: 0.5 }}
              >
                <Stack direction="row" spacing={1} alignItems="baseline">
                  <Typography
                    fontSize={17}
                    fontWeight={800}
                    noWrap
                    flex={1}
                    minWidth={0}
                    lineHeight={1.25}
                  >
                    {m.nome}
                  </Typography>
                  {l && (
                    <Typography
                      fontSize={16}
                      fontWeight={800}
                      lineHeight={1.25}
                      sx={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {pct(l[2], 0)}
                    </Typography>
                  )}
                </Stack>
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      flexShrink: 0,
                      bgcolor: l ? corDe(l[0], l[1]) : 'action.disabled',
                    }}
                  />
                  <Typography fontSize={14} color="text.secondary" noWrap lineHeight={1.25}>
                    {l ? `${rotulo(l[0], l[1])} · ${pct(l[3], 0)} apurado` : 'aguardando votos'}
                  </Typography>
                </Stack>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Stack>
  );
}

/** Mapa do Brasil por município em canvas: 5.570 polígonos em SVG pesariam demais em TV. */
/** resolução interna do canvas (a TV já escala a tela inteira; 2x pesava sem ganho visível) */
const RESOLUCAO = 1.5;

/**
 * Mapa já desenhado por (dados do cargo, tema): ao voltar para o mesmo painel no rodízio a
 * imagem é só copiada, sem redesenhar os 5.570 municípios.
 */
const desenhos = new WeakMap<object, Map<string, HTMLCanvasElement>>();

/** Mapa do Brasil por município em canvas: 5.570 polígonos em SVG pesariam demais em TV. */
function MapaMunicipios({
  geo,
  cores,
  dados,
  uf,
}: {
  geo: Geometria;
  cores: Record<string, { cor: string; pst: number }>;
  /** objeto dos dados do cargo: identifica o desenho guardado */
  dados: object;
  uf: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const theme = useTheme();
  const municipios = useMemo(() => municipiosDaUF(geo, uf), [geo, uf]);
  const enquadre = useMemo(() => {
    let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
    municipios.forEach(({ caixa }) => {
      x0 = Math.min(x0, caixa[0]);
      y0 = Math.min(y0, caixa[1]);
      x1 = Math.max(x1, caixa[2]);
      y1 = Math.max(y1, caixa[3]);
    });
    return { x0, y0, w: Math.max(1, x1 - x0), h: Math.max(1, y1 - y0) };
  }, [municipios]);
  const largura = Math.min(LARGURA_MAXIMA_MAPA, Math.round((ALTURA_MAPA * enquadre.w) / enquadre.h));
  const W = Math.round(largura * RESOLUCAO);
  const H = Math.round(ALTURA_MAPA * RESOLUCAO);

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx) return;
    const chave = `${theme.palette.mode}|${uf}|${W}`;
    let porDados = desenhos.get(dados);
    if (!porDados) {
      porDados = new Map();
      desenhos.set(dados, porDados);
    }
    let pronto = porDados.get(chave);
    if (!pronto) {
      pronto = document.createElement('canvas');
      pronto.width = W;
      pronto.height = H;
      const off = pronto.getContext('2d');
      if (!off) return;
      const escala = Math.min(W / enquadre.w, H / enquadre.h);
      const dx = (W - enquadre.w * escala) / 2 - enquadre.x0 * escala;
      const dy = (H - enquadre.h * escala) / 2 - enquadre.y0 * escala;
      off.setTransform(escala, 0, 0, escala, dx, dy);
      const vazio = alpha(theme.palette.text.primary, 0.09);
      for (const { ibge, path } of municipios) {
        const c = cores[ibge];
        off.globalAlpha = c ? 0.45 + 0.55 * Math.min(1, c.pst / 100) : 1;
        off.fillStyle = c ? c.cor : vazio;
        off.fill(path);
      }
      off.globalAlpha = 1;
      off.lineJoin = 'round';
      off.strokeStyle = alpha(theme.palette.background.paper, 0.55);
      off.lineWidth = 0.6;
      const contornoEstado = new Path2D();
      municipios.forEach(({ path }) => contornoEstado.addPath(path));
      off.stroke(contornoEstado);
      porDados.set(chave, pronto);
    }
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(pronto, 0, 0);
  }, [geo, cores, dados, uf, municipios, enquadre, W, H, theme]);

  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      style={{ width: largura, height: ALTURA_MAPA, display: 'block' }}
    />
  );
}

interface Item {
  chave: string;
  cor: string;
  municipios: number;
  candidato?: Candidato;
  partido: string;
}

export function SlideMunicipios({
  cargo,
  mapa,
  brasil,
  uf,
  estadual,
  pausado,
}: {
  cargo: CargoId;
  mapa: MapaCargo | undefined;
  brasil: Resultado | null;
  /** UF da lista rolante (a mesma escolhida para a Assembleia) */
  uf: string;
  /** resultado do cargo nessa UF: dá o nome dos candidatos a governador/senador */
  estadual: Resultado | null;
  pausado: boolean;
}) {
  const geo = useGeometria();
  const { cor, corChave, outros } = useCores();
  const porPartido = cargo === 'depFederal' || cargo === 'depEstadual';
  const presidente = cargo === 'presidente';
  const escopo = `tv-mun-${cargo}`;
  // presidente: cor por candidato (a mesma do painel nacional); demais cargos: por partido,
  // senão o mesmo partido apareceria várias vezes (um candidato diferente em cada estado)
  const chaveDe = (partido: string, numero: string) => (presidente ? numero || partido : partido);
  const lideres = useMemo(
    () => Object.entries(mapa ?? {}).filter(([ibge]) => UF_IBGE[ibge.slice(0, 2)] === uf),
    [mapa, uf],
  );

  // quem lidera em mais municípios primeiro: define a ordem das cores
  const contagem = new Map<string, { n: number; partido: string; numero: string }>();
  for (const [, [partido, numero]] of lideres) {
    const chave = chaveDe(partido, numero);
    const atual = contagem.get(chave);
    if (atual) atual.n += 1;
    else contagem.set(chave, { n: 1, partido, numero });
  }
  const ordem = [...contagem.entries()].sort((a, b) => b[1].n - a[1].n);
  const chaves = ordem.map(([k]) => k);
  const candidatoDe = (numero: string) => brasil?.candidatos.find((c) => c.numero === numero);
  const corDe = (chave: string) => {
    if (presidente && brasil) {
      const c = candidatoDe(chave);
      if (c) return cor(ESCOPO_PRESIDENTE, c, brasil.candidatos);
    }
    return corChave(escopo, chave, chaves);
  };

  // só muda quando chegam dados novos do cargo: o mapa não é redesenhado a cada atualização da tela
  const cores = useMemo(() => {
    const saida: Record<string, { cor: string; pst: number }> = {};
    for (const [ibge, [partido, numero, , pst]] of lideres)
      saida[ibge] = { cor: corDe(chaveDe(partido, numero)), pst };
    return saida;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lideres, presidente, Boolean(brasil)]);

  const itens: Item[] = ordem.slice(0, MAX_SERIES).map(([chave, v]) => ({
    chave,
    cor: corDe(chave),
    municipios: v.n,
    partido: v.partido,
    candidato: presidente ? candidatoDe(v.numero) : undefined,
  }));
  const resto = ordem.slice(MAX_SERIES).reduce((s, [, v]) => s + v.n, 0);
  const total = geo ? municipiosDaUF(geo, uf).length : 0;

  const rotulo = (partido: string, numero: string) => {
    if (porPartido) return partido;
    const c = presidente
      ? candidatoDe(numero)
      : estadual?.candidatos.find((x) => x.numero === numero);
    return c ? `${nomeProprio(c.nome)} (${partido})` : partido;
  };

  return (
    <Stack direction="row" spacing={3} height={SLIDE_H}>
      {/* esquerda: quem lidera, números e a lista rolando */}
      <Stack flex={1} minWidth={0} spacing={1.5} height={SLIDE_H}>
        <Typography
          fontSize={15}
          fontWeight={800}
          color="text.secondary"
          sx={{ letterSpacing: 1.2 }}
        >
          {porPartido
            ? 'PARTIDO MAIS VOTADO · Nº DE MUNICÍPIOS'
            : presidente
              ? 'QUEM LIDERA · Nº DE MUNICÍPIOS'
              : 'PARTIDO QUE LIDERA · Nº DE MUNICÍPIOS'}
        </Typography>
        {itens.length === 0 ? (
          <Typography fontSize={20} color="text.secondary">
            Cada município ganha a cor de quem estiver na frente assim que a apuração começar.
          </Typography>
        ) : (
          <Stack spacing={0.75}>
            {itens.map((i) => (
              <Stack key={i.chave} direction="row" spacing={1.25} alignItems="center">
                {i.candidato ? (
                  <CandidatoAvatar
                    nome={i.candidato.nome}
                    foto={i.candidato.fotoUrl}
                    cor={i.cor}
                    tamanho={38}
                  />
                ) : (
                  <MarcaPartido sigla={i.partido} cor={i.cor} tamanho={18} />
                )}
                <Box flex={1} minWidth={0}>
                  <Typography fontSize={18} fontWeight={800} noWrap lineHeight={1.2}>
                    {i.candidato ? nomeProprio(i.candidato.nome) : i.partido}
                  </Typography>
                  {i.candidato && (
                    <Typography fontSize={13} color="text.secondary" noWrap lineHeight={1.2}>
                      {i.partido}
                    </Typography>
                  )}
                </Box>
                <Typography
                  fontSize={21}
                  fontWeight={800}
                  sx={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {num(i.municipios)}
                </Typography>
              </Stack>
            ))}
            {resto > 0 && (
              <Stack direction="row" spacing={1.25} alignItems="center">
                <Box
                  sx={{
                    width: 18,
                    height: 18,
                    borderRadius: '4px',
                    bgcolor: outros,
                    flexShrink: 0,
                  }}
                />
                <Typography fontSize={18} fontWeight={700} flex={1}>
                  Outros
                </Typography>
                <Typography
                  fontSize={21}
                  fontWeight={800}
                  sx={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {num(resto)}
                </Typography>
              </Stack>
            )}
          </Stack>
        )}
        <Typography
          fontSize={15}
          color="text.secondary"
          sx={{ pt: 1, borderTop: 1, borderColor: 'divider' }}
        >
          {num(lideres.length)} de {num(total)} municípios com votos (
          {pct((lideres.length / total) * 100, 0)}) · cor mais forte = mais apurado
        </Typography>
        {geo && (
          <ListaMunicipios
            geo={geo}
            uf={uf}
            mapa={mapa}
            pausado={pausado}
            rotulo={rotulo}
            corDe={(partido, numero) => corDe(chaveDe(partido, numero))}
          />
        )}
      </Stack>

      {/* direita: o mapa */}
      <Box flexShrink={0} display="flex" alignItems="center" justifyContent="center">
        {geo ? (
          <MapaMunicipios geo={geo} cores={cores} dados={mapa ?? VAZIO} uf={uf} />
        ) : (
          <Typography fontSize={20} color="text.secondary">
            Carregando o mapa dos municípios…
          </Typography>
        )}
      </Box>
    </Stack>
  );
}
