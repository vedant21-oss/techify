import "server-only";
import { prisma } from "@/lib/db";
import type { Category } from "@/lib/engine";
import { pickWeighted, safeAdUrl, type AdDTO, type AdPlacement } from "@/lib/features/ads";

const DB_PLACEMENT = { home: "HOME", results: "RESULTS", device: "DEVICE" } as const;

/**
 * One live ad for a slot, rotated by weight. `category` limits it to ads for phones
 * or laptops (or both); without it, any live ad for the slot can show. An ad for the
 * device a page is already about is skipped there (`exceptDevice`).
 */
export async function getAd(placement: AdPlacement, category?: Category, exceptDevice?: string): Promise<AdDTO | null> {
  const now = new Date();
  const rows = await prisma.ad.findMany({
    where: {
      active: true,
      placements: { has: DB_PLACEMENT[placement] },
      ...(category && { OR: [{ category: null }, { category: category === "laptop" ? "LAPTOP" : "PHONE" }] }),
      AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gt: now } }] }],
    },
    include: { device: { select: { slug: true, brand: true, name: true, price: true } } },
  });
  const ad = pickWeighted(
    rows.filter((r) => !exceptDevice || r.device?.slug !== exceptDevice),
    Math.random(),
  );
  if (!ad) return null;
  const url = safeAdUrl(ad.url);
  if (!url) return null;
  return {
    id: ad.id,
    advertiser: ad.advertiser,
    headline: ad.headline,
    body: ad.body,
    cta: ad.cta,
    href: `/api/ads/${ad.id}/click`,
    external: !url.startsWith("/"),
    device: ad.device && {
      slug: ad.device.slug,
      name: ad.device.name.toLowerCase().startsWith(ad.device.brand.toLowerCase()) ? ad.device.name : `${ad.device.brand} ${ad.device.name}`,
      price: ad.device.price,
    },
  };
}
