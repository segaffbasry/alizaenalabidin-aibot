import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return null;
  return createAdminClient();
}

export async function GET() {
  try {
    const adminSupabase = await requireAdmin();
    if (!adminSupabase) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { data: profiles } = await adminSupabase
      .from("profiles")
      .select("id, name, role, plan, plan_expires_at, created_at")
      .order("created_at", { ascending: false });

    const { data: convCounts } = await adminSupabase.from("conversations").select("user_id");
    const countMap: Record<string, number> = {};
    (convCounts || []).forEach((c: { user_id: string }) => {
      countMap[c.user_id] = (countMap[c.user_id] || 0) + 1;
    });

    const { data: authUsers } = await adminSupabase.auth.admin.listUsers();
    const emailMap: Record<string, string> = {};
    (authUsers?.users || []).forEach((u) => { emailMap[u.id] = u.email || ""; });

    const users = (profiles || []).map((p: {
      id: string; name: string | null; role: string; plan: string;
      plan_expires_at: string | null; created_at: string;
    }) => ({
      ...p,
      email: emailMap[p.id] || "",
      conversation_count: countMap[p.id] || 0,
    }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const adminSupabase = await requireAdmin();
    if (!adminSupabase) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { userId, plan, plan_expires_at } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const update: Record<string, unknown> = {};
    if (plan !== undefined) update.plan = plan;
    if (plan_expires_at !== undefined) update.plan_expires_at = plan_expires_at || null;

    const { error } = await adminSupabase.from("profiles").update(update).eq("id", userId);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
