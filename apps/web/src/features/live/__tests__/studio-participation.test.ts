// @vitest-environment node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { createWorkspaceDatabase } from './workspace-database.fixture';
import { emptyStudioState } from '../live-studio-domain';
import { studioResponseSchema, studioStateSchema, type StudioState } from '../live-studio.contract';
import { projectStudioResponse } from '../studio-response';

const id=(n:number)=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const org=id(1), teacher=id(11), student=id(13), stranger=id(14), course=id(21), session=id(31);
let db:PGlite;
beforeAll(async()=>{
  db=await createWorkspaceDatabase(false);
  for(const migration of ['20261012193000_live_studio_runtime.sql','20261103120000_live_studio_participation.sql']){
    const sql=readFileSync(resolve(process.cwd(),'../../supabase/migrations',migration),'utf8');
    await db.exec(sql);await db.exec(sql);
  }
  await db.exec(`insert into organizations(id) values('${org}');
    insert into users(id,display_name) values('${teacher}','Instructor'),('${student}','Alumno'),('${stranger}','Ajeno');
    insert into organization_users values('${org}','${teacher}','member','active'),('${org}','${student}','member','active'),('${org}','${stranger}','member','active');
    insert into organization_instructors(organization_id,user_id) values('${org}','${teacher}');
    insert into courses values('${course}','${teacher}','Curso');
    insert into organization_course_assignments(organization_id,course_id,user_id) values('${org}','${course}','${student}');
    insert into live_sessions(id,organization_id,course_id,instructor_id,title,starts_at,duration_minutes,status) values('${session}','${org}','${course}','${teacher}','Sesión',now(),60,'live');
    grant select on organizations,users,organization_users,courses,organization_course_assignments to service_role;`);
},60000);
afterAll(async()=>{await db?.close();});
beforeEach(async()=>{
  await db.exec('reset role');
  await db.query("update live_sessions set status='live' where id=$1",[session]);
  await db.query('delete from live_studio_commands');
  await db.query('delete from live_studio_state');
  await db.query('insert into live_studio_state(session_id,revision,state) values($1,0,$2)',[session,emptyStudioState()]);
});
async function commit(type:string,state:StudioState,user=student,command=randomUUID(),hash='a'.repeat(64)){
  await db.exec('reset role;set role service_role');
  return db.query('select public.live_studio_commit($1,$2,$3,$4,$5,$6,$7,$8) as revision',[org,user,session,command,hash,state.revision-1,type,state]);
}
async function state(){await db.exec('reset role');return (await db.query<{state:StudioState}>('select state from live_studio_state')).rows[0].state;}
function post(previous:StudioState,command:string,user=student):StudioState{
  return {...previous,revision:previous.revision+1,messages:[...previous.messages,{id:command,user_id:user,author:'Actor',instructor:user===teacher,content:'Mensaje',question:false,room_id:null,created_at:'2000-01-01T00:00:00.000Z'}]};
}
describe('participación transaccional',()=>{
  it('negocia formato nuevo y conserva forma legacy estricta',()=>{
    const response=studioResponseSchema.parse({snapshot:{session_id:session,user_id:student,can_manage:false,title:'Sesión',server_time:new Date().toISOString(),state:emptyStudioState(),asset_urls:{}}});
    expect(projectStudioResponse(response,true).snapshot).toHaveProperty('participation_version',1);
    const legacy=projectStudioResponse(response,false).snapshot!;
    expect(legacy).not.toHaveProperty('participation_version');
    expect(legacy.state).not.toHaveProperty('participation');
    expect(legacy.state).not.toHaveProperty('reaction_events');
    expect(legacy.state.moderation).not.toHaveProperty('message_interval_seconds');
  });
  it('impone hora SQL, deduplica y bloquea la cadencia aunque se manipule el ledger',async()=>{
    let current=emptyStudioState();current.revision=1;current.moderation.message_interval_seconds=30;
    await commit('chat_interval',current,teacher);
    const command=randomUUID();current=post(await state(),command);
    await commit('post',current,student,command);await commit('post',current,student,command);
    await expect(commit('post',current,student,command,'b'.repeat(64))).rejects.toThrow('STUDIO_ID_CONFLICT');
    const saved=await state();expect(saved.messages).toHaveLength(1);
    expect(studioStateSchema.safeParse(saved).success).toBe(true);
    expect(Date.parse(saved.participation[student].last_message_at!)).toBeGreaterThan(Date.now()-60000);
    const forged=post(saved,randomUUID());forged.participation={};forged.moderation.message_interval_seconds=0;
    await expect(commit('post',forged)).rejects.toThrow('STUDIO_RATE_LIMITED');
    const teacherPost=post(saved,randomUUID(),teacher);await commit('post',teacherPost,teacher,teacherPost.messages.at(-1)!.id);
  });
  it('reacciona sin crear post y rechaza ráfaga y acceso ajeno',async()=>{
    const command=randomUUID();const initial=emptyStudioState();
    const reaction={id:command,user_id:student,author:'Alumno',emoji:'👏' as const,room_id:null,created_at:'2000-01-01T00:00:00.000Z'};
    await commit('reaction',{...initial,revision:1,reaction_events:[reaction]},student,command);
    const saved=await state();expect(saved.messages).toEqual([]);expect(saved.reaction_events).toHaveLength(1);
    await expect(commit('reaction',{...saved,revision:2,reaction_events:[{...reaction,id:randomUUID()}]})).rejects.toThrow('STUDIO_RATE_LIMITED');
    await expect(commit('post',post(saved,randomUUID(),stranger),stranger)).rejects.toThrow('LIVE_FORBIDDEN');
    await expect(commit('chat_interval',{...saved,revision:2})).rejects.toThrow('LIVE_FORBIDDEN');
  });
  it('niega RPC y núcleo a clientes públicos',async()=>{
    await db.exec(`set role authenticated;set request.jwt.claim.sub='${student}'`);
    for(const name of ['live_studio_commit','live_studio_commit_core_v1'])
      await expect(db.query(`select public.${name}($1,$2,$3,$4,$5,$6,$7,$8)`,[org,student,session,randomUUID(),'a'.repeat(64),0,'post',emptyStudioState()])).rejects.toThrow('permission denied');
  });
  it('impide entrega iniciada y revisiones antiguas bajo el bloqueo SQL',async()=>{
    const prepared={...emptyStudioState(),revision:1,engine_revision:`engine:${id(50)}:${id(51)}:4`};
    await expect(commit('import_engine',prepared,teacher)).rejects.toThrow('STUDIO_CONFLICT');
    await db.exec('reset role');await db.query("update live_sessions set status='scheduled' where id=$1",[session]);
    await commit('import_engine',prepared,teacher);
    const older={...await state(),revision:2,engine_revision:`engine:${id(50)}:${id(51)}:3`};
    await expect(commit('import_engine',older,teacher)).rejects.toThrow('STUDIO_CONFLICT');
    await db.exec('reset role');await db.query("update live_sessions set status='live' where id=$1",[session]);
    const next={...older,engine_revision:`engine:${id(50)}:${id(51)}:5`};
    await expect(commit('import_engine',next,teacher)).rejects.toThrow('STUDIO_CONFLICT');
  });
});
