"use client";

import { useEffect, useState, useRef } from "react";
import gsap from "gsap";

const OPENAI_MODELS = [
  { value: "gpt-4o", label: "GPT-4o (Terbaru, tercepat)" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini (Lebih hemat)" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
  { value: "gpt-4", label: "GPT-4" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo (Paling hemat)" },
];

interface AISettings {
  id?: string;
  provider: string;
  model: string;
  api_key: string;
  temperature: number;
  system_prompt_prefix: string;
}

const DEFAULT_SETTINGS: AISettings = {
  provider: "openai",
  model: "gpt-4o",
  api_key: "",
  temperature: 0.8,
  system_prompt_prefix: "Kamu adalah AI Ali — representasi digital dari Ali Zaenal Abidin, seorang penulis, motivator, dan pemikir Indonesia.\nJawablah setiap pertanyaan dengan gaya, nilai, dan wawasan Ali.\nGunakan bahasa Indonesia yang hangat, bijaksana, dan inspiratif.",
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AISettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-header]", { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" });
      gsap.fromTo("[data-section]", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out", stagger: 0.08, delay: 0.15, clearProps: "transform" });
    }, pageRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.settings) setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
        }
      } catch {
        // use defaults
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) setSaved(true);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-6 w-48 bg-slate-100 rounded animate-pulse mb-8"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div ref={pageRef} className="p-8 max-w-2xl">
      <div data-header className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Pengaturan AI</h1>
        <p className="text-[#6B6560] text-sm mt-1">Konfigurasi model dan API untuk chatbot AI Ali.</p>
      </div>

      <div className="space-y-6">
        {/* Provider */}
        <div data-section className="bg-white rounded-2xl border border-[#e8e3d9] p-6">
          <h2 className="font-semibold text-[#1A1A1A] mb-4">Provider AI</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: "openai", label: "OpenAI", icon: "🤖" },
              { value: "custom", label: "Custom (OpenAI-compatible)", icon: "⚙️" },
            ].map((p) => (
              <button
                key={p.value}
                onClick={() => setSettings((s) => ({ ...s, provider: p.value }))}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-colors ${
                  settings.provider === p.value
                    ? "border-[#1A1A1A] bg-[#faf8f4]"
                    : "border-[#e8e3d9] hover:border-[#C8A96E]"
                }`}
              >
                <span className="text-xl">{p.icon}</span>
                <span className="text-sm font-medium text-[#1A1A1A]">{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Model */}
        <div data-section className="bg-white rounded-2xl border border-[#e8e3d9] p-6">
          <h2 className="font-semibold text-[#1A1A1A] mb-4">Model</h2>
          <div className="space-y-2">
            {OPENAI_MODELS.map((m) => (
              <label
                key={m.value}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  settings.model === m.value
                    ? "border-[#1A1A1A] bg-[#faf8f4]"
                    : "border-[#e8e3d9] hover:border-[#C8A96E]"
                }`}
              >
                <input
                  type="radio"
                  name="model"
                  value={m.value}
                  checked={settings.model === m.value}
                  onChange={() => setSettings((s) => ({ ...s, model: m.value }))}
                  className="accent-[#1A1A1A]"
                />
                <span className="text-sm text-[#1A1A1A]">{m.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* API Key */}
        <div data-section className="bg-white rounded-2xl border border-[#e8e3d9] p-6">
          <h2 className="font-semibold text-[#1A1A1A] mb-4">API Key</h2>
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              value={settings.api_key}
              onChange={(e) => setSettings((s) => ({ ...s, api_key: e.target.value }))}
              placeholder="sk-..."
              className="w-full border border-[#e8e3d9] rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#C8A96E] bg-white pr-24"
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6560] hover:text-[#1A1A1A] text-xs font-medium"
            >
              {showKey ? "Sembunyikan" : "Tampilkan"}
            </button>
          </div>
          <p className="text-xs text-[#6B6560] mt-2">
            Jika kosong, akan menggunakan <code className="bg-[#F5F0E8] px-1 rounded">OPENAI_API_KEY</code> dari environment variable.
          </p>
        </div>

        {/* Temperature */}
        <div data-section className="bg-white rounded-2xl border border-[#e8e3d9] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#1A1A1A]">Temperature</h2>
            <span className="text-sm font-mono bg-[#F5F0E8] px-2 py-0.5 rounded text-[#1A1A1A]">
              {settings.temperature.toFixed(1)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={settings.temperature}
            onChange={(e) => setSettings((s) => ({ ...s, temperature: parseFloat(e.target.value) }))}
            className="w-full accent-[#1A1A1A]"
          />
          <div className="flex justify-between text-xs text-[#6B6560] mt-1">
            <span>Lebih konsisten</span>
            <span>Lebih kreatif</span>
          </div>
        </div>

        {/* System Prompt */}
        <div data-section className="bg-white rounded-2xl border border-[#e8e3d9] p-6">
          <h2 className="font-semibold text-[#1A1A1A] mb-1">System Prompt (Kepribadian Ali)</h2>
          <p className="text-xs text-[#6B6560] mb-4">Instruksi dasar yang membentuk cara AI Ali berbicara. Knowledge base akan ditambahkan secara otomatis setelahnya.</p>
          <textarea
            value={settings.system_prompt_prefix}
            onChange={(e) => setSettings((s) => ({ ...s, system_prompt_prefix: e.target.value }))}
            rows={5}
            className="w-full border border-[#e8e3d9] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A96E] bg-white resize-none font-mono"
          />
        </div>

        {/* Save */}
        <div data-section className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#1A1A1A] text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-[#333] transition-colors disabled:opacity-40"
          >
            {saving ? "Menyimpan..." : "Simpan Pengaturan"}
          </button>
          {saved && (
            <span className="text-sm text-[#6B8F8E] font-medium flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Tersimpan!
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
