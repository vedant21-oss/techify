import type { Metadata } from "next";
import { CategoryFinderPage } from "@/components/pages/category-finder-page";

export const metadata: Metadata = {
  title: "Laptops",
  description: "Every laptop in your budget, ranked for gaming, coding, video editing, college or all-round use.",
};

export default async function LaptopsPage({ searchParams }: PageProps<"/laptops">) {
  return <CategoryFinderPage category="laptop" searchParams={await searchParams} />;
}
