# Archana Job Hunter — Pipeline Requirements (Final)
> Hand this to Claude Code as the primary build spec.

---

## 1. App structure

```
LEFT NAV (240px)              MAIN CONTENT
─────────────────             ──────────────────────
[+ Add Pipeline]              (selected item content)

── Pipelines ──
  Business Analyst  28/5
  Data Analyst      14/3
  AI Automation      8/1

──────────────────
  Applications       9
  Settings
  Logs
```

- Pipelines are nav items. Click → detail page in main area.
- Applications: global view across all pipelines where apply status is set.
- Settings: resume upload, scoring preferences, personal info for form filling.
- Logs: debug log viewer — every system action, error, API call (see §17).

---

## 2. Add pipeline form

Modal triggered by "[+ Add Pipeline]".

**Fields:**

1. **Name** (required)
   - Placeholder: "e.g., Business Analyst, Data Governance, AI Automation"
   - Helper: "Name it after the role type. Keep each pipeline focused — one pipeline per job category."

2. **Keyword** (required, single)
   - Placeholder: "e.g., business analyst"
   - Helper: "One keyword per pipeline. Don't mix — create separate pipelines for different roles."
   - On entry → call Claude API for canonical title expansion
   - Show variations below as plain read-only text (not chips)

3. **Platforms** (required, multi-select checkboxes in two sections)

   ```
   End-to-end automation (search + auto-apply)
   Jobs from these platforms can be applied to automatically.
     ☐ Greenhouse
     ☐ Lever

   Search only (manual apply)
   Jobs will be fetched but you apply manually via the job link.
     ☐ LinkedIn (via JSearch)
     ☐ Indeed
     ☐ Adzuna
     ☐ Canada Job Bank
     ☐ RemoteOK
     ☐ We Work Remotely
     ☐ Remotive
     ☐ Wellfound
     ☐ Built In Toronto
     ☐ Dynamite Jobs
   ```

**Submit:** "Create Pipeline" → save to DB → appears in left nav → navigate to detail page.

---

## 3. Pipeline detail page

### Header (minimal plain text)

```
Business Analyst                                         Edit
business analyst, business systems analyst, BA specialist
Greenhouse, Lever, LinkedIn, Adzuna, Remotive · Created May 18, 2026
```

- Pipeline name as the page title (serif font).
- Second line: keyword + canonical variations as plain comma-separated text.
- Third line: platform names as plain text + created date.
- "Edit" link in top-right. Clicking makes keyword/platforms editable inline.
- If keyword changes: warn "Changing keyword clears all jobs. Continue?" → clear + re-expand.

### Two tabs

```
[Job Search (28)]    [Shortlist & Apply (5)]
```

---

## 4. Tab 1: Job search

### Toolbar

```
[Fetch Jobs]  Last fetched: 2h ago          Limit [20▼]  │  Auto-shortlist eligible ●──○
```

- **Fetch Jobs**: scrapes all selected platforms using keyword + canonical variations.
- **Last fetched**: timestamp, updates on fetch.
- **Limit**: dropdown (10/20/30/40). Results per platform. Default 20.
- **Auto-shortlist toggle**: when ON, jobs from Greenhouse/Lever automatically move to Tab 2 after fetch.

### Job cards (single column list)

```
☐  Senior Business Analyst                              ⚡ Auto    82
   Shopify · Toronto, ON · Greenhouse · 3 days ago
   Remote · Full-time
                                          [View]  [Shortlist]
```

- Checkbox for bulk selection
- Title (bold), company · location · platform · age
- Type tags (Remote/Hybrid/On-site, Full-time/Part-time/Contract)
- Score bar + number (green ≥75, amber 50-74, red <50)
- For Greenhouse/Lever jobs: small "⚡ Auto" badge
- For other platforms: small "↗ Open" badge
- "View" → slide-over with full description
- "Shortlist" → moves to Tab 2, triggers asset generation

**Bulk bar** (when 1+ selected):
```
3 selected    [Add to Shortlist]    [Clear]
```

**Filters** (optional pill row): Remote/Hybrid/On-site, Full-time/Part-time/Contract, score threshold.

---

## 5. Tab 2: Shortlist & apply

### Toolbar

```
5 shortlisted                    Auto-apply eligible ●──○
                                 ┌─────────────────────────┐
                                 │ Apply daily at:          │
                                 │ ☐ 8:00 AM  Toronto (ET) │
                                 │ ☐ 12:00 PM Toronto (ET) │
                                 │ ☐ 5:00 PM  Toronto (ET) │
                                 └─────────────────────────┘
```

- **Auto-apply toggle**: when ON, a schedule picker appears below it.
- **Schedule picker**: 3 fixed time slots, multi-select checkboxes.
  - 8:00 AM ET (morning — catches overnight postings)
  - 12:00 PM ET (midday)
  - 5:00 PM ET (end of day)
  - All times are Toronto Eastern Time. Label says "Toronto (ET)" explicitly.
  - User checks one or more. Multiple checked = multiple runs per day.
  - Each run applies ONLY to shortlisted jobs that have NOT already been applied to.
  - If there's nothing new to apply, the run completes silently (logged in Logs page).
- When toggle is OFF, the schedule picker is hidden.
- Schedule is saved per pipeline. Each pipeline can have its own schedule.
- Implementation: Vercel Cron (cron jobs in vercel.json) or a simple setInterval on the Railway worker. Cron hits `/api/pipelines/[id]/auto-apply-run` which checks the schedule and processes eligible jobs.

### What happens when a job enters this tab

1. Status → "shortlisted"
2. Background generation starts immediately:
   - Customized resume (.docx)
   - Customized cover letter (Markdown text)
   - 2-line fit summary
3. Card shows generation progress, then ready state.

### Shortlisted job card

```
Senior Business Analyst                              ⚡ Auto-apply
Shopify · Greenhouse · Score 82

┌──────────────────┐  ┌──────────────────┐
│ Resume (.docx)   │  │ Cover letter     │
│ ✓ Ready          │  │ ✓ Ready          │
│ [View] [↓]       │  │ [View] [Copy]    │
└──────────────────┘  └──────────────────┘

ATS-optimized: single-column, Calibri, proper heading styles, no tables/graphics

│ Strong fit — 6 of 8 required skills match. Data governance and stakeholder
│ management align directly. Highlight Power BI dashboard work at TD.

                              [Download .docx]  [Auto-Apply ⚡]
```

**Two asset boxes only: Resume and Cover Letter.** No separate fit report.

**Fit summary**: 2-line text with a left border accent (green = strong, amber = mixed). Generated by Claude alongside the resume. Not a separate asset — just inline text on the card.

**ATS rules line**: shown as a small muted text row between the asset boxes and the fit summary. Example: "ATS-optimized: single-column, Calibri, proper heading styles, no tables or graphics". This is static text, not generated — it describes the formatting rules the system followed.

**Action buttons by platform type:**
- Greenhouse/Lever: [Download .docx] + [Auto-Apply ⚡] (teal)
- All others: [Download .docx] + [Open & Apply ↗] (opens external URL)

**Status after applying:**
- ⚡ Auto-applying... (in progress)
- ✓ Applied via Lever · 20 minutes ago
- ✗ Failed — apply manually (with error on hover)
- ↗ Opened (user clicked Open & Apply)

**No PDF generation.** The .docx is the deliverable. The user exports to PDF from Word/Google Docs if needed — mature ecosystem, don't replicate.

**No Google Drive integration for now.** Stretch goal. The .docx download is sufficient.

---

## 6. Resume generation — ATS formatting rules

These rules MUST be followed by the Claude API resume generation prompt and the docx-js document builder. They are non-negotiable for ATS compatibility.

### Rules for the Claude API prompt (content)

1. **Single column layout.** No two-column designs, no sidebar sections.
2. **Section order:** Professional Summary → Technical Skills → Professional Experience → Education & Certifications.
3. **Professional Summary:** 3-4 lines. Tailored to the specific job. Mention the target role title and company by name.
4. **Quantify achievements.** Use numbers wherever the original resume allows. Don't fabricate.
5. **Mirror job description keywords naturally.** Not keyword stuffing — weave them into bullet points.
6. **No fabrication.** All facts must come from the candidate's actual resume. Reorder and emphasize, don't invent.
7. **Career gap handling:** Include a brief professional note: "{career_gap_note from Settings}" in the Professional Summary or as a one-line note after the most recent role.
8. **2 pages maximum.** Trim older or less relevant roles to fit.
9. **Use standard job titles.** Don't rename the candidate's actual titles.
10. **Output as clean Markdown** with H2 for section heads, bullet lists for experience, bold for company/title lines.

### Rules for the docx-js builder (formatting)

1. **Font:** Calibri 11pt for body text. Calibri 14pt bold for section headings. No other fonts.
2. **Heading styles:** Use actual Word heading styles (Heading1, Heading2) — not just bold text. ATS parsers rely on document structure, not visual formatting.
3. **No tables.** Not for layout, not for skills grids, not for anything. ATS parsers break on table-based layouts.
4. **No headers or footers.** Many ATS systems skip header/footer content entirely. Name and contact info go in the document body, not the header.
5. **No images, logos, or graphics.** No profile photos. No icons. No decorative lines (except a thin border on a paragraph if needed as a section divider).
6. **No text boxes.** Content must be in the normal document flow.
7. **Bullet points:** Use proper Word numbering/bullet config (LevelFormat.BULLET), never Unicode bullet characters.
8. **Margins:** 1 inch all sides (1440 DXA). Standard US Letter page size (12240 × 15840 DXA).
9. **Line spacing:** 1.15 for body text. 6pt spacing after paragraphs.
10. **Colors:** Black text only. No colored headings, no colored links. ATS strips colors.
11. **Contact info:** Name (16pt bold), then email | phone | location | LinkedIn URL — all on one or two lines at the top of the document body.
12. **File naming:** `{FirstName}_{LastName}_Resume_{CompanyName}.docx`

### ATS rules display in UI

Next to each generated resume card, show this static line:
```
ATS-optimized: single-column, Calibri, heading styles, no tables/graphics
```

When the user clicks "View" on the resume, the slide-over panel should show a small expandable section at the top:

```
▶ ATS formatting rules followed
```

Expanding it shows:
```
✓ Single-column layout (no sidebars)
✓ Calibri 11pt body / 14pt headings
✓ Proper Word heading styles (H1/H2)
✓ No tables, text boxes, or graphics
✓ No headers or footers
✓ Contact info in document body
✓ Black text only (no colors)
✓ Standard margins and spacing
✓ Keywords from job description integrated
✓ Filename: Archana_Hariharan_Resume_Shopify.docx
```

This gives Archana confidence the resume will parse correctly without her having to remember the rules.

---

## 7. Cover letter generation

Generated as plain Markdown text (not .docx). Displayed in the card's cover letter box.

- **View**: opens slide-over with rendered Markdown.
- **Copy**: copies plain text to clipboard (for pasting into application forms).
- No file download needed — cover letters are almost always pasted into text fields.

**Prompt instructions for Claude API:**
- 3-4 paragraphs, professional but warm.
- First paragraph: why this specific role + company.
- Middle: 2-3 concrete achievements matching the job requirements.
- Close: enthusiasm + availability.
- Address career gap naturally if relevant.
- Reference specific details from the job posting — not generic.

---

## 8. Fit summary generation

Not a separate asset. Generated in the same Claude API call as the resume.

**Prompt addition:**
```
Also provide a 2-sentence fit summary. Be honest and practical.
Sentence 1: How many key requirements match, and which ones.
Sentence 2: Any gap or a specific tip for applying.

Return as a JSON field:
"fit_summary": "Strong fit — 6 of 8 required skills match, especially data governance and stakeholder management. Highlight your Power BI dashboard work at TD to cover the analytics gap."
```

Displayed as a left-bordered text block on the card. Green border for strong fit (score ≥75), amber for decent (50-74).

---

## 9. Two toggles — automation matrix

| Auto-shortlist (Tab 1) | Auto-apply (Tab 2) | Behavior |
|:-:|:-:|:--|
| OFF | OFF | Fully manual. Pick jobs, shortlist, review, click apply. |
| ON | OFF | Greenhouse/Lever jobs auto-shortlist. Assets generate. You review and apply. |
| OFF | ON | You manually shortlist. Once shortlisted, eligible jobs auto-submit when assets ready. |
| ON | ON | Fully automated for eligible platforms. Fetch → shortlist → generate → submit. |

---

## 10. Database schema

```prisma
model Pipeline {
  id                String   @id @default(cuid())
  name              String
  keyword           String
  canonicalTitles   String   @default("[]")       // JSON array
  platforms         String   @default("[]")       // JSON array
  autoShortlist     Boolean  @default(false)
  autoApply         Boolean  @default(false)
  autoApplyTimes    String   @default("[]")       // JSON array e.g. ["08:00","12:00","17:00"]
  fetchLimit        Int      @default(20)
  lastFetchedAt     DateTime?
  createdAt         DateTime @default(now())
  jobs              PipelineJob[]
}

model PipelineJob {
  id                String   @id @default(cuid())
  pipelineId        String
  jobId             String
  stage             String   @default("search")   // search | shortlist
  shortlistedAt     DateTime?
  shortlistedHow    String?                       // auto | manual

  generatedResume   String?                       // Markdown (used to build .docx)
  generatedCover    String?                       // Markdown
  fitSummary        String?                       // 2-line text
  assetStatus       String   @default("pending")  // pending | generating | ready | failed

  applyMethod       String?                       // auto | manual
  applyStatus       String?                       // applying | applied | failed | opened
  appliedAt         DateTime?
  applyError        String?
  createdAt         DateTime @default(now())

  pipeline          Pipeline @relation(fields: [pipelineId], references: [id], onDelete: Cascade)
  job               Job      @relation(fields: [jobId], references: [id])
}

model Job {
  id                String   @id @default(cuid())
  title             String
  company           String
  location          String
  description       String
  jobType           String?                       // remote | onsite | hybrid
  employment        String?                       // fulltime | parttime | contract
  salaryMin         Float?
  salaryMax         Float?
  sourceUrl         String
  source            String                        // greenhouse | lever | linkedin | ...
  postedAt          DateTime?
  fetchedAt         DateTime @default(now())
  dedupeHash        String   @unique
  autoApplyEligible Boolean  @default(false)      // true for greenhouse, lever
  score             Int?
  scoreSummary      String?
  pipelineJobs      PipelineJob[]
}

model Resume {
  id          String   @id @default(cuid())
  fileName    String
  rawText     String
  filePath    String
  uploadedAt  DateTime @default(now())
}

model Settings {
  id                    String  @id @default("singleton")
  preferredLocation     String  @default("Toronto, Canada")
  openToRemote          Boolean @default(true)
  minSalary             Float?
  preferredIndustries   String  @default("[\"Banking\",\"Financial Services\",\"Fintech\",\"Tech\"]")
  dealBreakers          String?
  yearsExperience       Int     @default(7)
  keyStrengths          String  @default("[\"Data Governance\",\"Business Analysis\",\"Power BI\",\"SQL\"]")
  careerGapNote         String  @default("Returning after ~1.4 year career break — fully re-engaged")
  firstName             String?
  lastName              String?
  email                 String?
  phone                 String?
  linkedInUrl           String?
}

model Log {
  id          String   @id @default(cuid())
  timestamp   DateTime @default(now())
  level       String                        // info | warn | error
  category    String                        // fetch | score | generate | apply | schedule | system
  pipelineId  String?                       // null for system-wide logs
  jobTitle    String?                       // for context in the log viewer
  message     String                        // human-readable: "Fetched 24 jobs from Adzuna"
  detail      String?                       // stack trace, API response, error detail
}
```

---

## 11. API routes

```
/api/pipelines              GET (list) | POST (create)
/api/pipelines/[id]         GET | PATCH | DELETE
/api/pipelines/[id]/fetch   POST → trigger scrape
/api/pipelines/[id]/jobs    GET (?stage=search|shortlist)
/api/pipelines/[id]/jobs/shortlist    POST {jobIds: [...]}
/api/pipelines/[id]/jobs/[pjId]       GET | PATCH
/api/pipelines/[id]/jobs/[pjId]/generate  POST → regenerate assets
/api/pipelines/[id]/jobs/[pjId]/apply     POST → auto-apply
/api/pipelines/[id]/jobs/[pjId]/resume.docx  GET → download generated .docx
/api/pipelines/[id]/auto-apply-run    POST → scheduled auto-apply (called by cron)

/api/cron/auto-apply        GET → master cron endpoint (checks all pipelines,
                              matches current time against autoApplyTimes,
                              triggers runs for matching pipelines)

/api/resume                 POST (upload) | GET (current text)
/api/settings               GET | PUT
/api/logs                   GET (?level=error&category=apply&pipelineId=xxx&limit=50)
/api/logs/clear             DELETE → clear logs older than 30 days
```

---

## 12. Platform registry

```typescript
const PLATFORMS = {
  greenhouse:      { name: "Greenhouse",        section: "auto",   autoApply: true,  fetch: "api" },
  lever:           { name: "Lever",             section: "auto",   autoApply: true,  fetch: "api" },
  linkedin:        { name: "LinkedIn",          section: "search", autoApply: false, fetch: "jsearch" },
  indeed:          { name: "Indeed",            section: "search", autoApply: false, fetch: "api" },
  adzuna:          { name: "Adzuna",            section: "search", autoApply: false, fetch: "api" },
  jobbank:         { name: "Canada Job Bank",   section: "search", autoApply: false, fetch: "api" },
  remoteok:        { name: "RemoteOK",          section: "search", autoApply: false, fetch: "api" },
  weworkremotely:  { name: "We Work Remotely",  section: "search", autoApply: false, fetch: "rss" },
  remotive:        { name: "Remotive",          section: "search", autoApply: false, fetch: "api" },
  wellfound:       { name: "Wellfound",         section: "search", autoApply: false, fetch: "playwright" },
  builtin:         { name: "Built In Toronto",  section: "search", autoApply: false, fetch: "playwright" },
  dynamitejobs:    { name: "Dynamite Jobs",     section: "search", autoApply: false, fetch: "playwright" },
} as const;
```

---

## 13. Design system (summary)

- **Headings:** Source Serif 4
- **Body:** Plus Jakarta Sans
- **Background:** #FAFBFC (page), #FFFFFF (cards)
- **Accent:** #3B82F6 (blue, primary actions)
- **Auto-apply indicator:** #1D9E75 (teal)
- **Text:** #1A2B3C (primary), #5A6B7C (secondary), #8A9BAC (muted)
- **Borders:** #E2E8F0
- **Cards:** white bg, 0.5px border, 8px radius
- **Score colors:** green ≥75, amber 50-74, red <50
- **No dark mode.**
- **Light, airy, minimal.** No visual clutter.

---

## 14. What NOT to build

- **No PDF generation.** .docx is the deliverable. Users export PDF from Word/Docs.
- **No Google Drive integration.** Stretch goal. .docx download is sufficient.
- **No fit report page/asset.** Fit is a 2-line summary on the card.
- **No email notifications.** Out of scope.
- **No auth.** Single user tool.
- **No dark mode.**
- **No browser extension.** Out of scope.

---

## 15. Build order

### Phase 1: Shell + settings
1. Next.js 14, Tailwind, Prisma, SQLite
2. Left nav + routing (pipelines list, Applications, Settings, Logs)
3. Settings page: resume upload + parse, personal info, scoring preferences
4. Design system applied globally
5. Logging utility (writes to Log table on every significant action)
6. Logs page: filterable log viewer

### Phase 2: Pipeline CRUD
7. "Add Pipeline" modal (name, keyword, platforms)
8. Claude API for canonical title expansion
9. Pipeline detail page (header + two tab shells)
10. Pipeline items in left nav with counts
11. Edit pipeline (keyword change warning)

### Phase 3: Job fetching (Tab 1)
12. Fetchers: Remotive API, We Work Remotely RSS, RemoteOK API
13. Fetchers: Adzuna API, JSearch API, Canada Job Bank
14. Fetchers: Greenhouse Job Board API, Lever Postings API
15. Stub: Built In Toronto, Wellfound, Dynamite Jobs (Playwright later)
16. Deduplication, scoring via Claude API
17. Tab 1 UI: toolbar, cards, filters, auto-shortlist toggle
18. Log every fetch: platform, count, errors

### Phase 4: Shortlist & apply (Tab 2)
19. Shortlist flow: move jobs, trigger generation
20. Resume generation (Claude API → Markdown → docx via docx-js)
21. Cover letter generation (Claude API → Markdown)
22. Fit summary generation (2 lines, inline)
23. Tab 2 UI: cards with assets, ATS rules display, view/download
24. "Open & Apply" flow
25. Auto-apply toggle + schedule picker UI
26. Scheduled auto-apply cron route
27. Log every generation and apply attempt

### Phase 5: Playwright worker (separate Railway service)
28. Greenhouse form automation
29. Lever form automation
30. Built In / Wellfound / Dynamite Jobs scrapers
31. Auto-apply status sync + logging

### Phase 6: Polish
32. Applications page (global view)
33. Loading states, empty states, error handling
34. Responsive design

---

## 16. Scheduled auto-apply (detail)

### How the cron works

A single cron endpoint runs every 30 minutes:
```
GET /api/cron/auto-apply
```

On each run:
1. Query all pipelines where `autoApply = true` and `autoApplyTimes` is not empty.
2. For each pipeline, check if the current time (in America/Toronto timezone) falls within
   a 30-minute window of any selected time. E.g., if "08:00" is selected and it's
   7:45–8:14 AM ET, the run triggers.
3. For the matched pipeline, find all PipelineJobs where:
   - `stage = "shortlist"`
   - `assetStatus = "ready"`
   - `applyStatus IS NULL` (not yet applied)
   - `job.autoApplyEligible = true`
4. For each eligible job, call `/api/pipelines/[id]/jobs/[pjId]/apply`.
5. Log every action: "Scheduled run for Business Analyst — 3 jobs eligible, 2 applied, 1 failed".
6. Jobs from non-auto-apply platforms are skipped silently (they require manual Open & Apply).

### Vercel Cron config

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/auto-apply",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

Note: Vercel free tier allows 1 cron job running once per day. Vercel Pro allows every minute.
For free tier, set the cron to run once daily and pick the earliest selected time.
Alternative: Railway worker runs its own setInterval-based scheduler (no Vercel cron dependency).

### Schedule persistence

`autoApplyTimes` is stored as a JSON array on the Pipeline model:
```json
["08:00", "17:00"]
```

Meaning: apply at 8 AM and 5 PM Toronto time daily. Only for unapplied, asset-ready,
auto-apply-eligible jobs.

---

## 17. Logs page

### Purpose

Single-user debug tool. Every significant system action writes a log entry.
Helps Archana (or Hari debugging for her) understand what happened and when.

### What gets logged

| Category | Examples |
|:--|:--|
| `fetch` | "Fetched 24 jobs from Adzuna for pipeline Business Analyst" |
| `fetch` | "JSearch API returned 429 rate limit — retrying in 60s" |
| `score` | "Scored 18 jobs via Claude API — avg score 67" |
| `generate` | "Generated resume for Senior BA at Shopify (1.2s)" |
| `generate` | "Cover letter generation failed: Claude API timeout" |
| `apply` | "Auto-applied to Data Analyst at Stripe via Lever — success" |
| `apply` | "Auto-apply failed for BA at RBC — Greenhouse form changed" |
| `schedule` | "Scheduled run at 8:00 AM ET — 3 pipelines checked, 5 jobs applied" |
| `schedule` | "Scheduled run at 5:00 PM ET — no eligible jobs found" |
| `system` | "Resume uploaded: Archana_Resume_2026.pdf (4,832 words extracted)" |
| `system` | "Pipeline 'AI Automation' deleted — 12 jobs removed" |

### Log levels

- `info` — normal operations (fetched, scored, applied)
- `warn` — recoverable issues (rate limit, retry)
- `error` — failures (API timeout, apply failed, generation failed)

### UI layout

```
Logs                                      [Clear old logs]

Filter: [All ▼]  [All categories ▼]  [All pipelines ▼]

┌─────────────────────────────────────────────────────┐
│ 🔴 ERROR  5:02 PM  apply  Business Analyst          │
│ Auto-apply failed for BA at RBC — form structure    │
│ changed, submit button not found                    │
│ ▶ Show detail                                       │
├─────────────────────────────────────────────────────┤
│ 🟢 INFO   5:01 PM  apply  Business Analyst          │
│ Auto-applied to Data Analyst at Stripe via Lever    │
├─────────────────────────────────────────────────────┤
│ 🟢 INFO   5:00 PM  schedule                         │
│ Scheduled run at 5:00 PM ET — 2 pipelines, 4 jobs  │
├─────────────────────────────────────────────────────┤
│ 🟡 WARN   2:15 PM  fetch  Data Analyst              │
│ JSearch API rate limit hit — will retry next fetch   │
├─────────────────────────────────────────────────────┤
│ 🟢 INFO   2:14 PM  fetch  Data Analyst              │
│ Fetched 18 jobs from Adzuna, 12 from Remotive       │
└─────────────────────────────────────────────────────┘
```

- Reverse chronological (newest first).
- Filters: level (all/info/warn/error), category, pipeline name.
- "Show detail" expands to show stack trace, API response, or error detail.
- "Clear old logs" removes entries older than 30 days.
- No pagination needed for single user — load last 200 entries.

### Logging utility

Create a shared utility that all API routes and background jobs call:

```typescript
// src/lib/logger.ts
async function log(entry: {
  level: "info" | "warn" | "error";
  category: "fetch" | "score" | "generate" | "apply" | "schedule" | "system";
  pipelineId?: string;
  jobTitle?: string;
  message: string;
  detail?: string;
}) {
  await prisma.log.create({ data: entry });
}
```

Every try/catch block in every API route and background job should call this on
both success and failure. This is non-negotiable for debuggability.

---

## 18. Quick-start prompt for Claude Code

```
Build a Next.js 14 (App Router) web app called "Archana Job Hunter"
following pipeline-requirements-v2.md.

Start with Phase 1 + 2:
1. Init Next.js 14 + TypeScript + Tailwind + src/
2. Prisma + SQLite with schema from section 10 (includes Log model)
3. Left nav: "+ Add Pipeline", pipeline list, Applications, Settings, Logs
4. Create src/lib/logger.ts utility (section 17) — wire into all API routes
5. Settings page: resume upload (PDF parse via pdf-parse), personal info form,
   scoring preferences
6. Logs page: reverse-chronological log viewer with level/category/pipeline filters
7. "Add Pipeline" modal: name, single keyword with Claude API expansion,
   platform checkboxes in two sections (auto-apply / search-only)
8. Pipeline detail page: plain text header, two tabs (Job Search / Shortlist & Apply)

Design: Source Serif 4 headings, Plus Jakarta Sans body.
Palette: #FAFBFC bg, #3B82F6 accent, #1D9E75 auto-apply teal.
Light, airy, minimal. No dark mode. No chips/tags in header — plain text only.
```
