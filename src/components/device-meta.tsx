import { formatNumber, formatStorage, formatWeight } from "@/lib/engine";
import type { DeviceDTO } from "@/lib/types";

const NOT_LISTED = "Not listed";

const priceDate = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** "Price checked 13 Sept 2026 · digit.in" */
export function priceProvenance(device: Pick<DeviceDTO, "priceCheckedOn" | "priceSource">): string {
  const date = priceDate.format(new Date(device.priceCheckedOn));
  return device.priceSource ? `Price checked ${date} · ${device.priceSource}` : `Price checked ${date}`;
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
export function specRows(device: DeviceDTO): { label: string; value: string }[] {
  const rows = [
    { label: "Processor", value: device.cpuName },
    ...(device.category === "laptop" ? [{ label: "Graphics", value: device.gpuName ?? "n/a" }] : []),
    ...(device.category === "phone" ? [{ label: "Cameras", value: device.cameraName ?? "n/a" }] : []),
    { label: "Display", value: device.displayName },
    { label: "Memory", value: `${device.ramGb} GB` },
    { label: "Storage", value: formatStorage(device.storageGb) },
    { label: "Battery", value: battery(device) ?? NOT_LISTED },
    ...(device.category === "phone"
      ? [{ label: "Charging", value: device.chargingWatts ? `${device.chargingWatts} W` : NOT_LISTED }]
      : []),
    { label: "Weight", value: weight(device) ?? NOT_LISTED },
    { label: "Released", value: String(device.releaseYear) },
  ];
  return rows;
}
