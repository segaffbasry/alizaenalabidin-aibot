"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import gsap from "gsap";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 3000);
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F0E8] px-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-[#e8e3d9] p-8 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-semibold text-[#1A1A1A] mb-2">Pendaftaran Berhasil!</h2>
          <p className="text-[#6B6560] text-sm">
            Silakan cek email kamu untuk verifikasi. Kamu akan diarahkan ke halaman login.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={pageRef} className="min-h-screen flex flex-col items-center justify-center bg-[#F5F0E8] px-4">
      <Link data-reveal href="/" className="mb-8 text-[#1A1A1A] text-2xl" style={{ fontFamily: "var(--font-malvian), Malvian, sans-serif" }}>
        Tanya AZA
      </Link>

      <div data-reveal className="w-full max-w-md bg-white rounded-2xl border border-[#e8e3d9] p-8">
        <h1 className="text-2xl font-semibold text-[#1A1A1A] mb-1">Daftar Akun</h1>
        <p className="text-[#6B6560] text-sm mb-8">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-[#6B8F8E] hover:underline font-medium">
            Masuk di sini
          </Link>
        </p>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Nama Lengkap</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama kamu"
              className="w-full border border-[#e8e3d9] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A96E] bg-white placeholder:text-[#9a9490]"
            />
          </div>
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
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 karakter"
              minLength={8}
              className="w-full border border-[#e8e3d9] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A96E] bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1A1A1A] text-white font-semibold py-3 rounded-xl hover:bg-[#333] transition-colors disabled:opacity-50"
          >
            {loading ? "Mendaftar..." : "Daftar Sekarang"}
          </button>
        </form>
      </div>
    </div>
  );
}
