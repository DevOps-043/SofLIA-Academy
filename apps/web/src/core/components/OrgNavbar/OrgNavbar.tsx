'use client'

import type { CSSProperties, ReactNode } from 'react'
import { Building2 } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useOrganizationStore, useCurrentOrganizationSlug } from '@/core/stores/organizationStore'
import { darkenHexColor, hexToRgbChannels } from '@/core/theme/color-engine'
import { resolveOrganizationBrandColors } from '@/core/theme/organization-brand-colors'
import { NotificationBell } from '../NotificationBell'
import { UserDropdown } from '../UserDropdown'
import styles from './OrgNavbar.module.css'

/**
 * Org-branded top navbar for business-user pages that live outside the dashboard shell.
 * Reads org and theme data directly from stores — no prop drilling required.
 * Mirrors the ModernNavbar visual design but is self-contained.
 *
 * Background computation mirrors buildDarkModeStyles in organization-branding-theme.ts:
 *   sidebar_background = darkenHexColor(primary, 0.60)
 * so the navbar color matches the dashboard's ModernNavbar exactly.
 */
export function OrgNavbar({ leadingAction }: { leadingAction?: ReactNode } = {}) {
  const router = useRouter()
  const org = useOrganizationStore((s) => s.currentOrganization)
  const orgSlug = useCurrentOrganizationSlug()

  // Gateado por brandingEnabled: con el branding apagado la navbar usa la
  // paleta de plataforma aunque la org conserve sus colores en la BD.
  const brand = resolveOrganizationBrandColors(org)
  const primary = brand.hasBranding ? brand.primaryColor : null
  const accent = brand.accentColor

  // Derive the same sidebar_background that OrganizationLayoutClient computes from
  // generateOrganizationBrandingTheme so the navbar color matches ModernNavbar on the dashboard.
  const darkNavBg = primary
    ? `rgba(${hexToRgbChannels(darkenHexColor(primary, 0.60))}, 0.95)`
    : undefined
  const logoSrc = org?.brandLogoUrl ?? org?.logoUrl ?? null
  const primaryDisplay = primary ?? 'var(--color-primary)'

  return (
    <nav className={styles.shell} aria-label="Barra de la organización">
      <div
        className={styles.bar}
        style={{
          '--org-nav-dark-bg': darkNavBg,
          '--org-nav-accent': accent,
          '--org-nav-primary': primaryDisplay,
        } as CSSProperties}
      >
      <div className={styles.inner}>
        {/* Brand — org logo + name */}
        <div className={styles.brand}>
          {leadingAction}
          <div className={styles.mark}>
            {logoSrc ? (
              <Image
                src={logoSrc}
                alt={org?.name ?? 'Organización'}
                width={180}
                height={48}
                className={styles.logo}
                onError={(e) => {
                  const image = e.target as HTMLImageElement
                  image.src = '/icono.png'
                }}
              />
            ) : (
              <div className={styles.fallbackMark}>
                <Building2 className="h-5 w-5" />
              </div>
            )}
            {/* Accent dot */}
            <span className={styles.presence} aria-hidden="true" />
          </div>

          {org?.showNavbarName !== false && org?.name && (
            <span className={styles.name}>
              {org.name}
            </span>
          )}
        </div>

        {/* Right actions */}
        <div className={styles.actions}>
          <NotificationBell />
          <UserDropdown
            onCertificatesClick={
              orgSlug ? () => router.push(`/${orgSlug}/certificates`) : undefined
            }
            onAnalyticsClick={
              orgSlug ? () => router.push(`/${orgSlug}/business-user/analytics`) : undefined
            }
            onProfileClick={
              orgSlug ? () => router.push(`/${orgSlug}/business-user/profile`) : undefined
            }
            onLogout={() => router.push('/auth?action=logout')}
          />
        </div>
      </div>
      </div>
    </nav>
  )
}
