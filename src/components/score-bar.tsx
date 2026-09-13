import { cn } from "@/lib/utils";

const fills = {
  ink: "bg-ink",
  pink: "bg-pink",
  muted: "bg-ink-soft/40",
} as const;

export function ScoreBar({
  score,
  tone = "ink",
  className,
  label,
}: {
  score: number;
  tone?: keyof typeof fills;
  className?: string;
  label?: string;
}) {
  const width = Math.max(0, Math.min(100, score));
  return (
    <div
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(width)}
      aria-label={label}
      className={cn("h-3 w-full border-2 border-ink bg-paper", className)}
    >
      <div className={cn("h-full transition-[width] duration-500", fills[tone])} style={{ width: `${width}%` }} />
    </div>
  );
}

/**
 * A score stamped into a solid block. Match is set in ink, value in pink, so the two
 * never read alike even at a glance.
 */
export function ScoreBox({
  score,
  label,
  note,
  tone,
  size = "md",
  muted = false,
}: {
  score: number;
  label: string;
  note?: string;
  tone: "match" | "value";
  size?: "md" | "lg";
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between border-[3px] border-ink",
        size === "lg" ? "min-w-32 gap-3 p-4" : "min-w-[5.5rem] gap-1.5 px-3 py-2",
        muted ? "bg-paper text-ink" : tone === "match" ? "bg-ink text-paper" : "bg-pink text-ink-deep",
      )}
    >
      <span className="label-mono">{label}</span>
      <span className={cn("font-heading font-black leading-none tabular", size === "lg" ? "text-7xl" : "text-4xl")}>
        {Math.round(score)}
      </span>
      {note && <span className="label-mono opacity-80">{note}</span>}
    </div>
  );
}
