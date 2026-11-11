import type { Metadata } from 'next'

import { StatusPageClient } from './StatusPageClient'

export const metadata: Metadata = {
  title: 'Estado del sistema | SofLIA Academy',
  description: 'Estado operativo de los servicios de SofLIA Academy.',
}

export default function StatusPage() {
  return <StatusPageClient />
}
