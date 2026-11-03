-- Respaldo de definición obtenido por consulta de catálogo de solo lectura en Learning principal.
-- No contiene estado de usuarios ni credenciales. Restauración solo con autorización operativa.
begin;
CREATE OR REPLACE FUNCTION public.live_studio_commit(p_org uuid, p_user uuid, p_session uuid, p_id uuid, p_hash text, p_expected bigint, p_type text, p_state jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare current_revision bigint; old_command public.live_studio_commands; capability jsonb;
  persisted jsonb; member jsonb; members jsonb; old_visible jsonb; new_visible jsonb; room text;
begin
  -- Serializar también la primera escritura, cuando aún no hay fila de estado.
  perform 1 from public.live_sessions where id = p_session for update;
  capability := public.live_workspace_authorize(p_org, p_user, p_session);
  if not (capability->>'can_manage')::boolean and p_type not in ('post','presence','answer_quiz','submit_practice') then raise exception 'LIVE_FORBIDDEN'; end if;
  if exists(select 1 from public.live_studio_state where session_id = p_session and state->'moderation'->'restrictions'->>p_user::text = 'blocked') then raise exception 'LIVE_FORBIDDEN'; end if;
  if p_type <> 'presence' and exists(select 1 from public.live_sessions where id = p_session and status in ('ended','cancelled')) then raise exception 'STUDIO_CONFLICT'; end if;
  select * into old_command from public.live_studio_commands where session_id = p_session and user_id = p_user and id = p_id;
  if found then
    if old_command.payload_hash <> p_hash then raise exception 'STUDIO_ID_CONFLICT'; end if;
    return old_command.revision;
  end if;
  select revision, state into current_revision, persisted from public.live_studio_state where session_id = p_session;
  current_revision := coalesce(current_revision, 0);
  if p_type = 'presence' then
    -- Fusionar solo al actor bajo bloqueo: los leases no sobrescriben miembros concurrentes.
    select value into member from jsonb_array_elements(p_state->'members') where value->>'user_id' = p_user::text;
    persisted := coalesce(persisted, jsonb_set(p_state, '{members}', '[]'::jsonb));
    room := member->>'room_id';
    if member is not null and (member->>'instructor')::boolean <> (capability->>'can_manage')::boolean then raise exception 'LIVE_FORBIDDEN'; end if;
    if room is not null and not exists(select 1 from jsonb_array_elements(persisted->'rooms') r where r->>'id'=room and ((capability->>'can_manage')::boolean or r->'user_ids' ? p_user::text)) then raise exception 'LIVE_FORBIDDEN'; end if;
    select coalesce(jsonb_agg(value order by value->>'user_id'), '[]'::jsonb) into members from jsonb_array_elements(persisted->'members') where value->>'user_id' <> p_user::text and (value->>'seen_at')::timestamptz > now() - interval '90 seconds';
    if member is not null then members := members || jsonb_build_array(member); end if;
    if jsonb_array_length(members) > 500 then raise exception 'STUDIO_INVALID'; end if;
    select coalesce(jsonb_agg(value - 'seen_at' order by value->>'user_id'), '[]'::jsonb) into old_visible from jsonb_array_elements(persisted->'members');
    select coalesce(jsonb_agg(value - 'seen_at' order by value->>'user_id'), '[]'::jsonb) into new_visible from jsonb_array_elements(members);
    p_state := jsonb_set(persisted, '{members}', members);
    if old_visible = new_visible and current_revision > 0 then
      update public.live_studio_state set state=p_state, updated_at=now() where session_id=p_session;
      insert into public.live_studio_commands(session_id,user_id,id,payload_hash,revision) values(p_session,p_user,p_id,p_hash,current_revision);
      return current_revision;
    end if;
    p_state := jsonb_set(p_state, '{revision}', to_jsonb(current_revision + 1));
    p_expected := current_revision;
  end if;
  if current_revision <> p_expected then raise exception 'STUDIO_CONFLICT'; end if;
  if p_type <> 'presence' and persisted is not null then
    -- Un latido sin revisión puede adelantarse al comando: conservar su fecha vigente.
    select coalesce(jsonb_agg(current_member || jsonb_build_object('seen_at', coalesce((select saved_member->>'seen_at' from jsonb_array_elements(persisted->'members') as saved(saved_member) where saved_member->>'user_id'=current_member->>'user_id'), current_member->>'seen_at'))), '[]'::jsonb)
      into members from jsonb_array_elements(p_state->'members') as incoming(current_member);
    p_state := jsonb_set(p_state, '{members}', members);
  end if;
  if jsonb_typeof(p_state) <> 'object' or (p_state->>'revision')::bigint <> current_revision + 1 or octet_length(p_state::text) > 1572864 then raise exception 'STUDIO_INVALID'; end if;
  if exists(select 1 from (select value->>'asset_path' path from jsonb_array_elements(p_state->'materials') union select value->>'asset_path' from jsonb_array_elements(p_state->'scenes')) paths
      where path is not null and not exists(select 1 from public.live_studio_assets a where a.path=paths.path and a.session_id=p_session and a.status<>'purging')) then raise exception 'STUDIO_INVALID_ASSET'; end if;
  -- El mismo bloqueo de sesión excluye la carrera entre publicar y reclamar un archivo para GC.
  update public.live_studio_assets a set status='staged', created_at=now() where a.session_id=p_session and a.status='attached' and not exists(
    select 1 from (select value->>'asset_path' path from jsonb_array_elements(p_state->'materials') union select value->>'asset_path' from jsonb_array_elements(p_state->'scenes')) paths where paths.path=a.path);
  update public.live_studio_assets a set status='attached' where a.session_id=p_session and a.status<>'purging' and exists(
    select 1 from (select value->>'asset_path' path from jsonb_array_elements(p_state->'materials') union select value->>'asset_path' from jsonb_array_elements(p_state->'scenes')) paths where paths.path=a.path);
  insert into public.live_studio_state(session_id, revision, state) values(p_session, current_revision + 1, p_state)
    on conflict(session_id) do update set revision = excluded.revision, state = excluded.state, updated_at = now();
  insert into public.live_studio_commands(session_id, user_id, id, payload_hash, revision) values(p_session, p_user, p_id, p_hash, current_revision + 1);
  insert into public.live_studio_revisions(session_id, revision) values(p_session, current_revision + 1)
    on conflict(session_id) do update set revision = excluded.revision, updated_at = now();
  return current_revision + 1;
end $function$
;
revoke all on function public.live_studio_commit(uuid,uuid,uuid,uuid,text,bigint,text,jsonb) from public,anon,authenticated;
grant execute on function public.live_studio_commit(uuid,uuid,uuid,uuid,text,bigint,text,jsonb) to service_role;
commit;
