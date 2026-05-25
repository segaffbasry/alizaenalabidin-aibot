"use client";

import { useEffect, useState, useRef } from "react";
import gsap from "gsap";

interface Conversation {
  id: string;
  title: string | null;
  user_name: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export default function AdminConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-header]", { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" });
      gsap.fromTo("[data-table]", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out", delay: 0.15, clearProps: "transform" });
    }, pageRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    fetch("/api/admin/conversations")
      .then((r) => r.json())
      .then((d) => setConversations(d.conversations || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = conversations.filter(
    (c) =>
      c.title?.toLowerCase().includes(search.toLowerCase()) ||
      c.user_name.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const exportCSV = () => {
    const headers = ["Judul", "Pengguna", "Jumlah Pesan", "Dibuat", "Terakhir Update"];
    const rows = filtered.map((c) => [
      c.title || "(Tanpa judul)",
      c.user_name,
      c.message_count,
      formatDate(c.created_at),
      formatDate(c.updated_at),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `percakapan-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div ref={pageRef} className="p-8">
      <div data-header className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Percakapan</h1>
          <p className="text-[#6B6560] text-sm mt-1">{conversations.length} total percakapan</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#e8e3d9] bg-white text-sm font-medium text-[#1A1A1A] hover:bg-[#F5F0E8] transition-colors"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 10.5L3.5 6.5H6V1.5H9V6.5H11.5L7.5 10.5Z" fill="currentColor"/><path d="M2 12.5H13V13.5H2V12.5Z" fill="currentColor"/></svg>
          Export CSV
        </button>
      </div>

      <div data-table className="bg-white rounded-2xl border border-[#e8e3d9] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e8e3d9]">
          <input
            type="text"
            placeholder="Cari percakapan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm border border-[#e8e3d9] rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A96E] bg-white placeholder:text-[#9a9490]"
          />
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-[#6B6560] text-sm">Memuat data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F5F0E8] border-b border-[#e8e3d9]">
                <tr>
                  {["Judul", "Pengguna", "Pesan", "Dibuat", "Terakhir Update"].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-[#6B6560] uppercase tracking-wider px-6 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0ece4]">
                {filtered.map((conv) => (
                  <tr key={conv.id} className="hover:bg-[#faf7f2] transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-[#1A1A1A] max-w-xs truncate">
                        {conv.title || "(Tanpa judul)"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#F5F0E8] border border-[#e8e3d9] text-[#1A1A1A] flex items-center justify-center font-semibold text-xs">
                          {conv.user_name[0].toUpperCase()}
                        </div>
                        <span className="text-sm text-[#6B6560]">{conv.user_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F5F0E8] text-[#6B6560]">
                        {conv.message_count} pesan
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6B6560]">{formatDate(conv.created_at)}</td>
                    <td className="px-6 py-4 text-sm text-[#6B6560]">{formatDate(conv.updated_at)}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-[#6B6560] text-sm">
                      Tidak ada percakapan ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
