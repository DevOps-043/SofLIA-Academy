// @vitest-environment node
import {describe,expect,it,vi,afterEach} from 'vitest';
import {NextRequest} from 'next/server';
import {POST} from '@/app/api/auth/live/studio/route';
import {verifiedHubUser,hubActorContext} from '../hub-auth.server';
import {executeStudio} from '../studio.service';
import {LiveError} from '../server';
vi.mock('../hub-auth.server',()=>({verifiedHubUser:vi.fn(),hubActorContext:vi.fn(),readWorkspaceBody:async(request:Request)=>request.json()}));
vi.mock('../studio.service',()=>({executeStudio:vi.fn()}));
vi.mock('@/lib/rate-limit/advanced-rate-limit',()=>({rateLimitMiddleware:()=>null,RateLimitTier:{API_READ:'read',API_MUTATION:'write'}}));
const id='00000000-0000-4000-8000-000000000001';
afterEach(()=>vi.resetAllMocks());
describe('negociación HTTP del estudio',()=>{
  it.each([['1',1],['2',0],['',0]] as const)('negocia cabecera %s sin cambiar el JSON de ingreso',async(header,enabled)=>{
    vi.mocked(verifiedHubUser).mockResolvedValue(id);vi.mocked(hubActorContext).mockResolvedValue({userId:id} as never);vi.mocked(executeStudio).mockResolvedValue({} as never);
    const request=new NextRequest('https://learning.example/api/auth/live/studio',{method:'POST',headers:{'Content-Type':'application/json',...(header?{'X-Soflia-Studio-Participation':header}:{})},body:JSON.stringify({organization_slug:'empresa',session_id:id,operation:{type:'snapshot'}})});
    expect((await POST(request)).status).toBe(200);
    expect(executeStudio).toHaveBeenCalledWith({userId:id},id,{type:'snapshot'},enabled);
  });
  it('rechaza identidad no autenticada antes de leer el contexto o ejecutar',async()=>{
    vi.mocked(verifiedHubUser).mockRejectedValue(new LiveError(401,'Sin sesión'));
    const response=await POST(new NextRequest('https://learning.example/api/auth/live/studio',{method:'POST',body:'{}'}));
    expect(response.status).toBe(401);expect(hubActorContext).not.toHaveBeenCalled();expect(executeStudio).not.toHaveBeenCalled();
  });
});
