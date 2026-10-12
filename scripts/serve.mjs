import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
export function serve(root = resolve('dist'), port = 4173) {
  return createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      const path = resolve(root, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
      if (!path.startsWith(root + sep)) { res.writeHead(403).end(); return; }
      const content = await readFile(path);
      res.writeHead(200, { 'Content-Type': ({ '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.pdf': 'application/pdf' })[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      res.end(content);
    } catch { res.writeHead(404).end('Not found'); }
  }).listen(port, '127.0.0.1');
}
if (process.argv[1]?.endsWith('serve.mjs')) serve().on('listening', () => console.log('Local: http://127.0.0.1:4173'));
