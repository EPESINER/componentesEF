
create or replace function public.caef_v29_avatar_publico(p_caminho text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.caef_demandas d
    join public.student_profiles p on p.id=d.autor_id
    where d.moderacao='aprovada'
      and d.mostrar_foto=true
      and d.foto_publica_path=p_caminho
      and d.foto_publica_path=d.autor_id::text||'/avatar'
      and p.avatar_path=p_caminho
  )
$$;
revoke all on function public.caef_v29_avatar_publico(text) from public;
grant execute on function public.caef_v29_avatar_publico(text) to anon, authenticated;
create policy avatares_caef_publico_optin_demanda on storage.objects for select to anon,authenticated
using (bucket_id='avatares-caef' and public.caef_v29_avatar_publico(name));

create or replace view public.caef_demandas_publicas as
 select id,categoria,titulo,descricao,
   case when mostrar_nome then nome_publico else 'Estudante' end as nome_exibicao,
   (mostrar_foto and foto_publica_path is not null) as foto_disponivel,
   situacao,resposta_gestao,criado_em,atualizado_em,
   case when mostrar_foto and foto_publica_path is not null
         then foto_publica_path else null end as foto_path
 from public.caef_demandas where moderacao='aprovada';
revoke all on public.caef_demandas_publicas from public;
grant select on public.caef_demandas_publicas to anon,authenticated;

create or replace function public.caef_v29_guard_public_identity() returns trigger
language plpgsql set search_path = ''
as $$
begin
 if ((new.mostrar_nome is distinct from old.mostrar_nome)
  or (new.nome_publico is distinct from old.nome_publico)
  or (new.mostrar_foto is distinct from old.mostrar_foto)
  or (new.foto_publica_path is distinct from old.foto_publica_path))
  and (auth.uid() is null or auth.uid() <> old.autor_id)
 then raise exception 'Somente a pessoa autora pode alterar sua identidade pública'; end if;
 return new;
end $$;
create trigger caef_demandas_guard_public_identity before update on public.caef_demandas
for each row execute function public.caef_v29_guard_public_identity();
revoke all on function public.caef_v29_guard_public_identity() from public, anon, authenticated;
