// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { scheduleSession } from '../services/schedule.service';
import { claimPlatformHost } from '../recordings/platform-hosts.server';
import { zoomRequest } from '../zoom.server';
vi.mock('../recordings/platform-hosts.server', () => ({ claimPlatformHost: vi.fn(), verifyAutomaticRecording: vi.fn(), preflightRecordingHost: vi.fn() }));
vi.mock('../zoom.server', () => ({ zoomRequest: vi.fn() }));
vi.mock('@/lib/utils/logger', () => ({ logger: { error: vi.fn() } }));
const id = '00000000-0000-4000-8000-000000000031';
const input = { request_id: id, course_id: id, title: 'Curso de Video SDK', description: 'Clase', starts_at: '2026-12-01T18:00:00Z', duration_minutes: 180, session_type: 'webinar' };
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.clearAllMocks(); });
function setup(failed = false, committed = false) {
  for (const [key, value] of Object.entries({ LIVE_VIDEO_PROVIDER: 'zoom-video', ZOOM_VIDEO_SDK_KEY: 'sdk', ZOOM_VIDEO_SDK_SECRET: 'prueba', ZOOM_VIDEO_API_KEY: 'api', ZOOM_VIDEO_ACCOUNT_ID: 'cuenta', ZOOM_VIDEO_RECORDING_PRIVACY_APPROVED: 'true' })) vi.stubEnv(key, value);
  const session = { id, video_provider: 'zoom-video', title: input.title };
  const credentials = { remote_id: 'remota' };
  const query = (data: unknown) => ({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(async () => ({ data, error: null })), single: vi.fn(async () => ({ data, error: null })),
    insert: vi.fn(async () => ({ data: null, error: null })), update: vi.fn().mockReturnThis(),
  });
  const requests = query({ state: committed ? 'completed' : 'pending', session_id: committed ? id : null });
  const db = { from: vi.fn((table: string) => table === 'courses' ? query({ id, instructor_id: id }) : table === 'live_scheduling_requests' ? requests : query(table === 'live_sessions' ? session : credentials)),
    rpc: vi.fn(async () => ({ data: failed ? null : session, error: failed ? { message: 'respuesta perdida' } : null })),
  };
  const fetcher = vi.fn(async (_url: string, init: RequestInit) => init.method === 'DELETE' ? new Response(null, { status: 204 }) : new Response(JSON.stringify({ session_id: 'remota', session_name: `soflia_${id}`, settings: { auto_recording: 'cloud' } })));
  vi.stubGlobal('fetch', fetcher);
  return { context: { db, canTeach: true, orgId: id, userId: id } as never, db, fetcher, session };
}
describe('programación Video SDK', () => {
  it('programa un curso de tres horas sin reservar anfitrión ni crear un webinar Meeting', async () => {
    const { context, db, session } = setup();
    expect(await scheduleSession(context, input)).toEqual({ session });
    expect(db.rpc).toHaveBeenCalledWith('live_finalize_video_session', expect.objectContaining({ p_request: id, p_account: 'cuenta', p_session: expect.objectContaining({ duration_minutes: 180 }) }));
    expect(claimPlatformHost).not.toHaveBeenCalled(); expect(zoomRequest).not.toHaveBeenCalled();
  });
  it('reconcilia una transacción confirmada antes de compensar una respuesta perdida', async () => {
    const { context, fetcher, session } = setup(true, true);
    expect(await scheduleSession(context, input)).toEqual({ session });
    expect(fetcher.mock.calls.some(([, init]) => init.method === 'DELETE')).toBe(false);
  });
  it('elimina únicamente la configuración remota recién creada si no hubo confirmación', async () => {
    const { context, fetcher } = setup(true, false);
    await expect(scheduleSession(context, input)).rejects.toThrow();
    expect(fetcher.mock.calls.some(([url, init]) => url === 'https://api.zoom.us/v2/videosdk/sessions/remota' && init.method === 'DELETE')).toBe(true);
  });
});
