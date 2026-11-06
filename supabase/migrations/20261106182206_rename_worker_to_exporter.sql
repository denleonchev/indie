create or replace function public.queue_export(p_export_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  perform pgmq.send('exports', jsonb_build_object('export_id', p_export_id));
  perform public.call_scheduled_function('exporter');
end;
$$;

select cron.unschedule('export-worker');
select cron.schedule('exporter', '* * * * *', $$select public.call_scheduled_function('exporter')$$);
