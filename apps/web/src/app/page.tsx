import type { Metadata } from 'next'
import { HomePageClient } from './HomePageClient'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'SofLIA Academy | Evoluciona tu talento al ritmo de la tecnología',
  description:
    'Sistema de adopción organizacional de IA para cerrar la brecha de habilidades con upskilling, reskilling, práctica aplicada y medición.',
  keywords: [
    'adopción organizacional de IA',
    'upskilling',
    'reskilling',
    'evolución del talento',
    'brecha de habilidades',
  ],
  openGraph: {
    title: 'SofLIA Academy | Evoluciona tu talento',
    description:
      'Cierra la brecha de habilidades con un sistema medible de adopción, práctica y evolución continua.',
    type: 'website',
    locale: 'es_MX',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'SofLIA Academy — Evoluciona tu talento al ritmo de la tecnología',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SofLIA Academy | Evoluciona tu talento',
    description:
      'Sistema de adopción organizacional de IA para cerrar la brecha de habilidades.',
    images: ['/og.png'],
  },
}

export default function HomePage() {
  return <HomePageClient />
}
