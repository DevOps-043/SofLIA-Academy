// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ids = {
  org: "00000000-0000-4000-8000-000000000001",
  otherOrg: "00000000-0000-4000-8000-000000000002",
  teacher: "00000000-0000-4000-8000-000000000011",
  otherTeacher: "00000000-0000-4000-8000-000000000012",
  student: "00000000-0000-4000-8000-000000000013",
  outsider: "00000000-0000-4000-8000-000000000014",
  admin: "00000000-0000-4000-8000-000000000015",
  course: "00000000-0000-4000-8000-000000000021",
  session: "00000000-0000-4000-8000-000000000031",
  otherSession: "00000000-0000-4000-8000-000000000032",
};
let database: PGlite;
beforeAll(async () => {
  database = new PGlite();
  await database.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create schema private; create schema storage;
    grant usage on schema public,auth,private to authenticated,service_role;
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    create table public.organizations(id uuid primary key);
    create table public.users(id uuid primary key,is_banned boolean default false,display_name text,first_name text);
    create table public.organization_users(organization_id uuid,user_id uuid,role text,status text);
    create table public.courses(id uuid primary key,instructor_id uuid,title text);
    create table public.organization_course_assignments(id uuid default gen_random_uuid(),organization_id uuid,course_id uuid,user_id uuid,completion_percentage numeric,status text default 'assigned');
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create publication supabase_realtime;
  `);
  const migration = readFileSync(
    resolve(
      process.cwd(),
      "../../supabase/migrations/20261005162654_live_learning.sql",
    ),
    "utf8",
  );
  await database.exec(migration);
  await database.exec(readFileSync(resolve(process.cwd(), "../../supabase/migrations/20261010173000_live_hub_desktop.sql"), "utf8"));
  const periodMigration = readFileSync(resolve(process.cwd(), "../../supabase/migrations/20261111110000_live_catalog_session_periods.sql"), "utf8");
  await database.exec(periodMigration);
  await database.exec(periodMigration);
  await database.exec(`
    insert into organizations values('${ids.org}'),('${ids.otherOrg}');
    insert into users(id,display_name) values('${ids.teacher}','Teacher'),('${ids.otherTeacher}','Other teacher'),('${ids.student}','Student'),('${ids.outsider}','Other org student'),('${ids.admin}','Admin');
    insert into organization_users values('${ids.org}','${ids.teacher}','member','active'),('${ids.org}','${ids.otherTeacher}','member','active'),('${ids.org}','${ids.student}','member','active'),('${ids.otherOrg}','${ids.outsider}','member','active'),('${ids.org}','${ids.admin}','admin','active');
    insert into organization_instructors(organization_id,user_id) values('${ids.org}','${ids.teacher}'),('${ids.org}','${ids.otherTeacher}');
    insert into courses values('${ids.course}','${ids.teacher}','Shared course');
    insert into organization_course_assignments(organization_id,course_id,user_id,completion_percentage) values('${ids.org}','${ids.course}','${ids.student}',50),('${ids.otherOrg}','${ids.course}','${ids.outsider}',100);
    insert into live_sessions(id,organization_id,course_id,instructor_id,title,starts_at,duration_minutes,status) values('${ids.session}','${ids.org}','${ids.course}','${ids.teacher}','Org one',now(),60,'live'),('${ids.otherSession}','${ids.otherOrg}','${ids.course}','${ids.teacher}','Org two',now(),60,'live');
    insert into live_messages(session_id,user_id,author_name,content) values('${ids.session}','${ids.student}','Student','Private to org one'),('${ids.otherSession}','${ids.outsider}','Other','Private to org two');
    grant select on organizations,users,organization_users,courses,organization_course_assignments to service_role;
  `);
}, 60000);
afterAll(async () => {
  await database?.close();
});
async function asUser(userId: string) {
  await database.exec("reset role");
  await database.query(`select set_config('request.jwt.claim.sub',$1,false)`, [
    userId,
  ]);
  await database.exec("set role authenticated");
}
describe("In Live migration and tenant isolation", () => {
  it("conserva las clases todavía en vivo cuando exceden su duración estimada", async () => {
    await database.exec(`reset role;update live_sessions set starts_at=now()-interval '2 hours' where id='${ids.session}';set role service_role`);
    try {
      const next = await database.query<{ catalog: { total: number } }>("select live_catalog($1,$2,true,null,0,20,0,0,'upcoming') as catalog", [ids.org,ids.teacher]);
      const past = await database.query<{ catalog: { total: number } }>("select live_catalog($1,$2,true,null,0,20,0,0,'past') as catalog", [ids.org,ids.teacher]);
      expect(next.rows[0].catalog.total).toBe(1);
      expect(past.rows[0].catalog.total).toBe(0);
    } finally {
      await database.exec(`reset role;update live_sessions set starts_at=now() where id='${ids.session}'`);
    }
  });
  it("separa clases propias del instructor y catálogo completo del administrador", async () => {
    await database.exec(`reset role;set role service_role;
      insert into live_sessions(organization_id,course_id,instructor_id,title,starts_at,duration_minutes,status)
      values('${ids.org}','${ids.course}','${ids.otherTeacher}','Clase de otro instructor',now()+interval '1 day',60,'scheduled');
    `);
    try {
      const own = await database.query<{ catalog: { sessions: { title: string }[] } }>("select live_catalog($1,$2,true,null,0,20,0,0,'upcoming') as catalog", [ids.org,ids.teacher]);
      expect(own.rows[0].catalog.sessions.some(session => session.title === 'Clase de otro instructor')).toBe(false);
      const admin = await database.query<{ catalog: { sessions: { title: string }[] } }>("select live_catalog($1,$2,true,null,0,20,0,0,'upcoming') as catalog", [ids.org,ids.admin]);
      expect(admin.rows[0].catalog.sessions.some(session => session.title === 'Clase de otro instructor')).toBe(true);
      await asUser(ids.student);
      await expect(database.query("select live_catalog($1,$2,true)", [ids.org,ids.student])).rejects.toThrow(/permission denied/);
    } finally {
      await database.exec("reset role;delete from live_sessions where title='Clase de otro instructor'");
    }
  });
  it("filtra vencimiento antes del total y la paginación sin modificar sesiones", async () => {
    await database.exec(`reset role;set role service_role;
      insert into live_sessions(organization_id,course_id,instructor_id,title,starts_at,duration_minutes,status)
      select '${ids.org}','${ids.course}','${ids.teacher}','Periodo vencido ' || i,now()-interval '2 days',60,'scheduled' from generate_series(1,21) i;
      insert into live_sessions(organization_id,course_id,instructor_id,title,starts_at,duration_minutes,status)
      values('${ids.org}','${ids.course}','${ids.teacher}','Periodo futuro uno',now()+interval '1 day',60,'scheduled'),
      ('${ids.org}','${ids.course}','${ids.teacher}','Periodo futuro dos',now()+interval '2 days',60,'scheduled');
    `);
    try {
      const next = await database.query<{ catalog: { total: number; sessions: { title: string }[] } }>("select live_catalog($1,$2,true,null,1,1,0,0,'upcoming') as catalog", [ids.org,ids.teacher]);
      expect(next.rows[0].catalog.total).toBe(3);
      expect(next.rows[0].catalog.sessions.map(session => session.title)).toEqual(['Periodo futuro uno']);
      const past = await database.query<{ catalog: { total: number; sessions: { status: string }[] } }>("select live_catalog($1,$2,true,null,0,20,0,0,'past') as catalog", [ids.org,ids.teacher]);
      expect(past.rows[0].catalog.total).toBe(21);
      expect(past.rows[0].catalog.sessions).toHaveLength(20);
      expect(past.rows[0].catalog.sessions.every(session => session.status === 'scheduled')).toBe(true);
      const student = await database.query<{ catalog: { total: number } }>("select live_catalog($1,$2,false,null,0,20,0,0,'upcoming') as catalog", [ids.org,ids.student]);
      expect(student.rows[0].catalog.total).toBe(3);
      const other = await database.query<{ catalog: { total: number } }>("select live_catalog($1,$2,true,null,0,20,0,0,'upcoming') as catalog", [ids.otherOrg,ids.teacher]);
      expect(other.rows[0].catalog.total).toBe(0);
    } finally {
      await database.exec("reset role;delete from live_sessions where title like 'Periodo %'");
    }
  });

  it("excluye asignaciones canceladas de catálogo y RLS sin borrar su historia", async () => {
    await database.exec(`reset role;update organization_course_assignments set status='cancelled' where user_id='${ids.student}'`);
    try {
      await asUser(ids.student);
      expect((await database.query("select * from live_sessions")).rows).toHaveLength(0);
      await database.exec("reset role;set role service_role");
      const catalog = await database.query<{ value: { sessions: unknown[]; total: number } }>("select live_catalog($1,$2,false) as value", [ids.org, ids.student]);
      expect(catalog.rows[0].value.total).toBe(0);
    } finally {
      await database.exec(`reset role;update organization_course_assignments set status='assigned' where user_id='${ids.student}'`);
    }
  });
  it("shows only the assigned organization despite a shared course", async () => {
    await asUser(ids.student);
    const result = await database.query<{ title: string }>(
      "select title from live_sessions",
    );
    expect(result.rows.map((row) => row.title)).toEqual(["Org one"]);
    expect(
      (
        await database.query<{ content: string }>(
          "select content from live_messages",
        )
      ).rows.map((row) => row.content),
    ).toEqual(["Private to org one"]);
  });
  it("does not grant instructors access to other instructors sessions", async () => {
    await asUser(ids.otherTeacher);
    expect((await database.query("select * from live_sessions")).rows).toEqual(
      [],
    );
    await asUser(ids.teacher);
    expect(
      (await database.query("select * from live_sessions")).rows,
    ).toHaveLength(1);
  });
  it("allows organization administrators to supervise without cross-tenant access", async () => {
    await asUser(ids.admin);
    expect(
      (await database.query("select * from live_sessions")).rows,
    ).toHaveLength(1);
  });
  it("protects meeting secrets, quiz keys, private chats and direct writes", async () => {
    await asUser(ids.student);
    for (const table of [
      "live_zoom_credentials",
      "live_quiz_keys",
      "live_private_messages",
      "organization_instructors",
    ]) {
      await expect(database.query(`select * from ${table}`)).rejects.toThrow(
        /permission denied/,
      );
    }
    await expect(
      database.query(
        `insert into live_messages(session_id,author_name,content) values('${ids.session}','Soflia','Fake')`,
      ),
    ).rejects.toThrow(/permission denied/);
    await expect(
      database.query(`select live_publish_activity('${ids.session}','{}',0)`),
    ).rejects.toThrow(/permission denied/);
  });
  it("revokes reads immediately when membership is inactive or user banned", async () => {
    await database.exec(
      `reset role;update organization_users set status='inactive' where user_id='${ids.student}'`,
    );
    await asUser(ids.student);
    expect(
      (await database.query("select * from live_messages")).rows,
    ).toHaveLength(0);
    await database.exec(
      `reset role;update organization_users set status='active' where user_id='${ids.student}';update users set is_banned=true where id='${ids.student}'`,
    );
    await asUser(ids.student);
    expect(
      (await database.query("select * from live_messages")).rows,
    ).toHaveLength(0);
    await database.exec(
      `reset role;update users set is_banned=false where id='${ids.student}'`,
    );
  });
  it("publishes quiz and answer key atomically and rejects invalid keys", async () => {
    await database.exec("reset role;set role service_role");
    const payload = {
      kind: "quiz",
      title: "Quiz",
      content: "Question",
      options: ["A", "B"],
    };
    await expect(
      database.query("select live_publish_activity($1,$2,4)", [
        ids.session,
        JSON.stringify(payload),
      ]),
    ).rejects.toThrow(/Invalid quiz/);
    expect(
      (await database.query("select * from live_activities")).rows,
    ).toHaveLength(0);
    await database.query("select live_publish_activity($1,$2,1)", [
      ids.session,
      JSON.stringify(payload),
    ]);
    expect(
      (await database.query("select * from live_activities")).rows,
    ).toHaveLength(1);
    expect(
      (await database.query("select * from live_quiz_keys")).rows,
    ).toHaveLength(1);
  });
  it("computes scoped course statistics without counting another organization", async () => {
    await database.exec("reset role;set role service_role");
    const result = await database.query<{
      catalog: {
        sessions: unknown[];
        stats: { learners: number; averageProgress: number };
      };
    }>("select live_catalog($1,$2,true) as catalog", [ids.org, ids.teacher]);
    expect(result.rows[0].catalog.sessions).toHaveLength(1);
    expect(result.rows[0].catalog.stats.learners).toBe(1);
    expect(result.rows[0].catalog.stats.averageProgress).toBe(50);
  });
  it("paginates sessions in the database", async () => {
    await database.exec("reset role;set role service_role");
    const result = await database.query<{
      catalog: { sessions: unknown[]; total: number };
    }>("select live_catalog($1,$2,true,null,1,20) as catalog", [
      ids.org,
      ids.teacher,
    ]);
    expect(result.rows[0].catalog.sessions).toHaveLength(0);
    expect(result.rows[0].catalog.total).toBe(1);
  });
  it("filters history before pagination", async () => {
    await database.exec("reset role;set role service_role");
    const result = await database.query<{
      catalog: { sessions: unknown[]; total: number };
    }>("select live_catalog($1,$2,true,null,0,20,0,0,'past') as catalog", [
      ids.org,
      ids.teacher,
    ]);
    expect(result.rows[0].catalog.total).toBe(0);
  });
  it("commits scheduling metadata and credentials together and rejects repeated finalization", async () => {
    await database.exec("reset role;set role service_role");
    const requestId = "00000000-0000-4000-8000-000000000051";
    await database.query(
      "insert into live_scheduling_requests(id,organization_id,user_id,payload_hash) values($1,$2,$3,'hash')",
      [requestId, ids.org, ids.teacher],
    );
    const payload = {
      organization_id: ids.org,
      course_id: ids.course,
      instructor_id: ids.teacher,
      title: "Atomic session",
      description: "",
      starts_at: new Date().toISOString(),
      duration_minutes: 60,
      zoom_meeting_id: "123456789",
    };
    await database.query("select live_finalize_session($1,$2,$3,$4)", [
      requestId,
      JSON.stringify(payload),
      "host",
      "password",
    ]);
    expect(
      (await database.query("select * from live_zoom_credentials")).rows,
    ).toHaveLength(1);
    await expect(
      database.query("select live_finalize_session($1,$2,$3,$4)", [
        requestId,
        JSON.stringify(payload),
        "host",
        "password",
      ]),
    ).rejects.toThrow(/Invalid scheduling state/);
    expect(
      (await database.query("select * from live_zoom_credentials")).rows,
    ).toHaveLength(1);
  });
  it("rejects messages and responses after session closure", async () => {
    await database.exec(
      `reset role;update live_sessions set status='ended' where id='${ids.session}';set role service_role`,
    );
    await expect(
      database.query(
        "insert into live_messages(session_id,user_id,author_name,content) values($1,$2,'Student','Late')",
        [ids.session, ids.student],
      ),
    ).rejects.toThrow(/Session is not live/);
    await expect(
      database.query(
        "insert into live_activity_responses(activity_id,user_id,answer) select id,$1,0 from live_activities where session_id=$2",
        [ids.student, ids.session],
      ),
    ).rejects.toThrow(/Session is not live/);
  });
});
