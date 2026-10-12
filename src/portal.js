import { createClient } from '@supabase/supabase-js';

const $ = selector => document.querySelector(selector);
const status = $('#global-status');
let client, currentUser, recovering = false, generation = 0, requestKey, lastPayload;
function feedback(form, text, error = false) {
  const node = form.querySelector('.feedback');
  node.textContent = text;
  node.classList.toggle('error', error);
}
function showView(view) {
  document.querySelectorAll('[data-panel]').forEach(panel => { panel.hidden = panel.dataset.panel !== view; });
  document.querySelectorAll('[data-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
}
function showOnly(id) {
  for (const panel of ['unavailable', 'auth-panel', 'password-panel', 'dashboard']) $('#' + panel).hidden = panel !== id;
}
function callbackUrl(recovery = false) {
  const url = new URL('portal.html', location.href);
  if (recovery) url.searchParams.set('recovery', '1');
  return url.href;
}
function messageFor(error) {
  if (error?.code === 'over_email_send_rate_limit' || error?.status === 429) return 'Too many attempts. Please wait before trying again.';
  if (error?.code === 'email_not_confirmed') return 'Please verify your email before signing in. Use Create account, then resend verification if needed.';
  if (error?.message?.includes('fetch')) return 'Could not reach the service. Check your connection and try again.';
  return 'The request could not be completed. Please check your details and try again.';
}
function action(form, fn) {
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!client || !form.reportValidity()) return;
    const button = form.querySelector('[type=submit]');
    if (button.disabled) return;
    button.disabled = true;
    feedback(form, 'Please wait…');
    try { await fn(new FormData(form)); }
    catch (error) { feedback(form, messageFor(error), true); }
    finally { button.disabled = false; }
  });
}
async function loadRequests() {
  if (!currentUser) return;
  const userId = currentUser.id, token = generation;
  $('#requests-status').textContent = 'Loading your enquiries…';
  const { data, error } = await client.from('enquiries').select('id,service,message,status,created_at').order('created_at', { ascending: false }).limit(50);
  if (!currentUser || currentUser.id !== userId || token !== generation) return;
  $('#requests-list').replaceChildren();
  if (error) { $('#requests-status').textContent = 'Your enquiries could not be loaded. Please try Refresh.'; return; }
  $('#requests-status').textContent = data.length ? 'Your most recent enquiries, newest first.' : 'No enquiries yet. Tell us about your first project.';
  for (const item of data) {
    const article = document.createElement('article'); article.className = 'request-item';
    const title = document.createElement('h4'); title.textContent = item.service;
    const meta = document.createElement('div'); meta.className = 'request-meta';
    const labels = { submitted: 'Submitted', in_progress: 'In progress', completed: 'Completed' };
    meta.textContent = `${labels[item.status] || 'Submitted'} · ${new Date(item.created_at).toLocaleDateString('en-GB')} · ${item.id.slice(0, 8)}`;
    const body = document.createElement('p'); body.textContent = item.message;
    article.append(title, meta, body); $('#requests-list').append(article);
  }
}
async function renderAccount() {
  const token = ++generation;
  const { data: { user }, error } = await client.auth.getUser();
  if (token !== generation) return;
  currentUser = !error && user?.email_confirmed_at ? user : null;
  if (!currentUser) {
    $('#requests-list').replaceChildren(); $('#account-email').textContent = '';
    $('#request-form').reset(); showOnly('auth-panel');
    status.textContent = user ? 'Verify your email before accessing your dashboard.' : 'Sign in or create an account to manage your enquiries.';
    return;
  }
  status.textContent = recovering ? 'Your recovery link has been verified. Set your new password below.' : 'You are signed in securely.';
  showOnly(recovering ? 'password-panel' : 'dashboard');
  $('#account-email').textContent = currentUser.email;
  $('#request-form').elements.name.value = currentUser.user_metadata?.full_name || '';
  if (!recovering) await loadRequests();
}
async function init() {
  try {
    const response = await fetch('config.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Unavailable configuration');
    const config = await response.json();
    if (!config.supabaseUrl || !config.supabasePublishableKey) {
      status.textContent = 'Online registration is not available yet. Please contact SP Raja directly.';
      showOnly('unavailable'); return;
    }
    client = createClient(config.supabaseUrl, config.supabasePublishableKey, { auth: {
      storage: sessionStorage, storageKey: 'sp-raja-customer-session', persistSession: true, autoRefreshToken: true,
      detectSessionInUrl: true, flowType: 'implicit'
    }});
    client.auth.onAuthStateChange(event => {
      if (event === 'PASSWORD_RECOVERY') recovering = true;
      if (event === 'SIGNED_OUT') { recovering = false; currentUser = null; ++generation; $('#requests-list').replaceChildren(); showOnly('auth-panel'); }
      // Run outside the SDK's auth callback lock.
      if (['PASSWORD_RECOVERY', 'SIGNED_IN', 'SIGNED_OUT'].includes(event)) setTimeout(() => renderAccount().catch(() => { status.textContent = 'Could not refresh your account. Please reload the page.'; }), 0);
    });
    document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => showView(button.dataset.view)));
    showView('login');
    action($('#login-form'), async values => {
      const { error } = await client.auth.signInWithPassword({ email: values.get('email').trim(), password: values.get('password') });
      $('#login-form').elements.password.value = '';
      if (error) throw error;
      feedback($('#login-form'), 'Signed in.');
      await renderAccount();
    });
    action($('#register-form'), async values => {
      const form = $('#register-form');
      if (values.get('password') !== values.get('confirm')) { feedback(form, 'Your passwords do not match.', true); return; }
      const { error } = await client.auth.signUp({ email: values.get('email').trim(), password: values.get('password'), options: { data: { full_name: values.get('name').trim() }, emailRedirectTo: callbackUrl() } });
      form.elements.password.value = ''; form.elements.confirm.value = '';
      if (error) throw error;
      $('#verify-form').elements.email.value = values.get('email').trim(); showView('verify');
      status.textContent = 'Check your inbox for the next step. If you already have an account, use Sign in or Forgot password.';
    });
    action($('#verify-form'), async values => {
      const { error } = await client.auth.resend({ type: 'signup', email: values.get('email').trim(), options: { emailRedirectTo: callbackUrl() } });
      if (error) throw error;
      feedback($('#verify-form'), 'If verification is needed, an email will be sent. Please check your inbox and junk folder.');
    });
    action($('#recover-form'), async values => {
      const { error } = await client.auth.resetPasswordForEmail(values.get('email').trim(), { redirectTo: callbackUrl(true) });
      if (error) throw error;
      feedback($('#recover-form'), 'If this address has an account, you will receive a password reset link.');
    });
    action($('#password-form'), async values => {
      const form = $('#password-form');
      if (values.get('password') !== values.get('confirm')) { feedback(form, 'Your passwords do not match.', true); return; }
      const { error } = await client.auth.updateUser({ password: values.get('password') });
      form.reset(); if (error) throw error;
      recovering = false;
      const { error: signOutError } = await client.auth.signOut({ scope: 'global' });
      if (signOutError) { feedback(form, 'Password updated, but sign-out did not finish. Please use Sign out and close this tab.', true); await renderAccount(); return; }
      showView('login'); showOnly('auth-panel');
      status.textContent = 'Password updated. Sign in with your new password.';
      history.replaceState(null, '', 'portal.html');
    });
    action($('#request-form'), async values => {
      if (!currentUser) throw new Error('Not authenticated');
      const payload = { name: values.get('name').trim(), service: values.get('service'), message: values.get('message').trim() };
      const serial = JSON.stringify(payload);
      if (serial !== lastPayload) { requestKey = crypto.randomUUID(); lastPayload = serial; }
      const { data, error } = await client.rpc('submit_enquiry', { p_request_id: requestKey, p_name: payload.name, p_service: payload.service, p_message: payload.message });
      if (error) {
        if (error.message?.includes('rate_limit')) { feedback($('#request-form'), 'You have reached the hourly enquiry limit. Please try again later.', true); return; }
        throw error;
      }
      const id = typeof data === 'string' ? data : data?.id;
      feedback($('#request-form'), `Your enquiry is saved${id ? ' (reference ' + id.slice(0, 8) + ')' : ''}. SP Raja can review it securely. An email notification has been queued.`);
      $('#request-form').elements.message.value = ''; requestKey = undefined; lastPayload = undefined;
      await loadRequests();
    });
    $('#refresh').addEventListener('click', () => loadRequests().catch(() => { $('#requests-status').textContent = 'Could not load enquiries. Try again.'; }));
    $('#sign-out').addEventListener('click', async () => {
      const { error } = await client.auth.signOut({ scope: 'local' });
      if (error) { status.textContent = 'Could not sign out. Please try again or close this tab.'; return; }
      currentUser = null; ++generation; $('#requests-list').replaceChildren(); $('#request-form').reset(); showOnly('auth-panel'); status.textContent = 'You have signed out.';
    });
    await renderAccount();
    if (location.hash.includes('error=')) {
      status.textContent = 'This email link is invalid or has expired. Request a new verification or reset email.';
      history.replaceState(null, '', 'portal.html');
    }
  } catch {
    status.textContent = 'Customer accounts are temporarily unavailable. Please contact SP Raja directly.';
    showOnly('unavailable');
  }
}
init();
