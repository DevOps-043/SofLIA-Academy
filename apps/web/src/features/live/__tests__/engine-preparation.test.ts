// @vitest-environment node
import {createHmac} from 'node:crypto';
import {describe,expect,it,vi,afterEach} from 'vitest';
import {verifyEnginePreparation,deliverEnginePreparation} from '../engine-preparation.server';
import {liveSession,LiveError} from '../server';
import {executeStudio} from '../studio.service';
import {enginePreparationRevision} from '../engine-preparation.contract';
import {emptyStudioState} from '../live-studio-domain';
vi.mock('../server',async()=>({...await import('../errors'),liveSession:vi.fn()}));
vi.mock('../studio.service',()=>({executeStudio:vi.fn()}));
const id=(n:number)=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const payload={version:1 as const,actor_id:id(1),artifact_id:id(2),source_session_id:id(3),source_revision:4,organization_slug:'empresa',session_id:id(5),manifest:{version:1 as const,course_id:id(6),revision:enginePreparationRevision(id(2),id(3),4),scenes:[],materials:[],quizzes:[],practices:[]}};
const context={userId:id(1)} as Parameters<typeof deliverEnginePreparation>[0];
afterEach(()=>vi.resetAllMocks());
describe('frontera de preparación de Engine',()=>{
  it('firma cuerpo y fecha, rechaza expiración, alteración y configuración ausente',()=>{
    const raw=JSON.stringify(payload),now=1790000000000,timestamp=String(now),key='clave-solo-prueba';
    const signature='v1='+createHmac('sha256',key).update(`live-preparation:v1:${timestamp}:${raw}`).digest('hex');
    expect(()=>verifyEnginePreparation(raw,timestamp,signature,key,now)).not.toThrow();
    expect(()=>verifyEnginePreparation(raw+'x',timestamp,signature,key,now)).toThrow('Firma');
    expect(()=>verifyEnginePreparation(raw,timestamp,signature,key,now+300001)).toThrow('Firma');
    expect(()=>verifyEnginePreparation(raw,timestamp,signature,undefined,now)).toThrow('configurada');
  });
  it('comprueba actor, permiso docente y curso antes de escribir',async()=>{
    await expect(deliverEnginePreparation({...context,userId:id(9)},payload)).rejects.toThrow('actor');
    vi.mocked(liveSession).mockRejectedValueOnce(new LiveError(403,'Sin permiso'));
    await expect(deliverEnginePreparation(context,payload)).rejects.toThrow('Sin permiso');
    vi.mocked(liveSession).mockResolvedValue({session:{id:id(5),course_id:id(9),status:'scheduled'},canManage:true} as never);
    await expect(deliverEnginePreparation(context,payload)).rejects.toThrow('curso');
    expect(executeStudio).not.toHaveBeenCalled();
  });
  it('reutiliza UUID de entrega y rechaza clases iniciadas o con respuestas',async()=>{
    vi.mocked(liveSession).mockResolvedValue({session:{id:id(5),course_id:id(6),status:'scheduled'},canManage:true} as never);
    const snapshot={session_id:id(5),user_id:id(1),can_manage:true,title:'Clase',server_time:new Date().toISOString(),state:emptyStudioState(),asset_urls:{}};
    vi.mocked(executeStudio).mockResolvedValue({snapshot} as never);
    await deliverEnginePreparation(context,payload);await deliverEnginePreparation(context,payload);
    const commands=vi.mocked(executeStudio).mock.calls.filter(call=>call[2].type==='command');
    expect(commands).toHaveLength(2);expect(commands[0][2]).toEqual(commands[1][2]);
    snapshot.state.answers=[{quiz_id:id(7),user_id:id(8),answer:1}];
    await expect(deliverEnginePreparation(context,payload)).rejects.toThrow('trabajo');
    vi.mocked(liveSession).mockResolvedValue({session:{id:id(5),course_id:id(6),status:'live'},canManage:true} as never);
    await expect(deliverEnginePreparation(context,payload)).rejects.toThrow('antes');
  });
});
