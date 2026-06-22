import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { v4 as uuid } from "uuid";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServiceClient();

  const formData = await req.formData();
  const resume = formData.get("resume") as File | null;

  if (!resume || resume.size === 0) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const { data: candidate } = await supabase
    .from("candidates")
    .select("name")
    .eq("id", id)
    .single();

  if (!candidate) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }

  const ext = resume.name.split(".").pop();
  const safeName = candidate.name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
  const filePath = `${safeName}_${uuid().slice(0, 8)}.${ext}`;
  const buffer = Buffer.from(await resume.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("resumes")
    .upload(filePath, buffer, { contentType: resume.type });

  if (uploadError) {
    return NextResponse.json({ error: "Failed to upload resume" }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from("resumes").getPublicUrl(filePath);
  const resumeUrl = urlData.publicUrl;

  const { error } = await supabase
    .from("candidates")
    .update({ resume_url: resumeUrl })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ resume_url: resumeUrl });
}
