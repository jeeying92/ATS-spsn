import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuid } from "uuid";

const DOWNLOADS_DIR = path.join(process.cwd(), "public", "downloads");

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

  // Get candidate name for filename
  const { data: candidate } = await supabase
    .from("candidates")
    .select("name")
    .eq("id", id)
    .single();

  if (!candidate) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }

  await mkdir(DOWNLOADS_DIR, { recursive: true });

  const ext = resume.name.split(".").pop();
  const safeName = candidate.name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
  const fileName = `${safeName}_${uuid().slice(0, 8)}.${ext}`;
  const filePath = path.join(DOWNLOADS_DIR, fileName);
  const buffer = Buffer.from(await resume.arrayBuffer());
  await writeFile(filePath, buffer);

  const resumeUrl = `/downloads/${fileName}`;

  const { error } = await supabase
    .from("candidates")
    .update({ resume_url: resumeUrl })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ resume_url: resumeUrl });
}
