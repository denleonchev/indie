create extension if not exists pgmq;
select pgmq.create('exports');

create table public.exports (
  id uuid primary key default gen_random_uuid(),
  wallet text not null check (wallet ~ '^0x[0-9a-f]{40}$'),
  token text check (token ~ '^0x[0-9a-f]{40}$'),
  period_start timestamptz not null,
  period_end timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'ready', 'failed')),
  file_path text,
  created_at timestamptz not null default now(),
  finished_at timestamptz,
  check (period_start < period_end)
);

create unique index exports_one_pending_per_wallet
  on public.exports (wallet) where status = 'pending';
create index exports_wallet_created_at_idx
  on public.exports (wallet, created_at desc);

alter table public.exports enable row level security;
revoke all on table public.exports from anon, authenticated, service_role;
grant select on table public.exports to authenticated;
grant select, update, delete on table public.exports to service_role;

create policy "Users can view own exports"
  on public.exports for select
  to authenticated
  using ( wallet = (select auth.jwt() ->> 'wallet') );

create function public.request_export(
  p_period_start timestamptz,
  p_period_end timestamptz,
  p_token text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_wallet text := auth.jwt() ->> 'wallet';
  v_period_start timestamptz;
  v_period_end timestamptz := least(p_period_end, now());
  v_export_id uuid;
begin
  if v_wallet is null then
    raise exception 'Sign in with a wallet to export your transfers';
  end if;

  select greatest(p_period_start, now() - make_interval(days => retention_days))
  into v_period_start
  from public.settings;
  if v_period_start >= v_period_end then
    raise exception 'The period must end after it starts and overlap the last days of history';
  end if;

  if p_token is not null and not exists (select 1 from public.tokens where address = p_token) then
    raise exception 'Unknown token %', p_token;
  end if;

  if exists (select 1 from public.exports where wallet = v_wallet and status = 'pending') then
    raise exception 'An export is already being prepared';
  end if;

  begin
    insert into public.exports (wallet, token, period_start, period_end)
    values (v_wallet, p_token, v_period_start, v_period_end)
    returning id into v_export_id;
  exception
    when unique_violation then
      raise exception 'An export is already being prepared';
  end;

  perform pgmq.send('exports', jsonb_build_object('export_id', v_export_id));
  return v_export_id;
end;
$$;

revoke execute on function public.request_export from public, anon;
grant execute on function public.request_export to authenticated;

create function public.read_export_jobs(p_count integer)
returns setof pgmq.message_record
language sql
set search_path = ''
as $$
  select * from pgmq.read('exports', 300, p_count);
$$;

create function public.delete_export_job(p_message_id bigint)
returns boolean
language sql
set search_path = ''
as $$
  select pgmq.delete('exports', p_message_id);
$$;

revoke execute on function public.read_export_jobs from public, anon, authenticated;
revoke execute on function public.delete_export_job from public, anon, authenticated;
grant execute on function public.read_export_jobs to service_role;
grant execute on function public.delete_export_job to service_role;
grant usage on schema pgmq to service_role;
grant select, update, delete on table pgmq.q_exports to service_role;
