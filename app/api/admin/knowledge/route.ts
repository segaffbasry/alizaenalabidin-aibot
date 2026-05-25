import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return null;
  return user;
}

export async function GET() {
  try {
    const user = await checkAdmin();
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const adminSupabase = await createAdminClient();
    const { data: entries } = await adminSupabase
      .from("knowledge_base")
      .select("*")
      .order("created_at", { ascending: false });

    return NextResponse.json({ entries: entries || [] });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await checkAdmin();
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { title, content } = await req.json();
    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const adminSupabase = await createAdminClient();
    const { data, error } = await adminSupabase
      .from("knowledge_base")
      .insert({ title, content })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ entry: data }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
