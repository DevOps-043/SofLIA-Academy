import Link from "next/link";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SessionService } from "@/features/auth/services/session.service";
import { LiveTheme } from "@/features/live/LiveTheme";
import type { LiveDatabase } from "@/features/live/database.types";
import styles from "@/features/live/Live.module.css";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function InstructorEntryPage() {
  const user = await SessionService.getCurrentUser();
  if (!user) redirect("/auth");

  const db = createAdminClient() as unknown as SupabaseClient<LiveDatabase>;
  const [memberships, instructorRoles] = await Promise.all([
    db.from("organization_users").select("organization_id,role,organizations!inner(name,slug)")
      .eq("user_id", user.id).eq("status", "active").eq("organizations.is_active", true),
    db.from("organization_instructors").select("organization_id").eq("user_id", user.id),
  ]);
  if (memberships.error || instructorRoles.error) throw new Error("No se pudieron consultar las organizaciones del instructor");

  const organizationsWithTeachingRole = new Set(instructorRoles.data.map((row) => row.organization_id));
  const organizations = memberships.data
    .filter((row) => row.role === "owner" || row.role === "admin" || organizationsWithTeachingRole.has(row.organization_id))
    .map((row) => row.organizations);

  if (organizations.length === 1) redirect(`/${organizations[0].slug}/instructor/dashboard`);

  return (
    <LiveTheme>
      <main className={styles.shell}>
        <h1 className={styles.title}>Panel del instructor</h1>
        <div className={styles.panel}>
          {organizations.length ? (
            <nav className={styles.actions} aria-label="Organizaciones del instructor">
              {organizations.map((org) => (
                <Link className={styles.secondary} key={org.slug} href={`/${org.slug}/instructor/dashboard`}>
                  {org.name}
                </Link>
              ))}
            </nav>
          ) : <p>Todavía no tienes acceso de instructor en una organización activa.</p>}
        </div>
      </main>
    </LiveTheme>
  );
}
