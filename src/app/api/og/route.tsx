import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { BUDGET_RANGES, isUseCaseFor } from "@/lib/catalog-config";
import { formatBudgetShort, formatPrice, requireProfile, type Category } from "@/lib/engine";
import { getDeviceDetail, getRecommendations, getVersus } from "@/lib/recommendations";

const INK = "#1d1fcf";
const PINK = "#ff3fa4";
const PAPER = "#f1f1ec";
const DEEP = "#0c0d52";

let fontCache: Promise<ArrayBuffer | null> | null = null;

/** Big Shoulders as TTF (Satori can't read woff2), fetched once per server instance. */
function displayFont(): Promise<ArrayBuffer | null> {
  fontCache ??= (async () => {
    try {
      const css = await (await fetch("https://fonts.googleapis.com/css2?family=Big+Shoulders:wght@900")).text();
      const url = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
      return url ? await (await fetch(url)).arrayBuffer() : null;
    } catch {
      return null;
    }
  })();
  return fontCache;
}

function Frame({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: PAPER, border: `14px solid ${INK}`, padding: 56, fontFamily: "Display, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: INK, fontSize: 30, letterSpacing: 2 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ width: 30, height: 30, borderRadius: 30, border: `5px solid ${INK}`, background: PINK }} />
          TECHIFY
        </span>
        <span style={{ fontSize: 24 }}>{eyebrow.toUpperCase()}</span>
      </div>
      <div style={{ display: "flex", position: "relative", marginTop: 36 }}>
        <span style={{ position: "absolute", left: 6, top: 5, color: PINK, fontSize: 92, lineHeight: 0.9, textTransform: "uppercase" }}>{title}</span>
        <span style={{ color: INK, fontSize: 92, lineHeight: 0.9, textTransform: "uppercase" }}>{title}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "flex-end" }}>{children}</div>
    </div>
  );
}

function Row({ rank, name, detail, score }: { rank: string; name: string; detail: string; score: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 22, borderTop: `4px solid ${INK}`, padding: "14px 0", color: INK }}>
      <span style={{ width: 58, height: 58, display: "flex", alignItems: "center", justifyContent: "center", background: rank === "1" ? PINK : INK, color: rank === "1" ? DEEP : PAPER, fontSize: 36 }}>{rank}</span>
      <span style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <span style={{ fontSize: 40, textTransform: "uppercase" }}>{name}</span>
        <span style={{ fontSize: 24, color: DEEP }}>{detail}</span>
      </span>
      <span style={{ fontSize: 56 }}>{score}</span>
    </div>
  );
}

async function render(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  const kind = q.get("kind");

  if (kind === "finder") {
    const category: Category = q.get("category") === "laptop" ? "laptop" : "phone";
    const useCase = q.get("useCase") ?? "all-rounder";
    const budget = Number(q.get("budget")) || BUDGET_RANGES[category].default;
    if (!isUseCaseFor(category, useCase)) return <Frame eyebrow="Laptops & phones · India" title="Skip the ten open tabs" />;
    const data = await getRecommendations({ category, useCase, budget, sort: "match" });
    const label = requireProfile(category, useCase).label;
    return (
      <Frame eyebrow={`${data.poolSize} ranked`} title={`Best ${category}s for ${label} under ${formatBudgetShort(budget)}`}>
        {data.results.slice(0, 3).map((r) => (
          <Row key={r.device.slug} rank={String(r.matchRank)} name={`${r.device.brand} ${r.device.name}`} detail={formatPrice(r.device.price)} score={Math.round(r.matchScore)} />
        ))}
      </Frame>
    );
  }

  if (kind === "device") {
    const detail = await getDeviceDetail(q.get("slug") ?? "", { useCase: q.get("useCase") ?? undefined });
    if (detail) {
      const d = detail.item.device;
      return (
        <Frame eyebrow={`${detail.query.useCaseLabel} score`} title={`${d.brand} ${d.name}`}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", color: INK }}>
            <span style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 30, color: DEEP }}>{d.variant}</span>
              <span style={{ fontSize: 76 }}>{formatPrice(d.price)}</span>
            </span>
            <span style={{ display: "flex", flexDirection: "column", alignItems: "center", background: INK, color: PAPER, padding: "18px 34px" }}>
              <span style={{ fontSize: 26 }}>MATCH</span>
              <span style={{ fontSize: 120, lineHeight: 1 }}>{Math.round(detail.item.matchScore)}</span>
            </span>
          </div>
        </Frame>
      );
    }
  }

  if (kind === "vs") {
    const v = await getVersus(q.get("a") ?? "", q.get("b") ?? "");
    if (!("error" in v)) {
      return (
        <Frame eyebrow="Head-to-head" title={`${v.a.name} vs ${v.b.name}`}>
          <div style={{ display: "flex", gap: 24, color: INK }}>
            {[
              [v.a, v.wins.a],
              [v.b, v.wins.b],
            ].map(([d, wins]) => {
              const device = d as typeof v.a;
              return (
                <span key={device.slug} style={{ flex: 1, display: "flex", flexDirection: "column", border: `6px solid ${INK}`, padding: 22 }}>
                  <span style={{ fontSize: 38, textTransform: "uppercase" }}>{`${device.brand} ${device.name}`}</span>
                  <span style={{ fontSize: 28, color: DEEP }}>{formatPrice(device.price)}</span>
                  <span style={{ fontSize: 64, marginTop: 8 }}>{`Wins ${wins}/${v.verdicts.length}`}</span>
                </span>
              );
            })}
          </div>
        </Frame>
      );
    }
  }

  return (
    <Frame eyebrow="Laptops & phones · India" title="Skip the ten open tabs">
      <span style={{ fontSize: 40, color: DEEP }}>Every device in your budget, scored for how you&apos;ll use it.</span>
    </Frame>
  );
}

/** GET /api/og?kind=finder|device|vs — 1200×630 share image for social previews. */
export async function GET(request: NextRequest) {
  const [element, font] = await Promise.all([render(request), displayFont()]);
  return new ImageResponse(element, {
    width: 1200,
    height: 630,
    fonts: font ? [{ name: "Display", data: font, weight: 900, style: "normal" }] : undefined,
    headers: { "cache-control": "public, max-age=3600, s-maxage=86400" },
  });
}
