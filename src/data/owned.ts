import type { Category } from "@/lib/engine";
import type { CatalogRecord } from "./catalog";
import { describeDisplay, laptopDisplayScore, phoneDisplayScore } from "./display-score";
import { LAPTOP_CPUS, LAPTOP_GPUS, lookupTier, PHONE_CHIPS } from "./tiers";
import type { DisplaySpec, LaptopPanel, PhonePanel } from "./types";

/*
 * Devices people own and upgrade from: popular in India from 2018 to 2024, mostly no
 * longer on sale. They are only used by the upgrade checker, as the "what I have now"
 * side, so they never appear in the finder, lists or search. Specs are the launch
 * spec sheets for the base variant. Chargers and battery sizes that the maker
 * doesn't publish are null, scored as typical like everywhere else.
 */

/** A device the upgrade checker can start from. No price: nobody is buying it. */
export type OwnedRecord = Omit<CatalogRecord, "price" | "priceCheckedOn" | "priceSource" | "searchQuery">;

const pd = (sizeIn: number, panel: PhonePanel, width: number, height: number, refreshHz: number): DisplaySpec<PhonePanel> => ({
  sizeIn,
  panel,
  width,
  height,
  refreshHz,
});

const ld = (sizeIn: number, panel: LaptopPanel, width: number, height: number, refreshHz = 60): DisplaySpec<LaptopPanel> => ({
  sizeIn,
  panel,
  width,
  height,
  refreshHz,
});

type PhoneRow = [
  slug: string,
  brand: string,
  name: string,
  variant: string,
  releaseYear: number,
  chip: string,
  display: DisplaySpec<PhonePanel>,
  camera: [name: string, score: number],
  ram: number,
  storage: number,
  battery: number | null,
  charging: number | null,
  weight: number | null,
];

// Camera scores use the same curated scale as src/data/phones.ts.
const phoneRows: PhoneRow[] = [
  ["owned-apple-iphone-xr", "Apple", "iPhone XR", "3GB · 64GB", 2018, "Apple A12 Bionic", pd(6.1, "LCD", 828, 1792, 60), ["12MP main", 40], 3, 64, 2942, null, 194],
  ["owned-apple-iphone-11", "Apple", "iPhone 11", "4GB · 64GB", 2019, "Apple A13 Bionic", pd(6.1, "LCD", 828, 1792, 60), ["12MP main + 12MP ultrawide", 50], 4, 64, 3110, null, 194],
  ["owned-apple-iphone-12", "Apple", "iPhone 12", "4GB · 64GB", 2020, "Apple A14 Bionic", pd(6.1, "OLED", 1170, 2532, 60), ["12MP main + 12MP ultrawide", 54], 4, 64, 2815, null, 164],
  ["owned-apple-iphone-se-2022", "Apple", "iPhone SE (2022)", "4GB · 64GB", 2022, "Apple A15 Bionic", pd(4.7, "LCD", 750, 1334, 60), ["12MP main", 46], 4, 64, 2018, null, 144],
  ["owned-apple-iphone-13", "Apple", "iPhone 13", "4GB · 128GB", 2021, "Apple A15 Bionic", pd(6.1, "OLED", 1170, 2532, 60), ["12MP sensor-shift main + 12MP ultrawide", 60], 4, 128, 3240, null, 174],
  ["owned-apple-iphone-13-pro", "Apple", "iPhone 13 Pro", "6GB · 128GB", 2021, "Apple A15 Bionic", pd(6.1, "LTPO OLED", 1170, 2532, 120), ["12MP + 12MP 3x telephoto + 12MP ultrawide", 72], 6, 128, 3095, null, 203],
  ["owned-apple-iphone-14", "Apple", "iPhone 14", "6GB · 128GB", 2022, "Apple A15 Bionic", pd(6.1, "OLED", 1170, 2532, 60), ["12MP main + 12MP ultrawide", 62], 6, 128, 3279, null, 172],
  ["owned-apple-iphone-14-pro", "Apple", "iPhone 14 Pro", "6GB · 128GB", 2022, "Apple A16 Bionic", pd(6.1, "LTPO OLED", 1179, 2556, 120), ["48MP + 12MP 3x telephoto + 12MP ultrawide", 78], 6, 128, 3200, null, 206],
  ["owned-apple-iphone-15", "Apple", "iPhone 15", "6GB · 128GB", 2023, "Apple A16 Bionic", pd(6.1, "OLED", 1179, 2556, 60), ["48MP main + 12MP ultrawide", 70], 6, 128, 3349, null, 171],
  ["owned-apple-iphone-15-pro", "Apple", "iPhone 15 Pro", "8GB · 128GB", 2023, "Apple A17 Pro", pd(6.1, "LTPO OLED", 1179, 2556, 120), ["48MP + 12MP 3x telephoto + 12MP ultrawide", 82], 8, 128, 3274, null, 187],
  ["owned-samsung-galaxy-m31", "Samsung", "Galaxy M31", "6GB · 128GB", 2020, "Samsung Exynos 9611", pd(6.4, "OLED", 1080, 2340, 60), ["64MP main", 24], 6, 128, 6000, 15, 191],
  ["owned-samsung-galaxy-a52", "Samsung", "Galaxy A52", "6GB · 128GB", 2021, "Snapdragon 720G", pd(6.5, "OLED", 1080, 2400, 90), ["64MP OIS main", 34], 6, 128, 4500, 25, 189],
  ["owned-samsung-galaxy-a54-5g", "Samsung", "Galaxy A54 5G", "8GB · 256GB", 2023, "Samsung Exynos 1380", pd(6.4, "OLED", 1080, 2340, 120), ["50MP OIS main", 42], 8, 256, 5000, 25, 202],
  ["owned-samsung-galaxy-s22", "Samsung", "Galaxy S22", "8GB · 128GB", 2022, "Snapdragon 8 Gen 1", pd(6.1, "OLED", 1080, 2340, 120), ["50MP + 10MP 3x telephoto + 12MP ultrawide", 62], 8, 128, 3700, 25, 167],
  ["owned-samsung-galaxy-s23", "Samsung", "Galaxy S23", "8GB · 128GB", 2023, "Snapdragon 8 Gen 2", pd(6.1, "OLED", 1080, 2340, 120), ["50MP + 10MP 3x telephoto + 12MP ultrawide", 66], 8, 128, 3900, 25, 168],
  ["owned-samsung-galaxy-s23-fe", "Samsung", "Galaxy S23 FE", "8GB · 128GB", 2023, "Samsung Exynos 2200", pd(6.4, "OLED", 1080, 2340, 120), ["50MP + 8MP 3x telephoto + 12MP ultrawide", 58], 8, 128, 4500, 25, 209],
  ["owned-redmi-note-9-pro", "Xiaomi", "Redmi Note 9 Pro", "4GB · 64GB", 2020, "Snapdragon 720G", pd(6.67, "LCD", 1080, 2400, 60), ["48MP main", 22], 4, 64, 5020, 18, 209],
  ["owned-redmi-note-10-pro", "Xiaomi", "Redmi Note 10 Pro", "6GB · 128GB", 2021, "Snapdragon 732G", pd(6.67, "OLED", 1080, 2400, 120), ["108MP main", 30], 6, 128, 5020, 33, 193],
  ["owned-redmi-note-11", "Xiaomi", "Redmi Note 11", "4GB · 64GB", 2022, "Snapdragon 680", pd(6.43, "OLED", 1080, 2400, 90), ["50MP main", 22], 4, 64, 5000, 33, 179],
  ["owned-redmi-note-12-pro-5g", "Xiaomi", "Redmi Note 12 Pro 5G", "6GB · 128GB", 2023, "MediaTek Dimensity 1080", pd(6.67, "OLED", 1080, 2400, 120), ["50MP Sony IMX766 OIS main", 38], 6, 128, 5000, 67, 187],
  ["owned-redmi-note-13-pro-5g", "Xiaomi", "Redmi Note 13 Pro 5G", "8GB · 128GB", 2024, "Snapdragon 7s Gen 2", pd(6.67, "OLED", 1220, 2712, 120), ["200MP OIS main", 42], 8, 128, 5100, 67, 187],
  ["owned-poco-x3-pro", "POCO", "X3 Pro", "6GB · 128GB", 2021, "Snapdragon 860", pd(6.67, "LCD", 1080, 2400, 120), ["48MP main", 22], 6, 128, 5160, 33, 215],
  ["owned-realme-8", "realme", "8", "4GB · 128GB", 2021, "MediaTek Helio G95", pd(6.4, "OLED", 1080, 2400, 60), ["64MP main", 22], 4, 128, 5000, 30, 177],
  ["owned-oneplus-9r", "OnePlus", "9R", "8GB · 128GB", 2021, "Snapdragon 870", pd(6.55, "OLED", 1080, 2400, 120), ["48MP OIS main + 16MP ultrawide", 40], 8, 128, 4500, 65, 189],
  ["owned-oneplus-nord-ce-2", "OnePlus", "Nord CE 2 5G", "6GB · 128GB", 2022, "MediaTek Dimensity 900", pd(6.43, "OLED", 1080, 2400, 90), ["64MP main", 26], 6, 128, 4500, 65, 173],
  ["owned-oneplus-nord-ce-3-lite", "OnePlus", "Nord CE 3 Lite 5G", "8GB · 128GB", 2023, "Snapdragon 695", pd(6.72, "LCD", 1080, 2400, 120), ["108MP main", 24], 8, 128, 5000, 67, 195],
  ["owned-oneplus-11r", "OnePlus", "11R", "8GB · 128GB", 2023, "Snapdragon 8+ Gen 1", pd(6.74, "OLED", 1240, 2772, 120), ["50MP OIS main + 8MP ultrawide", 46], 8, 128, 5000, 100, 204],
  ["owned-oneplus-11", "OnePlus", "11", "8GB · 128GB", 2023, "Snapdragon 8 Gen 2", pd(6.7, "LTPO OLED", 1440, 3216, 120), ["50MP + 32MP 2x telephoto + 48MP ultrawide (Hasselblad)", 68], 8, 128, 5000, 100, 205],
  ["owned-google-pixel-6a", "Google", "Pixel 6a", "6GB · 128GB", 2022, "Google Tensor", pd(6.1, "OLED", 1080, 2400, 60), ["12MP main + 12MP ultrawide", 58], 6, 128, 4410, 18, 178],
  ["owned-google-pixel-7", "Google", "Pixel 7", "8GB · 128GB", 2022, "Google Tensor G2", pd(6.3, "OLED", 1080, 2400, 90), ["50MP main + 12MP ultrawide", 68], 8, 128, 4355, 21, 197],
  ["owned-google-pixel-7a", "Google", "Pixel 7a", "8GB · 128GB", 2023, "Google Tensor G2", pd(6.1, "OLED", 1080, 2400, 90), ["64MP main + 13MP ultrawide", 64], 8, 128, 4385, 18, 193],
  ["owned-nothing-phone-1", "Nothing", "Phone (1)", "8GB · 128GB", 2022, "Snapdragon 778G+", pd(6.55, "OLED", 1080, 2400, 120), ["50MP main + 50MP ultrawide", 40], 8, 128, 4500, 33, 193],
  ["owned-nothing-phone-2", "Nothing", "Phone (2)", "8GB · 128GB", 2023, "Snapdragon 8+ Gen 1", pd(6.7, "LTPO OLED", 1080, 2412, 120), ["50MP main + 50MP ultrawide", 50], 8, 128, 4700, 45, 201],
];

type LaptopRow = [
  slug: string,
  brand: string,
  name: string,
  variant: string,
  releaseYear: number,
  cpu: string,
  gpu: string,
  display: DisplaySpec<LaptopPanel>,
  ram: number,
  storage: number,
  batteryWh: number | null,
  weight: number | null,
];

const laptopRows: LaptopRow[] = [
  ["owned-apple-macbook-air-m1", "Apple", "MacBook Air 13 (M1)", "M1 · 8GB · 256GB", 2020, "Apple M1", "Apple M1 7-core GPU", ld(13.3, "Retina", 2560, 1600), 8, 256, 50, 1290],
  ["owned-apple-macbook-air-m2", "Apple", "MacBook Air 13 (M2)", "M2 · 8GB · 256GB", 2022, "Apple M2", "Apple M2 8-core GPU", ld(13.6, "Liquid Retina", 2560, 1664), 8, 256, 53, 1240],
  ["owned-apple-macbook-air-m3", "Apple", "MacBook Air 13 (M3)", "M3 · 8GB · 256GB", 2024, "Apple M3", "Apple M3 8-core GPU", ld(13.6, "Liquid Retina", 2560, 1664), 8, 256, 53, 1240],
  ["owned-dell-inspiron-15-3511", "Dell", "Inspiron 15 3511", "Core i3-1115G4 · 8GB · 256GB", 2021, "Intel Core i3-1115G4", "Intel UHD Graphics", ld(15.6, "LCD", 1920, 1080), 8, 256, 41, 1800],
  ["owned-dell-inspiron-14-i5-1235u", "Dell", "Inspiron 14", "Core i5-1235U · 8GB · 512GB", 2022, "Intel Core i5-1235U", "Intel Iris Xe Graphics", ld(14, "LCD", 1920, 1200), 8, 512, 54, 1540],
  ["owned-hp-15s-r3-5300u", "HP", "15s", "Ryzen 3 5300U · 8GB · 512GB", 2021, "AMD Ryzen 3 5300U", "AMD Radeon (Ryzen 5000U)", ld(15.6, "LCD", 1920, 1080), 8, 512, 41, 1690],
  ["owned-hp-pavilion-15-i5-1135g7", "HP", "Pavilion 15", "Core i5-1135G7 · 8GB · 512GB", 2021, "Intel Core i5-1135G7", "Intel Iris Xe Graphics", ld(15.6, "LCD", 1920, 1080), 8, 512, 41, 1750],
  ["owned-lenovo-ideapad-slim-3-r5-5500u", "Lenovo", "IdeaPad Slim 3", "Ryzen 5 5500U · 8GB · 512GB", 2021, "AMD Ryzen 5 5500U", "AMD Radeon (Ryzen 5000U)", ld(15.6, "LCD", 1920, 1080), 8, 512, 38, 1650],
  ["owned-asus-tuf-f15-i5-10300h", "ASUS", "TUF Gaming F15", "Core i5-10300H · GTX 1650 · 8GB · 512GB", 2020, "Intel Core i5-10300H", "NVIDIA GeForce GTX 1650", ld(15.6, "LCD", 1920, 1080, 144), 8, 512, 48, 2300],
  ["owned-asus-tuf-a15-r7-4800h", "ASUS", "TUF Gaming A15", "Ryzen 7 4800H · GTX 1660 Ti · 8GB · 512GB", 2020, "AMD Ryzen 7 4800H", "NVIDIA GeForce GTX 1660 Ti", ld(15.6, "LCD", 1920, 1080, 144), 8, 512, null, 2300],
  ["owned-lenovo-ideapad-gaming-3-r5-5600h", "Lenovo", "IdeaPad Gaming 3", "Ryzen 5 5600H · GTX 1650 · 8GB · 512GB", 2021, "AMD Ryzen 5 5600H", "NVIDIA GeForce GTX 1650", ld(15.6, "LCD", 1920, 1080, 120), 8, 512, 45, 2250],
  ["owned-hp-victus-16-r5-5600h", "HP", "Victus 16", "Ryzen 5 5600H · RTX 3050 · 8GB · 512GB", 2021, "AMD Ryzen 5 5600H", "NVIDIA GeForce RTX 3050", ld(16.1, "LCD", 1920, 1080, 144), 8, 512, 70, 2460],
  ["owned-acer-nitro-5-i5-11400h", "Acer", "Nitro 5", "Core i5-11400H · RTX 3050 · 8GB · 512GB", 2021, "Intel Core i5-11400H", "NVIDIA GeForce RTX 3050", ld(15.6, "LCD", 1920, 1080, 144), 8, 512, 57, 2200],
];

export function buildOwned(): OwnedRecord[] {
  const phones = phoneRows.map(
    ([slug, brand, name, variant, releaseYear, cpuName, display, [cameraName, cameraScore], ramGb, storageGb, batteryCapacity, chargingWatts, weightGrams]): OwnedRecord => ({
      slug,
      category: "phone",
      brand,
      name,
      variant,
      releaseYear,
      cpuName,
      gpuName: null,
      displayName: describeDisplay(display, true),
      cameraName,
      cpuScore: lookupTier(PHONE_CHIPS, cpuName, "phone chipset"),
      gpuScore: null,
      cameraScore,
      displayScore: phoneDisplayScore(display),
      ramGb,
      storageGb,
      batteryCapacity,
      chargingWatts,
      weightGrams,
    }),
  );
  const laptops = laptopRows.map(
    ([slug, brand, name, variant, releaseYear, cpuName, gpuName, display, ramGb, storageGb, batteryCapacity, weightGrams]): OwnedRecord => ({
      slug,
      category: "laptop",
      brand,
      name,
      variant,
      releaseYear,
      cpuName,
      gpuName,
      displayName: describeDisplay(display, false),
      cameraName: null,
      cpuScore: lookupTier(LAPTOP_CPUS, cpuName, "laptop CPU"),
      gpuScore: lookupTier(LAPTOP_GPUS, gpuName, "laptop GPU"),
      cameraScore: null,
      displayScore: laptopDisplayScore(display),
      ramGb,
      storageGb,
      batteryCapacity,
      chargingWatts: null,
      weightGrams,
    }),
  );
  return [...phones, ...laptops];
}

/** Built once at module load; it's a few dozen rows. */
export const OWNED_DEVICES: OwnedRecord[] = buildOwned();

export function findOwned(slug: string): OwnedRecord | undefined {
  return OWNED_DEVICES.find((d) => d.slug === slug);
}

export function ownedIn(category: Category): OwnedRecord[] {
  return OWNED_DEVICES.filter((d) => d.category === category);
}
