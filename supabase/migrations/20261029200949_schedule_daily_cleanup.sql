select cron.schedule(
  'daily-cleanup',
  '0 3 * * *',
  $$
    delete from public.transfers
    where block_time < now() - make_interval(days => (select retention_days from public.settings));

    delete from cron.job_run_details
    where end_time < now() - interval '7 days';
  $$
);
