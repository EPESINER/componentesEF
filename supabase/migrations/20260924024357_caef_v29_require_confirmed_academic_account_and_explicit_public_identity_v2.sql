
create or replace function public.caef_v29_conta_academica_confirmada()
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select exists(
    select 1
    from auth.users u
    where u.id=auth.uid()
      and u.email_confirmed_at is not null
      and lower(u.email) like '%@academico.ufpb.br'
  )
$$;
revoke all on function public.caef_v29_conta_academica_confirmada() from public;
grant execute on function public.caef_v29_conta_academica_confirmada() to authenticated;

alter table public.caef_demandas_comentarios
  add column if not exists mostrar_foto boolean not null default false,
  add column if not exists foto_publica_path text null;
alter table public.caef_demandas_comentarios
  drop constraint if exists caef_demandas_comentarios_foto_coerente;
alter table public.caef_demandas_comentarios
  add constraint caef_demandas_comentarios_foto_coerente
  check (not mostrar_foto or foto_publica_path is not null);

create or replace function public.caef_v29_preparar_identidade()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_nome text;
  v_avatar text;
begin
  if new.autor_id <> auth.uid() then
    raise exception 'Conta autora inválida.';
  end if;
  if not public.caef_v29_conta_academica_confirmada() then
    raise exception 'É necessário entrar com uma conta acadêmica confirmada.';
  end if;

  select nullif(btrim(p.display_name),''), p.avatar_path
    into v_nome,v_avatar
  from public.student_profiles p
  where p.id=new.autor_id;

  if new.mostrar_nome and v_nome is not null then
    new.nome_publico := left(v_nome,80);
  else
    new.mostrar_nome := false;
    new.nome_publico := 'Estudante';
  end if;

  if new.mostrar_foto
     and v_avatar = new.autor_id::text || '/avatar'
  then
    new.foto_publica_path := v_avatar;
  else
    new.mostrar_foto := false;
    new.foto_publica_path := null;
  end if;
  return new;
end
$$;
revoke all on function public.caef_v29_preparar_identidade() from public;

drop trigger if exists caef_demandas_preparar_identidade on public.caef_demandas;
create trigger caef_demandas_preparar_identidade
before insert on public.caef_demandas
for each row execute function public.caef_v29_preparar_identidade();

drop trigger if exists caef_demandas_comentarios_preparar_identidade on public.caef_demandas_comentarios;
create trigger caef_demandas_comentarios_preparar_identidade
before insert on public.caef_demandas_comentarios
for each row execute function public.caef_v29_preparar_identidade();

create or replace function public.caef_v29_avatar_publico(p_caminho text)
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select exists(
    select 1
    from public.student_profiles p
    where p.avatar_path=p_caminho
      and p.avatar_path=p.id::text||'/avatar'
      and (
        exists(
          select 1 from public.caef_demandas d
          where d.autor_id=p.id and d.moderacao='aprovada'
            and d.mostrar_foto=true and d.foto_publica_path=p_caminho
        )
        or exists(
          select 1
          from public.caef_demandas_comentarios c
          join public.caef_demandas d on d.id=c.demanda_id
          where c.autor_id=p.id and c.moderacao='aprovada'
            and d.moderacao='aprovada'
            and c.mostrar_foto=true and c.foto_publica_path=p_caminho
        )
      )
  )
$$;
revoke all on function public.caef_v29_avatar_publico(text) from public;
grant execute on function public.caef_v29_avatar_publico(text) to anon,authenticated;

drop view if exists public.caef_demandas_comentarios_publicos;
create view public.caef_demandas_comentarios_publicos as
select c.id,c.demanda_id,c.mensagem,
       case when c.mostrar_nome then c.nome_publico else 'Estudante' end as nome_exibicao,
       case when c.mostrar_foto then c.foto_publica_path else null end as foto_publica_path,
       c.criado_em
from public.caef_demandas_comentarios c
join public.caef_demandas d on d.id=c.demanda_id
where c.moderacao='aprovada' and d.moderacao='aprovada';
revoke all on public.caef_demandas_comentarios_publicos from public;
grant select on public.caef_demandas_comentarios_publicos to anon,authenticated;

drop policy if exists caef_demandas_insert_own_pending on public.caef_demandas;
create policy caef_demandas_insert_own_pending on public.caef_demandas
for insert to authenticated
with check (
  public.caef_v29_conta_academica_confirmada()
  and autor_id=(select auth.uid())
  and moderacao='pendente'
  and situacao='recebida'
  and resposta_gestao is null
  and (
    (not mostrar_foto and foto_publica_path is null)
    or (
      mostrar_foto
      and foto_publica_path=autor_id::text||'/avatar'
      and exists(select 1 from public.student_profiles sp where sp.id=auth.uid() and sp.avatar_path=caef_demandas.foto_publica_path)
    )
  )
);

drop policy if exists caef_demandas_votos_insert on public.caef_demandas_votos;
create policy caef_demandas_votos_insert on public.caef_demandas_votos
for insert to authenticated
with check (
 public.caef_v29_conta_academica_confirmada()
 and autor_id=(select auth.uid())
 and exists(select 1 from public.caef_demandas d where d.id=demanda_id and d.moderacao='aprovada')
);
drop policy if exists caef_demandas_votos_update on public.caef_demandas_votos;
create policy caef_demandas_votos_update on public.caef_demandas_votos
for update to authenticated
using (autor_id=(select auth.uid()) and public.caef_v29_conta_academica_confirmada())
with check (
 autor_id=(select auth.uid())
 and public.caef_v29_conta_academica_confirmada()
 and exists(select 1 from public.caef_demandas d where d.id=demanda_id and d.moderacao='aprovada')
);

drop policy if exists caef_demandas_comentarios_insert_own_pending on public.caef_demandas_comentarios;
create policy caef_demandas_comentarios_insert_own_pending on public.caef_demandas_comentarios
for insert to authenticated
with check (
 public.caef_v29_conta_academica_confirmada()
 and autor_id=(select auth.uid())
 and moderacao='pendente'
 and exists(select 1 from public.caef_demandas d where d.id=demanda_id and d.moderacao='aprovada')
);

drop policy if exists caef_demandas_denuncias_insert_own on public.caef_demandas_denuncias;
create policy caef_demandas_denuncias_insert_own on public.caef_demandas_denuncias
for insert to authenticated
with check (
 public.caef_v29_conta_academica_confirmada()
 and denunciante_id=(select auth.uid())
 and (
  (demanda_id is not null and exists(select 1 from public.caef_demandas d where d.id=demanda_id and d.moderacao='aprovada'))
  or
  (comentario_id is not null and exists(
    select 1 from public.caef_demandas_comentarios c
    join public.caef_demandas d on d.id=c.demanda_id
    where c.id=comentario_id and c.moderacao='aprovada' and d.moderacao='aprovada'
  ))
 )
);

drop policy if exists caef_percurso_insert_own on public.caef_percurso_etapas;
create policy caef_percurso_insert_own on public.caef_percurso_etapas
for insert to authenticated
with check (public.caef_v29_conta_academica_confirmada() and autor_id=(select auth.uid()));
drop policy if exists caef_percurso_update_own on public.caef_percurso_etapas;
create policy caef_percurso_update_own on public.caef_percurso_etapas
for update to authenticated
using (public.caef_v29_conta_academica_confirmada() and autor_id=(select auth.uid()))
with check (public.caef_v29_conta_academica_confirmada() and autor_id=(select auth.uid()));
