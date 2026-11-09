// @vitest-environment node
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
    });
  });
});
