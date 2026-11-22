import { useEffect, useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { alpha, keyframes, useTheme } from '@mui/material/styles';
import { Resultado } from '../api/tipos';
import { CidadeExterior } from '../api/useExterior';
import { useCores } from '../utils/cores';
import { nomeProprio, num, pct } from '../utils/formato';
import { CandidatoAvatar } from '../components/shared';
import { SLIDE_H } from './slides';

const ESCOPO_PRESIDENTE = 'presidente';
/** lista rolante das cidades: 2 colunas × 7, 2s por página */
export const CIDADES_POR_PAGINA = 14;
export const SEGUNDOS_POR_PAGINA_EXTERIOR = 2;

const surgir = keyframes`from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; }`;

export function SlideInternacional({
  total,
  cidades,
  brasil,
  pausado,
}: {
  total: Resultado | null;
  cidades: CidadeExterior[];
  brasil: Resultado | null;
  pausado: boolean;
}) {
  const theme = useTheme();
  const { cor } = useCores();
  const paginas = Math.max(1, Math.ceil(cidades.length / CIDADES_POR_PAGINA));
  const [pagina, setPagina] = useState(0);

  useEffect(() => {
    if (pausado) return;
    const id = window.setInterval(
      () => setPagina((p) => (p + 1) % paginas),
      SEGUNDOS_POR_PAGINA_EXTERIOR * 1000,
    );
    return () => window.clearInterval(id);
  }, [pausado, paginas]);

  const ref = brasil?.candidatos ?? total?.candidatos ?? [];
  const corDe = (numero: string) => {
    const c = ref.find((x) => x.numero === numero);
    return c ? cor(ESCOPO_PRESIDENTE, c, ref) : theme.palette.text.disabled;
  };
  const p = pagina % paginas;
  const inicio = p * CIDADES_POR_PAGINA;
  const itens = cidades.slice(inicio, inicio + CIDADES_POR_PAGINA);
  const top = total?.candidatos.slice(0, 6) ?? [];
  const max = Math.max(50, top[0]?.pct ?? 0);

  return (
    <Stack direction="row" spacing={4} height={SLIDE_H}>
      <Stack width={470} flexShrink={0} spacing={2}>
        <Typography
          fontSize={15}
          fontWeight={800}
          color="text.secondary"
          sx={{ letterSpacing: 1.2 }}
        >
          PRESIDENTE · VOTOS NO EXTERIOR
        </Typography>
        {!total ? (
          <Typography fontSize={22} color="text.secondary">
            Aguardando os números das seções no exterior.
          </Typography>
        ) : (
          <>
            <Stack spacing={1.75}>
              {top.map((c) => (
                <Stack key={c.numero} direction="row" spacing={1.5} alignItems="center">
                  <CandidatoAvatar
                    nome={c.nome}
                    foto={c.fotoUrl}
                    cor={corDe(c.numero)}
                    tamanho={52}
                  />
                  <Box flex={1} minWidth={0}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="baseline"
                      spacing={1}
                    >
                      <Typography fontSize={20} fontWeight={800} noWrap>
                        {nomeProprio(c.nome)}
                      </Typography>
                      <Typography
                        fontSize={26}
                        fontWeight={800}
                        sx={{ fontVariantNumeric: 'tabular-nums' }}
                      >
                        {pct(c.pct)}
                      </Typography>
                    </Stack>
                    <Typography fontSize={14} color="text.secondary" noWrap>
                      {c.partido} · {num(c.votos)} votos
                    </Typography>
                    <Box
                      mt={0.5}
                      height={8}
                      sx={{
                        bgcolor: alpha(theme.palette.text.primary, 0.07),
                        borderRadius: '4px',
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          width: `${(c.pct / max) * 100}%`,
                          height: '100%',
                          bgcolor: corDe(c.numero),
                          borderRadius: '4px',
                          transition: 'width .8s ease',
                        }}
                      />
                    </Box>
                  </Box>
                </Stack>
              ))}
            </Stack>
            <Box sx={{ pt: 1.5, borderTop: 1, borderColor: 'divider' }}>
              <Typography fontSize={17} color="text.secondary">
                {pct(total.pctSecoes)} das seções apuradas · {num(total.eleitorado)} eleitores no
                exterior
              </Typography>
            </Box>
          </>
        )}
      </Stack>

      <Box flex={1} minWidth={0}>
        <Typography
          fontSize={15}
          fontWeight={800}
          color="text.secondary"
          sx={{ letterSpacing: 1.2 }}
          mb={1.5}
        >
          POR CIDADE · {inicio + 1}–{inicio + itens.length} DE {cidades.length}
        </Typography>
        <Box
          key={p}
          sx={{
            display: 'grid',
            gridAutoFlow: 'column',
            gridTemplateRows: 'repeat(7, auto)',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            columnGap: 3,
            rowGap: 1,
            animation: `${surgir} .4s ease`,
          }}
        >
          {itens.map(({ cd, nome, r }) => {
            const l = r?.candidatos[0];
            const tem = l && l.votos > 0;
            return (
              <Box key={cd} sx={{ pb: 1, borderBottom: 1, borderColor: 'divider', minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="baseline">
                  <Typography fontSize={20} fontWeight={800} noWrap flex={1} minWidth={0}>
                    {nome}
                  </Typography>
                  {tem && (
                    <Typography
                      fontSize={20}
                      fontWeight={800}
                      sx={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {pct(l.pct, 0)}
                    </Typography>
                  )}
                </Stack>
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <Box
                    sx={{
                      width: 11,
                      height: 11,
                      borderRadius: '50%',
                      flexShrink: 0,
                      bgcolor: tem ? corDe(l.numero) : 'action.disabled',
                    }}
                  />
                  <Typography fontSize={15} color="text.secondary" noWrap>
                    {tem
                      ? `${nomeProprio(l.nome)} (${l.partido}) · ${pct(r.pctSecoes, 0)} apurado`
                      : 'aguardando votos'}
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
