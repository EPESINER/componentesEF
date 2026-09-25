create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  tabela text not null,
  operacao text not null check (operacao in ('INSERT', 'UPDATE', 'DELETE')),
  registro_id text not null,
  responsavel uuid,
  responsavel_email text,
  dados_antigos jsonb,
  dados_novos jsonb,
  criado_em timestamptz not null default now()
);
comment on table public.audit_log is 'Auditoria automática (trigger) de alterações administrativas em avisos e radar_itens. responsavel vem de auth.uid() no servidor, nunca de um valor enviado pelo navegador.';
alter table public.audit_log enable row level security;
drop policy if exists audit_log_select_admin on public.audit_log;
create policy audit_log_select_admin on public.audit_log
  for select to authenticated
  using (public.is_admin());
create index if not exists audit_log_tabela_idx on public.audit_log (tabela, criado_em desc);
create or replace function public.audit_trigger_fn()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_registro_id text;
  v_email text;
begin
  v_registro_id := coalesce(new.id, old.id);
  select email into v_email from auth.users where id = auth.uid();
  insert into public.audit_log (tabela, operacao, registro_id, responsavel, responsavel_email, dados_antigos, dados_novos)
  values (
    TG_TABLE_NAME,
    TG_OP,
    v_registro_id,
    auth.uid(),
    v_email,
    case when TG_OP in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when TG_OP in ('UPDATE', 'INSERT') then to_jsonb(new) else null end
  );
  return coalesce(new, old);
end;
$$;
drop trigger if exists avisos_audit_trigger on public.avisos;
create trigger avisos_audit_trigger
  after insert or update or delete on public.avisos
  for each row execute function public.audit_trigger_fn();
drop trigger if exists radar_audit_trigger on public.radar_itens;
create trigger radar_audit_trigger
  after insert or update or delete on public.radar_itens
  for each row execute function public.audit_trigger_fn();