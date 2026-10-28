export function friendlyError(error) {
  if (error?.status === 429 || /rate_limit/.test(error?.code || '')) return 'Too many attempts. Please wait before trying again. The exploration email service has a low hourly limit.';
  if (error?.code === 'email_address_not_authorized') return 'This email service currently accepts authorised project-team addresses only. Use your Supabase team email for personal testing.';
  if (error?.code === 'email_not_confirmed') return 'Please verify your email before logging in. You can resend the verification email.';
  if (error?.code === 'invalid_credentials') return 'The email or password is incorrect.';
  if (error?.code === 'same_password') return 'Choose a password different from your current password.';
  if (error?.code === 'weak_password') return 'Choose a stronger password with at least 12 characters.';
  if (/fetch|network/i.test(error?.message || '')) return 'Could not connect. Check your connection and try again. The free project may also need resuming.';
  return 'The request could not be completed. Please check your details and try again.';
}

export async function mountAccount({document, window, auth}) {
  const $ = selector => document.querySelector(selector);
  const status = $('#global-status');
  let currentUser = null, generation = 0, recovering = new URL(window.location.href).searchParams.get('recovery') === '1', blockedLink = false;
  const callback = new URL('portal.html', window.location.href);
  callback.search = ''; callback.hash = '';
  const initialHash = new URLSearchParams(window.location.hash.slice(1));
  blockedLink = initialHash.has('error') || initialHash.has('error_code');
  function view(name) {
    document.querySelectorAll('[data-panel]').forEach(p => {p.hidden = p.dataset.panel !== name;});
    document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === name)));
  }
  function panel(name) {
    for (const id of ['unavailable','auth-panel','password-panel','dashboard']) $('#'+id).hidden = id !== name;
  }
  function feedback(form, message, error = false) {
    const node = form.querySelector('.feedback'); node.textContent = message; node.classList.toggle('error', error);
  }
  function clearAccount() {
    currentUser = null;
    for (const id of ['account-name','account-email','account-status','account-created','account-recovery-status']) $('#'+id).textContent = '';
    $('#profile-form').reset();
    document.querySelectorAll('.feedback').forEach(n => {n.textContent = '';});
    document.querySelectorAll('input[type=password]').forEach(n => {n.value = '';});
  }
  async function render() {
    const token = ++generation;
    const {data, error} = await auth.getUser();
    if (token !== generation) return;
    const user = data?.user;
    if (blockedLink || error || !user?.email_confirmed_at) {
      clearAccount(); panel('auth-panel');
      status.textContent = blockedLink ? 'This email link is invalid or expired. Request a new link.' : user && !error ? 'Please verify your email before logging in.' : 'Log in or register to open your dashboard.';
      return;
    }
    currentUser = user;
    $('#account-name').textContent = user.user_metadata?.full_name || 'visitor';
    $('#account-email').textContent = user.email;
    $('#account-status').textContent = 'Email verified';
    $('#account-created').textContent = user.created_at ? new Date(user.created_at).toLocaleDateString('en-GB') : 'Not available';
    $('#profile-form').elements.name.value = user.user_metadata?.full_name || '';
    panel(recovering ? 'password-panel' : 'dashboard');
    status.textContent = recovering ? 'Your recovery link is verified. Choose your new password.' : 'You are logged in.';
  }
  function action(id, handler) {
    const form = $('#'+id);
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const button = form.querySelector('[type=submit]');
      if (button.disabled) return;
      button.disabled = true; feedback(form, 'Please wait…');
      try {await handler(new window.FormData(form), form);}
      catch (error) {feedback(form, friendlyError(error), true);}
      finally {button.disabled = false;}
    });
  }
  const subscription = auth.onAuthStateChange(event => {
    if (event === 'PASSWORD_RECOVERY') {recovering = true; blockedLink = false;}
    if (event === 'SIGNED_OUT') {++generation; recovering = false; clearAccount(); panel('auth-panel'); status.textContent = 'You have logged out.';}
    if (['SIGNED_IN','PASSWORD_RECOVERY','USER_UPDATED','TOKEN_REFRESHED'].includes(event)) {
      const scheduledGeneration = generation;
      window.setTimeout(() => {if (scheduledGeneration === generation) render().catch(() => {clearAccount(); panel('auth-panel'); status.textContent = 'Please log in again.';});}, 0);
    }
  });
  document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => view(b.dataset.view)));
  action('login-form', async (values, form) => {
    const {error} = await auth.signInWithPassword({email: values.get('email').trim(),password:values.get('password')});
    form.elements.password.value = '';
    if (error) throw error;
    blockedLink = false; recovering = false; await render();
  });
  action('register-form', async (values, form) => {
    if (values.get('password') !== values.get('confirm')) {feedback(form, 'Your passwords do not match.', true); return;}
    if (values.get('name').trim().length < 2) {feedback(form, 'Enter at least two characters for your name.', true); return;}
    const {error} = await auth.signUp({email:values.get('email').trim(),password:values.get('password'),options:{data:{full_name:values.get('name').trim()},emailRedirectTo:callback.href}});
    form.elements.password.value = ''; form.elements.confirm.value = '';
    if (error) throw error;
    $('#verify-form').elements.email.value = values.get('email').trim(); view('verify');
    status.textContent = 'Check your inbox and junk folder for the next step. If you already have an account, log in or request recovery.';
  });
  action('verify-form', async (values, form) => {
    const {error} = await auth.resend({type:'signup',email:values.get('email').trim(),options:{emailRedirectTo:callback.href}});
    if (error) throw error;
    feedback(form, 'If verification is needed, an email will be sent. Check your inbox and junk folder.');
  });
  const recoveryUrl = new URL(callback); recoveryUrl.searchParams.set('recovery','1');
  action('recover-form', async (values, form) => {
    const {error} = await auth.resetPasswordForEmail(values.get('email').trim(), {redirectTo:recoveryUrl.href});
    if (error) throw error;
    feedback(form, 'If this address has an eligible account, you will receive a recovery email.');
  });
  action('password-form', async (values, form) => {
    if (!currentUser || !recovering) {feedback(form, 'Open a valid recovery link first.', true); return;}
    if (values.get('password') !== values.get('confirm')) {feedback(form, 'Your passwords do not match.', true); return;}
    const {error} = await auth.updateUser({password:values.get('password')});
    form.reset(); if (error) throw error;
    const result = await auth.signOut({scope:'global'});
    if (result.error) {feedback(form, 'Password updated, but logout failed. Please retry logout using the button below.', true); return;}
    recovering = false; ++generation; clearAccount(); view('login'); panel('auth-panel');
    window.history.replaceState(null,'',callback.href);
    status.textContent = 'Password updated. Log in with your new password.';
  });
  action('profile-form', async (values, form) => {
    if (!currentUser) throw Error('No active user');
    const name = values.get('name').trim();
    if (name.length < 2) {feedback(form,'Enter at least two characters for your name.',true); return;}
    const token = generation;
    const {error} = await auth.updateUser({data:{full_name:name}});
    if (error) throw error;
    if (!currentUser || token !== generation) return;
    await render(); feedback(form,'Your display name has been saved.');
  });
  async function logout() {
    const {error} = await auth.signOut({scope:'local'});
    if (error) {status.textContent = 'Logout could not be completed. Please try again.'; return;}
    ++generation; recovering = false; clearAccount(); view('login'); panel('auth-panel'); status.textContent = 'You have logged out.';
    window.history.replaceState(null,'',callback.href);
  }
  for (const id of ['sign-out','recovery-logout']) $('#'+id).addEventListener('click', () => logout().catch(()=>{status.textContent='Logout failed. Please retry.';}));
  $('#account-recovery').addEventListener('click', async () => {
    if (!currentUser) return;
    const button=$('#account-recovery'), token=generation; button.disabled=true;
    try {
      const {error} = await auth.resetPasswordForEmail(currentUser.email,{redirectTo:recoveryUrl.href});
      if(error) throw error;
      if(token===generation) $('#account-recovery-status').textContent='If your account is eligible, a recovery email will arrive shortly.';
    } catch(error) {if(token===generation) $('#account-recovery-status').textContent=friendlyError(error);}
    finally {button.disabled=false;}
  });
  view('login');
  // Wait for the SDK to process verification/recovery fragments before rendering.
  const session = await auth.getSession();
  if (session.error && (initialHash.has('access_token') || initialHash.has('error'))) blockedLink = true;
  if (blockedLink) window.history.replaceState(null,'',callback.href);
  await render();
  return {render, dispose:()=>subscription.data.subscription.unsubscribe()};
}
