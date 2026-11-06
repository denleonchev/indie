select cron.schedule('export-cleaner', '30 3 * * *', $$select public.call_scheduled_function('cleaner')$$);
