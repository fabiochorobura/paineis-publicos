import { Box, Stack, Typography } from '@mui/material';
import { IconWorld } from '@tabler/icons-react';
import { useEleicao } from '../context/EleicaoContext';
import {
  CardApuracao,
  CardSituacao,
  GraficoDonut,
  Kpis,
  ListaCandidatos,
} from '../components/resultado';
import { CarregandoCards, DashboardCard, EstadoVazio } from '../components/shared';
import { useExterior } from '../api/useExterior';
import { useCores } from '../utils/cores';
import { dataHora, nomeProprio, pct } from '../utils/formato';
import { ESCOPO_PRESIDENTE } from './Nacional';

export default function Internacionais() {
  const { brasil } = useEleicao();
  const { total, cidades } = useExterior();
  const { cor } = useCores();

  if (!total) {
    return (
      <DashboardCard>
        <EstadoVazio
          icone={<IconWorld size={64} stroke={1.2} />}
          titulo="Votos no exterior"
          texto="Assim que o TSE publicar os números das seções no exterior, eles aparecem aqui automaticamente."
        />
        <Box px={3} pb={3}>
          <CarregandoCards qtd={2} altura={120} />
        </Box>
      </DashboardCard>
    );
  }

  const ref = brasil?.candidatos ?? total.candidatos;
  const comVotos = cidades.filter((c) => c.r?.candidatos[0]?.votos);

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
        <CardApuracao
          r={total}
          titulo={`Seções no exterior apuradas · ${dataHora(total.atualizadoEm)}`}
        />
        <CardSituacao r={total} escopo={ESCOPO_PRESIDENTE} />
      </Box>

      <Kpis r={total} />

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: '7fr 5fr' } }}>
        <DashboardCard
          titulo="Presidente · votos no exterior"
          subtitulo="Percentual dos votos válidos dos eleitores que votam fora do Brasil"
        >
          <ListaCandidatos r={total} escopo={ESCOPO_PRESIDENTE} />
        </DashboardCard>
        <DashboardCard titulo="Divisão dos votos válidos">
          <GraficoDonut r={total} escopo={ESCOPO_PRESIDENTE} />
        </DashboardCard>
      </Box>

      <DashboardCard
        titulo="Por cidade"
        subtitulo={`${comVotos.length} de ${cidades.length} cidades no exterior com votos apurados`}
      >
        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(3, 1fr)' },
          }}
        >
          {cidades.map(({ cd, nome, r }) => {
            const l = r?.candidatos[0];
            const tem = l && l.votos > 0;
            const c = tem ? (ref.find((x) => x.numero === l.numero) ?? l) : null;
            return (
              <Stack
                key={cd}
                direction="row"
                spacing={1.25}
                alignItems="center"
                sx={{ py: 0.75, borderBottom: 1, borderColor: 'divider', minWidth: 0 }}
              >
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    flexShrink: 0,
                    bgcolor: c ? cor(ESCOPO_PRESIDENTE, c, ref) : 'action.disabled',
                  }}
                />
                <Box flex={1} minWidth={0}>
                  <Typography fontWeight={700} noWrap>
                    {nome}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {tem
                      ? `${nomeProprio(l.nome)} (${l.partido}) · ${pct(r.pctSecoes, 0)} apurado`
                      : 'aguardando votos'}
                  </Typography>
                </Box>
                {tem && (
                  <Typography fontWeight={800} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                    {pct(l.pct, 0)}
                  </Typography>
                )}
              </Stack>
            );
          })}
        </Box>
      </DashboardCard>
    </Stack>
  );
}
