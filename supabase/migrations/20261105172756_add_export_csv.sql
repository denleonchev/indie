create function public.quote_csv_text(p_value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select '"' || replace(p_value, '"', '""') || '"';
$$;

create function public.format_token_amount(p_amount numeric, p_decimals smallint)
returns text
language sql
immutable
set search_path = ''
as $$
  select trim_scale(p_amount / power(10::numeric, p_decimals))::text;
$$;

create function public.format_export_lines(p_export_id uuid)
returns table (block_time timestamptz, log_index integer, line text)
language sql
stable
set search_path = ''
as $$
  select
    t.block_time,
    t.log_index,
    concat_ws(',',
      to_char(t.block_time at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      public.quote_csv_text(k.symbol),
      case
        when t.from_address = t.to_address then 'self'
        when t.to_address = e.wallet then 'in'
        else 'out'
      end,
      public.format_token_amount(t.amount, k.decimals),
      t.amount::text,
      t.from_address,
      t.to_address,
      t.tx_hash,
      t.block_number::text
    )
  from public.exports e
  join public.transfers t
    on (t.from_address = e.wallet or t.to_address = e.wallet)
    and t.block_time >= e.period_start
    and t.block_time < e.period_end
    and (e.token is null or t.token = e.token)
  join public.tokens k on k.chain_id = t.chain_id and k.address = t.token
  where e.id = p_export_id;
$$;

create function public.build_export_csv(p_export_id uuid)
returns text
language sql
stable
set search_path = ''
as $$
  select 'time,token,direction,amount,amount_raw,from,to,tx_hash,block_number' || E'\n'
    || coalesce(string_agg(line || E'\n', '' order by block_time, log_index), '')
  from public.format_export_lines(p_export_id);
$$;

revoke execute on function public.quote_csv_text, public.format_token_amount, public.format_export_lines, public.build_export_csv
  from public, anon, authenticated;
grant execute on function public.quote_csv_text, public.format_token_amount, public.format_export_lines, public.build_export_csv
  to service_role;
