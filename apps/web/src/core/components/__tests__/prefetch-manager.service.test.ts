import { describe, expect, it } from 'vitest'
import {
  getOrgSlugFromPathname,
  resolvePrefetchRoutes,
} from '../prefetch-manager.service'

describe('prefetch-manager.service', () => {
  it('detects organization slugs without treating static routes as orgs', () => {
    expect(getOrgSlugFromPathname('/acme/business-user/dashboard')).toBe('acme')
    expect(getOrgSlugFromPathname('/admin/dashboard')).toBeNull()
    expect(getOrgSlugFromPathname('/courses/intro-ai')).toBeNull()
  })

  it('prefetches org-scoped routes for business user dashboards', () => {
    expect(resolvePrefetchRoutes('/acme/business-user/dashboard')).toEqual([
      '/acme/business-user/analytics',
      '/acme/business-panel/reviews',
      '/acme/profile',
      '/certificates',
    ])
  })

  it('prefetches the user dashboard and profile from course reviews', () => {
    expect(resolvePrefetchRoutes('/acme/business-panel/reviews')).toEqual([
      '/acme/business-user/dashboard',
      '/acme/profile',
    ])
  })

  it('limits prefetch on constrained devices', () => {
    expect(
      resolvePrefetchRoutes('/acme/business-user/dashboard', {
        conserveResources: true,
      }),
    ).toEqual([
      '/acme/business-user/analytics',
      '/acme/business-panel/reviews',
      '/acme/profile',
    ])
  })

  it('never prefetches removed public index routes', () => {
    expect(resolvePrefetchRoutes('/')).toEqual(['/business', '/auth'])
    expect(resolvePrefetchRoutes('/dashboard')).toEqual([
      '/profile',
      '/certificates',
    ])

    for (const pathname of ['/', '/dashboard', '/profile', '/auth']) {
      expect(resolvePrefetchRoutes(pathname)).not.toEqual(
        expect.arrayContaining(['/news', '/communities', '/courses']),
      )
    }
  })
})
