import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail, applicationConfirmationEmail } from "@/lib/email";
import { evaluateWorkflows } from "@/lib/workflow-engine";
import { v4 as uuid } from "uuid";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const DOWNLOADS_DIR = path.join(process.cwd(), "public", "downloads");

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const jobId = formData.get("job_id") as string;
    const coverLetter = formData.get("cover_letter") as string;
    const resume = formData.get("resume") as File | null;

    if (!name || !email || !phone || !jobId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Save resume to local downloads folder
    let resumeUrl: string | null = null;
    if (resume && resume.size > 0) {
      await mkdir(DOWNLOADS_DIR, { recursive: true });
      const ext = resume.name.split(".").pop();
      const safeName = name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
      const fileName = `${safeName}_${uuid().slice(0, 8)}.${ext}`;
      const filePath = path.join(DOWNLOADS_DIR, fileName);
      const buffer = Buffer.from(await resume.arrayBuffer());
      await writeFile(filePath, buffer);
      resumeUrl = `/downloads/${fileName}`;
    }

    // Upsert candidate
    const { data: existingCandidate } = await supabase
      .from("candidates")
      .select("id")
      .eq("email", email)
      .single();

    let candidateId: string;

    if (existingCandidate) {
      candidateId = existingCandidate.id;
      await supabase
        .from("candidates")
        .update({
          name,
          phone,
          ...(resumeUrl ? { resume_url: resumeUrl } : {}),
        })
        .eq("id", candidateId);
    } else {
      const { data: newCandidate, error: candidateError } = await supabase
        .from("candidates")
        .insert({ name, email, phone, resume_url: resumeUrl, source: "website" })
        .select("id")
        .single();

      if (candidateError || !newCandidate) {
        return NextResponse.json({ error: "Failed to create candidate" }, { status: 500 });
      }
      candidateId = newCandidate.id;
    }

    // Check for duplicate application
    const { data: existingApp } = await supabase
      .from("applications")
      .select("id")
      .eq("job_id", jobId)
      .eq("candidate_id", candidateId)
      .single();

    if (existingApp) {
      return NextResponse.json({ error: "You have already applied for this position" }, { status: 409 });
    }

    // Create application
    const { error: appError } = await supabase
      .from("applications")
      .insert({
        job_id: jobId,
        candidate_id: candidateId,
        cover_letter: coverLetter || null,
      });

    if (appError) {
      return NextResponse.json({ error: "Failed to create application" }, { status: 500 });
    }

    // Get job title for email
    const { data: job } = await supabase
      .from("jobs")
      .select("title")
      .eq("id", jobId)
      .single();

    // Send confirmation email
    try {
      const emailContent = applicationConfirmationEmail(name, job?.title || "the position");
      await sendEmail({ to: email, ...emailContent });
    } catch {
      // Email failure shouldn't block the application
    }

    // Fire workflow triggers
    evaluateWorkflows("application_received", {
      application_id: undefined, // just created, fetch if needed
      candidate_id: candidateId,
      candidate_name: name,
      candidate_email: email,
      job_id: jobId,
      job_title: job?.title || "",
      stage: "applied",
      source: "website",
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const supabase = createServiceClient();
  const jobId = req.nextUrl.searchParams.get("job_id");
  const stage = req.nextUrl.searchParams.get("stage");

  let query = supabase
    .from("applications")
    .select("*, candidate:candidates(*), job:jobs(*)");

  if (jobId) query = query.eq("job_id", jobId);
  if (stage) query = query.eq("stage", stage);

  const { data, error } = await query.order("applied_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
