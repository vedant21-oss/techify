import { z } from "zod";
import { getLists, mergeLists, RECENT_LIMIT, replaceList, SAVED_LIMIT } from "@/lib/server/account";
import { getCurrentUser } from "@/lib/server/auth";

const slugs = (max: number) => z.array(z.string().min(1).max(120)).max(max);
const mergeSchema = z.object({ saved: slugs(SAVED_LIMIT), recent: slugs(50) });
const putSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("SAVED"), slugs: slugs(SAVED_LIMIT) }),
  z.object({ kind: z.literal("RECENT"), slugs: slugs(RECENT_LIMIT) }),
]);

const unauthorized = () => Response.json({ error: "Log in to sync your lists." }, { status: 401 });

/** GET /api/account/lists — the account's saved list and recent history (slugs, newest first). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  return Response.json(await getLists(user.id));
}

/** POST /api/account/lists { saved, recent } — merge this browser's lists into the account. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const parsed = mergeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid lists" }, { status: 400 });
  return Response.json(await mergeLists(user.id, parsed.data));
}

/** PUT /api/account/lists { kind, slugs } — replace one list after a change in the browser. */
export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const parsed = putSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid list" }, { status: 400 });
  await replaceList(user.id, parsed.data.kind, parsed.data.slugs);
  return new Response(null, { status: 204 });
}
