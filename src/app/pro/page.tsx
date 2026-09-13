import type { Metadata } from "next";
import { PlateHeadline } from "@/components/plate-headline";
import { formatPrice } from "@/lib/engine";
import { FREE_ALERT_LIMIT } from "@/lib/features/alerts";
import { proPriceInr } from "@/lib/features/pro";
import { paymentsConfigured } from "@/lib/server/pro";
import { ProCheckout } from "./pro-checkout";

export const metadata: Metadata = {
  title: "Techify Pro",
  description: "Unlimited price-drop alerts for every laptop and phone you're waiting on.",
};

export const dynamic = "force-dynamic";

export default function ProPage() {
  const price = proPriceInr();
  const rows = [
    ["Rankings, compare, picks, saved list", "Included", "Included"],
    ["Free-text search", "Included", "Included"],
    ["Price-drop alerts", `${FREE_ALERT_LIMIT} devices at a time`, "Unlimited"],
    ["Price", "Free", `${formatPrice(price)} once`],
  ];

  return (
    <div className="pb-20">
      <section aria-labelledby="pro-title" className="bg-columns border-b-[3px] border-ink">
        <div className="mx-auto grid max-w-6xl items-end gap-8 px-(--gutter) pt-10 pb-12 lg:grid-cols-[1fr_24rem]">
          <PlateHeadline id="pro-title" lines={["Techify", "Pro."]} className="text-[clamp(4rem,17vw,10rem)]" />
          <p className="max-w-[44ch] text-lg leading-relaxed lg:pb-2">
            Everything on Techify stays free. Pro is for people waiting on several prices at once: set as many alerts as you
            like and we email you when each one drops.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-14 px-(--gutter) pt-14 lg:grid-cols-[1fr_26rem]">
        <section aria-labelledby="plans-title" className="min-w-0">
          <h2 id="plans-title" className="border-b-[3px] border-ink pb-5 text-5xl">
            Free vs Pro
          </h2>
          <div className="mt-8 overflow-x-auto border-[3px] border-ink">
            <table className="w-full min-w-[30rem] text-left">
              <thead>
                <tr className="border-b-[3px] border-ink bg-ink text-paper">
                  <th scope="col" className="px-5 py-4 label-mono font-normal">
                    Feature
                  </th>
                  <th scope="col" className="border-l-[3px] border-paper px-5 py-4 font-heading text-2xl font-black uppercase">
                    Free
                  </th>
                  <th scope="col" className="border-l-[3px] border-paper bg-pink px-5 py-4 font-heading text-2xl font-black uppercase text-ink-deep">
                    Pro
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([feature, free, pro]) => (
                  <tr key={feature} className="border-b border-ink last:border-b-0">
                    <th scope="row" className="px-5 py-4 font-medium">
                      {feature}
                    </th>
                    <td className="border-l-[3px] border-ink px-5 py-4">{free}</td>
                    <td className="border-l-[3px] border-ink bg-pink-tint px-5 py-4 font-medium">{pro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3 className="mt-12 text-3xl">How alerts work</h3>
          <ol className="mt-4 flex max-w-[60ch] flex-col gap-3 leading-relaxed">
            {[
              "Open any device and set the price you'd happily pay.",
              "Techify checks prices every day after the catalogue refreshes.",
              "When the price reaches your target, you get one email with a link to buy. Every email has a one-click stop link.",
            ].map((text, i) => (
              <li key={text} className="flex gap-4">
                <span className="grid size-8 shrink-0 place-items-center bg-ink font-heading text-lg font-black text-paper">{i + 1}</span>
                {text}
              </li>
            ))}
          </ol>
        </section>

        <aside aria-labelledby="checkout-title" className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <h2 id="checkout-title" className="mb-6 text-5xl">
            Get Pro
          </h2>
          <ProCheckout priceInr={price} configured={paymentsConfigured()} />
        </aside>
      </div>
    </div>
  );
}
