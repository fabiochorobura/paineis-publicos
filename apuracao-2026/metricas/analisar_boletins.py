"""
Estatísticas da apuração que exigem todas as seções juntas.

Lê t<turno>/secoes.bin + meta.json (gerados por processar_boletins.py) e grava t<turno>/analise.json:
  raros    seções cujo resultado é improvável diante das vizinhas: votos (confronto entre os dois
           primeiros), comparecimento e, no 2º turno, a virada do 1º para o 2º turno
  padroes  último dígito, 2º dígito de Benford, percentuais inteiros, boletins idênticos no mesmo
           município e a "impressão digital" comparecimento × votos

Modelo dos raros: cada seção é comparada com as outras seções do mesmo local de votação, sem ela
mesma (sem vizinhas suficientes, com a zona; depois, com o município). Seções vizinhas variam mais do
que um sorteio puro (rua, idade, renda), e essa variação natural é medida nos próprios dados: a
escala pela seção mediana e o peso da cauda (t de Student) pelo ponto de 1 em 1.000. A "chance" de
uma seção é, portanto, comparada com o quanto seções parecidas costumam destoar das vizinhas.

Cada nível de comparação é calibrado à parte. Dentro da mesma escola a comparação é justa; seção
sozinha no local (aldeia, presídio, quartel) é comparada com a zona e só concorre com outras nessa
situação. Com ~500 mil seções testadas, uma chance de 1 em 100 mil aparece ~5 vezes só por acaso;
por isso cada teste traz a curva "observadas × esperadas pelo acaso".

Uso:  python -I analisar_boletins.py --turno 1|2 [--pasta PASTA]
"""
import argparse
import json
import math
import os
import random
import sys
import time
from array import array

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PASTA = os.path.join(RAIZ, '.cache', 'eleicoes-metricas')
MEDIANA_QUI2_1 = 0.454936423119572
FAIXAS_VARIANCIA = 20
MINORIA_DISCRETA = 10  # votos esperados para a minoria abaixo disso: teto binomial na raridade
CALIBRA_CAUDA = 1e-3  # a cauda da referência é ajustada para acertar este ponto nos próprios dados
LIMITES = [10.0 ** -k for k in range(2, 13)]
TOPO = 300
MIN_N = 20  # seção menor que isso não entra nos testes de raridade
MIN_VIZINHAS = 50  # votos mínimos nas vizinhas para usar aquele nível como referência
MIN_N_PADRAO = 100  # percentuais inteiros e repetidos: seções pequenas repetem por aritmética
REPETICOES = 8  # sorteios usados nas comparações com o acaso
NIVEIS = ['local', 'zona', 'municipio']
BENFORD_2 = [sum(math.log10(1 + 1 / (10 * k + d)) for k in range(1, 10)) for d in range(10)]


def carregar(pasta: str):
    with open(os.path.join(pasta, 'meta.json'), encoding='utf-8') as f:
        meta = json.load(f)
    with open(os.path.join(pasta, 'secoes.bin'), 'rb') as f:
        bruto = f.read()
    total = meta['secoes']
    cols = {}
    for c in meta['colunas']:
        a = array({'i32': 'i', 'u16': 'H', 'u8': 'B'}[c['tipo']])
        a.frombytes(bruto[c['deslocamento']: c['deslocamento'] + a.itemsize * total])
        if sys.byteorder != 'little':
            a.byteswap()
        cols[c['nome']] = a
    return meta, cols


# ---------------------------------------------------------------- distribuições

def log10_normal(z: float) -> float:
    """log10 da chance bilateral |Z| >= |z| na normal padrão."""
    y = abs(z) / math.sqrt(2)
    if y < 25:
        return math.log10(max(1e-320, math.erfc(y)))
    return (-y * y - math.log(y * math.sqrt(math.pi))) / math.log(10)


def log10_binomial(k: int, n: int, p: float) -> float:
    """log10 da chance bilateral de um sorteio Bin(n, p) cair tão longe da média quanto k."""
    acima = k > n * p
    lp = math.lgamma(n + 1) - math.lgamma(k + 1) - math.lgamma(n - k + 1) + k * math.log(p) + (n - k) * math.log1p(-p)
    soma = termo = 1.0
    j = k
    while (j < n) if acima else (j > 0):
        termo *= (n - j) / (j + 1) * p / (1 - p) if acima else j / (n - j + 1) * (1 - p) / p
        j += 1 if acima else -1
        soma += termo
        if termo < soma * 1e-16:
            break
    return min(0.0, math.log10(2) + (lp + math.log(soma)) / math.log(10))


def _beta_fc(x: float, a: float, b: float) -> float:
    """Fração contínua da beta incompleta (Lentz)."""
    minimo = 1e-300
    c, d = 1.0, 1 - (a + b) * x / (a + 1)
    d = 1 / (d if abs(d) > minimo else minimo)
    h = d
    for m in range(1, 300):
        m2 = 2 * m
        for an in (m * (b - m) * x / ((a + m2 - 1) * (a + m2)), -(a + m) * (a + b + m) * x / ((a + m2) * (a + m2 + 1))):
            d = 1 + an * d
            d = 1 / (d if abs(d) > minimo else minimo)
            c = 1 + an / c
            c = c if abs(c) > minimo else minimo
            h *= d * c
        if abs(d * c - 1) < 1e-14:
            break
    return h


def log10_t(t: float, gl: float) -> float:
    """log10 da chance bilateral |T| >= |t| na t de Student (gl infinito: normal)."""
    if math.isinf(gl):
        return log10_normal(t)
    x = gl / (gl + t * t)  # chance bilateral = I_x(gl/2, 1/2)
    a, b = gl / 2, 0.5
    if x >= 1:
        return 0.0
    log_frente = math.lgamma(a + b) - math.lgamma(a) - math.lgamma(b) + a * math.log(x) + b * math.log1p(-x)
    if x < (a + 1) / (a + b + 2):
        ln = log_frente + math.log(_beta_fc(x, a, b)) - math.log(a)
    else:
        ln = math.log1p(-min(1.0, math.exp(log_frente + math.log(_beta_fc(1 - x, b, a)) - math.log(b))))
    return min(0.0, ln / math.log(10))


def quantil_t(alfa: float, gl: float) -> float:
    """|t| cuja chance bilateral é alfa."""
    lo, hi, alvo = 0.0, 1e6, math.log10(alfa)
    for _ in range(200):
        meio = (lo + hi) / 2
        lo, hi = (meio, hi) if log10_t(meio, gl) > alvo else (lo, meio)
        if hi - lo < 1e-9 * max(1.0, meio):
            break
    return (lo + hi) / 2


def ajustar_cauda(zs):
    """Escala e graus de liberdade da t de Student que reproduzem, nos próprios dados, a mediana de |z|
    e o ponto de 1 em 1.000. Abaixo disso a curva observadas × esperadas mostra o que sobra."""
    a = sorted(abs(z) for z in zs)
    mediana = a[len(a) // 2]
    milesimo = a[min(len(a) - 1, int(len(a) * (1 - CALIBRA_CAUDA)))]
    if mediana <= 0:
        return math.inf, 1.0
    razao = milesimo / mediana

    def razao_t(gl):
        return quantil_t(CALIBRA_CAUDA, gl) / quantil_t(0.5, gl)

    if razao <= razao_t(math.inf):
        return math.inf, quantil_t(0.5, math.inf) / mediana
    lo, hi = 1.0, 2000.0  # a razão diminui com os graus de liberdade
    for _ in range(60):
        meio = math.sqrt(lo * hi)
        lo, hi = (meio, hi) if razao_t(meio) > razao else (lo, meio)
    gl = math.sqrt(lo * hi)
    return gl, quantil_t(0.5, gl) / mediana


def qui2_cauda(x: float, gl: int) -> float:
    """P(X > x) para qui-quadrado com gl graus de liberdade (gama incompleta regularizada)."""
    a, x = gl / 2, x / 2
    if x <= 0:
        return 1.0
    ln = -x + a * math.log(x) - math.lgamma(a)
    if x < a + 1:  # série
        termo = soma = 1 / a
        ap = a
        for _ in range(500):
            ap += 1
            termo *= x / ap
            soma += termo
            if abs(termo) < abs(soma) * 1e-15:
                break
        return max(0.0, 1 - soma * math.exp(ln))
    b, c, d = x + 1 - a, 1e300, 1 / (x + 1 - a)  # fração contínua
    h = d
    for i in range(1, 500):
        an = -i * (i - a)
        b += 2
        d = an * d + b
        d = 1e-300 if abs(d) < 1e-300 else d
        c = b + an / c
        c = 1e-300 if abs(c) < 1e-300 else c
        d = 1 / d
        h *= d * c
        if abs(d * c - 1) < 1e-15:
            break
    return math.exp(ln) * h


def binom_pmf(j: int, n: int, p: float) -> float:
    if p <= 0:
        return 1.0 if j == 0 else 0.0
    if p >= 1:
        return 1.0 if j == n else 0.0
    return math.exp(math.lgamma(n + 1) - math.lgamma(j + 1) - math.lgamma(n - j + 1) + j * math.log(p) + (n - j) * math.log1p(-p))


# ---------------------------------------------------------------- seções improváveis

def chaves_vizinhanca(cols, i):
    m, z = cols['mun'][i], cols['zona'][i]
    return ((m * 4096 + z) * 65536 + cols['local'][i], m * 4096 + z, m)


def referencia_vizinhas(cols, k, n, elegiveis):
    """Proporção k/n das outras seções do mesmo local (ou zona, ou município), sem a própria."""
    somas = [{}, {}, {}]
    chaves = {}
    for i in elegiveis:
        ch = chaves[i] = chaves_vizinhanca(cols, i)
        for nivel, g in enumerate(ch):
            t = somas[nivel].get(g)
            if t is None:
                somas[nivel][g] = [k[i], n[i], 1]
            else:
                t[0] += k[i]
                t[1] += n[i]
                t[2] += 1
    ref = {}
    for i in elegiveis:
        for nivel, g in enumerate(chaves[i]):
            sk, sn, sc = somas[nivel][g]
            nv = sn - n[i]
            if nv >= MIN_VIZINHAS:
                ref[i] = ((sk - k[i] + 0.5) / (nv + 1), nv, nv / (sc - 1), nivel)
                break
    return ref


def ajustar_variancia(termos):
    """V = alfa·A + beta·B medido nos próprios dados: as seções são divididas em faixas de B/A e, em
    cada faixa, a variância robusta (mediana de d² / mediana da qui-quadrado(1)) dá um ponto; alfa e
    beta (não negativos) saem de mínimos quadrados relativos sobre esses pontos."""
    ordem = sorted(range(len(termos)), key=lambda i: termos[i][2] / termos[i][1])
    a2 = ab = b2 = sa = sb = 0.0
    for f in range(FAIXAS_VARIANCIA):
        fatia = ordem[f * len(ordem) // FAIXAS_VARIANCIA:(f + 1) * len(ordem) // FAIXAS_VARIANCIA]
        d2 = sorted(termos[i][0] ** 2 for i in fatia)
        r = max(1e-12, d2[len(d2) // 2] / MEDIANA_QUI2_1)
        a = sum(termos[i][1] for i in fatia) / len(fatia) / r
        b = sum(termos[i][2] for i in fatia) / len(fatia) / r
        a2, ab, b2, sa, sb = a2 + a * a, ab + a * b, b2 + b * b, sa + a, sb + b
    det = a2 * b2 - ab * ab
    alfa, beta = ((sa * b2 - sb * ab) / det, (sb * a2 - sa * ab) / det) if det > 0 else (-1, -1)
    if beta < 0 or det <= 0:
        alfa, beta = sa / a2, 0.0
    if alfa < 0:
        alfa, beta = 0.0, sb / b2
    return alfa, beta


def teste_raridade(nome, casos, forma='beta-binomial'):
    """casos: [(i, k, n, p, nv, m, nivel, extra, dados_extras)]: k de n na seção, p esperado pelas nv
    vizinhas (seções de m votos em média); extra soma à variância de sorteio uma incerteza conhecida
    da própria previsão. Cada nível de vizinhança é calibrado à parte: seção sozinha no local
    só concorre com outras na mesma situação.

    forma: como a variação cresce além do sorteio. 'beta-binomial': seções vizinhas com perfis
    diferentes (cresce com n²). 'logito': previsão feita em log-chances (virada), cuja incerteza
    cresce com (n·p·q)², o que segura a falsa raridade de seções perto de 0% ou 100%."""
    limite_calculo = 2e-2  # chance acima disso não entra em nenhuma curva nem lista

    def curva(lista):
        return [{'limite': t, 'observadas': sum(1 for r in lista if r[0] <= math.log10(t)), 'esperadas': round(len(lista) * t, 6)}
                for t in LIMITES]

    todos, por_nivel = [], {}
    for nivel, rotulo in enumerate(NIVEIS):
        grupo = [c for c in casos if c[6] == nivel]
        if len(grupo) < 1000:
            por_nivel[rotulo] = {'testadas': len(grupo), 'excesso': [], 'secoes': []}
            continue
        termos = []
        for i, k, n, p, nv, m, _, extra, _ in grupo:
            pq = p * (1 - p)
            a = n * pq + n * n * pq / nv + extra
            b = (n * pq) ** 2 if forma == 'logito' else n * pq * (n - 1) + n * n * pq * (m - 1) / nv
            termos.append((k - n * p, a, b))
        alfa, beta = ajustar_variancia(termos)
        zs = [d / math.sqrt(alfa * a + beta * b) for d, a, b in termos]
        gl, escala = ajustar_cauda(zs)
        minimo = quantil_t(limite_calculo, gl)
        lista = []
        for (i, k, n, p, nv, m, _, _, dados), z in zip(grupo, zs):
            t = abs(z) * escala
            l10p = log10_t(t, gl) if t > minimo else 0.0
            # poucos votos esperados para a minoria (seção perto de 0% ou 100%): a aproximação
            # contínua exagera; a chance nunca fica menor que a de um sorteio binomial puro
            if l10p < 0 and n * min(p, 1 - p) < MINORIA_DISCRETA:
                l10p = max(l10p, log10_binomial(k, n, p))
            lista.append((l10p, -abs(z), i, k, n, p, z * escala, nv, dados))
        lista.sort()
        secoes = []
        for posicao, (l10p, _, i, k, n, p, z, nv, dados) in enumerate(lista[:TOPO], 1):
            item = {'i': i, 'k': k, 'n': n, 'p': round(p, 5), 'z': round(z, 2), 'l10p': round(l10p, 2),
                    'vizinhas': nv, 'posicao': posicao}
            item.update(dados)
            secoes.append(item)
        por_nivel[rotulo] = {'testadas': len(lista), 'alfa': alfa, 'beta': beta, 'gl': None if math.isinf(gl) else round(gl, 2),
                             'excesso': curva(lista), 'secoes': secoes}
        todos.extend(lista)
        e = por_nivel[rotulo]['excesso']
        print(f'  {nome} / {rotulo}: {len(lista):,} seções, alfa={alfa:.3f}, beta={beta:.5f}, gl={gl:.1f}; '
              f'1e-3: {e[1]["observadas"]} (acaso {e[1]["esperadas"]:.1f}), 1e-6: {e[4]["observadas"]} '
              f'(acaso {e[4]["esperadas"]:.2f})', flush=True)
    return {'testadas': len(todos), 'forma': forma, 'calibracao': CALIBRA_CAUDA, 'excesso': curva(todos), 'niveis': por_nivel}


def logito(p: float) -> float:
    return math.log(p / (1 - p))


def raros_votos(cols, c0, c1):
    total = len(c0)
    n = [c0[i] + c1[i] for i in range(total)]
    elegiveis = [i for i in range(total) if n[i] >= MIN_N]
    ref = referencia_vizinhas(cols, c0, n, elegiveis)
    return teste_raridade('votos', [(i, c0[i], n[i], *ref[i], 0.0, {}) for i in elegiveis if i in ref])


def raros_comparecimento(cols):
    total = len(cols['comp'])
    aptos, comp = cols['aptos'], cols['comp']
    elegiveis = [i for i in range(total) if aptos[i] >= MIN_N]
    ref = referencia_vizinhas(cols, comp, aptos, elegiveis)
    return teste_raridade('comparecimento', [(i, comp[i], aptos[i], *ref[i], 0.0, {}) for i in elegiveis if i in ref])


def raros_virada(meta2, cols2, meta1, cols1):
    """2º turno da seção previsto pelo 1º turno dela + a mudança média das vizinhas."""
    num1 = {c['numero']: c['coluna'] for c in meta1['candidatos']}
    a_num, b_num = meta2['candidatos'][0]['numero'], meta2['candidatos'][1]['numero']
    if a_num not in num1 or b_num not in num1:
        return None
    a1, b1 = cols1[num1[a_num]], cols1[num1[b_num]]
    a2, b2 = cols2['c0'], cols2['c1']
    mun1 = {(m['uf'], m['cd']): i for i, m in enumerate(meta1['municipios'])}
    traduz = [mun1.get((m['uf'], m['cd'])) for m in meta2['municipios']]
    pos1 = {(cols1['mun'][j], cols1['zona'][j], cols1['secao'][j]): j for j in range(len(a1))}
    pares = {}
    for i in range(len(a2)):
        m1 = traduz[cols2['mun'][i]]
        j = pos1.get((m1, cols2['zona'][i], cols2['secao'][i])) if m1 is not None else None
        if j is not None and a1[j] + b1[j] >= MIN_N and a2[i] + b2[i] >= MIN_N:
            pares[i] = j
    # somas por vizinhança só com seções presentes nos dois turnos
    somas = [{}, {}, {}]
    for i, j in pares.items():
        for nivel, g in enumerate(chaves_vizinhanca(cols2, i)):
            t = somas[nivel].setdefault(g, [0, 0, 0, 0, 0])
            t[0] += a1[j]
            t[1] += a1[j] + b1[j]
            t[2] += a2[i]
            t[3] += a2[i] + b2[i]
            t[4] += 1
    casos = []
    for i, j in pares.items():
        n1, n2 = a1[j] + b1[j], a2[i] + b2[i]
        for nivel, g in enumerate(chaves_vizinhanca(cols2, i)):
            s1k, s1n, s2k, s2n, sc = somas[nivel][g]
            v1, v2 = s1n - n1, s2n - n2
            if v1 >= MIN_VIZINHAS and v2 >= MIN_VIZINHAS:
                # a mudança das vizinhas é aplicada em log-chances: +5 pontos a 50% não é o mesmo que a 95%
                mudanca = logito((s2k - a2[i] + 0.5) / (v2 + 1)) - logito((s1k - a1[j] + 0.5) / (v1 + 1))
                p1 = (a1[j] + 0.5) / (n1 + 1)
                p = min(0.9999, max(0.0001, 1 / (1 + math.exp(-(logito(p1) + mudanca)))))
                # incerteza do 1º turno da própria seção, em log-chances: decisiva perto de 0% ou 100%
                # (281 de 281 no 1º turno não quer dizer que o adversário não tinha nenhum eleitor ali)
                extra = (n2 * p * (1 - p)) ** 2 / (n1 * p1 * (1 - p1))
                casos.append((i, a2[i], n2, p, v2, v2 / (sc - 1), nivel, extra, {'j': j, 'k1': a1[j], 'n1': n1}))
                break
    return teste_raridade('virada', casos, forma='logito')


# ---------------------------------------------------------------- padrões que se repetem

def teste_digitos(valores, totais, minimo, posicao, referencia, sorteio):
    """Frequência de um dígito (último: posicao -1; segundo: 1) nos votos por seção.

    O esperado vem dos mesmos dados sorteados de novo, Bin(comparecimento, votos/comparecimento):
    preserva o tamanho das seções e o perfil de cada uma, e só desfaz preferência por dígito. A
    referência teórica (uniforme ou Benford) vai junto para o gráfico, mas não serve de teste: seções
    têm no máximo ~500 eleitores, e contagens limitadas não seguem Benford mesmo sem nada errado."""
    def digito(v):
        return int(str(v)[posicao])

    idx = [i for i in range(len(valores)) if valores[i] >= minimo and totais[i] > 0]
    cont = [0] * 10
    for i in idx:
        cont[digito(valores[i])] += 1
    sim, sim_total = [0] * 10, 0
    for _ in range(REPETICOES):
        for i in idx:
            v = sorteio.binomialvariate(totais[i], min(1.0, valores[i] / totais[i]))
            if v >= minimo:
                sim[digito(v)] += 1
                sim_total += 1
    total = sum(cont)
    if not total or not sim_total:
        return None
    esperado = [x / sim_total for x in sim]
    # o esperado também é estimado: a variância da diferença soma as duas partes
    qui2 = sum((o - total * e) ** 2 / (total * e) for o, e in zip(cont, esperado) if e > 0) / (1 + total / sim_total)
    return {'minimo': minimo, 'total': total, 'contagem': cont, 'esperado': [round(e, 6) for e in esperado],
            'referencia': [round(e, 6) for e in referencia], 'qui2': round(qui2, 2), 'p': qui2_cauda(qui2, 9)}


def chance_percentual_inteiro(k, n):
    """Chance de um sorteio Bin(n, k/n) cair num percentual inteiro (100·j/n inteiro)."""
    passo = n // math.gcd(n, 100)
    if passo == 1:
        return 1.0
    p = k / n
    if p <= 0 or p >= 1:
        return 1.0
    dp = math.sqrt(n * p * (1 - p))
    ini = max(0, math.ceil((n * p - 9 * dp - 1) / passo)) * passo
    fim = min(n, n * p + 9 * dp + 1)
    soma, j = 0.0, ini
    while j <= fim:
        soma += binom_pmf(j, n, p)
        j += passo
    return min(1.0, soma)


def padrao_proporcao(k, n, sorteio, rotulo):
    """Histograma em 0,1% e percentuais inteiros, comparados com o mesmo dado sorteado de novo."""
    idx = [i for i in range(len(k)) if n[i] >= MIN_N_PADRAO]
    obs = [0] * 1000
    inteiros, esperado, var, empates, empates_esp = 0, 0.0, 0.0, 0, 0.0
    for i in idx:
        ki, ni = k[i], n[i]
        obs[min(999, ki * 1000 // ni)] += 1
        if (100 * ki) % ni == 0:
            inteiros += 1
        c = chance_percentual_inteiro(ki, ni)
        esperado += c
        var += c * (1 - c)
        if ni % 2 == 0:
            empates += 2 * ki == ni
            empates_esp += binom_pmf(ni // 2, ni, ki / ni)
    sim = [0.0] * 1000
    for _ in range(REPETICOES):
        for i in idx:
            ni = n[i]
            sim[min(999, sorteio.binomialvariate(ni, min(1.0, k[i] / ni)) * 1000 // ni)] += 1
    print(f'  {rotulo}: percentuais inteiros {inteiros:,} (acaso: {esperado:,.0f} ± {math.sqrt(var):,.0f})', flush=True)
    return {
        'secoes': len(idx),
        'histograma': obs,
        'histogramaAcaso': [round(s / REPETICOES, 1) for s in sim],
        'inteiros': {'observados': inteiros, 'esperados': round(esperado, 1), 'desvio': round(math.sqrt(var), 2)},
        'empates': {'observados': empates, 'esperados': round(empates_esp, 1)},
    }


def boletins_identicos(meta, cols):
    """Seções do mesmo município com a votação de Presidente inteira igual (todos os candidatos,
    brancos e nulos). Não há sorteio justo para comparar: o acaso aqui depende do formato fino da
    distribuição, que é justamente o que se quer olhar. A lista serve para conferir caso a caso."""
    candidatos = [cols[c['coluna']] for c in meta['candidatos']]
    mun, br, nu = cols['mun'], cols['br'], cols['nu']
    grupos = {}
    secoes = 0
    for i in range(len(mun)):
        votos = tuple(c[i] for c in candidatos)
        if sum(votos) >= MIN_N_PADRAO:
            secoes += 1
            grupos.setdefault((mun[i], br[i], nu[i]) + votos, []).append(i)
    repetidos = [g for g in grupos.values() if len(g) > 1]
    repetidos.sort(key=lambda g: (-len(g), -(cols['comp'][g[0]])))
    total = sum(len(g) for g in repetidos)
    print(f'  boletins idênticos: {len(repetidos):,} grupos, {total:,} seções', flush=True)
    return {'secoes': secoes, 'grupos': len(repetidos), 'secoesRepetidas': total, 'lista': repetidos[:200]}


def impressao_digital(cols, coluna):
    """Contagem de seções por (comparecimento %, votos do candidato / comparecimento %)."""
    aptos, comp, votos = cols['aptos'], cols['comp'], cols[coluna]
    celulas = {}
    for i in range(len(aptos)):
        if aptos[i] >= MIN_N and comp[i] > 0:
            x = min(99, comp[i] * 100 // aptos[i])
            y = min(99, votos[i] * 100 // comp[i])
            celulas[x * 100 + y] = celulas.get(x * 100 + y, 0) + 1
    return [[c // 100, c % 100, v] for c, v in sorted(celulas.items())]


# ---------------------------------------------------------------- mapa do Modo TV

def gravar_mapa_municipal(meta, cols, pasta: str):
    """O resumo por município que o Modo TV lê em mapa-dados/ (mesmo formato do coletor-mapa.py do
    servidor), calculado dos boletins deste PC: a TV local não precisa buscar nada lá fora."""
    with open(os.path.join(RAIZ, 'eleicoes', 'public', 'municipios-tse.json'), encoding='utf-8') as f:
        ibge_do_tse = {tse: ibge for ibge, tse in json.load(f).items()}
    candidatos = meta['candidatos']
    votos = [cols[c['coluna']] for c in candidatos]
    somas = {}
    for i in range(meta['secoes']):
        s = somas.setdefault(cols['mun'][i], [0] * len(candidatos))
        for k, v in enumerate(votos):
            s[k] += v[i]
    m = {}
    for mun, s in somas.items():
        ibge = ibge_do_tse.get(meta['municipios'][mun]['cd'].zfill(5))
        validos = sum(s)
        if not ibge or not validos:
            continue
        ordem = sorted(range(len(s)), key=lambda k: -s[k])
        a, b = ordem[0], ordem[1] if len(ordem) > 1 else ordem[0]
        m[ibge] = [candidatos[a]['partido'], candidatos[a]['numero'], round(s[a] * 100 / validos, 2), 100.0, s[a],
                   candidatos[b]['numero'], round(s[b] * 100 / validos, 2), s[b], candidatos[b]['partido']]
    os.makedirs(pasta, exist_ok=True)
    nomes = [f'mapa-presidente-t{meta["turno"]}.json'] + (['mapa-presidente.json'] if meta['turno'] == 1 else [])
    for nome in nomes:
        with open(os.path.join(pasta, nome), 'w', encoding='utf-8') as f:
            json.dump({'cargo': 'presidente', 'turno': meta['turno'], 'atualizado': meta['geradoEm'], 'm': m}, f,
                      ensure_ascii=False, separators=(',', ':'))
    print(f'  mapa do Modo TV: {len(m):,} municípios em {pasta}', flush=True)


# ---------------------------------------------------------------- principal

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--turno', type=int, choices=[1, 2], required=True)
    ap.add_argument('--pasta', default=PASTA)
    args = ap.parse_args()
    inicio = time.time()
    meta, cols = carregar(os.path.join(args.pasta, f't{args.turno}'))
    c0, c1 = cols['c0'], cols['c1']
    sorteio = random.Random(20261025 + args.turno)
    print(f't{args.turno}: {meta["secoes"]:,} seções, brancos {sum(cols["br"]):,}, nulos {sum(cols["nu"]):,}, '
          f'comparecimento {sum(cols["comp"]):,}', flush=True)

    raros = {'votos': raros_votos(cols, c0, c1), 'comparecimento': raros_comparecimento(cols)}
    pasta1 = os.path.join(args.pasta, 't1')
    if args.turno == 2 and os.path.exists(os.path.join(pasta1, 'secoes.bin')):
        meta1, cols1 = carregar(pasta1)
        virada = raros_virada(meta, cols, meta1, cols1)
        if virada:
            raros['virada'] = virada

    padroes = {
        'ultimoDigito': {c: teste_digitos(cols[c], cols['comp'], 50, -1, [0.1] * 10, sorteio) for c in ('c0', 'c1')},
        'segundoDigito': {c: teste_digitos(cols[c], cols['comp'], 10, 1, BENFORD_2, sorteio) for c in ('c0', 'c1')},
        'proporcao': padrao_proporcao(c0, [c0[i] + c1[i] for i in range(len(c0))], sorteio, 'votos'),
        'comparecimento': padrao_proporcao(cols['comp'], cols['aptos'], sorteio, 'comparecimento'),
        'identicos': boletins_identicos(meta, cols),
        'impressaoDigital': {c: impressao_digital(cols, c) for c in ('c0', 'c1')},
    }
    saida = {'turno': args.turno, 'geradoEm': meta['geradoEm'], 'minimoSecao': MIN_N, 'minimoPadrao': MIN_N_PADRAO,
             'raros': raros, 'padroes': padroes}
    destino = os.path.join(args.pasta, f't{args.turno}', 'analise.json')
    with open(destino + '.tmp', 'w', encoding='utf-8') as f:
        json.dump(saida, f, ensure_ascii=False, separators=(',', ':'))
    os.replace(destino + '.tmp', destino)
    print(f'{destino}: {os.path.getsize(destino) / 1e3:,.0f} kB ({time.time() - inicio:.0f} s)')
    gravar_mapa_municipal(meta, cols, os.path.join(args.pasta, 'mapa-dados'))


if __name__ == '__main__':
    main()
