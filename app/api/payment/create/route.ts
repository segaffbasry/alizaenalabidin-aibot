import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
// @ts-ignore
import midtransClient from "midtrans-client";

const PLAN_CONFIG = {
  "1month":  { amount: 29000,  label: "Tanya AZA — 1 Bulan" },
  "6month":  { amount: 150000, label: "Tanya AZA — 6 Bulan (Promo)" },
  "12month": { amount: 240000, label: "Tanya AZA — 12 Bulan (Promo)" },
} as const;

type PlanKey = keyof typeof PLAN_CONFIG;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const plan: PlanKey = body.plan && body.plan in PLAN_CONFIG ? body.plan : "1month";

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminSupabase = await createAdminClient();
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("name, plan")
      .eq("id", user.id)
      .single();

    const snap = new midtransClient.Snap({
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
      serverKey: process.env.MIDTRANS_SERVER_KEY,
    });

    const config = PLAN_CONFIG[plan];
    const orderId = `AZA-${user.id.slice(0, 8)}-${plan}-${Date.now()}`;

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: config.amount,
      },
      customer_details: {
        first_name: profile?.name || user.email?.split("@")[0] || "User",
        email: user.email,
      },
      item_details: [
        {
          id: plan,
          price: config.amount,
          quantity: 1,
          name: config.label,
        },
      ],
    };

    const transaction = await snap.createTransaction(parameter);
    return NextResponse.json({ token: transaction.token, orderId });
  } catch (error: any) {
    const detail = error?.ApiResponse ?? error?.message ?? JSON.stringify(error);
    console.error("Payment create error:", JSON.stringify(detail));
    return NextResponse.json({ error: "Failed to create transaction", detail: JSON.stringify(detail) }, { status: 500 });
  }
}
