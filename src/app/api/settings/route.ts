import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuid } from "uuid";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

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
  const logo = formData.get("logo") as File | null;
  const companyPhoto = formData.get("company_photo") as File | null;

  await mkdir(UPLOADS_DIR, { recursive: true });

  const updates: Record<string, unknown> = {
    vision,
    mission,
    address,
    updated_at: new Date().toISOString(),
  };

  if (logo && logo.size > 0) {
    const ext = logo.name.split(".").pop();
    const fileName = `logo_${uuid().slice(0, 8)}.${ext}`;
    const buffer = Buffer.from(await logo.arrayBuffer());
    await writeFile(path.join(UPLOADS_DIR, fileName), buffer);
    updates.logo_url = `/uploads/${fileName}`;
  }

  if (companyPhoto && companyPhoto.size > 0) {
    const ext = companyPhoto.name.split(".").pop();
    const fileName = `company_${uuid().slice(0, 8)}.${ext}`;
    const buffer = Buffer.from(await companyPhoto.arrayBuffer());
    await writeFile(path.join(UPLOADS_DIR, fileName), buffer);
    updates.company_photo_url = `/uploads/${fileName}`;
  }

  // Get the single settings row
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
