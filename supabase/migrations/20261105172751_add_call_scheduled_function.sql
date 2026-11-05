create function public.call_scheduled_function(p_name text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
      || '/functions/v1/' || p_name,
    headers := jsonb_build_object(
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    timeout_milliseconds := 30000
  );
end;
$$;

revoke execute on function public.call_scheduled_function from public, anon, authenticated;

select cron.schedule('indexer', '* * * * *', $$select public.call_scheduled_function('indexer')$$);
select cron.schedule('export-worker', '* * * * *', $$select public.call_scheduled_function('worker')$$);
