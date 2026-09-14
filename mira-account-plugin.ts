// Vite dev middleware for the Cofounder desktop app.
//
// Serves /api/chat, /api/auth and /api/save-session by delegating to
// electron/api.cjs, the exact same handlers the packaged app uses through
// electron/server.cjs. No keys, no cloud database: chat goes to Amazon Bedrock
// via the default AWS credential chain, accounts/sessions are local JSON files.
import { createRequire } from 'module';

type AuthResult = { code: number; json: unknown };
type Api = {
  handleChat: (body: unknown) => Promise<unknown>;
  handleAuth: (body: unknown) => Promise<AuthResult>;
  handleSaveSession: (body: unknown) => Promise<unknown>;
};

const require = createRequire(import.meta.url);

function loadApi(): Api {
  return require('./electron/api.cjs') as Api;
}

function readBody(req: any): Promise<any> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString() || '{}')); } catch { resolve({}); }
    });
  });
}

export function miraAccountPlugin() {
  return {
    name: 'cofounder-api',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url: string = req.url || '';
        if (req.method !== 'POST' || !url.startsWith('/api/')) return next();
        const reply = (code: number, obj: unknown) => {
          res.writeHead(code, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(obj));
        };
        const api = loadApi();
        try {
          if (url.startsWith('/api/chat')) return reply(200, await api.handleChat(await readBody(req)));
          if (url.startsWith('/api/save-session')) return reply(200, await api.handleSaveSession(await readBody(req)));
          if (url.startsWith('/api/auth')) {
            const r = await api.handleAuth(await readBody(req));
            return reply(r.code, r.json);
          }
          return next();
        } catch (err: any) {
          return reply(500, { error: err?.message || 'Server error.' });
        }
      });
    },
  };
}
