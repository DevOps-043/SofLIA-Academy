import { redirect } from "next/navigation";
export default async function Page({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  redirect(`/${(await params).orgSlug}/instructor/dashboard`);
}
