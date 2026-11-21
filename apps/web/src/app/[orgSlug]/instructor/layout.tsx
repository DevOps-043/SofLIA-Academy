import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { InstructorPanelLayout } from "@/features/live/InstructorPanelLayout";
import { LiveError, liveNavigationContext } from "@/features/live/server";

export default async function Layout({ children, params }: {
  children: ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const context = await liveNavigationContext(orgSlug).catch((error: unknown) => {
    if (error instanceof LiveError && (error.status === 401 || error.status === 403)) return null;
    throw error;
  });
  if (!context?.canTeach) redirect(`/${orgSlug}/business-user/dashboard`);
  return <InstructorPanelLayout orgSlug={orgSlug}>{children}</InstructorPanelLayout>;
}
