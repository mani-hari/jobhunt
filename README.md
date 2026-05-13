# Archana Job Hunter

A lightweight, self-hosted job discovery + application workspace built for
Archana Hariharan's job search in Canada.

- **Hosting:** Vercel (free tier is fine)
- **Database:** Neon Postgres (free tier)
- **AI:** Google Gemini API (`gemini-2.5-flash` by default)
- **Framework:** Next.js 14 (App Router) + Tailwind + Prisma + TanStack Query

## What it does

- Aggregates job listings from:
  - **Adzuna** (free, 250/day) — Canada-wide job board aggregator
  - **JSearch via RapidAPI** (free, 200/mo) — pulls LinkedIn / Indeed / Glassdoor
  - **RemoteOK** (free, no key) — remote-first roles
  - **Canada Job Bank** (free) — official Canadian listings
  - **Greenhouse / Lever / Ashby** (free, no key) — direct ATS feeds for
    companies you track in Settings → Company Boards
  - **Google Programmable Search** (free, 100/day) — `site:linkedin.com/jobs`
    style queries to surface postings the APIs miss
- Scores each role against your profile via Gemini.
- Lets you shortlist roles, generate tailored resumes + cover letters + fit
  analyses, and track applications through a simple pipeline.

## Pages

| Path           | Purpose                                          |
| -------------- | ------------------------------------------------ |
| `/`            | Jobs feed (filters, scoring, slide-over detail)  |
| `/shortlist`   | CRM-style list of saved jobs                     |
| `/applications`| Generated materials + status pipeline            |
| `/settings`    | Keywords, resume upload, preferences             |

## Local setup

1. Install deps: `npm install`
2. Copy env: `cp .env.example .env.local`
3. Fill in:
   - `DATABASE_URL` — your Neon pooled connection string
   - `GEMINI_API_KEY` — from https://aistudio.google.com/apikey
   - `ADZUNA_APP_ID` / `ADZUNA_APP_KEY` — from https://developer.adzuna.com
   - `RAPIDAPI_KEY` (optional) — for JSearch
4. Push schema to Neon: `npm run db:push`
5. Seed default keywords + settings: `npm run db:seed`
6. Dev: `npm run dev` → http://localhost:3000

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import into Vercel. Framework preset: Next.js.
3. Add the env vars in the Vercel project dashboard.
4. After first deploy, run `npm run db:push` once against the Neon DB
   (you can do this locally pointing at the production `DATABASE_URL`).
5. `vercel.json` schedules a refresh every 6 hours via Vercel Cron.

## Notes & constraints

- **No LinkedIn scraping.** Use JSearch for LinkedIn-aggregated data.
- **No automated applications** — materials are prepared; you apply via the
  original posting link.
- The Resume upload extracts text from the PDF and stores only the text in
  Postgres. The file itself is not persisted (Vercel serverless is ephemeral).
- API keys are optional in dev — missing source keys simply skip that source;
  missing `GEMINI_API_KEY` disables scoring + generation.

## Quick health check

`GET /api/health` returns which integrations are configured.
