create function public.require_signed_in_wallet()
returns text
language plpgsql
stable
set search_path = ''
as $$
declare
  v_wallet text := auth.jwt() ->> 'wallet';
begin
  if v_wallet is null then
    raise exception 'Sign in with a wallet first';
  end if;
  return v_wallet;
end;
$$;

create function public.fit_export_period(
  p_period_start timestamptz,
  p_period_end timestamptz,
  out period_start timestamptz,
  out period_end timestamptz
)
language plpgsql
stable
set search_path = ''
as $$
begin
  period_end := least(p_period_end, now());
  select greatest(p_period_start, now() - make_interval(days => retention_days))
  into period_start
  from public.settings;
  if period_start >= period_end then
    raise exception 'The period must end after it starts and overlap the last days of history';
  end if;
end;
$$;

create function public.check_export_token(p_token text)
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  if p_token is not null and not exists (select 1 from public.tokens where address = p_token) then
    raise exception 'Unknown token %', p_token;
  end if;
end;
$$;

create function public.insert_pending_export(
  p_wallet text,
  p_token text,
  p_period_start timestamptz,
  p_period_end timestamptz
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_export_id uuid;
begin
  if exists (select 1 from public.exports where wallet = p_wallet and status = 'pending') then
    raise exception 'An export is already being prepared';
  end if;
  insert into public.exports (wallet, token, period_start, period_end)
  values (p_wallet, p_token, p_period_start, p_period_end)
  returning id into v_export_id;
  return v_export_id;
exception
  when unique_violation then
    raise exception 'An export is already being prepared';
end;
$$;

create function public.queue_export(p_export_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  perform pgmq.send('exports', jsonb_build_object('export_id', p_export_id));
  perform public.call_scheduled_function('worker');
end;
$$;

revoke execute on function
  public.require_signed_in_wallet,
  public.fit_export_period,
  public.check_export_token,
  public.insert_pending_export,
  public.queue_export
from public, anon, authenticated;

create or replace function public.request_export(
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
  v_wallet text := public.require_signed_in_wallet();
  v_period record;
  v_export_id uuid;
begin
  select * into v_period from public.fit_export_period(p_period_start, p_period_end);
  perform public.check_export_token(p_token);
  v_export_id := public.insert_pending_export(v_wallet, p_token, v_period.period_start, v_period.period_end);
  perform public.queue_export(v_export_id);
  return v_export_id;
end;
$$;
