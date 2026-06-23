import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("candidate_scores")
    .select("*")
    .eq("candidate_id", id)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || null);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServiceClient();
  const body = await req.json();

  const scoreData = {
    candidate_id: id,
    experience: body.experience,
    education: body.education,
    skills: body.skills,
    communication: body.communication,
    culture_fit: body.culture_fit,
    notes: body.notes || null,
    scored_by: body.scored_by || "admin",
  };

  // Upsert
  const { data: existing } = await supabase
    .from("candidate_scores")
    .select("id")
    .eq("candidate_id", id)
    .single();

  let data, error;

  if (existing) {
    ({ data, error } = await supabase
      .from("candidate_scores")
      .update(scoreData)
      .eq("candidate_id", id)
      .select()
      .single());
  } else {
    ({ data, error } = await supabase
      .from("candidate_scores")
      .insert(scoreData)
      .select()
      .single());
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
