import type { Metadata } from "next";
import { CategoryFinderPage } from "@/components/pages/category-finder-page";
import { requireProfile } from "@/lib/engine";
import { parseFinderParams } from "@/lib/query";

export async function generateMetadata({ searchParams }: PageProps<"/phones">): Promise<Metadata> {
  const params = parseFinderParams(await searchParams, "phone");
  const label = requireProfile("phone", params.useCase).label.toLowerCase();
  const title = `Best phones for ${label} under ₹${Math.round(params.budget / 1000)}k`;
  const og = `/api/og?${new URLSearchParams({ kind: "finder", category: "phone", useCase: params.useCase, budget: String(params.budget) })}`;
  return {
    title: "Phones",
    description: "Every phone in your budget, ranked for photography, gaming, battery life, value or all-round use.",
    openGraph: { title, description: "Every phone in your budget, ranked for photography, gaming, battery life, value or all-round use.", images: [og] },
    twitter: { card: "summary_large_image", title, images: [og] },
  };
}

export default async function PhonesPage({ searchParams }: PageProps<"/phones">) {
  return <CategoryFinderPage category="phone" searchParams={await searchParams} />;
}
