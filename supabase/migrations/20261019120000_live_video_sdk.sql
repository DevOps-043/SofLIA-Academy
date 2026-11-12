begin;

alter table public.live_sessions add column if not exists video_provider text not null default 'zoom-meeting'
  check (video_provider in ('zoom-meeting','zoom-video'));
create table if not exists public.live_video_credentials (
  session_id uuid primary key references public.live_sessions(id) on delete cascade,
  session_name text not null unique check(length(session_name) between 1 and 200),
  remote_id text not null check(length(remote_id) between 1 and 256),
  password text not null check(length(password) between 1 and 10),
  account_id text not null check(length(account_id) between 1 and 200)
);
alter table public.live_video_credentials enable row level security;
revoke all on public.live_video_credentials from public,anon,authenticated;
grant select,insert,update,delete on public.live_video_credentials to service_role;

create or replace function public.live_finalize_video_session(p_request uuid,p_session jsonb,p_remote text,p_password text,p_account text)
returns public.live_sessions language plpgsql security invoker set search_path = '' as $$
declare result public.live_sessions; request public.live_scheduling_requests;
begin
  select * into request from public.live_scheduling_requests where id=p_request and state='pending' for update;
  if not found or request.organization_id<>(p_session->>'organization_id')::uuid or request.user_id<>(p_session->>'instructor_id')::uuid
    then raise exception 'Solicitud de programación inválida'; end if;
  if not exists(select 1 from public.organization_users m join public.users u on u.id=m.user_id
    join public.organizations o on o.id=m.organization_id and o.is_active=true
    join public.courses c on c.id=(p_session->>'course_id')::uuid and c.instructor_id=m.user_id
    where m.organization_id=request.organization_id and m.user_id=request.user_id and m.status='active' and coalesce(u.is_banned,false)=false
      and (m.role in ('owner','admin') or exists(select 1 from public.organization_instructors i where i.user_id=m.user_id and i.organization_id=m.organization_id)))
    then raise exception 'Sin autorización para programar el aula'; end if;
  insert into public.live_sessions(id,organization_id,course_id,instructor_id,title,description,starts_at,duration_minutes,session_type,video_provider)
  values(p_request,request.organization_id,(p_session->>'course_id')::uuid,request.user_id,p_session->>'title',coalesce(p_session->>'description',''),
    (p_session->>'starts_at')::timestamptz,(p_session->>'duration_minutes')::integer,coalesce(p_session->>'session_type','meeting'),'zoom-video') returning * into result;
  insert into public.live_video_credentials values(result.id,'soflia_'||p_request::text,p_remote,p_password,p_account);
  -- Vinculación privada que también protege la ingestión transaccional de grabaciones.
  insert into public.live_zoom_credentials(session_id,host_id,password) values(result.id,'video:'||p_account,p_password);
  update public.live_scheduling_requests set state='completed',session_id=result.id where id=p_request;
  return result;
end $$;
revoke all on function public.live_finalize_video_session(uuid,jsonb,text,text,text) from public,anon,authenticated;
grant execute on function public.live_finalize_video_session(uuid,jsonb,text,text,text) to service_role;
commit;
