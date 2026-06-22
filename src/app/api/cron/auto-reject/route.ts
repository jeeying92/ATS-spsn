import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail, noReplyAutoRejectEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  // Verify cron secret for production
  const authHeader = req.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Find applications stuck in 'offer' stage for 7+ days with no reply
  const { data: staleApps } = await supabase
    .from("applications")
    .select("*, candidate:candidates(*), job:jobs(*)")
    .eq("stage", "offer")
    .lt("stage_changed_at", sevenDaysAgo);

  if (!staleApps || staleApps.length === 0) {
    return NextResponse.json({ message: "No stale applications found", count: 0 });
  }

  let rejectedCount = 0;

  for (const app of staleApps) {
    // Check if offer is still pending
    const { data: offers } = await supabase
      .from("offers")
      .select("status")
      .eq("application_id", app.id)
      .eq("status", "pending");

    if (!offers || offers.length === 0) continue;

    // Auto-reject
    await supabase
      .from("applications")
      .update({
        stage: "rejected",
        reject_reason: "Auto-rejected: No response within 7 days of offer",
        stage_changed_at: new Date().toISOString(),
      })
      .eq("id", app.id);

    // Expire the offer
    await supabase
      .from("offers")
      .update({ status: "expired" })
      .eq("application_id", app.id)
      .eq("status", "pending");

    // Send notification email
    try {
      const emailContent = noReplyAutoRejectEmail(app.candidate.name, app.job.title);
      await sendEmail({ to: app.candidate.email, ...emailContent });

      await supabase.from("email_logs").insert({
        application_id: app.id,
        recipient_email: app.candidate.email,
        subject: emailContent.subject,
        template: "auto_reject",
      });
    } catch {
      // Continue with other applications
    }

    rejectedCount++;
  }

  return NextResponse.json({
    message: `Auto-rejected ${rejectedCount} application(s)`,
    count: rejectedCount,
  });
}
