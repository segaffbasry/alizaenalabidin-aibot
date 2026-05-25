import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import crypto from "crypto";

const PLAN_MONTHS: Record<string, number> = {
  "1month":  1,
  "6month":  6,
  "12month": 12,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order_id, status_code, gross_amount, signature_key, transaction_status, fraud_status } = body;

    // Verify signature
    const serverKey = process.env.MIDTRANS_SERVER_KEY!;
    const hash = crypto
      .createHash("sha512")
      .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
      .digest("hex");

    if (hash !== signature_key) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    const isSuccess =
      (transaction_status === "capture" && fraud_status === "accept") ||
      transaction_status === "settlement";

    if (!isSuccess) {
      return NextResponse.json({ received: true });
    }

    // Order ID format: AZA-{userId8}-{planKey}-{timestamp}
    const parts = order_id.split("-");
    const userIdPrefix = parts[1];
    const planKey = parts[2] || "1month";

    if (!userIdPrefix) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const months = PLAN_MONTHS[planKey] ?? 1;

    const supabase = await createAdminClient();

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, plan_expires_at")
      .ilike("id", `${userIdPrefix}%`);

    if (!profiles?.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const profile = profiles[0];

    // Extend from current expiry if still active, otherwise from now
    const base = profile.plan_expires_at && new Date(profile.plan_expires_at) > new Date()
      ? new Date(profile.plan_expires_at)
      : new Date();

    const expiresAt = new Date(base);
    expiresAt.setMonth(expiresAt.getMonth() + months);

    await supabase
      .from("profiles")
      .update({ plan: planKey, plan_expires_at: expiresAt.toISOString() })
      .eq("id", profile.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
