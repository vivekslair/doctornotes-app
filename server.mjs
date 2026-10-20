import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

// Explicit public routes prevent exposing configuration or other project files.
const files = [
  ['/', 'index.html', 'text/html; charset=utf-8'],
  ['/index.html', 'index.html', 'text/html; charset=utf-8'],
  ['/app.js', 'app.js', 'text/javascript; charset=utf-8'],
  ['/style.css', 'style.css', 'text/css; charset=utf-8']
];

export async function createAppServer() {
  const assets = new Map(await Promise.all(files.map(async ([route, file, type]) =>
    [route, { body: await readFile(new URL(`public/${file}`, import.meta.url)), type }]
  )));

  return createServer((request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.setHeader('Cache-Control', 'no-cache');

    const send = (status, type, body) => {
      response.writeHead(status, {
        'Content-Type': type,
        'Content-Length': Buffer.byteLength(body)
      });
      response.end(request.method === 'HEAD' ? undefined : body);
    };

    if (!['GET', 'HEAD'].includes(request.method)) {
      response.setHeader('Allow', 'GET, HEAD');
      return send(405, 'text/plain; charset=utf-8', 'Method not allowed\n');
    }
    let pathname;
    try {
      pathname = new URL(request.url, 'http://localhost').pathname;
    } catch {
      return send(400, 'text/plain; charset=utf-8', 'Bad request\n');
    }
    if (pathname === '/health') {
      return send(200, 'application/json; charset=utf-8', '{"status":"ok"}\n');
    }
    const asset = assets.get(pathname);
    if (!asset) return send(404, 'text/plain; charset=utf-8', 'Not found\n');
    send(200, asset.type, asset.body);
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error('PORT must be an integer between 0 and 65535.');
  }
  const server = await createAppServer();
  server.on('error', error => {
    console.error(`Server failed: ${error.message}`);
    process.exit(1);
  });
  server.listen(port, '0.0.0.0', () => {
    console.log(`Rounds listening on 0.0.0.0:${server.address().port}`);
  });
  const shutdown = () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
}
