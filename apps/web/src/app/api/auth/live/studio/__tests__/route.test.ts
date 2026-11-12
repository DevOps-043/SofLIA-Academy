// @vitest-environment node
<<<<<<< HEAD
import { beforeEach,describe,expect,it,vi } from 'vitest';
import { NextRequest } from 'next/server';
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
=======
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { STUDIO_RECORDING_NOTICE_HEADER, STUDIO_RECORDING_NOTICE_VERSION } from '@/features/live/live-studio.contract';
import { executeStudio } from '@/features/live/studio.service';
import { POST } from '../route';

vi.mock('@/features/live/hub-auth.server', () => ({
  verifiedHubUser: vi.fn(async () => 'instructor'),
  hubActorContext: vi.fn(async () => ({ userId: 'instructor' })),
  readWorkspaceBody: (request: Request) => request.json(),
}));
vi.mock('@/features/live/studio.service', () => ({ executeStudio: vi.fn(async () => ({})) }));
vi.mock('@/lib/rate-limit/advanced-rate-limit', () => ({ rateLimitMiddleware: () => null, RateLimitTier: { API_MUTATION: 'mutation' } }));

afterEach(() => vi.clearAllMocks());

describe('aceptación del aviso de grabación en la ruta del estudio', () => {
  it.each([undefined, '0', String(STUDIO_RECORDING_NOTICE_VERSION)])('interpreta la versión HTTP %s con el JSON anterior', async version => {
    const sessionId = '00000000-0000-4000-8000-000000000031';
    const headers = new Headers({ 'Content-Type': 'application/json' });
    if (version !== undefined) headers.set(STUDIO_RECORDING_NOTICE_HEADER, version);
    const response = await POST(new NextRequest('https://learning.test/api/auth/live/studio', {
      method: 'POST', headers, body: JSON.stringify({ organization_slug: 'acme', session_id: sessionId, operation: { type: 'zoom' } }),
    }));
    expect(response.status).toBe(200);
    expect(executeStudio).toHaveBeenCalledWith({ userId: 'instructor' }, sessionId, {
      type: 'zoom', recording_notice_version: version === String(STUDIO_RECORDING_NOTICE_VERSION) ? STUDIO_RECORDING_NOTICE_VERSION : undefined,
    }, false);
>>>>>>> 5e8da1368862cae7dd427adacaa38fc0631ffd85
  });
});
