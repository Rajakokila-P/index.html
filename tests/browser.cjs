const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const {serve}=await import('../scripts/serve.mjs');const server=serve(undefined,4173);
 try{
  for(const width of [320,390,820,1440]){
   const page=await browser.newPage({viewport:{width,height:900}});
   await page.goto('http://127.0.0.1:4173/');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   assert.equal(await page.locator('#cv').count(),0);
   await page.goto('http://127.0.0.1:4173/portal.html');
   await page.locator('#auth-panel').waitFor({state:'visible'});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.locator('[data-view="register"]').click();
   assert.ok(await page.locator('#register-form').isVisible());
   await page.locator('[data-view="recover"]').click();
   assert.ok(await page.locator('#recover-form').isVisible());
   assert.ok(!(await page.locator('#dashboard').isVisible()));
   await page.close();
  }
  console.log('Account-page smoke checks passed; no email or registration submitted.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exit(1)});
