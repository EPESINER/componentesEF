create table if not exists public.student_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  habilitacao text,
  periodo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_profiles_display_name_len
    check (display_name is null or char_length(trim(display_name)) <= 80),
  constraint student_profiles_habilitacao_valid
    check (habilitacao is null or habilitacao in ('bacharelado','licenciatura')),
  constraint student_profiles_periodo_len
    check (periodo is null or char_length(trim(periodo)) <= 40)
);
comment on table public.student_profiles is
  'Dados de perfil OPCIONAIS e autodeclarados pelo estudante. Não comprova matrícula, curso ou período reais.';
alter table public.student_profiles enable row level security;
drop policy if exists "student_profiles_select_own" on public.student_profiles;
create policy "student_profiles_select_own" on public.student_profiles
  for select to authenticated using (id = auth.uid());
drop policy if exists "student_profiles_insert_own" on public.student_profiles;
create policy "student_profiles_insert_own" on public.student_profiles
  for insert to authenticated with check (id = auth.uid());
drop policy if exists "student_profiles_update_own" on public.student_profiles;
create policy "student_profiles_update_own" on public.student_profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
revoke all on public.student_profiles from public, anon;
grant select, insert, update on public.student_profiles to authenticated;
create or replace function public.student_profiles_set_updated_at()
returns trigger language plpgsql set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists trg_student_profiles_updated_at on public.student_profiles;
create trigger trg_student_profiles_updated_at
  before update on public.student_profiles
  for each row execute function public.student_profiles_set_updated_at();