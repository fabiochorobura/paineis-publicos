#!/usr/bin/env python3
"""
Coletor dos mapas presidenciais por município do Modo TV.

O TSE publica um arquivo por município e cargo (~5.570 por cargo). Baixar isso em cada TV
seria inviável, então este processo roda no servidor: busca tudo uma vez por rodada
(com gzip e ETag, o que não mudou volta 304 sem corpo), resume quem lidera em cada
município e grava um JSON pequeno por cargo em SAIDA, servido pelo nginx em /mapa-dados/.

Formato de saída (mapa-presidente-t<turno>.json):
  { "cargo": "...", "atualizado": "<ISO>", "m": { "<ibge>": [partido, numero, pct, pctSecoes, votos, numero2, pct2, votos2, partido2] } }
  O arquivo mapa-presidente.json continua sendo gerado como compatibilidade do 1º turno.
  Município sem votos ainda não aparece em "m".

Também atende o contador de pessoas online em 127.0.0.1:5181/online?id=<aba> (o nginx
repassa /online): cada aba manda um sinal a cada 30s e a resposta é quantas abas
distintas sinalizaram nos últimos ONLINE_JANELA_S segundos.
"""
import gzip
import json
import os
import re
import sys
import threading
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

BASE = 'https://resultados.tse.jus.br/oficial/ele2026'
SAIDA = os.environ.get('SAIDA', '/var/www/eleicao-dados')
TRABALHADORES = 16
# COLETAR=0: só atende o contador online, sem consultar o TSE
COLETAR = os.environ.get('COLETAR', '1') != '0'
# nova rodada no mínimo 3 min depois do início da anterior
RODADA_MIN_S = 180
# teto de pedidos ao TSE (somando todos os trabalhadores); o IP é o mesmo do cache /tse/ do site
PEDIDOS_POR_SEGUNDO = float(os.environ.get('PEDIDOS_POR_SEGUNDO', '40'))
# ao levar 429, só o coletor dos mapas para por este tempo (o resto do site segue pelo cache /tse/)
PAUSA_429_S = 600


class Ritmo:
    """Espaça os pedidos (no máximo PEDIDOS_POR_SEGUNDO) e segura tudo depois de um 429."""

    def __init__(self):
        self.trava = threading.Lock()
        self.proximo = 0.0
        self.pausado_ate = 0.0

    def pausado(self) -> bool:
        return time.time() < self.pausado_ate

    def pausar(self):
        with self.trava:
            if not self.pausado():
                log(f'TSE respondeu 429: pausa de {PAUSA_429_S // 60} min')
            self.pausado_ate = time.time() + PAUSA_429_S

    def esperar_vez(self):
        with self.trava:
            agora = time.time()
            vez = max(agora, self.proximo)
            self.proximo = vez + 1 / PEDIDOS_POR_SEGUNDO
        time.sleep(max(0.0, vez - agora))


ritmo = Ritmo()

# Pleitos federais de 2026: 6257 = 1º turno e 6258 = 2º turno.
CARGOS = {
    'presidente-t2': ('6258', 1, True),
    'presidente-t1': ('6257', 1, True),
}

etags: dict[str, tuple[str, object]] = {}


def log(*a):
    print(datetime.now().strftime('%H:%M:%S'), *a, flush=True)


IGUAL = object()  # 304: nada mudou desde a última rodada


def baixar(url: str):
    """(json, etag), (IGUAL, None) se não mudou, ou (None, None) se ainda não publicado."""
    req = urllib.request.Request(url, headers={'Accept-Encoding': 'gzip', 'User-Agent': 'chorobura-apuracao/1.0'})
    anterior = etags.get(url)
    if anterior:
        req.add_header('If-None-Match', anterior[0])
    ritmo.esperar_vez()
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            corpo = r.read()
            if r.headers.get('Content-Encoding') == 'gzip':
                corpo = gzip.decompress(corpo)
            if corpo.lstrip().startswith(b'<'):
                return None, None
            return json.loads(corpo), r.headers.get('ETag')
    except urllib.error.HTTPError as e:
        if e.code == 304 and anterior:
            return IGUAL, None
        if e.code in (403, 404):
            return None, None
        if e.code == 429:
            ritmo.pausar()
        raise


def inteiro(v) -> int:
    try:
        return int(str(v or '0').replace('.', ''))
    except ValueError:
        return 0


def decimal(v) -> float:
    try:
        return float(str(v or '0').replace('.', '').replace(',', '.'))
    except ValueError:
        return 0.0


def resumir(j: dict, majoritario: bool):
    carg = (j.get('carg') or [{}])[0]
    pst = decimal((j.get('s') or {}).get('pst'))
    vv = inteiro((j.get('v') or {}).get('vv'))
    if majoritario:
        candidatos = []
        for agr in carg.get('agr') or []:
            for par in agr.get('par') or []:
                for c in par.get('cand') or []:
                    votos = inteiro(c.get('vap'))
                    if votos > 0:
                        candidatos.append((votos, par.get('sg') or agr.get('com') or '', str(c.get('n') or ''), decimal(c.get('pvap'))))
        candidatos.sort(reverse=True)
        if not candidatos:
            return None
        lider = candidatos[0]
        segundo = candidatos[1] if len(candidatos) > 1 else (0, '', '', 0.0)
        return [lider[1], lider[2], lider[3], pst, lider[0], segundo[2], segundo[3], segundo[0], segundo[1]]
    melhor = None
    for agr in carg.get('agr') or []:
        for par in agr.get('par') or []:
            nominais = sum(inteiro(c.get('vap')) for c in par.get('cand') or [])
            votos = nominais + inteiro(par.get('tvan'))
            if votos > 0 and (melhor is None or votos > melhor[0]):
                melhor = (votos, par.get('sg') or '')
    if melhor is None:
        return None
    return [melhor[1], '', round(melhor[0] * 100 / vv, 2) if vv else 0.0, pst]


municipios_cache: dict[str, list[tuple[str, str, str]]] = {}


def municipios(ele: str):
    """[(uf, codigo TSE, codigo IBGE)] sem o exterior."""
    if ele not in municipios_cache:
        j, _ = baixar(f'{BASE}/{ele}/config/mun-e{ele.zfill(6)}-cm.json')
        lista = []
        for abr in (j or {}).get('abr') or []:
            if abr['cd'] == 'zz':
                continue
            for m in abr.get('mu') or []:
                lista.append((abr['cd'], m['cd'], m['cdi']))
        if lista:
            municipios_cache[ele] = lista
        return lista
    return municipios_cache[ele]


# municípios já 100% apurados, lidos do mapa gravado: depois de reiniciar não são buscados de novo
prontos: dict[str, dict[str, list]] = {}


def carregar_prontos(cargo: str) -> dict[str, list]:
    if cargo not in prontos:
        arquivos = [os.path.join(SAIDA, f'mapa-{cargo}.json')]
        # Migração: o coletor anterior gravava o 1º turno somente sem o sufixo -t1.
        if cargo == 'presidente-t1':
            arquivos.append(os.path.join(SAIDA, 'mapa-presidente.json'))
        prontos[cargo] = {}
        for arquivo in arquivos:
            try:
                with open(arquivo, encoding='utf-8') as f:
                    m = json.load(f).get('m') or {}
                prontos[cargo] = {ibge: r for ibge, r in m.items() if r and r[3] >= 100}
                break
            except (OSError, ValueError):
                continue
        log(f'{cargo}: {len(prontos[cargo])} municípios já 100% (não serão buscados)')
    return prontos[cargo]


def coletar(cargo: str, pool: ThreadPoolExecutor):
    ele, codigo, majoritario = CARGOS[cargo]
    e6 = ele.zfill(6)
    ja_prontos = carregar_prontos(cargo)

    def um(item):
        uf, cd, ibge = item
        # no DF o deputado "estadual" é distrital (cargo 8)
        c = 8 if cargo == 'depEstadual' and uf == 'df' else codigo
        url = f'{BASE}/{ele}/dados/{uf}/{uf}{cd}-c{str(c).zfill(4)}-e{e6}-u.json'
        if ibge in ja_prontos:
            return ibge, ja_prontos[ibge], None
        anterior = etags.get(url)
        # município 100% apurado não muda mais: não volta a ser buscado no TSE
        if anterior and anterior[1] and anterior[1][3] >= 100:
            ja_prontos[ibge] = anterior[1]
            return ibge, anterior[1], None
        if ritmo.pausado():  # depois de um 429 não pede nada: devolve o último resumo conhecido
            return ibge, anterior[1] if anterior else None, None
        try:
            dado, etag = baixar(url)
        except Exception as ex:  # rede: mantém o último resumo conhecido
            anterior = etags.get(url)
            return ibge, anterior[1] if anterior else None, ex
        if dado is None:
            return ibge, None, None
        if dado is IGUAL:
            return ibge, etags[url][1], None
        resumo = resumir(dado, majoritario)
        if etag:
            etags[url] = (etag, resumo)
        return ibge, resumo, None

    inicio = time.time()
    m, erros = {}, 0
    for ibge, resumo, erro in pool.map(um, municipios(ele)):
        erros += erro is not None
        if resumo:
            m[ibge] = resumo
    os.makedirs(SAIDA, exist_ok=True)
    tmp = os.path.join(SAIDA, f'.mapa-{cargo}.json')
    atualizado = datetime.now(timezone.utc).isoformat()
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump({'cargo': 'presidente', 'turno': int(cargo[-1]), 'atualizado': atualizado, 'm': m}, f, separators=(',', ':'), ensure_ascii=False)
    os.chmod(tmp, 0o644)
    os.replace(tmp, os.path.join(SAIDA, f'mapa-{cargo}.json'))
    if cargo == 'presidente-t1':
        legado = os.path.join(SAIDA, '.mapa-presidente.json')
        with open(legado, 'w', encoding='utf-8') as f:
            json.dump({'cargo': 'presidente', 'turno': 1, 'atualizado': atualizado, 'm': m}, f, separators=(',', ':'), ensure_ascii=False)
        os.chmod(legado, 0o644)
        os.replace(legado, os.path.join(SAIDA, 'mapa-presidente.json'))
    log(f'{cargo}: {len(m)} municípios com votos, {erros} erros, {time.time() - inicio:.0f}s')


ONLINE_PORTA = 5181
ONLINE_JANELA_S = 90
online: dict[str, float] = {}
online_trava = threading.Lock()


class Online(BaseHTTPRequestHandler):
    def do_GET(self):
        url = urlparse(self.path)
        if url.path != '/online':
            self.send_error(404)
            return
        aba = (parse_qs(url.query).get('id') or [''])[0]
        agora = time.time()
        with online_trava:
            if re.fullmatch(r'[a-z0-9]{4,16}', aba):
                online[aba] = agora
            for k in [k for k, t in online.items() if agora - t > ONLINE_JANELA_S]:
                del online[k]
            n = len(online)
        corpo = json.dumps({'online': n}).encode()
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(corpo)))
        self.end_headers()
        self.wfile.write(corpo)

    def log_message(self, *a):
        pass


def main():
    uma_vez = '--uma-vez' in sys.argv
    if not uma_vez:
        servidor = ThreadingHTTPServer(('127.0.0.1', ONLINE_PORTA), Online)
        threading.Thread(target=servidor.serve_forever, daemon=True).start()
        # logs das urnas: thread própria, ritmo próprio (servidor/logs_urna.py)
        if os.environ.get('LOGS', '1') != '0':
            sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
            from logs_urna import LeitorLogs

            LeitorLogs(SAIDA).start()
    if not COLETAR:
        log('coleta desligada (COLETAR=0): só o contador online')
        threading.Event().wait()
    with ThreadPoolExecutor(TRABALHADORES) as pool:
        while True:
            inicio = time.time()
            for cargo in CARGOS:
                try:
                    coletar(cargo, pool)
                except Exception as ex:
                    log(f'{cargo}: falhou: {ex}')
            if uma_vez:
                return
            time.sleep(max(5, RODADA_MIN_S - (time.time() - inicio)))


if __name__ == '__main__':
    main()
