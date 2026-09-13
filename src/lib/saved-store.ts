"use client";

import { useCallback, useSyncExternalStore } from "react";

/*
 * Saved devices and recently viewed devices live in localStorage: no account needed,
 * private to this browser. Reads tolerate storage being unavailable (private mode,
 * blocked site data) and simply behave as empty.
 */

const SAVED_KEY = "techify:saved";
const RECENT_KEY = "techify:recent";
const RECENT_LIMIT = 12;
const EMPTY: string[] = [];

const listeners = new Set<() => void>();
const snapshots = new Map<string, { raw: string | null; value: string[] }>();

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function snapshot(key: string): string[] {
  const raw = readRaw(key);
  const cached = snapshots.get(key);
  if (cached && cached.raw === raw) return cached.value;
  let value: string[] = EMPTY;
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    value = Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : EMPTY;
  } catch {
    value = EMPTY;
  }
  snapshots.set(key, { raw, value });
  return value;
}

function write(key: string, value: string[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable: the change lasts only until the page reloads.
    snapshots.set(key, { raw: JSON.stringify(value), value });
  }
  listeners.forEach((notify) => notify());
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function useList(key: string): string[] {
  return useSyncExternalStore(
    subscribe,
    () => snapshot(key),
    () => EMPTY,
  );
}

export function useSaved() {
  const saved = useList(SAVED_KEY);
  const toggle = useCallback((slug: string) => {
    const current = snapshot(SAVED_KEY);
    write(SAVED_KEY, current.includes(slug) ? current.filter((s) => s !== slug) : [slug, ...current]);
  }, []);
  const remove = useCallback((slug: string) => write(SAVED_KEY, snapshot(SAVED_KEY).filter((s) => s !== slug)), []);
  return { saved, toggle, remove, isSaved: (slug: string) => saved.includes(slug) };
}

export function useRecent() {
  const recent = useList(RECENT_KEY);
  const record = useCallback((slug: string) => {
    const current = snapshot(RECENT_KEY);
    if (current[0] === slug) return;
    write(RECENT_KEY, [slug, ...current.filter((s) => s !== slug)].slice(0, RECENT_LIMIT));
  }, []);
  const clear = useCallback(() => write(RECENT_KEY, []), []);
  return { recent, record, clear };
}
