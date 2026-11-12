import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { HumanVerificationChallenge } from '@/components/security/HumanVerificationChallenge'
import {
  sanitizeReturnTo,
  VERIFICATION_CHALLENGE_COOKIE_NAME,
} from '@/lib/security/security-state'
import { verifyToken } from '@/lib/security/signed-token'
import type { VerificationChallengeCookie } from '@/lib/security/security-state'

export const metadata: Metadata = {
  title: 'Verificación de Seguridad | SofLIA Academy',
  description: 'Verificación de seguridad para continuar navegando en SofLIA.',
  robots: {
    index: false,
    follow: false,
  },
}

export const dynamic = 'force-dynamic'

interface VerificationSearchParams {
  returnTo?: string | string[]
}

interface VerificationPageProps {
  searchParams?: Promise<VerificationSearchParams>
}

export default async function VerificationPage(props: VerificationPageProps) {
  const [cookieStore, searchParams] = await Promise.all([
    cookies(),
    props.searchParams ?? Promise.resolve<VerificationSearchParams>({}),
  ])
  const challenge = verifyToken<VerificationChallengeCookie>(
    cookieStore.get(VERIFICATION_CHALLENGE_COOKIE_NAME)?.value,
  )
  const returnTo = sanitizeReturnTo(
    Array.isArray(searchParams.returnTo)
      ? searchParams.returnTo[0]
      : searchParams.returnTo,
  )

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.18),_transparent_38%),_linear-gradient(180deg,_var(--color-legacy-050b14)_0%,_var(--color-legacy-09111f)_42%,_var(--color-bg-dark)_100%)] text-white">
      {challenge ? (
        <HumanVerificationChallenge
          minHoldMs={challenge.minHoldMs}
          defaultReturnTo={challenge.returnTo || returnTo}
        />
      ) : (
        <div className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center px-6 py-20 text-center">
          <div className="w-full rounded-[28px] border border-white/10 bg-slate-900/90 p-8 shadow-[0_28px_90px_rgba(0,0,0,0.45)] backdrop-blur">
            <h1 className="text-3xl font-bold text-white md:text-4xl">
              El reto expiró
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-300 md:text-lg">
              Necesitamos generar un nuevo reto de seguridad para continuar.
            </p>
            <Link
              href={returnTo}
              className="mt-8 inline-flex rounded-2xl border border-success/30 bg-teal-700/20 px-6 py-4 text-base font-semibold text-success transition hover:border-success/50 hover:bg-teal-700/30"
            >
              Reintentar navegación
            </Link>
          </div>
        </div>
      )}
    </main>
  )
}
