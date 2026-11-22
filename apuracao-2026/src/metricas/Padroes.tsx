import { MouseEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import uPlot from 'uplot';
import { nomeProprio } from '../utils/formato';
import { fmtCientifico, fmtInt, fmtNum, fmtPct } from './calculos';
import { Analise, CandidatoMeta, Tabela, TesteDigito } from './dados';
import Grafico, { corDoPartido, eixo, TINTA } from './Grafico';
import { Indicador, Indicadores, Nota, Painel } from './ui';

// rampa sequencial (um só tom, do claro ao escuro) para contagens
const RAMPA = ['#cde2fb', '#b7d3f6', '#9ec5f4', '#86b6ef', '#6da7ec', '#5598e7', '#3987e5', '#2a78d6', '#256abf', '#1c5cab', '#184f95', '#104281', '#0d366b'];

function veredito(p: number) {
  if (p >= 0.01) return `compatível com o acaso (p = ${fmtNum(p, 2)})`;
  return `desvio acima do acaso (p = ${p < 1e-4 ? fmtCientifico(p) : fmtNum(p, 4)})`;
}

/** desvio de cada dígito em relação ao esperado, em erros-padrão (barras divergentes em torno de zero) */
function BarrasDigito({ teste, cor, nome }: { teste: TesteDigito; cor: string; nome: string }) {
  const z = teste.contagem.map((o, d) => {
    const e = teste.total * teste.esperado[d];
    return e > 0 ? (o - e) / Math.sqrt(e) : 0;
  });
  const teto = Math.max(3, ...z.map(Math.abs));
  const L = 300;
  const A = 150;
  const meio = A / 2;
  const escala = (meio - 14) / teto;
  const larg = L / 10;
  return (
    <Box minWidth={0}>
      <Typography fontSize={14} fontWeight={700}>
        {nome}
      </Typography>
      <Typography fontSize={12} color="text.secondary" mb={0.5}>
        {fmtInt(teste.total)} seções · χ² = {fmtNum(teste.qui2, 1)} · {veredito(teste.p)}
      </Typography>
      <Box component="svg" viewBox={`0 0 ${L} ${A + 16}`} sx={{ width: '100%', maxWidth: 460, display: 'block' }} role="img" aria-label={`Desvio de cada dígito para ${nome}`}>
        {[-2, 2].map((g) => (
          <line key={g} x1={0} x2={L} y1={meio - g * escala} y2={meio - g * escala} stroke={TINTA.grade} strokeWidth={1} />
        ))}
        <line x1={0} x2={L} y1={meio} y2={meio} stroke={TINTA.neutro} strokeWidth={1} />
        {z.map((v, d) => {
          const h = Math.abs(v) * escala;
          return (
            <g key={d}>
              <title>{`Dígito ${d}: ${fmtInt(teste.contagem[d])} seções; esperado ${fmtInt(teste.total * teste.esperado[d])}; desvio ${fmtNum(v, 2)}`}</title>
              <rect x={d * larg + 6} y={v >= 0 ? meio - h : meio} width={larg - 12} height={Math.max(1, h)} rx={3} fill={cor} />
              <rect x={d * larg} y={0} width={larg} height={A} fill="transparent" />
              <text x={d * larg + larg / 2} y={A + 12} textAnchor="middle" fontSize={11} fill={TINTA.texto}>
                {d}
              </text>
            </g>
          );
        })}
        <text x={2} y={meio - 2 * escala - 3} fontSize={9} fill={TINTA.texto}>
          +2
        </text>
        <text x={2} y={meio + 2 * escala + 10} fontSize={9} fill={TINTA.texto}>
          −2
        </text>
      </Box>
    </Box>
  );
}

function qui2Contra(teste: TesteDigito) {
  return teste.contagem.reduce((s, o, d) => {
    const e = teste.total * teste.referencia[d];
    return s + (o - e) ** 2 / e;
  }, 0);
}

/** seções por (comparecimento %, votos do candidato sobre o comparecimento %) */
function ImpressaoDigital({ celulas, nome }: { celulas: [number, number, number][]; nome: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [foco, setFoco] = useState<string>('Passe o mouse no gráfico');
  const mapa = useMemo(() => {
    const m = new Map<number, number>();
    celulas.forEach(([x, y, v]) => m.set(x * 100 + y, v));
    return m;
  }, [celulas]);
  const maximo = useMemo(() => Math.max(1, ...celulas.map((c) => c[2])), [celulas]);
  useEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx) return;
    ctx.clearRect(0, 0, 400, 400);
    ctx.fillStyle = '#fcfcfb';
    ctx.fillRect(0, 0, 400, 400);
    celulas.forEach(([x, y, v]) => {
      const nivel = Math.min(RAMPA.length - 1, Math.floor((Math.log(v) / Math.log(maximo + 1)) * RAMPA.length));
      ctx.fillStyle = RAMPA[nivel];
      ctx.fillRect(x * 4, 396 - y * 4, 4, 4);
    });
  }, [celulas, maximo]);
  const mover = (e: MouseEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.min(99, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * 100)));
    const y = Math.min(99, Math.max(0, Math.floor(((r.bottom - e.clientY) / r.height) * 100)));
    setFoco(`Comparecimento ${x}–${x + 1}% · ${nome} ${y}–${y + 1}% dos votos: ${fmtInt(mapa.get(x * 100 + y) ?? 0)} seções`);
  };
  return (
    <Box minWidth={0}>
      <Typography fontSize={14} fontWeight={700} mb={0.5}>
        {nome}
      </Typography>
      <Stack direction="row" spacing={0.75}>
        <Typography fontSize={11} color="text.secondary" sx={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', textAlign: 'center' }}>
          % dos votos da seção para {nome} (0 a 100)
        </Typography>
        <Box flex={1} minWidth={0}>
          <Box
            component="canvas"
            ref={ref}
            width={400}
            height={400}
            onMouseMove={mover}
            role="img"
            aria-label={`Distribuição das seções por comparecimento e votos para ${nome}`}
            sx={{ width: '100%', maxWidth: 400, aspectRatio: '1', display: 'block', border: 1, borderColor: 'divider', borderRadius: '8px', cursor: 'crosshair' }}
          />
          <Typography fontSize={11} color="text.secondary" textAlign="center" maxWidth={400}>
            Comparecimento da seção (0 a 100%)
          </Typography>
        </Box>
      </Stack>
      <Typography fontSize={12} color="text.secondary" mt={0.5} sx={{ fontVariantNumeric: 'tabular-nums' }}>
        {foco}
      </Typography>
    </Box>
  );
}

function Legenda({ maximo }: { maximo: number }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} mt={1}>
      <Typography fontSize={12} color="text.secondary">
        1 seção
      </Typography>
      <Box sx={{ display: 'flex', width: 180, height: 10, borderRadius: '3px', overflow: 'hidden' }}>
        {RAMPA.map((c) => (
          <Box key={c} flex={1} bgcolor={c} />
        ))}
      </Box>
      <Typography fontSize={12} color="text.secondary">
        {fmtInt(maximo)} seções (escala logarítmica)
      </Typography>
    </Stack>
  );
}

interface Props {
  tabela: Tabela;
  analise: Analise;
  a: CandidatoMeta;
  b: CandidatoMeta;
}

export default function Padroes({ tabela, analise, a, b }: Props) {
  const [hist, setHist] = useState<'proporcao' | 'comparecimento'>('proporcao');
  const p = analise.padroes;
  const nomeA = nomeProprio(a.nome);
  const nomeB = nomeProprio(b.nome);
  const corA = corDoPartido(a.partido, 0);
  const corB = corDoPartido(b.partido, 1);
  const h = p[hist];

  const opcoesHist = useMemo<Omit<uPlot.Options, 'width' | 'height'>>(
    () => ({
      scales: { x: { time: false, range: [0, 100] } },
      axes: [
        eixo({ label: hist === 'proporcao' ? `% de ${nomeA} entre os dois (faixas de 0,1 ponto)` : 'Comparecimento (faixas de 0,1 ponto)', values: (_, t) => t.map((v) => `${fmtNum(v, 0)}%`) }),
        eixo({ label: 'Seções', size: 56 }),
      ],
      series: [
        { label: 'Faixa', value: (_, v) => (v == null ? '—' : `${fmtNum(v, 1)}% a ${fmtNum(v + 0.1, 1)}%`) },
        { label: 'Seções reais', stroke: hist === 'proporcao' ? corA : '#33322e', width: 1.5, value: (_, v) => (v == null ? '—' : fmtInt(v)) },
        { label: 'Mesmas seções sorteadas de novo', stroke: TINTA.neutro, width: 1.5, value: (_, v) => (v == null ? '—' : fmtNum(v, 1)) },
      ],
    }),
    [hist, nomeA, corA],
  );
  const dadosHist = useMemo(
    () => [Array.from({ length: 1000 }, (_, k) => k / 10), h.histograma, h.histogramaAcaso] as unknown as uPlot.AlignedData,
    [h],
  );
  const zInteiros = (x: { observados: number; esperados: number; desvio: number }) => (x.desvio > 0 ? (x.observados - x.esperados) / x.desvio : 0);
  const maxA = Math.max(1, ...p.impressaoDigital.c0.map((c) => c[2]));
  const maxB = Math.max(1, ...p.impressaoDigital.c1.map((c) => c[2]));
  const idt = p.identicos;

  return (
    <Stack spacing={2}>
      <Typography fontSize={13} color="text.secondary">
        Estes testes usam o Brasil inteiro, de uma vez (o recorte de UF não se aplica aqui).
      </Typography>

      <Painel titulo="Último dígito dos votos por seção" subtitulo={`Seções com ${p.ultimoDigito.c0?.minimo ?? 50} votos ou mais para o candidato · barras: desvio de cada dígito em erros-padrão`}>
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
          {p.ultimoDigito.c0 && <BarrasDigito teste={p.ultimoDigito.c0} cor={corA} nome={nomeA} />}
          {p.ultimoDigito.c1 && <BarrasDigito teste={p.ultimoDigito.c1} cor={corB} nome={nomeB} />}
        </Box>
        <Nota>
          Contagem inventada à mão costuma repetir dígitos (preferência por 0 e 5, por exemplo). O esperado aqui não é "10% para cada dígito": é o que sai das <b>mesmas seções sorteadas de novo</b> com o perfil delas, o que respeita o tamanho de cada seção. Barras dentro de ±2 são variação normal; com 20 barras, uma ou outra passa de 2 por acaso.
        </Nota>
      </Painel>

      <Painel titulo="Segundo dígito dos votos por seção" subtitulo="Mesma leitura do gráfico acima, para o dígito das dezenas">
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
          {p.segundoDigito.c0 && <BarrasDigito teste={p.segundoDigito.c0} cor={corA} nome={nomeA} />}
          {p.segundoDigito.c1 && <BarrasDigito teste={p.segundoDigito.c1} cor={corB} nome={nomeB} />}
        </Box>
        {p.segundoDigito.c0 && (
          <Nota>
            Muita gente aplica aqui a <b>lei de Benford</b>. Contra ela, o χ² de {nomeA} seria {fmtInt(qui2Contra(p.segundoDigito.c0))}, um "desvio" gigantesco, só que Benford não vale para contagens limitadas: uma seção tem no máximo ~500 eleitores. Por isso o esperado aqui também vem do sorteio das próprias seções.
          </Nota>
        )}
      </Painel>

      <Indicadores>
        <Indicador
          rotulo="PERCENTUAIS INTEIROS · VOTOS"
          valor={fmtInt(p.proporcao.inteiros.observados)}
          detalhe={`acaso: ${fmtInt(p.proporcao.inteiros.esperados)} ± ${fmtInt(p.proporcao.inteiros.desvio)} (${fmtNum(zInteiros(p.proporcao.inteiros), 1)} desvios)`}
        />
        <Indicador
          rotulo="PERCENTUAIS INTEIROS · COMPARECIMENTO"
          valor={fmtInt(p.comparecimento.inteiros.observados)}
          detalhe={`acaso: ${fmtInt(p.comparecimento.inteiros.esperados)} ± ${fmtInt(p.comparecimento.inteiros.desvio)} (${fmtNum(zInteiros(p.comparecimento.inteiros), 1)} desvios)`}
        />
        <Indicador rotulo="EMPATES EXATOS (50%)" valor={fmtInt(p.proporcao.empates.observados)} detalhe={`acaso: ${fmtNum(p.proporcao.empates.esperados, 0)}`} />
        <Indicador rotulo="SEÇÕES NOS TESTES" valor={fmtInt(p.proporcao.secoes)} detalhe={`com ${analise.minimoPadrao} votos ou mais`} />
      </Indicadores>

      <Painel
        titulo="Distribuição fina das seções"
        subtitulo="Quantas seções caíram em cada faixa de 0,1 ponto percentual, contra as mesmas seções sorteadas de novo"
        acoes={
          <ToggleButtonGroup size="small" exclusive value={hist} onChange={(_, v) => v && setHist(v)} aria-label="Distribuição">
            <ToggleButton value="proporcao">Votos</ToggleButton>
            <ToggleButton value="comparecimento">Comparecimento</ToggleButton>
          </ToggleButtonGroup>
        }
      >
        <Grafico rotulo="Histograma fino das seções" opcoes={opcoesHist} dados={dadosHist} altura={300} />
        <Nota>
          Resultado ajustado à mão tende a cair em <b>números redondos</b> (60%, 70%...), e isso aparece como picos que o sorteio não tem. Os dentes que surgem nas duas linhas ao mesmo tempo (em 50%, 33,3%, 66,7%) são aritmética: frações simples acontecem em muitas seções pequenas. Arraste para dar zoom.
        </Nota>
      </Painel>

      <Painel titulo="Impressão digital: comparecimento × votos" subtitulo="Cada ponto é uma faixa de 1% × 1%; quanto mais escuro, mais seções">
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
          <ImpressaoDigital celulas={p.impressaoDigital.c0} nome={nomeA} />
          <ImpressaoDigital celulas={p.impressaoDigital.c1} nome={nomeB} />
        </Box>
        <Legenda maximo={Math.max(maxA, maxB)} />
        <Nota>
          Em eleições com urnas enchidas, a nuvem ganha uma cauda esticada até o canto de cima à direita: seções com comparecimento perto de 100% e quase todos os votos para um lado. Procure essa cauda aqui. Pontas para o alto que não chegam ao canto são lugares com votação concentrada num candidato (aldeias, cidades pequenas); as seções delas aparecem na aba Seções raras.
        </Nota>
      </Painel>

      <Painel titulo="Boletins idênticos no mesmo município" subtitulo={`Todos os candidatos, brancos e nulos iguais, em seções com ${analise.minimoPadrao} votos ou mais`}>
        <Indicadores>
          <Indicador rotulo="GRUPOS" valor={fmtInt(idt.grupos)} detalhe={`${fmtInt(idt.secoesRepetidas)} seções envolvidas`} />
          <Indicador rotulo="SEÇÕES COMPARADAS" valor={fmtInt(idt.secoes)} />
        </Indicadores>
        {idt.lista.length > 0 && (
          <TableContainer sx={{ mt: 1.5, maxHeight: 420 }}>
            <Table size="small" stickyHeader aria-label="Grupos de boletins idênticos">
              <TableHead>
                <TableRow>
                  <TableCell>Município</TableCell>
                  <TableCell>Seções (zona · seção · local)</TableCell>
                  <TableCell align="right">{nomeA}</TableCell>
                  <TableCell align="right">{nomeB}</TableCell>
                  <TableCell align="right">Brancos</TableCell>
                  <TableCell align="right">Nulos</TableCell>
                  <TableCell>Mesmo local?</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {idt.lista.slice(0, 100).map((g) => {
                  const i = g[0];
                  const m = tabela.meta.municipios[tabela.mun[i]];
                  const mesmoLocal = g.every((j) => tabela.local[j] === tabela.local[i] && tabela.zona[j] === tabela.zona[i]);
                  return (
                    <TableRow key={g.join('-')} sx={{ '& td': { fontVariantNumeric: 'tabular-nums' } }}>
                      <TableCell>
                        {nomeProprio(m.nome)} · {m.uf}
                      </TableCell>
                      <TableCell>{g.map((j) => `${tabela.zona[j]} · ${tabela.secao[j]} · ${tabela.local[j]}`).join('  |  ')}</TableCell>
                      <TableCell align="right">{fmtInt(tabela.votos[0][i])}</TableCell>
                      <TableCell align="right">{fmtInt(tabela.votos[1][i])}</TableCell>
                      <TableCell align="right">{fmtInt(tabela.br[i])}</TableCell>
                      <TableCell align="right">{fmtInt(tabela.nu[i])}</TableCell>
                      <TableCell sx={{ fontWeight: mesmoLocal ? 800 : 400 }}>{mesmoLocal ? 'sim' : 'não'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <Nota>
          {tabela.meta.candidatos.length > 2
            ? `No 1º turno o boletim tem ${tabela.meta.candidatos.length} candidatos, e repetir todos os números por acaso é quase impossível.`
            : 'No 2º turno o boletim de Presidente tem só quatro números (dois candidatos, brancos e nulos). Em cidades com milhares de seções, coincidências exatas acontecem por acaso, e quase todas caem em locais diferentes. O que merece atenção é coincidência no mesmo local ou em grupos grandes.'}{' '}
          Não existe aqui um "esperado pelo acaso" confiável, porque ele depende do formato fino da distribuição, que é justamente o que se quer olhar. Confira caso a caso. {fmtPct(idt.secoes ? (idt.secoesRepetidas * 100) / idt.secoes : 0, 2)} das seções comparadas estão em algum grupo.
        </Nota>
      </Painel>
    </Stack>
  );
}
