/*
 * Performance tiers on a 0–100 scale, looked up by chip name so that adding a device
 * only needs its spec sheet. 100 is the fastest silicon on sale in India in
 * September 2026 for that kind of device; placement follows public multi-core CPU
 * and 3D GPU benchmark standings. Keys must match the names used in the seed files
 * exactly; an unknown chip fails the seed (and the tests) rather than guessing.
 */

/** Phone chipsets. 100 = Apple A20 Pro. */
export const PHONE_CHIPS: Record<string, number> = {
  "Unisoc T612": 8,
  "MediaTek Helio G81 Ultra": 9,
  "Unisoc T7250": 10,
  "MediaTek Helio G99": 14,
  "Snapdragon 4s Gen 2": 16,
  "MediaTek Dimensity 6080": 17,
  "MediaTek Dimensity 6100+": 17,
  "MediaTek Dimensity 6300": 18,
  "Snapdragon 4 Gen 2": 18,
  "Snapdragon 6s Gen 3": 20,
  "MediaTek Dimensity 7025 Ultra": 30,
  "Snapdragon 6 Gen 3": 32,
  "Snapdragon 7s Gen 2": 34,
  "MediaTek Dimensity 7300": 36,
  "MediaTek Dimensity 7300 Pro": 36,
  "MediaTek Dimensity 7300 Ultra": 36,
  "MediaTek Dimensity 7300 Ultimate": 36,
  "MediaTek Dimensity 7300X": 36,
  "Snapdragon 6 Gen 4": 38,
  "Samsung Exynos 1380": 30,
  "Samsung Exynos 1480": 38,
  "Snapdragon 7s Gen 3": 40,
  "MediaTek Dimensity 7400": 42,
  "MediaTek Dimensity 7400 Ultra": 42,
  "Snapdragon 7s Gen 4": 46,
  "Snapdragon 7 Gen 4": 52,
  "Google Tensor G4": 56,
  "MediaTek Dimensity 8350": 58,
  "Samsung Exynos 2400e": 62,
  "MediaTek Dimensity 8400 Ultra": 64,
  "Google Tensor G5": 64,
  "Snapdragon 8s Gen 3": 66,
  "MediaTek Dimensity 8450": 66,
  "Samsung Exynos 2400": 70,
  "Snapdragon 8s Gen 4": 74,
  "Snapdragon 8 Gen 3": 76,
  "MediaTek Dimensity 9400e": 78,
  "Apple A18": 82,
  "MediaTek Dimensity 9400+": 86,
  "Snapdragon 8 Elite": 88,
  "Samsung Exynos 2600": 88,
  "MediaTek Dimensity 9500s": 88,
  "Apple A19": 90,
  "Snapdragon 8 Gen 5": 90,
  "MediaTek Dimensity 9500": 95,
  "Apple A19 Pro": 96,
  "Snapdragon 8 Elite Gen 5": 98,
  "Apple A20 Pro": 100,
};

/** Laptop processors. 100 = Intel Core Ultra 9 275HX. */
export const LAPTOP_CPUS: Record<string, number> = {
  "AMD Ryzen 3 7320U": 18,
  "Intel Core i3-1215U": 20,
  "Intel Core i3-1305U": 20,
  "Intel Core i3-1315U": 22,
  "Intel Core 3 100U": 22,
  "AMD Ryzen 5 7520U": 24,
  "AMD Ryzen 5 5500U": 30,
  "AMD Ryzen 5 7430U": 32,
  "Intel Core i5-1334U": 34,
  "Apple A18 Pro": 40,
  "Qualcomm Snapdragon X X1-26-100": 42,
  "Intel Core Ultra 5 226V": 42,
  "Intel Core Ultra 5 225U": 44,
  "AMD Ryzen AI 5 340": 44,
  "Intel Core i5-13420H": 44,
  "Intel Core Ultra 5 125H": 46,
  "AMD Ryzen AI 5 430": 48,
  "Intel Core Ultra 7 256V": 48,
  "Intel Core Ultra 7 258V": 50,
  "Intel Core i5-13450HX": 52,
  "Intel Core i7-13700H": 58,
  "Qualcomm Snapdragon X Elite": 58,
  "AMD Ryzen 7 260": 60,
  "Apple M5": 70,
  "Intel Core i7-14650HX": 74,
  "AMD Ryzen 9 8940HX": 84,
  "Intel Core Ultra 7 255HX": 88,
};

/** Laptop graphics, integrated and dedicated. 100 = NVIDIA GeForce RTX 5090 Laptop. */
export const LAPTOP_GPUS: Record<string, number> = {
  "Intel UHD Graphics": 4,
  "AMD Radeon 610M": 6,
  "AMD Radeon (Ryzen 5000U)": 10,
  "AMD Radeon (Ryzen 7030U)": 10,
  "Intel Iris Xe Graphics": 12,
  "Intel Graphics (Core Ultra U)": 16,
  "Apple A18 Pro 5-core GPU": 18,
  "Qualcomm Adreno X1-45": 20,
  "Intel Arc Graphics (Core Ultra H)": 24,
  "AMD Radeon 840M": 24,
  "Qualcomm Adreno X1-85": 24,
  "Intel Arc 130V": 26,
  "Intel Arc 140V": 30,
  "Apple M5 8-core GPU": 28,
  "NVIDIA GeForce RTX 4050": 38,
  "Apple M5 10-core GPU": 32,
  "NVIDIA GeForce RTX 5050": 42,
  "NVIDIA GeForce RTX 4060": 46,
  "NVIDIA GeForce RTX 5060": 52,
};

export function lookupTier(table: Record<string, number>, name: string, kind: string): number {
  const tier = table[name];
  if (tier === undefined) {
    throw new Error(`No ${kind} tier for "${name}". Add it to src/data/tiers.ts.`);
  }
  return tier;
}
