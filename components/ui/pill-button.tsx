"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface PillButtonProps {
  label: string;
  href: string;
  external?: boolean;
}

export function PillButton({ label, href, external }: PillButtonProps) {
  const inner = (
    <motion.span
      className="group inline-flex items-center justify-between gap-4 pl-6 pr-2 py-2 cursor-pointer select-none transition-colors duration-300 bg-[#6B8F8E] hover:bg-[#1A1A1A]"
      style={{ borderRadius: "16px" }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      <span className="font-medium text-white text-base whitespace-nowrap">
        {label}
      </span>
      <span
        className="flex items-center justify-center w-10 h-10 bg-[#1A1A1A] group-hover:bg-[#6B8F8E] transition-colors duration-300 flex-shrink-0"
        style={{ borderRadius: "10px" }}
      >
        <ArrowRight size={17} className="text-white" />
      </span>
    </motion.span>
  );

  if (external) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex">{inner}</a>;
  }
  return <Link href={href} className="inline-flex">{inner}</Link>;
}
