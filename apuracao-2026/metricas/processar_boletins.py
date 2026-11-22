"""
Transforma os boletins de urna (BWEB) baixados em uma tabela compacta por seção, só de Presidente.

Lê cada zip direto (sem extrair: o 1º turno passa de 60 GB descompactado), descarta as linhas dos
outros cargos antes de interpretar o CSV e soma os votos por seção. A saída fica ordenada pela hora
em que o boletim chegou à totalização (DT_BU_RECEBIDO, horário de Brasília), que é a ordem em que a
apuração andou na noite da eleição.

Saída em <saida>/t<turno>/:
  secoes.bin  colunas em sequência, little-endian, uma posição por seção (ver meta.json)
  meta.json   candidatos, UFs, municípios e o mapa das colunas (nome, tipo, deslocamento)

Uso:  python -I processar_boletins.py --turno 1|2 [--entrada PASTA] [--saida PASTA]
"""
import argparse
import csv
import glob
import json
import os
import sys
import time
from array import array
from concurrent.futures import ProcessPoolExecutor
from datetime import date, datetime, timezone

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
ENTRADA = os.path.join(RAIZ, '.cache', 'tse-bweb')
SAIDA = os.path.join(RAIZ, '.cache', 'eleicoes-metricas')
DIA_DA_ELEICAO = {1: date(2026, 10, 4), 2: date(2026, 10, 25)}
CARGO = b';"Presidente";'
BRANCO, NULO = '95', '96'
SEM_HORA = -1

# (nome, tipo do array, código no meta.json)
COLUNAS_FIXAS = [
    ('rec', 'i', 'i32'),  # segundos desde 00:00 do dia da eleição (Brasília) em que o BU chegou
    ('mun', 'H', 'u16'),  # índice em meta.municipios
    ('zona', 'H', 'u16'),
    ('secao', 'H', 'u16'),
    ('local', 'H', 'u16'),
    ('aptos', 'H', 'u16'),
    ('comp', 'H', 'u16'),
    ('br', 'H', 'u16'),
    ('nu', 'H', 'u16'),
    ('uf', 'B', 'u8'),  # índice em meta.ufs
    ('agreg', 'B', 'u8'),  # quantas seções foram agregadas a esta
]


def segundos(texto: str, dia: date) -> int:
    """'2026-10-25 19:42:19' -> segundos desde 00:00 do dia da eleição."""
    if len(texto) < 19 or texto[4] != '-':
        return SEM_HORA
    d = date(int(texto[0:4]), int(texto[5:7]), int(texto[8:10]))
    return (d - dia).days * 86400 + int(texto[11:13]) * 3600 + int(texto[14:16]) * 60 + int(texto[17:19])


def ler_zip(caminho: str, turno: int):
    """Seções de Presidente de um zip: {(uf, cd_mun, zona, secao): registro}."""
    import io
    import zipfile

    dia = DIA_DA_ELEICAO[turno]
    secoes: dict[tuple, dict] = {}
    nomes_mun: dict[tuple[str, str], str] = {}
    candidatos: dict[str, tuple[str, str]] = {}
    linhas = 0
    with zipfile.ZipFile(caminho) as zf:
        nome = next(n for n in zf.namelist() if n.lower().endswith('.csv'))
        with zf.open(nome) as bruto:
            f = io.BufferedReader(bruto, 1 << 22)
            cab = next(csv.reader([f.readline().decode('latin-1')], delimiter=';'))
            ix = {c: i for i, c in enumerate(cab)}
            total_campos = len(cab)
            for linha in f:
                if CARGO not in linha:
                    continue
                texto = linha.decode('latin-1').rstrip('\r\n')
                c = [v.strip('"') for v in texto.split(';')]
                if len(c) != total_campos:  # algum campo com ';' dentro: lê do jeito lento
                    c = next(csv.reader([texto], delimiter=';'))
                if c[ix['DS_CARGO_PERGUNTA']] != 'Presidente':
                    continue
                linhas += 1
                uf = c[ix['SG_UF']]
                chave = (uf, c[ix['CD_MUNICIPIO']], int(c[ix['NR_ZONA']]), int(c[ix['NR_SECAO']]))
                s = secoes.get(chave)
                if s is None:
                    agregadas = c[ix['DS_SECOES_AGREGADAS']]
                    s = secoes[chave] = {
                        'rec': segundos(c[ix['DT_BU_RECEBIDO']], dia),
                        'local': int(c[ix['NR_LOCAL_VOTACAO']]),
                        'aptos': int(c[ix['QT_APTOS']]),
                        'comp': int(c[ix['QT_COMPARECIMENTO']]),
                        'agreg': 0 if agregadas in ('#NULO#', '', '-1') else agregadas.count(',') + 1,
                        'votos': {},
                    }
                    nomes_mun[(uf, chave[1])] = c[ix['NM_MUNICIPIO']]
                numero = c[ix['NR_VOTAVEL']]
                s['votos'][numero] = s['votos'].get(numero, 0) + int(c[ix['QT_VOTOS']])
                if numero not in (BRANCO, NULO) and numero not in candidatos:
                    candidatos[numero] = (c[ix['NM_VOTAVEL']], c[ix['SG_PARTIDO']])
    return os.path.basename(caminho), secoes, nomes_mun, candidatos, linhas


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--turno', type=int, choices=[1, 2], required=True)
    ap.add_argument('--entrada', default=ENTRADA)
    ap.add_argument('--saida', default=SAIDA)
    args = ap.parse_args()
    zips = sorted(glob.glob(os.path.join(args.entrada, f'{args.turno}t', '*.zip')), key=os.path.getsize, reverse=True)
    if not zips:
        sys.exit(f'nenhum zip em {args.entrada}/{args.turno}t — rode baixar_boletins.py antes')

    inicio = time.time()
    secoes: dict[tuple, dict] = {}
    nomes_mun: dict[tuple, str] = {}
    candidatos: dict[str, tuple[str, str]] = {}
    with ProcessPoolExecutor(min(len(zips), os.cpu_count() or 4)) as ex:
        for nome, s, nm, cand, linhas in ex.map(ler_zip, zips, [args.turno] * len(zips)):
            print(f'  {nome}: {len(s):,} seções, {linhas:,} linhas de Presidente ({time.time() - inicio:.0f} s)', flush=True)
            secoes.update(s)
            nomes_mun.update(nm)
            candidatos.update(cand)

    totais = {n: 0 for n in candidatos}
    for s in secoes.values():
        for n, v in s['votos'].items():
            if n in totais:
                totais[n] += v
    ordem_cand = sorted(candidatos, key=lambda n: -totais[n])
    ufs = sorted({k[0] for k in secoes})
    municipios = sorted(nomes_mun, key=lambda k: (k[0], nomes_mun[k]))
    ix_uf = {u: i for i, u in enumerate(ufs)}
    ix_mun = {k: i for i, k in enumerate(municipios)}

    # ordem da apuração: hora de chegada do BU; seção sem hora vai para o fim
    chaves = sorted(secoes, key=lambda k: (secoes[k]['rec'] if secoes[k]['rec'] != SEM_HORA else 1 << 30, k))
    colunas = {nome: array(tipo) for nome, tipo, _ in COLUNAS_FIXAS}
    for i in range(len(ordem_cand)):
        colunas[f'c{i}'] = array('H')
    maior = 0
    for k in chaves:
        s = secoes[k]
        v = s['votos']
        colunas['rec'].append(s['rec'])
        colunas['mun'].append(ix_mun[(k[0], k[1])])
        colunas['zona'].append(k[2])
        colunas['secao'].append(k[3])
        colunas['local'].append(s['local'])
        colunas['aptos'].append(s['aptos'])
        colunas['comp'].append(s['comp'])
        colunas['br'].append(v.get(BRANCO, 0))
        colunas['nu'].append(v.get(NULO, 0))
        colunas['uf'].append(ix_uf[k[0]])
        colunas['agreg'].append(min(255, s['agreg']))
        for i, n in enumerate(ordem_cand):
            colunas[f'c{i}'].append(v.get(n, 0))
        maior = max(maior, s['aptos'])

    pasta = os.path.join(args.saida, f't{args.turno}')
    os.makedirs(pasta, exist_ok=True)
    mapa, deslocamento = [], 0
    tipos = {nome: cod for nome, _, cod in COLUNAS_FIXAS} | {f'c{i}': 'u16' for i in range(len(ordem_cand))}
    with open(os.path.join(pasta, 'secoes.bin.tmp'), 'wb') as f:
        # i32 primeiro, depois u16 e u8: cada coluna começa alinhada ao próprio tamanho
        for nome in sorted(colunas, key=lambda n: {'i32': 0, 'u16': 1, 'u8': 2}[tipos[n]]):
            dados = colunas[nome]
            if sys.byteorder != 'little':
                dados.byteswap()
            bruto = dados.tobytes()
            f.write(bruto)
            mapa.append({'nome': nome, 'tipo': tipos[nome], 'deslocamento': deslocamento})
            deslocamento += len(bruto)
    os.replace(os.path.join(pasta, 'secoes.bin.tmp'), os.path.join(pasta, 'secoes.bin'))

    sem_hora = sum(1 for x in colunas['rec'] if x == SEM_HORA)
    meta = {
        'turno': args.turno,
        'dia': DIA_DA_ELEICAO[args.turno].isoformat(),
        'geradoEm': datetime.now(timezone.utc).isoformat(),
        'fonte': 'TSE · dados abertos · Boletim de Urna (BWEB) 2026',
        'secoes': len(chaves),
        'secoesSemHora': sem_hora,
        'bytes': deslocamento,
        'colunas': mapa,
        'candidatos': [
            {'coluna': f'c{i}', 'numero': n, 'nome': candidatos[n][0], 'partido': candidatos[n][1], 'votos': totais[n]}
            for i, n in enumerate(ordem_cand)
        ],
        'ufs': ufs,
        'municipios': [{'uf': k[0], 'cd': k[1], 'nome': nomes_mun[k]} for k in municipios],
    }
    with open(os.path.join(pasta, 'meta.json'), 'w', encoding='utf-8') as f:
        json.dump(meta, f, ensure_ascii=False, separators=(',', ':'))
    print(f'{len(chaves):,} seções, {len(ordem_cand)} candidatos, {len(municipios):,} municípios, '
          f'{deslocamento / 1e6:.1f} MB, {sem_hora} sem hora de chegada, maior seção {maior} aptos '
          f'({time.time() - inicio:.0f} s)')


if __name__ == '__main__':
    main()
