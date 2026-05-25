"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * Runs a staggered fade-up reveal on elements matching `selector` inside
 * `containerRef` when the component mounts.
 */
export function usePageReveal(selector = "[data-reveal]") {
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        selector,
        { opacity: 0, y: 32 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.1,
          clearProps: "transform",
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [selector]);

  return containerRef;
}
