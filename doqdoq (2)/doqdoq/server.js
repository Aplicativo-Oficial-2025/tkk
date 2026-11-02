import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import gerarPixHandler from './api/gerar-pix.js';
import consultarPixHandler from './api/consultar-pix.js';
import webhookHandler from './api/webhook.js';
import tiktokEventHandler from './api/tiktok-event.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregador simples de variáveis .env sem dependências externas
function loadEnv() {
  ['.env', '.env.local'].forEach(file => {
    const envPath = path.join(__dirname, file);
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...values] = trimmed.split('=');
          if (key && values.length) {
            process.env[key.trim()] = values.join('=').trim();
          }
        }
      });
    }
  });
}

loadEnv();

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function enhanceResponse(res) {
  res.status = function (code) {
    res.statusCode = code;
    return res;
  };
  res.json = function (data) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(data));
    return res;
  };
  return res;
}

const server = http.createServer(async (req, res) => {
  enhanceResponse(res);

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // Rotas de API
  if (pathname.startsWith('/api/')) {
    // Coleta body se houver
    let bodyData = '';
    req.on('data', chunk => {
      bodyData += chunk;
    });

    req.on('end', async () => {
      if (bodyData) {
        try {
          req.body = JSON.parse(bodyData);
        } catch {
          req.body = bodyData;
        }
      } else {
        req.body = {};
      }

      req.query = Object.fromEntries(parsedUrl.searchParams);

      if (pathname === '/api/gerar-pix' || pathname === '/api/create-pix') {
        return gerarPixHandler(req, res);
      }
      if (pathname === '/api/consultar-pix' || pathname === '/api/pix-status') {
        return consultarPixHandler(req, res);
      }
      if (pathname === '/api/webhook') {
        return webhookHandler(req, res);
      }
      if (pathname === '/api/tiktok-event') {
        return tiktokEventHandler(req, res);
      }

      return res.status(404).json({ error: 'Endpoint não encontrado' });
    });
    return;
  }

  // Servir arquivos estáticos
  let safePath = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.join(__dirname, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Se não encontrar o arquivo, tenta servir index.html
      const fallbackPath = path.join(__dirname, 'index.html');
      if (fs.existsSync(fallbackPath)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        fs.createReadStream(fallbackPath).pipe(res);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
      }
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Servidor Ampara Brasil rodando em http://localhost:${PORT}`);
  console.log(`🔑 InvictusPay Seller v1 integrado e ativo!`);
});
