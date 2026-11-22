import { Fragment, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Collapse,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import uPlot from 'uplot';
import { nomeProprio } from '../utils/formato';
import { fmtChance, fmtCientifico, fmtEsperado, fmtHora, fmtInt, fmtNum, fmtPct, secoesDoLocal } from './calculos';
import { Analise, CandidatoMeta, NivelVizinhanca, SecaoRara, Tabela, TesteRaroId, Turno } from './dados';
import Grafico, { eixo, TINTA } from './Grafico';
import { Indicador, Indicadores, Nota, Painel } from './ui';

const AJUDA_COLUNA = {
  resultado: 'O resultado desta seção.',
  vizinhas: 'O mesmo número nas outras seções do mesmo local de votação (mesma escola), somadas.',
  previsto: 'O que a seção teria no 2º turno se repetisse o próprio 1º turno e mudasse igual às vizinhas.',
  desvio: 'Distância entre a seção e as vizinhas, em unidades de variação normal. A maioria das seções fica entre −2 e +2.',
  chance: 'Se a seção fosse igual às vizinhas, de quantas em quantas seções a variação natural produziria uma diferença tão grande.',
  acaso: 'Quantas seções assim o acaso produziria no Brasil inteiro, entre todas as testadas. Abaixo de 1: o acaso sozinho não explica.',
};

function Cabecalho({ texto, ajuda }: { texto: string; ajuda: string }) {
  return (
    <TableCell align="right">
      <Tooltip title={ajuda}>
        <span style={{ borderBottom: '1px dotted currentColor', cursor: 'help' }}>{texto}</span>
      </Tooltip>
    </TableCell>
  );
}

const ESCALA: Record<number, string> = {
  2: '1 em 100',
  3: '1 em mil',
  4: '1 em 10 mil',
  5: '1 em 100 mil',
  6: '1 em 1 milhão',
  7: '1 em 10 mi',
  8: '1 em 100 mi',
  9: '1 em 1 bilhão',
  10: '1 em 10 bi',
  11: '1 em 100 bi',
  12: '1 em 1 trilhão',
};
const POR_PAGINA = 50;

function Vizinhas({ tabela, i, a, b }: { tabela: Tabela; i: number; a: string; b: string }) {
  const lista = useMemo(() => secoesDoLocal(tabela, i), [tabela, i]);
  const va = tabela.votos[0];
  const vb = tabela.votos[1];
  return (
    <Box sx={{ py: 1.5, px: { xs: 0, sm: 1 } }}>
      <Typography fontSize={13} fontWeight={700} mb={0.5}>
        Seções do mesmo local de votação ({lista.length})
      </Typography>
      {tabela.agreg[i] > 0 && (
        <Typography fontSize={12.5} color="text.secondary" mb={0.5}>
          A seção {tabela.secao[i]} recebeu {tabela.agreg[i]} seção agregada: eleitores de outra seção foram juntados a ela. Isso muda o perfil de quem vota ali e costuma explicar a diferença em relação às vizinhas.
        </Typography>
      )}
      <TableContainer>
        <Table size="small" aria-label="Seções do mesmo local de votação">
          <TableHead>
            <TableRow>
              <TableCell>Seção</TableCell>
              <TableCell align="right">Aptos</TableCell>
              <TableCell align="right">Comparec.</TableCell>
              <TableCell align="right">{a}</TableCell>
              <TableCell align="right">{b}</TableCell>
              <TableCell align="right">% {a} (dos dois)</TableCell>
              <TableCell align="right">Brancos</TableCell>
              <TableCell align="right">Nulos</TableCell>
              <TableCell align="right">Boletim chegou</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {lista.map((j) => {
              const t = va[j] + vb[j];
              return (
                <TableRow key={j} selected={j === i} sx={{ '& td': { fontVariantNumeric: 'tabular-nums', fontWeight: j === i ? 800 : 400 } }}>
                  <TableCell>
                    {tabela.secao[j]}
                    {tabela.agreg[j] ? ` (+${tabela.agreg[j]} agregada${tabela.agreg[j] > 1 ? 's' : ''})` : ''}
                  </TableCell>
                  <TableCell align="right">{fmtInt(tabela.aptos[j])}</TableCell>
                  <TableCell align="right">{tabela.aptos[j] ? fmtPct((tabela.comp[j] * 100) / tabela.aptos[j], 1) : '—'}</TableCell>
                  <TableCell align="right">{fmtInt(va[j])}</TableCell>
                  <TableCell align="right">{fmtInt(vb[j])}</TableCell>
                  <TableCell align="right">{t ? fmtPct((va[j] * 100) / t, 1) : '—'}</TableCell>
                  <TableCell align="right">{fmtInt(tabela.br[j])}</TableCell>
                  <TableCell align="right">{fmtInt(tabela.nu[j])}</TableCell>
                  <TableCell align="right">{fmtHora(tabela.rec[j])}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

interface Props {
  tabela: Tabela;
  analise: Analise;
  mascara: Uint8Array;
  a: CandidatoMeta;
  b: CandidatoMeta;
  turno: Turno;
}

export default function Raros({ tabela, analise, mascara, a, b, turno }: Props) {
  const [teste, setTeste] = useState<TesteRaroId>('votos');
  const [nivel, setNivel] = useState<NivelVizinhanca>('local');
  const [aberta, setAberta] = useState<number | null>(null);
  const [limite, setLimite] = useState(POR_PAGINA);
  const nomeA = nomeProprio(a.nome);
  const nomeB = nomeProprio(b.nome);
  // a virada só existe no 2º turno: ao voltar para o 1º, cai para votos
  const testeAtivo: TesteRaroId = analise.raros[teste] ? teste : 'votos';
  const dadosTeste = analise.raros[testeAtivo]!;
  const dadosNivel = dadosTeste.niveis[nivel];

  const opcoes = useMemo<Omit<uPlot.Options, 'width' | 'height'>>(() => {
    // escala logarítmica: só as potências de 10 ganham linha e número
    const decadas: uPlot.Axis.Filter = (_, t) => t.map((v) => (Math.abs(Math.log10(v) - Math.round(Math.log10(v))) < 1e-9 ? v : null));
    return {
      scales: { x: { time: false, range: [1.7, 12.3] }, y: { distr: 3, log: 10 } },
      cursor: { drag: { x: false, y: false } },
      axes: [
        eixo({ values: (_, t) => t.map((v) => ESCALA[v] ?? ''), incrs: [1], space: 60, label: 'Chance da seção (ou menor)' }),
        eixo({
          label: 'Seções',
          size: 72,
          filter: decadas,
          grid: { stroke: TINTA.grade, width: 1, filter: decadas },
          ticks: { stroke: TINTA.grade, width: 1, size: 4, filter: decadas },
          values: (_, t) => t.map((v) => (v == null ? '' : v >= 1 ? fmtInt(v) : fmtCientifico(v))),
        }),
      ],
      series: [
        { label: 'Limite', value: (_, v) => (v == null ? '—' : ESCALA[v] ?? '') },
        { label: 'Encontradas', stroke: '#33322e', width: 2, points: { show: true, size: 8, fill: '#33322e' }, value: (_, v) => (v == null ? '0' : fmtInt(v)) },
        { label: 'Esperadas só pelo acaso', stroke: TINTA.neutro, width: 2, points: { show: true, size: 8, fill: TINTA.neutro }, value: (_, v) => (v == null ? '—' : v >= 1 ? fmtNum(v, 1) : fmtCientifico(v)) },
      ],
    };
  }, []);
  const dadosGrafico = useMemo(() => {
    const ex = dadosNivel.excesso;
    return [
      ex.map((e) => -Math.round(Math.log10(e.limite))),
      ex.map((e) => (e.observadas > 0 ? e.observadas : null)),
      ex.map((e) => e.esperadas),
    ] as unknown as uPlot.AlignedData;
  }, [dadosNivel]);

  const lista = useMemo(() => dadosNivel.secoes.filter((s) => mascara[tabela.uf[s.i]]), [dadosNivel, mascara, tabela]);
  const marco = (k: number) => dadosNivel.excesso.find((e) => Math.round(-Math.log10(e.limite)) === k);

  const resultado = (s: SecaoRara) => {
    if (testeAtivo === 'comparecimento') return { real: `${fmtPct((s.k * 100) / s.n, 1)} (${fmtInt(s.k)} de ${fmtInt(s.n)})`, esperado: fmtPct(s.p * 100, 1) };
    if (testeAtivo === 'virada')
      return {
        real: `${fmtPct(((s.k1 ?? 0) * 100) / (s.n1 || 1), 1)} → ${fmtPct((s.k * 100) / s.n, 1)}`,
        esperado: fmtPct(s.p * 100, 1),
      };
    return { real: `${fmtPct((s.k * 100) / s.n, 1)} (${fmtInt(s.k)} de ${fmtInt(s.n)})`, esperado: fmtPct(s.p * 100, 1) };
  };
  const tituloResultado = testeAtivo === 'comparecimento' ? 'Comparecimento' : testeAtivo === 'virada' ? `${nomeA}: 1º → 2º turno` : `${nomeA} (dos dois)`;

  /** a primeira linha da lista explicada em português, coluna por coluna */
  function ComoLer({ s }: { s: SecaoRara }) {
    const m = tabela.meta.municipios[tabela.mun[s.i]];
    const r = resultado(s);
    const acaso = fmtEsperado(dadosNivel.testadas, s.l10p);
    const pctReal = fmtPct((s.k * 100) / s.n, 1);
    const pctViz = fmtPct(s.p * 100, 1);
    const lado = s.z < 0 ? 'abaixo' : 'acima';
    // "16 milhões" de seções; "2,3 mil" seções
    const vezes = fmtChance(s.l10p).replace(/^1 em /, '').replace(/(ão|ões)$/, '$1 de');
    const linhas =
      testeAtivo === 'comparecimento'
        ? [
            <>
              <b>Comparecimento {r.real}</b>: nesta seção votaram {fmtInt(s.k)} dos {fmtInt(s.n)} eleitores aptos.
            </>,
            <>
              <b>Vizinhas {pctViz}</b>: nas outras seções do mesmo local de votação (local {tabela.local[s.i]}), o comparecimento foi de {pctViz}.
            </>,
          ]
        : testeAtivo === 'virada'
          ? [
              <>
                <b>{r.real}</b>: {nomeA} tinha {fmtPct(((s.k1 ?? 0) * 100) / (s.n1 || 1), 1)} desta seção no 1º turno e ficou com {pctReal} no 2º.
              </>,
              <>
                <b>Previsto {pctViz}</b>: se a seção repetisse o próprio 1º turno e mudasse do mesmo jeito que as outras seções da escola mudaram, teria {pctViz}.
              </>,
            ]
          : [
              <>
                <b>
                  {nomeA} {r.real}
                </b>
                : nesta seção, dos {fmtInt(s.n)} votos dados aos dois candidatos, {fmtInt(s.k)} foram para {nomeA}.
              </>,
              <>
                <b>Vizinhas {pctViz}</b>: nas outras seções do mesmo local de votação (local {tabela.local[s.i]}), {nomeA} teve {pctViz}. Quem vota na mesma escola costuma votar parecido.
              </>,
            ];
    return (
      <Box sx={{ mb: 1.5, p: 1.5, borderRadius: '12px', border: 1, borderColor: 'divider', bgcolor: 'background.default' }}>
        <Typography fontSize={13.5} fontWeight={800} mb={0.75}>
          Como ler: a linha 1 é a seção {tabela.secao[s.i]} da zona {tabela.zona[s.i]}, em {nomeProprio(m.nome)} · {m.uf}
        </Typography>
        <Box component="ul" sx={{ m: 0, pl: 2.5, '& li': { fontSize: 13, color: 'text.secondary', mb: 0.4 }, '& b': { color: 'text.primary' } }}>
          {linhas.map((l, k) => (
            <li key={k}>{l}</li>
          ))}
          <li>
            <b>Desvio {fmtNum(s.z, 1)}</b>: o tamanho dessa diferença, medido em "variações normais". A grande maioria das seções do país fica entre −2 e +2 em relação às vizinhas; {fmtNum(s.z, 1)} é muito {lado} delas.
          </li>
          <li>
            <b>Chance {fmtChance(s.l10p)}</b>: se esta seção fosse igual às vizinhas, a variação natural entre eleitores só produziria uma diferença desse tamanho uma vez a cada {vezes} seções.
          </li>
          <li>
            <b>Acaso no Brasil {acaso}</b>: foram testadas {fmtInt(dadosNivel.testadas)} seções. Com essa chance, o acaso produziria {acaso} seções assim no país inteiro, praticamente nenhuma; por isso ela merece ser olhada. Quando esse número passa de 1, o acaso sozinho já explica.
          </li>
          <li>
            <b>Improvável não quer dizer fraude.</b> O mais comum é a seção ter um público diferente das vizinhas: seção agregada (recebeu eleitores de outra), aldeia, presídio, quartel, universidade. Clique na linha para ver as outras seções da mesma escola.
          </li>
        </Box>
      </Box>
    );
  }

  const m6 = marco(6);
  const m9 = marco(9);
  const m3 = marco(3);

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
        <ToggleButtonGroup size="small" exclusive value={testeAtivo} onChange={(_, v) => v && (setTeste(v), setAberta(null), setLimite(POR_PAGINA))} aria-label="Teste">
          <ToggleButton value="votos">Votos</ToggleButton>
          <ToggleButton value="comparecimento">Comparecimento</ToggleButton>
          {analise.raros.virada && <ToggleButton value="virada">Virada 1º → 2º</ToggleButton>}
        </ToggleButtonGroup>
        <ToggleButtonGroup size="small" exclusive value={nivel} onChange={(_, v) => v && (setNivel(v), setAberta(null), setLimite(POR_PAGINA))} aria-label="Comparação">
          <ToggleButton value="local">Com a mesma escola</ToggleButton>
          <ToggleButton value="zona">Seção sozinha no local</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <Indicadores>
        <Indicador rotulo="SEÇÕES TESTADAS" valor={fmtInt(dadosNivel.testadas)} detalhe={nivel === 'local' ? 'comparadas com as outras do mesmo local' : 'comparadas com a zona eleitoral'} />
        <Indicador rotulo="ABAIXO DE 1 EM MIL" valor={fmtInt(m3?.observadas ?? 0)} detalhe={`acaso: ${fmtNum(m3?.esperadas ?? 0, 0)} (ponto de calibração)`} />
        <Indicador rotulo="ABAIXO DE 1 EM 1 MILHÃO" valor={fmtInt(m6?.observadas ?? 0)} detalhe={`acaso: ${fmtNum(m6?.esperadas ?? 0, 2)}`} />
        <Indicador rotulo="ABAIXO DE 1 EM 1 BILHÃO" valor={fmtInt(m9?.observadas ?? 0)} detalhe={`acaso: ${fmtCientifico(m9?.esperadas ?? 0)}`} />
      </Indicadores>

      <Painel
        titulo="Quantas seções improváveis existem × quantas o acaso produz"
        subtitulo={`Brasil inteiro · ${fmtInt(dadosNivel.testadas)} seções · escala logarítmica`}
      >
        <Grafico rotulo="Seções encontradas e esperadas pelo acaso em cada nível de raridade" opcoes={opcoes} dados={dadosGrafico} altura={280} />
        <Nota>
          Cada seção é comparada com as {nivel === 'local' ? 'outras seções do mesmo local de votação (mesma escola)' : 'seções da mesma zona, porque está sozinha no local'}, e a chance mede o quanto ela destoa <b>em relação ao quanto seções parecidas costumam destoar</b>. Essa variação natural é medida nos próprios dados, calibrada para acertar o ponto de 1 em mil (por isso as duas linhas se encontram ali). Daí para baixo, a distância entre as linhas é o que sobra além do acaso. Com {fmtInt(dadosNivel.testadas)} seções, uma chance de 1 em 100 mil aparece umas {fmtNum(dadosNivel.testadas / 1e5, 0)} vezes sem nada de estranho.
        </Nota>
      </Painel>

      <Painel
        titulo="Seções mais improváveis"
        subtitulo={`${fmtInt(lista.length)} das ${fmtInt(dadosNivel.secoes.length)} mais raras do Brasil estão no recorte · clique para ver as vizinhas`}
      >
        {lista[0] && <ComoLer s={lista[0]} />}
        <TableContainer>
          <Table size="small" aria-label="Seções mais improváveis">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" />
                <TableCell>#</TableCell>
                <TableCell>Município</TableCell>
                <TableCell align="right">Zona · seção</TableCell>
                <Cabecalho texto={tituloResultado} ajuda={AJUDA_COLUNA.resultado} />
                {testeAtivo === 'virada' ? <Cabecalho texto="Previsto" ajuda={AJUDA_COLUNA.previsto} /> : <Cabecalho texto="Vizinhas" ajuda={AJUDA_COLUNA.vizinhas} />}
                <Cabecalho texto="Desvio" ajuda={AJUDA_COLUNA.desvio} />
                <Cabecalho texto="Chance" ajuda={AJUDA_COLUNA.chance} />
                <Cabecalho texto="Acaso no Brasil" ajuda={AJUDA_COLUNA.acaso} />
              </TableRow>
            </TableHead>
            <TableBody>
              {lista.slice(0, limite).map((s) => {
                const m = tabela.meta.municipios[tabela.mun[s.i]];
                const r = resultado(s);
                const aberto = aberta === s.i;
                return (
                  <Fragment key={s.i}>
                    <TableRow hover onClick={() => setAberta(aberto ? null : s.i)} sx={{ cursor: 'pointer', '& td': { fontVariantNumeric: 'tabular-nums', borderBottom: aberto ? 0 : undefined } }}>
                      <TableCell padding="checkbox">
                        <IconButton size="small" aria-label={aberto ? 'Fechar vizinhas' : 'Ver vizinhas'}>
                          {aberto ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                        </IconButton>
                      </TableCell>
                      <TableCell>{s.posicao}</TableCell>
                      <TableCell>
                        {nomeProprio(m.nome)} · {m.uf}
                        <Typography component="span" display="block" fontSize={11.5} color="text.secondary">
                          local {tabela.local[s.i]} · {fmtInt(s.vizinhas)} votos nas vizinhas
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {tabela.zona[s.i]} · {tabela.secao[s.i]}
                      </TableCell>
                      <TableCell align="right">{r.real}</TableCell>
                      <TableCell align="right">{r.esperado}</TableCell>
                      <TableCell align="right">{fmtNum(s.z, 1)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {fmtChance(s.l10p)}
                      </TableCell>
                      <TableCell align="right" title="Quantas seções tão raras quanto esta o acaso produziria entre as testadas">
                        {fmtEsperado(dadosNivel.testadas, s.l10p)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={9} sx={{ py: 0, borderBottom: aberto ? undefined : 0 }}>
                        <Collapse in={aberto} unmountOnExit>
                          <Vizinhas tabela={tabela} i={s.i} a={nomeA} b={nomeB} />
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </Fragment>
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
          {testeAtivo === 'votos' && <>Resultado é a parte de {nomeA} nos votos dados aos dois primeiros ({turno === 1 ? 'no 1º turno, entre os dois mais votados' : 'no 2º turno, os votos válidos'}). </>}
          {testeAtivo === 'virada' && <>Previsto é o que a seção teria no 2º turno se repetisse o próprio 1º turno e mudasse igual às vizinhas (em log-chances). Pares do mesmo local com desvios opostos costumam indicar eleitores redistribuídos entre as seções de um turno para o outro. </>}
          {testeAtivo === 'comparecimento' && <>Comparecimento baixo numa seção só costuma ser cadastro antigo (eleitores que mudaram ou faleceram) ou seção que recebeu eleitores transferidos. </>}
          O que mais aparece aqui tem explicação conhecida: <b>aldeias indígenas, presídios, quartéis, hospitais, universidades e seções no exterior</b>, que têm público próprio. Antes de concluir qualquer coisa, abra as vizinhas e confira o local de votação no TSE.
        </Nota>
      </Painel>
    </Stack>
  );
}
