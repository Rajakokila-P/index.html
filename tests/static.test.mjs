import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, mkdir, writeFile, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const html = await readFile('index.html', 'utf8');
test('all homepage fragment links have unique destinations', () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(x => x[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const [,id] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(id), id);
});
test('CV section and download are removed', async () => {
  assert.doesNotMatch(html, /#cv|SP-Raja-CV|Download CV|CURRICULUM VITAE/);
  await assert.rejects(access('assets/SP-Raja-CV.pdf'));
});
test('runtime is independent of backend services and packages', async () => {
  const script = await readFile('script.js', 'utf8');
  assert.doesNotMatch(script, /fetch\(|XMLHttpRequest|supabase|resend|localStorage|sessionStorage/i);
  assert.doesNotMatch(html, /<script[^>]+src="https?:/);
  const pkg = JSON.parse(await readFile('package.json','utf8'));
  assert.equal(Object.keys(pkg.dependencies || {}).length, 0);
});
test('legacy portal offers direct contact and no account forms', async () => {
  const portal = await readFile('portal.html','utf8');
  assert.match(portal, /mailto:/); assert.match(portal, /index.html#contact/);
  assert.doesNotMatch(portal, /<form|<script/);
});
test('clean build removes previously published private documents', async () => {
  await mkdir('dist/assets', {recursive:true});
  await writeFile('dist/assets/SP-Raja-CV.pdf','obsolete document');
  await writeFile('dist/config.json','obsolete configuration');
  execFileSync(process.execPath,['scripts/build.mjs']);
  assert.deepEqual((await readdir('dist')).sort(), ['.nojekyll','index.html','portal.html','script.js','style.css']);
});

test('email draft encodes visitor text and never claims it was sent', async () => {
  const { runInNewContext } = await import('node:vm');
  const nodes = new Map();
  const node = key => {
    if (!nodes.has(key)) nodes.set(key, { handlers:{}, attributes:{'aria-expanded':'false'}, classList:{toggle(){},remove(){}}, addEventListener(event,fn){this.handlers[event]=fn},getAttribute(k){return this.attributes[k]},setAttribute(k,v){this.attributes[k]=v},querySelectorAll(){return []},reportValidity(){return true},hidden:true });
    return nodes.get(key);
  };
  const values={name:'Visitor & Guest',email:'visitor@example.test',service:'Dashboards',message:'A message with &subject=unexpected\n<text> and Tamil: வணக்கம்'};
  const window={location:{href:''}};
  const document={querySelector:node,querySelectorAll(){return []},addEventListener(){}};
  runInNewContext(await readFile('script.js','utf8'),{document,window,Date,encodeURIComponent,FormData:class{get(key){return values[key]}}});
  const form=node('#enquiry-form'); let prevented=false;
  form.handlers.submit({preventDefault(){prevented=true},currentTarget:form});
  assert.ok(prevented); assert.equal(form.hidden,false);
  const url=new URL(window.location.href);
  assert.equal(url.protocol,'mailto:');
  assert.equal(url.searchParams.get('subject'),'SP Raja enquiry: Dashboards');
  assert.ok(url.searchParams.get('body').includes(values.message));
  assert.equal([...url.searchParams.keys()].length,2);
  assert.match(node('#enquiry-feedback').textContent,/Send it from your email app/);
  window.location.href=''; form.reportValidity=()=>false;
  form.handlers.submit({preventDefault(){},currentTarget:form});
  assert.equal(window.location.href,'');
});
