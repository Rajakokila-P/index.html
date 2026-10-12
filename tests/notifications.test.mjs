import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from '../supabase/functions/notify-enquiries/handler.mjs';
const config={secret:'test-worker-secret',supabaseUrl:'https://example.supabase.co',serviceKey:'server-only',resendKey:'email-only',from:'SP Raja <hello@example.test>',to:'owner@example.test'};
const row={enquiry_id:'request-1',lease_id:'lease-1',customer_name:'Customer',email:'customer@example.test',service:'Dashboards',message:'Please help with my reporting project.'};
test('worker denies missing or wrong credentials without touching records',async()=>{
  let called=false; const h=createHandler({...config,fetcher:async()=>{called=true;throw Error();}});
  assert.equal((await h(new Request('https://example.test',{method:'POST'}))).status,401);
  assert.equal((await h(new Request('https://example.test',{method:'GET'}))).status,405);
  assert.equal(called,false);
});
test('notification marks completion only after provider acceptance',async()=>{
  const calls=[]; const h=createHandler({...config,fetcher:async(url,opts)=>{
    calls.push({url,...opts});
    if(url.endsWith('claim_enquiry_notifications'))return Response.json([row]);
    if(url==='https://api.resend.com/emails')return Response.json({id:'email-1'});
    return new Response(null,{status:204});
  }});
  const result=await h(new Request('https://example.test',{method:'POST',headers:{Authorization:'Bearer test-worker-secret'}}));
  assert.deepEqual(await result.json(),{sent:1,deferred:0});
  assert.equal(calls[1].headers['Idempotency-Key'],'enquiry-request-1');
  assert.deepEqual(JSON.parse(calls[1].body).to,['owner@example.test']);
  assert.equal(JSON.parse(calls[2].body).p_provider_id,'email-1');
});
test('provider failure leaves a retry rather than claiming delivery',async()=>{
  let finish; const h=createHandler({...config,fetcher:async(url,opts)=>{
    if(url.endsWith('claim_enquiry_notifications'))return Response.json([row]);
    if(url==='https://api.resend.com/emails')return Response.json({error:'failure'},{status:503});
    finish=JSON.parse(opts.body);return new Response(null,{status:204});
  }});
  const result=await h(new Request('https://example.test',{method:'POST',headers:{Authorization:'Bearer test-worker-secret'}}));
  assert.deepEqual(await result.json(),{sent:0,deferred:1});assert.equal(finish.p_provider_id,null);assert.equal(finish.p_error,'email_delivery_retry_required');
});
