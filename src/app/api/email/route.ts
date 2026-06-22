import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail, offerEmail } from "@/lib/email";
import { format } from "date-fns";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { application_id, salary, start_date, expiry_date, notes } = body;

  const supabase = createServiceClient();

  // Get application with candidate and job
  const { data: app } = await supabase
    .from("applications")
    .select("*, candidate:candidates(*), job:jobs(*)")
    .eq("id", application_id)
    .single();

  if (!app) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  // Create offer record
  const { data: offer, error: offerError } = await supabase
    .from("offers")
    .insert({
      application_id,
      salary,
      start_date,
      expiry_date,
      notes,
    })
    .select()
    .single();

  if (offerError) {
    return NextResponse.json({ error: offerError.message }, { status: 500 });
  }

  // Update application stage to offer
  await supabase
    .from("applications")
    .update({ stage: "offer", stage_changed_at: new Date().toISOString() })
    .eq("id", application_id);

  // Send offer email
  try {
    const emailContent = offerEmail(
      app.candidate.name,
      app.job.title,
      salary,
      format(new Date(start_date), "d MMMM yyyy"),
      format(new Date(expiry_date), "d MMMM yyyy")
    );
    await sendEmail({ to: app.candidate.email, ...emailContent });

    // Log email
    await supabase.from("email_logs").insert({
      application_id,
      recipient_email: app.candidate.email,
      subject: emailContent.subject,
      template: "offer",
    });
  } catch {
    // Don't block on email failure
  }

  return NextResponse.json(offer);
}
