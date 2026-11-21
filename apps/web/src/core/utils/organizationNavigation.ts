type OrganizationRouteRole = 'owner' | 'admin' | 'member' | string | null | undefined;

interface OrganizationRouteTarget {
  slug: string;
  role?: OrganizationRouteRole;
}

export function isOrganizationAdminRole(role: OrganizationRouteRole): boolean {
  return role === 'owner' || role === 'admin';
}

export function getOrganizationDashboardPath(organization: OrganizationRouteTarget): string {
  return isOrganizationAdminRole(organization.role)
    ? `/${organization.slug}/business-panel/reviews`
    : getOrganizationUserDashboardPath(organization.slug);
}

export function getOrganizationUserDashboardPath(organizationSlug: string): string {
  return `/${organizationSlug}/business-user/dashboard`;
}
