"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { UserMenu } from "@/components/ui/user-menu";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/users", label: "Pengguna", icon: "👥" },
  { href: "/admin/conversations", label: "Percakapan", icon: "💬" },
  { href: "/admin/knowledge", label: "Knowledge Base", icon: "📚" },
  { href: "/admin/settings", label: "Pengaturan AI", icon: "⚙️" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [adminName, setAdminName] = useState("Admin");

  useEffect(() => {
    const check = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, name")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") { router.replace("/"); return; }
      if (profile?.name) setAdminName(profile.name);
      setChecking(false);
    };
    check();
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f4]">
        <div className="text-[#6B6560] text-sm">Memeriksa akses...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#faf8f4]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-[#e8e3d9] flex flex-col shrink-0">
        <div className="px-6 py-5 border-b border-[#e8e3d9]">
          <Link href="/" className="text-xl text-[#1A1A1A]" style={{ fontFamily: "var(--font-malvian), Malvian, sans-serif" }}>
            Tanya AZA
          </Link>
          <p className="text-xs text-[#6B6560] mt-0.5">Admin Panel</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? "bg-[#1A1A1A] text-white" : "text-[#6B6560] hover:bg-[#faf8f4] hover:text-[#1A1A1A]"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-[#e8e3d9] space-y-1">
          <Link
            href="/chat"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#6B8F8E] hover:bg-[#faf8f4] hover:text-[#1A1A1A] transition-colors font-medium"
          >
            <span>💬</span>
            Buka Chat
          </Link>
          <div className="px-3 py-2.5">
            <UserMenu name={adminName} onLogout={handleLogout} fontSize="14px" />
          </div>
        </div>
      </aside>

      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
