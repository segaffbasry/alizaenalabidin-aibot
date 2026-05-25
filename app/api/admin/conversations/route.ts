import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const adminSupabase = await createAdminClient();

    const { data: conversations } = await adminSupabase
      .from("conversations")
      .select(`
        id, title, created_at, updated_at, user_id,
        profiles!inner(name)
      `)
      .order("updated_at", { ascending: false });

    // Get message counts
    const { data: msgCounts } = await adminSupabase
      .from("messages")
      .select("conversation_id");

    const countMap: Record<string, number> = {};
    (msgCounts || []).forEach((m: { conversation_id: string }) => {
      countMap[m.conversation_id] = (countMap[m.conversation_id] || 0) + 1;
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = (conversations || []).map((c: any) => ({
      ...c,
      message_count: countMap[c.id] || 0,
      user_name: Array.isArray(c.profiles) ? c.profiles[0]?.name || "Unknown" : c.profiles?.name || "Unknown",
    }));

    return NextResponse.json({ conversations: result });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
