select cron.schedule(
  'caef-process-email-queue-every-5-min',
  '*/5 * * * *',
  $job$
    select net.http_post(
      url := 'https://zutltokolonvbxbvosik.supabase.co/functions/v1/dispatch-email-queue',
      body := '{}'::jsonb,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'caef_scheduler_anon_key'),
        'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'caef_scheduler_anon_key'),
        'X-CAEF-Scheduler-Token', (select decrypted_secret from vault.decrypted_secrets where name = 'caef_scheduler_token')
      ),
      timeout_milliseconds := 65000
    ) as request_id
    where exists (
      select 1
      from public.email_queue q
      where q.status = 'pendente'
         or (q.status = 'enviando' and q.enviando_desde < now() - interval '10 minutes')
         or (q.status = 'aguardando_capacidade' and q.adiado_curto_prazo and q.adiado_por_limite_em < now() - interval '2 minutes')
         or (q.status = 'aguardando_capacidade' and not q.adiado_curto_prazo and q.adiado_por_limite_em < now() - interval '30 minutes')
    );
  $job$
) as job_id;