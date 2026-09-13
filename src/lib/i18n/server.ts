import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { DEFAULT_LANG, isLang, LANG_COOKIE, type Lang } from "./config";
import { MESSAGES } from "./messages";

/** The visitor's language, from the cookie the language switch sets. */
export const getLang = cache(async (): Promise<Lang> => {
  const value = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(value) ? value : DEFAULT_LANG;
});

export async function getMessages() {
  return MESSAGES[await getLang()];
}
