import { prisma } from "@/lib/db";
import { moderateReviewAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    include: { device: { select: { brand: true, name: true, slug: true } } },
  });
  return (
    <>
      <h1 className="text-6xl">Reviews</h1>
      <p className="mt-3 text-ink-soft">{reviews.length ? `${reviews.length} waiting for a decision.` : "Nothing waiting. Nice."}</p>
      <ul className="mt-8 flex flex-col gap-6">
        {reviews.map((r) => (
          <li key={r.id} className="border-[3px] border-ink bg-paper p-5">
            <p className="label-mono text-ink-soft">
              {r.device.brand} {r.device.name} · {"★".repeat(r.rating)}
              {"☆".repeat(5 - r.rating)} · {r.name} ({r.email}) · owned {r.ownedMonths} months · for {r.usedFor}
            </p>
            <h2 className="mt-3 text-3xl">{r.title}</h2>
            <p className="mt-2 max-w-[70ch] whitespace-pre-line leading-relaxed">{r.body}</p>
            <form action={moderateReviewAction} className="mt-4 flex gap-3">
              <input type="hidden" name="id" value={r.id} />
              <button name="decision" value="approve" className="border-[3px] border-ink bg-ink px-4 py-2 label-mono text-paper hover:bg-pink hover:text-ink-deep">
                Approve
              </button>
              <button name="decision" value="reject" className="border-[3px] border-ink px-4 py-2 label-mono hover:bg-pink-tint">
                Reject
              </button>
            </form>
          </li>
        ))}
      </ul>
    </>
  );
}
