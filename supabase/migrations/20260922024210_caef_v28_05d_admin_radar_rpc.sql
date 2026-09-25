
create or replace function public.admin_radar_listar()
returns setof public.radar_itens language plpgsql security definer set search_path=public stable as $$
begin
 if not public.is_admin() then raise exception 'Apenas administradores podem listar o conteúdo completo do Radar.' using errcode='42501'; end if;
 return query select * from public.radar_itens order by ordem asc;
end;
$$;
revoke all on function public.admin_radar_listar() from public;
grant execute on function public.admin_radar_listar() to authenticated;
create or replace function public.admin_radar_upsert(
 p_id text,p_novo_id text,p_type text,p_title text,p_short_title text,p_area text,p_coordinator text,
 p_contact text,p_description text,p_requirements text,p_selection text,p_selection_link text,
 p_shifts text[],p_status_availability text,p_status_note text,p_last_updated text,p_authorized boolean,
 p_audience text,p_participation_type text,p_workload text,p_duration text,p_postgrad boolean,
 p_lab_name text,p_modalities text[],p_level text[],p_dedication text,p_ordem integer,p_notificar_atualizacao boolean
)
returns public.radar_itens language plpgsql security definer set search_path=public as $$
declare v_row public.radar_itens;
begin
 if not public.is_admin() then raise exception 'Apenas administradores podem salvar itens do Radar.' using errcode='42501'; end if;
 if p_id is null or p_id='' then
  insert into public.radar_itens(
    id,type,title,short_title,area,coordinator,contact,description,requirements,selection,
    selection_link,shifts,status_availability,status_note,last_updated,authorized,audience,
    participation_type,workload,duration,postgrad,lab_name,modalities,level,dedication,ordem,
    notificar_atualizacao,atualizado_por
  ) values (
    p_novo_id,p_type,p_title,p_short_title,p_area,p_coordinator,p_contact,p_description,p_requirements,p_selection,
    p_selection_link,coalesce(p_shifts,'{}'),p_status_availability,p_status_note,p_last_updated,p_authorized,p_audience,
    p_participation_type,p_workload,p_duration,p_postgrad,p_lab_name,coalesce(p_modalities,'{}'),coalesce(p_level,'{}'),p_dedication,p_ordem,
    p_notificar_atualizacao,auth.uid()
  ) returning * into v_row;
 else
  update public.radar_itens set
    type=p_type,title=p_title,short_title=p_short_title,area=p_area,coordinator=p_coordinator,
    contact=p_contact,description=p_description,requirements=p_requirements,selection=p_selection,
    selection_link=p_selection_link,shifts=coalesce(p_shifts,'{}'),status_availability=p_status_availability,
    status_note=p_status_note,last_updated=p_last_updated,authorized=p_authorized,audience=p_audience,
    participation_type=p_participation_type,workload=p_workload,duration=p_duration,postgrad=p_postgrad,
    lab_name=p_lab_name,modalities=coalesce(p_modalities,'{}'),level=coalesce(p_level,'{}'),dedication=p_dedication,
    ordem=p_ordem,notificar_atualizacao=p_notificar_atualizacao,atualizado_em=now(),atualizado_por=auth.uid()
  where id=p_id returning * into v_row;
  if v_row.id is null then raise exception 'Item do Radar não encontrado — pode já ter sido excluído por outra sessão. Atualize a lista.' using errcode='P0002'; end if;
 end if;
 return v_row;
end;
$$;
revoke all on function public.admin_radar_upsert(text,text,text,text,text,text,text,text,text,text,text,text,text[],text,text,text,boolean,text,text,text,text,boolean,text,text[],text[],text,integer,boolean) from public;
grant execute on function public.admin_radar_upsert(text,text,text,text,text,text,text,text,text,text,text,text,text[],text,text,text,boolean,text,text,text,text,boolean,text,text[],text[],text,integer,boolean) to authenticated;
create or replace function public.admin_radar_excluir(p_id text)
returns public.radar_itens language plpgsql security definer set search_path=public as $$
declare v_row public.radar_itens;
begin
 if not public.is_admin() then raise exception 'Apenas administradores podem excluir itens do Radar.' using errcode='42501'; end if;
 delete from public.radar_itens where id=p_id returning * into v_row;
 if v_row.id is null then raise exception 'Item do Radar não encontrado — pode já ter sido excluído por outra sessão. Atualize a lista.' using errcode='P0002'; end if;
 if v_row.authorized=true then
  insert into public.email_queue(destinatario_user_id,modulo,titulo,resumo,link,chave_dedup)
  select p.user_id,'radar',v_row.title,'Uma oportunidade foi retirada do Radar CAEF.',concat('/?oportunidade=',v_row.id,'#radar'),
   concat('radar:',v_row.id,':retirada:',to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS'))
  from public.notification_preferences p where p.receber_notificacoes=true
  on conflict(destinatario_user_id,chave_dedup) do nothing;
 end if;
 return v_row;
end;
$$;
revoke all on function public.admin_radar_excluir(text) from public;
grant execute on function public.admin_radar_excluir(text) to authenticated;
