import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { displayName } from "@/components/device-meta";
import { ScoreBox } from "@/components/score-bar";
import { formatPrice } from "@/lib/engine";
import type { DeviceDTO, RecommendationItem } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Compact, linkable device summary for lists: alternatives, search, saved, picks. */
export function DeviceRow({
  device,
  item,
  href,
  eyebrow,
  note,
  actions,
  className,
}: {
  device: DeviceDTO;
  item?: RecommendationItem;
  href?: string;
  eyebrow?: string;
  note?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  const link = href ?? `/device/${device.slug}`;
  return (
    <article className={cn("@container flex flex-col border-[3px] border-ink bg-paper", className)}>
      <div className="flex flex-1 flex-col gap-4 p-5 @md:flex-row @md:items-start @md:justify-between">
        <div className="min-w-0">
          {eyebrow && <p className="mb-2 inline-block bg-ink px-2 py-0.5 label-mono text-paper">{eyebrow}</p>}
          <h3 className="text-3xl">
            <Link href={link} className="hover:bg-pink-tint">
              {displayName(device)}
            </Link>
          </h3>
          <p className="mt-2 label-mono text-ink-soft">{device.variant}</p>
          <p className="mt-2 font-heading text-2xl font-bold tabular">{formatPrice(device.price)}</p>
          {note && <p className="mt-3 max-w-[48ch] text-sm leading-relaxed text-ink-soft">{note}</p>}
        </div>
        {item && (
          <div className="flex shrink-0 gap-2">
            <ScoreBox score={item.matchScore} label="Match" tone="match" />
            <ScoreBox score={item.valueScore} label="Value" tone="value" />
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-stretch border-t-[3px] border-ink">
        <Link href={link} className="flex items-center gap-2 px-5 py-3 label-mono hover:bg-ink hover:text-paper">
          View details <ArrowRight className="size-4" aria-hidden />
        </Link>
        {actions && <div className="ml-auto flex items-stretch border-l-[3px] border-ink">{actions}</div>}
      </div>
    </article>
  );
}

