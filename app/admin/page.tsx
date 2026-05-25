"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";

interface Stats {
  totalUsers: number;
  totalConversations: number;
  totalMessages: number;
  knowledgeEntries: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-header]", { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" });
    }, pageRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!loading) {
      gsap.fromTo("[data-card]", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out", stagger: 0.08, clearProps: "transform" });
    }
  }, [loading]);

  useEffect(() => {
    const load = async () => {
      try {
        const [usersRes, convRes, knowledgeRes] = await Promise.all([
          fetch("/api/admin/users"),
          fetch("/api/admin/conversations"),
          fetch("/api/admin/knowledge"),
        ]);
        const [usersData, convData, knowledgeData] = await Promise.all([
          usersRes.json(), convRes.json(), knowledgeRes.json(),
        ]);
        const totalMessages = (convData.conversations || []).reduce(
          (acc: number, c: { message_count: number }) => acc + (c.message_count || 0), 0
        );
        setStats({
          totalUsers: usersData.users?.length || 0,
          totalConversations: convData.conversations?.length || 0,
          totalMessages,
          knowledgeEntries: knowledgeData.entries?.length || 0,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const cards = stats ? [
    { label: "Total Pengguna", value: stats.totalUsers, icon: "👥", color: "bg-[#F5F0E8] text-[#1A1A1A]" },
    { label: "Total Percakapan", value: stats.totalConversations, icon: "💬", color: "bg-[#F5F0E8] text-[#1A1A1A]" },
    { label: "Total Pesan", value: stats.totalMessages, icon: "📨", color: "bg-[#F5F0E8] text-[#1A1A1A]" },
    { label: "Knowledge Entries", value: stats.knowledgeEntries, icon: "📚", color: "bg-[#F5F0E8] text-[#1A1A1A]" },
  ] : [];

  return (
    <div ref={pageRef} className="p-8">
      <div data-header className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Dashboard</h1>
        <p className="text-[#6B6560] text-sm mt-1">Selamat datang di panel admin Tanya AZA.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-[#e8e3d9] animate-pulse">
              <div className="h-10 w-10 rounded-xl bg-[#F5F0E8] mb-4" />
              <div className="h-8 w-16 bg-[#F5F0E8] rounded mb-2" />
              <div className="h-4 w-24 bg-[#F5F0E8] rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card) => (
            <div data-card key={card.label} className="bg-white rounded-2xl p-6 border border-[#e8e3d9]">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-4 ${card.color}`}>
                {card.icon}
              </div>
              <div className="text-3xl font-bold text-[#1A1A1A] mb-1">
                {card.value.toLocaleString("id-ID")}
              </div>
              <p className="text-sm text-[#6B6560]">{card.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div data-card className="bg-white rounded-2xl p-6 border border-[#e8e3d9]">
          <h2 className="font-semibold text-[#1A1A1A] mb-4">Aksi Cepat</h2>
          <div className="space-y-3">
            {[
              { href: "/admin/knowledge", label: "Tambah Knowledge Entry", icon: "➕" },
              { href: "/admin/users", label: "Lihat Semua Pengguna", icon: "👥" },
              { href: "/admin/conversations", label: "Monitor Percakapan", icon: "💬" },
              { href: "/admin/settings", label: "Pengaturan AI", icon: "⚙️" },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#e8e3d9] hover:bg-[#F5F0E8] transition-colors text-sm text-[#1A1A1A] font-medium"
              >
                <span>{action.icon}</span>
                {action.label}
              </Link>
            ))}
          </div>
        </div>

        <div data-card className="bg-white rounded-2xl p-6 border border-[#e8e3d9]">
          <h2 className="font-semibold text-[#1A1A1A] mb-4">Informasi Sistem</h2>
          <div className="space-y-3">
            {[
              { label: "Model AI", value: "GPT-4o" },
              { label: "Database", value: "Supabase (PostgreSQL)" },
              { label: "Platform", value: "Next.js App Router" },
              { label: "Bahasa Utama", value: "Bahasa Indonesia" },
            ].map((info) => (
              <div key={info.label} className="flex justify-between text-sm">
                <span className="text-[#6B6560]">{info.label}</span>
                <span className="text-[#1A1A1A] font-medium">{info.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
