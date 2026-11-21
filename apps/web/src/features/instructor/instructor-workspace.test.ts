// @vitest-environment node
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const migration = readFileSync(new URL(
  "../../../../../supabase/migrations/20261121033340_instructor_workspace.sql",
  import.meta.url,
), "utf8");
const db = new PGlite();
const uuid = (value: number) => `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`;
const [org, otherOrg, teacher, learner, suspended, outsider, unverified, own, foreign, session] =
  Array.from({ length: 10 }, (_, index) => uuid(index + 1));

beforeAll(async () => {
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role bypassrls;
    create table users (id uuid primary key, email text, email_verified boolean, is_banned boolean);
    create table courses (id uuid primary key, instructor_id uuid);
    create table organization_users (organization_id uuid, user_id uuid, status text);
    create table organization_course_assignments (organization_id uuid, course_id uuid, user_id uuid, status text);
    create table learning_paths (id uuid primary key, created_by uuid, title text, description text);
    create table learning_path_items (learning_path_id uuid, course_id uuid, position integer);
    create table organization_learning_path_assignments (organization_id uuid, learning_path_id uuid, assigned_by uuid);
    create table live_sessions (id uuid primary key, organization_id uuid, course_id uuid, instructor_id uuid, status text);
    create table live_attendance (session_id uuid, user_id uuid);
    create table user_course_enrollments (enrollment_id uuid, user_id uuid, course_id uuid, organization_id uuid);
    create table user_lesson_progress (
      enrollment_id uuid, user_id uuid, lesson_id uuid, organization_id uuid, is_completed boolean,
      time_spent_minutes integer, required_activities_completed integer, last_accessed_at timestamptz
    );
    create table user_notifications (
      user_id uuid, notification_type text, title text, message text, metadata jsonb, priority text,
      status text, channels_sent jsonb, channels_pending jsonb, dedup_key text, organization_id uuid
    );
    create unique index notifications_dedup on user_notifications (user_id, notification_type, dedup_key)
      where dedup_key is not null;
    insert into users values
      ('${teacher}','teacher@example.test',true,false),
      ('${learner}','learner@example.test',true,false),
      ('${suspended}','suspended@example.test',true,false),
      ('${outsider}','outsider@example.test',true,false),
      ('${unverified}','unverified@example.test',false,false);
    insert into courses values ('${own}','${teacher}'),('${foreign}','${outsider}');
    insert into organization_users values
      ('${org}','${teacher}','active'),('${org}','${learner}','active'),('${org}','${suspended}','suspended'),
      ('${otherOrg}','${outsider}','active'),('${org}','${unverified}','active');
    insert into organization_course_assignments values
      ('${org}','${own}','${learner}',null),('${org}','${own}','${suspended}','assigned'),
      ('${otherOrg}','${own}','${outsider}','assigned'),('${org}','${own}','${unverified}','assigned');
    insert into live_sessions values ('${session}','${org}','${own}','${teacher}','scheduled');
    insert into live_attendance values ('${session}','${learner}');
    insert into user_course_enrollments values ('${uuid(50)}','${learner}','${own}','${org}'),
      ('${uuid(51)}','${learner}','${own}','${otherOrg}');
    insert into user_lesson_progress values
      ('${uuid(50)}','${learner}','${uuid(52)}',null,true,10,2,now()),
      ('${uuid(51)}','${learner}','${uuid(53)}',null,true,40,9,now());
  `);
  await db.exec(migration);
});
afterAll(async () => { await db.close(); });

describe("Operaciones del panel de instructor", () => {
  it("mantiene credenciales y funciones fuera de los permisos del cliente", async () => {
    const result = await db.query(`
      select has_table_privilege('authenticated', 'instructor_calendar_connections', 'select') as can_read,
        has_function_privilege('anon', 'notify_instructor_course(uuid,uuid,uuid,uuid,text,text,text,text,uuid)', 'execute') as can_notify
    `);
    expect(result.rows).toEqual([{ can_read: false, can_notify: false }]);
  });

  it("notifica solo a miembros activos, valida autoría y evita duplicados", async () => {
    const query = "select notify_instructor_course($1,$2,$3,$4,'session','Clase','Abre tu agenda','/demo/live')";
    const args = [org, teacher, own, session];
    await db.query(query, args);
    await db.query(query, args);
    await expect(db.query(query, [org, teacher, foreign, session])).rejects.toMatchObject({ code: "42501" });
    const notifications = await db.query("select user_id from user_notifications order by user_id");
    expect(notifications.rows).toEqual([{ user_id: learner }, { user_id: unverified }]);
  });

  it("invita solo a miembros activos con correo verificado", async () => {
    const result = await db.query("select instructor_session_attendee_emails($1,$2,$3) as emails", [org, teacher, session]);
    expect(result.rows).toEqual([{ emails: ["learner@example.test"] }]);
  });

  it("calcula avances y asistencia dentro de la organización y la autoría", async () => {
    const result = await db.query(`
      select user_id, lessons_completed, minutes_spent, activities_completed, sessions_attended
      from instructor_course_learner_metrics($1,$2,$3,$4)
    `, [org, teacher, own, [learner, outsider]]);
    expect(result.rows).toEqual([{ user_id: learner, lessons_completed: 1, minutes_spent: 10, activities_completed: 2, sessions_attended: 1 }]);
  });

  it("crea una ruta propia en una transacción idempotente y rechaza cursos ajenos", async () => {
    const query = "select create_instructor_learning_path($1,$2,$3,'Ruta','Descripción',$4) as id";
    const id = uuid(60);
    const args = [org, teacher, id, [own]];
    await expect(db.query(query, args)).resolves.toMatchObject({ rows: [{ id }] });
    await expect(db.query(query, args)).resolves.toMatchObject({ rows: [{ id }] });
    await expect(db.query(query, [org, teacher, uuid(61), [own, foreign]])).rejects.toMatchObject({ code: "42501" });
    expect((await db.query("select course_id, position from learning_path_items")).rows).toEqual([{ course_id: own, position: 1 }]);
  });
});
