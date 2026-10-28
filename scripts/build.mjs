import { mkdir, cp, rm, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { build } from 'esbuild';
const config=JSON.parse(await readFile('config.json','utf8'));
if(config.supabaseUrl!=='https://fqvftoegqpmakumfagzk.supabase.co') throw Error('Unexpected authentication project');
if(!config.supabasePublishableKey?.startsWith('sb_publishable_')) throw Error('Only a publishable browser key is allowed');
const out=resolve('dist');
await rm(out,{recursive:true,force:true}); await mkdir(out,{recursive:true});
for(const file of ['index.html','style.css','script.js','portal.html','portal.css','config.json','.nojekyll']) await cp(file,resolve(out,file));
await build({entryPoints:['src/portal.js'],outfile:resolve(out,'portal.js'),bundle:true,format:'esm',minify:true,sourcemap:false,target:'es2022'});
// Commit the generated root bundle for repositories publishing Pages from main.
await cp(resolve(out,'portal.js'),resolve('portal.js'));
console.log('Built portfolio and Supabase Free account pages; CV remains excluded.');
