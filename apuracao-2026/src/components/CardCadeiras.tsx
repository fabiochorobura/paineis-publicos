import { Box, Stack, Typography } from '@mui/material';
import { Resultado } from '../api/tipos';
import { Hemiciclo } from '../tv/Hemiciclo';
import { useCores } from '../utils/cores';
import { num } from '../utils/formato';
import { DashboardCard } from './shared';
import { MarcaPartido } from './MarcaPartido';

/** Plenário com as cadeiras do estado: preenche conforme os eleitos saem, cor por partido. */
export function CardCadeiras({
  r,
  total,
  escopo,
  titulo,
}: {
  r: Resultado;
  total: number;
  escopo: string;
  titulo: string;
}) {
  const { corChave } = useCores();
  const cadeiras = new Map<string, number>();
  const votos = new Map<string, number>();
  r.candidatos.forEach((c) => {
    votos.set(c.partido, (votos.get(c.partido) ?? 0) + c.votos);
    if (c.eleito) cadeiras.set(c.partido, (cadeiras.get(c.partido) ?? 0) + 1);
  });
  const definidas = [...cadeiras.values()].reduce((s, n) => s + n, 0);
  // ordem das cores: quem tem mais cadeiras; antes dos eleitos, quem tem mais votos
  const ordem = [...(definidas ? cadeiras : votos).entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([p]) => p);
  const corDe = (p: string) => corChave(`${escopo}-cadeiras`, p, ordem);
  const bancadas = [...cadeiras.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([partido, n]) => ({ partido, cadeiras: n, cor: corDe(partido) }));
  // cor de cada cadeira, na ordem (para o desenho em fila quando são poucas vagas)
  const bancadasPorCadeira = bancadas.flatMap((b) =>
    Array.from({ length: b.cadeiras }, () => b.cor),
  );

  return (
    <DashboardCard
      titulo={titulo}
      subtitulo={
        definidas
          ? 'Cadeiras já definidas, por partido'
          : 'As cadeiras aparecem conforme os eleitos forem definidos'
      }
    >
      {total <= 6 ? (
        <Stack alignItems="center" spacing={1.5} py={2}>
          <Stack direction="row" spacing={2} justifyContent="center">
            {Array.from({ length: total }, (_, i) => (
              <Box
                key={i}
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  bgcolor: bancadasPorCadeira[i] ?? 'action.disabledBackground',
                  transition: 'background-color .6s ease',
                }}
              />
            ))}
          </Stack>
          <Typography variant="h4" fontWeight={800}>
            {definidas}/{total}
          </Typography>
          <Typography color="text.secondary">
            {definidas ? 'cadeiras definidas' : 'cadeiras a definir'}
          </Typography>
        </Stack>
      ) : (
        <Box sx={{ maxWidth: 520, mx: 'auto' }}>
          <Hemiciclo
            total={Math.max(1, total)}
            bancadas={bancadas}
            largura="100%"
            rotuloCentro={`${definidas}/${total}`}
            subtituloCentro={definidas ? 'cadeiras definidas' : 'cadeiras a definir'}
          />
        </Box>
      )}
      {bancadas.length > 0 && (
        <Stack
          direction="row"
          flexWrap="wrap"
          columnGap={2}
          rowGap={1}
          mt={1.5}
          justifyContent="center"
        >
          {bancadas.map((b) => (
            <Stack key={b.partido} direction="row" spacing={0.75} alignItems="center">
              <MarcaPartido sigla={b.partido} cor={b.cor} tamanho={14} />
              <Typography variant="body2" fontWeight={700}>
                {b.partido}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {num(b.cadeiras)}
              </Typography>
            </Stack>
          ))}
        </Stack>
      )}
    </DashboardCard>
  );
}
