// @vitest-environment node
import { createHmac } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createZoomStudioJoin } from '../studio-zoom.server';
import { signVideoSdk, prepareVideoSession, videoProviderForNewSession, videoSessionPath, endVideoSession } from '../video-sdk.server';
import { STUDIO_RECORDING_NOTICE_VERSION, zoomJoinSchema } from '../live-studio.contract';
import { ingestVideoRecording, loadVideoRecording, parseVideoRecording } from '../recordings/video.server';
vi.mock('../server', async () => ({ ...(await import('../errors')) }));
vi.mock('../zoom.server', () => ({ zoomRequest: vi.fn() }));
const id = '00000000-0000-4000-8000-000000000031';
const actor = { id, name: 'Instructora', canManage: false, courseId: id, status: 'live' as const };
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
function configuration() {
  for (const [key, value] of Object.entries({ ZOOM_VIDEO_SDK_KEY: 'sdk-publica', ZOOM_VIDEO_SDK_SECRET: 'secreto-prueba', ZOOM_VIDEO_ACCOUNT_ID: 'cuenta', ZOOM_VIDEO_API_KEY: 'api-privada', ZOOM_VIDEO_RECORDING_PRIVACY_APPROVED: 'true' })) vi.stubEnv(key, value);
}
function credentialsDb(overrides = {}) {
  const result = { session_id: id, session_name: `soflia_${id}`, remote_id: 'remota', password: 'abc123', account_id: 'cuenta', video_provider: 'zoom-video', ...overrides };
  const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: result }), maybeSingle: vi.fn().mockResolvedValue({ data: result }) };
  return { from: vi.fn(() => query), rpc: vi.fn().mockResolvedValue({ data: id }), query };
}
describe('Video SDK en el servidor', () => {
  it.each([true, false])('firma el rol derivado %s y una identidad estable sin credenciales administrativas', host => {
    const token = signVideoSdk('aula', id, { id, canManage: host }, 'sdk', 'secreto', 1790000000000);
    const [header, payload, mac] = token.split('.'); const claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
    expect(claims).toMatchObject({ role_type: host ? 1 : 0, user_key: id, session_key: id, tpc: 'aula', version: 1, cloud_recording_option: 0 });
    expect(claims.exp - claims.iat).toBe(13 * 3600);
    expect(mac).toBe(createHmac('sha256', 'secreto').update(`${header}.${payload}`).digest('base64url'));
    expect(claims).not.toHaveProperty('zak'); expect(token).not.toContain('secreto');
  });
  it('reutiliza la autorización del estudio sin llamar OAuth o pedir ZAK', async () => {
    configuration(); const db = credentialsDb();
    const join = await createZoomStudioJoin({ db } as never, { id, status: 'live', video_provider: 'zoom-video' } as never, actor);
    expect(join.provider).toBe('zoom-video');
    expect(join).not.toHaveProperty('zak'); expect(join).not.toHaveProperty('api_key');
    expect(JSON.parse(Buffer.from(('token' in join ? join.token : '').split('.')[1], 'base64url').toString()).role_type).toBe(0);
    expect(JSON.stringify(join)).not.toContain('api-privada');
  });
  it('rechaza aulas cerradas y cuentas diferentes', async () => {
    configuration(); const db = credentialsDb({ account_id: 'otra' });
    await expect(createZoomStudioJoin({ db } as never, { id, status: 'ended', video_provider: 'zoom-video' } as never, actor)).rejects.toThrow('cerrada');
    await expect(createZoomStudioJoin({ db } as never, { id, status: 'live', video_provider: 'zoom-video' } as never, actor)).rejects.toThrow('no coincide');
  });
  it('exige el aviso al anfitrión y conserva la activación de la cuenta Video', async () => {
    configuration();
    const db = credentialsDb();
    const session = { id, status: 'live', video_provider: 'zoom-video' } as never;
    const host = { ...actor, canManage: true };
    await expect(createZoomStudioJoin({ db } as never, session, host)).rejects.toMatchObject({ status: 428 });
    expect(db.from).not.toHaveBeenCalled();
    await expect(createZoomStudioJoin({ db } as never, session, host, STUDIO_RECORDING_NOTICE_VERSION)).resolves.toMatchObject({ provider: 'zoom-video' });
    vi.stubEnv('ZOOM_VIDEO_RECORDING_PRIVACY_APPROVED', undefined);
    await expect(createZoomStudioJoin({ db } as never, session, host, STUDIO_RECORDING_NOTICE_VERSION)).rejects.toMatchObject({ status: 503 });
  });
  it('comprueba grabación automática al programar y no acepta una respuesta degradada', async () => {
    configuration(); const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ session_id: 'remota', session_name: `soflia_${id}`, settings: { auto_recording: 'cloud' } })));
    vi.stubGlobal('fetch', fetcher); const prepared = await prepareVideoSession(id);
    expect(prepared.password.length).toBe(10); expect(prepared.name).toBe(`soflia_${id}`);
    expect(fetcher.mock.calls[0][0]).toBe('https://api.zoom.us/v2/videosdk/sessions');
    expect(JSON.parse(fetcher.mock.calls[0][1].body).settings.auto_recording).toBe('cloud');
    fetcher.mockResolvedValue(new Response(JSON.stringify({ session_id: 'remota', session_name: `soflia_${id}`, settings: { auto_recording: 'none' } })));
    await expect(prepareVideoSession(id)).rejects.toThrow();
  });
  it('conserva Meeting por defecto y rechaza configuración desconocida', () => {
    vi.stubEnv('LIVE_VIDEO_PROVIDER', ''); expect(videoProviderForNewSession()).toBe('zoom-meeting');
    vi.stubEnv('LIVE_VIDEO_PROVIDER', 'otro'); expect(() => videoProviderForNewSession()).toThrow();
    expect(videoSessionPath('a/b==', true)).toBe('a%252Fb%253D%253D');
    expect(videoSessionPath('a/b==')).toBe('a%2Fb%3D%3D');
    expect(videoSessionPath('/a//b==')).toBe('%252Fa%252F%252Fb%253D%253D');
  });
  it('termina solo las instancias del aula y conserva configuraciones que ya iniciaron', async () => {
    configuration(); const db = credentialsDb();
    const fetcher = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ sessions: [
      { id: 'a/b==', session_name: `soflia_${id}`, session_key: id },
      { id: 'ajena', session_name: 'otra-aula', session_key: id },
    ] }))).mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetcher);
    await endVideoSession({ db } as never, { id, status: 'live' } as never);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[1][0]).toBe('https://api.zoom.us/v2/videosdk/sessions/a%2Fb%3D%3D/status');
    expect(fetcher.mock.calls[1][1].method).toBe('PUT');
    expect(JSON.parse(fetcher.mock.calls[1][1].body)).toEqual({ action: 'end' });
  });
  it('rechaza credenciales mezcladas o elevaciones del rol desde el contrato', () => {
    expect(zoomJoinSchema.safeParse({ provider: 'zoom-video', sessionName: 'aula', token: 'jwt', userName: 'Ana', password: 'abc123', zak: 'prohibido' }).success).toBe(false);
    expect(zoomJoinSchema.safeParse({ provider: 'zoom-video', sessionName: 'aula', token: 'jwt', userName: 'Ana', password: 'abc123', role: 1 }).success).toBe(false);
  });
});
const metadata = { session_id: 'instancia', session_key: id, session_name: `soflia_${id}`, start_time: '2026-10-19T12:00:00Z', recording_files: [
  { id: 'mp4', file_type: 'MP4', file_size: 500, recording_type: 'shared_screen_with_speaker_view', recording_start: '2026-10-19T12:00:00Z', recording_end: '2026-10-19T15:00:00Z', status: 'completed', download_url: 'https://zoom.us/privado' }, { file_type: 'TIMELINE' },
] };
describe('grabación Video SDK privada', () => {
  it('importa solo MP4 compuesto y no persiste URLs remotas', async () => {
    configuration(); const db = credentialsDb(); expect(parseVideoRecording(metadata).recording_files).toHaveLength(1);
    expect(await ingestVideoRecording(db as never, metadata)).toBe(true);
    expect(db.rpc).toHaveBeenCalledWith('live_recording_ingest', expect.objectContaining({ p_session: id, p_account: 'video:cuenta', p_host: 'video:cuenta', p_uuid: 'instancia' }));
    expect(JSON.stringify(db.rpc.mock.calls)).not.toContain('https://');
  });
  it.each([{ session_name: 'otra' }, { account_id: 'otra' }, { video_provider: 'zoom-meeting' }])('rechaza grabaciones de otra vinculación %j', async overrides => {
    configuration(); const db = credentialsDb(overrides);
    await expect(ingestVideoRecording(db as never, metadata)).rejects.toThrow(); expect(db.rpc).not.toHaveBeenCalled();
  });
  it('rechaza una instancia de otra aula antes de descargar', async () => {
    configuration(); const db = credentialsDb(); vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ ...metadata, session_key: '00000000-0000-4000-8000-000000000032' }))));
    await expect(loadVideoRecording(db as never, { session_id: id, account_id: 'video:cuenta', host_id: 'video:cuenta', provider_uuid: 'instancia' } as never)).rejects.toThrow('otra aula');
    expect(db.rpc).not.toHaveBeenCalled();
  });
});
