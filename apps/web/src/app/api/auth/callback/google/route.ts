import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { handleGoogleCallback } from '@/features/auth/actions/oauth';
import { buildDesktopHandoffResponse } from '@/lib/auth/desktop-sso-handoff';
import { isCalendarOAuthState } from '@/features/instructor/calendar-oauth-state';
import { completeCalendarOAuth } from '@/features/instructor/calendar-callback.server';

function getRedirectDigest(error: unknown): string | null {
  if (!error || typeof error !== 'object' || !('digest' in error)) {
    return null;
  }

  const { digest } = error;
  return typeof digest === 'string' ? digest : null;
}

/**
 * GET /api/auth/callback/google
 *
 * Maneja el callback de Google OAuth después de la autorización
 */
export async function GET(request: NextRequest) {
  if (isCalendarOAuthState(request.nextUrl.searchParams.get('state'))) {
    return completeCalendarOAuth(request, 'google');
  }

  try {
    const searchParams = request.nextUrl.searchParams;

    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Llamar a la server action
    const result = await handleGoogleCallback({
      code: code || '',
      state: state || undefined,
      error: error || undefined,
      error_description: errorDescription || undefined,
    });

    // Project Hub vuelve por un callback HTTPS validado previamente.
    if (result && 'webHandoffUrl' in result && result.webHandoffUrl) {
      const response = NextResponse.redirect(result.webHandoffUrl);
      response.headers.set('Cache-Control', 'no-store');
      response.headers.set('Referrer-Policy', 'no-referrer');
      return response;
    }

    // Si hay error, redirigir a login con mensaje de error
    if (result && 'error' in result && result.error) {
      return NextResponse.redirect(
        new URL(`/auth?error=${encodeURIComponent(result.error)}`, request.url)
      );
    }

    // El flujo venia de Pulse Hub: se devuelve el resultado al escritorio.
    if (result && 'desktopHandoffUrl' in result && result.desktopHandoffUrl) {
      return buildDesktopHandoffResponse(result.desktopHandoffUrl);
    }

    // El éxito se maneja con redirect en handleGoogleCallback que ya redirige según platform_role
    // Si llegamos aquí, es porque no hubo redirección ni error (caso extremadamente raro)
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    // Verificar si es una redirección de Next.js (no es un error real)
    if (error && typeof error === 'object' && 'digest' in error) {
      const digest = getRedirectDigest(error);
      if (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')) {
        // Es una redirección exitosa, relanzar para que Next.js la maneje
        throw error;
      }
    }

    // Solo es un error real si llegamos aquí
    logger.error('Error en callback route:', error);

    return NextResponse.redirect(
      new URL('/auth?error=callback_error', request.url)
    );
  }
}
