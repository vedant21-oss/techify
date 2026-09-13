import { ArrowUpRight } from "lucide-react";
import type { BuyLink } from "@/lib/buy-links";
import { cn } from "@/lib/utils";

/** Outbound marketplace searches. `quiet` renders compact text links for dense rows. */
export function BuyButtons({
  links,
  variant = "block",
  className,
}: {
  links: BuyLink[];
  variant?: "block" | "quiet";
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap", variant === "block" ? "gap-3" : "gap-x-4 gap-y-1", className)}>
      {links.map((link) => (
        <a
          key={link.store}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Search ${link.store} for this model (opens in a new tab)`}
          className={cn(
            "inline-flex items-center gap-1.5 label-mono",
            variant === "block"
              ? "border-[3px] border-ink bg-paper px-4 py-2.5 shadow-hard transition-[transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_var(--ink)] active:translate-x-1 active:translate-y-1 active:shadow-none"
              : "underline decoration-2 underline-offset-4 hover:bg-pink hover:text-ink-deep hover:no-underline",
          )}
        >
          {link.store}
          <ArrowUpRight className="size-3.5" aria-hidden />
        </a>
      ))}
    </div>
  );
}
