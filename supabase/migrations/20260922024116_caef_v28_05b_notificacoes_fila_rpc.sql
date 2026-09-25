
create or replace function public.email_queue_reservar_lote(
 p_execucao_id uuid,
 p_limite integer default 50,
 p_limite_travado_minutos integer default 10,
 p_intervalo_capacidade_minutos integer default 30,
 p_intervalo_taxa_minutos integer default 2
)
returns table (id bigint, destinatario_user_id uuid, destinatario_email text, modulo text, titulo text, resumo text, link text, tentativas integer)
language sql security definer set search_path=public as $$
 with selecionados as (
  select eq.id from public.email_queue eq
  where eq.status='pendente'
   or (eq.status='enviando' and eq.enviando_desde < now()-make_interval(mins=>p_limite_travado_minutos))
   or (eq.status='aguardando_capacidade' and eq.adiado_curto_prazo and eq.adiado_por_limite_em < now()-make_interval(mins=>p_intervalo_taxa_minutos))
   or (eq.status='aguardando_capacidade' and not eq.adiado_curto_prazo and eq.adiado_por_limite_em < now()-make_interval(mins=>p_intervalo_capacidade_minutos))
  order by eq.criado_em limit p_limite for update skip locked
 ), atualizados as (
  update public.email_queue eq
  set status='enviando',enviando_desde=now(),enviando_execucao_id=p_execucao_id
  from selecionados where eq.id=selecionados.id
  returning eq.id,eq.destinatario_user_id,eq.modulo,eq.titulo,eq.resumo,eq.link,eq.tentativas
 )
 select a.id,a.destinatario_user_id,u.email,a.modulo,a.titulo,a.resumo,a.link,a.tentativas
 from atualizados a join auth.users u on u.id=a.destinatario_user_id;
$$;
revoke all on function public.email_queue_reservar_lote(uuid,integer,integer,integer,integer) from public;
grant execute on function public.email_queue_reservar_lote(uuid,integer,integer,integer,integer) to service_role;
create or replace function public.email_queue_preferencia_ativa(p_user_id uuid)
returns boolean language sql security definer set search_path=public stable as $$
 select coalesce((select receber_notificacoes from public.notification_preferences where user_id=p_user_id),false);
$$;
revoke all on function public.email_queue_preferencia_ativa(uuid) from public;
grant execute on function public.email_queue_preferencia_ativa(uuid) to service_role;
create or replace function public.email_queue_marcar_enviado(p_id bigint,p_execucao_id uuid)
returns boolean language sql security definer set search_path=public as $$
 update public.email_queue
 set status='enviado',enviado_em=now(),enviando_desde=null,adiado_por_limite_em=null,enviando_execucao_id=null
 where id=p_id and enviando_execucao_id=p_execucao_id
 returning true;
$$;
revoke all on function public.email_queue_marcar_enviado(bigint,uuid) from public;
grant execute on function public.email_queue_marcar_enviado(bigint,uuid) to service_role;
create or replace function public.email_queue_marcar_descartado(p_id bigint,p_execucao_id uuid)
returns boolean language sql security definer set search_path=public as $$
 update public.email_queue set status='descartado',enviando_desde=null,adiado_por_limite_em=null,enviando_execucao_id=null
 where id=p_id and enviando_execucao_id=p_execucao_id
 returning true;
$$;
revoke all on function public.email_queue_marcar_descartado(bigint,uuid) from public;
grant execute on function public.email_queue_marcar_descartado(bigint,uuid) to service_role;
create or replace function public.email_queue_marcar_aguardando_capacidade(p_id bigint,p_execucao_id uuid,p_motivo text default null,p_curto_prazo boolean default false)
returns boolean language sql security definer set search_path=public as $$
 update public.email_queue
 set status='aguardando_capacidade',enviando_desde=null,adiado_por_limite_em=now(),
  adiado_curto_prazo=p_curto_prazo,enviando_execucao_id=null,erro=coalesce(left(p_motivo,2000),erro)
 where id=p_id and enviando_execucao_id=p_execucao_id returning true;
$$;
revoke all on function public.email_queue_marcar_aguardando_capacidade(bigint,uuid,text,boolean) from public;
grant execute on function public.email_queue_marcar_aguardando_capacidade(bigint,uuid,text,boolean) to service_role;
create or replace function public.email_queue_marcar_falha(p_id bigint,p_execucao_id uuid,p_erro text,p_max_tentativas integer default 5)
returns boolean language plpgsql security definer set search_path=public as $$
declare v_afetado boolean;
begin
 update public.email_queue
 set tentativas=tentativas+1, erro=left(p_erro,2000),
  status=case when tentativas+1>=p_max_tentativas then 'falhou' else 'pendente' end,
  enviando_desde=null,adiado_por_limite_em=null,enviando_execucao_id=null
 where id=p_id and enviando_execucao_id=p_execucao_id
 returning true into v_afetado;
 return coalesce(v_afetado,false);
end;
$$;
revoke all on function public.email_queue_marcar_falha(bigint,uuid,text,integer) from public;
grant execute on function public.email_queue_marcar_falha(bigint,uuid,text,integer) to service_role;
