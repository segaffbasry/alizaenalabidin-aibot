"use client";

import type { CSSProperties } from "react";

export function GradientText({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <>
      <style>{`
        @keyframes aza-gradient-move {
          0%   { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
        .aza-gradient-text {
          background: linear-gradient(270deg, #734133, #9cc8bf, #deb6a4, #f3ebd9, #9cc8bf, #734133, #9cc8bf, #deb6a4, #f3ebd9);
          background-size: 400% 100%;
          animation: aza-gradient-move 10s linear infinite;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          display: inline-block;
        }
      `}</style>
      <span className={`aza-gradient-text ${className}`} style={style}>{children}</span>
    </>
  );
}
