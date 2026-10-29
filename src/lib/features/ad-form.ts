import { z } from "zod";
import { safeAdUrl } from "./ads";

/*
 * Validation for the admin "add an ad" form. Kept apart from ./ads, which the
 * browser loads, so zod stays out of the client bundle.
 */

const dateOrBlank = z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]);

export const adFormSchema = z
  .object({
    advertiser: z.string().trim().min(2, "Name the advertiser.").max(40),
    headline: z.string().trim().min(4, "Write a headline.").max(70, "Keep the headline under 70 characters."),
    body: z.string().trim().min(4, "Write one line of copy.").max(160, "Keep the copy under 160 characters."),
    cta: z.string().trim().min(2, "Add button text.").max(24),
    url: z.string().transform((u, ctx) => {
      const safe = safeAdUrl(u);
      if (!safe) ctx.addIssue({ code: "custom", message: "The link must start with https:// or be a path on this site, like /phones." });
      return safe ?? "";
    }),
    // Checkboxes: only the ticked ones arrive.
    home: z.literal("on").optional(),
    results: z.literal("on").optional(),
    device: z.literal("on").optional(),
    category: z.enum(["", "PHONE", "LAPTOP"]).transform((c) => (c === "" ? null : c)),
    deviceSlug: z.string().trim().max(120),
    weight: z.coerce.number().int().min(1).max(10),
    startsAt: dateOrBlank,
    endsAt: dateOrBlank,
  })
  .transform(({ home, results, device, ...rest }) => ({
    ...rest,
    placements: [home && "HOME", results && "RESULTS", device && "DEVICE"].filter((p): p is "HOME" | "RESULTS" | "DEVICE" => Boolean(p)),
  }))
  .refine((a) => a.placements.length > 0, { message: "Pick at least one place to show it." })
  .refine((a) => !a.startsAt || !a.endsAt || a.startsAt < a.endsAt, { message: "The end date must be after the start date." });
