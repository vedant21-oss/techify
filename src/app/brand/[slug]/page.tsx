import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeviceRow } from "@/components/device-row";
import { PageHero } from "@/components/page-hero";
import { getLang } from "@/lib/i18n/server";
import { MESSAGES } from "@/lib/i18n/messages";
import { getBrand, getBrands } from "@/lib/recommendations";

export async function generateStaticParams() {
  return (await getBrands()).map((b) => ({ slug: b.slug }));
}

export async function generateMetadata(props: PageProps<"/brand/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const data = await getBrand(slug);
  if (!data) return { title: "Brand not found" };
  const count = data.laptops.length + data.phones.length;
  return {
    title: `${data.brand} laptops and phones`,
    description: `All ${count} ${data.brand} devices Techify tracks in India, scored on the specs that matter for how you'll use them.`,
  };
}

export default async function BrandPage(props: PageProps<"/brand/[slug]">) {
  const { slug } = await props.params;
  const [lang, data] = await Promise.all([getLang(), getBrand(slug)]);
  if (!data) notFound();
  const t = MESSAGES[lang];
  const groups = [
    { label: t.brands.phones, devices: data.phones },
    { label: t.brands.laptops, devices: data.laptops },
  ].filter((g) => g.devices.length > 0);

  return (
    <div className="pb-20">
      <PageHero
        id="brand-title"
        lines={[data.brand]}
        lede={t.brands.lede(data.brand, data.laptops.length + data.phones.length)}
        size="sm"
        wrap
      />
      <div className="mx-auto flex max-w-6xl flex-col gap-14 px-(--gutter) pt-12">
        {groups.map((group) => (
          <section key={group.label} aria-labelledby={`brand-${group.label}`}>
            <h2 id={`brand-${group.label}`} className="border-b-[3px] border-ink pb-5 text-5xl">
              {group.label} <span className="text-pink tabular">{group.devices.length}</span>
            </h2>
            <ul className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {group.devices.map((device) => (
                <li key={device.slug}>
                  <DeviceRow device={device} className="h-full" />
                </li>
              ))}
            </ul>
          </section>
        ))}
        <Link href="/brands" className="self-start label-mono underline underline-offset-4 hover:bg-pink-tint">
          {t.brands.allBrands}
        </Link>
      </div>
    </div>
  );
}
