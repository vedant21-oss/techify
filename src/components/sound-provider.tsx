"use client";

import { Volume2, VolumeX } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useRef, useSyncExternalStore } from "react";
import { useMessages } from "@/components/lang-provider";
import { armUnlock, isSupported, play, release, unlock } from "@/lib/sound";
import { cn } from "@/lib/utils";

/** Remembers the choice across visits. Sound stays off until it says otherwise. */
const STORAGE_KEY = "techify_sound";

/** Elements carrying this attribute tick on hover and knock when pressed. */
const TARGET = "[data-sound]";

/* ---- The choice, as a store ----------------------------------------------------- */
/*
 * localStorage isn't readable while rendering on the server, so the choice is kept
 * in a small store and read with useSyncExternalStore: the server and the first
 * paint both say "off", and the browser corrects it without a flash of wrong state.
 */

const listeners = new Set<() => void>();
let choice: boolean | null = null;

function read(): boolean {
  if (choice === null) {
    try {
      choice = window.localStorage.getItem(STORAGE_KEY) === "on";
    } catch {
      choice = false; // Storage blocked; sound just stays off.
    }
  }
  return choice;
}

function readOnServer(): boolean {
  return false;
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  // Another tab turning sound on or off moves this one with it.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    choice = event.newValue === "on";
    onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function write(next: boolean): void {
  choice = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
  } catch {
    // Storage blocked; the choice lasts for this page only.
  }
  for (const onChange of listeners) onChange();
}

/* ---- Provider -------------------------------------------------------------------- */

const SoundContext = createContext<{ enabled: boolean; toggle: () => void }>({
  enabled: false,
  toggle: () => {},
});

export function useSound() {
  return useContext(SoundContext);
}

/**
 * Holds whether the press sounds are on, and — while they are — plays the tick and
 * knock for anything marked `data-sound`. One delegated listener covers the whole
 * page, so buttons opt in with an attribute instead of wiring up a handler each.
 *
 * Sound is off for everyone on a first visit. Nothing is synthesized, and no
 * AudioContext exists, until someone turns it on.
 */
export function SoundProvider({ children }: { children: React.ReactNode }) {
  const enabled = useSyncExternalStore(subscribe, read, readOnServer);
  // The last element that ticked, so crossing between a button's own children is quiet.
  const hovered = useRef<Element | null>(null);

  useEffect(() => {
    if (!enabled) {
      // Covers another tab switching sound off as well as this one's toggle.
      release();
      return;
    }
    const onOver = (event: PointerEvent) => {
      // Touch has no hover, and a tick under a fingertip would double the press.
      if (event.pointerType !== "mouse") return;
      const target = (event.target as Element | null)?.closest?.(TARGET) ?? null;
      if (!target || target === hovered.current) return;
      hovered.current = target;
      play("hover");
    };
    const onOut = (event: PointerEvent) => {
      if (!(event.target as Element | null)?.closest?.(TARGET)) hovered.current = null;
    };
    const onDown = (event: PointerEvent) => {
      if ((event.target as Element | null)?.closest?.(TARGET)) play("press");
    };
    // A reload starts with audio blocked, so take the first touch of the page —
    // skipping the intro, a keypress, anything — as the gesture that opens it.
    const disarm = armUnlock();
    document.addEventListener("pointerover", onOver);
    document.addEventListener("pointerout", onOut);
    document.addEventListener("pointerdown", onDown);
    return () => {
      disarm();
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [enabled]);

  const toggle = useCallback(() => {
    const next = !read();
    write(next);
    // Both of these have to happen inside the click itself: that gesture is what
    // lets a browser start an AudioContext at all.
    if (next) {
      unlock();
      play("press");
    }
  }, []);

  return <SoundContext.Provider value={{ enabled, toggle }}>{children}</SoundContext.Provider>;
}

/** Web Audio is a fact about the browser, so it never changes under us. */
const noSubscription = () => () => {};

/**
 * Turns the press sounds on and off. Renders on the server as "off", which is what
 * it is until someone presses it, and hides itself where Web Audio doesn't exist.
 */
export function SoundToggle({ className }: { className?: string }) {
  const t = useMessages().sound;
  const { enabled, toggle } = useSound();
  const supported = useSyncExternalStore(noSubscription, isSupported, () => true);

  if (!supported) return null;

  const Icon = enabled ? Volume2 : VolumeX;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={enabled}
      aria-label={enabled ? t.turnOff : t.turnOn}
      title={enabled ? t.turnOff : t.turnOn}
      className={cn("flex items-center gap-2", className)}
    >
      <Icon className="size-4" aria-hidden />
      <span className="sr-only 2xl:not-sr-only">{enabled ? t.on : t.off}</span>
    </button>
  );
}
