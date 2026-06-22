import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { evaluateWorkflows } from "@/lib/workflow-engine";
import { Workflow } from "@/lib/types";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Get all enabled no_reply_days workflows
  const { data: workflows } = await supabase
    .from("workflows")
    .select("*")
    .eq("trigger_type", "no_reply_days")
    .eq("enabled", true);

  if (!workflows || workflows.length === 0) {
    return NextResponse.json({ message: "No time-based workflows", count: 0 });
  }

  let triggered = 0;

  for (const wf of workflows as Workflow[]) {
    const days = (wf.trigger_config.days as number) || 7;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Find applications that haven't changed stage in X days and aren't hired/rejected
    const { data: staleApps } = await supabase
      .from("applications")
      .select("*, candidate:candidates(*), job:jobs(*)")
      .lt("stage_changed_at", cutoff)
      .not("stage", "in", '("hired","rejected")');

    if (!staleApps) continue;

    for (const app of staleApps) {
      await evaluateWorkflows("no_reply_days", {
        application_id: app.id,
        candidate_id: app.candidate.id,
        candidate_name: app.candidate.name,
        candidate_email: app.candidate.email,
        job_id: app.job_id,
        job_title: app.job.title,
        stage: app.stage,
      });
      triggered++;
    }
  }

  return NextResponse.json({
    message: `Evaluated ${triggered} application(s) for time-based workflows`,
    count: triggered,
  });
}
