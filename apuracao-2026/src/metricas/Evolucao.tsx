import { useMemo, useState } from 'react';
import { MenuItem, Stack, TextField, ToggleButton, ToggleButtonGroup } from '@mui/material';
import uPlot from 'uplot';
import { nomeProprio } from '../utils/formato';
import { calcularEvolucao, janelaMovel, Evolucao as DadosEvolucao, fmtHora, fmtHoraCurta, fmtInt, fmtNum, fmtPct, INICIO_ESTAVEL, NivelEsperado } from './calculos';
import { CandidatoMeta, Tabela } from './dados';
import Grafico, { corDoPartido, eixo, faixaEstavel, TINTA } from './Grafico';
import { Indicador, Indicadores, Nota, Painel } from './ui';

export type EixoX = 'ordem' | 'hora' | 'pct';
type Inferior = 'janela' | 'razao' | 'diferenca' | 'residuo';
const JANELAS = [200, 1000, 5000];

const compacto = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });

export function eixoX(modo: EixoX): { escala: uPlot.Scale; eixo: uPlot.Axis; valor: (v: number) => string; rotulo: string } {
  if (modo === 'hora') {
    return {
      escala: { time: false },
      eixo: eixo({ values: (_, ticks) => ticks.map(fmtHoraCurta), incrs: [60, 300, 600, 900, 1800, 3600, 7200], space: 70 }),
      valor: fmtHora,
      rotulo: 'Hora de chegada (Brasília)',
    };
  }
  if (modo === 'pct') {
    return {
      escala: { time: false, range: [0, 100] },
      eixo: eixo({ values: (_, ticks) => ticks.map((v) => `${fmtNum(v, 0)}%`) }),
      valor: (v) => fmtPct(v, 3),
      rotulo: '% das seções recebidas',
    };
  }
  return {
    escala: { time: false },
    eixo: eixo({ values: (_, ticks) => ticks.map((v) => compacto.format(v)), space: 70 }),
    valor: (v) => `${fmtInt(v)}ª seção`,
    rotulo: 'Seções recebidas, na ordem de chegada',
  };
}

/** linha mais forte no zero do eixo y */
export const linhaZero: uPlot.Hooks.Arrays['draw'] = [
  (u: uPlot) => {
    const y = u.valToPos(0, 'y', true);
    if (y < u.bbox.top || y > u.bbox.top + u.bbox.height) return;
    const { ctx } = u;
    ctx.save();
    ctx.strokeStyle = TINTA.neutro;
    ctx.lineWidth = 1 * devicePixelRatio;
    ctx.beginPath();
    ctx.moveTo(u.bbox.left, y);
    ctx.lineTo(u.bbox.left + u.bbox.width, y);
    ctx.stroke();
    ctx.restore();
  },
];

function xDe(evo: DadosEvolucao, modo: EixoX) {
  return modo === 'hora' ? evo.hora : modo === 'pct' ? evo.pctSecoes : evo.ordem;
}

function momento(evo: DadosEvolucao, j: number) {
  return `${fmtHora(evo.hora[j])}, com ${fmtPct(evo.pctSecoes[j], 1)} das seções`;
}

interface Props {
  tabela: Tabela;
  idx: Uint32Array;
  a: CandidatoMeta;
  b: CandidatoMeta;
  modoX: EixoX;
  setModoX: (m: EixoX) => void;
  nivel: NivelEsperado;
  setNivel: (n: NivelEsperado) => void;
}

export default function Evolucao({ tabela, idx, a, b, modoX, setModoX, nivel, setNivel }: Props) {
  const [inferior, setInferior] = useState<Inferior>('janela');
  const [janela, setJanela] = useState(1000);
  const evo = useMemo(() => calcularEvolucao(tabela, idx, 0, 1, nivel), [tabela, idx, nivel]);
  const nomeA = nomeProprio(a.nome);
  const nomeB = nomeProprio(b.nome);
  const corA = corDoPartido(a.partido, 0);
  const corB = corDoPartido(b.partido, 1);
  const x = eixoX(modoX);
  // os primeiros 2% das seções não definem a escala vertical (no começo a linha vai de 0% a 100%)
  const pular = Math.max(100, Math.floor(evo.n * 0.02));

  const opcoesTopo = useMemo<Omit<uPlot.Options, 'width' | 'height'>>(
    () => ({
      scales: { x: x.escala, y: { range: faixaEstavel(pular) } },
      axes: [eixo({ ...x.eixo, label: x.rotulo }), eixo({ label: '% dos votos válidos', values: (_, t) => t.map((v) => `${fmtNum(v, 1)}%`), size: 64 })],
      series: [
        { label: x.rotulo, value: (_, v) => (v == null ? '—' : x.valor(v)) },
        { label: nomeA, stroke: corA, width: 2, value: (_, v) => (v == null ? '—' : fmtPct(v, 3)) },
        { label: nomeB, stroke: corB, width: 2, value: (_, v) => (v == null ? '—' : fmtPct(v, 3)) },
      ],
    }),
    // x deriva só de modoX
    [modoX, nomeA, nomeB, corA, corB, pular],
  );
  const dadosTopo = useMemo<uPlot.AlignedData>(() => [xDe(evo, modoX), evo.pctA, evo.pctB] as unknown as uPlot.AlignedData, [evo, modoX]);

  const opcoesBaixo = useMemo<Omit<uPlot.Options, 'width' | 'height'>>(() => {
    const base = { scales: { x: x.escala, y: { range: faixaEstavel(pular) } }, hooks: { draw: linhaZero } };
    const serieX = { label: x.rotulo, value: (_: uPlot, v: number | null) => (v == null ? '—' : x.valor(v)) };
    if (inferior === 'janela') {
      return {
        scales: { x: x.escala, y: { range: faixaEstavel(0) } },
        axes: [eixo({ ...x.eixo, label: x.rotulo }), eixo({ label: `% de ${nomeA} nas últimas ${fmtInt(janela)} seções`, values: (_, t) => t.map((v) => `${fmtNum(v, 2)}%`), size: 70 })],
        series: [
          serieX,
          { label: `${nomeA} nas últimas ${fmtInt(janela)} seções`, stroke: corA, width: 1.5, value: (_, v) => (v == null ? '—' : fmtPct(v, 3)) },
          { label: 'Esperado pela geografia, mesma janela', stroke: TINTA.neutro, width: 1.5, value: (_, v) => (v == null ? '—' : fmtPct(v, 3)) },
        ],
      };
    }
    if (inferior === 'razao') {
      return {
        ...base,
        hooks: {},
        axes: [eixo({ ...x.eixo, label: x.rotulo }), eixo({ label: `% de ${nomeA} entre os dois`, values: (_, t) => t.map((v) => `${fmtNum(v, 2)}%`), size: 70 })],
        series: [
          serieX,
          { label: `${nomeA} ÷ (${nomeA} + ${nomeB})`, stroke: corA, width: 2, value: (_, v) => (v == null ? '—' : fmtPct(v, 4)) },
          { label: 'Esperado pela geografia', stroke: TINTA.neutro, width: 1.5, value: (_, v) => (v == null ? '—' : fmtPct(v, 4)) },
        ],
      };
    }
    if (inferior === 'diferenca') {
      return {
        ...base,
        axes: [eixo({ ...x.eixo, label: x.rotulo }), eixo({ label: `${nomeA} − ${nomeB} (votos)`, values: (_, t) => t.map((v) => compacto.format(v)), size: 64 })],
        series: [serieX, { label: `Diferença em votos (${nomeA} − ${nomeB})`, stroke: TINTA.texto, width: 2, value: (_, v) => (v == null ? '—' : fmtInt(v)) }],
      };
    }
    return {
      ...base,
      axes: [eixo({ ...x.eixo, label: x.rotulo }), eixo({ label: 'Real − esperado (p.p.)', values: (_, t) => t.map((v) => fmtNum(v, 2)), size: 64 })],
      series: [
        serieX,
        { label: `Real − esperado (a favor de ${nomeA} quando positivo)`, stroke: corA, width: 2, value: (_, v) => (v == null ? '—' : `${fmtNum(v, 3)} p.p.`) },
        { label: 'Faixa do acaso, limite de cima', stroke: TINTA.faixa, width: 1, points: { show: false }, value: (_, v) => (v == null ? '—' : `${fmtNum(v, 3)} p.p.`) },
        { label: 'Faixa do acaso, limite de baixo', stroke: TINTA.faixa, width: 1, points: { show: false }, value: (_, v) => (v == null ? '—' : `${fmtNum(v, 3)} p.p.`) },
      ],
      bands: [{ series: [2, 3], fill: TINTA.faixa }],
    };
  }, [inferior, modoX, nomeA, nomeB, corA, pular, janela]);
  const movel = useMemo(() => (inferior === 'janela' ? janelaMovel(evo, janela) : null), [evo, inferior, janela]);

  const dadosBaixo = useMemo<uPlot.AlignedData>(() => {
    const xs = xDe(evo, modoX);
    // a janela só tem ponto depois de completar as primeiras seções
    if (movel) return [xs.subarray(janela - 1), movel.razao.subarray(janela - 1), movel.esperado.subarray(janela - 1)] as unknown as uPlot.AlignedData;
    if (inferior === 'razao') return [xs, evo.razao, evo.esperado] as unknown as uPlot.AlignedData;
    if (inferior === 'diferenca') return [xs, evo.difVotos] as unknown as uPlot.AlignedData;
    return [xs, evo.residuo, evo.bandaSup, evo.bandaInf] as unknown as uPlot.AlignedData;
  }, [evo, modoX, inferior, movel, janela]);

  const virada = evo.ultimaVirada;
  const rotuloNivel = nivel === 'municipio' ? 'município' : 'UF';

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
        <ToggleButtonGroup size="small" exclusive value={modoX} onChange={(_, v) => v && setModoX(v)} aria-label="Eixo horizontal">
          <ToggleButton value="ordem">Seções recebidas</ToggleButton>
          <ToggleButton value="hora">Horário</ToggleButton>
          <ToggleButton value="pct">% apurado</ToggleButton>
        </ToggleButtonGroup>
        <TextField select size="small" label="Esperado por" value={nivel} onChange={(e) => setNivel(e.target.value as NivelEsperado)} sx={{ minWidth: 170 }}>
          <MenuItem value="municipio">Município</MenuItem>
          <MenuItem value="uf">UF</MenuItem>
        </TextField>
      </Stack>

      <Indicadores>
        <Indicador rotulo="SEÇÕES NO RECORTE" valor={fmtInt(evo.n)} detalhe={`de ${fmtInt(tabela.n)} no total`} />
        <Indicador
          rotulo="VIRADAS NA LIDERANÇA"
          valor={fmtInt(evo.viradas)}
          detalhe={virada != null ? `última às ${momento(evo, virada)}` : `nenhuma depois de ${fmtPct(INICIO_ESTAVEL * 100, 0)} das seções`}
        />
        <Indicador rotulo={`MAIOR VANTAGEM DE ${nomeA.toUpperCase()}`} valor={evo.maiorA.valor > 0 ? `+${fmtNum(evo.maiorA.valor, 2)} p.p.` : '—'} detalhe={evo.maiorA.valor > 0 ? momento(evo, evo.maiorA.indice) : 'não liderou'} />
        <Indicador rotulo={`MAIOR VANTAGEM DE ${nomeB.toUpperCase()}`} valor={evo.maiorB.valor > 0 ? `+${fmtNum(evo.maiorB.valor, 2)} p.p.` : '—'} detalhe={evo.maiorB.valor > 0 ? momento(evo, evo.maiorB.indice) : 'não liderou'} />
      </Indicadores>

      <Painel titulo="Percentual acumulado dos votos válidos" subtitulo="Cada ponto é o total depois de mais um boletim de urna recebido pela totalização">
        <Grafico rotulo="Percentual acumulado de cada candidato ao longo da apuração" opcoes={opcoesTopo} dados={dadosTopo} altura={340} sincronia="evolucao" />
        <Nota>
          No começo poucas seções decidem tudo, por isso as linhas oscilam muito; depois cada boletim novo pesa menos no total e as linhas se acalmam. <b>Arraste</b> sobre o gráfico para dar zoom (os dois gráficos acompanham) e <b>clique duas vezes</b> para voltar.
        </Nota>
      </Painel>

      <Painel
        titulo={inferior === 'janela' ? `${nomeA} no que estava chegando (janela móvel)` : inferior === 'razao' ? `Participação de ${nomeA} no confronto direto` : inferior === 'diferenca' ? 'Diferença acumulada em votos' : `Real − esperado pela geografia (${rotuloNivel})`}
        subtitulo={
          inferior === 'janela'
            ? `Cada ponto: % de ${nomeA} entre os dois nas últimas ${fmtInt(janela)} seções recebidas até ali`
            : inferior === 'residuo'
              ? `Quanto o acumulado de ${nomeA} se afastou do que a ordem de chegada dos lugares explica`
              : undefined
        }
        acoes={
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            {inferior === 'janela' && (
              <TextField select size="small" label="Janela" value={janela} onChange={(e) => setJanela(Number(e.target.value))} sx={{ minWidth: 150 }}>
                {JANELAS.map((w) => (
                  <MenuItem key={w} value={w}>
                    {fmtInt(w)} seções
                  </MenuItem>
                ))}
              </TextField>
            )}
          <ToggleButtonGroup size="small" exclusive value={inferior} onChange={(_, v) => v && setInferior(v)} aria-label="Gráfico de baixo">
            <ToggleButton value="janela">Janela móvel</ToggleButton>
            <ToggleButton value="residuo">Real − esperado</ToggleButton>
            <ToggleButton value="razao">Razão</ToggleButton>
            <ToggleButton value="diferenca">Diferença</ToggleButton>
          </ToggleButtonGroup>
          </Stack>
        }
      >
        <Grafico rotulo="Indicador derivado da apuração" opcoes={opcoesBaixo} dados={dadosBaixo} altura={300} sincronia="evolucao" />
        {inferior === 'residuo' && (
          <Nota>
            A linha cinza do gráfico "Razão" é o <b>esperado pela geografia</b>: o que {nomeA} teria se cada seção já chegada votasse igual ao seu {rotuloNivel} no resultado final. Aqui está a diferença entre o real e esse esperado. A faixa cinza mostra o tamanho que essa diferença teria se, dentro de cada {rotuloNivel}, as seções chegassem em ordem aleatória.
            {' '}No recorte, a linha ficou fora da faixa em <b>{fmtPct(evo.foraDaFaixa * 100, 0)}</b> do tempo (depois de {fmtPct(INICIO_ESTAVEL * 100, 0)} das seções), com maior desvio de <b>{fmtNum(evo.maiorResiduo.valor, 2)} p.p.</b> às {momento(evo, evo.maiorResiduo.indice)}.
            {' '}Sair da faixa indica que a ordem de chegada dentro do {rotuloNivel} não foi aleatória (bairros centrais e cidades maiores costumam transmitir antes); a explicação está na logística, não no resultado final, que fecha em zero por construção.
          </Nota>
        )}
        {inferior === 'janela' && (
          <Nota>
            Aqui aparecem os <b>picos e vales</b>: cada ponto é só o que chegou nas últimas {fmtInt(janela)} seções, não o total. Quando chega um lote de lugares onde {nomeA} vai bem, a linha sobe; a linha cinza mostra quanto o lote <b>deveria</b> dar pelo resultado final dos municípios dele. Pico colorido longe da cinza é lote que destoou do próprio lugar. Janela menor mostra mais detalhe (e mais ruído); arraste para dar zoom, passe o mouse para ler o ponto.
          </Nota>
        )}
        {inferior === 'razao' && (
          <Nota>
            Dê zoom no fim da apuração para ver a razão andando em degraus pequenos, como no vídeo. Cada degrau é um boletim (ou um lote de boletins que chegou no mesmo segundo). Se a linha colorida anda colada à cinza, a forma da apuração é explicada pela ordem em que os lugares chegaram.
          </Nota>
        )}
      </Painel>
    </Stack>
  );
}
