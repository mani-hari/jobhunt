# CLAUDE.md — Handoff for the ARCS Job Hunter project

This file is auto-loaded by Claude Code at session start. Read it once, then
start work. Don't re-read it unless you've forgotten the architecture.

---

## What this is

A personal job-discovery + application workspace built for **Archana Hariharan** —
7+ years business / data analyst in Canadian financial services, returning to
work after a ~1.4-year planned career break, based in Toronto.

Live preview: `https://jobhunt-git-claude-jobhuntv1-manihk.vercel.app`
Repo: `mani-hari/jobhunt` (this one)
GitHub MCP scope is restricted to this repo only.

---

## Stack (pin these unless explicitly asked to change)

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| UI | Tailwind + custom design system (`src/components/ui`) — light / serif / cool-blue |
| Data layer | Prisma (`@prisma/client` 5.x) on **Neon Postgres** via `@prisma/adapter-neon` + `@neondatabase/serverless` (WebSocket driver) |
| State | TanStack Query |
| AI | Anthropic `@anthropic-ai/sdk` (`^0.96`) — Haiku 4.5 for scoring/keyword expansion, Opus 4.7 for resume/cover/email generation |
| PDF parsing | `pdf-parse` (CommonJS — dynamic import in the resume route) |
| Hosting | Vercel (preview + prod). Cron in `vercel.json` runs `/api/jobs/refresh` every 6h. |

Design tokens, fonts (Source Serif 4 + Plus Jakarta Sans), and the colour
palette are defined in `tailwind.config.ts` and `src/app/globals.css`.

---

## What's in the repo

```
docs/                      Persona + candidate context (loaded as Claude system prompt)
  soul.md                  Maya — the AI consultant persona
  archana.md               Live candidate profile
prisma/
  schema.prisma            Source of truth for DB schema
  setup.sql                Hand-runnable SQL (Neon SQL Editor) when Prisma CLI can't reach :5432
  seed.ts                  Default keywords + 19 verified ATS board slugs
src/app/                   Next.js routes (App Router)
  page.tsx                 Jobs feed (home)
  JobsView.tsx             Filters / quote / stats / row list / auto-rate / re-scrape
  jobs/[id]/               Job detail page (real route, not a slide-over)
  shortlist/               Shortlist (reuses JobRow)
  applications/            Pipeline view with Resume A / Resume B / Cover / Email panes
  deleted/                 Soft-deleted jobs (status='deleted', not re-fetched)
  settings/                Keywords / Resume PDF upload / Preferences / Company Boards
  api/
    health/                Reports which integrations are wired
    jobs/                  CRUD + refresh + auto-score + per-job score + generate
    keywords/              Keyword CRUD; POST calls Anthropic to expand titles
    settings/              GET/PUT singleton row
    resume/                PDF upload + text extraction
    company-boards/        Manage Greenhouse/Lever/Ashby tracked companies
    stats/                 Scorecard counters
src/components/
  jobs/                    JobRow, SidebarFilters, JobNav (prev/next), QuoteBanner,
                           StatsBar, BulkBar, ScoreBar
  ui/                      Button, Card, Modal, SlideOver, Input, Tag, Toggle, Empty
  Sidebar.tsx              Left nav ("ARCS Job Hunter")
  PageHeader.tsx           Sticky page header
src/lib/
  anthropic.ts             *** Main AI helper — read this first ***
  ai/scoring.ts            scoreJobById() + scoreUnscoredJobs() (Auto-rate)
  ai/generate.ts           generateApplicationMaterials() — single Opus call → 5 artifacts
  db.ts                    Prisma client wired to Neon serverless adapter
  sources/                 Job source connectors (Adzuna, JSearch, RemoteOK, JobBank,
                           Greenhouse, Lever, Ashby, Google CSE) + dedupe match helper
  quotes.ts                ~20 curated quotes (Sai Baba, women + individual empowerment)
  companyBlurb.ts          Extracts "About <Company>" snippet from job description
  format.ts                timeAgo, formatSalary, scoreColor, scoreLabel
  types.ts                 JobStatus union, ScoreDetails, NormalizedJob
vercel.json                Region pin + cron schedule
```

---

## How the AI works (read `src/lib/anthropic.ts` first)

1. **Persona loader.** `loadPersona()` reads `docs/soul.md` + `docs/archana.md`
   once per process and returns a single concatenated string (~5K tokens).
2. **Prompt caching.** Every Claude call passes the persona as a single
   `system` block with `cache_control: { type: "ephemeral" }`. After the
   first call per process, subsequent calls within ~5 minutes read at 0.1x
   cost. **If you edit either soul.md or archana.md, the cache invalidates
   on next call — that's expected.**
3. **Two models.**
   - `ANTHROPIC_SCORING_MODEL` (default `claude-haiku-4-5`) — scoring +
     keyword expansion. Structured JSON output via `output_config.format`.
   - `ANTHROPIC_GENERATION_MODEL` (default `claude-opus-4-7`) — resume +
     cover + email + fit. Adaptive thinking + `effort: high`. Returns
     **two resume variants** (impact-led + skills-led) in a single call.
4. **Persona enforcement.** Maya's rules in `soul.md` are load-bearing —
   no cliché words, two-option recommendations, returner-aware framing.
   Don't soften the persona without good reason.

Opus 4.7 specifics (from the Claude API skill): `temperature` / `top_p` /
`top_k` and `budget_tokens` all return 400. Only adaptive thinking is
supported. Don't add those parameters.

---

## Database

Neon Postgres. Connection string is in `.env.local` (gitignored) — pooled URL
with `-pooler` in the host.

### Schema is in `prisma/schema.prisma`

Tables: `Keyword`, `Job`, `Resume`, `CompanyBoard`, `Settings`.

### Migrations: two paths

- **Preferred:** `npm run db:push` (Prisma CLI). Reads `.env`, not `.env.local`
  — symlink or copy if needed: `cp .env.local .env`.
- **Sandbox fallback:** Prisma CLI uses TCP 5432 directly. Some environments
  (including the sandboxed one used to build this) block that — in which case
  paste `prisma/setup.sql` into the **Neon SQL Editor**. The file is idempotent
  (uses `IF NOT EXISTS` + `ON CONFLICT DO NOTHING`) and includes
  `ALTER TABLE` shims for incremental columns at the top.
- **Live edits via Node:** `@neondatabase/serverless` works over HTTPS, so a
  one-off `node --env-file=.env.local -e "const {neon}=...; ..."` always works
  regardless of port blocks.

Whenever you add a column to `schema.prisma`, also (a) add the matching
`ALTER TABLE IF EXISTS ... ADD COLUMN IF NOT EXISTS` to `setup.sql` and
(b) run the ALTER live against Neon before deploying.

---

## Environment variables

Local file: `.env.local` (gitignored). Vercel project: **Settings → Environment
Variables** (one entry per var, scope = Production + Preview + Development).
**Do not paste quote characters in Vercel — they're stored literally.**

| Var | Required | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ | Pooled Neon URL |
| `ANTHROPIC_API_KEY` | ✅ | Key with access to Haiku 4.5 + Opus 4.7 |
| `ANTHROPIC_SCORING_MODEL` | optional | Default `claude-haiku-4-5` |
| `ANTHROPIC_GENERATION_MODEL` | optional | Default `claude-opus-4-7` |
| `ADZUNA_APP_ID`, `ADZUNA_APP_KEY` | optional | 250 req/day free; covers Canada |
| `RAPIDAPI_KEY` | optional | JSearch (LinkedIn / Indeed / Glassdoor aggregator) |
| `GOOGLE_SEARCH_API_KEY`, `GOOGLE_SEARCH_ENGINE_ID` | optional | Google CSE; 100/day free |

`/api/health` returns which integrations are wired and the active model IDs.
Hit it after any env change.

---

## Job source connectors

In `src/lib/sources/`. Each file is a thin adapter that returns
`NormalizedJob[]`. Dedupe is enforced by a SHA-1 hash of
`title|company|location` (`src/lib/hash.ts`) → unique index on `Job.dedupeHash`.
Deleted jobs keep their hash, so they're never re-fetched.

ATS connectors (Greenhouse / Lever / Ashby) iterate every active row in
`CompanyBoard` and filter by keyword + location. Slug seed list in
`prisma/seed.ts` is **verified** — bad slugs return 404 silently. If you add
companies, probe their slug first.

---

## Branching

| Branch | Purpose |
|---|---|
| `main` | Production target |
| `claude/jobhuntv1` | Active dev branch; Vercel preview deploys from here |
| `claude/jobhuntv1-anthropic-wip` | Old WIP from the migration; superseded — safe to delete |
| `claude/jobhuntv1-zFMmb` | Auto-generated by a prior agent; ignore |

**Open PR:** [#2 — Switch all AI to Claude (Haiku + Opus); add Maya consultant
persona, Auto-rate, dual resume variants](https://github.com/mani-hari/jobhunt/pull/2).
Merge to ship the Anthropic switch + persona work to `main`.

---

## How to develop

```sh
npm install
cp .env.example .env.local   # then paste real keys
npm run dev                  # http://localhost:3000

# Schema changes:
#   1. Edit prisma/schema.prisma
#   2. Apply: npm run db:push      (preferred) OR paste ALTER into Neon SQL Editor
#   3. Mirror the change in prisma/setup.sql
#   4. Update src/components/jobs/types.ts if it's a Job column

# Build verification before pushing:
npm run build                # runs prisma generate + next build (strict typecheck)
```

The dev server uses `.env.local`; the Prisma CLI uses `.env`. Keep them in
sync (or symlink: `ln -s .env.local .env`).

---

## Conventions

- **One source of truth for AI persona.** All prompts route through
  `src/lib/anthropic.ts`. If you find yourself writing a prompt inline in a
  route, lift it into anthropic.ts as a named function.
- **Maya doesn't use emoji or exclamation marks.** Her output is reviewed by a
  candidate who's actively job-hunting — preserve the tone.
- **JobRow is the single card primitive.** Used by Jobs and Shortlist. If a
  page needs a different list-item shape, prefer adding a prop to JobRow over
  building a new component.
- **Filter state lives in URL params** (`?range=7d&type=remote,onsite&...`).
  This is what makes Previous/Next on the detail page filter-aware. Don't
  move it back to React state.
- **Status enum on Job:** `discovered | shortlisted | resume_generated | applied | interview | offer | rejected | hold | deleted`. New statuses go in `src/lib/types.ts` AND the `STATUSES` list in `applications/ApplicationsView.tsx`.
- **No `temperature`, `top_p`, `top_k`, or `budget_tokens` on Opus 4.7
  calls.** They 400. Use `thinking: {type: "adaptive"}` and
  `output_config: {effort: ...}`.
- **Comments**: write WHY when it's non-obvious; never narrate WHAT.
- **No new READMEs / docs**: don't create *.md files unless explicitly asked.
  Editing existing docs (soul.md, archana.md, this file) is fine.

---

## Common gotchas

| Symptom | Cause |
|---|---|
| `Authentication failed for user 'neondb_owner'` | Stale password in `.env.local`. Reset in Neon Console → Roles. |
| Vercel build fails with TS error on `@ts-expect-error` | Strict mode rejects unused directives. Delete the comment. |
| `Request to ... 5432 ECONNREFUSED` from Prisma CLI | Sandbox blocks raw Postgres port. Use `setup.sql` via Neon SQL Editor. |
| Quote text on Vercel includes literal `"..."` characters | Quotes pasted with the value in Vercel UI. Remove and re-save without surrounding quotes. |
| `cache_read_input_tokens: 0` on repeated AI calls | Persona text changed between calls. Check that `loadPersona()` is cached and not re-read per request. |
| JSearch returns 0 jobs | `search-v2` wraps results in `data.jobs`, not `data`. Already handled in `src/lib/sources/jsearch.ts` — don't regress. |
| Greenhouse/Lever board 404 | Slug doesn't exist on that ATS. Probe with `curl https://boards-api.greenhouse.io/v1/boards/<slug>/jobs` before adding to seed. |
| Opus generation returns truncated JSON | Token budget too low. `geminiJson` is gone — current `anthropic.ts` uses `output_config.format` with `json_schema` and `max_tokens: 16000`. Don't reduce. |

---

## Pending features (Tier 1 picks from the last conversation)

The user already considered these and may pick them up. Don't build
unsolicited — confirm scope first.

1. **ATS keyword match report** per job (extract noun phrases from JD, compare
   to resume, show match % and missing keywords). Highest immediate value.
2. **Daily Brief** on the home page — top 5 new strong-fits today, follow-up
   due count, upcoming interviews.
3. **Interview Prep Pack** — auto-fires when status flips to
   `interview`. Generate likely behavioral + technical questions tailored to
   the JD + Archana's actual experience.
4. **Hiring Manager Finder** — construct LinkedIn search URLs likely to
   surface the right contact for a shortlisted role.
5. **Multi-resume / multi-narrative profiles** (currently generation produces
   two variants per call; this would let her maintain different *base*
   profiles for BA vs Data Analyst vs AI Automation angles).
6. **Follow-up nudges** — when applied + 7d with no status change, surface a
   prompt with a generated polite nudge email.
7. **Network cross-reference** — upload her LinkedIn connections CSV, flag
   "you have N connections at <shortlisted company>".

Less urgent: ATS keyword heatmap, salary intelligence, visa/auth tagging,
confidence tracker.

---

## When you start

1. Read `src/lib/anthropic.ts` to internalize how Claude calls are shaped.
2. Glance at `docs/soul.md` so you know Maya's voice before generating any
   user-facing copy.
3. Check `/api/health` on the Vercel preview URL to confirm env vars are
   wired (`anthropic: true` is the important one).
4. Pull the latest from `claude/jobhuntv1` before starting new work. If PR
   #2 has been merged, rebase against `main` instead.
5. For any new requirements: ask the user one clarifying question before
   building if scope is ambiguous (especially: "is this for the deployed app
   or just a local feature?", "do you want a confirmation modal here?",
   "should this be opt-in or default?"). The user values short, direct
   answers; mirror that.
