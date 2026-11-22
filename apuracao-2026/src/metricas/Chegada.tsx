import { useMemo } from 'react';
import { Box, MenuItem, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from '@mui/material';
import uPlot from 'uplot';
import { nomeProprio } from '../utils/formato';
import { calcularChegada, fmtHora, fmtHoraCurta, fmtInt, fmtNum, fmtPct, NivelEsperado } from './calculos';
import { CandidatoMeta, Tabela } from './dados';
import { linhaZero } from './Evolucao';
import Grafico, { corDoPartido, eixo, TINTA } from './Grafico';
import { Nota, Painel } from './ui';

// ordem validada para daltonismo (sem o vermelho e o azul, que são dos candidatos)
const COR_REGIAO: Record<string, string> = { N: '#1baf7a', NE: '#eb6834', CO: '#6250d6', SE: '#eda100', S: '#008300', EX: '#e87ba4' };
const BARRAS = uPlot.paths.bars!({ size: [0.9, 30], gap: 1 });
const MIN_SECOES_MINUTO = 20;

const eixoHora = () => eixo({ values: (_, t) => t.map(fmtHoraCurta), incrs: [60, 300, 600, 900, 1800, 3600, 7200], space: 70, label: 'Hora de chegada (Brasília)' });
const serieHora = { label: 'Minuto', value: (_: uPlot, v: number | null) => (v == null ? '—' : fmtHoraCurta(v)) };

interface Props {
  tabela: Tabela;
  idx: Uint32Array;
  a: CandidatoMeta;
  b: CandidatoMeta;
  nivel: NivelEsperado;
  setNivel: (n: NivelEsperado) => void;
}

export default function Chegada({ tabela, idx, a, b, nivel, setNivel }: Props) {
  const ch = useMemo(() => calcularChegada(tabela, idx, 0, 1, nivel), [tabela, idx, nivel]);
  const nomeA = nomeProprio(a.nome);
  const nomeB = nomeProprio(b.nome);
  const corA = corDoPartido(a.partido, 0);
  const corB = corDoPartido(b.partido, 1);

  const opcoesQtd = useMemo<Omit<uPlot.Options, 'width' | 'height'>>(
    () => ({
      scales: { x: { time: false } },
      axes: [eixoHora(), eixo({ label: 'Boletins no minuto', size: 60 })],
      series: [serieHora, { label: 'Boletins recebidos', stroke: '#5c6b80', fill: '#5c6b80', paths: BARRAS, points: { show: false }, value: (_, v) => (v == null ? '—' : fmtInt(v)) }],
    }),
    [],
  );
  const dadosQtd = useMemo(() => [ch.minuto, ch.secoes] as unknown as uPlot.AlignedData, [ch]);

  const opcoesReg = useMemo<Omit<uPlot.Options, 'width' | 'height'>>(
    () => ({
      scales: { x: { time: false }, y: { range: [0, 100] } },
      axes: [eixoHora(), eixo({ label: '% das seções da região', values: (_, t) => t.map((v) => `${v}%`), size: 60 })],
      series: [serieHora, ...ch.porRegiao.map((r) => ({ label: r.rotulo, stroke: COR_REGIAO[r.regiao], width: 2, value: (_: uPlot, v: number | null) => (v == null ? '—' : fmtPct(v, 1)) }))],
    }),
    [ch],
  );
  const dadosReg = useMemo(() => [ch.minuto, ...ch.porRegiao.map((r) => r.pct)] as unknown as uPlot.AlignedData, [ch]);

  // desvio do lote de cada minuto: positivo a favor de A, negativo a favor de B
  const opcoesZ = useMemo<Omit<uPlot.Options, 'width' | 'height'>>(
    () => ({
      scales: { x: { time: false } },
      axes: [eixoHora(), eixo({ label: 'Desvios-padrão', size: 56 })],
      hooks: { draw: linhaZero },
      series: [
        serieHora,
        { label: `Lote mais ${nomeA} que o esperado`, stroke: corA, fill: corA, paths: BARRAS, points: { show: false }, value: (_, v) => (v == null ? '—' : fmtNum(v, 2)) },
        { label: `Lote mais ${nomeB} que o esperado`, stroke: corB, fill: corB, paths: BARRAS, points: { show: false }, value: (_, v) => (v == null ? '—' : fmtNum(v, 2)) },
        { label: 'Faixa de ±3 desvios, de cima', stroke: TINTA.faixa, width: 1, points: { show: false }, value: () => '3' },
        { label: 'de baixo', stroke: TINTA.faixa, width: 1, points: { show: false }, value: () => '−3' },
      ],
      bands: [{ series: [3, 4], fill: TINTA.faixa }],
    }),
    [nomeA, nomeB, corA, corB],
  );
  const dadosZ = useMemo(() => {
    const m = ch.minuto.length;
    const pos = new Array<number | null>(m);
    const neg = new Array<number | null>(m);
    for (let k = 0; k < m; k++) {
      const z = ch.secoes[k] >= MIN_SECOES_MINUTO ? ch.z[k] : NaN;
      pos[k] = z > 0 ? z : null;
      neg[k] = z < 0 ? z : null;
    }
    return [ch.minuto, pos, neg, new Array(m).fill(3), new Array(m).fill(-3)] as unknown as uPlot.AlignedData;
  }, [ch]);

  const piores = useMemo(() => {
    const lista: number[] = [];
    for (let k = 0; k < ch.minuto.length; k++) if (ch.secoes[k] >= MIN_SECOES_MINUTO && Number.isFinite(ch.z[k])) lista.push(k);
    return lista.sort((x, y) => Math.abs(ch.z[y]) - Math.abs(ch.z[x])).slice(0, 12);
  }, [ch]);

  const marcos = useMemo(
    () =>
      ch.porRegiao.map((r) => ({
        rotulo: r.rotulo,
        cor: COR_REGIAO[r.regiao],
        tempos: [50, 90, 100].map((alvo) => {
          const k = r.pct.findIndex((v) => v >= alvo - 1e-9);
          return k >= 0 ? ch.minuto[k] : NaN;
        }),
      })),
    [ch],
  );

  if (!ch.minuto.length) return null;

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1.5}>
        <TextField select size="small" label="Esperado por" value={nivel} onChange={(e) => setNivel(e.target.value as NivelEsperado)} sx={{ minWidth: 170 }}>
          <MenuItem value="municipio">Município</MenuItem>
          <MenuItem value="uf">UF</MenuItem>
        </TextField>
      </Stack>

      <Painel titulo="Boletins recebidos por minuto" subtitulo={`De ${fmtHora(ch.minuto[0])} a ${fmtHora(ch.minuto[ch.minuto.length - 1] + 59)}`}>
        <Grafico rotulo="Quantidade de boletins recebidos a cada minuto" opcoes={opcoesQtd} dados={dadosQtd} altura={220} sincronia="chegada" />
      </Painel>

      <Painel titulo="Quanto de cada região já tinha chegado" subtitulo="% das seções da região recebidas até cada minuto">
        <Grafico rotulo="Percentual das seções recebidas por região ao longo do tempo" opcoes={opcoesReg} dados={dadosReg} altura={260} sincronia="chegada" />
        <TableContainer sx={{ mt: 1.5 }}>
          <Table size="small" aria-label="Horário em que cada região atingiu 50%, 90% e 100% das seções">
            <TableHead>
              <TableRow>
                <TableCell>Região</TableCell>
                <TableCell align="right">50% das seções</TableCell>
                <TableCell align="right">90%</TableCell>
                <TableCell align="right">100%</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {marcos.map((m) => (
                <TableRow key={m.rotulo}>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: m.cor }} />
                      <span>{m.rotulo}</span>
                    </Stack>
                  </TableCell>
                  {m.tempos.map((t, i) => (
                    <TableCell key={i} align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {fmtHoraCurta(t)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Painel>

      <Painel titulo="Cada minuto contra o esperado" subtitulo={`Quanto o lote de boletins do minuto destoou do que os municípios dele explicam (minutos com ${MIN_SECOES_MINUTO} boletins ou mais)`}>
        <Grafico rotulo="Desvio de cada minuto em relação ao esperado" opcoes={opcoesZ} dados={dadosZ} altura={240} sincronia="chegada" />
        <Nota>
          Cada seção do lote é comparada com o resultado final do seu {nivel === 'municipio' ? 'município' : 'estado'}. Se as seções de um minuto fossem um sorteio dentro dos seus municípios, quase todas as barras ficariam dentro da faixa de ±3. Barras maiores costumam ser <b>seções parecidas chegando juntas</b>, como uma zona eleitoral inteira de um bairro: como elas votam de modo parecido entre si, o lote destoa mais do que um sorteio. Clique e arraste para ver um trecho.
        </Nota>
        <TableContainer sx={{ mt: 1.5 }}>
          <Table size="small" aria-label="Minutos que mais destoaram do esperado">
            <TableHead>
              <TableRow>
                <TableCell>Minuto</TableCell>
                <TableCell align="right">Boletins</TableCell>
                <TableCell align="right">{nomeA} no lote</TableCell>
                <TableCell align="right">Esperado</TableCell>
                <TableCell align="right">Desvio</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {piores.map((k) => (
                <TableRow key={k}>
                  <TableCell>{fmtHoraCurta(ch.minuto[k])}</TableCell>
                  <TableCell align="right">{fmtInt(ch.secoes[k])}</TableCell>
                  <TableCell align="right">{fmtPct(ch.loteRazao[k], 2)}</TableCell>
                  <TableCell align="right">{fmtPct(ch.loteEsperado[k], 2)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {fmtNum(ch.z[k], 1)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Painel>
    </Stack>
  );
}
