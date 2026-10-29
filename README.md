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
- **Help me choose** (`/quiz`): six questions become custom weights and a budget, then open the finder.
- **Fine-tune weights**: sliders in the finder turn a preset into "your mix". The baselines of the preset still apply, and the mix is kept in the URL (`w=gpu.40,cpu.25`).
- **Must-haves** (OLED, 120Hz, telephoto, RTX, 16GB+ RAM, under 1.5 kg, …) remove devices before ranking, so scores are computed only against devices that qualify (`must=oled,hz120`).
- **"Why isn't it #1?"** on every device page: the points lost to the leader, factor by factor, plus a link to the head-to-head.
- **Head-to-heads** at `/vs/a-vs-b`: a verdict for every use case, with both devices scored against the category up to the pricier one's price.
- **Price history** chart on device pages and a **price drops** page (`/deals`) listing devices whose recorded price fell at least 3%.
- **Upcoming launches** (`/upcoming`) with a one-time "notify me" email when a device launches.
- **Owner reviews** on device pages. Reviews are held for moderation before they appear.
- **Admin dashboard** (`/admin`, password protected): update prices (records history and runs alert checks), approve or reject reviews, add upcoming devices and mark them launched.
- **Spec glossary**: terms like OLED, LTPO, RTX, mAh and telephoto get a plain-English tooltip wherever specs are listed.
- **Share images**: `/api/og` renders 1200×630 cards for finder, device and head-to-head links.
- **Hindi**: the language switch in the header translates navigation, the finder, device pages, the quiz, picks, deals, upcoming launches and the landing page. The engine's explanations are phrased in Hindi from the same selected points, so both languages always agree. Compare, head-to-head, search, saved, Pro, how-it-works and admin pages stay in English, as do device names and spec values.
- **Best lists** (`/best`): ready-made shortlists like `/best/phones-under-20000` and `/best/gaming-laptops-under-90000`, each one a saved finder query, so the ranking updates itself as prices change.
- **Brand pages** (`/brands`, `/brand/apple`): every device tracked for a brand, cheapest first, with the price range on the hub.
- **About, FAQ, Contact, Privacy and Terms** pages. The contact form emails `CONTACT_EMAIL` (or `ALERTS_FROM_EMAIL`), and prints to the server log when neither is set.
- **Press sounds**: the speaker button in the header scores the landing page's opening print — the plate knocks, the ink roller sweeps, the proof counter ratchets along its own easing curve and the sheet pulls away — plus a tick and knock on the hero buttons and cards. Everything is synthesized with Web Audio, so there are no audio files to download. Off by default, remembered per browser, and skipped with reduced motion.
- **Accounts** (`/login`, `/signup`, `/account`): email and password. Logging in syncs the saved list and recently viewed across devices, lists every price alert and launch email with a stop button, keeps Pro with the account, and writes reviews under the account name. Alerts and Pro bought with an email only attach once that email is confirmed through the link sent at sign-up. Passwords are hashed with scrypt, sessions are random tokens stored only as hashes, five wrong passwords lock the account for 15 minutes, and password reset links expire after an hour and work once. Without Resend configured, confirmation and reset emails are printed to the server log.
- **Card offers and EMI**: pick your bank card (credit or debit, and whether you'll pay in EMI) in the finder, and results rank on the price after that card's best offer, so a ₹43k phone with ₹4k off shows up in a ₹40k search. Offers never stack; the biggest one you qualify for wins. Device pages list the offers running and an EMI calculator (3–24 months, reducing balance, with the 18% GST banks charge on interest). No-cost EMI is worked out as stores run it: the interest comes off the price up front, and GST on that interest is still shown. Offers are entered by hand at `/admin/offers` and stop applying on their end date. The choice is kept in the URL (`pay=hdfc-credit-emi`).
- **Upgrade checker** (`/upgrade`): pick the phone or laptop you have now, including popular older models no longer sold (2018 onwards, in [`src/data/owned.ts`](src/data/owned.ts)), plus a use case and budget. It's scored in the same pool as everything on sale, with price taken out of the weights, and the page shows the cheapest real upgrade, the biggest, and the most upgrade per rupee, with what gets better and what you'd give up. A clear upgrade is 10+ match points and a big one 20+. When the use case has essential specs (graphics for gaming, the camera for photography), a device must also be better on one of them and worse on none, so a thin laptop never "upgrades" a gaming laptop. Device pages link to it ("Own this one?").
- **Ads** (`/admin/ads`): self-served sponsored slots on the home page, among finder results (after the top three, with no rank number) and beside device details. Each has an advertiser, headline, one line of copy, a button and a link (https:// or a path on the site), can target phone or laptop pages, promote a catalogue device (showing its live price), run between dates and rotate by weight. Every ad is labelled "Ad" with the advertiser's name; the scoring engine never reads them, and best lists and rankings never contain them. Views are counted once an ad is half on screen and clicks through a redirect that only ever goes to the ad's stored, re-validated link; both are plain totals, with no cookies.
- **Affiliate links**: set `AMAZON_ASSOCIATE_TAG` / `FLIPKART_AFFILIATE_ID` and store links carry them with `rel="sponsored"`. Rankings never use them.

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

## Deploying to Vercel

1. **Database.** In the Vercel project, open Storage → Create Database → Neon (Postgres) and connect it to the project for Production and Preview. That sets `DATABASE_URL` (pooled, used by the app) and `DATABASE_URL_UNPOOLED` (direct, used for migrations).
2. **Environment variables.** Under Settings → Environment Variables add at least `APP_URL` (the site's public address), `ADMIN_PASSWORD` and `CRON_SECRET`. The rest in `.env.example` are optional.
3. **Deploy.** `npm run build` runs `prisma migrate deploy`, so every deploy brings the database schema up to date before building.
4. **Seed once.** From your machine: `DATABASE_URL="<the Neon unpooled URL>" npm run db:seed` to load the catalogue.

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
| `POST /api/contact` `{"name", "email", "subject", "message"}` | Message from the contact form |
| `POST /api/reviews` `{"slug", "name", "email", "rating", "title", "body", "usedFor", "ownedMonths"}` | Submit an owner review (held for moderation) |
| `POST /api/upcoming/subscribe` `{"slug", "email"}` | One-time launch email for an upcoming device |
| `GET/POST/PUT /api/account/lists` | Logged-in saved list and history: read, merge this browser's lists, replace one list |
| `GET /api/og?kind=device&slug=…&useCase=…` | Share image (`kind` = `finder`, `device`, `vs` or default) |

`/api/recommend` answers in the visitor's language (the `techify_lang` cookie, `en` or `hi`). Finder URLs also accept `w` (custom weights) and `must` (comma-separated must-have ids).

## Payments and email setup

Both are optional; the site works without them and says so in the UI.

- **Razorpay**: set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` (use `rzp_test_` keys while developing) and optionally `TECHIFY_PRO_PRICE_INR`.
- **Email**: set `RESEND_API_KEY`, `ALERTS_FROM_EMAIL` (a verified sender domain in Resend) and `APP_URL`. Without them, alert emails are printed to the server log.
- **Daily check**: `vercel.json` schedules `/api/cron/price-alerts` at 09:00 IST. Set `CRON_SECRET` in Vercel. Locally, run `npm run alerts:check` after changing prices.

Use cases: laptops `gaming`, `coding`, `video-editing`, `student`, `all-rounder`; phones `photography`, `gaming`, `battery`, `budget`, `all-rounder`.

## Data

Seed data is in [`src/data`](src/data). Prices are approximate street prices, and the 0–100 tiers are curated from public benchmark standings. Edit the files and run `npm run db:seed` again; it upserts by slug, removes devices that are no longer listed, records a price-history point whenever a price changes, and upserts the upcoming launches in `src/data/upcoming.ts`.

## Deploying to Vercel

You need a Vercel account and a hosted Postgres database. Neon's free tier works well and connects from the Vercel dashboard.

1. **Database.** Create a Postgres database (Vercel → Storage → Neon, or Neon, Supabase or Prisma Postgres directly). Copy its connection string; use the pooled URL if you're offered one.
2. **Schema and data.** From your machine, point at that database once:
   ```bash
   DATABASE_URL="postgres://…" npx prisma migrate deploy
   DATABASE_URL="postgres://…" npm run db:seed
   ```
3. **Import the repo.** Vercel → Add New → Project → pick the GitHub repo. The defaults are right: framework Next.js, build command `npm run build` (it runs `prisma generate`).
4. **Environment variables** (Project → Settings → Environment Variables):

   | Variable | Needed for |
   | --- | --- |
   | `DATABASE_URL` | Everything (required) |
   | `APP_URL` | Links in emails and share images, e.g. `https://techify.vercel.app` |
   | `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` | `/admin` (locked until set) |
   | `CRON_SECRET` | The daily price-alert job (Vercel sends it automatically) |
   | `RESEND_API_KEY`, `ALERTS_FROM_EMAIL` | Sending alert and launch emails |
   | `CONTACT_EMAIL` | Where contact-form messages go |
   | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `TECHIFY_PRO_PRICE_INR` | Pro payments |
   | `ANTHROPIC_API_KEY` | Claude reading free-text searches (keyword parser otherwise) |
   | `AMAZON_ASSOCIATE_TAG`, `FLIPKART_AFFILIATE_ID` | Affiliate store links |

5. **Deploy.** The cron in `vercel.json` starts running once the project is on a plan that includes cron jobs.
6. **Later schema changes:** run `npx prisma migrate deploy` against the production `DATABASE_URL` before (or as part of) the deploy that needs them.
