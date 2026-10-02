"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/** Below this, a navigation finished quickly enough that a bar would only flicker. */
const SHOW_AFTER_MS = 140;

/** A navigation that never lands shouldn't leave the rule sitting there. */
const GIVE_UP_MS = 12_000;

/** How long the finished rule takes to run out and fade; matches `nav-finish`. */
const FINISH_MS = 300;

/**
 * One pink rule across the top of the window while a page is on its way.
 *
 * The route-level `loading.tsx` fallbacks cover the wait once a navigation has
 * committed. This covers what comes before that: the gap between a click and the new
 * route's first byte, which on an un-prefetched dynamic route is the part that
 * actually feels slow.
 *
 * `useLinkStatus` would be the tidier source, but it only reports for the `<Link>` it
 * sits inside, so a rule shared by the whole page has to watch clicks itself.
 *
 * The element is rendered once and driven by its `data-phase` attribute rather than
 * React state: the animation is pure CSS, and a progress bar shouldn't re-render the
 * tree it's reporting on.
 */
export function NavProgress() {
  const pathname = usePathname();
  const rule = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const clearTimers = () => {
      for (const id of timers.current) window.clearTimeout(id);
      timers.current = [];
    };
    const after = (ms: number, run: () => void) => timers.current.push(window.setTimeout(run, ms));

    const phase = (next: "idle" | "running" | "done") => {
      const el = rule.current;
      if (!el) return;
      // Restarting the same phase needs the animation taken off and reflowed first,
      // or a second navigation inherits the first one's progress.
      if (next === el.dataset.phase) {
        el.dataset.phase = "idle";
        void el.offsetWidth;
      }
      el.dataset.phase = next;
    };

    const onClick = (event: MouseEvent) => {
      // Let the browser have anything that isn't a plain left click.
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (event.defaultPrevented) return;
      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      let url: URL;
      try {
        url = new URL(anchor.href);
      } catch {
        return; // A malformed href isn't ours to report on.
      }
      // Another origin leaves the app, and the current URL isn't a navigation at all.
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      clearTimers();
      // Hold off briefly: a prefetched route usually lands before this fires.
      after(SHOW_AFTER_MS, () => phase("running"));
      after(GIVE_UP_MS, () => phase("idle"));
    };

    document.addEventListener("click", onClick, { capture: true });
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      clearTimers();
    };
  }, []);

  // A new pathname means the navigation landed. Only a rule that actually made it on
  // screen gets run out; one still inside its delay is simply dropped.
  useEffect(() => {
    const el = rule.current;
    if (!el) return;
    for (const id of timers.current) window.clearTimeout(id);
    timers.current = [];
    if (el.dataset.phase !== "running") {
      el.dataset.phase = "idle";
      return;
    }
    el.dataset.phase = "done";
    const id = window.setTimeout(() => {
      el.dataset.phase = "idle";
    }, FINISH_MS);
    return () => window.clearTimeout(id);
  }, [pathname]);

  return <div ref={rule} className="nav-rule" data-phase="idle" aria-hidden />;
}
