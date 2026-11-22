import { defineConfig, type Connect } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';
import { createReadStream, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// Tudo o que o painel busca fora do código é respondido deste PC, no dev e no preview:
//   /metricas-dados/  boletins processados por metricas/*.py (dados-publicos/)
//   /mapa-dados/      resumo por município do Modo TV, gerado dos mesmos boletins
//   /online           contador de pessoas (aqui é sempre 1)
//   /tse/             resultado oficial: cada arquivo vem uma única vez do TSE e fica guardado em
//                     .cache/tse-resultados (a apuração terminou, o arquivo não muda mais)
const RAIZ = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const DADOS_METRICAS = resolve(RAIZ, 'dados-publicos');
const CACHE_TSE = resolve(RAIZ, '.cache', 'tse-resultados');
const TSE = 'https://resultados.tse.jus.br/';
const TIPOS: Record<string, string> = {
  '.json': 'application/json; charset=utf-8',
  '.bin': 'application/octet-stream',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
};

type Resposta = Parameters<Connect.NextHandleFunction>[1];

const tipoDe = (caminho: string) => TIPOS[caminho.slice(caminho.lastIndexOf('.'))] ?? 'application/octet-stream';

function dentroDe(pasta: string, relativo: string) {
  const caminho = normalize(join(pasta, relativo));
  return caminho.startsWith(pasta + sep) ? caminho : null;
}

function enviar(res: Resposta, caminho: string | null) {
  if (!caminho || !existsSync(caminho)) {
    res.statusCode = 404;
    return res.end();
  }
  res.setHeader('Content-Type', tipoDe(caminho));
  res.setHeader('Content-Length', statSync(caminho).size);
  res.setHeader('Cache-Control', 'no-cache');
  createReadStream(caminho).pipe(res);
}

async function doTse(res: Resposta, relativo: string) {
  const caminho = dentroDe(CACHE_TSE, relativo);
  if (!caminho) return enviar(res, null);
  if (!existsSync(caminho)) {
    try {
      const r = await fetch(TSE + relativo);
      if (!r.ok) {
        res.statusCode = r.status;
        return res.end();
      }
      mkdirSync(dirname(caminho), { recursive: true });
      writeFileSync(caminho, Buffer.from(await r.arrayBuffer()));
    } catch {
      res.statusCode = 502;
      return res.end();
    }
  }
  enviar(res, caminho);
}

function dadosLocais(): Connect.NextHandleFunction {
  return (req, res, next) => {
    // montada dentro do servidor do site institucional, a apuração recebe os caminhos com /eleicoes na frente
    const url = decodeURIComponent((req.url ?? '').split('?')[0]).replace(/^\/eleicoes(?=\/)/, '');
    if (url === '/online') {
      res.setHeader('Content-Type', TIPOS['.json']);
      return res.end('{"online":1}');
    }
    const [, pasta, resto] = /^\/(metricas-dados|mapa-dados|tse)\/(.+)$/.exec(url) ?? [];
    if (pasta === 'metricas-dados') return enviar(res, dentroDe(DADOS_METRICAS, resto));
    if (pasta === 'mapa-dados') return enviar(res, dentroDe(join(DADOS_METRICAS, 'mapa-dados'), resto));
    if (pasta === 'tse') return void doTse(res, resto);
    next();
  };
}

// data/hora do build, mostrada no menu da TV para conferir se ela pegou a versão nova
const versao = new Date().toLocaleString('pt-BR', {
  timeZone: 'America/Cuiaba',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

// identificador único do build: as telas abertas comparam com /versao.json e recarregam se mudar
const idBuild = String(Date.now());

export default defineConfig({
  define: { __VERSAO__: JSON.stringify(versao), __BUILD_ID__: JSON.stringify(idBuild) },
  // caminhos relativos: o build funciona em qualquer hospedagem estática (raiz ou subpasta)
  base: './',
  plugins: [
    react(),
    // navegadores de Smart TV (Tizen, webOS, Android TV antigos) costumam ser Chromium antigo
    legacy({ targets: ['defaults', 'chrome >= 49', 'safari >= 10', 'not IE 11'] }),
    {
      name: 'dados-locais',
      configureServer(server) {
        server.middlewares.use(dadosLocais());
      },
      configurePreviewServer(server) {
        server.middlewares.use(dadosLocais());
      },
    },
    {
      name: 'versao-json',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'versao.json',
          source: JSON.stringify({ id: idBuild, versao }),
        });
      },
    },
  ],
  // host: true expõe na rede local para a família acessar pela TV/celular
  server: { host: true, port: 5174 },
  // no-cache: a TV sempre confere se há versão nova do painel
  preview: {
    host: true,
    port: 5174,
    headers: { 'Cache-Control': 'no-cache' },
    // acesso pela internet via túnel (localtunnel / cloudflared); IPs da rede local já são liberados
    allowedHosts: ['.loca.lt', '.trycloudflare.com'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'react';
          if (id.includes('node_modules/@mui') || id.includes('node_modules/@emotion')) return 'mui';
          if (id.includes('node_modules/apexcharts') || id.includes('node_modules/react-apexcharts'))
            return 'graficos';
          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
});
