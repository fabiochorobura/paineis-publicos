import { useMemo, useState } from 'react';
import {
  Box,
  Chip,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material';
import { useEleicao } from '../context/EleicaoContext';
import { DashboardCard } from '../components/shared';
import { ORDEM_REGIOES, REGIOES, Regiao, UFS } from '../data/ufs';
import { useCores } from '../utils/cores';
import { nomeProprio, pct } from '../utils/formato';
import { Pagina } from '../layout/Layout';
import { ESCOPO_PRESIDENTE, SemDados } from './Nacional';
import MapaTopo from '../layout/MapaTopo';

type Ordem = 'nome' | 'apurado' | 'lider' | 'margem';

export default function Mapa({ navegar }: { navegar: (p: Pagina, uf?: string) => void }) {
  const { brasil, estados } = useEleicao();
  const { cor } = useCores();
  const [regiao, setRegiao] = useState<Regiao | null>(null);
  const [ordem, setOrdem] = useState<Ordem>('nome');
  const [asc, setAsc] = useState(true);

  const linhas = useMemo(() => {
    const lista = UFS.filter((u) => !regiao || u.regiao === regiao).map((u) => {
      const r = estados[u.sigla.toLowerCase()];
      const [a, b] = r?.candidatos ?? [];
      return { uf: u, r, a, b, margem: a && b ? a.pct - b.pct : 0 };
    });
    const chave = (l: (typeof lista)[number]) =>
      ordem === 'nome'
        ? l.uf.nome
        : ordem === 'apurado'
          ? (l.r?.pctSecoes ?? -1)
          : ordem === 'lider'
            ? (l.a?.pct ?? -1)
            : l.margem;
    return lista.sort((x, y) => {
      const [kx, ky] = [chave(x), chave(y)];
      const c =
        typeof kx === 'string'
          ? kx.localeCompare(ky as string, 'pt-BR')
          : (kx as number) - (ky as number);
      return asc ? c : -c;
    });
  }, [estados, regiao, ordem, asc]);

  if (!brasil) return <SemDados />;

  const ordenar = (o: Ordem) => {
    if (o === ordem) setAsc(!asc);
    else {
      setOrdem(o);
      setAsc(o === 'nome');
    }
  };
  const Cab = ({ o, children, align }: { o: Ordem; children: string; align?: 'right' }) => (
    <TableCell align={align} sortDirection={ordem === o ? (asc ? 'asc' : 'desc') : false}>
      <TableSortLabel
        active={ordem === o}
        direction={asc ? 'asc' : 'desc'}
        onClick={() => ordenar(o)}
      >
        {children}
      </TableSortLabel>
    </TableCell>
  );

  // um card pequeno por estado, ao lado do mapa: quem lidera, % e quanto já foi apurado
  const cardsEstados = (
    <Box
      sx={{
        display: 'grid',
        gap: 1,
        gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))' },
      }}
    >
      {[...UFS]
        .sort((x, y) => x.sigla.localeCompare(y.sigla))
        .map((u) => {
          const r = estados[u.sigla.toLowerCase()];
          const l = r?.candidatos[0];
          const tem = l && l.votos > 0;
          const corL = tem ? cor(ESCOPO_PRESIDENTE, l, brasil.candidatos) : 'transparent';
          return (
            <Box
              key={u.sigla}
              onClick={() => navegar('estado', u.sigla.toLowerCase())}
              sx={{
                p: 1,
                pl: 1.25,
                borderRadius: '10px',
                border: 1,
                borderColor: 'divider',
                borderLeft: `5px solid ${corL}`,
                cursor: 'pointer',
                minWidth: 0,
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="baseline"
                spacing={1}
              >
                <Typography fontWeight={800}>{u.sigla}</Typography>
                <Typography fontWeight={800} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                  {tem ? pct(l.pct, 1) : '—'}
                </Typography>
              </Stack>
              <Typography variant="body2" noWrap>
                {tem ? nomeProprio(l.nome) : 'aguardando'}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap display="block">
                {r ? `${pct(r.pctSecoes, 1)} apurado` : ''}
              </Typography>
            </Box>
          );
        })}
    </Box>
  );

  return (
    <Stack spacing={{ xs: 1.5, sm: 3 }}>
      <MapaTopo onSelect={(uf) => navegar('estado', uf)} lado={cardsEstados} />
      <Box
        sx={{
          display: 'grid',
          gap: { xs: 1.5, sm: 3 },
          gridTemplateColumns: '1fr',
          alignItems: 'start',
        }}
      >
        <DashboardCard
          titulo="Resultado em cada estado"
          subtitulo="Clique no cabeçalho para ordenar"
        >
          <Stack
            direction="row"
            gap={1}
            flexWrap="wrap"
            mb={2}
            role="group"
            aria-label="Filtrar por região"
          >
            <Chip
              label="Todas"
              color={regiao ? 'default' : 'primary'}
              onClick={() => setRegiao(null)}
              variant={regiao ? 'outlined' : 'filled'}
            />
            {ORDEM_REGIOES.map((r) => (
              <Chip
                key={r}
                label={REGIOES[r]}
                color={regiao === r ? 'primary' : 'default'}
                variant={regiao === r ? 'filled' : 'outlined'}
                onClick={() => setRegiao(r)}
              />
            ))}
          </Stack>
          <TableContainer
            sx={{ mx: { xs: -2.25, sm: 0 }, width: { xs: 'calc(100% + 36px)', sm: '100%' } }}
          >
            <Table size="small" sx={{ '& td, & th': { whiteSpace: 'nowrap' } }}>
              <TableHead>
                <TableRow>
                  <Cab o="nome">Estado</Cab>
                  <Cab o="apurado">Apurado</Cab>
                  <Cab o="lider">1º colocado</Cab>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    2º colocado
                  </TableCell>
                  <Cab o="margem" align="right">
                    Vantagem
                  </Cab>
                </TableRow>
              </TableHead>
              <TableBody>
                {linhas.map(({ uf, r, a, b, margem }) => (
                  <TableRow
                    key={uf.sigla}
                    hover
                    onClick={() => navegar('estado', uf.sigla.toLowerCase())}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Typography fontWeight={700}>{uf.sigla}</Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ display: { xs: 'none', sm: 'block' } }}
                      >
                        {uf.nome}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ minWidth: 90 }}>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ fontVariantNumeric: 'tabular-nums' }}
                      >
                        {r ? pct(r.pctSecoes, 1) : '—'}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={r?.pctSecoes ?? 0}
                        sx={{ height: 4, borderRadius: 2, mt: 0.5 }}
                        aria-hidden
                      />
                    </TableCell>
                    {[a, b].map((c, i) => (
                      <TableCell
                        key={i}
                        sx={i === 1 ? { display: { xs: 'none', md: 'table-cell' } } : undefined}
                      >
                        {c && c.votos > 0 ? (
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Box
                              sx={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                bgcolor: cor(ESCOPO_PRESIDENTE, c, brasil.candidatos),
                                flexShrink: 0,
                              }}
                            />
                            <Typography variant="body2" fontWeight={i === 0 ? 700 : 500}>
                              {nomeProprio(c.nome).split(' ').slice(0, 2).join(' ')}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ fontVariantNumeric: 'tabular-nums' }}
                            >
                              {pct(c.pct, 1)}
                            </Typography>
                          </Stack>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            —
                          </Typography>
                        )}
                      </TableCell>
                    ))}
                    <TableCell
                      align="right"
                      sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}
                    >
                      {a && b && a.votos > 0
                        ? `${margem.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} p.p.`
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DashboardCard>
      </Box>
    </Stack>
  );
}
