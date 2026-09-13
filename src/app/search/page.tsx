import { Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { DeviceRow } from "@/components/device-row";
import { SaveButton } from "@/components/saved-controls";
import { displayName } from "@/components/device-meta";
import { searchCatalog } from "@/lib/recommendations";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const raw = (await searchParams).q;
  const query = (Array.isArray(raw) ? raw[0] : raw)?.trim().slice(0, 80) ?? "";
  const results = query ? await searchCatalog(query) : [];
  const groups = [
    { label: "Phones", items: results.filter((d) => d.category === "phone") },
    { label: "Laptops", items: results.filter((d) => d.category === "laptop") },
  ].filter((g) => g.items.length);

  return (
    <div className="mx-auto max-w-6xl px-(--gutter) pt-10 pb-20">
      <h1 className="text-[clamp(3.5rem,11vw,7rem)]">Search</h1>
      <form action="/search" role="search" className="mt-8 flex border-[3px] border-ink bg-paper shadow-hard-pink">
        <label htmlFor="search-page-q" className="sr-only">
          Search models, brands or chips
        </label>
        <input
          id="search-page-q"
          name="q"
          type="search"
          defaultValue={query}
          autoFocus={!query}
          placeholder="Try “s26 ultra”, “rtx 5060” or “macbook”"
          className="min-w-0 flex-1 bg-transparent px-5 py-4 text-lg outline-none placeholder:text-ink-soft focus:bg-pink-tint"
        />
        <button type="submit" className="flex items-center gap-2 border-l-[3px] border-ink bg-ink px-6 label-mono text-paper hover:bg-pink hover:text-ink-deep">
          <Search className="size-4" aria-hidden /> Search
        </button>
      </form>

      {query && (
        <p className="mt-6 label-mono text-ink-soft" aria-live="polite">
          {results.length} {results.length === 1 ? "match" : "matches"} for “{query}”
        </p>
      )}

      {query && results.length === 0 && (
        <div className="mt-8 border-[3px] border-dashed border-ink px-6 py-12 text-center">
          <p className="font-heading text-4xl font-black uppercase">Nothing matches that yet</p>
          <p className="mx-auto mt-3 max-w-[48ch] text-ink-soft">
            Check the spelling, try fewer words, or browse{" "}
            <Link href="/phones" className="underline decoration-pink decoration-2 underline-offset-4">
              phones
            </Link>{" "}
            and{" "}
            <Link href="/laptops" className="underline decoration-pink decoration-2 underline-offset-4">
              laptops
            </Link>{" "}
            by budget.
          </p>
        </div>
      )}

      {groups.map((group) => (
        <section key={group.label} className="mt-12" aria-labelledby={`group-${group.label}`}>
          <h2 id={`group-${group.label}`} className="border-b-[3px] border-ink pb-4 text-5xl">
            {group.label}
          </h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {group.items.map((device) => (
              <DeviceRow
                key={device.slug}
                device={device}
                actions={<SaveButton slug={device.slug} name={displayName(device)} />}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
