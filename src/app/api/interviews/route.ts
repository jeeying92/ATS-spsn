import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail, interviewInviteEmail } from "@/lib/email";
import { evaluateWorkflows } from "@/lib/workflow-engine";
import { format } from "date-fns";

export async function GET(req: NextRequest) {
  const supabase = createServiceClient();
  const appId = req.nextUrl.searchParams.get("application_id");

  let query = supabase
    .from("interviews")
    .select("*, application:applications(*, candidate:candidates(*), job:jobs(*))")
    .order("scheduled_at", { ascending: true });

  if (appId) {
    query = query.eq("application_id", appId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = createServiceClient();
  const body = await req.json();

  // Generate meeting link
  const meetingLink =
    body.meeting_provider === "zoom"
      ? `https://zoom.us/j/${Math.floor(Math.random() * 9000000000) + 1000000000}`
      : `https://meet.google.com/${generateMeetCode()}`;

  const { data: interview, error } = await supabase
    .from("interviews")
    .insert({
      ...body,
      meeting_link: meetingLink,
    })
    .select("*, application:applications(*, candidate:candidates(*), job:jobs(*))")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Send invite email to candidate
  try {
    const scheduledDate = new Date(interview.scheduled_at);
    const emailContent = interviewInviteEmail(
      interview.application.candidate.name,
      interview.application.job.title,
      interview.interview_type === "interview_1" ? "Interview Round 1" : "Interview Round 2",
      format(scheduledDate, "EEEE, d MMMM yyyy"),
      format(scheduledDate, "h:mm a"),
      interview.duration_minutes,
      meetingLink,
      interview.interviewer_name
    );
    await sendEmail({ to: interview.application.candidate.email, ...emailContent });
  } catch {
    // Don't block on email failure
  }

  return NextResponse.json(interview);
}

export async function PUT(req: NextRequest) {
  const supabase = createServiceClient();
  const body = await req.json();
  const { id, ...updates } = body;

  const { data, error } = await supabase
    .from("interviews")
    .update(updates)
    .eq("id", id)
    .select("*, application:applications(*, candidate:candidates(*), job:jobs(*))")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fire workflow triggers when interview is completed with score
  if (updates.score && updates.completed) {
    const ctx = {
      application_id: data.application_id,
      candidate_id: data.application?.candidate?.id,
      candidate_name: data.application?.candidate?.name,
      candidate_email: data.application?.candidate?.email,
      job_id: data.application?.job?.id,
      job_title: data.application?.job?.title,
      stage: data.application?.stage,
      score: updates.score as number,
      interview_type: data.interview_type,
    };

    evaluateWorkflows("interview_completed", ctx);

    if (updates.score <= 5) {
      evaluateWorkflows("score_below", ctx);
    }

    // Check for two consecutive < 3
    const { data: allInterviews } = await supabase
      .from("interviews")
      .select("score, scheduled_at")
      .eq("application_id", data.application_id)
      .eq("completed", true)
      .not("score", "is", null)
      .order("scheduled_at", { ascending: true });

    if (allInterviews && allInterviews.length >= 2) {
      const lastTwo = allInterviews.slice(-2);
      if (lastTwo.every((i: { score: number }) => i.score < 3)) {
        return NextResponse.json({
          ...data,
          suggest_reject: true,
          message: "Two consecutive interview scores below 3. Consider rejecting this candidate.",
        });
      }
    }
  }

  return NextResponse.json(data);
}

function generateMeetCode() {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  const segment = (len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * 26)]).join("");
  return `${segment(3)}-${segment(4)}-${segment(3)}`;
}
