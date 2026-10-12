begin;

create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null,
  customer_name text not null check (char_length(customer_name) between 2 and 100),
  email text not null,
  service text not null check (service in ('Website design','Documents','Dashboards','Cyber analysis','Data analysis','Network analysis','Other enquiry')),
  message text not null check (char_length(message) between 20 and 5000),
  status text not null default 'submitted' check (status in ('submitted','in_progress','completed')),
  created_at timestamptz not null default now(),
  unique(user_id, request_id)
);
create index enquiries_customer_created on public.enquiries(user_id, created_at desc);
alter table public.enquiries enable row level security;
revoke all on public.enquiries from anon, authenticated;
grant select on public.enquiries to authenticated;
create policy read_own_enquiries on public.enquiries for select to authenticated
  using ((select auth.uid()) = user_id);

create table public.enquiry_notifications (
  enquiry_id uuid primary key references public.enquiries(id) on delete cascade,
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  lease_id uuid,
  leased_until timestamptz,
  sent_at timestamptz,
  provider_message_id text,
  last_error text
);
alter table public.enquiry_notifications enable row level security;
revoke all on public.enquiry_notifications from anon, authenticated;

-- Only this function can insert a customer request. The caller cannot choose
-- another customer's ID, email, initial status, or notification state.
create function public.submit_enquiry(p_request_id uuid, p_name text, p_service text, p_message text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_email text;
  v_existing public.enquiries%rowtype;
  v_id uuid;
begin
  if v_user is null then raise exception 'authentication_required' using errcode='42501'; end if;
  select email into v_email from auth.users where id=v_user and email_confirmed_at is not null;
  if v_email is null then raise exception 'verified_email_required' using errcode='42501'; end if;
  if p_request_id is null or p_name is null or p_message is null or p_service is null
     or char_length(btrim(p_name)) not between 2 and 100
     or char_length(btrim(p_message)) not between 20 and 5000
     or p_service not in ('Website design','Documents','Dashboards','Cyber analysis','Data analysis','Network analysis','Other enquiry')
  then raise exception 'invalid_enquiry' using errcode='22023'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user::text, 0));
  select * into v_existing from public.enquiries where user_id=v_user and request_id=p_request_id;
  if found then
    if v_existing.customer_name<>btrim(p_name) or v_existing.service<>p_service or v_existing.message<>btrim(p_message)
    then raise exception 'request_id_conflict' using errcode='22023'; end if;
    return v_existing.id;
  end if;
  if (select count(*) from public.enquiries where user_id=v_user and created_at>now()-interval '1 hour') >= 5
  then raise exception 'rate_limit' using errcode='P0001'; end if;
  insert into public.enquiries(user_id,request_id,customer_name,email,service,message)
    values(v_user,p_request_id,btrim(p_name),v_email,p_service,btrim(p_message)) returning id into v_id;
  insert into public.enquiry_notifications(enquiry_id) values(v_id);
  return v_id;
end;
$$;
revoke all on function public.submit_enquiry(uuid,text,text,text) from public, anon;
grant execute on function public.submit_enquiry(uuid,text,text,text) to authenticated;

-- Service-only leased queue. A failed email never loses the saved enquiry.
create function public.claim_enquiry_notifications()
returns table(enquiry_id uuid, lease_id uuid, attempts integer, customer_name text, email text, service text, message text)
language sql security definer set search_path = '' as $$
  with picked as (
    select n.enquiry_id from public.enquiry_notifications n
    where n.sent_at is null and n.attempts<8 and n.next_attempt_at<=now()
      and (n.leased_until is null or n.leased_until<now())
    order by n.next_attempt_at for update skip locked limit 10
  ), claimed as (
    update public.enquiry_notifications n set
      lease_id=gen_random_uuid(), leased_until=now()+interval '5 minutes', attempts=n.attempts+1
    from picked p where n.enquiry_id=p.enquiry_id
    returning n.enquiry_id,n.lease_id,n.attempts
  )
  select c.enquiry_id,c.lease_id,c.attempts,e.customer_name,e.email,e.service,e.message
  from claimed c join public.enquiries e on e.id=c.enquiry_id;
$$;
revoke all on function public.claim_enquiry_notifications() from public, anon, authenticated;
grant execute on function public.claim_enquiry_notifications() to service_role;

create function public.finish_enquiry_notification(p_enquiry_id uuid,p_lease_id uuid,p_provider_id text,p_error text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.enquiry_notifications set
    sent_at=case when p_provider_id is not null then now() else null end,
    provider_message_id=p_provider_id,
    last_error=left(p_error,200),
    next_attempt_at=now()+interval '1 minute'*power(2,attempts),
    lease_id=null, leased_until=null
  where enquiry_id=p_enquiry_id and lease_id=p_lease_id;
end;
$$;
revoke all on function public.finish_enquiry_notification(uuid,uuid,text,text) from public, anon, authenticated;
grant execute on function public.finish_enquiry_notification(uuid,uuid,text,text) to service_role;
commit;
