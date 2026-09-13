import { formatNumber, formatStorage, formatWeight } from "@/lib/engine";
import { LOCALE, type Lang } from "@/lib/i18n/config";
import { MESSAGES } from "@/lib/i18n/messages";
import type { DeviceDTO } from "@/lib/types";

const priceDate = (lang: Lang) =>
  new Intl.DateTimeFormat(LOCALE[lang], { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** "Price checked 13 Sept 2026 · digit.in" */
export function priceProvenance(device: Pick<DeviceDTO, "priceCheckedOn" | "priceSource">, lang: Lang = "en"): string {
  const checked = MESSAGES[lang].specs.priceChecked(priceDate(lang).format(new Date(device.priceCheckedOn)));
  return device.priceSource ? `${checked} · ${device.priceSource}` : checked;
}

function battery(device: DeviceDTO): string | null {
  if (device.batteryCapacity === null) return null;
  return device.category === "laptop" ? `${device.batteryCapacity} Wh` : `${formatNumber(device.batteryCapacity)} mAh`;
}

function weight(device: DeviceDTO): string | null {
  if (device.weightGrams === null) return null;
  return formatWeight(device.weightGrams, device.category === "laptop" ? "kg" : "g");
}

export function displayName(device: Pick<DeviceDTO, "brand" | "name">): string {
  return device.name.toLowerCase().startsWith(device.brand.toLowerCase()) ? device.name : `${device.brand} ${device.name}`;
}

/** The handful of specs worth showing at a glance on a result card. */
export function keySpecs(device: DeviceDTO): string[] {
  const memory = `${device.ramGb} GB · ${formatStorage(device.storageGb)}`;
  if (device.category === "laptop") {
    return [device.cpuName, device.gpuName, memory, weight(device)].filter((s): s is string => Boolean(s));
  }
  const power = battery(device);
  return [
    device.cpuName,
    power && `${power}${device.chargingWatts ? ` · ${device.chargingWatts} W` : ""}`,
    memory,
    weight(device),
  ].filter((s): s is string => Boolean(s));
}

/** Full labelled spec list for detail and compare views. */
export function specRows(device: DeviceDTO, lang: Lang = "en"): { label: string; value: string }[] {
  const t = MESSAGES[lang].specs;
  const rows = [
    { label: t.processor, value: device.cpuName },
    ...(device.category === "laptop" ? [{ label: t.graphics, value: device.gpuName ?? "n/a" }] : []),
    ...(device.category === "phone" ? [{ label: t.cameras, value: device.cameraName ?? "n/a" }] : []),
    { label: t.display, value: device.displayName },
    { label: t.memory, value: `${device.ramGb} GB` },
    { label: t.storage, value: formatStorage(device.storageGb) },
    { label: t.battery, value: battery(device) ?? t.notListed },
    ...(device.category === "phone"
      ? [{ label: t.charging, value: device.chargingWatts ? `${device.chargingWatts} W` : t.notListed }]
      : []),
    { label: t.weight, value: weight(device) ?? t.notListed },
    { label: t.released, value: String(device.releaseYear) },
  ];
  return rows;
}
