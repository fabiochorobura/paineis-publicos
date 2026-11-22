"""
Leitor dos logs das urnas (1º turno de 2026), rodando como uma thread do coletor.

O TSE publica, por seção, um índice (…-aux.json) e o log da urna (…-log.jez, um ZIP com
logd.dat). As ~500 mil seções somam ~50 GB: em vez de baixar tudo de uma vez (o TSE devolve
429), lê as seções numa ordem embaralhada (todas as UFs misturadas desde o início), num ritmo
baixo, e vai acumulando as métricas. A posição e as métricas ficam gravadas em disco: um
reinício continua de onde parou.

Saída: SAIDA/logs.json (servido em /mapa-dados/logs.json).
"""
import io
import json
import os
import random
import threading
import time
import urllib.error
import urllib.request
import zipfile
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

BASE = 'https://resultados.tse.jus.br/oficial/ele2026/arquivo-urna/3220'
DIA = '04/10/2026'
UFS = ['ac', 'al', 'am', 'ap', 'ba', 'ce', 'df', 'es', 'go', 'ma', 'mg', 'ms', 'mt', 'pa', 'pb', 'pe', 'pi', 'pr', 'rj',
       'rn', 'ro', 'rr', 'rs', 'sc', 'se', 'sp', 'to']
PEDIDOS_POR_SEGUNDO = float(os.environ.get('LOGS_PEDIDOS_POR_SEGUNDO', '6'))
PAUSA_429_S = 600
GRAVA_A_CADA_S = 30
TRABALHADORES = 4
LOTE = 40
TEMPO_MAX_S = 900  # votos acima de 15 min (urna parada, eleitor saiu) não entram na mediana


def log(*a):
    print(datetime.now().strftime('%H:%M:%S'), '[logs]', *a, flush=True)


class Ritmo:
    def __init__(self, por_segundo: float):
        self.intervalo = 1 / por_segundo
        self.proximo = 0.0
        self.pausado_ate = 0.0
        self.trava = threading.Lock()

    def esperar(self):
        while time.time() < self.pausado_ate:
            time.sleep(5)
        with self.trava:
            agora = time.time()
            vez = max(agora, self.proximo)
            self.proximo = vez + self.intervalo
        time.sleep(max(0.0, vez - agora))

    def pausar(self):
        log(f'TSE respondeu 429: pausa de {PAUSA_429_S // 60} min')
        self.pausado_ate = time.time() + PAUSA_429_S


def baixar(url: str, ritmo: Ritmo) -> bytes | None:
    """Corpo da resposta; None se não existe (404). Repete depois da pausa se levar 429."""
    while True:
        ritmo.esperar()
        req = urllib.request.Request(url, headers={'User-Agent': 'chorobura-apuracao/1.0', 'Accept-Encoding': 'gzip'})
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                corpo = r.read()
                if r.headers.get('Content-Encoding') == 'gzip':
                    import gzip
                    corpo = gzip.decompress(corpo)
                return corpo
        except urllib.error.HTTPError as e:
            if e.code in (403, 404):
                return None
            if e.code == 429:
                ritmo.pausar()
                continue
            raise


def hora_seg(ts: str) -> int:
    """'04/10/2026 09:13:32' -> segundos do dia"""
    h, m, s = ts[11:19].split(':')
    return int(h) * 3600 + int(m) * 60 + int(s)


def novo_agregado():
    return {'secoes': 0, 'eleitores': 0, 'habilitados': 0, 'biometria': 0, 'teclas': 0, 'reiniciadas': 0,
            'hist': [0] * (TEMPO_MAX_S + 1), 'porHora': [0] * 24}


def analisar(texto: str, ag: dict, ag_uf: dict):
    """Soma as métricas de um log de seção nos agregados (Brasil e UF)."""
    habilitado_em = None
    primeiro_voto = False
    reiniciou = False
    for linha in texto.splitlines():
        c = linha.split('\t')
        if len(c) < 5 or not c[0].startswith(DIA):
            continue
        msg = c[4]
        if msg == 'Eleitor foi habilitado':
            habilitado_em = hora_seg(c[0])
            for a in (ag, ag_uf):
                a['habilitados'] += 1
        elif msg.startswith('Tipo de habilita') and 'biom' in msg:
            for a in (ag, ag_uf):
                a['biometria'] += 1
        elif msg == 'Tecla indevida pressionada':
            for a in (ag, ag_uf):
                a['teclas'] += 1
        elif msg == 'O voto do eleitor foi computado':
            seg = hora_seg(c[0])
            primeiro_voto = True
            for a in (ag, ag_uf):
                a['eleitores'] += 1
                a['porHora'][seg // 3600] += 1
            if habilitado_em is not None:
                dur = seg - habilitado_em
                if 0 <= dur <= TEMPO_MAX_S:
                    for a in (ag, ag_uf):
                        a['hist'][dur] += 1
            habilitado_em = None
        elif c[3] == 'VOTA' and msg.startswith('Iniciando aplica') and primeiro_voto:
            reiniciou = True
    for a in (ag, ag_uf):
        a['secoes'] += 1
        a['reiniciadas'] += int(reiniciou)


def mediana(hist: list[int]) -> float | None:
    total = sum(hist)
    if not total:
        return None
    meio, acc = (total + 1) / 2, 0
    for seg, n in enumerate(hist):
        acc += n
        if acc >= meio:
            return seg
    return None


def resumo(ag: dict) -> dict:
    return {
        'secoes': ag['secoes'],
        'eleitores': ag['eleitores'],
        'tempoMediano': mediana(ag['hist']),
        'pctBiometria': round(ag['biometria'] * 100 / ag['habilitados'], 1) if ag['habilitados'] else None,
        'teclasPorEleitor': round(ag['teclas'] / ag['eleitores'], 2) if ag['eleitores'] else None,
        'teclas': ag['teclas'],
        'reiniciadas': ag['reiniciadas'],
    }


class LeitorLogs(threading.Thread):
    def __init__(self, saida: str):
        super().__init__(daemon=True)
        self.saida = saida
        self.estado_arq = os.path.join(saida, '.logs-estado.json')
        self.ritmo = Ritmo(PEDIDOS_POR_SEGUNDO)

    def secoes(self) -> list[tuple[str, str, str, str]]:
        lista = []
        for uf in UFS:
            corpo = baixar(f'{BASE}/config/{uf}/{uf}-p003220-cs.json', self.ritmo)
            if not corpo:
                continue
            j = json.loads(corpo)
            for abr in j.get('abr') or []:
                for m in abr.get('mu') or []:
                    for z in m.get('zon') or []:
                        for s in z.get('sec') or []:
                            lista.append((uf, m['cd'], z['cd'], s['ns']))
        lista.sort()
        random.Random(20261004).shuffle(lista)  # ordem fixa: o reinício continua do mesmo ponto
        return lista

    def carregar_estado(self):
        try:
            with open(self.estado_arq, encoding='utf-8') as f:
                e = json.load(f)
            return e['posicao'], e['brasil'], e['porUF']
        except (OSError, ValueError, KeyError):
            return 0, novo_agregado(), {}

    def gravar(self, posicao: int, total: int, brasil: dict, por_uf: dict):
        tmp = self.estado_arq + '.tmp'
        with open(tmp, 'w', encoding='utf-8') as f:
            json.dump({'posicao': posicao, 'brasil': brasil, 'porUF': por_uf}, f)
        os.replace(tmp, self.estado_arq)
        publico = {
            'atualizado': datetime.now(timezone.utc).isoformat(),
            'secoesLidas': brasil['secoes'],
            'secoesTotal': total,
            'brasil': resumo(brasil),
            'votosPorHora': brasil['porHora'],
            'porUF': {uf: resumo(a) for uf, a in sorted(por_uf.items())},
        }
        tmp = os.path.join(self.saida, '.logs.json')
        with open(tmp, 'w', encoding='utf-8') as f:
            json.dump(publico, f, separators=(',', ':'))
        os.chmod(tmp, 0o644)
        os.replace(tmp, os.path.join(self.saida, 'logs.json'))

    def baixar_log(self, secao: tuple[str, str, str, str]) -> str | None:
        """Texto do log da seção (None se não publicado ou com erro)."""
        uf, mu, zo, se = secao
        try:
            return self._baixar_log(uf, mu, zo, se)
        except Exception as ex:  # log corrompido, rede: segue para a próxima
            log(f'{uf}-{mu}-{zo}-{se}: {ex}')
            return None

    def _baixar_log(self, uf: str, mu: str, zo: str, se: str) -> str | None:
        pasta = f'{BASE}/dados/{uf}/{mu}/{zo}/{se}'
        aux = baixar(f'{pasta}/p003220-{uf}-m{mu}-z{zo}-s{se}-aux.json', self.ritmo)
        if not aux:
            return None
        hashes = json.loads(aux).get('hashes') or []
        # a versão totalizada da seção (a última, se houver mais de uma)
        validos = [h for h in hashes if str(h.get('st', '')).lower().startswith('totaliz')] or hashes
        if not validos:
            return None
        h = validos[-1]
        nome = next((a['nm'] for a in h.get('arq') or [] if a.get('tp') == 'log'), None)
        if not nome:
            return None
        jez = baixar(f"{pasta}/{h['hash']}/{nome}", self.ritmo)
        if not jez:
            return None
        z = zipfile.ZipFile(io.BytesIO(jez))
        return z.read(z.namelist()[0]).decode('latin-1')

    def run(self):
        try:
            lista = self.secoes()
        except Exception as ex:
            log(f'falhou ao listar as seções: {ex}')
            return
        posicao, brasil, por_uf = self.carregar_estado()
        log(f'{len(lista)} seções no total; continuando da posição {posicao}')
        ultimo = time.time()
        # downloads em paralelo (o ritmo continua limitado pelo Ritmo); a soma é feita aqui, em ordem
        with ThreadPoolExecutor(TRABALHADORES) as pool:
            while posicao < len(lista):
                lote = lista[posicao : posicao + LOTE]
                for secao, texto in zip(lote, pool.map(self.baixar_log, lote)):
                    if texto:
                        analisar(texto, brasil, por_uf.setdefault(secao[0], novo_agregado()))
                posicao += len(lote)
                if time.time() - ultimo >= GRAVA_A_CADA_S:
                    self.gravar(posicao, len(lista), brasil, por_uf)
                    ultimo = time.time()
        self.gravar(posicao, len(lista), brasil, por_uf)
        log('todas as seções lidas')
