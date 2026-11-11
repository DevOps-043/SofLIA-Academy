-- Instancia: SOFIA Learning. Precondición: 20261010173000_live_hub_desktop.
-- Impacto: solo lectura de catálogo; vencimiento aplicado antes de total y paginación.
-- Reentrante: CREATE OR REPLACE con firma y grants existentes. Sin borrar ni cerrar sesiones.
-- Rollback: restaurar live_catalog de 20261010173000_live_hub_desktop.sql.
begin;

create or replace function public.live_catalog(p_org uuid,p_user uuid,p_teaching boolean,p_instructor uuid default null,p_offset integer default 0,p_limit integer default 20,p_course_offset integer default 0,p_instructor_offset integer default 0,p_period text default 'all')
returns jsonb language sql stable security invoker set search_path = '' as $$
 with membership as (
   select role in ('owner','admin') as admin from public.organization_users
   where organization_id=p_org and user_id=p_user and status='active'
 ), capability as (
   select admin, admin or exists(select 1 from public.organization_instructors where organization_id=p_org and user_id=p_user) as teach from membership
 ), visible_sessions as (
   select s.* from public.live_sessions s cross join capability c
   where s.organization_id=p_org and (
     p_period='all'
     -- Una clase en vivo puede exceder la duración prevista; solo Learning la cierra.
     or (p_period='upcoming' and (
       s.status='live'
       or (s.status='scheduled' and s.starts_at + s.duration_minutes * interval '1 minute' > now())
     ))
     or (p_period='past' and (
       s.status in ('ended','cancelled')
       or (s.status='scheduled' and s.starts_at + s.duration_minutes * interval '1 minute' <= now())
     ))
   ) and (
     (p_teaching and c.teach and ((c.admin and (p_instructor is null or s.instructor_id=p_instructor)) or (not c.admin and s.instructor_id=p_user)))
     or (not p_teaching and exists(select 1 from public.organization_course_assignments a where coalesce(a.status,'assigned') <> 'cancelled' and a.organization_id=p_org and a.course_id=s.course_id and a.user_id=p_user))
   )
 ), visible_courses as (
   select c.id,c.title,c.instructor_id from public.courses c cross join capability cap
   where (p_teaching and cap.teach and (
     (not cap.admin and c.instructor_id=p_user) or (cap.admin and (p_instructor is null or c.instructor_id=p_instructor) and (
       exists(select 1 from public.organization_users m where m.organization_id=p_org and m.user_id=c.instructor_id and m.status='active')
       or exists(select 1 from public.organization_course_assignments a where coalesce(a.status,'assigned') <> 'cancelled' and a.organization_id=p_org and a.course_id=c.id)
     ))
   )) or (not p_teaching and exists(select 1 from public.organization_course_assignments a where coalesce(a.status,'assigned') <> 'cancelled' and a.organization_id=p_org and a.course_id=c.id and a.user_id=p_user))
 ), visible_instructors as (
   select i.user_id,i.zoom_user_id,coalesce(u.display_name,u.first_name,'Instructor') as name
   from public.organization_instructors i join public.users u on u.id=i.user_id
   join public.organization_users m on m.user_id=i.user_id and m.organization_id=i.organization_id and m.status='active'
   where i.organization_id=p_org and exists(select 1 from capability where admin)
 ), course_assignments as (
   select a.* from public.organization_course_assignments a where coalesce(a.status,'assigned') <> 'cancelled' and a.organization_id=p_org and p_teaching and exists(select 1 from visible_courses c where c.id=a.course_id)
 )
 select jsonb_build_object(
   'sessions',coalesce((select jsonb_agg(s) from (select * from visible_sessions order by case when p_period='upcoming' then starts_at end asc, case when p_period<>'upcoming' then starts_at end desc,id limit least(greatest(p_limit,1),50) offset greatest(p_offset,0)) s),'[]'::jsonb),
   'courses',coalesce((select jsonb_agg(c) from (select * from visible_courses order by title,id limit 50 offset greatest(p_course_offset,0)) c),'[]'::jsonb),
   'instructors',coalesce((select jsonb_agg(i) from (select * from visible_instructors order by name,user_id limit 50 offset greatest(p_instructor_offset,0)) i),'[]'::jsonb),
   'total',(select count(*) from visible_sessions),'courseTotal',(select count(*) from visible_courses),'instructorTotal',(select count(*) from visible_instructors),
   'stats',jsonb_build_object('sessions',(select count(*) from visible_sessions),
     'attendees',(select count(distinct a.user_id) from public.live_attendance a where p_teaching and exists(select 1 from visible_sessions s where s.id=a.session_id)),
     'responses',(select count(*) from public.live_activity_responses r join public.live_activities a on a.id=r.activity_id where p_teaching and exists(select 1 from visible_sessions s where s.id=a.session_id)),
     'learners',(select count(distinct user_id) from course_assignments),
     'completed',(select count(*) from course_assignments where completion_percentage>=100),
     'averageProgress',(select coalesce(round(avg(completion_percentage)),0) from course_assignments))
 );
$$;
revoke all on function public.live_catalog(uuid,uuid,boolean,uuid,integer,integer,integer,integer,text) from public,anon,authenticated;
grant execute on function public.live_catalog(uuid,uuid,boolean,uuid,integer,integer,integer,integer,text) to service_role;

commit;
