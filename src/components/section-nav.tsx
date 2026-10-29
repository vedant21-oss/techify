"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * A strip of jump links for a long page. It sticks under the header on desktop widths, where the header is one row,
 * and marks the section being read, so the page stays one scroll but is easy to move around.
 */
export function SectionNav({ label, sections }: { label: string; sections: { id: string; label: string }[] }) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const targets = sections.map((s) => document.getElementById(s.id)).filter((el): el is HTMLElement => el !== null);
    // A section is "current" once its heading passes the top third of the screen.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-15% 0px -65% 0px" },
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav aria-label={label} className="z-30 border-b-[3px] border-ink bg-paper lg:sticky lg:top-[3.6875rem]">
      <ul className="mx-auto flex max-w-6xl overflow-x-auto px-(--gutter)">
        {sections.map((s, i) => (
          <li key={s.id} className="shrink-0">
            <a
              href={`#${s.id}`}
              aria-current={active === s.id ? "location" : undefined}
              className={cn(
                "block border-r border-ink px-4 py-3 label-mono transition-colors",
                i === 0 && "border-l",
                active === s.id ? "bg-ink text-paper" : "hover:bg-pink-tint",
              )}
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
