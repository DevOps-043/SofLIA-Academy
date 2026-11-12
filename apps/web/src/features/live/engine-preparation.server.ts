import 'server-only';
import { createHmac, timingSafeEqual, createHash } from 'node:crypto';
import { enginePreparationSchema } from './engine-preparation.contract';
import { studioSnapshotSchema } from './live-studio.contract';
import { liveSession, LiveError, type LiveContext } from './server';
import { executeStudio } from './studio.service';

export function verifyEnginePreparation(raw:string,timestamp:string|null,signature:string|null,key:string|undefined,now=Date.now()){
  if(!key)throw new LiveError(503,'La entrega de Engine aún no está configurada.');
  if(!timestamp||!/^\d{13}$/.test(timestamp)||Math.abs(now-Number(timestamp))>300000||!signature||!/^v1=[a-f0-9]{64}$/.test(signature))throw new LiveError(401,'Firma de preparación inválida.');
  const expected=createHmac('sha256',key).update(`live-preparation:v1:${timestamp}:${raw}`).digest();
  if(!timingSafeEqual(expected,Buffer.from(signature.slice(3),'hex')))throw new LiveError(401,'Firma de preparación inválida.');
}
export async function deliverEnginePreparation(context:LiveContext,input:unknown){
  const preparation=enginePreparationSchema.parse(input);
  if(preparation.actor_id!==context.userId)throw new LiveError(403,'La preparación pertenece a otro actor.');
  const {session}=await liveSession(context,preparation.session_id,true);
  if(session.course_id!==preparation.manifest.course_id)throw new LiveError(403,'La preparación pertenece a otro curso.');
  if(session.status!=='scheduled')throw new LiveError(409,'Entrega la preparación antes de iniciar la sesión.');
  const result=await executeStudio(context,session.id,{type:'snapshot'},1);
  const snapshot=studioSnapshotSchema.parse('snapshot' in result?result.snapshot:undefined);
  if(snapshot.state.answers.length||snapshot.state.submissions.length)throw new LiveError(409,'La sesión ya tiene trabajo de participantes.');
  const digest=createHash('sha256').update(JSON.stringify(preparation)).digest('hex');
  const commandId=`${digest.slice(0,8)}-${digest.slice(8,12)}-5${digest.slice(13,16)}-a${digest.slice(17,20)}-${digest.slice(20,32)}`;
  await executeStudio(context,session.id,{type:'command',id:commandId,revision:snapshot.state.revision,command:{type:'import_engine',manifest:preparation.manifest}},1);
  return {delivered:true,session_id:session.id,engine_revision:preparation.manifest.revision};
}
