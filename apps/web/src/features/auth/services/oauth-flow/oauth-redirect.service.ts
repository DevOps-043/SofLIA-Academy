import type { SupabaseServerClient } from './oauth-flow.types';
import { getOrganizationDashboardPath } from '@/core/utils/organizationNavigation';

interface UserRoleRow {
  platform_role?: string | null;
}

interface OrganizationMembershipRow {
  organizations?: unknown;
  role?: string | null;
}

interface OrganizationRelation {
  slug?: string | null;
}

export function normalizeCargoRole(role?: string | null): string {
  return role?.toLowerCase().trim() || '';
}

export function isBusinessCargoRole(role?: string | null): boolean {
  const normalizedRole = normalizeCargoRole(role);

  return normalizedRole === 'business' || normalizedRole === 'business user';
}

export function buildBusinessDashboardDestination(
  organizationSlug: string,
  organizationRole?: string | null
): string {
  return getOrganizationDashboardPath({ slug: organizationSlug, role: organizationRole });
}

function extractOrganizationSlug(organization: unknown): string | undefined {
  if (!organization || typeof organization !== 'object') {
    return undefined;
  }

  const relation = organization as OrganizationRelation;

  return typeof relation.slug === 'string' ? relation.slug : undefined;
}

export async function resolveOAuthDashboardDestination(
  supabase: SupabaseServerClient,
  userId: string
): Promise<string> {
  const { data: user } = await supabase
    .from('users')
    .select('platform_role')
    .eq('id', userId)
    .single();

  const userRole = user as UserRoleRow | null;

  const normalizedRole = normalizeCargoRole(userRole?.platform_role);

  if (normalizedRole === 'administrador') {
    return '/admin/dashboard';
  }

  if (normalizedRole === 'instructor') {
    return '/instructor/dashboard';
  }

  const { data: memberships } = await supabase
    .from('organization_users')
    .select('role, organizations!inner(slug, is_active)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .eq('organizations.is_active', true)
    .order('joined_at', { ascending: true });

  const organizationMemberships = (memberships || []) as OrganizationMembershipRow[];

  if (organizationMemberships.length === 0) {
    return '/dashboard';
  }

  if (!isBusinessCargoRole(normalizedRole)) {
    await supabase
      .from('users')
      .update({ platform_role: 'Business' })
      .eq('id', userId);
  }

  if (organizationMemberships.length > 1) {
    return '/auth/select-organization';
  }

  const organizationMembership = organizationMemberships[0];
  const organizationSlug = extractOrganizationSlug(organizationMembership?.organizations);

  if (!organizationSlug) {
    return '/dashboard';
  }

  return buildBusinessDashboardDestination(
    organizationSlug,
    organizationMembership?.role
  );
}
