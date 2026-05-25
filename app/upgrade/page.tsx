"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { Navbar } from "@/components/layout/navbar";
import gsap from "gsap";

declare global {
  interface Window {
    snap: {
      pay: (token: string, options: {
        onSuccess: (result: unknown) => void;
        onPending: (result: unknown) => void;
        onError: (result: unknown) => void;
        onClose: () => void;
      }) => void;
    };
  }
}

type PlanKey = "1month" | "6month" | "12month";

const PLANS: {
  key: PlanKey;
  label: string;
  price: number;
  originalPrice?: number;
  period: string;
  desc: string;
  badge?: string;
  highlight: boolean;
  highlightAlt?: boolean;
}[] = [
  {
    key: "1month",
    label: "1 Bulan",
    price: 29000,
    period: "/ bulan",
    desc: "Akses penuh selama 1 bulan.",
    highlight: false,
  },
  {
    key: "6month",
    label: "6 Bulan",
    price: 150000,
    originalPrice: 176000,
    period: "/ 6 bulan",
    desc: "Hemat Rp 26.000 dibanding bulanan.",
    badge: "Promo Bundling",
    highlight: true,
  },
  {
    key: "12month",
    label: "12 Bulan",
    price: 240000,
    originalPrice: 348000,
    period: "/ 12 bulan",
    desc: "Hemat Rp 108.000 — harga terbaik.",
    badge: "Terbaik",
    highlight: false,
    highlightAlt: true,
  },
];

function formatIDR(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

export default function PricingPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [paying, setPaying] = useState<PlanKey | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-reveal]",
        { opacity: 0, y: 36 },
        { opacity: 1, y: 0, duration: 0.75, ease: "power3.out", stagger: 0.13, clearProps: "transform" }
      );
    }, pageRef);
    return () => ctx.revert();
  }, []);

  const handleBuy = async (planKey: PlanKey) => {
    setPaying(planKey);
    try {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey }),
      });
      if (res.status === 401) {
        router.push("/login?next=/pricing");
        return;
      }
      const data = await res.json();
      if (!data.token) {
        alert("Gagal membuat transaksi: " + (data.detail || data.error || "Unknown error"));
        setPaying(null);
        return;
      }
      if (!window.snap) {
        alert("Midtrans Snap belum siap, coba refresh halaman.");
        setPaying(null);
        return;
      }
      window.snap.pay(data.token, {
        onSuccess: () => { router.push("/chat?welcome=paid"); },
        onPending: () => { router.push("/chat"); },
        onError: (result) => { console.error("Snap error:", result); setPaying(null); },
        onClose: () => { setPaying(null); },
      });
    } catch (e) {
      console.error("Payment error:", e);
      alert("Terjadi kesalahan, cek console.");
      setPaying(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F0E8]" ref={pageRef}>
      <Script
        src="https://app.midtrans.com/snap/snap.js"
        data-client-key="Mid-client-hK_oCh_9UNmzJLCc"
        data-environment="production"
        strategy="afterInteractive"
      />
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 pt-40 pb-20">
        <div data-reveal className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl text-[#1A1A1A] mb-4 tracking-wide" style={{ fontFamily: "var(--font-display)" }}>
            HARGA
          </h1>
          <p className="text-[#6B6560] max-w-md mx-auto">
            Mulai gratis atau pilih paket langganan yang sesuai kebutuhanmu.
          </p>
        </div>

        {/* Free plan — compact banner */}
        <div data-reveal className="mb-6 bg-white border border-[#e8e3d9] rounded-2xl px-6 py-4 flex items-center justify-between max-w-2xl mx-auto">
          <div>
            <span className="text-sm font-semibold text-[#6B6560] uppercase tracking-widest">Gratis</span>
            <p className="text-xs text-[#9a9490] mt-0.5">10 percakapan sebagai tamu · Akses pengetahuan dasar</p>
          </div>
          <Link
            href="/register"
            className="shrink-0 ml-4 text-sm font-semibold px-5 py-2 rounded-xl border border-[#e8e3d9] bg-[#F5F0E8] text-[#1A1A1A] hover:bg-[#eae5dc] transition-colors"
          >
            Mulai Gratis
          </Link>
        </div>

        {/* Paid plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {PLANS.map((plan) => (
            <div
              data-reveal
              key={plan.key}
              className={`rounded-2xl p-7 flex flex-col relative ${
                plan.highlight
                  ? "pricing-gradient-card"
                  : plan.highlightAlt
                  ? "pricing-gradient-card-alt"
                  : "bg-white border border-[#e8e3d9]"
              }`}
            >
              {plan.badge && (
                <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4 w-fit ${
                  plan.highlight || plan.highlightAlt ? "bg-white/20 text-white" : "bg-[#1A1A1A] text-white"
                }`}>
                  {plan.badge}
                </span>
              )}

              <h2 className={`text-sm font-semibold tracking-widest uppercase mb-4 ${plan.highlight || plan.highlightAlt ? "text-white/70" : "text-[#6B6560]"}`}>
                {plan.label}
              </h2>

              <div className="mb-1">
                {plan.originalPrice && (
                  <p className={`text-sm line-through mb-0.5 ${plan.highlight || plan.highlightAlt ? "text-white/50" : "text-[#9a9490]"}`}>
                    {formatIDR(plan.originalPrice)}
                  </p>
                )}
                <span className={`text-3xl font-bold ${plan.highlight || plan.highlightAlt ? "text-white" : "text-[#1A1A1A]"}`}>
                  {formatIDR(plan.price)}
                </span>
              </div>
              <span className={`text-xs mb-4 ${plan.highlight || plan.highlightAlt ? "text-white/70" : "text-[#6B6560]"}`}>
                {plan.period}
              </span>

              <p className={`text-sm mb-8 leading-relaxed flex-1 font-semibold ${plan.highlight || plan.highlightAlt ? "text-white/80" : "text-[#6B6560]"}`}>
                {plan.desc}
              </p>

              <ul className="space-y-2.5 mb-8">
                {[
                  "Percakapan tak terbatas",
                  "Akses penuh knowledge base Ali",
                  "Riwayat percakapan tersimpan",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <svg className={`w-4 h-4 shrink-0 ${plan.highlight || plan.highlightAlt ? "text-white" : "text-[#7A9E9B]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className={plan.highlight || plan.highlightAlt ? "text-white/90" : "text-[#1A1A1A]"}>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleBuy(plan.key)}
                disabled={paying !== null}
                className={`block w-full text-center font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 ${
                  plan.highlight || plan.highlightAlt
                    ? "bg-[#1A1A1A] text-white hover:bg-[#333]"
                    : "bg-[#F5F0E8] text-[#1A1A1A] border border-[#e8e3d9] hover:bg-[#eae5dc]"
                }`}
              >
                {paying === plan.key ? "Memproses..." : "Pilih Paket"}
              </button>
            </div>
          ))}
        </div>

        <p data-reveal className="text-center text-[#6B6560] text-sm mt-10">
          Semua harga dalam Rupiah (IDR) · Pembayaran aman via Midtrans
        </p>
      </main>
    </div>
  );
}
