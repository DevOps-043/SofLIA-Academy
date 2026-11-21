import { ClipboardCheck } from 'lucide-react'
import type { SidebarNavigationItem, SidebarTranslator } from './types'

export function buildBusinessPanelNavigation(
  t: SidebarTranslator,
  orgSlug: string
): SidebarNavigationItem[] {
  const basePath = `/${orgSlug}/business-panel`

  return [
    { id: 'tour-nav-reviews', name: t('sidebar.reviews', 'Revisiones'), href: `${basePath}/reviews`, icon: ClipboardCheck },
  ]
}
