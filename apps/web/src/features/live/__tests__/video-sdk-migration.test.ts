// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { PGlite } from '@electric-sql/pglite';
import { createWorkspaceDatabase } from './workspace-database.fixture';
let db: PGlite;
const org='00000000-0000-4000-8000-000000000001', user='00000000-0000-4000-8000-000000000011', course='00000000-0000-4000-8000-000000000021', request='00000000-0000-4000-8000-000000000041';
const input={organization_id:org,instructor_id:user,course_id:course,title:'Curso Video SDK',description:'Clase',starts_at:'2026-11-01T12:00:00Z',duration_minutes:180,session_type:'webinar'};
beforeAll(async()=>{
  db=await createWorkspaceDatabase(false);
  const sql=readFileSync(resolve(process.cwd(),'../../supabase/migrations/20261019120000_live_video_sdk.sql'),'utf8'); await db.exec(sql);await db.exec(sql);
  await db.exec(`insert into organizations(id) values('${org}');insert into users(id) values('${user}');insert into organization_users values('${org}','${user}','member','active');insert into organization_instructors(organization_id,user_id) values('${org}','${user}');insert into courses values('${course}','${user}','Curso');grant select on organizations,users,organization_users,courses,organization_instructors to service_role;insert into live_scheduling_requests(id,organization_id,user_id,payload_hash) values('${request}','${org}','${user}','prueba');`);
},60000);
afterAll(async()=>{await db?.close();});
describe('migración Video SDK',()=>{
  it('rechaza clientes públicos incluso para credenciales de sus propias aulas',async()=>{
    await db.exec('set role authenticated');
    await expect(db.query('select * from live_video_credentials')).rejects.toThrow(/permission denied/i);
    await expect(db.query('select live_finalize_video_session($1,$2,$3,$4,$5)',[request,input,'remota','abc123','cuenta'])).rejects.toThrow(/permission denied/i);
    await db.exec('reset role');
  });
  it('rechaza organización o identidad distintas sin completar la solicitud',async()=>{
    await db.exec('set role service_role');
    await expect(db.query('select live_finalize_video_session($1,$2,$3,$4,$5)',[request,{...input,instructor_id:course},'remota','abc123','cuenta'])).rejects.toThrow('inválida');
    await db.exec('reset role');
  });
  it('revalida la organización tras crear el recurso remoto',async()=>{
    await db.exec(`reset role;update organizations set is_active=false where id='${org}';set role service_role`);
    await expect(db.query('select live_finalize_video_session($1,$2,$3,$4,$5)',[request,input,'remota','abc123','cuenta'])).rejects.toThrow('autorización');
    await db.exec(`reset role;update organizations set is_active=true where id='${org}'`);
  });
  it('finaliza atómicamente sin reunión Meeting y evita duplicados',async()=>{
    await db.exec('set role service_role');
    await db.query('select live_finalize_video_session($1,$2,$3,$4,$5)',[request,input,'remota','abc123','cuenta']);
    const row=(await db.query<{video_provider:string;zoom_meeting_id:string|null}>(`select video_provider,zoom_meeting_id from live_sessions where id='${request}'`)).rows[0];
    expect(row).toEqual({video_provider:'zoom-video',zoom_meeting_id:null});
    expect((await db.query(`select session_name from live_video_credentials where session_id='${request}'`)).rows[0]).toEqual({session_name:`soflia_${request}`});
    await expect(db.query('select live_finalize_video_session($1,$2,$3,$4,$5)',[request,input,'remota','abc123','cuenta'])).rejects.toThrow('inválida');
    await db.exec('reset role');
  });
});
