import Link from "next/link";
import { UseCaseIcon } from "@/components/use-case-icon";
import { PROFILES, type Category, type UseCase } from "@/lib/engine";
import type { Lang } from "@/lib/i18n/config";
import { profileText } from "@/lib/i18n/engine-hi";
import { MESSAGES } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";

/** Links that re-score the current view for a different use case. */
export function UseCaseSwitcher({
  category,
  active,
  hrefFor,
  lang = "en",
}: {
  category: Category;
  active: UseCase;
  hrefFor: (useCase: UseCase) => string;
  lang?: Lang;
}) {
  const t = MESSAGES[lang];
  return (
    <nav aria-label={t.device.switchUseCase} className="flex flex-wrap gap-2">
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
            {profileText(lang, p).label}
          </Link>
        );
      })}
    </nav>
  );
}
