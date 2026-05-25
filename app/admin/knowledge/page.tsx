"use client";

import { useEffect, useState } from "react";

interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}


interface ModalState {
  open: boolean;
  mode: "add" | "edit";
  entry?: KnowledgeEntry;
}

export default function AdminKnowledgePage() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>({ open: false, mode: "add" });
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const loadEntries = async () => {
    try {
      const res = await fetch("/api/admin/knowledge");
      const data = await res.json();
      setEntries(data.entries || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const openAdd = () => {
    setFormTitle("");
    setFormContent("");
    setModal({ open: true, mode: "add" });
  };

  const openEdit = (entry: KnowledgeEntry) => {
    setFormTitle(entry.title);
    setFormContent(entry.content);
    setModal({ open: true, mode: "edit", entry });
  };

  const closeModal = () => {
    setModal({ open: false, mode: "add" });
  };

  const handleSave = async () => {
    if (!formTitle.trim() || !formContent.trim()) return;
    setSaving(true);

    try {
      if (modal.mode === "add") {
        const res = await fetch("/api/admin/knowledge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: formTitle, content: formContent }),
        });
        if (res.ok) {
          const data = await res.json();
          setEntries((prev) => [data.entry, ...prev]);
        } else {
          // Mock: add locally
          const newEntry: KnowledgeEntry = {
            id: Date.now().toString(),
            title: formTitle,
            content: formContent,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setEntries((prev) => [newEntry, ...prev]);
        }
      } else if (modal.entry) {
        const res = await fetch(`/api/admin/knowledge/${modal.entry.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: formTitle, content: formContent }),
        });
        if (res.ok) {
          const data = await res.json();
          setEntries((prev) =>
            prev.map((e) => (e.id === modal.entry!.id ? data.entry : e))
          );
        } else {
          setEntries((prev) =>
            prev.map((e) =>
              e.id === modal.entry!.id
                ? { ...e, title: formTitle, content: formContent, updated_at: new Date().toISOString() }
                : e
            )
          );
        }
      }
      closeModal();
    } catch {
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus entri ini?")) return;
    setDeletingId(id);

    try {
      await fetch(`/api/admin/knowledge/${id}`, { method: "DELETE" });
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch {
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = entries.filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.content.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Knowledge Base</h1>
          <p className="text-slate-500 text-sm mt-1">
            {entries.length} entri pengetahuan tersimpan
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-[#1A1A1A] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#333] transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Tambah Entri
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#e8e3d9] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <input
            type="text"
            placeholder="Cari entri..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm border border-[#e8e3d9] rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A96E] bg-white placeholder:text-[#9a9490]"
          />
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-slate-400 text-sm">Memuat data...</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map((entry) => (
              <div key={entry.id} className="px-6 py-5 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 mb-1">{entry.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">
                      {entry.content}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      Diperbarui {formatDate(entry.updated_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openEdit(entry)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      disabled={deletingId === entry.id}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                      title="Hapus"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="px-6 py-16 text-center">
                <div className="text-4xl mb-3">📚</div>
                <p className="text-slate-500 text-sm">Belum ada entri pengetahuan.</p>
                <button
                  onClick={openAdd}
                  className="mt-4 text-blue-600 text-sm hover:underline"
                >
                  Tambah entri pertama
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">
                {modal.mode === "add" ? "Tambah Entri Baru" : "Edit Entri"}
              </h2>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Judul
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Judul entri pengetahuan"
                  className="w-full border border-[#e8e3d9] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A96E] bg-white placeholder:text-[#9a9490]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Konten
                </label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Tulis konten pengetahuan tentang Ali Zaenal Abidin..."
                  rows={6}
                  className="w-full border border-[#e8e3d9] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A96E] bg-white placeholder:text-[#9a9490] resize-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex gap-3 justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm text-[#6B6560] border border-[#e8e3d9] rounded-xl hover:bg-[#F5F0E8] transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formTitle.trim() || !formContent.trim()}
                className="px-4 py-2 text-sm font-medium bg-[#1A1A1A] text-white rounded-xl hover:bg-[#333] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
