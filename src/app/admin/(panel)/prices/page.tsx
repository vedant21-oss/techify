import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/engine";
import { PriceForm } from "../../forms";

export const dynamic = "force-dynamic";

export default async function AdminPricesPage() {
  const devices = await prisma.device.findMany({
    orderBy: [{ category: "asc" }, { price: "asc" }],
    include: { _count: { select: { pricePoints: true } } },
  });
  return (
    <>
      <h1 className="text-6xl">Prices</h1>
      <p className="mt-3 max-w-[70ch] text-ink-soft">
        Saving a new price records it in price history (which feeds the deals page) and checks price-drop alerts
        straight away. Re-running the seed puts back the prices from the seed files.
      </p>
      <div className="mt-8 overflow-x-auto border-[3px] border-ink">
        <table className="w-full min-w-[46rem] text-left text-sm">
          <thead className="bg-ink text-paper">
            <tr>
              <th className="px-4 py-3 label-mono font-normal">Device</th>
              <th className="px-4 py-3 label-mono font-normal">Now</th>
              <th className="px-4 py-3 label-mono font-normal">History</th>
              <th className="px-4 py-3 label-mono font-normal">New price (₹)</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((d) => (
              <tr key={d.slug} className="border-t border-ink align-top">
                <td className="px-4 py-3">
                  <span className="font-medium">
                    {d.brand} {d.name}
                  </span>
                  <span className="block font-mono text-xs text-ink-soft">{d.slug}</span>
                </td>
                <td className="px-4 py-3 font-mono tabular">{formatPrice(d.price)}</td>
                <td className="px-4 py-3 font-mono tabular">{d._count.pricePoints}</td>
                <td className="px-4 py-3">
                  <PriceForm slug={d.slug} price={d.price} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
