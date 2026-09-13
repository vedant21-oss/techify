# Techify

Pick the right laptop or phone for your budget and use case. Techify ranks devices sold in India by how well their real specs fit what you'll do with them, and explains every pick in plain English.

## How the scoring engine works

The engine lives in [`src/lib/engine`](src/lib/engine). It's a framework-free TypeScript module with its own unit tests.

1. **Pool.** Take every device in the category priced at or under the budget.
2. **Normalise.** Tiered specs (CPU, GPU, camera, display) are already on a 0–100 scale. Raw specs (RAM, storage, battery, charging, weight) are mapped onto fixed market reference ranges, with a log scale where each doubling matters equally. Each spec is also ranked min–max within the pool. The sub-score is a 50/50 blend of the two.
3. **Weight.** Each use case has its own weights (they sum to 1). The weighted sum is the starting score.
4. **Baselines.** Missing a use case's essential spec (for example, GPU for gaming) scales the score down by 1.5% per point short, capped at 35%. This stops a great screen from carrying integrated graphics to the top of a gaming list.
5. **Rank, value, explain.** Devices are ranked by match score. Value score = match score ÷ price, rescaled so the best value in the pool is 100. Explanations are generated from the same breakdown.

## Features

- **Laptop and phone finders** at `/laptops` and `/phones`: budget slider, use case, ranked results with plain-English explanations, match vs value sort, and filters (brand, RAM, storage, name) that hide results without re-scoring them.
- **Compare** up to three devices side by side.
- **Device pages** with a score breakdown, "Cheaper, nearly as good" and "Better for the same money" alternatives, similar devices, and store links.
- **Search** any model, brand or chip from the header (`/search`).
- **Saved list and recently viewed** (`/saved`), stored in the browser with no login.
- **Picks** (`/picks`): phone and laptop of the week (rotates Mondays through the best-value strong all-rounders) and of the year (best all-rounder released that year). The rule is printed on each card.
- **Price-drop alerts**: email plus target price. A daily job emails when a price reaches the target; every email has a one-click stop link. Free plan: 3 active alerts.
- **Techify Pro** (`/pro`): one-time Razorpay payment (default ₹99) for unlimited alerts. The payment is only marked paid after Razorpay's signature verifies on the server.

## Free-text search

Type "laptop under seventy thousand for coding and light gaming" and Techify fills in the category, use case and budget for you (`POST /api/parse-query`).

- With `ANTHROPIC_API_KEY` set, Claude (`claude-opus-5`, structured output, server-side refusal fallback) reads the sentence.
- Without a key, or if the call fails, a tested keyword parser in [`src/lib/nl-query/rules.ts`](src/lib/nl-query/rules.ts) takes over. It understands `70k`, `₹45,000`, `1.5 lakh` and number words like "seventy thousand".

Anything the sentence leaves out falls back to the finder's defaults, and the UI says what was assumed.

## Stack

Next.js 16 (App Router) · TypeScript · Prisma 7 + Postgres · Tailwind CSS 4 · shadcn/ui · Anthropic SDK · Vitest

## Getting started

```bash
npm install
cp .env.example .env
npm run db:dev          # local Postgres via Prisma; leave running. URL matches .env.example
npm run db:migrate      # in a second terminal
npm run db:seed
npm run dev
```

```bash
npm test                # engine and query-parser unit tests
npm run typecheck
npm run lint
```

## API

| Route | Purpose |
| --- | --- |
| `GET /api/recommend?category=laptop&useCase=gaming&budget=90000&sort=match` | Ranked, explained results |
| `GET /api/devices/:slug?useCase=gaming&budget=90000` | One device scored in context |
| `GET /api/compare?slugs=a,b,c&useCase=gaming&budget=90000` | Up to three devices of one category |
| `POST /api/parse-query` `{"query": "phone under 30k for photography"}` | Sentence → category, use case, budget |
| `GET /api/devices?slugs=a,b` | Device records for saved lists |
| `POST /api/alerts` `{"email", "slug", "targetPrice"}` | Create or update a price-drop alert |
| `GET /api/cron/price-alerts` | Send due alert emails (`Authorization: Bearer $CRON_SECRET` in production) |
| `POST /api/pro/order` `{"email"}` / `POST /api/pro/verify` | Razorpay order and signature verification for Pro |

## Payments and email setup

Both are optional; the site works without them and says so in the UI.

- **Razorpay**: set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` (use `rzp_test_` keys while developing) and optionally `TECHIFY_PRO_PRICE_INR`.
- **Email**: set `RESEND_API_KEY`, `ALERTS_FROM_EMAIL` (a verified sender domain in Resend) and `APP_URL`. Without them, alert emails are printed to the server log.
- **Daily check**: `vercel.json` schedules `/api/cron/price-alerts` at 09:00 IST. Set `CRON_SECRET` in Vercel. Locally, run `npm run alerts:check` after changing prices.

Use cases: laptops `gaming`, `coding`, `video-editing`, `student`, `all-rounder`; phones `photography`, `gaming`, `battery`, `budget`, `all-rounder`.

## Data

Seed data is in [`src/data`](src/data): 21 laptops and 22 phones. Prices are approximate street prices, and the 0–100 tiers are curated from public benchmark standings. Edit the files and run `npm run db:seed` again; it upserts by slug and removes devices that are no longer listed.

## Deploying to Vercel

1. Create a hosted Postgres database (Neon, Supabase, Prisma Postgres, …).
2. Set `DATABASE_URL` in the Vercel project settings.
3. Run `npx prisma migrate deploy && npm run db:seed` against that database once.
4. Deploy. `npm run build` runs `prisma generate` automatically.
