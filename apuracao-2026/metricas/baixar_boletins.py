"""
Baixa os boletins de urna (BWEB) de 2026 publicados nos dados abertos do TSE.

Um zip por UF e turno (27 UFs + ZZ, exterior). O 1º turno traz todos os cargos e pesa ~7 GB;
o 2º turno é pequeno. Cada arquivo é conferido pelo SHA-512 que o TSE publica ao lado dele,
e um download interrompido continua de onde parou (.parcial + Range).

Uso:  python -I baixar_boletins.py [--turno 1|2] [--destino PASTA]
Destino padrão: ratrador/.cache/tse-bweb/<1t|2t>/
"""
import argparse
import hashlib
import json
import os
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor

PACOTE = 'https://dadosabertos.tse.jus.br/api/3/action/package_show?id=resultados-2026-boletim-de-urna'
RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DESTINO = os.path.join(RAIZ, '.cache', 'tse-bweb')
SIMULTANEOS = 4
BLOCO = 1 << 20


def abrir(url: str, inicio: int = 0):
    req = urllib.request.Request(url, headers={'User-Agent': 'chorobura-metricas/1.0'})
    if inicio:
        req.add_header('Range', f'bytes={inicio}-')
    return urllib.request.urlopen(req, timeout=60)


def arquivos_publicados() -> list[str]:
    """URLs dos zips. O TSE erra o link de alguns recursos (RR do 2º turno aponta para o .sha512),
    por isso o zip é deduzido dos arquivos de hash, que existem para todas as UFs."""
    with abrir(PACOTE) as r:
        recursos = json.load(r)['result']['resources']
    zips = set()
    for rec in recursos:
        url = rec['url']
        if url.endswith('.zip.sha512'):
            zips.add(url[: -len('.sha512')])
        elif url.endswith('.zip'):
            zips.add(url)
    return sorted(zips)


def sha512_esperado(url: str) -> str:
    with abrir(url + '.sha512') as r:
        return r.read().decode('ascii', 'ignore').split()[0].lower()


def sha512_do_arquivo(caminho: str) -> str:
    h = hashlib.sha512()
    with open(caminho, 'rb') as f:
        while bloco := f.read(BLOCO * 8):
            h.update(bloco)
    return h.hexdigest()


def baixar(url: str, pasta: str) -> str:
    nome = url.rsplit('/', 1)[1]
    final = os.path.join(pasta, nome)
    esperado = sha512_esperado(url)
    if os.path.exists(final):
        if sha512_do_arquivo(final) == esperado:
            return f'{nome}: já estava baixado, SHA-512 conferido'
        os.remove(final)
    parcial = final + '.parcial'
    for tentativa in range(5):
        inicio = os.path.getsize(parcial) if os.path.exists(parcial) else 0
        try:
            with abrir(url, inicio) as r, open(parcial, 'ab' if inicio and r.status == 206 else 'wb') as f:
                while bloco := r.read(BLOCO):
                    f.write(bloco)
            break
        except urllib.error.HTTPError as e:
            if e.code == 416:  # o .parcial já está completo
                break
            print(f'  {nome}: TSE respondeu {e.code}, nova tentativa em 10 s', flush=True)
            time.sleep(10)
        except OSError as e:
            print(f'  {nome}: falhou ({e}), nova tentativa em 10 s', flush=True)
            time.sleep(10)
    else:
        raise RuntimeError(f'{nome}: não foi possível baixar')
    if sha512_do_arquivo(parcial) != esperado:
        os.remove(parcial)
        raise RuntimeError(f'{nome}: SHA-512 não confere, arquivo descartado')
    os.replace(parcial, final)
    return f'{nome}: {os.path.getsize(final) / 1e6:,.1f} MB, SHA-512 conferido'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--turno', choices=['1', '2'])
    ap.add_argument('--destino', default=DESTINO)
    args = ap.parse_args()
    urls = arquivos_publicados()
    if args.turno:
        urls = [u for u in urls if f'bweb_{args.turno}t_' in u]
    # os maiores primeiro, para o paralelismo não terminar com um arquivo grande sozinho
    urls.sort(key=lambda u: (u.split('_')[2] != 'SP', u.split('_')[2] not in ('MG', 'RJ', 'BA', 'RS', 'PR')))
    print(f'{len(urls)} arquivos', flush=True)
    erros = 0
    with ThreadPoolExecutor(SIMULTANEOS) as ex:
        tarefas = []
        for url in urls:
            pasta = os.path.join(args.destino, url.rsplit('/', 1)[1].split('_')[1])
            os.makedirs(pasta, exist_ok=True)
            tarefas.append(ex.submit(baixar, url, pasta))
        for t in tarefas:
            try:
                print(' ', t.result(), flush=True)
            except Exception as e:  # noqa: BLE001 — registra e segue com os outros
                erros += 1
                print('  ERRO', e, flush=True)
    sys.exit(1 if erros else 0)


if __name__ == '__main__':
    main()
