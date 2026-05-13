-- Archana Job Hunter — schema + default seed data
-- Paste this in the Neon SQL Editor and click Run.
-- Safe to run multiple times: tables use IF NOT EXISTS where possible;
-- seed inserts use ON CONFLICT DO NOTHING.

-- ---------- Schema ----------

CREATE TABLE IF NOT EXISTS "Keyword" (
    "id" TEXT NOT NULL,
    "original" TEXT NOT NULL,
    "canonicalTitles" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Keyword_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Job" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "jobType" TEXT,
    "employment" TEXT,
    "level" TEXT,
    "industry" TEXT,
    "salaryMin" DOUBLE PRECISION,
    "salaryMax" DOUBLE PRECISION,
    "sourceUrl" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "postedAt" TIMESTAMP(3),
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dedupeHash" TEXT NOT NULL,
    "score" INTEGER,
    "scoreSummary" TEXT,
    "scoreDetails" TEXT,
    "status" TEXT NOT NULL DEFAULT 'discovered',
    "shortlistedAt" TIMESTAMP(3),
    "appliedAt" TIMESTAMP(3),
    "generatedResume" TEXT,
    "generatedCover" TEXT,
    "fitAnalysis" TEXT,
    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Resume" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "rawText" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Resume_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CompanyBoard" (
    "id" TEXT NOT NULL,
    "ats" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompanyBoard_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "preferredLocation" TEXT NOT NULL DEFAULT 'Toronto, Canada',
    "openToRemote" BOOLEAN NOT NULL DEFAULT true,
    "openToRelocation" TEXT NOT NULL DEFAULT 'Within Canada',
    "minSalary" DOUBLE PRECISION,
    "preferredIndustries" TEXT NOT NULL DEFAULT '["Banking","Financial Services","Insurance","Fintech","Tech"]',
    "dealBreakers" TEXT,
    "yearsExperience" INTEGER NOT NULL DEFAULT 7,
    "keyStrengths" TEXT NOT NULL DEFAULT '["Data Governance","Business Analysis","Requirements Gathering","Stakeholder Management","Power BI","SQL"]',
    "careerGapNote" TEXT NOT NULL DEFAULT 'Returning after ~1.4 year career break for personal/family reasons — fully re-engaged and ready',
    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Job_dedupeHash_key" ON "Job"("dedupeHash");
CREATE INDEX IF NOT EXISTS "Job_status_idx" ON "Job"("status");
CREATE INDEX IF NOT EXISTS "Job_fetchedAt_idx" ON "Job"("fetchedAt");
CREATE UNIQUE INDEX IF NOT EXISTS "CompanyBoard_ats_slug_key" ON "CompanyBoard"("ats", "slug");

-- ---------- Seed data ----------

INSERT INTO "Settings" ("id") VALUES ('singleton') ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Keyword" ("id", "original", "canonicalTitles") VALUES
  ('seed_ba',  'Business Analyst',         '["Business Systems Analyst","Business Data Analyst","Business Intelligence Analyst","Business Process Analyst"]'),
  ('seed_da',  'Data Analyst',              '["Data Analyst","Analytics Analyst","Reporting Analyst","BI Analyst"]'),
  ('seed_bsa', 'Business Systems Analyst',  '["Business Systems Analyst","Systems Analyst","Business Analyst - Systems"]'),
  ('seed_dga', 'Data Governance Analyst',   '["Data Governance Analyst","Data Quality Analyst","Data Steward","Information Governance Analyst"]'),
  ('seed_ai',  'AI Automation Specialist',  '["AI Automation Specialist","Intelligent Automation Analyst","RPA Analyst","AI Operations Specialist"]')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CompanyBoard" ("id", "ats", "slug", "name") VALUES
  ('seed_gh_wealthsimple', 'greenhouse', 'wealthsimple', 'Wealthsimple'),
  ('seed_gh_shopify',      'greenhouse', 'shopify',      'Shopify'),
  ('seed_gh_hootsuite',    'greenhouse', 'hootsuite',    'Hootsuite'),
  ('seed_gh_ada',          'greenhouse', 'ada',          'Ada'),
  ('seed_gh_ritual',       'greenhouse', 'ritualco',     'Ritual'),
  ('seed_gh_thinkific',    'greenhouse', 'thinkific',    'Thinkific'),
  ('seed_gh_clio',         'greenhouse', 'clio',         'Clio'),
  ('seed_gh_coinbase',     'greenhouse', 'coinbase',     'Coinbase'),
  ('seed_lv_neo',          'lever',      'neo',          'Neo Financial'),
  ('seed_lv_koho',         'lever',      'koho',         'KOHO'),
  ('seed_lv_borrowell',    'lever',      'borrowell',    'Borrowell'),
  ('seed_lv_drwealth',     'lever',      'drwealth',     'DRWealth'),
  ('seed_lv_ledn',         'lever',      'ledn',         'Ledn'),
  ('seed_lv_bitbuy',       'lever',      'bitbuy',       'Bitbuy'),
  ('seed_ab_ramp',         'ashby',      'ramp',         'Ramp'),
  ('seed_ab_linear',       'ashby',      'linear',       'Linear'),
  ('seed_ab_vanta',        'ashby',      'vanta',        'Vanta'),
  ('seed_ab_openai',       'ashby',      'openai',       'OpenAI')
ON CONFLICT ("ats","slug") DO NOTHING;
