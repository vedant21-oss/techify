"use client";

import { useEffect } from "react";

/**
 * Slides `[data-reveal]` sections in as they scroll into view. Anything already on
 * screen is marked visible before the effect is armed, so nothing flickers, and
 * without JavaScript every section simply stays visible.
 */
export function RevealObserver() {
  useEffect(() => {
    const root = document.documentElement;
    const targets = [...document.querySelectorAll<HTMLElement>("[data-reveal]")];
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      targets.forEach((el) => el.classList.add("revealed"));
      return;
    }

    for (const el of targets) {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.95) el.classList.add("revealed");
    }
    root.classList.add("reveal-armed");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
    );
    targets.filter((el) => !el.classList.contains("revealed")).forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      root.classList.remove("reveal-armed");
    };
  }, []);

  return null;
}
