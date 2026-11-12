// @vitest-environment node
import { beforeEach,describe,expect,it,vi } from 'vitest';
import { NextRequest } from 'next/server';
import { STUDIO_RECORDING_NOTICE_HEADER, STUDIO_RECORDING_NOTICE_VERSION } from '@/features/live/live-studio.contract';
import { LiveError } from '@/features/live/errors';
const mocks=vi.hoisted(()=>({getUser:vi.fn(),org:vi.fn(),actor:vi.fn(),execute:vi.fn()}));
vi.mock('@/lib/supabase/admin',()=>({createAdminClient:()=>({auth:{getUser:mocks.getUser},from:()=>({select:()=>({eq:()=>({maybeSingle:mocks.org})})})})}));
vi.mock('@/lib/rate-limit/advanced-rate-limit',()=>({rateLimitMiddleware:()=>null,RateLimitTier:{API_READ:'read',API_MUTATION:'write'}}));
vi.mock('@/features/live/server',async()=>({...await vi.importActual<typeof import('@/features/live/server')>('@/features/live/server'),liveActorContext:mocks.actor}));
vi.mock('@/features/live/studio.service',()=>({executeStudio:mocks.execute}));
import { POST } from '../route';
const session='00000000-0000-4000-8000-000000000031';
const input={organization_slug:'acme',session_id:session,operation:{type:'snapshot'}};
function request(version?:string,body:unknown=input,token='eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZWFjaGVyIn0.c2ln'){return new NextRequest('https://learning.test/api/auth/live/studio',{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{ }),...(version?{'X-Soflia-Studio-Participation':version}:{})},body:JSON.stringify(body)});}
beforeEach(()=>{vi.resetAllMocks();mocks.getUser.mockResolvedValue({data:{user:{id:'teacher'}},error:null});mocks.org.mockResolvedValue({data:{id:'org',is_active:true},error:null});mocks.actor.mockResolvedValue({userId:'teacher',orgId:'org'});mocks.execute.mockResolvedValue({});});
describe('negociación HTTP del estudio',()=>{
  it.each([[undefined,0],['1',1],['99',0]] as const)('negocia por cabecera sin añadir campos al JSON: %s',async(version,expected)=>{
    expect((await POST(request(version))).status).toBe(200);expect(mocks.execute).toHaveBeenCalledWith(expect.objectContaining({userId:'teacher'}),session,{type:'snapshot'},expected);
  });
  it('sigue denegando acceso no autenticado o sin membresía',async()=>{
    expect((await POST(request('1',input,''))).status).toBe(401);expect(mocks.execute).not.toHaveBeenCalled();mocks.actor.mockRejectedValueOnce(new LiveError(403,'Sin membresía'));expect((await POST(request('1'))).status).toBe(403);expect(mocks.execute).not.toHaveBeenCalled();
  });
  it('no admite rol ni identidad elegidos en el cuerpo aunque la cabecera sea válida',async()=>{
    expect((await POST(request('1',{...input,role:'instructor'}))).status).toBe(400);expect(mocks.execute).not.toHaveBeenCalled();
  });
});


describe('aviso de grabación junto con negociación de participación', () => {
  it.each([undefined, '0', String(STUDIO_RECORDING_NOTICE_VERSION)])('interpreta la versión HTTP %s conservando el JSON anterior', async version => {
    const req = request(undefined, { ...input, operation: { type: 'zoom' } });
    if (version !== undefined) req.headers.set(STUDIO_RECORDING_NOTICE_HEADER, version);
    const response = await POST(req);
    expect(response.status).toBe(200);
    expect(mocks.execute).toHaveBeenCalledWith(expect.objectContaining({ userId: 'teacher' }), session, {
      type: 'zoom', recording_notice_version: version === String(STUDIO_RECORDING_NOTICE_VERSION) ? STUDIO_RECORDING_NOTICE_VERSION : undefined,
    }, 0);
    expect(response.headers.get('Referrer-Policy')).toBe('no-referrer');
  });
  it('conserva ambas cabeceras y no acepta el aviso enviado sólo en el cuerpo', async () => {
    const body = { ...input, operation: { type: 'zoom', recording_notice_version: STUDIO_RECORDING_NOTICE_VERSION } };
    await POST(request('1', body));
    expect(mocks.execute).toHaveBeenLastCalledWith(expect.anything(), session, { type: 'zoom', recording_notice_version: undefined }, 1);
    const req = request('1', body); req.headers.set(STUDIO_RECORDING_NOTICE_HEADER, String(STUDIO_RECORDING_NOTICE_VERSION));
    await POST(req);
    expect(mocks.execute).toHaveBeenLastCalledWith(expect.anything(), session, { type: 'zoom', recording_notice_version: STUDIO_RECORDING_NOTICE_VERSION }, 1);
  });
});
