// @vitest-environment node
import { describe,it,expect,vi,afterEach } from 'vitest';
vi.mock('../zoom.server',()=>({zoomRequest:vi.fn(async()=>({token:'zak-de-prueba'}))}));
vi.mock('../recordings/platform-hosts.server',()=>({verifyRecordingHost:vi.fn(async()=>({email:'anfitrion@soflia.test'})),verifyAutomaticRecording:vi.fn(),requireIdleHost:vi.fn()}));
import { createZoomStudioJoin } from '../studio-zoom.server';
import { STUDIO_RECORDING_NOTICE_VERSION } from '../live-studio.contract';
import { verifyRecordingHost, verifyAutomaticRecording } from '../recordings/platform-hosts.server';
import { zoomRequest } from '../zoom.server';
import type { LiveContext } from '../server';
import type { StudioActor } from '../live-studio-domain';
import type { LiveSession } from '../types';
const session={id:'00000000-0000-4000-8000-000000000031',status:'scheduled',session_type:'webinar',zoom_webinar_id:'12345678901'} as LiveSession;
function context(email:string|null):LiveContext{
 return {userId:'00000000-0000-4000-8000-000000000011',instructor:null,db:{from:(table:string)=>{const builder={select:()=>builder,eq:()=>builder,single:async()=>({data:{host_id:'central',password:''},error:null}),maybeSingle:async()=>({data:table==='users'?{email}:null,error:null})};return builder;}}} as unknown as LiveContext;
}
afterEach(()=>{vi.unstubAllEnvs();vi.clearAllMocks();});
describe('Ingreso al webinar sin cuenta docente de Zoom',()=>{
 it.each([true,false])('elige un correo de servidor para el rol de anfitrión %s',async host=>{
  vi.stubEnv('ZOOM_MEETING_SDK_CLIENT_ID','sdk-prueba');vi.stubEnv('ZOOM_MEETING_SDK_CLIENT_SECRET','secreto-prueba');
  const actor={name:'Persona',canManage:host} as StudioActor;
  vi.stubEnv('ZOOM_RECORDING_PRIVACY_APPROVED', undefined);
  const result=await createZoomStudioJoin(context('alumno@soflia.test'),session,actor,host ? STUDIO_RECORDING_NOTICE_VERSION : undefined);
  expect(result.userEmail).toBe(host?'anfitrion@soflia.test':'alumno@soflia.test');
  if(!host)expect(zoomRequest).not.toHaveBeenCalled();
  else {
   expect(verifyRecordingHost).toHaveBeenCalledWith('central', true);
   expect(verifyAutomaticRecording).toHaveBeenCalledWith(session, 'central');
  }
 });
 it.each([undefined, 0])('rechaza al instructor sin aceptación vigente (%s) antes de consultar al proveedor', async version => {
  await expect(createZoomStudioJoin(context(null),session,{name:'Instructor',canManage:true} as StudioActor,version)).rejects.toMatchObject({status:428});
  expect(verifyRecordingHost).not.toHaveBeenCalled();
  expect(zoomRequest).not.toHaveBeenCalled();
 });
 it('no inventa un correo para un participante sin perfil completo',async()=>{
  vi.stubEnv('ZOOM_MEETING_SDK_CLIENT_ID','sdk-prueba');vi.stubEnv('ZOOM_MEETING_SDK_CLIENT_SECRET','secreto-prueba');
  await expect(createZoomStudioJoin(context(null),session,{name:'Persona',canManage:false} as StudioActor)).rejects.toMatchObject({status:409});
 });
});
