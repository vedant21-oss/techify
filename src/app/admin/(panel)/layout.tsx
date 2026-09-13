import Link from "next/link";
import { requireAdmin } from "@/lib/server/admin";
import { logoutAction } from "../actions";

export const metadata = { robots: { index: false } };

const tabs = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/prices", label: "Prices" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/upcoming", label: "Upcoming" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-6xl px-(--gutter) pt-8 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-[3px] border-ink pb-4">
        <nav aria-label="Admin" className="flex flex-wrap border-[3px] border-ink">
          {tabs.map((t, i) => (
            <Link key={t.href} href={t.href} className={`px-4 py-2 label-mono hover:bg-pink-tint ${i > 0 ? "border-l-[3px] border-ink" : ""}`}>
              {t.label}
            </Link>
          ))}
        </nav>
        <form action={logoutAction}>
          <button type="submit" className="label-mono underline underline-offset-4">
            Log out
          </button>
        </form>
      </div>
      <div className="pt-8">{children}</div>
    </div>
  );
}
