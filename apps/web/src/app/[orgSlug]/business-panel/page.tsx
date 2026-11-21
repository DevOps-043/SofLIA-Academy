import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ orgSlug: string }>
}

export default async function BusinessPanelRootPage({ params }: Props) {
  const { orgSlug } = await params
  redirect(`/${orgSlug}/business-panel/reviews`)
}
