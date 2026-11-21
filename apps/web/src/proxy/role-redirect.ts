import { NextResponse, type NextRequest } from 'next/server'
import { getOrganizationDashboardPath } from '@/core/utils/organizationNavigation'

export interface BusinessOrganizationRedirectTarget {
  role?: string | null
  slug?: string | null
}

export function redirectByNormalizedRole(
  request: NextRequest,
  normalizedRole: string | null | undefined,
  organization?: BusinessOrganizationRedirectTarget | null,
) {
  if (normalizedRole === 'administrador') return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  if (normalizedRole === 'instructor') return NextResponse.redirect(new URL('/instructor/dashboard', request.url))
  if (normalizedRole === 'business' || normalizedRole === 'business user') {
    if (!organization?.slug) {
      return NextResponse.redirect(new URL('/auth/select-organization', request.url))
    }

    return NextResponse.redirect(
      new URL(getOrganizationDashboardPath({ slug: organization.slug, role: organization.role }), request.url),
    )
  }
  return NextResponse.redirect(new URL('/dashboard', request.url))
}

export function normalizeRole(role: string | null | undefined) {
  return role?.toLowerCase().trim()
}
