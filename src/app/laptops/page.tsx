import type { Metadata } from "next";
import { CategoryFinderPage } from "@/components/pages/category-finder-page";
import { requireProfile } from "@/lib/engine";
import { parseFinderParams } from "@/lib/query";

export async function generateMetadata({ searchParams }: PageProps<"/laptops">): Promise<Metadata> {
  const params = parseFinderParams(await searchParams, "laptop");
  const label = requireProfile("laptop", params.useCase).label.toLowerCase();
  const title = `Best laptops for ${label} under ₹${Math.round(params.budget / 1000)}k`;
  const og = `/api/og?${new URLSearchParams({ kind: "finder", category: "laptop", useCase: params.useCase, budget: String(params.budget) })}`;
  return {
    title: "Laptops",
    description: "Every laptop in your budget, ranked for gaming, coding, video editing, college or all-round use.",
    openGraph: { title, description: "Every laptop in your budget, ranked for gaming, coding, video editing, college or all-round use.", images: [og] },
    twitter: { card: "summary_large_image", title, images: [og] },
  };
}

export default async function LaptopsPage({ searchParams }: PageProps<"/laptops">) {
  return <CategoryFinderPage category="laptop" searchParams={await searchParams} />;
}
