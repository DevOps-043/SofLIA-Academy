<<<<<<< HEAD
import { describe,expect,it } from 'vitest';
import { applyStudioCommand,emptyStudioState,projectStudioState,type StudioActor } from '../live-studio-domain';
import { studioCommandSchema,studioStateSchema,type StudioCommand } from '../live-studio.contract';

const id=(n:number)=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const teacher:StudioActor={id:id(1),name:'Docente',canManage:true,courseId:id(99),status:'live'};
const pupil={...teacher,id:id(2),name:'Alumno',canManage:false},other={...pupil,id:id(3)};
const now='2026-10-24T18:00:00.000Z';
const at=(seconds:number)=>new Date(Date.parse(now)+seconds*1000).toISOString();
const apply=(state:ReturnType<typeof emptyStudioState>,command:StudioCommand,actor=teacher,seconds=0)=>applyStudioCommand(state,command,actor,crypto.randomUUID(),at(seconds),()=>crypto.randomUUID());
const post={type:'post' as const,content:'Mensaje',question:false,room_id:null};

describe('reacciones y ritmo de participación',()=>{
  it('solo el instructor define un intervalo entero de 0 a 300 segundos',()=>{
    expect(()=>apply(emptyStudioState(),{type:'chat_interval',seconds:10},pupil)).toThrow('permisos');
    for(const seconds of [-1,301,1.5])expect(studioCommandSchema.safeParse({type:'chat_interval',seconds}).success).toBe(false);
    expect(apply(emptyStudioState(),{type:'chat_interval',seconds:0}).moderation.message_interval_seconds).toBe(0);
  });
  it('mantiene espera fuera del historial de cien mensajes y no limita al instructor',()=>{
    let state=apply(emptyStudioState(),{type:'chat_interval',seconds:10});state=apply(state,post,pupil);
    for(let n=0;n<101;n++)state=apply(state,post,teacher,1);
    expect(state.messages.some(message=>message.user_id===pupil.id)).toBe(false);
    expect(()=>apply(state,post,pupil,9)).toThrow('Espera 1 s');expect(apply(state,post,pupil,10).messages[99]?.user_id).toBe(pupil.id);
    state=apply(state,{type:'chat_interval',seconds:0});expect(()=>apply(state,post,pupil,1)).not.toThrow();
  });
  it('cambiar sala o renovar presencia no borra la espera',()=>{
    let state=apply(emptyStudioState(),{type:'chat_interval',seconds:30});state=apply(state,post,pupil);
    state.rooms=[{id:id(10),name:'Sala',user_ids:[pupil.id]}];state=apply(state,{type:'presence',room_id:id(10)},pupil,1);
    expect(()=>apply(state,{...post,room_id:id(10)},pupil,2)).toThrow('Espera');
  });
  it('reacciona sobre video aunque el chat esté cerrado, sin crear mensajes',()=>{
    let state=apply(emptyStudioState(),{type:'moderation',locked:true,reactions:true});state=apply(state,{type:'reaction',emoji:'👏',room_id:null},pupil);
    expect(state.messages).toEqual([]);expect(state.reaction_events[0]).toMatchObject({emoji:'👏',author:'Alumno',user_id:pupil.id});
    expect(()=>apply(state,{type:'reaction',emoji:'👍',room_id:null},pupil,.5)).toThrow('Espera');
    state=apply(state,{type:'moderation',locked:false,reactions:false});expect(()=>apply(state,{type:'reaction',emoji:'👍',room_id:null},pupil,2)).toThrow('deshabilitadas');
  });
  it('aísla eventos por sala y elimina eventos vencidos y ledger ajeno de la proyección',()=>{
    let state=emptyStudioState();state.rooms=[{id:id(10),name:'Sala',user_ids:[pupil.id]}];state=apply(state,{type:'presence',room_id:id(10)},pupil);state=apply(state,{type:'reaction',emoji:'❤️',room_id:id(10)},pupil);
    expect(projectStudioState(state,other,at(1)).reaction_events).toEqual([]);expect(projectStudioState(state,pupil,at(1)).reaction_events).toHaveLength(1);expect(projectStudioState(state,pupil,at(5)).reaction_events).toEqual([]);expect(projectStudioState(state,other,at(1)).participation).toEqual({});
    expect(studioCommandSchema.safeParse({type:'reaction',emoji:'texto',room_id:null}).success).toBe(false);expect(studioCommandSchema.safeParse({type:'reaction',emoji:'👏',room_id:null,author:'Falso'}).success).toBe(false);
  });
  it('lee estados anteriores con intervalo desactivado y sin eventos',()=>{
    const old={...emptyStudioState(),reaction_events:undefined,participation:undefined,moderation:{locked:false,reactions:true,restrictions:{}}};expect(studioStateSchema.parse(old)).toMatchObject({reaction_events:[],participation:{},moderation:{message_interval_seconds:0}});
=======
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
  it('preserva JSON legado antes de activar el nuevo servidor y rechaza una degradación posterior',async()=>{
    const {reaction_events,participation,moderation,...old}=emptyStudioState();
    const {message_interval_seconds,...legacyModeration}=moderation;
    void reaction_events;void participation;void message_interval_seconds;
    const legacy={...old,moderation:legacyModeration};
    await db.query('update live_studio_state set state=$1',[legacy]);
    async function raw(next:unknown,revision:number){
      await db.exec('reset role;set role service_role');
      return db.query('select live_studio_commit($1,$2,$3,$4,$5,$6,$7,$8)',[org,teacher,session,randomUUID(),'a'.repeat(64),revision,'moderation',next]);
    }
    await raw({...legacy,revision:1},0);
    const stored=await state();
    expect(stored).not.toHaveProperty('reaction_events');expect(stored).not.toHaveProperty('participation');
    expect(stored.moderation).not.toHaveProperty('message_interval_seconds');
    await raw({...emptyStudioState(),revision:2},1);
    await expect(raw({...legacy,revision:3},2)).rejects.toThrow('STUDIO_CONFLICT');
    expect((await state()).revision).toBe(2);
>>>>>>> 5e8da1368862cae7dd427adacaa38fc0631ffd85
  });
});
