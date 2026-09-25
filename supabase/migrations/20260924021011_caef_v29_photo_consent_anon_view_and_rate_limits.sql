
drop policy caef_demandas_insert_own_pending on public.caef_demandas;
create policy caef_demandas_insert_own_pending on public.caef_demandas for insert to authenticated
with check (
 autor_id=(select auth.uid())
 and moderacao='pendente' and situacao='recebida' and resposta_gestao is null
 and (
  (not mostrar_foto and foto_publica_path is null)
  or
  (mostrar_foto and foto_publica_path = autor_id::text || '/avatar'
    and exists (select 1 from public.student_profiles sp
      where sp.id=auth.uid() and sp.avatar_path=foto_publica_path)
  )
 )
);

drop view public.caef_demandas_publicas;
create view public.caef_demandas_publicas as
 select id,categoria,titulo,descricao,
   case when mostrar_nome then nome_publico else 'Estudante' end as nome_exibicao,
   (mostrar_foto and foto_publica_path is not null) as foto_disponivel,
   situacao,resposta_gestao,criado_em,atualizado_em
 from public.caef_demandas where moderacao='aprovada';
revoke all on public.caef_demandas_publicas from public;
grant select on public.caef_demandas_publicas to anon,authenticated;

create or replace function public.caef_demanda_alterar_identidade(
 p_demanda_id uuid,p_mostrar_nome boolean,p_nome_publico text,p_mostrar_foto boolean
) returns boolean language plpgsql security definer
set search_path = '' as $$
declare v_autor uuid := (select auth.uid()); v_avatar text;
begin
 if v_autor is null then raise exception 'Acesso não autorizado'; end if;
 select avatar_path into v_avatar from public.student_profiles where id=v_autor;
 update public.caef_demandas
 set mostrar_nome=coalesce(p_mostrar_nome,false),
     nome_publico=case when coalesce(p_mostrar_nome,false) then btrim(p_nome_publico) else 'Estudante' end,
     mostrar_foto=coalesce(p_mostrar_foto,false) and v_avatar=v_autor::text||'/avatar',
     foto_publica_path=case when coalesce(p_mostrar_foto,false) and v_avatar=v_autor::text||'/avatar' then v_avatar else null end,
     atualizado_em=now()
 where id=p_demanda_id and autor_id=v_autor and moderacao in ('pendente','aprovada');
 return found;
end $$;
revoke all on function public.caef_demanda_alterar_identidade(uuid,boolean,text,boolean) from public,anon;
grant execute on function public.caef_demanda_alterar_identidade(uuid,boolean,text,boolean) to authenticated;

create or replace function public.caef_v29_set_updated() returns trigger language plpgsql set search_path = '' as $$
begin new.atualizado_em=now(); return new; end $$;
create trigger caef_demandas_atualizado_em before update on public.caef_demandas
for each row execute function public.caef_v29_set_updated();
revoke all on function public.caef_v29_set_updated() from public,anon,authenticated;

create or replace function public.caef_v29_limit_posts() returns trigger language plpgsql
security definer set search_path = '' as $$
begin
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.autor_id::text,17));
 if (select count(*) from public.caef_demandas d where d.autor_id=new.autor_id and d.criado_em > now()-interval '24 hours') >= 5
 then raise exception 'Limite temporário de 5 sugestões por 24 horas.'; end if;
 return new;
end $$;
create trigger caef_demandas_limite_posts before insert on public.caef_demandas
for each row execute function public.caef_v29_limit_posts();
revoke all on function public.caef_v29_limit_posts() from public,anon,authenticated;

create or replace function public.caef_v29_limit_comments() returns trigger language plpgsql
security definer set search_path = '' as $$
begin
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.autor_id::text,19));
 if (select count(*) from public.caef_demandas_comentarios c where c.autor_id=new.autor_id and c.criado_em > now()-interval '24 hours') >= 30
 then raise exception 'Limite temporário de 30 respostas por 24 horas.'; end if;
 return new;
end $$;
create trigger caef_demandas_limite_comments before insert on public.caef_demandas_comentarios
for each row execute function public.caef_v29_limit_comments();
revoke all on function public.caef_v29_limit_comments() from public,anon,authenticated;
