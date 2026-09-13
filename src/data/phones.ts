import type { DisplaySpec, PhonePanel, SeedPhone } from "./types";

/*
 * Phones on sale in India, prices and specs checked on 13 Sep 2026. Prices are for the
 * listed variant and move daily. Charging and weight are null where the listing
 * didn't publish them (the engine scores those as typical).
 */
export const PHONES_CHECKED_ON = "2026-09-13";

const d = (sizeIn: number, panel: PhonePanel, width: number, height: number, refreshHz: number): DisplaySpec<PhonePanel> => ({
  sizeIn,
  panel,
  width,
  height,
  refreshHz,
});

type Row = [
  slug: string,
  brand: string,
  name: string,
  variant: string,
  price: number,
  releaseYear: number,
  chip: string,
  display: DisplaySpec<PhonePanel>,
  camera: [name: string, score: number],
  ram: number,
  storage: number,
  battery: number | null,
  charging: number | null,
  weight: number | null,
  source?: string,
];

// Compact rows keep ~80 devices reviewable at a glance.
const rows: Row[] = [
  // ---- Under ₹15k ----------------------------------------------------------------------
  ["realme-c61-6-128", "realme", "C61", "6GB · 128GB", 7149, 2024, "Unisoc T612", d(6.78, "LCD", 720, 1600, 90), ["32MP main", 12], 6, 128, 5000, null, null],
  ["poco-c71-4-64", "POCO", "C71", "4GB · 64GB", 8999, 2025, "Unisoc T7250", d(6.88, "LCD", 720, 1640, 120), ["32MP main", 14], 4, 64, 5200, 15, null],
  ["redmi-14c-5g-4-128", "Xiaomi", "Redmi 14C 5G", "4GB · 128GB", 9298, 2025, "Snapdragon 4 Gen 2", d(6.88, "LCD", 720, 1640, 120), ["50MP main", 20], 4, 128, 5160, null, null],
  ["moto-g06-power-4-64", "Motorola", "Moto G06 Power", "4GB · 64GB", 9999, 2025, "MediaTek Helio G81 Ultra", d(6.88, "LCD", 720, 1640, 120), ["50MP main", 18], 4, 64, 7000, null, null],
  ["moto-g45-5g-4-128", "Motorola", "Moto G45 5G", "4GB · 128GB", 10999, 2024, "Snapdragon 6s Gen 3", d(6.5, "LCD", 720, 1600, 120), ["50MP main", 22], 4, 128, 5000, null, null],
  ["realme-narzo-n65-5g-8-128", "realme", "Narzo N65 5G", "8GB · 128GB", 10999, 2024, "MediaTek Dimensity 6300", d(6.67, "LCD", 720, 1604, 120), ["50MP main", 20], 8, 128, 5000, null, null],
  ["redmi-a4-5g-4-64", "Xiaomi", "Redmi A4 5G", "4GB · 64GB", 11936, 2024, "Snapdragon 4s Gen 2", d(6.88, "LCD", 720, 1640, 120), ["50MP main", 18], 4, 64, 5160, null, null],
  ["samsung-galaxy-m07-4-64", "Samsung", "Galaxy M07", "4GB · 64GB", 11999, 2025, "MediaTek Helio G99", d(6.7, "LCD", 720, 1600, 90), ["50MP main", 20], 4, 64, 5000, 25, null],
  ["tecno-pova-6-neo-5g-6-128", "Tecno", "Pova 6 Neo 5G", "6GB · 128GB", 11999, 2024, "MediaTek Dimensity 6300", d(6.67, "LCD", 720, 1600, 120), ["108MP main", 22], 6, 128, 5000, null, null],
  ["infinix-note-50x-5g-6-128", "Infinix", "Note 50X 5G", "6GB · 128GB", 13499, 2025, "MediaTek Dimensity 7300 Ultimate", d(6.67, "LCD", 720, 1600, 120), ["50MP main", 24], 6, 128, 5500, null, null],
  ["poco-m7-5g-8-128", "POCO", "M7 5G", "8GB · 128GB", 13499, 2025, "Snapdragon 4 Gen 2", d(6.88, "LCD", 720, 1640, 120), ["50MP main", 20], 8, 128, 5160, null, null],

  // ---- ₹15k–₹25k ------------------------------------------------------------------------
  ["poco-x6-neo-8-128", "POCO", "X6 Neo", "8GB · 128GB", 15999, 2024, "MediaTek Dimensity 6080", d(6.67, "OLED", 1080, 2400, 120), ["108MP main", 30], 8, 128, 5000, null, null],
  ["poco-m7-pro-5g-8-256", "POCO", "M7 Pro 5G", "8GB · 256GB", 16999, 2024, "MediaTek Dimensity 7025 Ultra", d(6.67, "OLED", 1080, 2400, 120), ["50MP main", 34], 8, 256, 5110, null, null],
  ["vivo-t4x-5g-6-128", "vivo", "T4x 5G", "6GB · 128GB", 16999, 2025, "MediaTek Dimensity 7300", d(6.72, "LCD", 1080, 2408, 120), ["50MP main", 26], 6, 128, 6500, null, null],
  ["iqoo-z10x-6-128", "iQOO", "Z10x", "6GB · 128GB", 16999, 2025, "MediaTek Dimensity 7300", d(6.72, "LCD", 1080, 2408, 120), ["50MP main", 26], 6, 128, 6500, null, null],
  ["poco-x7-5g-8-128", "POCO", "X7 5G", "8GB · 128GB", 17999, 2025, "MediaTek Dimensity 7300 Ultra", d(6.67, "OLED", 1220, 2712, 120), ["50MP main", 38], 8, 128, 5500, null, null],
  ["oppo-k14x-5g-4-128", "OPPO", "K14x 5G", "4GB · 128GB", 17999, 2026, "MediaTek Dimensity 6300", d(6.75, "LCD", 720, 1570, 120), ["50MP main", 22], 4, 128, 6500, null, null],
  ["realme-narzo-70x-5g-4-128", "realme", "Narzo 70x 5G", "4GB · 128GB", 17999, 2024, "MediaTek Dimensity 6100+", d(6.72, "LCD", 1080, 2400, 120), ["50MP main", 22], 4, 128, 5000, 45, null],
  ["cmf-phone-2-pro-8-256", "Nothing", "CMF Phone 2 Pro", "8GB · 256GB", 18999, 2025, "MediaTek Dimensity 7300 Pro", d(6.77, "OLED", 1080, 2392, 120), ["50MP main + 50MP 2x telephoto", 46], 8, 256, 5000, 33, 185],
  ["samsung-galaxy-a35-5g-8-128", "Samsung", "Galaxy A35 5G", "8GB · 128GB", 18999, 2024, "Samsung Exynos 1380", d(6.6, "OLED", 1080, 2340, 120), ["50MP OIS main + 8MP ultrawide", 42], 8, 128, 5000, 25, 209],
  ["moto-g96-5g-8-128", "Motorola", "Moto G96 5G", "8GB · 128GB", 20999, 2025, "Snapdragon 7s Gen 2", d(6.67, "OLED", 1080, 2400, 144), ["50MP Sony LYT-700C main", 40], 8, 128, 5500, 33, null],
  ["redmi-15-5g-8-256", "Xiaomi", "Redmi 15 5G", "8GB · 256GB", 22999, 2025, "Snapdragon 6s Gen 3", d(6.9, "LCD", 1080, 2340, 144), ["50MP main", 26], 8, 256, 7000, 33, 217],
  ["lava-agni-3-5g-8-128", "Lava", "Agni 3 5G", "8GB · 128GB", 22999, 2024, "MediaTek Dimensity 7300X", d(6.78, "OLED", 1200, 2652, 120), ["50MP main + 8MP 3x telephoto", 40], 8, 128, 5000, null, null],
  ["poco-x7-pro-5g-8-256", "POCO", "X7 Pro 5G", "8GB · 256GB", 23999, 2025, "MediaTek Dimensity 8400 Ultra", d(6.67, "OLED", 1220, 2712, 120), ["50MP Sony LYT-600 main", 44], 8, 256, 6550, 90, 195],
  ["vivo-t4-5g-8-128", "vivo", "T4 5G", "8GB · 128GB", 24999, 2025, "Snapdragon 7s Gen 3", d(6.77, "OLED", 1080, 2392, 120), ["50MP main", 36], 8, 128, 7300, 90, null],
  ["iqoo-z10-5g-8-128", "iQOO", "Z10 5G", "8GB · 128GB", 24999, 2025, "Snapdragon 7s Gen 3", d(6.77, "OLED", 1080, 2392, 120), ["50MP main", 34], 8, 128, 7300, 90, null],
  ["nothing-phone-3a-8-128", "Nothing", "Phone (3a)", "8GB · 128GB", 24999, 2025, "Snapdragon 7s Gen 3", d(6.77, "OLED", 1080, 2392, 120), ["50MP + 50MP 2x telephoto + 8MP ultrawide", 55], 8, 128, 5000, 50, 201],
  ["motorola-edge-60-fusion-8-256", "Motorola", "Edge 60 Fusion", "8GB · 256GB", 24999, 2025, "MediaTek Dimensity 7400", d(6.67, "OLED", 1220, 2712, 120), ["50MP Sony LYT-700C main + 13MP ultrawide", 52], 8, 256, 5500, 68, 180],
  ["oppo-k13-5g-8-256", "OPPO", "K13 5G", "8GB · 256GB", 24999, 2025, "Snapdragon 6 Gen 4", d(6.67, "OLED", 1080, 2400, 120), ["50MP main", 34], 8, 256, 7000, 80, null],
  ["realme-p4-pro-5g-8-128", "realme", "P4 Pro 5G", "8GB · 128GB", 24999, 2025, "Snapdragon 7 Gen 4", d(6.8, "OLED", 1280, 2800, 144), ["50MP main + 8MP ultrawide", 44], 8, 128, 6830, null, null],

  // ---- ₹25k–₹40k ------------------------------------------------------------------------
  ["iqoo-neo-10r-8-128", "iQOO", "Neo 10R", "8GB · 128GB", 26999, 2025, "Snapdragon 8s Gen 3", d(6.78, "OLED", 1260, 2800, 144), ["50MP Sony LYT-600 main + 8MP ultrawide", 42], 8, 128, 6400, 80, 196],
  ["motorola-edge-70-8-256", "Motorola", "Edge 70", "8GB · 256GB", 29999, 2025, "Snapdragon 7 Gen 4", d(6.7, "OLED", 1220, 2712, 120), ["50MP main", 50], 8, 256, 4800, 68, null],
  ["motorola-edge-60-pro-8-256", "Motorola", "Edge 60 Pro", "8GB · 256GB", 29999, 2025, "MediaTek Dimensity 8350", d(6.7, "OLED", 1220, 2712, 120), ["50MP main + 10MP 3x telephoto", 56], 8, 256, 6000, 90, null],
  ["poco-f6-8-256", "POCO", "F6", "8GB · 256GB", 29999, 2024, "Snapdragon 8s Gen 3", d(6.67, "OLED", 1220, 2712, 120), ["50MP Sony LYT-600 main", 45], 8, 256, 5000, 90, 179],
  ["realme-15-pro-5g-8-128", "realme", "15 Pro 5G", "8GB · 128GB", 31999, 2025, "Snapdragon 7 Gen 4", d(6.8, "OLED", 1280, 2800, 144), ["50MP main", 50], 8, 128, 7000, 80, null],
  ["redmi-note-15-5g-12-512", "Xiaomi", "Redmi Note 15 5G", "12GB · 512GB", 31999, 2026, "Snapdragon 6 Gen 3", d(6.77, "OLED", 1080, 2392, 120), ["108MP main", 38], 12, 512, 5520, null, null],
  ["motorola-edge-70-fusion-8-256", "Motorola", "Edge 70 Fusion", "8GB · 256GB", 32999, 2026, "Snapdragon 7s Gen 3", d(6.78, "OLED", 1220, 2712, 144), ["50MP main", 50], 8, 256, 7000, null, null],
  ["realme-p4-power-5g-12-256", "realme", "P4 Power 5G", "12GB · 256GB", 33999, 2026, "MediaTek Dimensity 7400 Ultra", d(6.8, "OLED", 1280, 2800, 144), ["50MP main + 8MP ultrawide", 40], 12, 256, 10001, 80, 219],
  ["oppo-k13-turbo-pro-12-256", "OPPO", "K13 Turbo Pro", "12GB · 256GB", 33999, 2025, "Snapdragon 8s Gen 4", d(6.8, "OLED", 1280, 2800, 120), ["50MP main", 40], 12, 256, 7000, 80, null],
  ["nothing-phone-3a-pro-12-256", "Nothing", "Phone (3a) Pro", "12GB · 256GB", 34999, 2025, "Snapdragon 7s Gen 3", d(6.77, "OLED", 1080, 2392, 120), ["50MP + 50MP 3x periscope + 8MP ultrawide", 62], 12, 256, 5000, 50, 211],
  ["oneplus-nord-5-12-256", "OnePlus", "Nord 5", "12GB · 256GB", 34999, 2025, "Snapdragon 8s Gen 3", d(6.83, "OLED", 1272, 2800, 144), ["50MP Sony LYT-700 main + 8MP ultrawide", 55], 12, 256, 6800, 80, 211],
  ["iqoo-neo-10-8-128", "iQOO", "Neo 10", "8GB · 128GB", 36999, 2025, "Snapdragon 8s Gen 4", d(6.78, "OLED", 1260, 2800, 144), ["50MP main + 8MP ultrawide", 44], 8, 128, 7000, 120, null],
  ["poco-f7-12-256", "POCO", "F7", "12GB · 256GB", 37999, 2025, "Snapdragon 8s Gen 4", d(6.83, "OLED", 1280, 2772, 120), ["50MP main + 8MP ultrawide", 46], 12, 256, 6500, 90, null],
  ["redmi-note-15-pro-plus-5g-8-256", "Xiaomi", "Redmi Note 15 Pro+ 5G", "8GB · 256GB", 37999, 2026, "Snapdragon 7s Gen 4", d(6.83, "OLED", 1280, 2772, 120), ["200MP main", 55], 8, 256, 6500, 100, null],
  ["oneplus-nord-6-8-128", "OnePlus", "Nord 6", "8GB · 128GB", 38999, 2026, "Snapdragon 8s Gen 4", d(6.78, "OLED", 1272, 2772, 165), ["50MP main", 56], 8, 128, 9000, 80, null],
  ["realme-16-pro-5g-8-128", "realme", "16 Pro 5G", "8GB · 128GB", 39999, 2026, "MediaTek Dimensity 7300", d(6.78, "OLED", 1272, 2772, 144), ["200MP main", 52], 8, 128, 7000, 80, null],
  ["samsung-galaxy-s24-fe-8-128", "Samsung", "Galaxy S24 FE", "8GB · 128GB", 39999, 2024, "Samsung Exynos 2400e", d(6.7, "OLED", 1080, 2340, 120), ["50MP + 8MP 3x telephoto + 12MP ultrawide", 60], 8, 128, 4700, 25, 213],
  ["google-pixel-9a-8-256", "Google", "Pixel 9a", "8GB · 256GB", 39999, 2025, "Google Tensor G4", d(6.3, "OLED", 1080, 2424, 120), ["48MP main + 13MP ultrawide", 76], 8, 256, 5100, 23, 186],

  // ---- ₹40k–₹75k ------------------------------------------------------------------------
  ["oneplus-13r-12-256", "OnePlus", "13R", "12GB · 256GB", 42999, 2025, "Snapdragon 8 Gen 3", d(6.78, "LTPO OLED", 1264, 2780, 120), ["50MP + 50MP 2x telephoto + 8MP ultrawide", 62], 12, 256, 6000, 80, 206],
  ["realme-gt-7-8-256", "realme", "GT 7", "8GB · 256GB", 44999, 2025, "MediaTek Dimensity 9400e", d(6.78, "LTPO OLED", 1264, 2780, 120), ["50MP main + 8MP ultrawide", 50], 8, 256, 7000, 120, null],
  ["vivo-v60-16-512", "vivo", "V60", "16GB · 512GB", 46001, 2025, "Snapdragon 7 Gen 4", d(6.77, "OLED", 1080, 2392, 120), ["50MP ZEISS main + 50MP periscope + 8MP ultrawide", 62], 16, 512, 6500, 90, null],
  ["nothing-phone-4a-12-256", "Nothing", "Phone (4a)", "12GB · 256GB", 47000, 2026, "Snapdragon 7s Gen 4", d(6.78, "OLED", 1224, 2720, 144), ["50MP main + telephoto", 56], 12, 256, 5400, null, null],
  ["realme-16-pro-plus-5g-12-256", "realme", "16 Pro+ 5G", "12GB · 256GB", 48999, 2026, "Snapdragon 7 Gen 4", d(6.8, "OLED", 1280, 2800, 144), ["200MP main + periscope", 58], 12, 256, 7000, 80, null],
  ["realme-gt-7-pro-12-256", "realme", "GT 7 Pro", "12GB · 256GB", 49999, 2024, "Snapdragon 8 Elite", d(6.78, "LTPO OLED", 1264, 2780, 120), ["50MP + 50MP 3x periscope + 8MP ultrawide", 66], 12, 256, 5800, 120, null],
  ["vivo-v70-elite-5g-8-256", "vivo", "V70 Elite 5G", "8GB · 256GB", 51999, 2026, "Snapdragon 8s Gen 3", d(6.59, "OLED", 1260, 2750, 120), ["50MP ZEISS triple camera", 60], 8, 256, 6500, 90, null],
  ["poco-x8-pro-max-12-512", "POCO", "X8 Pro Max", "12GB · 512GB", 52999, 2026, "MediaTek Dimensity 9500s", d(6.83, "OLED", 1280, 2772, 120), ["50MP main", 52], 12, 512, 8500, null, null],
  ["samsung-galaxy-s25-fe-8-128", "Samsung", "Galaxy S25 FE", "8GB · 128GB", 53990, 2025, "Samsung Exynos 2400", d(6.7, "LTPO OLED", 1080, 2340, 120), ["50MP + 8MP 3x telephoto + 12MP ultrawide", 64], 8, 128, 4900, 45, 190, "Beebom Gadgets via web search"],
  ["samsung-galaxy-a37-5g-12-256", "Samsung", "Galaxy A37 5G", "12GB · 256GB", 53999, 2026, "Samsung Exynos 1480", d(6.7, "OLED", 1080, 2340, 120), ["50MP OIS main", 48], 12, 256, 5000, 45, null],
  ["nothing-phone-4a-pro-12-256", "Nothing", "Phone (4a) Pro", "12GB · 256GB", 55999, 2026, "Snapdragon 7s Gen 4", d(6.78, "OLED", 1260, 2800, 144), ["50MP main + 50MP periscope", 64], 12, 256, 5400, 50, null],
  ["vivo-v70-12-256", "vivo", "V70", "12GB · 256GB", 56999, 2026, "Snapdragon 7 Gen 4", d(6.59, "OLED", 1260, 2750, 120), ["50MP ZEISS triple camera", 62], 12, 256, 6500, 90, null],
  ["oneplus-15r-12-256", "OnePlus", "15R", "12GB · 256GB", 59999, 2026, "Snapdragon 8 Gen 5", d(6.83, "OLED", 1272, 2800, 165), ["50MP main + 8MP ultrawide", 60], 12, 256, 7400, 80, null],
  ["oppo-reno-15-5g-12-512", "OPPO", "Reno 15 5G", "12GB · 512GB", 59999, 2026, "Snapdragon 7 Gen 4", d(6.59, "OLED", 1256, 2760, 120), ["50MP triple camera", 66], 12, 512, 6500, 80, null],
  ["vivo-x200t-12-512", "vivo", "X200T", "12GB · 512GB", 59999, 2026, "MediaTek Dimensity 9400+", d(6.67, "OLED", 1260, 2800, 120), ["50MP ZEISS triple camera", 78], 12, 512, 6200, null, null],
  ["iqoo-15r-5g-12-512", "iQOO", "15R 5G", "12GB · 512GB", 61999, 2026, "Snapdragon 8 Gen 5", d(6.59, "OLED", 1260, 2750, 144), ["50MP dual camera", 60], 12, 512, 7600, 100, null],
  ["oneplus-13-12-256", "OnePlus", "13", "12GB · 256GB", 63157, 2025, "Snapdragon 8 Elite", d(6.82, "LTPO OLED", 1440, 3168, 120), ["50MP + 50MP 3x periscope + 50MP ultrawide (Hasselblad)", 84], 12, 256, 6000, 100, 213],
  ["oppo-reno-15-pro-mini-5g-12-512", "OPPO", "Reno 15 Pro Mini 5G", "12GB · 512GB", 64999, 2026, "MediaTek Dimensity 8450", d(6.32, "OLED", 1216, 2640, 120), ["200MP main + telephoto + ultrawide", 72], 12, 512, 6200, null, null],
  ["google-pixel-10-12-256", "Google", "Pixel 10", "12GB · 256GB", 67659, 2025, "Google Tensor G5", d(6.3, "OLED", 1080, 2424, 120), ["48MP + 10.8MP 5x telephoto + 13MP ultrawide", 80], 12, 256, 4970, 30, 204],
  ["apple-iphone-16-128", "Apple", "iPhone 16", "8GB · 128GB", 67900, 2024, "Apple A18", d(6.1, "OLED", 1179, 2556, 60), ["48MP Fusion + 12MP ultrawide", 76], 8, 128, 3561, null, 170],
  ["motorola-signature-16-1tb", "Motorola", "Signature", "16GB · 1TB", 69999, 2026, "Snapdragon 8 Gen 5", d(6.8, "OLED", 1264, 2780, 120), ["50MP triple camera", 78], 16, 1024, 5200, null, null],
  ["samsung-galaxy-z-flip6-12-256", "Samsung", "Galaxy Z Flip6", "12GB · 256GB", 71990, 2024, "Snapdragon 8 Gen 3", d(6.7, "OLED", 1080, 2640, 120), ["50MP main + 12MP ultrawide", 70], 12, 256, 4000, 25, 187],

  // ---- Flagships ------------------------------------------------------------------------
  ["vivo-x300-16-512", "vivo", "X300", "16GB · 512GB", 75999, 2025, "MediaTek Dimensity 9500", d(6.31, "OLED", 1216, 2640, 120), ["200MP + 50MP periscope + 50MP ultrawide (ZEISS)", 88], 16, 512, 6040, 90, null],
  ["oneplus-15-16-512", "OnePlus", "15", "16GB · 512GB", 79999, 2025, "Snapdragon 8 Elite Gen 5", d(6.78, "LTPO OLED", 1272, 2772, 165), ["50MP + 50MP periscope + 50MP ultrawide", 86], 16, 512, 7300, 120, null],
  ["samsung-galaxy-s26-12-512", "Samsung", "Galaxy S26", "12GB · 512GB", 79999, 2026, "Samsung Exynos 2600", d(6.3, "LTPO OLED", 1080, 2340, 120), ["50MP + 10MP 3x telephoto + 12MP ultrawide", 76], 12, 512, 4300, 25, null],
  ["xiaomi-17-12-256", "Xiaomi", "17", "12GB · 256GB", 89999, 2026, "Snapdragon 8 Elite Gen 5", d(6.3, "OLED", 1220, 2656, 120), ["50MP Leica triple camera", 82], 12, 256, 6330, null, null],
  ["apple-iphone-17-512", "Apple", "iPhone 17", "8GB · 512GB", 102900, 2025, "Apple A19", d(6.3, "LTPO OLED", 1206, 2622, 120), ["48MP Fusion + 48MP ultrawide", 82], 8, 512, 3692, 30, 177],
  ["google-pixel-10-pro-16-256", "Google", "Pixel 10 Pro", "16GB · 256GB", 109999, 2025, "Google Tensor G5", d(6.3, "LTPO OLED", 1280, 2856, 120), ["50MP + 48MP 5x periscope + 48MP ultrawide", 94], 16, 256, 4870, 30, 207],
  ["samsung-galaxy-s26-plus-12-256", "Samsung", "Galaxy S26+", "12GB · 256GB", 119999, 2026, "Samsung Exynos 2600", d(6.7, "LTPO OLED", 1440, 3120, 120), ["50MP + 10MP 3x telephoto + 12MP ultrawide", 78], 12, 256, 4900, 45, null, "91mobiles via web search"],
  ["vivo-x300-pro-16-512", "vivo", "X300 Pro", "16GB · 512GB", 119999, 2025, "MediaTek Dimensity 9500", d(6.78, "OLED", 1260, 2800, 120), ["50MP + 200MP periscope + 50MP ultrawide (ZEISS)", 92], 16, 512, 6510, null, null],
  ["samsung-galaxy-s26-ultra-12-256", "Samsung", "Galaxy S26 Ultra", "12GB · 256GB", 139999, 2026, "Snapdragon 8 Elite Gen 5", d(6.9, "LTPO OLED", 1440, 3120, 120), ["200MP + 50MP 5x periscope + 10MP 3x + 50MP ultrawide", 95], 12, 256, 5000, 60, null],
  ["xiaomi-17-ultra-16-512", "Xiaomi", "17 Ultra", "16GB · 512GB", 139999, 2026, "Snapdragon 8 Elite Gen 5", d(6.9, "LTPO OLED", 1200, 2608, 120), ["50MP 1-inch + 200MP periscope + 50MP + 50MP (Leica)", 97], 16, 512, 6000, null, null],
  ["apple-iphone-17-pro-max-256", "Apple", "iPhone 17 Pro Max", "12GB · 256GB", 149900, 2025, "Apple A19 Pro", d(6.9, "LTPO OLED", 1320, 2868, 120), ["48MP + 48MP 4x periscope + 48MP ultrawide", 95], 12, 256, 4823, 40, 231],
  ["vivo-x300-ultra-16-512", "vivo", "X300 Ultra", "16GB · 512GB", 159999, 2026, "Snapdragon 8 Elite Gen 5", d(6.82, "LTPO OLED", 1440, 3168, 144), ["ZEISS 14mm, 35mm and 85mm triple camera, 200MP", 98], 16, 512, 6600, 100, null, "91mobiles via web search"],
  ["apple-iphone-18-pro-256", "Apple", "iPhone 18 Pro", "12GB · 256GB", 164900, 2026, "Apple A20 Pro", d(6.3, "LTPO OLED", 1206, 2622, 120), ["48MP variable-aperture main + 48MP telephoto + 48MP ultrawide", 96], 12, 256, null, null, null, "91mobiles launch coverage via web search"],
  ["oppo-find-x9-ultra-16-1tb", "OPPO", "Find X9 Ultra", "16GB · 1TB", 169999, 2026, "Snapdragon 8 Elite Gen 5", d(6.82, "LTPO OLED", 1440, 3168, 144), ["200MP + 200MP periscope + 50MP periscope + 50MP ultrawide", 98], 16, 1024, 7050, 100, null],
  ["apple-iphone-18-pro-max-256", "Apple", "iPhone 18 Pro Max", "12GB · 256GB", 179900, 2026, "Apple A20 Pro", d(6.9, "LTPO OLED", 1320, 2868, 120), ["48MP variable-aperture main + 48MP telephoto + 48MP ultrawide", 96], 12, 256, null, null, null, "91mobiles launch coverage via web search"],
];

export const phones: SeedPhone[] = rows.map(
  ([slug, brand, name, variant, price, releaseYear, cpuName, display, [cameraName, cameraScore], ramGb, storageGb, batteryCapacity, chargingWatts, weightGrams, source]) => ({
    slug,
    brand,
    name,
    variant,
    price,
    releaseYear,
    cpuName,
    display,
    cameraName,
    cameraScore,
    ramGb,
    storageGb,
    batteryCapacity,
    chargingWatts,
    weightGrams,
    source: source ?? "digit.in",
  }),
);
