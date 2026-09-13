import type { Metadata } from "next";
import { CategoryFinderPage } from "@/components/pages/category-finder-page";

export const metadata: Metadata = {
  title: "Phones",
  description: "Every phone in your budget, ranked for photography, gaming, battery life, value or all-round use.",
};

export default async function PhonesPage({ searchParams }: PageProps<"/phones">) {
  return <CategoryFinderPage category="phone" searchParams={await searchParams} />;
}
