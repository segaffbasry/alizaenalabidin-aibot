"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import gsap from "gsap";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-reveal]",
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.1, clearProps: "transform" }
      );
    }, pageRef);
    return () => ctx.revert();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) setError(error.message);
      else setSent(true);
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={pageRef} className="min-h-screen flex flex-col items-center justify-center bg-[#F5F0E8] px-4">
      <Link data-reveal href="/" className="mb-8 text-[#1A1A1A] text-2xl" style={{ fontFamily: "var(--font-malvian), Malvian, sans-serif" }}>
        Tanya AZA
      </Link>

      <div data-reveal className="w-full max-w-md bg-white rounded-2xl border border-[#e8e3d9] p-8">
        {sent ? (
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-[#F5F0E8] flex items-center justify-center mx-auto mb-4 text-xl">✉️</div>
            <h1 className="text-xl font-semibold text-[#1A1A1A] mb-2">Cek email kamu</h1>
            <p className="text-[#6B6560] text-sm mb-6">
              Link reset password telah dikirim ke <span className="font-medium text-[#1A1A1A]">{email}</span>. Periksa juga folder spam.
            </p>
            <Link href="/login" className="text-sm text-[#6B8F8E] hover:underline font-medium">
              Kembali ke halaman masuk
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-[#1A1A1A] mb-1">Lupa Password</h1>
            <p className="text-[#6B6560] text-sm mb-8">
              Masukkan email kamu dan kami akan mengirimkan link untuk reset password.
            </p>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kamu@email.com"
                  className="w-full border border-[#e8e3d9] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A96E] bg-white placeholder:text-[#9a9490]"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1A1A1A] text-white font-medium py-3 rounded-xl hover:bg-[#333] transition-colors disabled:opacity-50"
              >
                {loading ? "Mengirim..." : "Kirim Link Reset"}
              </button>
            </form>

            <p className="text-center text-sm text-[#6B6560] mt-6">
              Ingat password?{" "}
              <Link href="/login" className="text-[#6B8F8E] hover:underline font-medium">
                Masuk di sini
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
