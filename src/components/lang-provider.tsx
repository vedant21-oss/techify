"use client";

import { Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import { createContext, useContext, useTransition } from "react";
import { DEFAULT_LANG, LANG_COOKIE, type Lang } from "@/lib/i18n/config";
import { MESSAGES } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";

const LangContext = createContext<Lang>(DEFAULT_LANG);

export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export function useLang(): Lang {
  return useContext(LangContext);
}

export function useMessages() {
  return MESSAGES[useLang()];
}

/** Flips between English and Hindi. The choice lives in a cookie so server-rendered text follows it. */
export function LanguageToggle({ className }: { className?: string }) {
  const lang = useLang();
  const t = MESSAGES[lang];
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const next: Lang = lang === "hi" ? "en" : "hi";

  return (
    <button
      type="button"
      lang={next === "hi" ? "hi-IN" : "en-IN"}
      aria-label={t.lang.switchLabel}
      disabled={pending}
      onClick={() => {
        document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
        startTransition(() => router.refresh());
      }}
      className={cn("flex items-center gap-2 disabled:opacity-60", className)}
    >
      <Languages className="size-4" aria-hidden />
      {t.lang.switchTo}
    </button>
  );
}
