-- Run only after the notification function and Vault secrets are configured.
-- Vault names: portfolio_supabase_url and portfolio_notification_worker_secret.
-- The latter must match NOTIFICATION_WORKER_SECRET on the Edge Function.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

do $$
declare v_job bigint;
begin
  if not exists(select 1 from vault.decrypted_secrets where name='portfolio_supabase_url')
    or not exists(select 1 from vault.decrypted_secrets where name='portfolio_notification_worker_secret')
  then raise exception 'Configure the notification worker Vault secrets first'; end if;
  select jobid into v_job from cron.job where jobname='sp-raja-enquiry-notifications';
  if v_job is not null then perform cron.unschedule(v_job); end if;
end;
$$;

select cron.schedule('sp-raja-enquiry-notifications','*/5 * * * *', $schedule$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name='portfolio_supabase_url') || '/functions/v1/notify-enquiries',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name='portfolio_notification_worker_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
$schedule$);
