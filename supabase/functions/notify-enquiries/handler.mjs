export function createHandler({ secret, supabaseUrl, serviceKey, resendKey, from, to, fetcher = fetch }) {
  return async request => {
    const json = (value, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'no-store' } });
    if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
    if (!secret || !supabaseUrl || !serviceKey || !resendKey || !from || !to) return json({ error: 'not_configured' }, 503);
    const supplied = request.headers.get('authorization') || '';
    const [a, b] = await Promise.all([supplied, `Bearer ${secret}`].map(v => crypto.subtle.digest('SHA-256', new TextEncoder().encode(v))));
    let difference = 0; const left = new Uint8Array(a), right = new Uint8Array(b);
    for (let i=0;i<left.length;i++) difference |= left[i]^right[i];
    if (difference !== 0) return json({ error: 'unauthorised' }, 401);
    const rpc = async (name, body) => {
      const result = await fetcher(`${supabaseUrl}/rest/v1/rpc/${name}`, { method: 'POST', headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(15000) });
      if (!result.ok) throw new Error('database_error');
      const text = await result.text(); return text ? JSON.parse(text) : null;
    };
    try {
      const rows = await rpc('claim_enquiry_notifications', {});
      let sent=0, deferred=0;
      const started=Date.now();
      for (const row of rows) {
        // Unprocessed leases expire after five minutes and can be reclaimed.
        if (Date.now()-started>45000) break;
        let providerId=null, error=null;
        try {
          const response = await fetcher('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': `enquiry-${row.enquiry_id}` }, body: JSON.stringify({ from, to: [to], reply_to: row.email, subject: `New SP Raja enquiry: ${row.service}`, text: `Reference: ${row.enquiry_id}\nCustomer: ${row.customer_name}\nEmail: ${row.email}\nService: ${row.service}\n\n${row.message}` }), signal: AbortSignal.timeout(15000) });
          if (!response.ok) throw new Error('email_provider_error');
          const result = await response.json();
          if (!result.id) throw new Error('email_provider_error');
          providerId=result.id;
        } catch { error='email_delivery_retry_required'; }
        await rpc('finish_enquiry_notification', { p_enquiry_id: row.enquiry_id, p_lease_id: row.lease_id, p_provider_id: providerId, p_error: error });
        providerId ? sent++ : deferred++;
      }
      return json({ sent, deferred });
    } catch { return json({ error: 'notification_worker_failed' }, 503); }
  };
}
