import { build } from 'esbuild';
import { mkdir, cp, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const out = resolve('dist');
await mkdir(out, { recursive: true });
for (const file of ['index.html', 'style.css', 'script.js', 'portal.html', 'portal.css', '.nojekyll', 'assets']) {
  await cp(file, resolve(out, file), { recursive: true });
}
const config = JSON.parse(await readFile('config.json', 'utf8'));
config.supabaseUrl = process.env.PUBLIC_SUPABASE_URL || config.supabaseUrl;
config.supabasePublishableKey = process.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY || config.supabasePublishableKey;
if (config.supabasePublishableKey.startsWith('sb_secret_')) throw new Error('A server secret must never be included in the browser build.');
if (config.supabasePublishableKey.startsWith('eyJ')) {
  const role = JSON.parse(Buffer.from(config.supabasePublishableKey.split('.')[1], 'base64url')).role;
  if (role !== 'anon') throw new Error('Only an anon or publishable key is allowed.');
}
if (Boolean(config.supabaseUrl) !== Boolean(config.supabasePublishableKey)) throw new Error('Both public backend settings are required.');
if (config.supabaseUrl && new URL(config.supabaseUrl).protocol !== 'https:') throw new Error('Use an HTTPS backend.');
await writeFile(resolve(out, 'config.json'), JSON.stringify(config, null, 2));
await build({ entryPoints: ['src/portal.js'], outfile: resolve(out, 'portal.js'), bundle: true, format: 'esm', minify: true, sourcemap: false, target: 'es2022' });
console.log(`Built ${out}. Customer accounts ${config.supabaseUrl ? 'configured' : 'disabled until backend connection'}.`);
