import type { Metadata } from 'next'

import { NotebookPageClient } from '@/features/notebook'

export const metadata: Metadata = {
  title: 'Libro de Apuntes | SofLIA Academy',
  description:
    'Organiza tus apuntes por curso y lección y edítalos con un editor enriquecido.',
}

export default async function NotebookPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  return <NotebookPageClient orgSlug={orgSlug} />
}
