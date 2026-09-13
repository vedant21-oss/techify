import { formatPrice } from "@/lib/engine";
import { adminOverview } from "@/lib/server/catalog-admin";
import { emailConfigured } from "@/lib/server/mailer";
import { paymentsConfigured } from "@/lib/server/pro";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const o = await adminOverview();
  const stats = [
    ["Devices in catalogue", o.devices],
    ["Reviews waiting for approval", o.pendingReviews],
    ["Approved reviews", o.approvedReviews],
    ["Active price alerts", o.activeAlerts],
    ["Price alerts sent", o.sentAlerts],
    ["Pro members", o.proMembers],
    ["Pro revenue", formatPrice(o.revenueInr)],
    ["Waiting for launch emails", o.waiting],
  ] as const;
  return (
    <>
      <h1 className="text-6xl">Overview</h1>
      <dl className="mt-8 grid grid-cols-2 border-t-[3px] border-l-[3px] border-ink lg:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="border-r-[3px] border-b-[3px] border-ink p-5">
            <dt className="label-mono text-ink-soft">{label}</dt>
            <dd className="mt-2 font-heading text-5xl font-black tabular">{value}</dd>
          </div>
        ))}
      </dl>
      <ul className="mt-8 flex flex-col gap-2 text-sm">
        <li>Email sending: {emailConfigured() ? "configured" : "not configured (emails print to the server log)"}</li>
        <li>Razorpay payments: {paymentsConfigured() ? "configured" : "not configured"}</li>
      </ul>
    </>
  );
}
