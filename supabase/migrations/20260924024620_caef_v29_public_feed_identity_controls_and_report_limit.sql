
create or replace view public.caef_demandas_feed_publico as
select
 d.id,d.categoria,d.titulo,d.descricao,
 case when d.mostrar_nome then d.nome_publico else 'Estudante' end as nome_exibicao,
 case when d.mostrar_foto then d.foto_publica_path else null end as foto_publica_path,
 d.situacao,d.resposta_gestao,d.criado_em,d.atualizado_em,
 count(distinct v.autor_id) filter (where v.voto=1) as apoios,
 count(distinct v.autor_id) filter (where v.voto=-1) as discordancias,
 count(distinct c.id) filter (where c.moderacao='aprovada') as respostas
from public.caef_demandas d
left join public.caef_demandas_votos v on v.demanda_id=d.id
left join public.caef_demandas_comentarios c on c.demanda_id=d.id
where d.moderacao='aprovada'
group by d.id,d.categoria,d.titulo,d.descricao,d.mostrar_nome,d.nome_publico,d.mostrar_foto,d.foto_publica_path,d.situacao,d.resposta_gestao,d.criado_em,d.atualizado_em;
revoke all on public.caef_demandas_feed_publico from public;
grant select on public.caef_demandas_feed_publico to anon,authenticated;

create or replace function public.caef_v29_definir_identidade_demanda(
 p_id uuid,
 p_mostrar_nome boolean,
 p_mostrar_foto boolean
) returns boolean
language plpgsql
security definer
set search_path=''
as $$
declare
 v_user uuid := auth.uid();
 v_nome text;
 v_avatar text;
begin
 if v_user is null or not public.caef_v29_conta_academica_confirmada() then
   raise exception 'É necessário entrar com uma conta acadêmica confirmada.';
 end if;
 if not exists(select 1 from public.caef_demandas d where d.id=p_id and d.autor_id=v_user) then
   raise exception 'Sugestão não encontrada para esta conta.';
 end if;
 select nullif(btrim(p.display_name),''),p.avatar_path into v_nome,v_avatar
 from public.student_profiles p where p.id=v_user;

 update public.caef_demandas
 set mostrar_nome=(coalesce(p_mostrar_nome,false) and v_nome is not null),
     nome_publico=case when coalesce(p_mostrar_nome,false) and v_nome is not null then left(v_nome,80) else 'Estudante' end,
     mostrar_foto=(coalesce(p_mostrar_foto,false) and v_avatar=v_user::text||'/avatar'),
     foto_publica_path=case when coalesce(p_mostrar_foto,false) and v_avatar=v_user::text||'/avatar' then v_avatar else null end
 where id=p_id and autor_id=v_user;
 return found;
end
$$;
revoke all on function public.caef_v29_definir_identidade_demanda(uuid,boolean,boolean) from public;
grant execute on function public.caef_v29_definir_identidade_demanda(uuid,boolean,boolean) to authenticated;

create or replace function public.caef_v29_definir_identidade_comentario(
 p_id uuid,
 p_mostrar_nome boolean,
 p_mostrar_foto boolean
) returns boolean
language plpgsql
security definer
set search_path=''
as $$
declare
 v_user uuid := auth.uid();
 v_nome text;
 v_avatar text;
begin
 if v_user is null or not public.caef_v29_conta_academica_confirmada() then
   raise exception 'É necessário entrar com uma conta acadêmica confirmada.';
 end if;
 if not exists(select 1 from public.caef_demandas_comentarios c where c.id=p_id and c.autor_id=v_user) then
   raise exception 'Resposta não encontrada para esta conta.';
 end if;
 select nullif(btrim(p.display_name),''),p.avatar_path into v_nome,v_avatar
 from public.student_profiles p where p.id=v_user;

 update public.caef_demandas_comentarios
 set mostrar_nome=(coalesce(p_mostrar_nome,false) and v_nome is not null),
     nome_publico=case when coalesce(p_mostrar_nome,false) and v_nome is not null then left(v_nome,80) else 'Estudante' end,
     mostrar_foto=(coalesce(p_mostrar_foto,false) and v_avatar=v_user::text||'/avatar'),
     foto_publica_path=case when coalesce(p_mostrar_foto,false) and v_avatar=v_user::text||'/avatar' then v_avatar else null end
 where id=p_id and autor_id=v_user;
 return found;
end
$$;
revoke all on function public.caef_v29_definir_identidade_comentario(uuid,boolean,boolean) from public;
grant execute on function public.caef_v29_definir_identidade_comentario(uuid,boolean,boolean) to authenticated;

create or replace function public.caef_v29_limit_reports()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.denunciante_id::text,23));
 if (select count(*) from public.caef_demandas_denuncias d where d.denunciante_id=new.denunciante_id and d.criado_em > now()-interval '24 hours') >= 15
 then raise exception 'Limite temporário de 15 denúncias por 24 horas.'; end if;
 return new;
end
$$;
revoke all on function public.caef_v29_limit_reports() from public;
drop trigger if exists caef_demandas_limite_reports on public.caef_demandas_denuncias;
create trigger caef_demandas_limite_reports
before insert on public.caef_demandas_denuncias
for each row execute function public.caef_v29_limit_reports();
