import { Box, ButtonBase, Stack, Tooltip, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { Candidato, Resultado } from '../api/tipos';
import { UFS } from '../data/ufs';
import { useCores } from '../utils/cores';
import { nomeProprio, pct } from '../utils/formato';

const COLS = 7;
const ROWS = 7;

interface Props {
  estados: Record<string, Resultado>;
  /** candidatos de referência (ranking nacional) para manter as cores iguais às do resto do painel */
  referencia: Candidato[];
  escopo: string;
  onSelect?: (uf: string) => void;
  selecionado?: string;
  compacto?: boolean;
}

/**
 * Mapa em grade (tile map): cada estado vira um quadrado do mesmo tamanho na posição
 * aproximada do mapa — estados pequenos do Nordeste ficam tão visíveis quanto o Amazonas.
 */
export function MapaTiles({ estados, referencia, escopo, onSelect, selecionado, compacto }: Props) {
  const theme = useTheme();
  const { cor } = useCores();
  const vazio = alpha(theme.palette.text.primary, 0.08);

  return (
    <Box
      role="list"
      aria-label="Mapa de estados — candidato que lidera em cada um"
      sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(${COLS}, 1fr)`,
        gridTemplateRows: `repeat(${ROWS}, 1fr)`,
        gap: compacto ? '4px' : { xs: '4px', sm: '6px' },
        width: '100%',
        maxWidth: compacto ? 340 : 560,
        mx: 'auto',
        aspectRatio: `${COLS} / ${ROWS}`,
      }}
    >
      {UFS.map((uf) => {
        const r = estados[uf.sigla.toLowerCase()];
        const lider = r?.candidatos[0];
        const temVotos = Boolean(lider && lider.votos > 0);
        const fundo = temVotos ? cor(escopo, lider!, referencia.length ? referencia : r!.candidatos) : vazio;
        const ativo = selecionado === uf.sigla.toLowerCase();
        const rotulo = temVotos
          ? `${uf.nome}: ${nomeProprio(lider!.nome)} lidera com ${pct(lider!.pct)} — ${pct(r!.pctSecoes, 1)} apurado`
          : `${uf.nome}: sem votos apurados`;

        return (
          <Tooltip
            key={uf.sigla}
            arrow
            title={
              <Box p={0.5}>
                <Typography fontWeight={700}>{uf.nome}</Typography>
                {temVotos ? (
                  <>
                    {r!.candidatos.slice(0, 3).map((c) => (
                      <Typography key={c.numero} variant="body2">
                        {nomeProprio(c.nome)}: <b>{pct(c.pct)}</b>
                      </Typography>
                    ))}
                    <Typography variant="body2" sx={{ opacity: 0.75, mt: 0.5 }}>
                      {pct(r!.pctSecoes, 1)} das urnas apuradas
                    </Typography>
                  </>
                ) : (
                  <Typography variant="body2">Sem votos apurados ainda</Typography>
                )}
              </Box>
            }
          >
            <ButtonBase
              role="listitem"
              aria-label={rotulo}
              onClick={() => onSelect?.(uf.sigla.toLowerCase())}
              sx={{
                gridColumn: uf.col + 1,
                gridRow: uf.row + 1,
                borderRadius: compacto ? '5px' : '8px',
                bgcolor: fundo,
                // opacidade acompanha o andamento: estado pouco apurado fica mais claro
                opacity: temVotos ? 0.45 + Math.min(1, r!.pctSecoes / 100) * 0.55 : 1,
                color: temVotos ? '#fff' : 'text.secondary',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                outline: ativo ? `3px solid ${theme.palette.text.primary}` : 'none',
                outlineOffset: 2,
                transition: 'transform .15s ease, background-color .4s ease, opacity .4s ease',
                '&:hover, &:focus-visible': { transform: 'scale(1.08)', zIndex: 1, boxShadow: 6 },
              }}
            >
              <Typography fontWeight={800} fontSize={compacto ? 11 : { xs: 12, sm: 15 }} lineHeight={1.1}>
                {uf.sigla}
              </Typography>
              {!compacto && temVotos && (
                <Typography fontSize={{ xs: 9, sm: 11 }} fontWeight={600} sx={{ opacity: 0.95, display: { xs: 'none', sm: 'block' } }}>
                  {Math.round(lider!.pct)}%
                </Typography>
              )}
            </ButtonBase>
          </Tooltip>
        );
      })}
    </Box>
  );
}

/** Legenda: quantos estados cada candidato lidera. */
export function LegendaMapa({ estados, referencia, escopo }: { estados: Record<string, Resultado>; referencia: Candidato[]; escopo: string }) {
  const { cor } = useCores();
  const contagem = new Map<string, number>();
  Object.values(estados).forEach((r) => {
    const l = r.candidatos[0];
    if (l && l.votos > 0) contagem.set(l.numero, (contagem.get(l.numero) ?? 0) + 1);
  });
  const lista = referencia.filter((c) => contagem.has(c.numero));
  if (!lista.length) return null;

  return (
    <Stack direction="row" flexWrap="wrap" gap={1.5} justifyContent="center" mt={2}>
      {lista.map((c) => (
        <Stack key={c.numero} direction="row" spacing={0.75} alignItems="center">
          <Box sx={{ width: 12, height: 12, borderRadius: 1, bgcolor: cor(escopo, c, referencia) }} />
          <Typography variant="body2" fontWeight={600}>
            {nomeProprio(c.nome)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {contagem.get(c.numero)} {contagem.get(c.numero) === 1 ? 'estado' : 'estados'}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}
