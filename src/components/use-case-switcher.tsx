import Link from "next/link";
import { UseCaseIcon } from "@/components/use-case-icon";
import { PROFILES, type Category, type UseCase } from "@/lib/engine";
import { cn } from "@/lib/utils";

/** Links that re-score the current view for a different use case. */
export function UseCaseSwitcher({
  category,
  active,
  hrefFor,
}: {
  category: Category;
  active: UseCase;
  hrefFor: (useCase: UseCase) => string;
}) {
  return (
    <nav aria-label="Score for a different use case" className="flex flex-wrap gap-2">
      {PROFILES[category].map((p) => {
        const isActive = p.id === active;
        return (
          <Link
            key={p.id}
            href={hrefFor(p.id)}
            scroll={false}
            aria-current={isActive ? "true" : undefined}
            className={cn(
              "inline-flex items-center gap-2 border-[3px] border-ink px-3.5 py-2 text-sm font-medium transition-colors",
              isActive ? "bg-ink text-paper" : "bg-paper hover:bg-pink-tint",
            )}
          >
            <UseCaseIcon useCase={p.id} className={cn("size-4", isActive ? "text-pink" : "text-ink")} />
            {p.label}
          </Link>
        );
      })}
    </nav>
  );
}
