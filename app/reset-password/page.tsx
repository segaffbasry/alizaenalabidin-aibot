"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import gsap from "gsap";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);
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

  useEffect(() => {
    const supabase = createClient();
    // Listen for the PASSWORD_RECOVERY event from the email link token
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    // Also check if already in a recovery session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError("Password tidak cocok."); return; }
    if (password.length < 6) { setError("Password minimal 6 karakter."); return; }
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) setError(error.message);
      else {
        setDone(true);
        setTimeout(() => router.push("/login"), 2500);
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
        {done ? (
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-[#F5F0E8] flex items-center justify-center mx-auto mb-4 text-xl">✅</div>
            <h1 className="text-xl font-semibold text-[#1A1A1A] mb-2">Password berhasil diubah</h1>
            <p className="text-[#6B6560] text-sm">Kamu akan diarahkan ke halaman masuk...</p>
          </div>
        ) : !ready ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-[#C8A96E] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#6B6560] text-sm">Memverifikasi link reset...</p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-[#1A1A1A] mb-1">Buat Password Baru</h1>
            <p className="text-[#6B6560] text-sm mb-8">Masukkan password baru kamu di bawah ini.</p>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Password Baru</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-[#e8e3d9] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A96E] bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Konfirmasi Password</label>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-[#e8e3d9] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A96E] bg-white"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1A1A1A] text-white font-medium py-3 rounded-xl hover:bg-[#333] transition-colors disabled:opacity-50"
              >
                {loading ? "Menyimpan..." : "Simpan Password Baru"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
