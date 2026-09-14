// Tiny localhost server for the packaged app: serves the built `dist/` and the
// /api/* endpoints, so the renderer's fetch('/api/...') works exactly like in dev.
const http = require('http');
const path = require('path');
const { readFile, stat } = require('fs/promises');
const { handleChat, handleSaveSession, handleAuth } = require('./api.cjs');

const DIST = path.join(__dirname, '..', 'dist');
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2',
};

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString() || '{}')); } catch { resolve({}); } });
  });
}
function sendJSON(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

async function serveStatic(req, res) {
  let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  if (urlPath === '/' || urlPath.startsWith('/#')) urlPath = '/index.html';
  let filePath = path.join(DIST, urlPath);
  try {
    const s = await stat(filePath);
    if (s.isDirectory()) filePath = path.join(filePath, 'index.html');
  } catch {
    filePath = path.join(DIST, 'index.html'); // SPA fallback
  }
  try {
    const data = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404); res.end('Not found');
  }
}

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer(async (req, res) => {
      if (req.method === 'POST' && req.url?.startsWith('/api/')) {
        const body = await readBody(req);
        try {
          if (req.url.startsWith('/api/chat')) return sendJSON(res, 200, await handleChat(body));
          if (req.url.startsWith('/api/save-session')) return sendJSON(res, 200, await handleSaveSession(body));
          if (req.url.startsWith('/api/auth')) { const r = await handleAuth(body); return sendJSON(res, r.code, r.json); }
          return sendJSON(res, 404, { error: 'unknown endpoint' });
        } catch (err) {
          return sendJSON(res, 500, { error: String(err && err.message ? err.message : err) });
        }
      }
      return serveStatic(req, res);
    });
    server.listen(0, '127.0.0.1', () => resolve({ port: server.address().port, server }));
  });
}

module.exports = { startServer };
