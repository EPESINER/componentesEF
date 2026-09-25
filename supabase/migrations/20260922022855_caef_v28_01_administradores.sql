create table if not exists public.admin_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  papel text not null default 'admin' check (papel in ('admin')),
  concedido_em timestamptz not null default now(),
  observacao text
);
comment on table public.admin_roles is
  'Lista de administradores do Painel de Gestão CAEF. Concessão e revogação são 100% manuais (Table Editor ou SQL), nunca por uma tela do site. Ver instrucoes-admin-v28.md.';
alter table public.admin_roles enable row level security;
drop policy if exists admin_roles_select_self on public.admin_roles;
create policy admin_roles_select_self on public.admin_roles
  for select to authenticated
  using (user_id = auth.uid());
drop function if exists public.is_admin(uuid);
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admin_roles r where r.user_id = auth.uid()
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, anon;