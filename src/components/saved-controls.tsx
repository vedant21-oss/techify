"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useMessages } from "@/components/lang-provider";
import { useRecent, useSaved } from "@/lib/saved-store";
import { cn } from "@/lib/utils";

export function SaveButton({ slug, name, variant = "cell" }: { slug: string; name: string; variant?: "cell" | "block" }) {
  const { isSaved, toggle } = useSaved();
  const t = useMessages();
  const saved = isSaved(slug);
  return (
    <button
      type="button"
      onClick={() => toggle(slug)}
      aria-pressed={saved}
      aria-label={saved ? t.save.remove(name) : t.save.saveName(name)}
      className={cn(
        "flex items-center gap-2 label-mono transition-colors",
        variant === "cell"
          ? "px-5 py-4 hover:bg-pink-tint sm:px-7"
          : "border-[3px] border-ink px-4 py-2.5 shadow-hard hover:-translate-y-0.5",
        saved && variant === "block" && "bg-pink text-ink-deep",
        saved && variant === "cell" && "bg-pink-tint",
      )}
    >
      <Heart className={cn("size-4", saved && "fill-current")} aria-hidden />
      {saved ? t.save.saved : t.save.save}
    </button>
  );
}

/** Records a device visit for the "Recently viewed" list. Renders nothing. */
export function RecentTracker({ slug }: { slug: string }) {
  const { record } = useRecent();
  useEffect(() => record(slug), [record, slug]);
  return null;
}

export function SavedNavLink({ className }: { className?: string }) {
  const { saved } = useSaved();
  const t = useMessages();
  return (
    <Link href="/saved" className={className}>
      {t.nav.saved}
      {saved.length > 0 && (
        <span className="ml-2 inline-grid min-w-5 place-items-center bg-pink px-1 text-[0.7rem] text-ink-deep tabular">
          {saved.length}
        </span>
      )}
    </Link>
  );
}
