"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Navbar } from "@/components/layout/navbar";
import { PillButton } from "@/components/ui/pill-button";
import { GradientText } from "@/components/ui/gradient-text";
import gsap from "gsap";

interface GuestMessage {
  role: "user" | "assistant";
  content: string;
}

const GUEST_LIMIT = 10;

const STARTER_PROMPTS = [
  "Bagaimana menemukan tujuan hidup?",
  "Langkah pertama memulai perubahan?",
  "Tips tetap semangat saat ada tantangan?",
  "Cara move on dari masa lalu?",
];

const STORAGE_KEY = "aza_guest_usage";

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function loadCount(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const { date, count } = JSON.parse(raw);
    if (date !== getTodayKey()) return 0; // new day — reset
    return count;
  } catch {
    return 0;
  }
}

function saveCount(count: number) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: getTodayKey(), count }));
}

function GuestChat() {
  const [messages, setMessages] = useState<GuestMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCount(loadCount());
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading || count >= GUEST_LIMIT) return;
    const userMsg = text.trim();
    setInput("");
    const nextMessages: GuestMessage[] = [...messages, { role: "user", content: userMsg }];
    setMessages(nextMessages);
    const newCount = count + 1;
    setCount(newCount);
    saveCount(newCount);
    setLoading(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, history: messages }),
      });

      if (!res.ok || !res.body) throw new Error();

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let reply = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: reply };
          return updated;
        });
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: "Maaf, terjadi kesalahan. Silakan coba lagi." };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const remaining = GUEST_LIMIT - count;
  const exhausted = count >= GUEST_LIMIT;
  const isEmpty = messages.length === 0;

  return (
    <div className="bg-white rounded-2xl border border-[#e8e3d9] shadow-lg overflow-hidden flex flex-col h-[400px] sm:h-[500px]">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#e8e3d9] bg-white">
        <img src="/avatar-ali.png" alt="Ali" className="w-8 h-8 rounded-full object-cover shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-[#1A1A1A]">Ali Zaenal Abidin</p>
          <p className="text-xs text-[#6B6560]">Representasi digital Ali Zaenal Abidin</p>
        </div>
      </div>

      {/* Messages / Empty state */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center gap-3">
            <p className="text-[#6B6560] text-sm mb-2">Pilih pertanyaan atau tulis sendiri:</p>
            <div className="w-full space-y-2">
              {STARTER_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="w-full text-left text-sm border border-[#e8e3d9] text-[#1A1A1A] px-4 py-3 rounded-xl hover:border-[#C8A96E] hover:bg-[#faf7f2] transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <img src="/avatar-ali.png" alt="Ali" className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5" />
                )}
                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#1A1A1A] text-white rounded-br-sm"
                    : "bg-[#F5F0E8] text-[#1A1A1A] rounded-bl-sm border border-[#e8e3d9]"
                }`}>
                  {msg.content || (
                    <span className="inline-flex gap-1">
                      <span className="animate-bounce">•</span>
                      <span className="animate-bounce [animation-delay:0.15s]">•</span>
                      <span className="animate-bounce [animation-delay:0.3s]">•</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
            {loading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 rounded-full bg-[#1A1A1A] flex items-center justify-center text-[#C8A96E] text-xs font-bold shrink-0 mt-0.5">A</div>
                <div className="bg-[#F5F0E8] border border-[#e8e3d9] px-4 py-2.5 rounded-2xl rounded-bl-sm text-sm">
                  <span className="inline-flex gap-1"><span className="animate-bounce">•</span><span className="animate-bounce [animation-delay:0.15s]">•</span><span className="animate-bounce [animation-delay:0.3s]">•</span></span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      {exhausted ? (
        <div className="px-5 py-4 border-t border-[#e8e3d9] bg-[#faf7f2] text-center">
          <p className="text-sm text-[#1A1A1A] font-semibold mb-2">Batas percobaan tercapai</p>
          <Link href="/register" className="text-sm bg-[#7A9E9B] text-white px-5 py-2 rounded-lg hover:bg-[#6a8e8b] transition-colors inline-block">
            Daftar gratis untuk lanjut →
          </Link>
        </div>
      ) : (
        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="relative border-t border-[#e8e3d9] bg-white"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            placeholder="Tanya AZA"
            disabled={loading}
            rows={3}
            className="w-full resize-none text-base border-0 px-5 pt-5 pb-14 focus:outline-none bg-white placeholder:text-[#9a9490] disabled:opacity-50"
          />
          {/* Usage indicator */}
          <div className="absolute top-3 right-4 group">
            <div className="w-8 h-8 flex items-center justify-center cursor-default">
              <svg viewBox="0 0 36 36" className="w-8 h-8 -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#e8e3d9" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="14" fill="none"
                  stroke="#6B8F8E" strokeWidth="3"
                  strokeDasharray={`${(count / GUEST_LIMIT) * 87.96} 87.96`}
                  strokeLinecap="round"
                />
              </svg>
            </div>
            {/* Tooltip */}
            <div className="absolute right-0 top-10 w-52 bg-white rounded-2xl shadow-lg border border-[#e8e3d9] px-4 py-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-lg font-bold text-[#1A1A1A]">{Math.round((count / GUEST_LIMIT) * 100)}%</span>
                <span className="text-sm text-[#6B6560]">{count} / {GUEST_LIMIT} pesan hari ini</span>
              </div>
              <div className="w-full h-2 bg-[#e8e3d9] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#6B8F8E] rounded-full transition-all duration-300"
                  style={{ width: `${(count / GUEST_LIMIT) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="absolute bottom-4 right-4 bg-[#e8e3d9] text-[#1A1A1A] rounded-full w-10 h-10 flex items-center justify-center hover:bg-[#d4cfc9] transition-colors disabled:opacity-40"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </form>
      )}
    </div>
  );
}

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-reveal]",
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.12, clearProps: "transform" }
      );
      gsap.fromTo(
        "[data-reveal-chat]",
        { opacity: 0, x: 40 },
        { opacity: 1, x: 0, duration: 0.9, ease: "power3.out", delay: 0.3, clearProps: "transform" }
      );
    }, heroRef);
    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F0E8]">
      <Navbar />

      <main className="flex-1" ref={heroRef}>
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-28 sm:pt-36 pb-12 sm:pb-16 md:pt-44 md:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            {/* Left */}
            <div>
              <h1 data-reveal className="text-4xl sm:text-6xl md:text-7xl text-[#1A1A1A] leading-none mb-6 tracking-wide" style={{ fontFamily: "var(--font-display)" }}>
                MULAI NGOBROL<br />DENGAN{" "}
                <GradientText className="" style={{ fontFamily: "var(--font-malvian), Malvian, sans-serif" }}>AI ALI</GradientText>
              </h1>
              <p data-reveal className="text-base text-[#6B6560] leading-relaxed mb-10 max-w-md font-medium">
                Konsultasi langsung dengan AI Ali: akses wawasan, saran, dan
                pengalaman dari Ali Zaenal Abidin kapanpun kamu butuh.
              </p>
              <div data-reveal className="flex flex-wrap items-center gap-6">
                <PillButton label="Mulai Ngobrol" href="/login" />
                <Link href="/upgrade" className="text-base font-medium text-[#6B6560] hover:text-[#1A1A1A] transition-colors">
                  Info Selengkapnya
                </Link>
              </div>
            </div>
            {/* Right: guest chat */}
            <div data-reveal-chat className="transition-transform duration-300 ease-out hover:scale-105">
              <GuestChat />
            </div>
          </div>
        </section>

      </main>

    </div>
  );
}
