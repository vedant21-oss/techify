"use client";

import { Loader2, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DeviceRow } from "@/components/device-row";
import { displayName } from "@/components/device-meta";
import { useRecent, useSaved } from "@/lib/saved-store";
import type { DeviceDTO } from "@/lib/types";
import { MAX_COMPARE, toSearchParams } from "@/lib/url";

function useDevices(slugs: string[]) {
  const key = slugs.join(",");
  const [state, setState] = useState<{ key: string; devices: DeviceDTO[]; error: string | null }>({
    key: "",
    devices: [],
    error: null,
  });

  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    fetch(`/api/devices?${new URLSearchParams({ slugs: key })}`, { signal: controller.signal })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "Couldn't load these devices.");
        setState({ key, devices: body.devices as DeviceDTO[], error: null });
      })
      .catch((err: Error) => {
        if (err.name !== "AbortError") setState({ key, devices: [], error: err.message });
      });
    return () => controller.abort();
  }, [key]);

  if (!key) return { devices: [], loading: false, error: null };
  return { devices: state.key === key ? state.devices : [], loading: state.key !== key, error: state.key === key ? state.error : null };
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="mt-6 border-[3px] border-dashed border-ink px-6 py-10 text-center text-ink-soft">{children}</div>;
}

export function SavedView() {
  const { saved, remove } = useSaved();
  const { recent, clear } = useRecent();
  const savedDevices = useDevices(saved);
  const recentDevices = useDevices(recent);

  const comparable = (["phone", "laptop"] as const)
    .map((category) => ({ category, slugs: savedDevices.devices.filter((d) => d.category === category).map((d) => d.slug) }))
    .filter((g) => g.slugs.length >= 2);

  return (
    <>
      <section aria-labelledby="saved-heading" className="pt-12">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b-[3px] border-ink pb-5">
          <h2 id="saved-heading" className="text-6xl">
            Saved <span className="text-pink tabular">{saved.length || ""}</span>
          </h2>
          <div className="flex flex-wrap gap-3">
            {comparable.map((g) => (
              <Link
                key={g.category}
                href={`/compare?${toSearchParams({ slugs: g.slugs.slice(0, MAX_COMPARE) })}`}
                className="border-[3px] border-ink bg-pink px-4 py-2.5 label-mono text-ink-deep shadow-hard hover:-translate-y-0.5"
              >
                Compare saved {g.category}s
              </Link>
            ))}
          </div>
        </div>

        {saved.length === 0 ? (
          <Empty>
            Nothing saved yet. Tap <strong className="text-ink">Save</strong> on any device and it will wait for you here.
          </Empty>
        ) : savedDevices.loading ? (
          <p className="mt-6 flex items-center gap-2 label-mono text-ink-soft">
            <Loader2 className="size-4 animate-spin" aria-hidden /> Loading saved devices
          </p>
        ) : savedDevices.error ? (
          <p role="alert" className="mt-6 border-[3px] border-ink bg-pink-tint px-5 py-4">
            {savedDevices.error}
          </p>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {savedDevices.devices.map((device) => (
              <DeviceRow
                key={device.slug}
                device={device}
                actions={
                  <button
                    type="button"
                    onClick={() => remove(device.slug)}
                    aria-label={`Remove ${displayName(device)} from saved`}
                    className="flex items-center gap-2 px-5 py-3 label-mono hover:bg-pink-tint"
                  >
                    <X className="size-4" aria-hidden /> Remove
                  </button>
                }
              />
            ))}
          </div>
        )}
        {comparable.some((g) => g.slugs.length > MAX_COMPARE) && (
          <p className="mt-4 text-sm text-ink-soft">Compare opens your first {MAX_COMPARE} saved devices of that kind.</p>
        )}
      </section>

      <section aria-labelledby="recent-heading" className="pt-20">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b-[3px] border-ink pb-5">
          <h2 id="recent-heading" className="text-6xl">
            Recently viewed
          </h2>
          {recent.length > 0 && (
            <button type="button" onClick={clear} className="flex items-center gap-2 label-mono hover:bg-pink-tint">
              <Trash2 className="size-4" aria-hidden /> Clear history
            </button>
          )}
        </div>
        {recent.length === 0 ? (
          <Empty>Devices you open will show up here so you can get back to them.</Empty>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recentDevices.devices.map((device) => (
              <DeviceRow key={device.slug} device={device} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
