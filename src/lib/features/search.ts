export interface Searchable {
  brand: string;
  name: string;
  variant: string;
  cpuName: string;
  gpuName: string | null;
  price: number;
}

const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9+]+/g, " ")
    .trim();

/**
 * Every word in the query must appear somewhere in the device's brand, name,
 * variant or chips. "s26 ultra", "rtx 5060" and "oneplus 256gb" all work.
 */
export function matchesQuery(device: Searchable, query: string): boolean {
  const words = normalize(query).split(" ").filter(Boolean);
  if (words.length === 0) return false;
  const haystack = normalize(
    [device.brand, device.name, device.variant, device.cpuName, device.gpuName ?? ""].join(" "),
  ).replace(/(\d+) (gb|tb)\b/g, "$1$2");
  return words.every((w) => haystack.includes(w));
}

/** Name matches rank above chip or variant matches; ties go to the cheaper device. */
export function searchDevices<T extends Searchable>(devices: T[], query: string): T[] {
  const q = normalize(query);
  const title = (d: T) => normalize(`${d.brand} ${d.name}`);
  return devices
    .filter((d) => matchesQuery(d, query))
    .sort((a, b) => {
      const aTitle = title(a).includes(q) ? 0 : 1;
      const bTitle = title(b).includes(q) ? 0 : 1;
      return aTitle - bTitle || a.price - b.price;
    });
}
