"use client";

import { useEffect, useState, useRef } from "react";
import gsap from "gsap";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  plan: string;
  plan_expires_at: string | null;
  created_at: string;
  conversation_count: number;
}

const PLAN_LABELS: Record<string, string> = {
  free: "free",
  "1month": "1 Bulan",
  "6month": "6 Bulan",
  "12month": "12 Bulan",
  lifetime: "Lifetime",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPlan, setEditPlan] = useState("");
  const [editExpiry, setEditExpiry] = useState("");
  const [saving, setSaving] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-header]", { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" });
      gsap.fromTo("[data-table]", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out", delay: 0.15, clearProps: "transform" });
    }, pageRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => setUsers(d.users || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  const formatExpiry = (d: string | null) => {
    if (!d) return "—";
    const date = new Date(d);
    const expired = date < new Date();
    return (
      <span className={expired ? "text-red-500" : "text-[#6B8F8E]"}>
        {date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
        {expired ? " (habis)" : ""}
      </span>
    );
  };

  const startEdit = (user: User) => {
    setEditingId(user.id);
    setEditPlan(user.plan || "free");
    setEditExpiry(user.plan_expires_at ? user.plan_expires_at.slice(0, 10) : "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditPlan("");
    setEditExpiry("");
  };

  const saveEdit = async (userId: string) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          plan: editPlan,
          plan_expires_at: editExpiry ? new Date(editExpiry).toISOString() : null,
        }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId
              ? { ...u, plan: editPlan, plan_expires_at: editExpiry ? new Date(editExpiry).toISOString() : null }
              : u
          )
        );
        cancelEdit();
      }
    } finally {
      setSaving(false);
    }
  };

  const exportCSV = () => {
    const headers = ["Nama", "Email", "Role", "Plan", "Berakhir", "Bergabung", "Percakapan"];
    const rows = filtered.map((u) => [
      u.name || "",
      u.email,
      u.role,
      u.plan || "free",
      u.plan_expires_at ? new Date(u.plan_expires_at).toLocaleDateString("id-ID") : "",
      formatDate(u.created_at),
      u.conversation_count,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pengguna-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div ref={pageRef} className="p-8">
      <div data-header className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Pengguna</h1>
          <p className="text-[#6B6560] text-sm mt-1">{users.length} pengguna terdaftar</p>
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
            placeholder="Cari pengguna..."
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
                  {["Nama", "Email", "Role", "Plan", "Berakhir", "Bergabung", "Percakapan", ""].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-[#6B6560] uppercase tracking-wider px-6 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0ece4]">
                {filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-[#faf7f2] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#F5F0E8] text-[#1A1A1A] flex items-center justify-center font-semibold text-sm border border-[#e8e3d9]">
                          {(user.name || user.email)[0].toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-[#1A1A1A]">{user.name || "(Tanpa nama)"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6B6560]">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === "admin" ? "bg-[#1A1A1A] text-white" : "bg-[#F5F0E8] text-[#6B6560]"
                      }`}>
                        {user.role}
                      </span>
                    </td>

                    {/* Plan + Expiry columns — editable */}
                    {editingId === user.id ? (
                      <>
                        <td className="px-6 py-4">
                          <select
                            value={editPlan}
                            onChange={(e) => setEditPlan(e.target.value)}
                            className="border border-[#e8e3d9] rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#C8A96E] bg-white"
                          >
                            <option value="free">free</option>
                            <option value="1month">1 Bulan</option>
                            <option value="6month">6 Bulan</option>
                            <option value="12month">12 Bulan</option>
                            <option value="lifetime">Lifetime</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="date"
                            value={editExpiry}
                            onChange={(e) => setEditExpiry(e.target.value)}
                            className="border border-[#e8e3d9] rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#C8A96E] bg-white"
                          />
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.plan && user.plan !== "free"
                              ? "bg-[#6B8F8E] text-white"
                              : "bg-[#F5F0E8] text-[#6B6560]"
                          }`}>
                            {PLAN_LABELS[user.plan] || user.plan || "free"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {formatExpiry(user.plan_expires_at)}
                        </td>
                      </>
                    )}

                    <td className="px-6 py-4 text-sm text-[#6B6560]">{formatDate(user.created_at)}</td>
                    <td className="px-6 py-4 text-sm text-[#6B6560]">{user.conversation_count}</td>
                    <td className="px-6 py-4">
                      {editingId === user.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => saveEdit(user.id)}
                            disabled={saving}
                            className="text-xs font-semibold px-3 py-1 rounded-lg bg-[#1A1A1A] text-white hover:bg-[#333] disabled:opacity-50"
                          >
                            {saving ? "..." : "Simpan"}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-xs font-semibold px-3 py-1 rounded-lg bg-[#F5F0E8] text-[#6B6560] hover:bg-[#eae5dc]"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(user)}
                          className="text-xs font-semibold px-3 py-1 rounded-lg bg-[#F5F0E8] text-[#6B6560] hover:bg-[#eae5dc] transition-colors"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-[#6B6560] text-sm">
                      Tidak ada pengguna ditemukan.
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
