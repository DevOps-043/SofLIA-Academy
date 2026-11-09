import { NextRequest, NextResponse } from 'next/server';
import { rateLimitMiddleware, RateLimitTier } from '@/lib/rate-limit/advanced-rate-limit';
import { handleLive, json } from '@/features/live/server';
import { verifiedHubUser, hubActorContext, readWorkspaceBody } from '@/features/live/hub-auth.server';
import { STUDIO_RECORDING_NOTICE_HEADER, STUDIO_RECORDING_NOTICE_VERSION, studioRequestSchema } from '@/features/live/live-studio.contract';
import { executeStudio } from '@/features/live/studio.service';

export async function POST(request: NextRequest) {
  return handleLive(async () => {
    const userId = await verifiedHubUser(request);
    const input = studioRequestSchema.parse(await readWorkspaceBody(request));
    const limited = rateLimitMiddleware(request, input.operation.type === 'snapshot' ? RateLimitTier.API_READ : RateLimitTier.API_MUTATION, userId);
    if (limited) return new NextResponse(limited.body, { status: limited.status, headers: { ...Object.fromEntries(new Headers(limited.headers)), 'Cache-Control': 'no-store' } });
    const context = await hubActorContext(userId, input.organization_slug);
    const recordingNoticeVersion: typeof STUDIO_RECORDING_NOTICE_VERSION | undefined = request.headers.get(STUDIO_RECORDING_NOTICE_HEADER) === String(STUDIO_RECORDING_NOTICE_VERSION)
      ? STUDIO_RECORDING_NOTICE_VERSION : undefined;
    const operation = input.operation.type === 'zoom'
      ? { ...input.operation, recording_notice_version: recordingNoticeVersion }
      : input.operation;
    const response = json(await executeStudio(context, input.session_id, operation));
    response.headers.set('Referrer-Policy', 'no-referrer');
    return response;
  });
}
