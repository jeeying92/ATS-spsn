import { createServiceClient } from "@/lib/supabase/server";
import { Job, CompanySettings } from "@/lib/types";
import { CareersContent } from "./careers-content";

export const dynamic = "force-dynamic";

export default async function CareersPage() {
  const supabase = createServiceClient();
  const [{ data: jobs }, { data: settings }] = await Promise.all([
    supabase
      .from("jobs")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false }),
    supabase.from("company_settings").select("*").limit(1).single(),
  ]);

  return (
    <CareersContent
      jobs={(jobs as Job[]) || []}
      company={(settings as CompanySettings) || null}
    />
  );
}
