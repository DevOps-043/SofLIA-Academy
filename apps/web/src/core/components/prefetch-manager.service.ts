const STATIC_TOP_LEVEL_ROUTES = new Set([
  'admin',
  'api',
  'auth',
  'business',
  'certificates',
  'communities',
  'courses',
  'dashboard',
  'downloads',
  'instructor',
  'profile',
])

const DEFAULT_PUBLIC_PREFETCH_ROUTES = ['/dashboard', '/profile']
const MAX_CONSERVATIVE_PREFETCH_ROUTES = 3

export interface PrefetchRouteOptions {
  conserveResources?: boolean
}

function uniqueRoutes(routes: string[], currentPathname: string): string[] {
  const normalizedCurrent = currentPathname.replace(/\/$/, '') || '/'
  return Array.from(new Set(routes))
    .filter((route) => route !== normalizedCurrent)
    .filter((route) => route.length > 1)
}

export function getOrgSlugFromPathname(pathname: string): string | null {
  const [firstSegment] = pathname.split('/').filter(Boolean)

  if (!firstSegment || STATIC_TOP_LEVEL_ROUTES.has(firstSegment)) {
    return null
  }

  return firstSegment
}

export function resolvePrefetchRoutes(
  pathname: string,
  options: PrefetchRouteOptions = {},
): string[] {
  const orgSlug = getOrgSlugFromPathname(pathname)
  let routes: string[] = []

  if (orgSlug) {
    const orgBaseRoutes = [
      `/${orgSlug}/business-user/dashboard`,
      `/${orgSlug}/business-panel/reviews`,
      `/${orgSlug}/profile`,
      '/certificates',
    ]

    if (pathname.includes(`/${orgSlug}/business-user`)) {
      routes = [
        `/${orgSlug}/business-user/analytics`,
        `/${orgSlug}/business-panel/reviews`,
        `/${orgSlug}/profile`,
        '/certificates',
      ]
    } else if (pathname.includes(`/${orgSlug}/business-panel`)) {
      routes = [
        `/${orgSlug}/business-user/dashboard`,
        `/${orgSlug}/profile`,
      ]
    } else if (pathname.includes(`/${orgSlug}/profile`)) {
      routes = orgBaseRoutes
    } else {
      routes = orgBaseRoutes
    }
  } else if (pathname.startsWith('/admin')) {
    routes = ['/admin/dashboard', '/admin/companies', '/admin/users', '/admin/workshops']
  } else {
    const relatedRoutes: Record<string, string[]> = {
      // Only prefetch concrete routes that exist. Prefetching the removed
      // /news, /communities and /courses index pages produced repeated RSC 404s
      // in every browser session, even though the current page was healthy.
      '/': ['/business', '/auth'],
      '/dashboard': ['/profile', '/certificates'],
      '/profile': ['/dashboard', '/certificates'],
      '/auth': ['/dashboard'],
    }

    const exactRoutes = relatedRoutes[pathname]
    routes = exactRoutes ?? DEFAULT_PUBLIC_PREFETCH_ROUTES

    if (!exactRoutes) {
      for (const [pattern, patternRoutes] of Object.entries(relatedRoutes)) {
        if (pathname.startsWith(`${pattern}/`)) {
          routes = patternRoutes
          break
        }
      }
    }
  }

  const resolvedRoutes = uniqueRoutes(routes, pathname)
  return options.conserveResources
    ? resolvedRoutes.slice(0, MAX_CONSERVATIVE_PREFETCH_ROUTES)
    : resolvedRoutes
}
