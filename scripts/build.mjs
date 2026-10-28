import { mkdir, cp, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
const out = resolve('dist');
// Always clean the output so removed documents cannot survive a rebuild.
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const file of ['index.html', 'style.css', 'script.js', 'portal.html', '.nojekyll']) {
  await cp(file, resolve(out, file));
}
console.log('Built static portfolio. No backend, API keys, or package installation required.');
