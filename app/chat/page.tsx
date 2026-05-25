"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X, Clock } from "lucide-react";
import { UserMenu } from "@/components/ui/user-menu";
import gsap from "gsap";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

const DAILY_LIMIT = 10;
const CHAT_STORAGE_KEY = "aza_chat_usage";

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function loadChatCount(): number {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return 0;
    const { date, count } = JSON.parse(raw);
    return date === getTodayKey() ? count : 0;
  } catch { return 0; }
}

function saveChatCount(count: number) {
  localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify({ date: getTodayKey(), count }));
}

const STARTER_PROMPTS = [
  "Bagaimana menemukan tujuan hidup?",
  "Langkah pertama memulai perubahan?",
  "Tips tetap semangat saat ada tantangan?",
  "Cara move on dari masa lalu?",
];

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [userName, setUserName] = useState("Pengguna");
  const [isAdmin, setIsAdmin] = useState(false);
  const [dailyCount, setDailyCount] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isFree, setIsFree] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("header", { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" });
      gsap.fromTo("[data-reveal]", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.1, delay: 0.2, clearProps: "transform" });
      gsap.fromTo("[data-input]", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", delay: 0.4, clearProps: "transform" });
    }, pageRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    setDailyCount(loadChatCount());
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: profile } = await supabase.from("profiles").select("name, role, plan, plan_expires_at").eq("id", user.id).single();
      if (profile?.name) setUserName(profile.name);
      if (profile?.role === "admin") setIsAdmin(true);
      const hasPaid = profile?.plan && profile.plan !== "free" &&
        (profile.plan === "lifetime" || (profile.plan_expires_at && new Date(profile.plan_expires_at) > new Date()));
      setIsFree(!hasPaid);
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchHistory = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("conversations")
      .select("id, title, updated_at")
      .order("updated_at", { ascending: false })
      .limit(30);
    setConversations(data || []);
  };

  const openHistory = () => {
    fetchHistory();
    setHistoryOpen(true);
  };

  const loadConversation = async (convId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("messages")
      .select("id, role, content")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    setMessages((data || []).map((m) => ({ id: m.id, role: m.role as "user" | "assistant", content: m.content })));
    setConversationId(convId);
    setHistoryOpen(false);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const sendMessage = async (text?: string) => {
    const trimmed = (text ?? input).trim();
    if (!trimmed || loading || dailyCount >= DAILY_LIMIT) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    const newCount = dailyCount + 1;
    setDailyCount(newCount);
    saveChatCount(newCount);
    setLoading(true);

    const aiMsgId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, { id: aiMsgId, role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, message: trimmed }),
      });
      if (!res.ok) throw new Error();
      const newConvId = res.headers.get("X-Conversation-Id");
      if (newConvId) setConversationId(newConvId);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullContent += decoder.decode(value, { stream: true });
          setMessages((prev) => prev.map((m) => m.id === aiMsgId ? { ...m, content: fullContent } : m));
        }
      }
    } catch {
      setMessages((prev) => prev.map((m) => m.id === aiMsgId ? { ...m, content: "Maaf, terjadi kesalahan. Silakan coba lagi." } : m));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={pageRef} className="flex flex-col h-[100dvh] bg-[#FAF8F4]">
      {/* Header */}
      <header className="border-b border-[#e8e3d9] px-3 sm:px-6 py-3 flex items-center justify-between shrink-0 bg-white gap-2">
        <Link href="/" className="text-[#1A1A1A]" style={{ fontFamily: "var(--font-malvian), Malvian, sans-serif", fontSize: "1.25rem", fontWeight: 500 }}>
          Tanya AZA
        </Link>
        <div className="flex items-center gap-5">
          <div className="group relative flex items-center justify-center cursor-default w-8 h-8">
            <svg viewBox="0 0 36 36" className="w-8 h-8 -rotate-90">
              <circle cx="18" cy="18" r="14" fill="none" stroke="#e8e3d9" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="14" fill="none"
                stroke="#6B8F8E" strokeWidth="3"
                strokeDasharray={`${(dailyCount / DAILY_LIMIT) * 87.96} 87.96`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute right-0 top-10 w-44 bg-white rounded-2xl shadow-lg border border-[#e8e3d9] px-4 py-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-lg font-bold text-[#1A1A1A]">{dailyCount}/{DAILY_LIMIT}</span>
                <span className="text-sm text-[#6B6560]">pesan hari ini</span>
              </div>
              <div className="w-full h-2 bg-[#e8e3d9] rounded-full overflow-hidden">
                <div className="h-full bg-[#6B8F8E] rounded-full transition-all duration-300" style={{ width: `${(dailyCount / DAILY_LIMIT) * 100}%` }} />
              </div>
            </div>
          </div>
          <button
            onClick={openHistory}
            className="flex items-center gap-1.5 text-[#6B6560] hover:text-[#1A1A1A] transition-colors"
            style={{ fontFamily: "var(--font-body)", fontSize: "18px" }}
          >
            <Clock size={16} />
            Riwayat
          </button>
          {isAdmin ? (
            <Link
              href="/admin"
              className="text-[#1A1A1A] font-medium"
              style={{ fontFamily: "var(--font-body)", fontSize: "18px" }}
            >
              Admin Panel
            </Link>
          ) : (
            <Link
              href="/upgrade"
              className="text-[#6B8F8E] hover:text-[#1A1A1A] transition-colors font-medium"
              style={{ fontFamily: "var(--font-body)", fontSize: "18px" }}
            >
              Upgrade
            </Link>
          )}
          <UserMenu name={userName} onLogout={handleLogout} />
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div data-reveal className="py-16">
              <div className="text-center mb-8">
                <img src="/avatar-ali.png" alt="Ali" className="w-16 h-16 rounded-full object-cover mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-2">Halo! Saya Ali Zaenal Abidin</h2>
                <p className="text-[#6B6560] text-sm max-w-sm mx-auto">Apa yang ingin kamu diskusikan hari ini?</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {STARTER_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => sendMessage(p)}
                    className="text-left text-sm border border-[#e8e3d9] bg-white text-[#1A1A1A] px-4 py-3 rounded-xl hover:border-[#C8A96E] hover:bg-[#faf7f2] transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              {msg.role === "assistant" && (
                <img src="/avatar-ali.png" alt="Ali" className="w-8 h-8 rounded-full object-cover shrink-0 mt-1" />
              )}
              <div className={`max-w-xl px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-[#1A1A1A] text-white rounded-tr-sm"
                  : "bg-white text-[#1A1A1A] rounded-tl-sm border border-[#e8e3d9]"
              }`}>
                {msg.content || (
                  <span className="inline-flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C8A96E] animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C8A96E] animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C8A96E] animate-bounce" style={{ animationDelay: "300ms" }} />
                  </span>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div data-input className="border-t border-[#e8e3d9] px-4 py-4 bg-white shrink-0">
        {dailyCount >= DAILY_LIMIT && (
          <div className="max-w-3xl mx-auto text-center py-2 mb-3">
            <p className="text-sm text-[#1A1A1A] font-semibold mb-2">Batas pesan harian tercapai</p>
            <Link href="/upgrade" className="text-sm bg-[#6B8F8E] text-white px-5 py-2 rounded-lg hover:bg-[#5a7e7c] transition-colors inline-block">
              Upgrade untuk pesan tak terbatas →
            </Link>
          </div>
        )}
        <div className="max-w-3xl mx-auto flex gap-3 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Tanya AZA..."
            rows={1}
            disabled={dailyCount >= DAILY_LIMIT}
            className="flex-1 resize-none border border-[#e8e3d9] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A96E] bg-white placeholder:text-[#9a9490] max-h-40 overflow-y-auto disabled:opacity-40"
            onInput={(e) => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim() || dailyCount >= DAILY_LIMIT}
            className="bg-[#1A1A1A] text-white p-3 rounded-xl hover:bg-[#333] transition-colors disabled:opacity-40 shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <p className="text-center text-xs text-[#6B6560] mt-2">Enter untuk kirim · Shift+Enter untuk baris baru</p>
      </div>

      {/* History overlay */}
      <AnimatePresence>
        {historyOpen && (
          <>
            <motion.div
              key="backdrop"
              className="fixed inset-0 bg-black/30 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setHistoryOpen(false)}
            />
            <motion.div
              key="panel"
              className="fixed top-0 right-0 h-full w-[85vw] sm:w-80 bg-white z-50 shadow-2xl flex flex-col"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8e3d9]">
                <span className="font-semibold text-[#1A1A1A]">Riwayat Chat</span>
                <button onClick={() => setHistoryOpen(false)} className="text-[#6B6560] hover:text-[#1A1A1A] transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-2">
                {conversations.length === 0 ? (
                  <p className="text-center text-[#6B6560] text-sm py-10">Belum ada riwayat chat.</p>
                ) : (
                  conversations.map((conv) => {
                    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
                    const isLocked = isFree && new Date(conv.updated_at).getTime() < cutoff;
                    return (
                      <button
                        key={conv.id}
                        onClick={() => isLocked ? undefined : loadConversation(conv.id)}
                        disabled={isLocked}
                        className={`w-full text-left px-5 py-3 border-b border-[#f0ece4] transition-colors ${
                          isLocked
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-[#F5F0E8]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isLocked && (
                            <svg className="w-3 h-3 shrink-0 text-[#9a9490]" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                          )}
                          <p className="text-sm font-medium text-[#1A1A1A] truncate">{conv.title || "Percakapan"}</p>
                        </div>
                        <p className="text-xs text-[#6B6560] mt-0.5 pl-5">
                          {new Date(conv.updated_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </button>
                    );
                  })
                )}
              </div>
              {isFree && conversations.some((c) => new Date(c.updated_at).getTime() < Date.now() - 24 * 60 * 60 * 1000) && (
                <div className="px-5 py-3 border-t border-[#e8e3d9] bg-[#faf7f2]">
                  <p className="text-xs text-[#6B6560] mb-2">Riwayat lebih dari 24 jam hanya tersedia untuk member.</p>
                  <Link
                    href="/upgrade"
                    onClick={() => setHistoryOpen(false)}
                    className="block text-center text-xs font-semibold text-white bg-[#6B8F8E] hover:bg-[#5a7e7c] rounded-lg py-2 transition-colors"
                  >
                    Upgrade Sekarang →
                  </Link>
                </div>
              )}
              <div className="px-5 py-4 border-t border-[#e8e3d9]">
                <button
                  onClick={() => { setMessages([]); setConversationId(null); setHistoryOpen(false); }}
                  className="w-full text-center text-sm font-medium text-[#6B8F8E] hover:text-[#1A1A1A] transition-colors"
                >
                  + Chat Baru
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
