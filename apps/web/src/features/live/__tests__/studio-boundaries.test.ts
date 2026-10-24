// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LiveError } from '../errors';
import type { LiveContext } from '../server';
import { emptyStudioState } from '../live-studio-domain';
import { executeStudio } from '../studio.service';
import { verifyStudioAssets } from '../studio-assets.server';
import { purgeStudioAssets } from '../studio-retention.server';
const mocks = vi.hoisted(() => ({ liveSession: vi.fn(), liveActorContext: vi.fn(), zoom: vi.fn() }));
vi.mock('../server', async () => ({ ...(await vi.importActual('../errors')), liveSession: mocks.liveSession, liveActorContext: mocks.liveActorContext }));
vi.mock('../studio-zoom.server', () => ({ createZoomStudioJoin: mocks.zoom }));
const org = '00000000-0000-4000-8000-000000000001', session = '00000000-0000-4000-8000-000000000031', user = '00000000-0000-4000-8000-000000000011';
function context(db: unknown) { return { db, userId: user, orgId: org, isAdmin: true, canTeach: true, instructor: null } as LiveContext; }
beforeEach(() => vi.resetAllMocks());
describe('fronteras del estudio en Learning', () => {
  it('mantiene forma antigua sin negociación y solo entrega participación tras solicitarla',async()=>{
    const state=emptyStudioState();state.moderation.message_interval_seconds=15;
    const ctx=context({from:(table:string)=>{const chain={select:()=>chain,eq:()=>chain,single:async()=>({data:{display_name:'Docente'},error:null}),maybeSingle:async()=>({data:table==='live_studio_state'?{state}:table==='organizations'?{is_active:true}:null,error:null})};return chain;}});
    mocks.liveSession.mockResolvedValue({session:{id:session,course_id:org,status:'live',title:'Clase'},canManage:true});mocks.liveActorContext.mockResolvedValue(ctx);
    const legacy=await executeStudio(ctx,session,{type:'snapshot'});expect(legacy.snapshot?.state).not.toHaveProperty('reaction_events');expect(legacy.snapshot?.state.moderation).not.toHaveProperty('message_interval_seconds');
    const modern=await executeStudio(ctx,session,{type:'snapshot'},1);expect(modern.snapshot?.state).toHaveProperty('reaction_events',[]);expect(modern.snapshot?.state.moderation).toHaveProperty('message_interval_seconds',15);
    await expect(executeStudio(ctx,session,{type:'command',id:user,revision:0,command:{type:'reaction',emoji:'👏',room_id:null}})).rejects.toThrow('Actualiza Hub');
  });
  it('delega presencia obsoleta al merge SQL pero mantiene CAS para acciones del instructor', async () => {
    const state = {...emptyStudioState(),revision:2};
    const rpc = vi.fn().mockResolvedValue({data:3,error:null});
    const ctx = context({rpc,from:(table:string)=>{
      const chain = {select:()=>chain,eq:()=>chain,single:async()=>({data:{display_name:'Instructor'},error:null}),maybeSingle:async()=>({data:table==='live_studio_state'?{state}:table==='organizations'?{is_active:true}:null,error:null})};
      return chain;
    }});
    mocks.liveSession.mockResolvedValue({session:{id:session,course_id:org,status:'live',title:'Prueba'},canManage:true});
    mocks.liveActorContext.mockResolvedValue(ctx);
    await executeStudio(ctx,session,{type:'command',id:user,revision:1,command:{type:'presence',room_id:null}});
    expect(rpc).toHaveBeenCalledWith('live_studio_commit',expect.objectContaining({p_expected:1,p_type:'presence'}));
    await expect(executeStudio(ctx,session,{type:'command',id:org,revision:1,command:{type:'moderation',locked:true,reactions:true}})).rejects.toThrow('El estado cambió');
    expect(rpc).toHaveBeenCalledOnce();
  });
  it('reconstruye autorización después de obtener ZAK y no devuelve grant tras revocación', async () => {
    const chain = { select: () => chain, eq: () => chain, single: async () => ({ data:{display_name:'Instructor'},error:null }), maybeSingle: async () => ({data:null,error:null}) };
    const ctx = context({from:()=>chain});
    mocks.liveSession.mockResolvedValue({ session:{ id:session,course_id:org,status:'live' },canManage:true });
    mocks.zoom.mockResolvedValue({ signature:'no-se-debe-entregar' });
    mocks.liveActorContext.mockRejectedValue(new LiveError(403,'Acceso revocado'));
    await expect(executeStudio(ctx,session,{type:'zoom'})).rejects.toThrow('Acceso revocado');
    expect(mocks.zoom).toHaveBeenCalledOnce(); expect(mocks.liveActorContext).toHaveBeenCalledWith(user,org);
  });
  it('verifica ruta, tamaño y tipo reales de cada archivo nuevo', async () => {
    const info=vi.fn().mockResolvedValue({data:{size:10,contentType:'text/plain'},error:null});
    const ctx=context({storage:{from:()=>({info})}});
    const state=emptyStudioState(), material={id:user,name:'Lectura',kind:'reading' as const,asset_path:`${org}/${session}/${user}`,mime:'text/plain',bytes:10};
    await verifyStudioAssets(ctx,session,state,{...state,materials:[material]});
    await expect(verifyStudioAssets(ctx,session,state,{...state,materials:[{...material,bytes:11}]})).rejects.toThrow('no coinciden');
    await expect(verifyStudioAssets(ctx,session,state,{...state,materials:[{...material,asset_path:'otra/sesion/archivo'}]})).rejects.toThrow('no pertenece');
  });
  it('rechaza el grant si la organización se desactiva mientras Zoom responde', async () => {
    const chain = { select: () => chain, eq: () => chain, single: async () => ({ data:{display_name:'Instructor'},error:null }), maybeSingle: async () => ({data:null,error:null}) };
    const ctx = context({from:()=>chain});
    const disabled = { select: () => disabled, eq: () => disabled, maybeSingle: async () => ({data:{is_active:false},error:null}) };
    mocks.liveSession.mockResolvedValue({ session:{ id:session,course_id:org,status:'live' },canManage:true });
    mocks.zoom.mockResolvedValue({ signature:'no-se-debe-entregar' });
    mocks.liveActorContext.mockResolvedValue(context({from:()=>disabled}));
    await expect(executeStudio(ctx,session,{type:'zoom'})).rejects.toThrow('Organización sin acceso');
  });
  it('conserva reclamaciones si Storage falla y confirma solo después de borrar bytes', async () => {
    const remove=vi.fn().mockResolvedValueOnce({data:null,error:{message:'Storage no disponible'}}).mockResolvedValue({data:[],error:null});
    const confirm=vi.fn().mockResolvedValue({data:[],error:null});
    const from=vi.fn(()=>({delete:()=>({in:()=>({eq:confirm})})}));
    const ctx=context({rpc:async()=>({data:['ruta'],error:null}),storage:{from:()=>({remove})},from});
    await expect(purgeStudioAssets(ctx.db)).rejects.toThrow(); expect(from).not.toHaveBeenCalled();
    expect(await purgeStudioAssets(ctx.db)).toBe(1); expect(confirm).toHaveBeenCalledWith('status','purging');
    expect(remove.mock.invocationCallOrder[1]).toBeLessThan(confirm.mock.invocationCallOrder[0]);
  });
});
