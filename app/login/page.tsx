"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import gsap from "gsap";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else if (!data.user?.email_confirmed_at) {
        // Block access until the email is verified.
        await supabase.auth.signOut();
        setError("Email kamu belum dikonfirmasi. Silakan cek inbox (dan folder spam) untuk link verifikasi.");
      } else {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
        router.push(profile?.role === "admin" ? "/admin" : "/chat");
        router.refresh();
      }
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
        <h1 className="text-2xl font-semibold text-[#1A1A1A] mb-1">Masuk</h1>
        <p className="text-[#6B6560] text-sm mb-8">
          Belum punya akun?{" "}
          <Link href="/register" className="text-[#6B8F8E] hover:underline font-medium">
            Daftar di sini
          </Link>
        </p>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
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
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-[#1A1A1A]">Password</label>
              <Link href="/forgot-password" className="text-xs text-[#6B8F8E] hover:underline">
                Lupa password?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-[#e8e3d9] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A96E] bg-white"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1A1A1A] text-white font-medium py-3 rounded-xl hover:bg-[#333] transition-colors disabled:opacity-50"
          >
            {loading ? "Masuk..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}
