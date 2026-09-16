"use client";

import { createContext, useContext, useEffect } from "react";
import { adoptLists, clearLocalLists, setRemoteListSync } from "@/lib/saved-store";

export interface SessionUser {
  name: string;
  email: string;
  verified: boolean;
  sessionId: string;
}

const SessionContext = createContext<SessionUser | null>(null);

/** The logged-in account, or null. Server-rendered from the session cookie. */
export function useSessionUser(): SessionUser | null {
  return useContext(SessionContext);
}

const SYNCED_SESSION_KEY = "techify:synced-session";

function readMarker(): string | null {
  try {
    return window.localStorage.getItem(SYNCED_SESSION_KEY);
  } catch {
    return null;
  }
}

function writeMarker(value: string | null) {
  try {
    if (value) window.localStorage.setItem(SYNCED_SESSION_KEY, value);
    else window.localStorage.removeItem(SYNCED_SESSION_KEY);
  } catch {
    // Storage blocked: sync still works for this page load.
  }
}

/**
 * Keeps the saved list and recent history in step with the account.
 * - First load of a new login: this browser's lists merge into the account's.
 * - Later loads: the account's lists replace the local copy, so removals on
 *   another device stick.
 * - After logging out: the local copy is cleared, so the next person on this
 *   browser doesn't see it.
 */
function ListSync({ sessionId }: { sessionId: string | null }) {
  useEffect(() => {
    if (!sessionId) {
      setRemoteListSync(null);
      if (readMarker()) {
        clearLocalLists();
        writeMarker(null);
      }
      return;
    }

    const controller = new AbortController();
    const firstLoad = readMarker() !== sessionId;
    const request = firstLoad
      ? fetch("/api/account/lists", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(adoptLists.current()),
          signal: controller.signal,
        })
      : fetch("/api/account/lists", { signal: controller.signal });

    request
      .then(async (res) => {
        if (!res.ok) return;
        adoptLists.replace(await res.json());
        writeMarker(sessionId);
        setRemoteListSync((kind, slugs) => {
          fetch("/api/account/lists", {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ kind, slugs }),
            keepalive: true,
          }).catch(() => {
            // Offline: the local copy has the change and the next login merge will carry it.
          });
        });
      })
      .catch(() => {
        // Aborted or offline: keep using the local lists.
      });

    return () => {
      controller.abort();
      setRemoteListSync(null);
    };
  }, [sessionId]);

  return null;
}

export function SessionProvider({ user, children }: { user: SessionUser | null; children: React.ReactNode }) {
  return (
    <SessionContext.Provider value={user}>
      <ListSync sessionId={user?.sessionId ?? null} />
      {children}
    </SessionContext.Provider>
  );
}
