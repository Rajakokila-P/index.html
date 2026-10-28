const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
(async () => {
 const {serve} = await import('../scripts/serve.mjs');
 const server = serve(undefined, 4173);
 const browser = await chromium.launch({headless:true});
 let checks=0; const check=(value,label)=>{assert.ok(value,label);checks++;console.log('PASS '+label)};
 try {
  await fs.mkdir('test-results',{recursive:true});
  for (const width of [320,390,820,1440]) {
   const page=await browser.newPage({viewport:{width,height:900}});
   const errors=[], external=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:4173')) external.push(r.url())});
   await page.goto('http://127.0.0.1:4173/');
   check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),width+' no horizontal overflow');
   check(await page.locator('#cv').count()===0,width+' CV section absent');
   check(await page.locator('.service-card').count()===6,width+' all services retained');
   if(width<760){
    await page.getByRole('button',{name:'Menu'}).click();
    check(await page.locator('nav').isVisible(),width+' menu opens');
    await page.keyboard.press('Escape');
    check(!(await page.locator('nav').isVisible()),width+' Escape closes menu');
   }
   await page.locator('[data-service="Dashboards"]').click();
   check(await page.locator('#enquiry-service').inputValue()==='Dashboards',width+' service choice reaches form');
   check(await page.locator('#enquiry-form').isVisible(),width+' form visible with JavaScript');
   check(await page.locator('#enquiry-form').evaluate(f=>!f.checkValidity()),width+' empty enquiry blocked');
   check((await page.request.get('http://127.0.0.1:4173/assets/SP-Raja-CV.pdf')).status()===404,width+' removed PDF unavailable');
   await page.screenshot({path:`test-results/portfolio-${width}.png`,fullPage:true});
   await page.goto('http://127.0.0.1:4173/portal.html');
   check(await page.getByRole('link',{name:'Visit the contact section'}).count()===1,width+' legacy portal contact works');
   check(errors.length===0,width+' no JavaScript errors');
   check(external.length===0,width+' no external network requests');
   await page.close();
  }
  const page=await browser.newPage({javaScriptEnabled:false});
  await page.goto('http://127.0.0.1:4173/');
  check(!(await page.locator('#enquiry-form').isVisible()),'no JavaScript: form cannot leak details into page URL');
  check(await page.locator('a[href="mailto:sarvamsky@gmail.com"]').count()===1,'no JavaScript: direct email available');
  await page.close();
  console.log(`${checks} browser checks passed. No email sent.`);
 } finally {await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exit(1)});
