create extension if not exists pg_cron schema pg_catalog;
create extension if not exists pg_net schema extensions;

select cron.schedule (
  'indexer',
  '* * * * *',
  $$
    select
      net.http_post(
          url:=(select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/indexer',
          headers:=jsonb_build_object('x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')),
          timeout_milliseconds:=30000
      );
  $$
);
