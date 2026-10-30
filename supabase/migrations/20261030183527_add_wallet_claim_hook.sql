create function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  wallet text;
begin
  select lower(split_part(provider_id, ':', 3)) into wallet
  from auth.identities
  where user_id = (event ->> 'user_id')::uuid and provider = 'web3'
  limit 1;

  if wallet is null then
    return event;
  end if;
  return jsonb_set(event, '{claims,wallet}', to_jsonb(wallet));
end;
$$;

revoke execute on function public.custom_access_token_hook from public, anon, authenticated;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
