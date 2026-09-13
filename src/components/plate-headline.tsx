"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * A headline printed in two plates. The pink plate slides into register on load and
 * drifts slightly toward the pointer, like ink on a riso drum.
 */
export function PlateHeadline({ lines, className, id }: { lines: string[]; className?: string; id?: string }) {
  const ref = useRef<HTMLHeadingElement>(null);

  function onPointerMove(event: React.PointerEvent<HTMLElement>) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !ref.current) return;
    const box = event.currentTarget.getBoundingClientRect();
    ref.current.style.setProperty("--mx", (((event.clientX - box.left) / box.width) * 2 - 1).toFixed(3));
    ref.current.style.setProperty("--my", (((event.clientY - box.top) / box.height) * 2 - 1).toFixed(3));
  }

  function onPointerLeave() {
    ref.current?.style.setProperty("--mx", "0");
    ref.current?.style.setProperty("--my", "0");
  }

  return (
    <div onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
      <h1 ref={ref} id={id} aria-label={lines.join(" ")} className={cn("relative isolate", className)}>
        {lines.map((line, i) => (
          <span key={line} className="plate" data-text={line} style={{ "--i": i } as React.CSSProperties} aria-hidden="true">
            {line}
          </span>
        ))}
      </h1>
    </div>
  );
}
