
create table if not exists public.notification_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade,
 receber_notificacoes boolean not null default false,
 atualizado_em timestamptz not null default now()
);
comment on table public.notification_preferences is 'Preferência explícita de notificação por e-mail. Default false — nunca ativado automaticamente pelo cadastro.';
alter table public.notification_preferences enable row level security;
drop policy if exists np_select_own on public.notification_preferences;
create policy np_select_own on public.notification_preferences for select to authenticated using (user_id = auth.uid());
drop policy if exists np_insert_own on public.notification_preferences;
create policy np_insert_own on public.notification_preferences for insert to authenticated with check (user_id = auth.uid());
drop policy if exists np_update_own on public.notification_preferences;
create policy np_update_own on public.notification_preferences for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create table if not exists public.email_queue (
 id bigint generated always as identity primary key,
 destinatario_user_id uuid not null references auth.users(id) on delete cascade,
 modulo text not null check (modulo in ('mural','radar')),
 titulo text not null,
 resumo text not null,
 link text,
 chave_dedup text not null,
 status text not null default 'pendente' check (status in ('pendente','enviando','enviado','falhou','descartado','aguardando_capacidade')),
 tentativas integer not null default 0,
 erro text,
 criado_em timestamptz not null default now(),
 enviado_em timestamptz,
 enviando_desde timestamptz,
 enviando_execucao_id uuid,
 adiado_por_limite_em timestamptz,
 adiado_curto_prazo boolean not null default false,
 unique(destinatario_user_id,chave_dedup)
);
comment on table public.email_queue is 'Fila de e-mails de notificação. Sem políticas de RLS para anon/authenticated (negado por padrão) — só a Edge Function, com service_role, processa. unique(destinatario_user_id, chave_dedup) evita duplicidade de envio para o mesmo evento.';
alter table public.email_queue add column if not exists enviando_execucao_id uuid;
alter table public.email_queue add column if not exists adiado_curto_prazo boolean not null default false;
alter table public.email_queue enable row level security;
create index if not exists email_queue_status_idx on public.email_queue (status, criado_em);
create or replace function public.avisos_notify_fn()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_evento text; v_resumo text;
begin
 if TG_OP='INSERT' then
   if NEW.situacao_publicacao='publicado' then v_evento:='publicacao'; end if;
 elsif TG_OP='UPDATE' then
   if OLD.situacao_publicacao is distinct from 'publicado' and NEW.situacao_publicacao='publicado' then v_evento:='publicacao';
   elsif OLD.situacao_publicacao='publicado' and NEW.situacao_publicacao is distinct from 'publicado' then v_evento:='retirada';
   elsif NEW.situacao_publicacao='publicado' and NEW.notificar_atualizacao=true
    and (OLD.titulo is distinct from NEW.titulo or OLD.texto is distinct from NEW.texto or OLD.imagem_path is distinct from NEW.imagem_path)
   then v_evento:='atualizacao';
   end if;
 end if;
 NEW.notificar_atualizacao:=false;
 if v_evento is null then return NEW; end if;
 v_resumo:=case v_evento
   when 'publicacao' then 'Novo aviso publicado no Mural CAEF.'
   when 'retirada' then 'Um aviso foi retirado do Mural CAEF.'
   else 'Um aviso do Mural CAEF foi atualizado.' end;
 insert into public.email_queue(destinatario_user_id,modulo,titulo,resumo,link,chave_dedup)
 select p.user_id,'mural',NEW.titulo,v_resumo,'/#mural',
 concat('mural:',NEW.id,':',v_evento,':',to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS'))
 from public.notification_preferences p where p.receber_notificacoes=true
 on conflict(destinatario_user_id,chave_dedup) do nothing;
 return NEW;
end;
$$;
drop trigger if exists avisos_notify_trigger on public.avisos;
create trigger avisos_notify_trigger before insert or update on public.avisos
 for each row execute function public.avisos_notify_fn();
create or replace function public.radar_notify_fn()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_evento text; v_resumo text;
begin
 if TG_OP='INSERT' then
   if NEW.authorized=true then v_evento:='publicacao'; end if;
 elsif TG_OP='UPDATE' then
   if OLD.authorized=false and NEW.authorized=true then v_evento:='publicacao';
   elsif OLD.authorized=true and NEW.authorized=false then v_evento:='retirada';
   elsif NEW.authorized=true and NEW.notificar_atualizacao=true
    and (OLD.title is distinct from NEW.title or OLD.description is distinct from NEW.description or OLD.status_availability is distinct from NEW.status_availability)
   then v_evento:='atualizacao';
   end if;
 end if;
 NEW.notificar_atualizacao:=false;
 if v_evento is null then return NEW; end if;
 v_resumo:=case v_evento
   when 'publicacao' then 'Nova oportunidade autorizada no Radar CAEF.'
   when 'retirada' then 'Uma oportunidade foi retirada do Radar CAEF.'
   else 'Uma oportunidade do Radar CAEF foi atualizada.' end;
 insert into public.email_queue(destinatario_user_id,modulo,titulo,resumo,link,chave_dedup)
 select p.user_id,'radar',NEW.title,v_resumo,concat('/?oportunidade=',NEW.id,'#radar'),
 concat('radar:',NEW.id,':',v_evento,':',to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS'))
 from public.notification_preferences p where p.receber_notificacoes=true
 on conflict(destinatario_user_id,chave_dedup) do nothing;
 return NEW;
end;
$$;
drop trigger if exists radar_notify_trigger on public.radar_itens;
create trigger radar_notify_trigger before insert or update on public.radar_itens
 for each row execute function public.radar_notify_fn();
