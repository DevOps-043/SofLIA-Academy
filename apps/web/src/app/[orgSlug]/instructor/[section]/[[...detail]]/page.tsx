import { notFound } from "next/navigation";
import { z } from "zod";
import { InstructorCourseDetails } from "@/features/instructor/InstructorCourseDetails";
import { InstructorLearningPaths } from "@/features/instructor/InstructorLearningPaths";
import { InstructorWorkspace } from "@/features/live/InstructorWorkspace";
import { LiveSessionDetails } from "@/features/live/LiveSessionDetails";

export default async function Page({ params }: {
  params: Promise<{ orgSlug: string; section: string; detail?: string[] }>;
}) {
  const { orgSlug, section, detail } = await params;
  if (detail?.length) {
    if (detail.length !== 1 || !z.string().uuid().safeParse(detail[0]).success) notFound();
    if (section === "in-live") return <LiveSessionDetails orgSlug={orgSlug} sessionId={detail[0]} instructor />;
    if (section !== "courses" && section !== "statistics" && section !== "reviews" && section !== "messages") notFound();
    return <InstructorCourseDetails key={section + detail[0]} orgSlug={orgSlug} view={section} courseId={detail[0]} />;
  }
  if (section === "learning-paths") return <InstructorLearningPaths orgSlug={orgSlug} />;
  if (section === "dashboard" || section === "courses" || section === "statistics" || section === "in-live"
    || section === "reviews" || section === "messages") {
    return <InstructorWorkspace key={section} orgSlug={orgSlug} view={section} />;
  }
  notFound();
}
