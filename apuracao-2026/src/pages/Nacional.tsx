import { Box, Stack } from '@mui/material';
import { IconBallpen } from '@tabler/icons-react';
import { useEleicao } from '../context/EleicaoContext';
import {
  CardApuracao,
  CardSituacao,
  GraficoDonut,
  Kpis,
  ListaCandidatos,
} from '../components/resultado';
import { GraficoEvolucao } from '../components/evolucao';
import { CarregandoCards, DashboardCard, EstadoVazio } from '../components/shared';
import { dataHora } from '../utils/formato';

export const ESCOPO_PRESIDENTE = 'presidente';

export function SemDados() {
  const { status } = useEleicao();
  if (status === 'carregando') {
    return (
      <Stack spacing={3}>
        <CarregandoCards qtd={3} altura={150} />
        <CarregandoCards qtd={4} altura={100} />
        <CarregandoCards qtd={2} altura={360} />
      </Stack>
    );
  }
  return (
    <DashboardCard>
      <EstadoVazio
        icone={<IconBallpen size={64} stroke={1.2} />}
        titulo={status === 'erro' ? 'Sem dados por enquanto' : 'A apuração ainda não começou'}
        texto="Assim que o TSE publicar os primeiros números, eles aparecem aqui automaticamente."
      />
    </DashboardCard>
  );
}

export default function Nacional() {
  const { brasil, historico } = useEleicao();
  if (!brasil) return <SemDados />;

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
        <CardApuracao r={brasil} titulo={`Urnas apuradas · ${dataHora(brasil.atualizadoEm)}`} />
        <CardSituacao r={brasil} escopo={ESCOPO_PRESIDENTE} />
      </Box>

      <Kpis r={brasil} />

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: '7fr 5fr' } }}>
        <DashboardCard
          titulo="Candidatos a Presidente"
          subtitulo="Percentual dos votos válidos (brancos e nulos não entram na conta)"
        >
          <ListaCandidatos r={brasil} escopo={ESCOPO_PRESIDENTE} mostrarVice />
        </DashboardCard>
        <Stack spacing={3}>
          <DashboardCard titulo="Divisão dos votos válidos">
            <GraficoDonut r={brasil} escopo={ESCOPO_PRESIDENTE} />
          </DashboardCard>
        </Stack>
      </Box>

      <DashboardCard
        titulo="Evolução da apuração"
        subtitulo="Como o percentual de cada candidato muda conforme as urnas são apuradas"
      >
        <GraficoEvolucao historico={historico} atual={brasil} escopo={ESCOPO_PRESIDENTE} />
      </DashboardCard>
    </Stack>
  );
}
