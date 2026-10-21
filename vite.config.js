import { defineConfig, loadEnv } from 'vite';

/**
 * Dev-only bridge so `npm run dev` serves the Vercel-style function in api/.
 * In production Vercel invokes api/sync.js directly — nothing here is shipped
 * to the client bundle and no UI/CSS is affected.
 */
function mongoApiPlugin() {
  return {
    name: 'bite-mongo-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = (req.url || '').split('?')[0].replace(/\/+$/, '');
        if (pathname !== '/api/sync') return next();

        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const raw = Buffer.concat(chunks).toString('utf8');

        let body = {};
        if (raw) {
          try { body = JSON.parse(raw); } catch (_) { body = {}; }
        }

        const mockRes = {
          statusCode: 200,
          setHeader(key, value) { res.setHeader(key, value); },
          status(code) { this.statusCode = code; return this; },
          json(payload) {
            res.statusCode = this.statusCode;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(payload));
          }
        };

        try {
          const mod = await server.ssrLoadModule('/api/sync.js');
          await mod.default({ method: req.method, headers: req.headers, body }, mockRes);
        } catch (error) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: false, error: error.message }));
        }
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  for (const [key, value] of Object.entries(env)) {
    if (key.startsWith('MONGODB_')) process.env[key] = value;
  }

  return {
    plugins: [mongoApiPlugin()],
    server: { port: 3000 }
  };
});
