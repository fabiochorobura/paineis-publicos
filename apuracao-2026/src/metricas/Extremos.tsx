import { useMemo, useState } from 'react';
import { Box, Button, MenuItem, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { nomeProprio } from '../utils/formato';
import { fmtHora, fmtInt, fmtPct } from './calculos';
import { CandidatoMeta, Tabela } from './dados';
import { Nota, Painel } from './ui';

type Caso = 'semA' | 'semB' | 'semBrancoNulo' | 'comparecimentoTotal';
const MINIMOS = [0, 50, 100, 200];
const POR_PAGINA = 100;

interface Props {
  tabela: Tabela;
  idx: Uint32Array;
  a: CandidatoMeta;
  b: CandidatoMeta;
}

/** seções com resultado no limite (zero voto para um candidato, nenhum branco ou nulo, todos os aptos votando) */
export default function Extremos({ tabela: t, idx, a, b }: Props) {
  const [caso, setCaso] = useState<Caso>('semB');
  const [minimo, setMinimo] = useState(100);
  const [limite, setLimite] = useState(POR_PAGINA);
  const nomeA = nomeProprio(a.nome);
  const nomeB = nomeProprio(b.nome);
  const [va, vb] = t.votos;

  const testes: Record<Caso, { rotulo: string; passa: (i: number) => boolean }> = {
    semA: { rotulo: `Nenhum voto para ${nomeA}`, passa: (i) => va[i] === 0 },
    semB: { rotulo: `Nenhum voto para ${nomeB}`, passa: (i) => vb[i] === 0 },
    semBrancoNulo: { rotulo: 'Nenhum branco nem nulo', passa: (i) => t.br[i] === 0 && t.nu[i] === 0 },
    comparecimentoTotal: { rotulo: 'Todos os aptos votaram', passa: (i) => t.comp[i] === t.aptos[i] },
  };

  // contagem de todos os casos no recorte, com o tamanho mínimo escolhido
  const contagens = useMemo(() => {
    const n: Record<Caso, number> = { semA: 0, semB: 0, semBrancoNulo: 0, comparecimentoTotal: 0 };
    for (const i of idx) {
      if (t.comp[i] < minimo) continue;
      for (const k of Object.keys(n) as Caso[]) if (testes[k].passa(i)) n[k]++;
    }
    return n;
    // os testes dependem só da tabela
  }, [t, idx, minimo]);

  const lista = useMemo(() => {
    const sel: number[] = [];
    for (const i of idx) if (t.comp[i] >= minimo && testes[caso].passa(i)) sel.push(i);
    // seção grande primeiro: zero voto numa seção de 300 eleitores pesa mais que numa de 30
    return sel.sort((x, y) => t.comp[y] - t.comp[x]);
  }, [t, idx, minimo, caso]);

  // % de A nas outras seções do mesmo local de votação, para comparar
  const vizinhas = useMemo(() => {
    const chave = (i: number) => `${t.mun[i]}-${t.zona[i]}-${t.local[i]}`;
    const alvo = new Set(lista.map(chave));
    const somas = new Map<string, [number, number, number]>();
    for (let i = 0; i < t.n; i++) {
      const k = chave(i);
      if (!alvo.has(k)) continue;
      const s = somas.get(k) ?? [0, 0, 0];
      s[0] += va[i];
      s[1] += va[i] + vb[i];
      s[2]++;
      somas.set(k, s);
    }
    return (i: number) => {
      const s = somas.get(chave(i));
      if (!s || s[2] < 2) return null;
      const outros = s[1] - (va[i] + vb[i]);
      return outros > 0 ? { pct: ((s[0] - va[i]) * 100) / outros, secoes: s[2] - 1 } : null;
    };
  }, [t, lista, va, vb]);

  const porUf = useMemo(() => {
    const c = new Map<string, number>();
    lista.forEach((i) => c.set(t.meta.ufs[t.uf[i]], (c.get(t.meta.ufs[t.uf[i]]) ?? 0) + 1));
    return [...c.entries()].sort((x, y) => y[1] - x[1]);
  }, [t, lista]);

  const porMunicipio = useMemo(() => {
    const c = new Map<number, number>();
    lista.forEach((i) => c.set(t.mun[i], (c.get(t.mun[i]) ?? 0) + 1));
    return [...c.entries()].sort((x, y) => y[1] - x[1]).slice(0, 15);
  }, [t, lista]);

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={caso}
          onChange={(_, v) => v && (setCaso(v), setLimite(POR_PAGINA))}
          aria-label="Caso"
          sx={{ flexWrap: 'wrap' }}
        >
          {(Object.keys(testes) as Caso[]).map((k) => (
            <ToggleButton key={k} value={k}>
              {testes[k].rotulo} ({fmtInt(contagens[k])})
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <TextField select size="small" label="Seções com pelo menos" value={minimo} onChange={(e) => (setMinimo(Number(e.target.value)), setLimite(POR_PAGINA))} sx={{ minWidth: 200 }}>
          {MINIMOS.map((m) => (
            <MenuItem key={m} value={m}>
              {m === 0 ? 'qualquer tamanho' : `${m} votantes`}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <Painel titulo={testes[caso].rotulo} subtitulo={`${fmtInt(lista.length)} seções no recorte · as maiores primeiro`}>
        {lista.length > 0 && (
          <Box mb={1.5}>
            <Typography fontSize={13} color="text.secondary">
              <b>Por UF:</b> {porUf.map(([u, n]) => `${u} ${fmtInt(n)}`).join(' · ')}
            </Typography>
            <Typography fontSize={13} color="text.secondary" mt={0.5}>
              <b>Municípios com mais casos:</b>{' '}
              {porMunicipio.map(([m, n]) => `${nomeProprio(t.meta.municipios[m].nome)}/${t.meta.municipios[m].uf} ${fmtInt(n)}`).join(' · ')}
            </Typography>
          </Box>
        )}
        <TableContainer sx={{ maxHeight: 640 }}>
          <Table size="small" stickyHeader aria-label={testes[caso].rotulo}>
            <TableHead>
              <TableRow>
                <TableCell>Município</TableCell>
                <TableCell align="right">Zona · seção</TableCell>
                <TableCell align="right">Local</TableCell>
                <TableCell align="right">Aptos</TableCell>
                <TableCell align="right">Comparec.</TableCell>
                <TableCell align="right">{nomeA}</TableCell>
                <TableCell align="right">{nomeB}</TableCell>
                <TableCell align="right">Brancos</TableCell>
                <TableCell align="right">Nulos</TableCell>
                <TableCell align="right">% {nomeA} nas vizinhas</TableCell>
                <TableCell align="right">Chegou</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lista.slice(0, limite).map((i) => {
                const m = t.meta.municipios[t.mun[i]];
                const viz = vizinhas(i);
                return (
                  <TableRow key={i} hover sx={{ '& td': { fontVariantNumeric: 'tabular-nums' } }}>
                    <TableCell>
                      {nomeProprio(m.nome)} · {m.uf}
                    </TableCell>
                    <TableCell align="right">
                      {t.zona[i]} · {t.secao[i]}
                      {t.agreg[i] ? ` (+${t.agreg[i]} agreg.)` : ''}
                    </TableCell>
                    <TableCell align="right">{t.local[i]}</TableCell>
                    <TableCell align="right">{fmtInt(t.aptos[i])}</TableCell>
                    <TableCell align="right">{t.aptos[i] ? fmtPct((t.comp[i] * 100) / t.aptos[i], 1) : '—'}</TableCell>
                    <TableCell align="right">{fmtInt(va[i])}</TableCell>
                    <TableCell align="right">{fmtInt(vb[i])}</TableCell>
                    <TableCell align="right">{fmtInt(t.br[i])}</TableCell>
                    <TableCell align="right">{fmtInt(t.nu[i])}</TableCell>
                    <TableCell align="right">{viz ? `${fmtPct(viz.pct, 1)} (${viz.secoes} seç.)` : 'sozinha no local'}</TableCell>
                    <TableCell align="right">{fmtHora(t.rec[i])}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        {lista.length > limite && (
          <Box textAlign="center" mt={1}>
            <Button onClick={() => setLimite((l) => l + POR_PAGINA)}>Mostrar mais {Math.min(POR_PAGINA, lista.length - limite)}</Button>
          </Box>
        )}
        <Nota>
          Zero voto para um candidato só é estranho quando as <b>vizinhas da mesma escola</b> votam diferente. Seção "sozinha no local" com zero voto costuma ser aldeia indígena, comunidade isolada ou colônia com votação em bloco: compare com o município no mapa do Modo TV. Seções muito pequenas (menos de 50 votantes) chegam a zero por pura aritmética, por isso o filtro começa em 100.
        </Nota>
      </Painel>
    </Stack>
  );
}
