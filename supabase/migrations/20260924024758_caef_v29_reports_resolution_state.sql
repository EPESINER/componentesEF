
alter table public.caef_demandas_denuncias
  add column if not exists resolvida_em timestamptz null,
  add column if not exists resolvida_por uuid null references auth.users(id) on delete set null;
create index if not exists caef_demandas_denuncias_pendentes_idx
  on public.caef_demandas_denuncias(criado_em desc) where resolvida_em is null;

grant update on public.caef_demandas_denuncias to authenticated;
drop policy if exists caef_demandas_denuncias_update_admin on public.caef_demandas_denuncias;
create policy caef_demandas_denuncias_update_admin on public.caef_demandas_denuncias
for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));
