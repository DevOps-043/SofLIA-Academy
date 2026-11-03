-- Instancia SOFIA. Requiere 20261012193000_live_studio_runtime.sql.
-- Aditiva y reejecutable; conserva estado, permisos y el commit original privado.
-- Rollback: retirar clientes nuevos y restaurar la función previa sin borrar datos.
begin;
do $migration$
declare definition text;
begin
  if to_regprocedure('public.live_studio_commit_core_v1(uuid,uuid,uuid,uuid,text,bigint,text,jsonb)') is null then
    alter function public.live_studio_commit(uuid,uuid,uuid,uuid,text,bigint,text,jsonb) rename to live_studio_commit_core_v1;
    definition := pg_get_functiondef('public.live_studio_commit_core_v1(uuid,uuid,uuid,uuid,text,bigint,text,jsonb)'::regprocedure);
    definition := replace(definition, '''post'',''presence'',''answer_quiz'',''submit_practice''', '''post'',''reaction'',''presence'',''answer_quiz'',''submit_practice''');
    execute definition;
  end if;
end $migration$;
revoke all on function public.live_studio_commit_core_v1(uuid,uuid,uuid,uuid,text,bigint,text,jsonb) from public,anon,authenticated;
grant execute on function public.live_studio_commit_core_v1(uuid,uuid,uuid,uuid,text,bigint,text,jsonb) to service_role;

create or replace function public.live_studio_commit(p_org uuid,p_user uuid,p_session uuid,p_id uuid,p_hash text,p_expected bigint,p_type text,p_state jsonb)
returns bigint language plpgsql security invoker set search_path='' as $function$
declare
  capability jsonb; persisted jsonb; old_command public.live_studio_commands;
  ledger jsonb; entry jsonb; item jsonb; member jsonb; events jsonb;
  stamp timestamptz; stamp_text text; last_stamp timestamptz; seconds integer; room text;
begin
  perform 1 from public.live_sessions where id=p_session for update;
  capability := public.live_workspace_authorize(p_org,p_user,p_session);
  select state into persisted from public.live_studio_state where session_id=p_session;
  if persisted->'moderation'->'restrictions'->>p_user::text='blocked' then raise exception 'LIVE_FORBIDDEN'; end if;
  if not (capability->>'can_manage')::boolean and p_type not in ('post','reaction','presence','answer_quiz','submit_practice') then raise exception 'LIVE_FORBIDDEN'; end if;
  select * into old_command from public.live_studio_commands where session_id=p_session and user_id=p_user and id=p_id;
  if found then
    if old_command.payload_hash<>p_hash then raise exception 'STUDIO_ID_CONFLICT'; end if;
    return old_command.revision;
  end if;
  stamp := clock_timestamp();
  if p_type='import_engine' and p_state->>'engine_revision' like 'engine:%' then
    if exists(select 1 from public.live_sessions where id=p_session and status<>'scheduled')
      or jsonb_array_length(coalesce(persisted->'answers','[]'))>0
      or jsonb_array_length(coalesce(persisted->'submissions','[]'))>0 then raise exception 'STUDIO_CONFLICT'; end if;
    if split_part(persisted->>'engine_revision',':',1)='engine'
      and split_part(persisted->>'engine_revision',':',2)=split_part(p_state->>'engine_revision',':',2)
      and split_part(persisted->>'engine_revision',':',3)=split_part(p_state->>'engine_revision',':',3)
      and split_part(persisted->>'engine_revision',':',4)::bigint>split_part(p_state->>'engine_revision',':',4)::bigint
      then raise exception 'STUDIO_CONFLICT'; end if;
  end if;
  stamp_text := to_char(stamp at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  ledger := coalesce(persisted->'participation','{}'::jsonb);
  select coalesce(jsonb_object_agg(key,value),'{}'::jsonb) into ledger from jsonb_each(ledger)
    where greatest(coalesce((value->>'last_message_at')::timestamptz,'-infinity'),coalesce((value->>'last_reaction_at')::timestamptz,'-infinity')) > stamp-interval '5 minutes';
  entry := coalesce(ledger->p_user::text,'{}'::jsonb);
  seconds := coalesce((persisted->'moderation'->>'message_interval_seconds')::integer,0);
  if p_type='post' then
    if not (capability->>'can_manage')::boolean and (coalesce((persisted->'moderation'->>'locked')::boolean,false) or persisted->'moderation'->'restrictions'->>p_user::text='chat') then raise exception 'LIVE_FORBIDDEN'; end if;
    last_stamp := (entry->>'last_message_at')::timestamptz;
    if not (capability->>'can_manage')::boolean and last_stamp+make_interval(secs=>seconds)>stamp then raise exception 'STUDIO_RATE_LIMITED'; end if;
    entry := entry||jsonb_build_object('last_message_at',stamp_text);
    select coalesce(jsonb_agg(case when value->>'id'=p_id::text then value||jsonb_build_object('created_at',stamp_text) else value end),'[]'::jsonb) into events from jsonb_array_elements(p_state->'messages');
    p_state := jsonb_set(p_state,'{messages}',events);
  elsif p_type='reaction' then
    if not coalesce((persisted->'moderation'->>'reactions')::boolean,true) then raise exception 'LIVE_FORBIDDEN'; end if;
    last_stamp := (entry->>'last_reaction_at')::timestamptz;
    if last_stamp+interval '1 second'>stamp then raise exception 'STUDIO_RATE_LIMITED'; end if;
    select value into item from jsonb_array_elements(p_state->'reaction_events') where value->>'id'=p_id::text;
    select value into member from jsonb_array_elements(coalesce(persisted->'members','[]')) where value->>'user_id'=p_user::text;
    if item is null or item->>'user_id' is distinct from p_user::text or item->>'emoji' not in ('👏','👍','💡','❤️','🎉','😂') or (item->>'room_id') is distinct from (member->>'room_id') then raise exception 'LIVE_FORBIDDEN'; end if;
    room := item->>'room_id';
    if room is not null and not exists(select 1 from jsonb_array_elements(persisted->'rooms') r where r->>'id'=room and ((capability->>'can_manage')::boolean or r->'user_ids' ? p_user::text)) then raise exception 'LIVE_FORBIDDEN'; end if;
    entry := entry||jsonb_build_object('last_reaction_at',stamp_text);
  end if;
  if p_type in ('post','reaction') then ledger:=jsonb_set(ledger,array[p_user::text],entry); end if;
  p_state:=jsonb_set(p_state,'{participation}',ledger);
  if p_type<>'chat_interval' then
    p_state:=jsonb_set(p_state,'{moderation,message_interval_seconds}',to_jsonb(seconds));
  elsif coalesce((p_state->'moderation'->>'message_interval_seconds')::integer,-1) not between 0 and 300 then
    raise exception 'STUDIO_INVALID';
  end if;
  select coalesce(jsonb_agg(value),'[]'::jsonb) into events from jsonb_array_elements(coalesce(persisted->'reaction_events','[]'))
    where (value->>'created_at')::timestamptz>stamp-interval '5 seconds';
  if p_type='reaction' then
    select coalesce(jsonb_agg(value),'[]'::jsonb) into events from (
      select value from jsonb_array_elements(events) with ordinality order by ordinality desc limit 99
    ) retained;
    events:=events||jsonb_build_array(item||jsonb_build_object('created_at',stamp_text));
  end if;
  p_state:=jsonb_set(p_state,'{reaction_events}',events);
  return public.live_studio_commit_core_v1(p_org,p_user,p_session,p_id,p_hash,p_expected,p_type,p_state);
end $function$;
revoke all on function public.live_studio_commit(uuid,uuid,uuid,uuid,text,bigint,text,jsonb) from public,anon,authenticated;
grant execute on function public.live_studio_commit(uuid,uuid,uuid,uuid,text,bigint,text,jsonb) to service_role;
commit;
