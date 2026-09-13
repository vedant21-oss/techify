import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { PROFILES } from "@/lib/engine";
import type { ParsedQuery } from "./types";

const MODEL = "claude-opus-5";

const ParsedQuerySchema = z.object({
  category: z.enum(["laptop", "phone"]).nullable(),
  useCase: z
    .enum(["gaming", "coding", "video-editing", "student", "all-rounder", "photography", "battery", "budget"])
    .nullable(),
  budget: z.number().int().nullable(),
});

const useCaseGuide = (Object.entries(PROFILES) as [string, typeof PROFILES.laptop][])
  .map(([category, profiles]) => `${category}: ${profiles.map((p) => `"${p.id}" (${p.description})`).join("; ")}`)
  .join("\n");

const SYSTEM_PROMPT = `You turn a shopper's sentence into search filters for an Indian laptop and phone recommender.

Return:
- category: "laptop" or "phone", or null if the sentence doesn't make it clear.
- useCase: the single primary use case, chosen only from that category's list below. When several are mentioned, pick the main one; qualifiers like "light", "occasional" or "a bit of" mark a secondary use. Null if none is stated.
- budget: the maximum price in whole rupees, or null if no price is given. "k" means thousand, "lakh"/"lac"/"L" means 100,000. For a range, use the upper bound. Ignore numbers that are specs (RAM, mAh, storage, refresh rate).

Use cases:
${useCaseGuide}`;

let client: Anthropic | null | undefined;

function getClient(): Anthropic | null {
  if (client !== undefined) return client;
  if (process.env.TECHIFY_QUERY_PARSER === "rules") return (client = null);
  try {
    client = new Anthropic({ timeout: 20_000, maxRetries: 1 });
  } catch {
    // No credentials configured: stay on the rule-based parser.
    client = null;
  }
  return client;
}

/** Returns null when Claude isn't configured or can't answer, so callers can fall back. */
export async function parseQueryWithClaude(query: string): Promise<ParsedQuery | null> {
  const anthropic = getClient();
  if (!anthropic) return null;

  try {
    const response = await anthropic.beta.messages.parse({
      model: MODEL,
      max_tokens: 1024,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: query }],
      output_config: { effort: "low", format: betaZodOutputFormat(ParsedQuerySchema) },
    });
    if (response.stop_reason === "refusal" || !response.parsed_output) return null;
    return response.parsed_output;
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
      // Credentials are missing or invalid; don't retry on every request.
      client = null;
    } else if (error instanceof Anthropic.APIError) {
      console.warn(`Claude query parsing failed (${error.status}); using rules.`);
    } else {
      console.warn("Claude query parsing failed; using rules.", error);
    }
    return null;
  }
}
