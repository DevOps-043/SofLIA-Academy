import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import type { ReactNode } from 'react'
import './globals.css'
import './styles/globals/index.css'
import { AgentTrapLink } from './AgentTrapLink'
import { RootHead } from './RootHead'
import { RootProviders } from './RootProviders'
import {
  ibmPlexSans,
  interTight,
  newsreader,
} from './root-fonts'

const deploymentUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.URL ??
  process.env.DEPLOY_PRIME_URL ??
  'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(deploymentUrl),
  title: 'SofLIA Academy',
  description: 'SofLIA Academy: Plataforma educativa de inteligencia artificial con asistente virtual LIA. Capacitacion, comunidad y adopcion de IA en el entorno laboral.',
  keywords: ['educacion', 'inteligencia artificial', 'chatbot', 'capacitacion', 'IA', 'LIA'],
  authors: [{ name: 'Equipo SofLIA Academy' }],
  robots: 'index, follow',
  icons: {
    icon: '/icono.ico',
    apple: '/icono.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SofLIA Academy',
  },
  openGraph: {
    siteName: 'SofLIA Academy',
    title: 'SofLIA Academy',
    description: 'SofLIA Academy: Plataforma educativa de inteligencia artificial con asistente virtual LIA',
    type: 'website',
    locale: 'es_ES',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

// A request-scoped CSP nonce cannot be attached to statically generated HTML.
// Reading request headers makes the shell dynamic so Next can propagate the
// nonce supplied by middleware to its bootstrap and hydration scripts.
export const dynamic = 'force-dynamic'

export default async function RootLayout({ children }: { children: ReactNode }) {
  const requestHeaders = await headers()
  const nonce = requestHeaders.get('x-nonce') ?? undefined

  return (
    <html
      lang="es"
      className={`${newsreader.variable} ${interTight.variable} ${ibmPlexSans.variable}`}
      suppressHydrationWarning
    >
      <head>
        <RootHead nonce={nonce} />
      </head>
      <body
        className={`${interTight.className} antialiased bg-[var(--color-bg-dark)] text-[var(--color-contrast)] transition-colors duration-300`}
        suppressHydrationWarning
      >
        <AgentTrapLink />
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  )
}
