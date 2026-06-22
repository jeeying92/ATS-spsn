import { createServiceClient } from "@/lib/supabase/server";
import { Job } from "@/lib/types";
import { notFound } from "next/navigation";
import { JobDetailContent } from "./job-detail-content";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createServiceClient();
  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!job) notFound();

  return <JobDetailContent job={job as Job} />;
}
