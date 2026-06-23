import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { v4 as uuid } from "uuid";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServiceClient();
  const formData = await req.formData();

  const updates: Record<string, unknown> = {};

  const remarks = formData.get("remarks") as string | null;
  if (remarks !== null) updates.remarks = remarks;

  const applicationForm = formData.get("application_form") as File | null;
  if (applicationForm && applicationForm.size > 0) {
    const ext = applicationForm.name.split(".").pop();
    const filePath = `application_form_${uuid().slice(0, 8)}.${ext}`;
    const buffer = Buffer.from(await applicationForm.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(filePath, buffer, { contentType: applicationForm.type, upsert: true });

    if (!uploadError) {
      const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(filePath);
      updates.application_form_url = urlData.publicUrl;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("interviews")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
