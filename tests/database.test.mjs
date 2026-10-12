import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('Customer database authorisation, validation, idempotency and queue', async t => {
  const db = new PGlite();
  const alice='11111111-1111-4111-8111-111111111111', bob='22222222-2222-4222-8222-222222222222', unverified='33333333-3333-4333-8333-333333333333';
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid$$;
    grant usage on schema public,auth to anon,authenticated,service_role;
    grant execute on function auth.uid() to anon,authenticated,service_role;
    insert into auth.users values ('${alice}','alice@example.test',now()),('${bob}','bob@example.test',now()),('${unverified}','pending@example.test',null);`);
  await db.exec(await readFile('supabase/migrations/202610120001_customer_enquiries.sql','utf8'));
  const asUser = async (id, role='authenticated') => {
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);
    await db.exec(`set role ${role}`);
  };
  const submit = (id=crypto.randomUUID(), message='Please build a dashboard for my customer data.') => db.query('select public.submit_enquiry($1,$2,$3,$4) as id',[id,'Alice Example','Dashboards',message]);
  try {
    await t.test('anonymous users cannot read or submit enquiries',async()=>{
      await asUser('', 'anon');
      await assert.rejects(db.query('select * from public.enquiries'),/permission denied/);
      await assert.rejects(submit(),/permission denied/);
    });
    await t.test('unverified email cannot submit',async()=>{
      await asUser(unverified); await assert.rejects(submit(),/verified_email_required/);
    });
    let enquiryId;
    await t.test('validated request is saved with one notification and duplicate retries are safe',async()=>{
      await asUser(alice); const key=crypto.randomUUID();
      const first=await submit(key); enquiryId=first.rows[0].id;
      assert.equal((await submit(key)).rows[0].id,enquiryId);
      assert.equal((await db.query('select * from public.enquiries')).rows.length,1);
      await assert.rejects(submit(key,'This is a changed message using the same request ID.'),/request_id_conflict/);
      await db.exec('reset role');
      assert.equal((await db.query('select * from public.enquiry_notifications')).rows.length,1);
    });
    await t.test('another customer cannot read Alice records',async()=>{
      await asUser(bob); assert.equal((await db.query('select * from public.enquiries')).rows.length,0);
      await submit(); assert.equal((await db.query('select * from public.enquiries')).rows.length,1);
      await asUser(alice); assert.equal((await db.query('select * from public.enquiries')).rows.length,1);
    });
    await t.test('direct insert, status changes, deletion and queue access are blocked',async()=>{
      await asUser(alice);
      await assert.rejects(db.query('update public.enquiries set status=$1 where id=$2',['completed',enquiryId]),/permission denied/);
      await assert.rejects(db.query('delete from public.enquiries where id=$1',[enquiryId]),/permission denied/);
      await assert.rejects(db.query('insert into public.enquiries(user_id) values($1)',[bob]),/permission denied/);
      await assert.rejects(db.query('select * from public.enquiry_notifications'),/permission denied/);
      await assert.rejects(db.query('select * from public.claim_enquiry_notifications()'),/permission denied/);
    });
    await t.test('invalid input and excess requests are rejected',async()=>{
      await asUser(alice); await assert.rejects(submit(undefined,'too short'),/invalid_enquiry/);
      for(let i=0;i<4;i++) await submit();
      await assert.rejects(submit(),/rate_limit/);
    });
    await t.test('worker leases prevent duplicate claims and require matching lease on completion',async()=>{
      await asUser('', 'service_role');
      const {rows}=await db.query('select * from public.claim_enquiry_notifications()');
      assert.equal(rows.length,6);
      assert.equal((await db.query('select * from public.claim_enquiry_notifications()')).rows.length,0);
      const row=rows[0];
      await db.query('select public.finish_enquiry_notification($1,$2,$3,$4)',[row.enquiry_id,crypto.randomUUID(),'not-matched',null]);
      await db.exec('reset role');
      assert.equal((await db.query('select sent_at from public.enquiry_notifications where enquiry_id=$1',[row.enquiry_id])).rows[0].sent_at,null);
      await asUser('', 'service_role');
      await db.query('select public.finish_enquiry_notification($1,$2,$3,$4)',[row.enquiry_id,row.lease_id,'email-123',null]);
      await db.exec('reset role');
      assert.ok((await db.query('select sent_at from public.enquiry_notifications where enquiry_id=$1',[row.enquiry_id])).rows[0].sent_at);
    });
  } finally { await db.close(); }
});
