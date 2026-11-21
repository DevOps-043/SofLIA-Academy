begin;

create table public.instructor_calendar_connections (
  user_id uuid not null references public.users(id) on delete cascade,
  provider text not null check (provider in ('google', 'microsoft')),
  encrypted_tokens text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, provider)
);

create table public.instructor_calendar_events (
  session_id uuid primary key references public.live_sessions(id) on delete cascade,
  provider text not null check (provider in ('google', 'microsoft')),
  remote_id text
);

alter table public.instructor_calendar_connections enable row level security;
alter table public.instructor_calendar_events enable row level security;
revoke all on public.instructor_calendar_connections, public.instructor_calendar_events from public, anon, authenticated;
grant select, insert, update, delete on public.instructor_calendar_connections, public.instructor_calendar_events to service_role;

create function public.create_instructor_learning_path(
  p_org uuid, p_user uuid, p_id uuid, p_title text, p_description text, p_courses uuid[]
) returns uuid language plpgsql security invoker set search_path = '' as $$
begin
  if not exists (
    select 1 from public.organization_users m
    where m.organization_id = p_org and m.user_id = p_user and m.status = 'active'
  ) then
    raise insufficient_privilege;
  end if;

  if coalesce(cardinality(p_courses), 0) not between 1 and 50 or (
    select count(*) from public.courses where id = any(p_courses) and instructor_id = p_user
  ) <> cardinality(p_courses) then
    raise insufficient_privilege;
  end if;

  insert into public.learning_paths (id, created_by, title, description)
    values (p_id, p_user, p_title, p_description)
    on conflict (id) do nothing;

  if not found then
    if not exists (
      select 1 from public.learning_paths p
      join public.organization_learning_path_assignments a on a.learning_path_id = p.id
      where p.id = p_id and p.created_by = p_user and a.organization_id = p_org
        and p.title = p_title and p.description is not distinct from p_description
        and p_courses = (
          select array_agg(i.course_id order by i.position)
          from public.learning_path_items i where i.learning_path_id = p_id
        )
    ) then
      raise unique_violation;
    end if;
    return p_id;
  end if;

  insert into public.learning_path_items (learning_path_id, course_id, position)
    select p_id, c.id, c.position::integer
    from unnest(p_courses) with ordinality as c(id, position);
  insert into public.organization_learning_path_assignments (organization_id, learning_path_id, assigned_by)
    values (p_org, p_id, p_user);
  return p_id;
end;
$$;

create function public.notify_instructor_course(
  p_org uuid, p_user uuid, p_course uuid, p_request uuid, p_kind text,
  p_title text, p_message text, p_url text, p_learner uuid default null
) returns integer language plpgsql security invoker set search_path = '' as $$
declare
  recipient_count integer;
begin
  if p_kind not in ('notification', 'message', 'feedback', 'session')
    or (p_kind = 'feedback' and p_learner is null)
    or not exists (select 1 from public.courses where id = p_course and instructor_id = p_user)
    or not exists (
      select 1 from public.organization_users
      where organization_id = p_org and user_id = p_user and status = 'active'
    ) then
    raise insufficient_privilege;
  end if;

  with recipients as (
    select distinct a.user_id
    from public.organization_course_assignments a
    join public.organization_users m on m.organization_id = a.organization_id and m.user_id = a.user_id
    join public.users u on u.id = a.user_id
    where a.organization_id = p_org and a.course_id = p_course
      and a.status is distinct from 'cancelled' and m.status = 'active'
      and u.is_banned is not true and a.user_id <> p_user
      and (p_learner is null or p_learner = a.user_id)
  ), inserted as (
    insert into public.user_notifications (
      user_id, notification_type, title, message, metadata, priority, status,
      channels_sent, channels_pending, dedup_key, organization_id
    )
    select user_id, 'instructor_' || p_kind, p_title, p_message,
      jsonb_build_object('course_id', p_course, 'sender_id', p_user, 'action_url', p_url),
      'medium', 'unread', '["in_app"]'::jsonb, '[]'::jsonb,
      p_course::text || ':' || p_request::text, p_org
    from recipients on conflict (user_id, notification_type, dedup_key) where dedup_key is not null do nothing
  )
  select count(*) into recipient_count from recipients;

  return recipient_count;
end;
$$;

create function public.instructor_session_attendee_emails(p_org uuid, p_user uuid, p_session uuid)
returns text[] language sql stable security invoker set search_path = '' as $$
  select coalesce(array_agg(distinct lower(u.email) order by lower(u.email)), array[]::text[])
  from public.live_sessions s
  join public.organization_course_assignments a on a.organization_id = s.organization_id and a.course_id = s.course_id
  join public.organization_users m on m.organization_id = a.organization_id and m.user_id = a.user_id
  join public.users u on u.id = a.user_id
  where s.id = p_session and s.organization_id = p_org and s.instructor_id = p_user and s.status = 'scheduled'
    and a.status is distinct from 'cancelled' and m.status = 'active' and a.user_id <> p_user
    and u.email_verified is true and u.is_banned is not true and nullif(trim(u.email), '') is not null;
$$;

create function public.instructor_course_learner_metrics(p_org uuid, p_user uuid, p_course uuid, p_learners uuid[])
returns table (
  user_id uuid, lessons_completed bigint, minutes_spent bigint, activities_completed bigint,
  sessions_attended bigint, last_accessed_at timestamptz
) language sql stable security invoker set search_path = '' as $$
  with learners as (
    select distinct a.user_id
    from public.organization_course_assignments a
    join public.courses c on c.id = a.course_id and c.instructor_id = p_user
    where a.course_id = p_course and a.organization_id = p_org
      and a.status is distinct from 'cancelled' and a.user_id = any(p_learners)
  ), lesson_metrics as (
    select l.user_id,
      count(distinct l.lesson_id) filter (where l.is_completed is true) as completed,
      sum(l.time_spent_minutes) as minutes,
      sum(l.required_activities_completed) as activities,
      max(l.last_accessed_at) as accessed
    from public.user_lesson_progress l
    join learners a on a.user_id = l.user_id
    join public.user_course_enrollments e on e.enrollment_id = l.enrollment_id
      and e.course_id = p_course and e.user_id = l.user_id
    where coalesce(l.organization_id, e.organization_id) = p_org
    group by l.user_id
  ), attendance as (
    select v.user_id, count(distinct v.session_id) as sessions
    from public.live_attendance v
    join learners a on a.user_id = v.user_id
    join public.live_sessions s on s.id = v.session_id
      and s.organization_id = p_org and s.course_id = p_course and s.instructor_id = p_user
    group by v.user_id
  )
  select a.user_id, coalesce(l.completed, 0), coalesce(l.minutes, 0),
    coalesce(l.activities, 0), coalesce(v.sessions, 0), l.accessed
  from learners a left join lesson_metrics l using (user_id) left join attendance v using (user_id);
$$;

revoke all on function public.create_instructor_learning_path(uuid, uuid, uuid, text, text, uuid[]) from public, anon, authenticated;
grant execute on function public.create_instructor_learning_path(uuid, uuid, uuid, text, text, uuid[]) to service_role;
revoke all on function public.notify_instructor_course(uuid, uuid, uuid, uuid, text, text, text, text, uuid) from public, anon, authenticated;
grant execute on function public.notify_instructor_course(uuid, uuid, uuid, uuid, text, text, text, text, uuid) to service_role;
revoke all on function public.instructor_session_attendee_emails(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.instructor_session_attendee_emails(uuid, uuid, uuid) to service_role;
revoke all on function public.instructor_course_learner_metrics(uuid, uuid, uuid, uuid[]) from public, anon, authenticated;
grant execute on function public.instructor_course_learner_metrics(uuid, uuid, uuid, uuid[]) to service_role;

commit;
