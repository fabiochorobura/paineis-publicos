import { ReactNode } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconClock, IconTrophy } from '@tabler/icons-react';
import { Candidato, Resultado } from '../api/tipos';
import { vagas } from '../api/simulacao';
import { UF_POR_SIGLA, UFS } from '../data/ufs';
import { useCores } from '../utils/cores';
import { compacto, nomeProprio, num, pct } from '../utils/formato';
import { CandidatoAvatar } from '../components/shared';
import { MapaBrasil, PreenchimentoUF } from './MapaBrasil';
import { Hemiciclo } from './Hemiciclo';
import type { PorUF } from './useDadosTV';
import { MarcaPartido } from '../components/MarcaPartido';

/** área útil de cada slide, em pixels do canvas 1920×1080 */
export const SLIDE_W = 1780;
export const SLIDE_H = 760;

const ESCOPO_PRESIDENTE = 'presidente';

// ---------------------------------------------------------------- utilidades

/** nome curto para caber nas listas: "Helena Maria Duarte" -> "Helena Duarte" */
function curto(nome: string) {
  const p = nomeProprio(nome)
    .split(' ')
    .filter((x) => !['da', 'de', 'do', 'das', 'dos', 'e'].includes(x));
  return p.length > 1 ? `${p[0]} ${p[p.length - 1]}` : (p[0] ?? '');
}

function Aguardando({ titulo }: { titulo: string }) {
  return (
    <Stack
      height={SLIDE_H}
      alignItems="center"
      justifyContent="center"
      spacing={2}
      sx={{ color: 'text.secondary' }}
    >
      <IconClock size={96} stroke={1.1} />
      <Typography fontSize={34} fontWeight={700} color="text.primary">
        {titulo}
      </Typography>
      <Typography fontSize={22}>Aguardando a divulgação do TSE — atualiza sozinho.</Typography>
    </Stack>
  );
}

function Legenda({
  itens,
}: {
  itens: { chave: string; cor: string; rotulo: string; valor?: string }[];
}) {
  return (
    <Stack direction="row" flexWrap="wrap" columnGap={2.5} rowGap={1}>
      {itens.map((i) => (
        <Stack key={i.chave} direction="row" spacing={1} alignItems="center">
          <MarcaPartido sigla={i.chave} cor={i.cor} tamanho={16} />
          <Typography fontSize={17} fontWeight={700}>
            {i.rotulo}
          </Typography>
          {i.valor && (
            <Typography fontSize={17} color="text.secondary">
              {i.valor}
            </Typography>
          )}
        </Stack>
      ))}
    </Stack>
  );
}

function SubTitulo({ children }: { children: ReactNode }) {
  return (
    <Typography
      fontSize={15}
      fontWeight={800}
      color="text.secondary"
      sx={{ letterSpacing: 1.2, textTransform: 'uppercase' }}
      mb={1.25}
    >
      {children}
    </Typography>
  );
}

/** Ordena partidos pelo nº de estados em que lideram — define a ordem das cores. */
function partidosLideres(porUF: PorUF) {
  const cont = new Map<string, number>();
  Object.values(porUF).forEach((r) => {
    const l = r.candidatos[0];
    if (l && l.votos > 0) cont.set(l.partido, (cont.get(l.partido) ?? 0) + 1);
  });
  return [...cont.entries()].sort((a, b) => b[1] - a[1]);
}

// ---------------------------------------------------------------- 1. Presidente no mapa

export function SlidePresidenteMapa({
  brasil,
  estados,
}: {
  brasil: Resultado | null;
  estados: PorUF;
}) {
  const { cor } = useCores();
  if (!brasil) return <Aguardando titulo="Presidente por estado" />;

  const ref = brasil.candidatos;
  const preenchimento: Record<string, PreenchimentoUF> = {};
  const cont = new Map<string, number>();
  Object.entries(estados).forEach(([uf, r]) => {
    const l = r.candidatos[0];
    if (!l || l.votos <= 0) return;
    cont.set(l.numero, (cont.get(l.numero) ?? 0) + 1);
    preenchimento[uf] = {
      cor: cor(ESCOPO_PRESIDENTE, l, ref),
      intensidade: r.pctSecoes / 100,
      rotulo: `${Math.round(l.pct)}%`,
    };
  });

  const acirradas = Object.entries(estados)
    .filter(([, r]) => r.candidatos.length > 1 && r.candidatos[0].votos > 0)
    .map(([uf, r]) => ({
      uf,
      a: r.candidatos[0],
      b: r.candidatos[1],
      margem: r.candidatos[0].pct - r.candidatos[1].pct,
    }))
    .sort((x, y) => x.margem - y.margem)
    .slice(0, 5);

  return (
    <Stack direction="row" spacing={6} height={SLIDE_H}>
      <Box width={1050} display="grid" sx={{ placeItems: 'center' }}>
        <MapaBrasil preenchimento={preenchimento} largura={1020} altura={730} />
      </Box>
      <Stack flex={1} spacing={4} minWidth={0} justifyContent="center">
        {cont.size === 0 && (
          <Typography fontSize={22} color="text.secondary">
            Os estados ganham a cor do candidato que estiver na frente assim que a apuração começar.
          </Typography>
        )}
        <Box sx={{ display: cont.size ? 'block' : 'none' }}>
          <SubTitulo>Estados liderados</SubTitulo>
          <Stack spacing={1.5}>
            {ref
              .filter((c) => cont.has(c.numero))
              .map((c) => (
                <Stack key={c.numero} direction="row" spacing={1.5} alignItems="center">
                  <CandidatoAvatar
                    nome={c.nome}
                    foto={c.fotoUrl}
                    cor={cor(ESCOPO_PRESIDENTE, c, ref)}
                    tamanho={52}
                  />
                  <Box flex={1} minWidth={0}>
                    <Typography fontSize={21} fontWeight={800} noWrap>
                      {curto(c.nome)}
                    </Typography>
                    <Typography fontSize={16} color="text.secondary">
                      {c.partido}
                    </Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography fontSize={30} fontWeight={800} lineHeight={1}>
                      {cont.get(c.numero)}
                    </Typography>
                    <Typography fontSize={14} color="text.secondary">
                      {cont.get(c.numero) === 1 ? 'estado' : 'estados'}
                    </Typography>
                  </Box>
                </Stack>
              ))}
          </Stack>
        </Box>
        {acirradas.length > 0 && (
          <Box>
            <SubTitulo>Disputas mais acirradas</SubTitulo>
            <Stack spacing={1}>
              {acirradas.map(({ uf, a, b, margem }) => (
                <Stack
                  key={uf}
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                  sx={{ py: 0.75, borderBottom: 1, borderColor: 'divider' }}
                >
                  <Typography fontSize={18} fontWeight={800} width={36}>
                    {uf.toUpperCase()}
                  </Typography>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: cor(ESCOPO_PRESIDENTE, a, ref),
                    }}
                  />
                  <Typography fontSize={16} noWrap flex={1}>
                    {curto(a.nome)} × {curto(b.nome)}
                  </Typography>
                  <Typography
                    fontSize={17}
                    fontWeight={700}
                    sx={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {margem.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} p.p.
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        )}
      </Stack>
    </Stack>
  );
}

// ---------------------------------------------------------------- 2/3. Governadores e Senadores

function MarcaSituacao({ c }: { c: Candidato }) {
  const theme = useTheme();
  if (c.eleito)
    return <IconTrophy size={18} color={theme.palette.success.main} aria-label="Eleito" />;
  if (/2º/.test(c.situacao))
    return (
      <Typography
        component="span"
        fontSize={12}
        fontWeight={800}
        sx={{
          px: 0.6,
          borderRadius: '4px',
          bgcolor: alpha(theme.palette.info.main, 0.2),
          color: 'info.main',
        }}
      >
        2ºT
      </Typography>
    );
  return null;
}

export function SlideEstadual({ porUF, cargo }: { porUF: PorUF; cargo: 'governador' | 'senador' }) {
  const { corChave } = useCores();
  const escopo = `tv-partido-${cargo}`;
  const nomeCargo = cargo === 'governador' ? 'Governadores' : 'Senado';
  if (!Object.keys(porUF).length) return <Aguardando titulo={nomeCargo} />;

  const lideres = partidosLideres(porUF);
  const ordem = lideres.map(([p]) => p);
  const corDe = (partido: string) => corChave(escopo, partido, ordem);

  const preenchimento: Record<string, PreenchimentoUF> = {};
  Object.entries(porUF).forEach(([uf, r]) => {
    const l = r.candidatos[0];
    if (l && l.votos > 0)
      preenchimento[uf] = {
        cor: corDe(l.partido),
        intensidade: r.pctSecoes / 100,
        rotulo: l.partido,
      };
  });

  // cada partido tem cor e logo próprios: a legenda mostra todos (sem agrupar em "Outros")
  const legenda = lideres.map(([p, n]) => ({ chave: p, cor: corDe(p), rotulo: p, valor: `${n}` }));

  const linhas = UFS.map((u) => ({ u, r: porUF[u.sigla.toLowerCase()] })).sort((a, b) =>
    a.u.sigla.localeCompare(b.u.sigla),
  );

  const gov = cargo === 'governador';
  return (
    <Stack direction="row" spacing={3} height={SLIDE_H}>
      <Stack width={470} spacing={2} justifyContent="center" flexShrink={0}>
        <MapaBrasil preenchimento={preenchimento} largura={470} altura={470} />
        <Box>
          <SubTitulo>Partido que lidera · nº de estados</SubTitulo>
          <Legenda itens={legenda} />
        </Box>
      </Stack>
      <Box
        flex={1}
        minWidth={0}
        sx={{
          display: 'grid',
          gridAutoFlow: 'column',
          gridTemplateRows: `repeat(${gov ? 14 : 27}, 1fr)`,
          gridTemplateColumns: gov ? 'repeat(2, minmax(0, 1fr))' : 'minmax(0, 1fr)',
          columnGap: 3,
          height: SLIDE_H,
        }}
      >
        {linhas.map(({ u, r }) => {
          const [a, b] = r?.candidatos ?? [];
          const tem = a && a.votos > 0;
          return (
            <Stack
              key={u.sigla}
              direction="row"
              spacing={1.25}
              alignItems="center"
              sx={{ borderBottom: 1, borderColor: 'divider', minWidth: 0 }}
            >
              <Box
                sx={{
                  width: 40,
                  py: gov ? 0.5 : 0.1,
                  textAlign: 'center',
                  borderRadius: '6px',
                  bgcolor: tem ? corDe(a.partido) : 'action.disabledBackground',
                  color: tem ? '#fff' : 'text.secondary',
                  fontWeight: 800,
                  fontSize: 15,
                  flexShrink: 0,
                }}
              >
                {u.sigla}
              </Box>
              {!tem ? (
                <Typography fontSize={15} color="text.secondary" noWrap>
                  {UF_POR_SIGLA[u.sigla].nome} · aguardando
                </Typography>
              ) : gov ? (
                <>
                  <Box flex={1} minWidth={0}>
                    <Typography fontSize={17} fontWeight={700} noWrap lineHeight={1.15}>
                      {curto(a.nome)}
                    </Typography>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <Typography fontSize={13} color="text.secondary" noWrap>
                        {a.partido}
                      </Typography>
                      <MarcaSituacao c={a} />
                    </Stack>
                  </Box>
                  <Typography
                    fontSize={20}
                    fontWeight={800}
                    flexShrink={0}
                    sx={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {pct(a.pct, 1)}
                  </Typography>
                </>
              ) : (
                [a, b].filter(Boolean).map((c, i) => (
                  <Stack
                    key={c.numero}
                    direction="row"
                    spacing={0.75}
                    alignItems="center"
                    flex={1}
                    minWidth={0}
                    pr={i === 0 ? 2 : 0}
                  >
                    <Box
                      sx={{
                        width: 9,
                        height: 9,
                        borderRadius: '50%',
                        bgcolor: corDe(c.partido),
                        flexShrink: 0,
                      }}
                    />
                    <Typography
                      fontSize={15.5}
                      fontWeight={i === 0 ? 800 : 600}
                      noWrap
                      flex={1}
                      minWidth={0}
                    >
                      {curto(c.nome)}
                    </Typography>
                    <MarcaSituacao c={c} />
                    <Typography
                      fontSize={15.5}
                      fontWeight={700}
                      flexShrink={0}
                      sx={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {pct(c.pct, 1)}
                    </Typography>
                  </Stack>
                ))
              )}
            </Stack>
          );
        })}
      </Box>
    </Stack>
  );
}

// ---------------------------------------------------------------- 4/5. Deputados

function BarrasPartidos({
  itens,
  unidade,
}: {
  itens: { partido: string; valor: number; cor: string }[];
  unidade: 'cadeiras' | 'votos';
}) {
  const max = Math.max(1, ...itens.map((i) => i.valor));
  return (
    <Stack spacing={1}>
      {itens.map((i) => (
        <Stack key={i.partido} direction="row" spacing={1.5} alignItems="center">
          <MarcaPartido sigla={i.partido} cor={i.cor} tamanho={18} />
          <Typography fontSize={16} fontWeight={700} width={92} noWrap>
            {i.partido}
          </Typography>
          <Box
            flex={1}
            height={20}
            sx={{
              bgcolor: (t) => alpha(t.palette.text.primary, 0.06),
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                width: `${(i.valor / max) * 100}%`,
                height: '100%',
                bgcolor: i.cor,
                borderRadius: '4px',
                transition: 'width .6s ease',
              }}
            />
          </Box>
          <Typography
            fontSize={17}
            fontWeight={800}
            width={78}
            textAlign="right"
            sx={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {unidade === 'cadeiras' ? i.valor : compacto(i.valor)}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

function SlideDeputados({
  resultados,
  totalCadeiras,
  escopo,
  titulo,
  mostrarUF,
}: {
  resultados: Resultado[];
  totalCadeiras: number;
  escopo: string;
  titulo: string;
  mostrarUF: boolean;
}) {
  const { corChave, outros } = useCores();
  if (!resultados.length) return <Aguardando titulo={titulo} />;

  const cadeiras = new Map<string, number>();
  const votos = new Map<string, number>();
  const todos: (Candidato & { uf: string })[] = [];
  resultados.forEach((r) =>
    r.candidatos.forEach((c) => {
      votos.set(c.partido, (votos.get(c.partido) ?? 0) + c.votos);
      if (c.eleito) cadeiras.set(c.partido, (cadeiras.get(c.partido) ?? 0) + 1);
      todos.push({ ...c, uf: r.abrangencia });
    }),
  );
  const definidas = [...cadeiras.values()].reduce((s, n) => s + n, 0);
  const temEleitos = definidas > 0;
  const fonte = temEleitos ? cadeiras : votos;
  const ranking = [...fonte.entries()].sort((a, b) => b[1] - a[1]);
  const ordem = ranking.map(([p]) => p);
  // sem votos ainda: não distribui as cores (a ordem zerada prenderia as cores aos partidos errados)
  const semVotos = ranking.every(([, n]) => n === 0);
  const corDe = (p: string) => (semVotos ? outros : corChave(escopo, p, ordem));

  const bancadas = [...cadeiras.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([partido, n]) => ({ partido, cadeiras: n, cor: corDe(partido) }));
  const maisVotados = todos.sort((a, b) => b.votos - a.votos).slice(0, 6);
  const apuracao =
    resultados.reduce((s, r) => s + r.secoesTotalizadas, 0) /
    Math.max(
      1,
      resultados.reduce((s, r) => s + r.secoesTotal, 0),
    );

  return (
    <Stack direction="row" spacing={4} height={SLIDE_H}>
      <Stack width={600} spacing={2.5} justifyContent="center">
        <Hemiciclo
          total={totalCadeiras}
          bancadas={bancadas}
          largura={600}
          rotuloCentro={`${definidas}/${totalCadeiras}`}
          subtituloCentro={temEleitos ? 'cadeiras definidas' : 'cadeiras a definir'}
        />
        <Legenda
          itens={ranking.slice(0, 8).map(([p, v]) => ({
            chave: p,
            cor: corDe(p),
            rotulo: p,
            valor: temEleitos ? String(v) : undefined,
          }))}
        />
        <Typography fontSize={16} color="text.secondary">
          {pct(apuracao * 100, 1)} das seções apuradas · as cadeiras aparecem conforme cada estado
          conclui a totalização.
        </Typography>
      </Stack>
      <Stack flex={1} spacing={3.5} minWidth={0} justifyContent="center">
        <Box>
          <SubTitulo>
            {temEleitos
              ? 'Eleitos por partido / federação'
              : 'Votos por partido / federação (parcial)'}
          </SubTitulo>
          <BarrasPartidos
            itens={ranking
              .slice(0, 8)
              .map(([partido, valor]) => ({ partido, valor, cor: corDe(partido) }))}
            unidade={temEleitos ? 'cadeiras' : 'votos'}
          />
        </Box>
        <Box>
          <SubTitulo>Mais votados</SubTitulo>
          <Stack spacing={0.5}>
            {maisVotados.map((c, i) => (
              <Stack
                key={`${c.uf}-${c.numero}`}
                direction="row"
                spacing={1.5}
                alignItems="center"
                sx={{ py: 0.6, borderBottom: 1, borderColor: 'divider' }}
              >
                <Typography fontSize={15} color="text.secondary" fontWeight={700} width={26}>
                  {i + 1}º
                </Typography>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: corDe(c.partido),
                    flexShrink: 0,
                  }}
                />
                <Typography fontSize={18} fontWeight={700} noWrap flex={1}>
                  {curto(c.nome)}
                  <Typography component="span" fontSize={14} color="text.secondary" ml={1}>
                    {c.partido}
                    {mostrarUF ? ` · ${c.uf.toUpperCase()}` : ''}
                  </Typography>
                </Typography>
                {c.eleito && <IconTrophy size={18} />}
                <Typography
                  fontSize={18}
                  fontWeight={800}
                  sx={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {num(c.votos)}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      </Stack>
    </Stack>
  );
}

/** 2026 renova 2/3 do Senado: 54 cadeiras em disputa (2 por estado) */
export function SlideSenadoCadeiras({ porUF }: { porUF: PorUF }) {
  return (
    <SlideDeputados
      resultados={Object.values(porUF)}
      totalCadeiras={54}
      escopo="tv-senado-cadeiras"
      titulo="Senado Federal"
      mostrarUF
    />
  );
}

export function SlideDepFederais({ porUF }: { porUF: PorUF }) {
  return (
    <SlideDeputados
      resultados={Object.values(porUF)}
      totalCadeiras={513}
      escopo="tv-depFederal"
      titulo="Câmara dos Deputados"
      mostrarUF
    />
  );
}

export function SlideDepEstaduais({ r, uf }: { r: Resultado | null; uf: string }) {
  return (
    <SlideDeputados
      resultados={r ? [r] : []}
      totalCadeiras={r?.vagas || vagas('depEstadual', uf)}
      escopo={`tv-depEstadual-${uf}`}
      titulo={`Assembleia · ${UF_POR_SIGLA[uf.toUpperCase()].nome}`}
      mostrarUF={false}
    />
  );
}
