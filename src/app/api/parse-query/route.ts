import { z } from "zod";
import { parseQueryWithClaude } from "@/lib/nl-query/claude";
import { resolveQuery, UnclearCategoryError } from "@/lib/nl-query/resolve";
import { parseQueryWithRules } from "@/lib/nl-query/rules";
import { zodMessage } from "@/lib/query";

const bodySchema = z.object({ query: z.string().trim().min(3).max(300) });

/**
 * POST /api/parse-query { query: "laptop under 70k for coding" }
 * Turns a sentence into finder inputs. Uses Claude when credentials are configured
 * and falls back to the rule-based parser otherwise.
 */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: `Type a short description of what you need. (${zodMessage(parsed.error)})` }, { status: 400 });
  }

  const { query } = parsed.data;
  const rules = parseQueryWithRules(query);
  const claude = await parseQueryWithClaude(query);

  try {
    const result = claude ? resolveQuery(claude, rules, "claude") : resolveQuery(rules, rules, "rules");
    return Response.json(result);
  } catch (error) {
    if (error instanceof UnclearCategoryError) {
      return Response.json({ error: error.message }, { status: 422 });
    }
    throw error;
  }
}
