import { cn } from "@/lib/utils";

/**
 * Loading shapes for the route-level `loading.tsx` fallbacks.
 *
 * Each one stands where its real content will, at roughly its real size, so the page
 * doesn't jump when the content swaps in. They're plain server components with no
 * state: a fallback that needed hydrating would defeat the point.
 *
 * Nothing here is announced. The page's own `aria-busy` region does that once, which
 * is kinder than a screen reader reading out a grid of placeholder boxes.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skel", className)} aria-hidden />;
}

/** Wraps rows so each sweeps in a beat after the one above it. */
export function SkeletonStack({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("skel-stagger", className)}>
      {Array.isArray(children)
        ? children.map((child, i) => (
            <div key={i} style={{ "--i": i } as React.CSSProperties}>
              {child}
            </div>
          ))
        : children}
    </div>
  );
}

/** Stands in for `PageHero`: plate headline on the left, a lede on the right. */
export function SkeletonHero({ lines = 2, size = "md" }: { lines?: number; size?: "md" | "sm" }) {
  const height = size === "sm" ? "h-[clamp(2.5rem,7vw,4.75rem)]" : "h-[clamp(4rem,15vw,9.5rem)]";
  return (
    <section className="bg-columns border-b-[3px] border-ink">
      <div className="mx-auto grid max-w-6xl items-end gap-8 px-(--gutter) pt-10 pb-12 lg:grid-cols-[1fr_24rem]">
        <div className="flex flex-col gap-2">
          {Array.from({ length: lines }, (_, i) => (
            // Each plate line a different width, the way a real headline sets.
            <Skeleton key={i} className={cn(height, i % 2 === 0 ? "w-full" : "w-4/5")} />
          ))}
        </div>
        <div className="flex flex-col gap-2 lg:pb-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-3/5" />
        </div>
      </div>
    </section>
  );
}

/** Stands in for one `DeviceRow`: name, price, two score boxes, a footer bar. */
export function SkeletonDeviceRow() {
  return (
    <div className="flex flex-col border-[3px] border-ink bg-paper">
      <div className="flex flex-1 flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <Skeleton className="h-8 w-3/5" />
          <Skeleton className="mt-3 h-3 w-24" />
          <Skeleton className="mt-3 h-6 w-28" />
        </div>
        <div className="flex shrink-0 gap-2">
          <Skeleton className="size-16" />
          <Skeleton className="size-16" />
        </div>
      </div>
      <div className="border-t-[3px] border-ink px-5 py-3.5">
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}

/** A column of device rows, for results, brand pages, best lists and deals. */
export function SkeletonDeviceList({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <SkeletonStack className={cn("grid gap-5", className)}>
      {Array.from({ length: rows }, (_, i) => (
        <SkeletonDeviceRow key={i} />
      ))}
    </SkeletonStack>
  );
}

/** A bordered card with a heading and a few lines, for grids of links. */
export function SkeletonCard({ lines = 2, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("flex h-full flex-col border-[3px] border-ink bg-paper", className)}>
      <div className="flex flex-1 flex-col gap-3 p-6">
        <Skeleton className="h-9 w-2/3" />
        {Array.from({ length: lines }, (_, i) => (
          <Skeleton key={i} className={cn("h-3.5", i === lines - 1 ? "w-1/2" : "w-full")} />
        ))}
      </div>
      <div className="border-t-[3px] border-ink px-6 py-3.5">
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

/** A grid of cards, for the best-list and brand hubs. */
export function SkeletonCardGrid({ cards = 6, cols = 3 }: { cards?: number; cols?: 2 | 3 }) {
  return (
    <SkeletonStack className={cn("grid gap-6 sm:grid-cols-2", cols === 3 && "lg:grid-cols-3")}>
      {Array.from({ length: cards }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </SkeletonStack>
  );
}

/** The finder's sidebar of controls, beside its results. */
export function SkeletonControls() {
  return (
    <div className="flex flex-col gap-5 border-[3px] border-ink bg-paper p-5">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-4 w-16" />
      <div className="flex flex-col gap-2.5">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    </div>
  );
}

/**
 * The frame every fallback sits in. `aria-busy` with one polite label is all a screen
 * reader needs; `label` should say what is coming, not that something is loading.
 */
export function SkeletonPage({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div aria-busy="true" aria-live="polite" aria-label={label}>
      {children}
    </div>
  );
}
