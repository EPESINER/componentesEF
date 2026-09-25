
create or replace function public.admin_avisos_listar()
returns setof public.avisos language plpgsql security definer set search_path=public stable as $$
begin
 if not public.is_admin() then raise exception 'Apenas administradores podem listar o conteúdo completo do Mural.' using errcode='42501'; end if;
 return query select * from public.avisos order by ordem asc;
end;
$$;
revoke all on function public.admin_avisos_listar() from public;
grant execute on function public.admin_avisos_listar() to authenticated;
create or replace function public.admin_avisos_upsert(
 p_id text,p_novo_id text,p_titulo text,p_texto text,p_origem text,p_data_original text,
 p_valido_ate date,p_revisao_editorial date,p_situacao_publicacao text,p_ordem integer,
 p_notificar_atualizacao boolean
)
returns public.avisos language plpgsql security definer set search_path=public as $$
declare v_row public.avisos;
begin
 if not public.is_admin() then raise exception 'Apenas administradores podem salvar avisos.' using errcode='42501'; end if;
 if p_id is null or p_id='' then
  insert into public.avisos(id,titulo,texto,origem,data_original,valido_ate,revisao_editorial,situacao_publicacao,ordem,notificar_atualizacao,atualizado_por)
  values(p_novo_id,p_titulo,p_texto,p_origem,p_data_original,p_valido_ate,p_revisao_editorial,p_situacao_publicacao,p_ordem,p_notificar_atualizacao,auth.uid())
  returning * into v_row;
 else
  update public.avisos set titulo=p_titulo,texto=p_texto,origem=p_origem,data_original=p_data_original,
   valido_ate=p_valido_ate,revisao_editorial=p_revisao_editorial,situacao_publicacao=p_situacao_publicacao,
   ordem=p_ordem,notificar_atualizacao=p_notificar_atualizacao,atualizado_em=now(),atualizado_por=auth.uid()
  where id=p_id returning * into v_row;
  if v_row.id is null then raise exception 'Aviso não encontrado — pode já ter sido excluído por outra sessão. Atualize a lista.' using errcode='P0002'; end if;
 end if;
 return v_row;
end;
$$;
revoke all on function public.admin_avisos_upsert(text,text,text,text,text,text,date,date,text,integer,boolean) from public;
grant execute on function public.admin_avisos_upsert(text,text,text,text,text,text,date,date,text,integer,boolean) to authenticated;
create or replace function public.admin_avisos_excluir(p_id text)
returns public.avisos language plpgsql security definer set search_path=public as $$
declare v_row public.avisos;
begin
 if not public.is_admin() then raise exception 'Apenas administradores podem excluir avisos.' using errcode='42501'; end if;
 delete from public.avisos where id=p_id returning * into v_row;
 if v_row.id is null then raise exception 'Aviso não encontrado — pode já ter sido excluído por outra sessão. Atualize a lista.' using errcode='P0002'; end if;
 if v_row.situacao_publicacao='publicado' then
  insert into public.email_queue(destinatario_user_id,modulo,titulo,resumo,link,chave_dedup)
  select p.user_id,'mural',v_row.titulo,'Um aviso foi retirado do Mural CAEF.','/#mural',
  concat('mural:',v_row.id,':retirada:',to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS'))
  from public.notification_preferences p where p.receber_notificacoes=true
  on conflict(destinatario_user_id,chave_dedup) do nothing;
 end if;
 return v_row;
end;
$$;
revoke all on function public.admin_avisos_excluir(text) from public;
grant execute on function public.admin_avisos_excluir(text) to authenticated;
create or replace function public.admin_avisos_remover_imagem(p_id text,p_imagem_path text)
returns public.avisos language plpgsql security definer set search_path=public as $$
declare v_row public.avisos;
begin
 if not public.is_admin() then raise exception 'Apenas administradores podem remover imagens de avisos.' using errcode='42501'; end if;
 update public.avisos set imagem_path=null,imagem_alt=null,atualizado_em=now(),atualizado_por=auth.uid()
 where id=p_id and imagem_path=p_imagem_path returning * into v_row;
 if v_row.id is null then raise exception 'A imagem deste aviso já foi alterada por outra sessão. Atualize a lista e tente novamente.' using errcode='P0002'; end if;
 return v_row;
end;
$$;
revoke all on function public.admin_avisos_remover_imagem(text,text) from public;
grant execute on function public.admin_avisos_remover_imagem(text,text) to authenticated;
create or replace function public.admin_avisos_atualizar_imagem(p_id text,p_imagem_path text,p_imagem_alt text)
returns public.avisos language plpgsql security definer set search_path=public as $$
declare v_row public.avisos;
begin
 if not public.is_admin() then raise exception 'Apenas administradores podem atualizar imagens de avisos.' using errcode='42501'; end if;
 update public.avisos set imagem_path=p_imagem_path,imagem_alt=p_imagem_alt,atualizado_em=now(),atualizado_por=auth.uid()
 where id=p_id returning * into v_row;
 if v_row.id is null then raise exception 'Aviso não encontrado.' using errcode='P0002'; end if;
 return v_row;
end;
$$;
revoke all on function public.admin_avisos_atualizar_imagem(text,text,text) from public;
grant execute on function public.admin_avisos_atualizar_imagem(text,text,text) to authenticated;
