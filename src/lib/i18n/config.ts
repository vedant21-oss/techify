export const LANGS = ["en", "hi"] as const;
export type Lang = (typeof LANGS)[number];

export const DEFAULT_LANG: Lang = "en";
export const LANG_COOKIE = "techify_lang";

export function isLang(value: unknown): value is Lang {
  return typeof value === "string" && (LANGS as readonly string[]).includes(value);
}

/** BCP 47 tag for `<html lang>` and Intl formatters. */
export const LOCALE: Record<Lang, string> = { en: "en-IN", hi: "hi-IN" };
