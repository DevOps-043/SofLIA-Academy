'use client'

import type { CSSProperties } from 'react'
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

import { LiaFloatingButton } from '@/core/components/LiaSidePanel/LiaFloatingButton'
import { LiaSidePanel } from '@/core/components/LiaSidePanel'
import { LiaPanelContext } from '@/core/contexts/LiaPanelContext'
import { useResponsiveLiaLayout } from '@/core/hooks/useResponsiveLiaLayout'
import { useAuth } from '../../auth/hooks/useAuth'
import {
  useOrganizationStylesContext,
} from '../contexts/OrganizationStylesContext'
import { generateCSSVariables, getBackgroundStyle } from '../utils/styles'
import { BusinessPanelHeader } from './BusinessPanelHeader'
import { BusinessPanelSidebar } from './BusinessPanelSidebar'
import { AuthUnavailableScreen } from './AuthUnavailableScreen'
import { PremiumLoadingScreen } from './PremiumLoadingScreen'

interface BusinessPanelLayoutProps {
  children: React.ReactNode
}

function BusinessPanelLayoutInner({ children }: BusinessPanelLayoutProps) {
  const {
    authUnavailable,
    user,
    isLoading: authLoading,
    refreshUser,
  } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { styles, effectiveStyles, loading: stylesLoading } =
    useOrganizationStylesContext()

  const [orgSlug, panelSegment, section] = (pathname ?? '').split('/').filter(Boolean)
  const reviewsPath = panelSegment === 'business-panel' && section !== 'reviews'
    ? `/${orgSlug}/business-panel/reviews`
    : null

  useEffect(() => {
    if (reviewsPath) router.replace(reviewsPath)
  }, [reviewsPath, router])

  const [isMounted, setIsMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('business-sidebar-collapsed') === 'true'
    }
    return false
  })
  const [sidebarPinned, setSidebarPinned] = useState(() => {
    if (typeof window !== 'undefined') {
      const pinned = localStorage.getItem('business-sidebar-pinned')
      return pinned === 'true'
    }
    return false
  })

  const isLoading = typeof authLoading === 'boolean' ? authLoading : true

  const liaPanel = useContext(LiaPanelContext) ?? null
  const isLiaPanelOpen = liaPanel?.isOpen ?? false
  const { contentOffsetPx } = useResponsiveLiaLayout({
    reservedWidthPx: sidebarCollapsed ? 64 : 256,
  })

  const prevLiaPanelOpen = useRef(isLiaPanelOpen)
  const prevSidebarOpen = useRef(sidebarOpen)

  const panelStyles = useMemo(
    () => effectiveStyles?.panel || styles?.panel,
    [effectiveStyles, styles],
  )
  const backgroundStyle = useMemo(() => getBackgroundStyle(panelStyles), [panelStyles])
  const cssVariables = useMemo(() => generateCSSVariables(panelStyles), [panelStyles])

  // ── Supabase Storage CDN optimization ─────────────────────────────────────
  // Establish the TCP + TLS connection to the Supabase CDN origin as early as
  // possible so that when the <video src> is set, the browser already has an
  // open channel and skips the ~300-500 ms handshake cost.
  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) return

    const origin = new URL(supabaseUrl).origin
    const link = document.createElement('link')
    link.rel = 'preconnect'
    link.href = origin
    link.crossOrigin = 'anonymous'
    document.head.appendChild(link)

    return () => {
      if (document.head.contains(link)) document.head.removeChild(link)
    }
  }, [])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!authUnavailable && isLoading === false && user === null) {
      let redirectPath = '/auth'

      if (typeof window !== 'undefined') {
        try {
          const lastOrgSlug = localStorage.getItem('last_organization_slug')

          if (lastOrgSlug) {
            redirectPath = `/auth/${lastOrgSlug}`
          }
        } catch {}
      }

      router.push(redirectPath)
      return
    }

    if (!authUnavailable && isLoading === false && user) {
      const normalizedRole = user.platform_role?.toLowerCase().trim()

      if (normalizedRole !== 'business' && normalizedRole !== 'administrador') {
        router.push('/dashboard')
      }
    }
  }, [authUnavailable, isLoading, router, user])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('business-sidebar-collapsed', sidebarCollapsed.toString())
    }
  }, [sidebarCollapsed])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('business-sidebar-pinned', sidebarPinned.toString())
    }
  }, [sidebarPinned])

  useEffect(() => {
    if (liaPanel && !prevLiaPanelOpen.current && isLiaPanelOpen && sidebarOpen) {
      setSidebarOpen(false)
    }

    prevLiaPanelOpen.current = isLiaPanelOpen
  }, [isLiaPanelOpen, liaPanel, sidebarOpen])

  useEffect(() => {
    if (liaPanel && !prevSidebarOpen.current && sidebarOpen && isLiaPanelOpen) {
      liaPanel.closePanel()
    }

    prevSidebarOpen.current = sidebarOpen
  }, [isLiaPanelOpen, liaPanel, sidebarOpen])

  const handleMenuClick = useCallback(() => {
    setSidebarOpen(true)
  }, [])

  const handleSidebarClose = useCallback(() => {
    setSidebarOpen(false)
  }, [])

  const handleToggleCollapse = useCallback(() => {
    setSidebarCollapsed((previous) => !previous)
  }, [])

  const handleTogglePin = useCallback(() => {
    setSidebarPinned((previous) => !previous)
  }, [])

  const handleSectionChange = useCallback((section: string) => {
    setActiveSection(section)
  }, [])

  const handleSidebarHoverExpand = useCallback(() => {
    if (liaPanel && isLiaPanelOpen) {
      liaPanel.closePanel()
    }
  }, [isLiaPanelOpen, liaPanel])

  if (authUnavailable) {
    return <AuthUnavailableScreen onRetry={() => void refreshUser()} />
  }

  if (isLoading || stylesLoading || reviewsPath) {
    return <PremiumLoadingScreen />
  }

  const normalizedRole = user?.platform_role?.toLowerCase().trim()

  if (!user || (normalizedRole !== 'business' && normalizedRole !== 'administrador')) {
    return null
  }

  return (
    <>
        <div
          key={styles?.selectedTheme || 'default-theme'}
          className="business-panel-layout fixed inset-0 z-0 flex h-app-dynamic max-w-full flex-col overflow-hidden transition-all duration-300"
          style={{
            ...backgroundStyle,
            ...cssVariables,
          } as CSSProperties}
        >
          <BusinessPanelHeader
            onMenuClick={handleMenuClick}
            title="Panel de Gestión Business"
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={handleToggleCollapse}
          />

          <LiaSidePanel />
          <LiaFloatingButton />

          <div className="flex min-w-0 flex-1 overflow-hidden">
            <BusinessPanelSidebar
              isOpen={sidebarOpen}
              onClose={handleSidebarClose}
              activeSection={activeSection}
              onSectionChange={handleSectionChange}
              isCollapsed={sidebarCollapsed}
              onToggleCollapse={handleToggleCollapse}
              isPinned={sidebarPinned}
              onTogglePin={handleTogglePin}
              onHoverExpand={handleSidebarHoverExpand}
            />

            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
              <main
                id="main-scroll-container"
                className="business-panel-content flex-1 overflow-x-clip overflow-y-auto px-3 pb-3 pt-[5.75rem] transition-all duration-300 sm:px-5 sm:pb-5 lg:px-7 lg:pb-7 xl:px-8 xl:pb-8"
                style={{
                  paddingRight: contentOffsetPx > 0 ? `${contentOffsetPx}px` : undefined,
                }}
              >
                <div className="mx-auto w-full min-w-0 max-w-[1920px]">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </div>
    </>
  )
}

export function BusinessPanelLayout({ children }: BusinessPanelLayoutProps) {
  return <BusinessPanelLayoutInner>{children}</BusinessPanelLayoutInner>
}
