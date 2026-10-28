import { createClient } from '@supabase/supabase-js';
import { mountAccount } from './account.mjs';
async function start() {
  try {
    const response = await fetch('config.json',{cache:'no-store'});
    if(!response.ok) throw Error('Configuration unavailable');
    const config = await response.json();
    const client = createClient(config.supabaseUrl, config.supabasePublishableKey, {auth:{
      storage:sessionStorage, storageKey:'sp-raja-visitor-session', persistSession:true,
      autoRefreshToken:true, detectSessionInUrl:true, flowType:'implicit'
    }});
    await mountAccount({document,window,auth:client.auth});
  } catch {
    document.querySelector('#global-status').textContent='Accounts could not connect. Please try again later or contact SP Raja.';
    for(const id of ['auth-panel','password-panel','dashboard']) document.querySelector('#'+id).hidden=true;
    document.querySelector('#unavailable').hidden=false;
  }
}
start();
