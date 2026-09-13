import {
  BatteryFull,
  Camera,
  Clapperboard,
  Code2,
  Gamepad2,
  GraduationCap,
  Layers,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { UseCase } from "@/lib/engine";

const icons: Record<UseCase, LucideIcon> = {
  gaming: Gamepad2,
  coding: Code2,
  "video-editing": Clapperboard,
  student: GraduationCap,
  "all-rounder": Layers,
  photography: Camera,
  battery: BatteryFull,
  budget: Wallet,
};

export function UseCaseIcon({ useCase, className }: { useCase: UseCase; className?: string }) {
  const Icon = icons[useCase];
  return <Icon aria-hidden className={className} />;
}
