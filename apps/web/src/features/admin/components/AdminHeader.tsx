'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Menu } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useThemeStore } from '@/core/stores/themeStore'
import { useAdminUser } from '../hooks/useAdminUser'
import { useBusinessPanelTheme } from '../../business-panel/hooks/useBusinessPanelTheme'
import { useOrganizationStylesContext } from '../../business-panel/contexts/OrganizationStylesContext'
import { hexToRgb } from '../../business-panel/utils/styles'
import { NotificationBell } from '@/core/components/NotificationBell'
import { UserDropdown } from '@/core/components/UserDropdown'

interface AdminHeaderProps {
  onMenuClick: () => void
  title: string
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export function AdminHeader({ onMenuClick, title }: AdminHeaderProps) {
  const { t } = useTranslation('admin')
  const { user, isLoading } = useAdminUser()
  const { resolvedTheme } = useThemeStore()
  const panelTheme = useBusinessPanelTheme()
  const { styles, effectiveStyles } = useOrganizationStylesContext()

  const navbarStyle = useMemo(() => {
    const panelStyles = effectiveStyles?.panel || styles?.panel
    const sidebarBg = panelStyles?.sidebar_background || panelTheme.panelBg
    const sidebarOpacity =
      panelStyles?.sidebar_opacity !== undefined ? panelStyles.sidebar_opacity : 0.85
    const borderColor = panelStyles?.border_color || panelTheme.borderColor
    const textColor = panelStyles?.text_color || panelTheme.textColor

    let backgroundColor = sidebarBg
    if (sidebarBg && typeof sidebarBg === 'string' && sidebarBg.startsWith('#')) {
      backgroundColor = `rgba(${hexToRgb(sidebarBg)}, ${sidebarOpacity})`
    } else if (
      sidebarBg &&
      typeof sidebarBg === 'string' &&
      sidebarBg.startsWith('rgba')
    ) {
      const rgbaMatch = sidebarBg.match(/rgba?\(([^)]+)\)/)
      if (rgbaMatch) {
        const parts = rgbaMatch[1].split(',')
        if (parts.length >= 3) {
          backgroundColor = `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${sidebarOpacity})`
        }
      }
    }

    return {
      backgroundColor,
      borderColor,
      color: textColor,
      hoverBg:
        resolvedTheme === 'light'
          ? 'rgba(0, 0, 0, 0.04)'
          : 'rgba(255, 255, 255, 0.05)',
    }
  }, [effectiveStyles, panelTheme, resolvedTheme, styles])

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-[999] w-full border-b backdrop-blur-xl"
      style={{
        backgroundColor: navbarStyle.backgroundColor,
        borderColor: navbarStyle.borderColor,
      }}
    >
      <div className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-12">
        <div className="flex h-16 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={onMenuClick}
              className="rounded-lg p-2 transition-colors hover:opacity-80 lg:hidden"
              style={{ color: navbarStyle.color }}
              aria-label={t('sidebar.expandMenu')}
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex min-w-0 items-center gap-2.5">
              <Image
                src="/Logo.png"
                alt="SofLIA Academy"
                width={180}
                height={48}
                priority
                className="h-10 w-auto max-w-[140px] rounded-lg object-contain sm:h-12 sm:max-w-[180px]"
              />
              <h1
                className="hidden min-w-0 truncate text-sm font-semibold sm:block sm:max-w-[300px] sm:text-base lg:max-w-[360px]"
                style={{ color: navbarStyle.color }}
              >
                {title}
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <NotificationBell />

            {isLoading ? (
              <div className="h-9 w-9 animate-pulse rounded-full" style={{ backgroundColor: panelTheme.hoverBg }} />
            ) : user ? (
              <UserDropdown user={user} />
            ) : null}
          </div>
        </div>
      </div>
    </motion.header>
  )
}
