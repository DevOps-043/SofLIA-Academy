import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';
import { getOrganizationDashboardPath } from '@/core/utils/organizationNavigation';

interface DashboardPageProps {
  params: Promise<{ orgSlug: string }>;
}

/**
 * Organization Dashboard Page
 *
 * This page redirects users to the appropriate dashboard based on their role:
 * - owner/admin -> business-panel/reviews
 * - member -> business-user/dashboard (user dashboard)
 */
export default async function OrganizationDashboardPage({ params }: DashboardPageProps) {
  const { orgSlug } = await params;

  // Get current user
  const currentUser = await SessionService.getCurrentUser();

  if (!currentUser) {
    redirect(`/auth?redirect=/${orgSlug}/dashboard`);
  }

  const supabase = await createClient();

  // Get organization by slug
  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', orgSlug)
    .eq('is_active', true)
    .single();

  if (orgError || !organization) {
    redirect('/dashboard');
  }

  // Get user's role in this organization
  const { data: membership, error: membershipError } = await supabase
    .from('organization_users')
    .select('role')
    .eq('organization_id', organization.id)
    .eq('user_id', currentUser.id)
    .eq('status', 'active')
    .single();

  // Check if user is platform administrator
  const { data: userData } = await supabase
    .from('users')
    .select('platform_role')
    .eq('id', currentUser.id)
    .single();
  
  const isPlatformAdmin = userData?.platform_role?.toLowerCase().trim() === 'administrador';

  if ((membershipError || !membership) && !isPlatformAdmin) {
    // User is not a member of this organization and not a platform admin
    redirect('/dashboard?error=not_member');
  }

  // Redirect based on role
  // Platform admins default to business panel
  const role = isPlatformAdmin ? 'admin' : membership?.role;

  redirect(getOrganizationDashboardPath({ slug: orgSlug, role }));
}
