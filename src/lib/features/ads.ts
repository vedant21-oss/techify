/*
 * Sponsored slots. Ads are entered by hand in the admin dashboard and always shown
 * labelled. They live entirely outside the scoring engine: nothing here is read
 * when ranking, so paying for an ad can't move a device up a list.
 */

export const AD_PLACEMENTS = ["home", "results", "device"] as const;
export type AdPlacement = (typeof AD_PLACEMENTS)[number];

/** Finder results show the ad after this many devices, so the top picks come first. */
export const RESULTS_AD_AFTER = 3;

/** What the browser gets: the click goes through Techify so it can be counted. */
export interface AdDTO {
  id: string;
  advertiser: string;
  headline: string;
  body: string;
  cta: string;
  /** `/api/ads/<id>/click`, which counts the click and redirects. */
  href: string;
  /** True when the destination is another site. */
  external: boolean;
  /** A catalogue device the ad promotes, with today's price. */
  device: { slug: string; name: string; price: number } | null;
}

export interface Schedulable {
  active: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
}

export function isAdLive(ad: Schedulable, now: Date): boolean {
  const t = now.getTime();
  return ad.active && (ad.startsAt === null || ad.startsAt.getTime() <= t) && (ad.endsAt === null || ad.endsAt.getTime() > t);
}

/**
 * One ad, chosen with probability proportional to its weight. `random` is in [0, 1)
 * and is a parameter so the choice can be tested.
 */
export function pickWeighted<T extends { weight: number }>(ads: T[], random: number): T | null {
  const eligible = ads.filter((a) => a.weight > 0);
  const total = eligible.reduce((sum, a) => sum + a.weight, 0);
  if (total === 0) return null;
  let point = random * total;
  for (const ad of eligible) {
    point -= ad.weight;
    if (point < 0) return ad;
  }
  return eligible[eligible.length - 1];
}

/**
 * Where an ad may send people: an https:// address or a path on this site. Anything
 * else (javascript:, data:, protocol-relative //host) is refused, so a mistyped or
 * malicious URL can't turn the click redirect into an open door.
 */
export function safeAdUrl(raw: string): string | null {
  const url = raw.trim();
  if (url.startsWith("/") && !url.startsWith("//") && !url.includes("\\")) return url;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname.includes(".") ? parsed.toString() : null;
  } catch {
    return null;
  }
}
