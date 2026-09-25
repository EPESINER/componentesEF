-- V24: funções de cadastro por e-mail acadêmico e exclusão da própria conta.
-- A função de cadastro só terá efeito após ativar Before User Created no painel Auth.
create or replace function public.caef_restrict_signup(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_email text := lower(trim(coalesce(event -> 'user' ->> 'email', '')));
begin
  if requested_email ~ '^[^[:space:]@]+@academico[.]ufpb[.]br$' then
    return '{}'::jsonb;
  end if;
  return jsonb_build_object('error', jsonb_build_object(
    'http_code', 403,
    'message', 'Este cadastro exige e-mail academico da UFPB.'
  ));
end;
$$;
revoke all on function public.caef_restrict_signup(jsonb) from public, anon, authenticated;
grant execute on function public.caef_restrict_signup(jsonb) to supabase_auth_admin;

-- Exclui somente a conta correspondente à sessão autenticada.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  requesting_user uuid := auth.uid();
  affected integer;
begin
  if requesting_user is null then
    raise exception 'Sessao obrigatoria';
  end if;
  delete from auth.users where id = requesting_user;
  get diagnostics affected = row_count;
  if affected <> 1 then
    raise exception 'Conta nao localizada';
  end if;
end;
$$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;