import type { DeviceSpecs, EngineDevice } from "../types";

let counter = 0;

const laptopDefaults: DeviceSpecs = {
  cpuScore: 50,
  gpuScore: 30,
  displayScore: 50,
  ramGb: 16,
  storageGb: 512,
  batteryCapacity: 55,
  weightGrams: 1700,
};

const phoneDefaults: DeviceSpecs = {
  cpuScore: 50,
  cameraScore: 50,
  displayScore: 60,
  ramGb: 8,
  storageGb: 128,
  batteryCapacity: 5000,
  chargingWatts: 45,
  weightGrams: 195,
};

export function laptop(name: string, price: number, specs: Partial<DeviceSpecs> = {}): EngineDevice {
  counter += 1;
  return {
    id: `laptop-${counter}`,
    slug: `laptop-${counter}`,
    category: "laptop",
    brand: "Test",
    name,
    price,
    specs: { ...laptopDefaults, ...specs },
  };
}

export function phone(name: string, price: number, specs: Partial<DeviceSpecs> = {}): EngineDevice {
  counter += 1;
  return {
    id: `phone-${counter}`,
    slug: `phone-${counter}`,
    category: "phone",
    brand: "Test",
    name,
    price,
    specs: { ...phoneDefaults, ...specs },
  };
}
