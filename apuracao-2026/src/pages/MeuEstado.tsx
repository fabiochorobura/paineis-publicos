import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  InputAdornment,
  MenuItem,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Chart from '../components/Grafico';
import type { ApexOptions } from 'apexcharts';
import { IconSearch, IconTrophy, IconClock, IconMapPin } from '@tabler/icons-react';
import { useEleicao } from '../context/EleicaoContext';
import { CARGOS, CargoId, Resultado } from '../api/tipos';
import { NaoPublicadoError } from '../api/tse';
import { vagas } from '../api/simulacao';
import { UF_POR_SIGLA, UFS_ORDENADAS } from '../data/ufs';
import {
  CardApuracao,
  CardSituacao,
  GraficoBarras,
  GraficoDonut,
  Kpis,
  ListaCandidatos,
} from '../components/resultado';
import { CarregandoCards, DashboardCard, EstadoVazio, useApexBase } from '../components/shared';
import { gravar, ler } from '../utils/storage';
import { compacto, nomeProprio, num, pct } from '../utils/formato';
import { ESCOPO_PRESIDENTE } from './Nacional';
import { MunicipiosDoEstado } from '../components/MunicipiosDoEstado';
import { CardCadeiras } from '../components/CardCadeiras';
import { MapaPresidente } from '../components/MapaPresidente';
import { LegendaMapa } from '../components/mapa';

const ABAS: CargoId[] = ['presidente', 'governador', 'senador', 'depFederal', 'depEstadual'];

function ufDoHash() {
  const uf = window.location.hash.split('/')[2]?.toLowerCase();
  return uf && UF_POR_SIGLA[uf.toUpperCase()] ? uf : null;
}

function useResultadoEstado(cargo: CargoId, uf: string) {
  const { buscar, ciclo, estados, modo, eleicoes } = useEleicao();
  const [dados, setDados] = useState<Resultado | null>(null);
  const [estado, setEstado] = useState<'carregando' | 'ok' | 'aguardando' | 'erro'>('carregando');

  // trocou cargo/UF: limpa para não mostrar dados do estado anterior
  useEffect(() => {
    setDados(null);
    setEstado('carregando');
  }, [cargo, uf, modo, eleicoes?.estadual]);

  useEffect(() => {
    // presidente por UF já é carregado pelo painel nacional
    if (cargo === 'presidente') {
      const r = estados[uf];
      setDados(r ?? null);
      if (r) setEstado('ok');
      else if (ciclo > 0) setEstado('aguardando');
      return;
    }
    const ac = new AbortController();
    buscar(cargo, uf, ac.signal)
      .then((r) => {
        setDados(r);
        setEstado('ok');
      })
      .catch((e) => {
        if (ac.signal.aborted) return;
        if (e instanceof NaoPublicadoError) setEstado('aguardando');
        else setEstado((s) => (s === 'ok' ? s : 'erro'));
      });
    return () => ac.abort();
  }, [cargo, uf, ciclo, buscar, estados]);

  return { dados, estado };
}

function VotosPorPartido({ r }: { r: Resultado }) {
  const base = useApexBase();
  const theme = useTheme();
  const temEleitos = r.candidatos.some((c) => c.eleito);
  const mapa = new Map<string, number>();
  r.candidatos.forEach((c) => {
    if (temEleitos ? c.eleito : true)
      mapa.set(c.partido, (mapa.get(c.partido) ?? 0) + (temEleitos ? 1 : c.votos));
  });
  const lista = [...mapa.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);

  const options: ApexOptions = {
    ...base,
    chart: { ...base.chart, type: 'bar' },
    colors: [theme.palette.primary.main],
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        borderRadiusApplication: 'end',
        barHeight: '60%',
        dataLabels: { position: 'top' },
      },
    },
    xaxis: {
      categories: lista.map(([p]) => p),
      max: Math.max(1, ...lista.map(([, v]) => v)) * 1.25,
      tickAmount: 4,
      labels: { formatter: (v) => (temEleitos ? String(Math.round(+v)) : compacto(+v)) },
    },
    yaxis: { labels: { maxWidth: 160, style: { fontWeight: 600 } } },
    dataLabels: {
      enabled: true,
      offsetX: 30,
      formatter: (v: number) => (temEleitos ? String(v) : compacto(v)),
      style: { colors: [base.chart?.foreColor as string], fontWeight: 700 },
    },
    tooltip: {
      ...base.tooltip,
      y: { formatter: (v) => (temEleitos ? `${v} eleitos` : `${num(v)} votos`) },
    },
  };

  return (
    <DashboardCard
      titulo={temEleitos ? 'Eleitos por partido / federação' : 'Votos por partido / federação'}
      subtitulo={
        temEleitos
          ? 'Quantidade de cadeiras conquistadas'
          : 'Soma dos votos nos candidatos de cada legenda (parcial)'
      }
    >
      <Chart
        type="bar"
        height={Math.max(240, lista.length * 34 + 40)}
        series={[{ name: temEleitos ? 'Eleitos' : 'Votos', data: lista.map(([, v]) => v) }]}
        options={options}
      />
    </DashboardCard>
  );
}

function TabelaProporcional({ r }: { r: Resultado }) {
  const [busca, setBusca] = useState('');
  const [limite, setLimite] = useState(30);
  const filtrados = useMemo(() => {
    const q = busca.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    return r.candidatos
      .map((c, i) => ({ c, pos: i + 1 }))
      .filter(
        ({ c }) =>
          !q ||
          `${c.nome} ${c.partido} ${c.numero}`
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .toLowerCase()
            .includes(q),
      );
  }, [r, busca]);

  return (
    <DashboardCard
      titulo="Candidatos mais votados"
      subtitulo={`${num(r.candidatos.length)} candidatos`}
    >
      <TextField
        fullWidth
        size="small"
        placeholder="Buscar por nome, partido ou número"
        value={busca}
        onChange={(e) => {
          setBusca(e.target.value);
          setLimite(30);
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <IconSearch size={18} />
            </InputAdornment>
          ),
        }}
        inputProps={{ 'aria-label': 'Buscar candidato' }}
        sx={{ mb: 2 }}
      />
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width={40}>#</TableCell>
              <TableCell>Candidato</TableCell>
              <TableCell align="right">Votos</TableCell>
              <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                %
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtrados.slice(0, limite).map(({ c, pos }) => (
              <TableRow key={c.numero} hover>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>{pos}º</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" fontWeight={700}>
                      {nomeProprio(c.nome)}
                    </Typography>
                    {c.eleito && (
                      <Chip
                        size="small"
                        color="success"
                        icon={<IconTrophy size={13} />}
                        label="Eleito"
                        sx={{ height: 20, fontWeight: 700 }}
                      />
                    )}
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {c.partido} · {c.numero}
                    {c.situacao && !c.eleito ? ` · ${c.situacao}` : ''}
                  </Typography>
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}
                >
                  {num(c.votos)}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontVariantNumeric: 'tabular-nums',
                    display: { xs: 'none', sm: 'table-cell' },
                  }}
                >
                  {pct(c.pct)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {!filtrados.length && (
        <Typography color="text.secondary" textAlign="center" py={3}>
          Nenhum candidato encontrado para “{busca}”.
        </Typography>
      )}
      {filtrados.length > limite && (
        <Box textAlign="center" mt={2}>
          <Button variant="outlined" onClick={() => setLimite((l) => l + 50)}>
            Mostrar mais ({num(filtrados.length - limite)} restantes)
          </Button>
        </Box>
      )}
    </DashboardCard>
  );
}

export default function MeuEstado() {
  const { modo, brasil, estados } = useEleicao();
  const [cidade, setCidade] = useState<string | null>(null);
  const [uf, setUfState] = useState<string>(() => ufDoHash() ?? ler('minhaUF-v2', 'mt'));
  const [cargo, setCargo] = useState<CargoId>(() => ler('cargo', 'governador'));
  const { dados, estado } = useResultadoEstado(cargo, uf);

  useEffect(() => {
    const onHash = () => {
      const h = ufDoHash();
      if (h) setUfState(h);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const setUf = (v: string) => {
    setCidade(null);
    setUfState(v);
    gravar('minhaUF-v2', v);
    window.history.replaceState(null, '', `#/estado/${v}`);
  };
  const escolherCargo = (c: CargoId) => {
    setCargo(c);
    gravar('cargo', c);
  };

  const info = CARGOS[cargo];
  // busca e lista das cidades, com o resultado da cidade escolhida (o mapa delas fica no topo)
  const listaCidades = (
    <MunicipiosDoEstado
      uf={uf}
      cargo={cargo}
      estadual={dados}
      mostrar="lista"
      escolhido={cidade}
      onEscolher={setCidade}
    />
  );
  const nomeUf = UF_POR_SIGLA[uf.toUpperCase()].nome;
  const nomeCargo = cargo === 'depEstadual' && uf === 'df' ? 'Deputado Distrital' : info.nome;
  const escopo = cargo === 'presidente' ? ESCOPO_PRESIDENTE : `${cargo}-${uf}`;
  const qtdVagas =
    dados?.vagas || (modo === 'simulacao' || cargo === 'senador' ? vagas(cargo, uf) : 1);

  return (
    <Stack spacing={3}>
      {/* topo: mapa nacional à esquerda; à direita o estado/cargo e o mapa das cidades do estado */}
      <DashboardCard>
        <Box
          sx={{
            display: 'grid',
            gap: { xs: 2, md: 3 },
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            alignItems: 'start',
          }}
        >
          <Box>
            {brasil ? (
              <>
                <MapaPresidente
                  brasil={brasil}
                  estados={estados}
                  escopo={ESCOPO_PRESIDENTE}
                  onSelect={(v) => setUf(v)}
                />
                <Typography variant="body2" color="text.secondary" mt={1} mb={1}>
                  Presidente: líder por estado. Toque num estado para escolher.
                </Typography>
                <LegendaMapa
                  estados={estados}
                  referencia={brasil.candidatos}
                  escopo={ESCOPO_PRESIDENTE}
                />
              </>
            ) : (
              <Typography color="text.secondary">Carregando o mapa…</Typography>
            )}
          </Box>
          <Stack spacing={2} minWidth={0}>
            <Stack spacing={1.5}>
              <TextField
                select
                label="Estado"
                value={uf}
                onChange={(e) => setUf(e.target.value)}
                size="small"
                sx={{ minWidth: 240 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconMapPin size={18} />
                    </InputAdornment>
                  ),
                }}
              >
                {UFS_ORDENADAS.map((u) => (
                  <MenuItem key={u.sigla} value={u.sigla.toLowerCase()}>
                    {u.nome} ({u.sigla})
                  </MenuItem>
                ))}
              </TextField>
              <Tabs
                value={cargo}
                onChange={(_, v) => escolherCargo(v)}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                aria-label="Cargo"
                sx={{ minHeight: 40, '& .MuiTab-root': { minHeight: 40, fontWeight: 600 } }}
              >
                {ABAS.map((c) => (
                  <Tab
                    key={c}
                    value={c}
                    label={
                      c === 'depEstadual' && uf === 'df'
                        ? 'Dep. Distrital'
                        : CARGOS[c].nome.replace('Deputado', 'Dep.')
                    }
                  />
                ))}
              </Tabs>
            </Stack>
            <MunicipiosDoEstado
              uf={uf}
              cargo={cargo}
              estadual={dados}
              mostrar="mapa"
              escolhido={cidade}
              onEscolher={setCidade}
            />
          </Stack>
        </Box>
      </DashboardCard>

      {/* sem resultado do cargo ainda: a lista de cidades aparece sozinha */}
      {!dados && listaCidades}

      {estado === 'carregando' && !dados && (
        <Stack spacing={3}>
          <CarregandoCards qtd={2} altura={150} />
          <CarregandoCards qtd={2} altura={320} />
        </Stack>
      )}

      {!dados && (estado === 'aguardando' || estado === 'erro') && (
        <DashboardCard>
          <EstadoVazio
            icone={<IconClock size={56} stroke={1.2} />}
            titulo={`${nomeCargo} · ${nomeUf}`}
            texto={
              estado === 'erro'
                ? 'Não conseguimos buscar este resultado agora. Tentaremos de novo na próxima atualização.'
                : 'O TSE ainda não publicou este resultado. Ele aparece aqui sozinho assim que sair.'
            }
          />
        </DashboardCard>
      )}

      {dados && (
        <>
          <Typography variant="h4" component="h2">
            {nomeCargo} · {nomeUf}
            {cargo === 'senador' && (
              <Typography component="span" variant="body1" color="text.secondary" ml={1}>
                ({qtdVagas} vagas em 2026)
              </Typography>
            )}
          </Typography>

          {info.majoritario ? (
            <>
              {/* esquerda: urnas apuradas e eleito(a), um sobre o outro; direita: as cidades */}
              <Box
                sx={{
                  display: 'grid',
                  gap: 3,
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                }}
              >
                {/* os dois cards dividem a altura do card das cidades */}
                <Stack spacing={3} sx={{ '& > *': { flex: 1 } }}>
                  <CardApuracao r={dados} />
                  <CardSituacao r={dados} escopo={escopo} vagas={qtdVagas} />
                </Stack>
                {listaCidades}
              </Box>
              {cargo === 'senador' && (
                <CardCadeiras
                  r={dados}
                  total={qtdVagas}
                  escopo={escopo}
                  titulo={`Cadeiras do Senado · ${nomeUf}`}
                />
              )}
              <Kpis r={dados} />
              <Box
                sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: '7fr 5fr' } }}
              >
                <DashboardCard
                  titulo={`Candidatos a ${nomeCargo}`}
                  subtitulo="Percentual dos votos válidos"
                >
                  <ListaCandidatos r={dados} escopo={escopo} mostrarVice={cargo !== 'senador'} />
                </DashboardCard>
                <Stack spacing={3}>
                  <DashboardCard titulo="Divisão dos votos válidos">
                    <GraficoDonut r={dados} escopo={escopo} />
                  </DashboardCard>
                  <DashboardCard titulo="Comparativo">
                    <GraficoBarras r={dados} escopo={escopo} />
                  </DashboardCard>
                </Stack>
              </Box>
            </>
          ) : (
            <>
              {/* esquerda: urnas apuradas e eleitos definidos, um sobre o outro; direita: as cidades */}
              <Box
                sx={{
                  display: 'grid',
                  gap: 3,
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                }}
              >
                {/* os dois cards dividem a altura do card das cidades */}
                <Stack spacing={3} sx={{ '& > *': { flex: 1 } }}>
                  <CardApuracao r={dados} />
                  <DashboardCard>
                    <Stack spacing={1}>
                      <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                        Eleitos definidos
                      </Typography>
                      <Typography variant="h3" fontWeight={800}>
                        {dados.candidatos.filter((c) => c.eleito).length}
                        {(modo === 'simulacao' || dados.vagas) && (
                          <Typography component="span" variant="h5" color="text.secondary">
                            {' '}
                            / {dados.vagas || vagas(cargo, uf)} vagas
                          </Typography>
                        )}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Na eleição proporcional, as vagas são distribuídas pelos votos de cada
                        partido/federação (quociente eleitoral) — ser bem votado não garante a vaga
                        sozinho.
                      </Typography>
                    </Stack>
                  </DashboardCard>
                </Stack>
                {listaCidades}
              </Box>
              <CardCadeiras
                r={dados}
                total={dados.vagas || vagas(cargo, uf)}
                escopo={escopo}
                titulo={`Cadeiras · ${nomeCargo} · ${nomeUf}`}
              />
              <Box
                sx={{
                  display: 'grid',
                  gap: 3,
                  gridTemplateColumns: { xs: '1fr', lg: '5fr 7fr' },
                  alignItems: 'start',
                }}
              >
                <VotosPorPartido r={dados} />
                <TabelaProporcional r={dados} />
              </Box>
            </>
          )}
        </>
      )}
    </Stack>
  );
}
