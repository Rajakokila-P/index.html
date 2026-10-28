import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {mountAccount,friendlyError} from '../src/account.mjs';
const html=await readFile('portal.html','utf8');
const user={id:'user-a',email:'visitor@example.test',email_confirmed_at:'2026-10-28',created_at:'2026-10-28',user_metadata:{full_name:'Visitor'}};
async function fixture(options={}) {
 const dom=new JSDOM(html,{url:'https://rajakokila-p.github.io/index.html/portal.html'+(options.hash||'')});
 const {window}=dom; let current=options.user||null, listener; const calls=[];
 const auth={
  onAuthStateChange(fn){listener=fn;return {data:{subscription:{unsubscribe(){}}}}},
  async getSession(){if(options.recovery) listener('PASSWORD_RECOVERY');return {data:{session:current?{user:current}:null}}},
  async getUser(){return {data:{user:current}}},
  async signInWithPassword(value){calls.push(['login',value]);if(options.loginError)return {error:options.loginError};current=user;return {}},
  async signUp(value){calls.push(['signup',value]);return {}},
  async resend(value){calls.push(['resend',value]);return {}},
  async resetPasswordForEmail(email,value){calls.push(['recover',email,value]);return options.recoverError?{error:options.recoverError}:{}},
  async updateUser(value){calls.push(['update',value]);if(current && value.data)current={...current,user_metadata:value.data};return {}},
  async signOut(value){calls.push(['logout',value]);if(options.logoutError)return {error:options.logoutError};current=null;listener('SIGNED_OUT');return {}}
 };
 const app=await mountAccount({document:window.document,window,auth});
 const $=s=>window.document.querySelector(s);
 async function submit(id,values){const form=$('#'+id);for(const [k,v] of Object.entries(values)){form.elements[k].value=v}form.reportValidity=()=>true;form.dispatchEvent(new window.Event('submit',{cancelable:true}));await new Promise(r=>setTimeout(r,10));}
 return {window,$,calls,app,auth,submit,close:()=>{app.dispose();window.close()}};
}
test('anonymous and unverified users cannot view account data',async()=>{
 for(const u of [null,{...user,email_confirmed_at:null}]){const f=await fixture({user:u});assert.equal(f.$('#dashboard').hidden,true);assert.equal(f.$('#account-email').textContent,'');f.close()}
});
test('registration validates matching passwords before API and supplies exact callback',async()=>{
 const f=await fixture();const values={name:'Visitor',email:'visitor@example.test',password:'a-long-password',confirm:'different'};
 await f.submit('register-form',values);assert.equal(f.calls.length,0);
 await f.submit('register-form',{...values,confirm:values.password});assert.equal(f.calls[0][0],'signup');assert.equal(f.calls[0][1].options.emailRedirectTo,'https://rajakokila-p.github.io/index.html/portal.html');assert.equal(f.$('#register-form').elements.password.value,'');assert.equal(f.$('#verify-form').hidden,false);f.close();
});
test('login loads verified account and logout clears all displayed identity',async()=>{
 const f=await fixture();await f.submit('login-form',{email:user.email,password:'long-password'});assert.equal(f.$('#dashboard').hidden,false);assert.equal(f.$('#account-email').textContent,user.email);
 f.$('#sign-out').click();await new Promise(r=>setTimeout(r,10));assert.equal(f.$('#dashboard').hidden,true);assert.equal(f.$('#account-email').textContent,'');assert.match(f.$('#global-status').textContent,/logged out/);f.close();
});
test('failed login and logout are never reported as success',async()=>{
 const f=await fixture({loginError:{code:'invalid_credentials'}});await f.submit('login-form',{email:user.email,password:'bad'});assert.equal(f.$('#dashboard').hidden,true);assert.match(f.$('#login-form .feedback').textContent,/incorrect/);f.close();
 const g=await fixture({user,logoutError:{status:500}});g.$('#sign-out').click();await new Promise(r=>setTimeout(r,10));assert.match(g.$('#global-status').textContent,/could not/);assert.equal(g.$('#dashboard').hidden,false);g.close();
});
test('recovery uses exact URL and neutral account-existence message',async()=>{
 const f=await fixture();await f.submit('recover-form',{email:user.email});assert.equal(f.calls[0][2].redirectTo,'https://rajakokila-p.github.io/index.html/portal.html?recovery=1');assert.match(f.$('#recover-form .feedback').textContent,/If this address/);f.close();
});
test('recovery session updates password and signs out globally',async()=>{
 const f=await fixture({user,recovery:true});assert.equal(f.$('#password-panel').hidden,false);
 await f.submit('password-form',{password:'new-long-password',confirm:'new-long-password'});assert.deepEqual(f.calls.map(c=>c[0]),['update','logout']);assert.equal(f.calls[1][1].scope,'global');assert.equal(f.$('#dashboard').hidden,true);assert.match(f.$('#global-status').textContent,/Password updated/);f.close();
});
test('expired link fails closed even with a previous valid session',async()=>{
 const f=await fixture({user,hash:'#error=access_denied&error_code=otp_expired'});assert.equal(f.$('#dashboard').hidden,true);assert.match(f.$('#global-status').textContent,/expired/);assert.equal(f.window.location.hash,'');f.close();
});
test('profile values render as text and profile update uses authenticated endpoint',async()=>{
 const f=await fixture({user:{...user,user_metadata:{full_name:'<img src=x onerror=alert(1)>'}}});assert.equal(f.$('#account-name img'),null);assert.match(f.$('#account-name').textContent,/<img/);
 await f.submit('profile-form',{name:'New display name'});assert.equal(f.calls[0][1].data.full_name,'New display name');assert.equal(f.$('#account-name').textContent,'New display name');f.close();
});
test('email restrictions and rate limits have actionable messages',()=>{
 assert.match(friendlyError({code:'email_address_not_authorized'}),/project-team/);
 assert.match(friendlyError({status:429}),/wait/);
});
