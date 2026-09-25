create table if not exists public.avisos (
id text primary key,
titulo text not null,
texto text not null,
origem text,
data_original text,
valido_ate date,
revisao_editorial date,
situacao_publicacao text not null default 'pendente'
check (situacao_publicacao in ('publicado', 'pendente', 'arquivado')),
imagem_path text,
imagem_alt text,
ordem integer not null,
notificar_atualizacao boolean not null default false,
criado_em timestamptz not null default now(),
atualizado_em timestamptz not null default now(),
atualizado_por uuid references auth.users(id),
constraint avisos_imagem_alt_obrigatorio check (imagem_path is null or (imagem_alt is not null and length(trim(imagem_alt)) > 0))
);
comment on table public.avisos is 'Mural de Avisos. Fonte única quando content-config.useSupabaseContent=true. Contrato window.caefAvisosPublicados preservado pelo frontend.';
alter table public.avisos enable row level security;
drop policy if exists avisos_select_publico on public.avisos;
create policy avisos_select_publico on public.avisos
for select to anon, authenticated
using (
situacao_publicacao = 'publicado'
and (valido_ate is null or valido_ate >= current_date)
);
drop policy if exists avisos_select_admin on public.avisos;
create policy avisos_select_admin on public.avisos
for select to authenticated
using (public.is_admin());
drop policy if exists avisos_admin_insert on public.avisos;
create policy avisos_admin_insert on public.avisos
for insert to authenticated
with check (public.is_admin());
drop policy if exists avisos_admin_update on public.avisos;
create policy avisos_admin_update on public.avisos
for update to authenticated
using (public.is_admin())
with check (public.is_admin());
drop policy if exists avisos_admin_delete on public.avisos;
create policy avisos_admin_delete on public.avisos
for delete to authenticated
using (public.is_admin());
create index if not exists avisos_situacao_idx on public.avisos (situacao_publicacao);
revoke select on public.avisos from anon, authenticated;
grant select (
id, titulo, texto, origem, data_original, valido_ate,
situacao_publicacao, imagem_path, imagem_alt, ordem
) on public.avisos to anon, authenticated;
create table if not exists public.radar_itens (
id text primary key,
type text not null check (type in ('extensao', 'pesquisa', 'monitoria', 'evento')),
title text not null,
short_title text,
area text,
coordinator text,
contact text,
description text,
requirements text,
selection text,
selection_link text check (selection_link is null or selection_link = '' or selection_link ~* '^https?://'),
shifts text[] not null default '{}',
status_availability text not null default 'consultar' check (status_availability in ('vagas', 'consultar', 'encerrado')),
status_note text,
last_updated text,
authorized boolean not null default false,
audience text,
participation_type text,
workload text,
duration text,
postgrad boolean,
lab_name text,
modalities text[],
level text[],
dedication text,
ordem integer not null,
notificar_atualizacao boolean not null default false,
criado_em timestamptz not null default now(),
atualizado_em timestamptz not null default now(),
atualizado_por uuid references auth.users(id)
);
comment on table public.radar_itens is 'Radar CAEF. IDs preservados literalmente por causa dos links compartilháveis ?oportunidade=<id>#radar. Textos devem ser tratados como não confiáveis na renderização (ver correção de XSS no frontend).';
alter table public.radar_itens enable row level security;
drop policy if exists radar_select_publico on public.radar_itens;
create policy radar_select_publico on public.radar_itens
for select to anon, authenticated
using (authorized = true);
drop policy if exists radar_select_admin on public.radar_itens;
create policy radar_select_admin on public.radar_itens
for select to authenticated
using (public.is_admin());
drop policy if exists radar_admin_insert on public.radar_itens;
create policy radar_admin_insert on public.radar_itens
for insert to authenticated
with check (public.is_admin());
drop policy if exists radar_admin_update on public.radar_itens;
create policy radar_admin_update on public.radar_itens
for update to authenticated
using (public.is_admin())
with check (public.is_admin());
drop policy if exists radar_admin_delete on public.radar_itens;
create policy radar_admin_delete on public.radar_itens
for delete to authenticated
using (public.is_admin());
create index if not exists radar_authorized_idx on public.radar_itens (authorized);
create index if not exists radar_type_idx on public.radar_itens (type);
revoke select on public.radar_itens from anon, authenticated;
grant select (
id, type, title, short_title, area, coordinator, contact, description,
requirements, selection, selection_link, shifts, status_availability,
status_note, last_updated, authorized, audience, participation_type,
workload, duration, postgrad, lab_name, modalities, level, dedication, ordem
) on public.radar_itens to anon, authenticated;
create or replace view public.avisos_publico
with (security_invoker = true) as
select id, titulo, texto, origem, data_original, valido_ate,
situacao_publicacao, imagem_path, imagem_alt, ordem
from public.avisos;
comment on view public.avisos_publico is 'Leitura pública do Mural — só colunas destinadas à exibição. Nunca inclui revisao_editorial, notificar_atualizacao, atualizado_por, criado_em, atualizado_em. RLS da tabela avisos continua se aplicando (security_invoker=true).';
revoke all on public.avisos_publico from public;
grant select on public.avisos_publico to anon, authenticated;
create or replace view public.radar_itens_publico
with (security_invoker = true) as
select id, type, title, short_title, area, coordinator, contact, description,
requirements, selection, selection_link, shifts, status_availability,
status_note, last_updated, authorized, audience, participation_type,
workload, duration, postgrad, lab_name, modalities, level, dedication, ordem
from public.radar_itens;
comment on view public.radar_itens_publico is 'Leitura pública do Radar — só colunas destinadas à exibição. Nunca inclui notificar_atualizacao, atualizado_por, criado_em, atualizado_em. RLS da tabela radar_itens continua se aplicando (security_invoker=true).';
revoke all on public.radar_itens_publico from public;
grant select on public.radar_itens_publico to anon, authenticated;