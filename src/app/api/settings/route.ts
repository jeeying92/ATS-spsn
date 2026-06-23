import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { v4 as uuid } from "uuid";

async function uploadToStorage(
  supabase: ReturnType<typeof createServiceClient>,
  bucket: string,
  file: File,
  prefix: string
): Promise<string> {
  const ext = file.name.split(".").pop();
  const filePath = `${prefix}_${uuid().slice(0, 8)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, buffer, { contentType: file.type, upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}

export async function GET() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("company_settings")
    .select("*")
    .limit(1)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const supabase = createServiceClient();
  const formData = await req.formData();

  const vision = formData.get("vision") as string;
  const mission = formData.get("mission") as string;
  const address = formData.get("address") as string;
  const visionZh = formData.get("vision_zh") as string;
  const missionZh = formData.get("mission_zh") as string;
  const addressZh = formData.get("address_zh") as string;
  const meetingProvidersRaw = formData.get("meeting_providers") as string | null;
  const logo = formData.get("logo") as File | null;
  const companyPhoto = formData.get("company_photo") as File | null;

  const updates: Record<string, unknown> = {
    vision,
    mission,
    address,
    vision_zh: visionZh || "",
    mission_zh: missionZh || "",
    address_zh: addressZh || "",
    updated_at: new Date().toISOString(),
  };

  if (meetingProvidersRaw) {
    try { updates.meeting_providers = JSON.parse(meetingProvidersRaw); } catch { /* ignore */ }
  }

  if (logo && logo.size > 0) {
    updates.logo_url = await uploadToStorage(supabase, "uploads", logo, "logo");
  }

  if (companyPhoto && companyPhoto.size > 0) {
    updates.company_photo_url = await uploadToStorage(supabase, "uploads", companyPhoto, "company");
  }

  const { data: existing } = await supabase
    .from("company_settings")
    .select("id")
    .limit(1)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Settings not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("company_settings")
    .update(updates)
    .eq("id", existing.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
