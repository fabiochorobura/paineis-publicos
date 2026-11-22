# Painéis públicos — Chorobura Sistemas

Código para baixar e executar os painéis **Apuração 2026** e **Seu poder de compra**.

| Pasta | Conteúdo |
| --- | --- |
| `apuracao-2026/` | Aplicação React/TypeScript com Vite, telas de apuração e modo TV. |
| `poder-de-compra/` | Painel independente em HTML, CSS e JavaScript, com gráficos em SVG e dados incluídos. |
| `dados-publicos/mapa-dados/` | Retrato dos resumos municipais públicos do TSE usados pelo modo TV. |

## Baixar

Use **Code → Download ZIP**, ou:

```bash
git clone https://github.com/fabiochorobura/paineis-publicos.git
cd paineis-publicos
```

## Executar a apuração

Requisitos: Node.js 22.12 ou mais recente e npm. A versão foi conferida com Node.js 24.

```bash
cd apuracao-2026
npm ci
npm run dev
```

Abra `http://localhost:5174`. O Vite fornece o proxy/cache para as consultas públicas ao TSE e lê os resumos de `../dados-publicos/`. Nenhuma chave de API é necessária.

```bash
npm run build
npm run preview
```

O build fica em `apuracao-2026/dist/`. Para hospedar apenas os arquivos estáticos em produção, é necessário disponibilizar também as rotas de dados `/tse/`, `/mapa-dados/`, `/metricas-dados/` e `/online`, como faz o servidor local. O build estático sozinho não substitui esses serviços.

Os resumos incluídos são um retrato dos dados no momento da publicação. Para atualizá-los, com Python 3, execute o coletor local apontando `SAIDA` para `dados-publicos/mapa-dados`. Em PowerShell, na raiz deste repositório:

```powershell
$env:SAIDA = Join-Path (Get-Location) 'dados-publicos/mapa-dados'
$env:LOGS = '0'
python apuracao-2026/servidor/coletor-mapa.py --uma-vez
```

O coletor consulta arquivos públicos do TSE e pode demorar. Os scripts de `apuracao-2026/metricas/` tratam análises adicionais de boletins; seus grandes conjuntos de dados processados não acompanham o download.

## Executar o poder de compra

O painel usa HTML, CSS e JavaScript em módulos, sem dependência de React ou biblioteca de gráficos. Os dados usados pela tela já estão em `painel.js` e também em `dados-anuais.json`.

Com Python 3, na raiz do repositório:

```bash
python -m http.server 8000
```

Abra `http://localhost:8000/poder-de-compra/`. O servidor HTTP é necessário para carregar o módulo JavaScript; não é necessário configurar `.env` nem fornecer chaves.

## Fontes e limites dos dados

- **Apuração:** divulgação oficial do [TSE](https://resultados.tse.jus.br/). A disponibilidade das consultas depende do serviço oficial.
- **Poder de compra:** fontes e notas estão na própria tela. A cobertura varia por indicador; 2026 está identificado como período parcial. Os pontos da comparação de carros usam modelos e referências de anos diferentes.
- Os painéis visualizam dados e indicadores; as comparações mantêm as notas e limitações apresentadas na interface.

## Autor

[Fábio Chorobura](https://github.com/fabiochorobura) · [Chorobura Sistemas](https://chorobura.com.br/)

Versões no site: [Apuração](https://chorobura.com.br/eleicoes/) · [Poder de compra](https://chorobura.com.br/salario-minimo-vs-inflacao/).

As dependências e os dados de terceiros mantêm suas respectivas condições e atribuições.
