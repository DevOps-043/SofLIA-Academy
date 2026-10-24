// @vitest-environment node
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createWorkspaceDatabase } from './workspace-database.fixture';
import { emptyStudioState } from '../live-studio-domain';

const org = '00000000-0000-4000-8000-000000000001', teacher = '00000000-0000-4000-8000-000000000011', student = '00000000-0000-4000-8000-000000000013', stranger = '00000000-0000-4000-8000-000000000014', course = '00000000-0000-4000-8000-000000000021', session = '00000000-0000-4000-8000-000000000031';
let db: PGlite;
beforeAll(async () => {
  db = await createWorkspaceDatabase(false);
  const sql = readFileSync(resolve(process.cwd(), '../../supabase/migrations/20261012193000_live_studio_runtime.sql'), 'utf8');
  await db.exec(sql);
  const participation=readFileSync(resolve(process.cwd(),'../../supabase/migrations/20261024180000_live_studio_participation.sql'),'utf8');await db.exec(participation);await db.exec(participation);
  await db.exec(`insert into organizations(id) values('${org}');
    insert into users(id,display_name) values('${teacher}','Instructor'),('${student}','Alumno'),('${stranger}','Sin asignación');
    insert into organization_users values('${org}','${teacher}','member','active'),('${org}','${student}','member','active'),('${org}','${stranger}','member','active');
    insert into organization_instructors(organization_id,user_id) values('${org}','${teacher}');
    insert into courses values('${course}','${teacher}','Curso');
    insert into organization_course_assignments(organization_id,course_id,user_id) values('${org}','${course}','${student}');
    insert into live_sessions(id,organization_id,course_id,instructor_id,title,starts_at,duration_minutes,status) values('${session}','${org}','${course}','${teacher}','Sesión',now(),60,'live');
    grant select on organizations,users,organization_users,courses,organization_course_assignments to service_role;`);
}, 60000);
afterAll(async () => { await db?.close(); });
async function service() { await db.exec('reset role;set role service_role'); }
async function authenticated(user: string) { await db.exec(`reset role;set role authenticated;set request.jwt.claim.sub='${user}'`); }


beforeEach(async()=>{await db.exec('reset role');await db.query('delete from live_studio_commands where session_id=$1',[session]);await db.query('delete from live_studio_revisions where session_id=$1',[session]);await db.query('delete from live_studio_state where session_id=$1',[session]);await service();});
async function write(user:string,type:string,state:ReturnType<typeof emptyStudioState>,id=randomUUID(),expected=state.revision-1){return db.query('select live_studio_commit($1,$2,$3,$4,$5,$6,$7,$8) as revision',[org,user,session,id,'a'.repeat(64),expected,type,state]);}
async function stored(){return (await db.query<{state:ReturnType<typeof emptyStudioState>}>('select state from live_studio_state where session_id=$1',[session])).rows[0].state;}
async function slow(){const state={...emptyStudioState(),revision:1};state.moderation.message_interval_seconds=10;await write(teacher,'chat_interval',state);return state;}
describe('cadencia atómica de participación',()=>{
  it('autoriza reacciones de alumno y mantiene configuración exclusiva del instructor',async()=>{
    const state=await slow();await expect(write(student,'chat_interval',{...state,revision:2})).rejects.toThrow('LIVE_FORBIDDEN');
    const id=randomUUID();await write(student,'reaction',{...state,revision:2,reaction_events:[{id,user_id:student,author:'Alumno',emoji:'👏',room_id:null,created_at:'2026-01-01T00:00:00.000Z'}]},id);
    const next=await stored();expect(Date.parse(next.participation[student].last_reaction_at!)).toBeGreaterThan(Date.parse('2026-01-01T00:00:00.000Z'));expect(next.reaction_events[0].created_at).toBe(next.participation[student].last_reaction_at);
  });
  it('no permite borrar ledger o intervalo en el payload para saltar la espera y conserva idempotencia',async()=>{
    const state=await slow(),id=randomUUID();await write(student,'post',{...state,revision:2},id);expect((await write(student,'post',{...state,revision:2},id,1)).rows[0]).toEqual({revision:2});
    const forged={...state,revision:3,participation:{},moderation:{...state.moderation,message_interval_seconds:0}};
    await expect(write(student,'post',forged)).rejects.toThrow('STUDIO_SLOW_MODE');
    const current=await stored();await write(teacher,'post',{...current,revision:3});await write(teacher,'post',{...await stored(),revision:4});
  });
  it('serializa dos envíos concurrentes y vuelve a rechazar el segundo con revisión vigente',async()=>{
    const state=await slow();const results=await Promise.allSettled([write(student,'post',{...state,revision:2}),write(student,'post',{...state,revision:2})]);
    expect(results.filter(result=>result.status==='fulfilled')).toHaveLength(1);expect(results.filter(result=>result.status==='rejected')).toHaveLength(1);
    await expect(write(student,'post',{...await stored(),revision:3})).rejects.toThrow('STUDIO_SLOW_MODE');
  });
  it('permite el límite cumplido y respeta desactivación sin borrar marcas recientes',async()=>{
    const state=await slow();await write(student,'post',{...state,revision:2});
    await db.query(`update live_studio_state set state=jsonb_set(state,array['participation',$1,'last_message_at'],to_jsonb(to_char((clock_timestamp()-interval '11 seconds') at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))) where session_id=$2`,[student,session]);
    await write(student,'post',{...await stored(),revision:3});let current=await stored();current={...current,revision:4,moderation:{...current.moderation,message_interval_seconds:0}};await write(teacher,'chat_interval',current);await write(student,'post',{...await stored(),revision:5});
  });
  it('limita ráfagas de reacciones y mantiene el permiso de desactivarlas',async()=>{
    const state=await slow();await write(student,'reaction',{...state,revision:2});await expect(write(student,'reaction',{...await stored(),revision:3})).rejects.toThrow('STUDIO_REACTION_RATE');
    const current=await stored();await write(teacher,'moderation',{...current,revision:3,moderation:{...current.moderation,reactions:false}});await expect(write(student,'reaction',{...await stored(),revision:4})).rejects.toThrow('LIVE_FORBIDDEN');
    await authenticated(student);await expect(write(student,'reaction',{...state,revision:2})).rejects.toThrow('permission denied');
  });
});
