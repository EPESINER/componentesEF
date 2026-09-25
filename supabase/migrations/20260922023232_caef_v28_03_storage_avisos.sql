insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avisos-caef', 'avisos-caef', false, 3145728, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists avisos_caef_select on storage.objects;
create policy avisos_caef_select on storage.objects
  for select to anon, authenticated
  using (
    bucket_id = 'avisos-caef'
    and (
      public.is_admin()
      or exists (
        select 1 from public.avisos a
        where a.imagem_path = name
          and a.situacao_publicacao = 'publicado'
          and (a.valido_ate is null or a.valido_ate >= current_date)
      )
    )
  );
drop policy if exists avisos_caef_insert on storage.objects;
create policy avisos_caef_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avisos-caef' and public.is_admin());
drop policy if exists avisos_caef_update on storage.objects;
create policy avisos_caef_update on storage.objects
  for update to authenticated
  using (bucket_id = 'avisos-caef' and public.is_admin())
  with check (bucket_id = 'avisos-caef' and public.is_admin());
drop policy if exists avisos_caef_delete on storage.objects;
create policy avisos_caef_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'avisos-caef' and public.is_admin());