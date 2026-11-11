import type { Metadata } from 'next'

import { NoteEditorPageClient } from '@/features/notebook'

export const metadata: Metadata = {
  title: 'Editar apunte | SofLIA Academy',
  description: 'Edita tu apunte con un editor de texto enriquecido.',
}

export default async function NotebookNotePage({
  params,
}: {
  params: Promise<{ orgSlug: string; noteId: string }>
}) {
  const { orgSlug, noteId } = await params
  return <NoteEditorPageClient orgSlug={orgSlug} noteId={noteId} />
}
