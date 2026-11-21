import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'
import { redirectByNormalizedRole } from '../role-redirect'

describe('redirectByNormalizedRole', () => {
  it('redirects organization admins to the org-scoped business panel dashboard', () => {
    const response = redirectByNormalizedRole(
      buildRequest(),
      'business',
      { role: 'admin', slug: 'acme' },
    )

    expect(response.headers.get('location')).toBe(
      'https://soflia.test/acme/business-panel/reviews',
    )
  })

  it('redirects organization members to the org-scoped business user dashboard', () => {
    const response = redirectByNormalizedRole(
      buildRequest(),
      'business user',
      { role: 'member', slug: 'acme' },
    )

    expect(response.headers.get('location')).toBe(
      'https://soflia.test/acme/business-user/dashboard',
    )
  })

  it('uses organization selection when a business role has no organization slug', () => {
    const response = redirectByNormalizedRole(buildRequest(), 'business')

    expect(response.headers.get('location')).toBe(
      'https://soflia.test/auth/select-organization',
    )
  })
})

function buildRequest() {
  return new NextRequest('https://soflia.test/auth')
}
