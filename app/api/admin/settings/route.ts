import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createAdminClient();
    const { data } = await supabase.from("ai_settings").select("*").single();
    return NextResponse.json({ settings: data });
  } catch {
    return NextResponse.json({ settings: null });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = await createAdminClient();

    const { data: existing } = await supabase.from("ai_settings").select("id").single();

    if (existing?.id) {
      const { data } = await supabase
        .from("ai_settings")
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq("id", existing.id)
        .select()
        .single();
      return NextResponse.json({ settings: data });
    } else {
      const { data } = await supabase
        .from("ai_settings")
        .insert(body)
        .select()
        .single();
      return NextResponse.json({ settings: data });
    }
  } catch (error) {
    console.error("Settings save error:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
