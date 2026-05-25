"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface UserMenuProps {
  name: string;
  onLogout: () => void;
  fontSize?: string;
  textColor?: string;
}

export function UserMenu({ name, onLogout, fontSize = "18px", textColor = "#6B6560" }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const firstName = name.split(" ")[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 font-medium"
        style={{ fontFamily: "var(--font-body)", fontSize, color: textColor }}
      >
        {firstName}
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-full mt-2 w-40 bg-white border border-[#e8e3d9] rounded-xl shadow-lg overflow-hidden z-50"
          >
            <button
              onClick={() => { setOpen(false); onLogout(); }}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-[#1A1A1A] hover:bg-[#F5F0E8] transition-colors"
            >
              <LogOut size={14} className="text-[#6B6560]" />
              Keluar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
