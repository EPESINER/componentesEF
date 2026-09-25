
create table public.caef_demandas (
 id uuid primary key default gen_random_uuid(),
 autor_id uuid not null references auth.users(id) on delete cascade,
 categoria text not null check (categoria in ('ensino','formacao','acervo','eventos','infraestrutura','outras')),
 titulo text not null check (char_length(btrim(titulo)) between 8 and 140),
 descricao text not null check (char_length(btrim(descricao)) between 15 and 3000),
 nome_publico text not null default 'Estudante' check (char_length(btrim(nome_publico)) between 2 and 80),
 mostrar_nome boolean not null default false,
 mostrar_foto boolean not null default false,
 foto_publica_path text null,
 moderacao text not null default 'pendente' check (moderacao in ('pendente','aprovada','recusada','oculta')),
 situacao text not null default 'recebida' check (situacao in ('recebida','em_analise','encaminhada','concluida')),
 resposta_gestao text null check (resposta_gestao is null or char_length(resposta_gestao) <= 2500),
 criado_em timestamptz not null default now(),
 atualizado_em timestamptz not null default now(),
 constraint foto_optin_coerente check (not mostrar_foto or foto_publica_path is not null),
 constraint foto_path_restrita check (foto_publica_path is null or (char_length(foto_publica_path) between 5 and 240 and foto_publica_path !~ '[[:space:]]'))
);
create index caef_demandas_moderacao_data_idx on public.caef_demandas(moderacao,criado_em desc);
create index caef_demandas_autor_data_idx on public.caef_demandas(autor_id,criado_em desc);

create table public.caef_demandas_votos (
 demanda_id uuid not null references public.caef_demandas(id) on delete cascade,
 autor_id uuid not null references auth.users(id) on delete cascade,
 voto smallint not null check (voto in (-1,1)),
 criado_em timestamptz not null default now(),
 primary key(demanda_id,autor_id)
);
create index caef_demandas_votos_autor_idx on public.caef_demandas_votos(autor_id);

create table public.caef_demandas_comentarios (
 id uuid primary key default gen_random_uuid(),
 demanda_id uuid not null references public.caef_demandas(id) on delete cascade,
 autor_id uuid not null references auth.users(id) on delete cascade,
 mensagem text not null check (char_length(btrim(mensagem)) between 2 and 1500),
 nome_publico text not null default 'Estudante' check (char_length(btrim(nome_publico)) between 2 and 80),
 mostrar_nome boolean not null default false,
 moderacao text not null default 'pendente' check (moderacao in ('pendente','aprovada','recusada','oculta')),
 criado_em timestamptz not null default now()
);
create index caef_demandas_comentarios_demanda_idx on public.caef_demandas_comentarios(demanda_id,moderacao,criado_em);

create table public.caef_demandas_denuncias (
 id bigint generated always as identity primary key,
 denunciante_id uuid not null references auth.users(id) on delete cascade,
 demanda_id uuid null references public.caef_demandas(id) on delete cascade,
 comentario_id uuid null references public.caef_demandas_comentarios(id) on delete cascade,
 motivo text not null check (char_length(btrim(motivo)) between 8 and 500),
 criado_em timestamptz not null default now(),
 constraint apenas_um_alvo check ((demanda_id is not null) <> (comentario_id is not null))
);
create unique index caef_demandas_denuncias_post_uma_por_usuario on public.caef_demandas_denuncias(denunciante_id,demanda_id) where demanda_id is not null;
create unique index caef_demandas_denuncias_comentario_uma_por_usuario on public.caef_demandas_denuncias(denunciante_id,comentario_id) where comentario_id is not null;

create table public.caef_percurso_etapas (
 autor_id uuid not null references auth.users(id) on delete cascade,
 etapa text not null check (etapa in ('explorar_habilitacoes','consultar_grade','planejar_periodo','explorar_trilhas','consultar_acervo','conhecer_projetos','acompanhar_radar','consultar_estagios','planejar_tcc')),
 concluida boolean not null default false,
 atualizado_em timestamptz not null default now(),
 primary key(autor_id,etapa)
);

alter table public.caef_demandas enable row level security;
alter table public.caef_demandas_votos enable row level security;
alter table public.caef_demandas_comentarios enable row level security;
alter table public.caef_demandas_denuncias enable row level security;
alter table public.caef_percurso_etapas enable row level security;

revoke all on public.caef_demandas,public.caef_demandas_votos,public.caef_demandas_comentarios,public.caef_demandas_denuncias,public.caef_percurso_etapas from public,anon,authenticated;
grant select,insert,update,delete on public.caef_demandas to authenticated;
grant select,insert,update,delete on public.caef_demandas_votos to authenticated;
grant select,insert,update,delete on public.caef_demandas_comentarios to authenticated;
grant select,insert on public.caef_demandas_denuncias to authenticated;
grant select,insert,update,delete on public.caef_percurso_etapas to authenticated;
grant usage,select on sequence public.caef_demandas_denuncias_id_seq to authenticated;

create policy caef_demandas_select_own_admin on public.caef_demandas for select to authenticated
 using (autor_id=(select auth.uid()) or (select public.is_admin()));
create policy caef_demandas_insert_own_pending on public.caef_demandas for insert to authenticated
 with check (autor_id=(select auth.uid()) and moderacao='pendente' and situacao='recebida' and resposta_gestao is null and not mostrar_foto and foto_publica_path is null);
create policy caef_demandas_update_admin on public.caef_demandas for update to authenticated
 using ((select public.is_admin())) with check ((select public.is_admin()));
create policy caef_demandas_delete_own_admin on public.caef_demandas for delete to authenticated
 using (autor_id=(select auth.uid()) or (select public.is_admin()));

create policy caef_demandas_votos_select_own on public.caef_demandas_votos for select to authenticated
 using (autor_id=(select auth.uid()));
create policy caef_demandas_votos_insert on public.caef_demandas_votos for insert to authenticated
 with check (autor_id=(select auth.uid()) and exists(select 1 from public.caef_demandas d where d.id=demanda_id and d.moderacao='aprovada'));
create policy caef_demandas_votos_update on public.caef_demandas_votos for update to authenticated
 using (autor_id=(select auth.uid()))
 with check (autor_id=(select auth.uid()) and exists(select 1 from public.caef_demandas d where d.id=demanda_id and d.moderacao='aprovada'));
create policy caef_demandas_votos_delete_own on public.caef_demandas_votos for delete to authenticated
 using (autor_id=(select auth.uid()));

create policy caef_demandas_comentarios_select_own_admin on public.caef_demandas_comentarios for select to authenticated
 using (autor_id=(select auth.uid()) or (select public.is_admin()));
create policy caef_demandas_comentarios_insert_own_pending on public.caef_demandas_comentarios for insert to authenticated
 with check (autor_id=(select auth.uid()) and moderacao='pendente' and exists(select 1 from public.caef_demandas d where d.id=demanda_id and d.moderacao='aprovada'));
create policy caef_demandas_comentarios_update_admin on public.caef_demandas_comentarios for update to authenticated
 using ((select public.is_admin())) with check ((select public.is_admin()));
create policy caef_demandas_comentarios_delete_own_admin on public.caef_demandas_comentarios for delete to authenticated
 using (autor_id=(select auth.uid()) or (select public.is_admin()));

create policy caef_demandas_denuncias_select_own_admin on public.caef_demandas_denuncias for select to authenticated
 using (denunciante_id=(select auth.uid()) or (select public.is_admin()));
create policy caef_demandas_denuncias_insert_own on public.caef_demandas_denuncias for insert to authenticated
 with check (
 denunciante_id=(select auth.uid()) and (
 (demanda_id is not null and exists(select 1 from public.caef_demandas d where d.id=demanda_id and d.moderacao='aprovada'))
 or (comentario_id is not null and exists(select 1 from public.caef_demandas_comentarios c join public.caef_demandas d on d.id=c.demanda_id where c.id=comentario_id and c.moderacao='aprovada' and d.moderacao='aprovada'))
 ));

create policy caef_percurso_select_own on public.caef_percurso_etapas for select to authenticated
 using (autor_id=(select auth.uid()));
create policy caef_percurso_insert_own on public.caef_percurso_etapas for insert to authenticated
 with check (autor_id=(select auth.uid()));
create policy caef_percurso_update_own on public.caef_percurso_etapas for update to authenticated
 using (autor_id=(select auth.uid())) with check (autor_id=(select auth.uid()));
create policy caef_percurso_delete_own on public.caef_percurso_etapas for delete to authenticated
 using (autor_id=(select auth.uid()));

create view public.caef_demandas_publicas as
select id,categoria,titulo,descricao,
 case when mostrar_nome then nome_publico else 'Estudante' end as nome_exibicao,
 case when mostrar_foto and foto_publica_path is not null then foto_publica_path else null end as foto_publica_path,
 situacao,resposta_gestao,criado_em,atualizado_em
from public.caef_demandas where moderacao='aprovada';

create view public.caef_demandas_comentarios_publicos as
select c.id,c.demanda_id,c.mensagem,
 case when c.mostrar_nome then c.nome_publico else 'Estudante' end as nome_exibicao,
 c.criado_em
from public.caef_demandas_comentarios c join public.caef_demandas d on d.id=c.demanda_id
where c.moderacao='aprovada' and d.moderacao='aprovada';

create view public.caef_demandas_votos_publicos as
select d.id as demanda_id,
 count(v.voto) filter (where v.voto=1) as apoios,
 count(v.voto) filter (where v.voto=-1) as discordancias
from public.caef_demandas d left join public.caef_demandas_votos v on v.demanda_id=d.id
where d.moderacao='aprovada' group by d.id;

revoke all on public.caef_demandas_publicas,public.caef_demandas_comentarios_publicos,public.caef_demandas_votos_publicos from public;
grant select on public.caef_demandas_publicas,public.caef_demandas_comentarios_publicos,public.caef_demandas_votos_publicos to anon,authenticated;

comment on view public.caef_demandas_publicas is 'Somente sugestoes aprovadas. Nao expoe UUID do autor nem email. Nome e foto exigem opcao explicita.';
comment on table public.caef_percurso_etapas is 'Checklist pessoal autodeclarado, nao corresponde a dados oficiais SIGAA.';

