// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { LiveError } from '@/features/live/errors';
const mocks = vi.hoisted(() => ({ getUser: vi.fn(), org: vi.fn(), actor: vi.fn(), catalog: vi.fn() }));
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({ auth: { getUser: mocks.getUser }, from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.org }) }) }) }) }));
vi.mock('@/lib/rate-limit/advanced-rate-limit', () => ({ rateLimitMiddleware: () => null, RateLimitTier: { API_READ: 'read' } }));
vi.mock('@/features/live/server', async () => ({ ...await vi.importActual<typeof import('@/features/live/server')>('@/features/live/server'), liveActorContext: mocks.actor }));
vi.mock('@/features/live/services/catalog.service', () => ({ listLiveCatalog: mocks.catalog }));
import { POST } from '../route';
const input = { organization_slug: 'acme', page: 1, view: 'student' };
function request(body: unknown = input, token = 'verified.token.signature', extended = false) {
  return new NextRequest('https://learning.test/api/auth/live/catalog', { method: 'POST', headers: token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(extended ? { 'X-Soflia-Catalog-Capabilities': '1' } : {}) } : {}, body: JSON.stringify(body) });
}
beforeEach(() => {
  vi.resetAllMocks(); mocks.getUser.mockResolvedValue({ data: { user: { id: 'student' } }, error: null });
  mocks.org.mockResolvedValue({ data: { id: 'org', is_active: true }, error: null }); mocks.actor.mockResolvedValue({ userId: 'student', orgId: 'org' });
  mocks.catalog.mockResolvedValue({ total: 1, canTeach: false, courses: [{ id: 'course', title: 'IA aplicada' }], instructors: [{ user_id: 'teacher', name: 'Mariana' }], sessions: [{ id: 'session', title: 'Mi clase', description: '', starts_at: '2026-10-11T18:00:00Z', duration_minutes: 60, status: 'live', course_id: 'course', instructor_id: 'teacher', zoom_meeting_id: 'private-id', join_url: 'private-url' }] });
});
describe('agenda autenticada para Hub', () => {
  it('requiere un bearer verificado antes de consultar catálogo', async () => {
    expect((await POST(request(input, ''))).status).toBe(401); expect(mocks.getUser).not.toHaveBeenCalled();
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: {} });
    expect((await POST(request())).status).toBe(401); expect(mocks.catalog).not.toHaveBeenCalled();
  });
  it('rechaza identidad, rol, URL y páginas manipuladas', async () => {
    for (const extra of [{ user_id: 'another' }, { role: 'admin' }, { url: 'https://evil.test' }, { page: -1 }, { view: 'admin' }]) expect((await POST(request({ ...input, ...extra }))).status).toBe(400);
    expect(mocks.catalog).not.toHaveBeenCalled();
  });
  it('revalida membresía y evita consultar organizaciones inactivas', async () => {
    mocks.org.mockResolvedValueOnce({ data: { id: 'org', is_active: false }, error: null }); expect((await POST(request())).status).toBe(403);
    mocks.actor.mockRejectedValueOnce(new LiveError(403, 'Sin membresía')); expect((await POST(request())).status).toBe(403);
    expect(mocks.catalog).not.toHaveBeenCalled();
  });
  it('usa la página solicitada y devuelve metadatos sin acceso privado Zoom', async () => {
    const response = await POST(request()); const body = await response.json();
    expect(response.status).toBe(200); expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(mocks.getUser).toHaveBeenCalledWith('verified.token.signature'); expect(mocks.actor).toHaveBeenCalledWith('student', 'org');
    expect(mocks.catalog.mock.calls[0][1].toString()).toBe('period=upcoming&page=1&view=student');
    expect(body).toMatchObject({ version: 1, user_id: 'student', total: 1, sessions: [{ course_title: 'IA aplicada', instructor_name: 'Mariana', session_type: 'meeting' }] });
    expect(JSON.stringify(body)).not.toContain('private');
  });
  it('no suplanta el rol de instructor y admite catálogos vacíos', async () => {
    mocks.catalog.mockRejectedValueOnce(new LiveError(403, 'Necesitas el rol de instructor'));
    expect((await POST(request({ ...input, view: 'instructor' }))).status).toBe(403);
    mocks.catalog.mockResolvedValueOnce({ total: 0, canTeach: false, sessions: [], courses: [], instructors: [] });
    expect(await (await POST(request())).json()).toMatchObject({ total: 0, sessions: [] });
  });
});

describe('capacidades negociadas y períodos', () => {
  it('conserva exactamente el catálogo anterior sin negociación', async () => {
    const body = await (await POST(request())).json();
    expect(Object.keys(body).sort()).toEqual(['can_teach', 'sessions', 'total', 'user_id', 'version']);
  });
  it.each([
    [{ isAdmin: true, canTeach: true, platformAdmin: true }, 'platform_admin'],
    [{ isAdmin: true, canTeach: true }, 'organization_admin'],
    [{ isAdmin: false, canTeach: true }, 'instructor'],
    [{ isAdmin: false, canTeach: false }, 'student'],
  ])('deriva las capacidades del contexto verificado: %s', async (access, role) => {
    mocks.actor.mockResolvedValue({ userId: 'student', orgId: 'org', ...access });
    const body = await (await POST(request(input, 'verified.token.signature', true))).json();
    expect(body.capabilities).toEqual({ version: 1, role, can_manage: access.canTeach, can_view_history: access.canTeach });
  });
  it('el rol de plataforma por sí solo no suplanta permisos académicos', async () => {
    mocks.actor.mockResolvedValue({ userId: 'student', orgId: 'org', platformAdmin: true, isAdmin: false, canTeach: false });
    const body = await (await POST(request(input, 'verified.token.signature', true))).json();
    expect(body.capabilities).toMatchObject({ role: 'platform_admin', can_manage: false, can_view_history: false });
  });
  it('deniega historial a alumnos y clientes sin negociación antes de consultar datos', async () => {
    mocks.actor.mockResolvedValue({ userId: 'student', orgId: 'org', canTeach: false });
    expect((await POST(request({ ...input, period: 'past' }, 'verified.token.signature', true))).status).toBe(403);
    expect((await POST(request({ ...input, view: 'instructor', period: 'past' }, 'verified.token.signature', true))).status).toBe(403);
    mocks.actor.mockResolvedValue({ userId: 'teacher', orgId: 'org', canTeach: true });
    expect((await POST(request({ ...input, view: 'instructor', period: 'past' }))).status).toBe(403);
    expect(mocks.catalog).not.toHaveBeenCalled();
  });
  it('pagina el historial del ámbito autorizado sin enviar identidad ni rol', async () => {
    mocks.actor.mockResolvedValue({ userId: 'teacher', orgId: 'org', canTeach: true });
    const response = await POST(request({ ...input, view: 'instructor', period: 'past' }, 'verified.token.signature', true));
    expect(response.status).toBe(200);
    expect(mocks.catalog.mock.calls[0][1].toString()).toBe('period=past&page=1&view=instructor');
    expect(JSON.stringify(await response.json())).not.toContain('private');
  });
});
