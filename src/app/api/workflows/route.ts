import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServiceClient();
  const { data: workflows, error } = await supabase
    .from("workflows")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Also fetch recent logs
  const { data: logs } = await supabase
    .from("workflow_logs")
    .select("*")
    .order("executed_at", { ascending: false })
    .limit(50);

  return NextResponse.json({ workflows, logs: logs || [] });
}

export async function POST(req: NextRequest) {
  const supabase = createServiceClient();
  const body = await req.json();

  const { data, error } = await supabase
    .from("workflows")
    .insert({
      name: body.name,
      trigger_type: body.trigger_type,
      trigger_config: body.trigger_config || {},
      actions: body.actions || [],
      enabled: body.enabled ?? true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const supabase = createServiceClient();
  const body = await req.json();
  const { id, ...updates } = body;

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("workflows")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const supabase = createServiceClient();
  const { id } = await req.json();

  const { error } = await supabase.from("workflows").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
