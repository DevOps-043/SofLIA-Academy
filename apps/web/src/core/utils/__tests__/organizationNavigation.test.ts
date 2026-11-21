import { describe, expect, it } from 'vitest';

import {
  getOrganizationDashboardPath,
  getOrganizationUserDashboardPath,
  isOrganizationAdminRole,
} from '../organizationNavigation';

describe('organizationNavigation', () => {
  it('routes owners and admins to the business panel dashboard', () => {
    expect(getOrganizationDashboardPath({ slug: 'acme', role: 'owner' })).toBe(
      '/acme/business-panel/reviews',
    );
    expect(getOrganizationDashboardPath({ slug: 'acme', role: 'admin' })).toBe(
      '/acme/business-panel/reviews',
    );
  });

  it('routes members to the business user dashboard', () => {
    expect(getOrganizationDashboardPath({ slug: 'acme', role: 'member' })).toBe(
      '/acme/business-user/dashboard',
    );
  });

  it('builds direct business user dashboard paths', () => {
    expect(getOrganizationUserDashboardPath('board-ready')).toBe(
      '/board-ready/business-user/dashboard',
    );
  });

  it('identifies organization admin roles', () => {
    expect(isOrganizationAdminRole('owner')).toBe(true);
    expect(isOrganizationAdminRole('admin')).toBe(true);
    expect(isOrganizationAdminRole('member')).toBe(false);
  });
});
