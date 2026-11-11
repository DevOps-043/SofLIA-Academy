import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimitMiddleware, RateLimitTier } from '@/lib/rate-limit/advanced-rate-limit';
import { LiveError, handleLive, json } from '@/features/live/server';
import { verifiedHubUser, hubActorContext, readWorkspaceBody } from '@/features/live/hub-auth.server';
import { listLiveCatalog } from '@/features/live/services/catalog.service';

const requestSchema = z.object({
  organization_slug: z.string().max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  page: z.number().int().min(0).max(100000).default(0),
  view: z.enum(['student', 'instructor']).default('student'),
  period: z.enum(['upcoming', 'past']).optional(),
}).strict();

/** Metadatos públicos para la agenda; los enlaces Zoom se autorizan aparte. */
export async function POST(request: NextRequest) {
  return handleLive(async () => {
    const userId = await verifiedHubUser(request);
    const input = requestSchema.parse(await readWorkspaceBody(request));
    const limited = rateLimitMiddleware(request, RateLimitTier.API_READ, userId);
    if (limited) {
      const response = new NextResponse(limited.body, { status: limited.status, headers: limited.headers });
      response.headers.set('Cache-Control', 'no-store');
      return response;
    }
    const context = await hubActorContext(userId, input.organization_slug);
    const extended = request.headers.get('X-Soflia-Catalog-Capabilities') === '1';
    if (input.period === 'past' && (!extended || input.view !== 'instructor' || !context.canTeach))
      throw new LiveError(403, 'No tienes acceso al historial de gestión.');
    const catalog = await listLiveCatalog(context, new URLSearchParams({ period: input.period || 'upcoming', page: String(input.page), view: input.view }));
    return json({
      version: 1, user_id: userId, can_teach: catalog.canTeach, total: catalog.total,
      ...(extended ? { capabilities: {
        version: 1,
        role: context.platformAdmin ? 'platform_admin' : context.isAdmin ? 'organization_admin' : context.canTeach ? 'instructor' : 'student',
        can_manage: context.canTeach === true, can_view_history: context.canTeach === true,
      } } : {}),
      sessions: catalog.sessions.map((session) => ({
        id: session.id, title: session.title, description: session.description,
        starts_at: session.starts_at, duration_minutes: session.duration_minutes,
        status: session.status, session_type: session.session_type || 'meeting',
        course_title: catalog.courses.find((course) => course.id === session.course_id)?.title || 'Curso asignado',
        instructor_name: catalog.instructors.find((instructor) => instructor.user_id === session.instructor_id)?.name || 'Instructor del curso',
      })),
    });
  });
}
