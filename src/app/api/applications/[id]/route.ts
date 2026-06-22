import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail, rejectionEmail, offerEmail } from "@/lib/email";
import { ApplicationStage } from "@/lib/types";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServiceClient();
  const body = await req.json();
  const { stage, reject_reason } = body as {
    stage: ApplicationStage;
    reject_reason?: string;
  };

  // Get current application with candidate and job
  const { data: app } = await supabase
    .from("applications")
    .select("*, candidate:candidates(*), job:jobs(*)")
    .eq("id", id)
    .single();

  if (!app) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {
    stage,
    stage_changed_at: new Date().toISOString(),
  };

  if (stage === "rejected" && reject_reason) {
    updates.reject_reason = reject_reason;
  }

  const { error } = await supabase
    .from("applications")
    .update(updates)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Send email on rejection
  if (stage === "rejected") {
    try {
      const emailContent = rejectionEmail(
        app.candidate.name,
        app.job.title,
        reject_reason
      );
      await sendEmail({ to: app.candidate.email, ...emailContent });
    } catch {
      // Don't block on email failure
    }
  }

  return NextResponse.json({ success: true });
}
