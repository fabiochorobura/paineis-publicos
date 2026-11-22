import { useMemo, useState } from 'react';
import { Alert, Box, CircularProgress, MenuItem, Stack, Tab, Tabs, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { gravar, ler } from '../utils/storage';
import { nomeProprio } from '../utils/formato';
import { Abrangencia, fmtInt, indicesDoRecorte, mascaraUfs, NivelEsperado, opcoesAbrangencia } from './calculos';
import Chegada from './Chegada';
import { DadosAusentesError, Turno, useDadosTurno } from './dados';
import Evolucao, { EixoX } from './Evolucao';
import Extremos from './Extremos';
import Padroes from './Padroes';
import Raros from './Raros';

type Aba = 'evolucao' | 'chegada' | 'raros' | 'extremos' | 'padroes';

function useLembrado<T>(chave: string, padrao: T): [T, (v: T) => void] {
  const [v, setV] = useState<T>(() => ler(chave, padrao));
  return [
    v,
    (novo: T) => {
      setV(novo);
      gravar(chave, novo);
    },
  ];
}

function SemDados({ erro }: { erro: Error }) {
  if (!(erro instanceof DadosAusentesError)) return <Alert severity="error">Não foi possível abrir os dados: {erro.message}</Alert>;
  return (
    <Alert severity="info" sx={{ '& code': { fontFamily: 'monospace', fontSize: 13 } }}>
      <Typography fontWeight={700} mb={0.5}>
        Os boletins de urna ainda não foram baixados neste PC.
      </Typography>
      Na pasta <code>ratrador/eleicoes/metricas</code>, rode em ordem (o 1º turno tem ~5 GB):
      <Box component="pre" sx={{ m: 0, mt: 1, fontFamily: 'monospace', fontSize: 13, whiteSpace: 'pre-wrap' }}>
        {'python -I baixar_boletins.py\npython -I processar_boletins.py --turno 1\npython -I processar_boletins.py --turno 2\npython -I analisar_boletins.py --turno 1\npython -I analisar_boletins.py --turno 2'}
      </Box>
    </Alert>
  );
}

export default function Metricas() {
  const [turno, setTurno] = useLembrado<Turno>('metricas.turno', 2);
  const [abr, setAbr] = useLembrado<Abrangencia>('metricas.abrangencia', 'BR');
  const [aba, setAba] = useLembrado<Aba>('metricas.aba', 'evolucao');
  const [modoX, setModoX] = useLembrado<EixoX>('metricas.eixoX', 'ordem');
  const [nivel, setNivel] = useLembrado<NivelEsperado>('metricas.esperado', 'municipio');
  const { dados, erro, turno: turnoCarregado } = useDadosTurno(turno);
  const tabela = dados?.tabela;
  const analise = dados?.analise;

  const opcoes = useMemo(() => (tabela ? opcoesAbrangencia(tabela.meta) : []), [tabela]);
  const abrValida = opcoes.some((o) => o.valor === abr) ? abr : 'BR';
  const mascara = useMemo(() => (tabela ? mascaraUfs(tabela.meta, abrValida) : new Uint8Array()), [tabela, abrValida]);
  const idx = useMemo(() => (tabela ? indicesDoRecorte(tabela, mascara) : new Uint32Array()), [tabela, mascara]);
  const [a, b] = tabela?.meta.candidatos ?? [];

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        bgcolor: 'background.default',
        px: { xs: 1.5, sm: 2.5, lg: 3.5 },
        py: { xs: 2, md: 3 },
        pb: { xs: 12, md: 4 },
        // o tema põe maiúscula em cada palavra ("Chegada Dos Boletins"); aqui o texto fica como escrito
        '& .MuiTab-root, & .MuiToggleButton-root': { textTransform: 'none' },
      }}
    >
      <Box sx={{ maxWidth: 1480, mx: 'auto' }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ lg: 'flex-end' }} mb={2}>
          <Box minWidth={0}>
            <Typography component="h1" fontSize={{ xs: 22, md: 28 }} fontWeight={900} lineHeight={1.15}>
              Métricas da apuração · Presidente
            </Typography>
            <Typography fontSize={13.5} color="text.secondary" mt={0.5}>
              {tabela
                ? `Boletins de urna do TSE (dados abertos) · ${fmtInt(tabela.n)} seções no ${turnoCarregado}º turno · ${nomeProprio(a.nome)} × ${nomeProprio(b.nome)} · processado em ${new Date(tabela.meta.geradoEm).toLocaleDateString('pt-BR')}`
                : 'Boletins de urna do TSE (dados abertos), processados neste PC'}
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <ToggleButtonGroup exclusive size="small" value={turno} onChange={(_, v) => v && setTurno(v)} aria-label="Turno" sx={{ bgcolor: 'background.paper' }}>
              <ToggleButton value={1} sx={{ px: 2, fontWeight: 800 }}>
                1º turno
              </ToggleButton>
              <ToggleButton value={2} sx={{ px: 2, fontWeight: 800 }}>
                2º turno
              </ToggleButton>
            </ToggleButtonGroup>
            <TextField select size="small" label="Abrangência" value={abrValida} onChange={(e) => setAbr(e.target.value)} disabled={!tabela || aba === 'padroes'} sx={{ minWidth: 220, bgcolor: 'background.paper' }}>
              {opcoes.map((o) => (
                <MenuItem key={o.valor} value={o.valor}>
                  {o.rotulo}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </Stack>

        <Tabs value={aba} onChange={(_, v) => setAba(v)} variant="scrollable" allowScrollButtonsMobile sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Tab value="evolucao" label="Evolução" />
          <Tab value="chegada" label="Chegada dos boletins" />
          <Tab value="raros" label="Seções raras" />
          <Tab value="extremos" label="Casos extremos" />
          <Tab value="padroes" label="Padrões" />
        </Tabs>

        {erro && !tabela && <SemDados erro={erro} />}
        {!erro && !tabela && (
          <Stack alignItems="center" spacing={1.5} py={8}>
            <CircularProgress />
            <Typography color="text.secondary">Abrindo {turno === 1 ? '~24' : '~13'} MB de boletins…</Typography>
          </Stack>
        )}
        {tabela && (
          // ao trocar de turno, o anterior fica na tela, esmaecido, até o novo abrir
          <Box sx={{ opacity: turnoCarregado === turno ? 1 : 0.45, transition: 'opacity .2s', pointerEvents: turnoCarregado === turno ? 'auto' : 'none' }}>
            {idx.length === 0 ? (
              <Alert severity="info">Nenhuma seção nesse recorte.</Alert>
            ) : (
              <>
                {aba === 'evolucao' && <Evolucao tabela={tabela} idx={idx} a={a} b={b} modoX={modoX} setModoX={setModoX} nivel={nivel} setNivel={setNivel} />}
                {aba === 'chegada' && <Chegada tabela={tabela} idx={idx} a={a} b={b} nivel={nivel} setNivel={setNivel} />}
                {aba === 'raros' &&
                  (analise ? (
                    <Raros tabela={tabela} analise={analise} mascara={mascara} a={a} b={b} turno={turnoCarregado} />
                  ) : (
                    <Alert severity="info">Falta rodar analisar_boletins.py para este turno.</Alert>
                  ))}
                {aba === 'extremos' && <Extremos tabela={tabela} idx={idx} a={a} b={b} />}
                {aba === 'padroes' &&
                  (analise ? <Padroes tabela={tabela} analise={analise} a={a} b={b} /> : <Alert severity="info">Falta rodar analisar_boletins.py para este turno.</Alert>)}
              </>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
