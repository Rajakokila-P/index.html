import { createHandler } from './handler.mjs';
Deno.serve(createHandler({
  secret: Deno.env.get('NOTIFICATION_WORKER_SECRET'),
  supabaseUrl: Deno.env.get('SUPABASE_URL'),
  serviceKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
  resendKey: Deno.env.get('RESEND_API_KEY'),
  from: Deno.env.get('ENQUIRY_FROM'),
  to: Deno.env.get('ENQUIRY_TO'),
}));
