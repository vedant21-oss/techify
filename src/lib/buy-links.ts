export interface BuyLink {
  store: "Amazon" | "Flipkart";
  url: string;
  /** True when the link carries an affiliate tag (disclosed in the UI). */
  affiliate: boolean;
}

export interface AffiliateIds {
  /** Amazon Associates tracking ID, e.g. `yourname-21`. */
  amazonTag?: string;
  /** Flipkart Affiliate ID. */
  flipkartId?: string;
}

export function affiliateIdsFromEnv(env: Record<string, string | undefined> = process.env): AffiliateIds {
  return {
    amazonTag: env.AMAZON_ASSOCIATE_TAG?.trim() || undefined,
    flipkartId: env.FLIPKART_AFFILIATE_ID?.trim() || undefined,
  };
}

export function hasAffiliates(ids: AffiliateIds = affiliateIdsFromEnv()): boolean {
  return Boolean(ids.amazonTag || ids.flipkartId);
}

/** Marketplace search links for the exact model, tagged when affiliate IDs are configured. */
export function buyLinks(
  device: { brand: string; name: string; searchQuery: string | null },
  ids: AffiliateIds = affiliateIdsFromEnv(),
): BuyLink[] {
  const query = device.searchQuery ?? searchText(device.brand, device.name);
  const q = encodeURIComponent(query);
  const amazon = new URL(`https://www.amazon.in/s?k=${q}`);
  if (ids.amazonTag) amazon.searchParams.set("tag", ids.amazonTag);
  const flipkart = new URL(`https://www.flipkart.com/search?q=${q}`);
  if (ids.flipkartId) flipkart.searchParams.set("affid", ids.flipkartId);
  return [
    { store: "Amazon", url: amazon.toString(), affiliate: Boolean(ids.amazonTag) },
    { store: "Flipkart", url: flipkart.toString(), affiliate: Boolean(ids.flipkartId) },
  ];
}

function searchText(brand: string, name: string): string {
  // Avoid "Apple Apple …" or "Xiaomi Redmi …" style duplication when the name already carries a brand.
  return name.toLowerCase().includes(brand.toLowerCase()) ? name : `${brand} ${name}`;
}
