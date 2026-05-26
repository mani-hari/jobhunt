-- Archana Job Hunter v2 — schema
-- Paste this in the Neon SQL Editor and click Run.
-- Safe to run multiple times: uses IF NOT EXISTS / ON CONFLICT DO NOTHING.

-- ---------- Pipeline ----------
CREATE TABLE IF NOT EXISTS "Pipeline" (
    "id"              TEXT NOT NULL,
    "name"            TEXT NOT NULL,
    "keyword"         TEXT NOT NULL,
    "canonicalTitles" TEXT NOT NULL DEFAULT '[]',
    "platforms"       TEXT NOT NULL DEFAULT '[]',
    "autoShortlist"   BOOLEAN NOT NULL DEFAULT false,
    "autoApply"       BOOLEAN NOT NULL DEFAULT false,
    "autoApplyTimes"  TEXT NOT NULL DEFAULT '[]',
    "fetchLimit"      INTEGER NOT NULL DEFAULT 20,
    "lastFetchedAt"   TIMESTAMP(3),
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Pipeline_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Pipeline_createdAt_idx" ON "Pipeline"("createdAt");

-- ---------- Job (v2 — autoApplyEligible added) ----------
CREATE TABLE IF NOT EXISTS "Job" (
    "id"                TEXT NOT NULL,
    "title"             TEXT NOT NULL,
    "company"           TEXT NOT NULL,
    "location"          TEXT NOT NULL,
    "description"       TEXT NOT NULL,
    "jobType"           TEXT,
    "employment"        TEXT,
    "salaryMin"         DOUBLE PRECISION,
    "salaryMax"         DOUBLE PRECISION,
    "sourceUrl"         TEXT NOT NULL,
    "source"            TEXT NOT NULL,
    "postedAt"          TIMESTAMP(3),
    "fetchedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dedupeHash"        TEXT NOT NULL,
    "autoApplyEligible" BOOLEAN NOT NULL DEFAULT false,
    "score"             INTEGER,
    "scoreSummary"      TEXT,
    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Job_dedupeHash_key" ON "Job"("dedupeHash");
CREATE INDEX IF NOT EXISTS "Job_fetchedAt_idx" ON "Job"("fetchedAt");
CREATE INDEX IF NOT EXISTS "Job_score_idx" ON "Job"("score");
-- Upgrade from v1 Job if it exists:
ALTER TABLE IF EXISTS "Job" ADD COLUMN IF NOT EXISTS "autoApplyEligible" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE IF EXISTS "Job" ADD COLUMN IF NOT EXISTS "scoreSummary" TEXT;

-- ---------- PipelineJob ----------
CREATE TABLE IF NOT EXISTS "PipelineJob" (
    "id"              TEXT NOT NULL,
    "pipelineId"      TEXT NOT NULL,
    "jobId"           TEXT NOT NULL,
    "stage"           TEXT NOT NULL DEFAULT 'search',
    "shortlistedAt"   TIMESTAMP(3),
    "shortlistedHow"  TEXT,
    "generatedResume" TEXT,
    "generatedCover"  TEXT,
    "fitSummary"      TEXT,
    "assetStatus"     TEXT NOT NULL DEFAULT 'pending',
    "applyMethod"     TEXT,
    "applyStatus"     TEXT,
    "appliedAt"       TIMESTAMP(3),
    "applyError"      TEXT,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PipelineJob_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PipelineJob_pipelineId_jobId_key" UNIQUE ("pipelineId", "jobId"),
    CONSTRAINT "PipelineJob_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "Pipeline"("id") ON DELETE CASCADE,
    CONSTRAINT "PipelineJob_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "PipelineJob_pipelineId_stage_idx" ON "PipelineJob"("pipelineId", "stage");
CREATE INDEX IF NOT EXISTS "PipelineJob_assetStatus_idx" ON "PipelineJob"("assetStatus");

-- ---------- Resume ----------
CREATE TABLE IF NOT EXISTS "Resume" (
    "id"         TEXT NOT NULL,
    "fileName"   TEXT NOT NULL,
    "rawText"    TEXT NOT NULL,
    "filePath"   TEXT NOT NULL DEFAULT '',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Resume_pkey" PRIMARY KEY ("id")
);
ALTER TABLE IF EXISTS "Resume" ADD COLUMN IF NOT EXISTS "filePath" TEXT NOT NULL DEFAULT '';

-- ---------- Settings ----------
CREATE TABLE IF NOT EXISTS "Settings" (
    "id"                  TEXT NOT NULL DEFAULT 'singleton',
    "preferredLocation"   TEXT NOT NULL DEFAULT 'Toronto, Canada',
    "openToRemote"        BOOLEAN NOT NULL DEFAULT true,
    "minSalary"           DOUBLE PRECISION,
    "preferredIndustries" TEXT NOT NULL DEFAULT '["Banking","Financial Services","Fintech","Tech"]',
    "dealBreakers"        TEXT,
    "yearsExperience"     INTEGER NOT NULL DEFAULT 7,
    "keyStrengths"        TEXT NOT NULL DEFAULT '["Data Governance","Business Analysis","Power BI","SQL"]',
    "careerGapNote"       TEXT NOT NULL DEFAULT 'Returning after ~1.4 year career break — fully re-engaged',
    "firstName"           TEXT,
    "lastName"            TEXT,
    "email"               TEXT,
    "phone"               TEXT,
    "linkedInUrl"         TEXT,
    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);
-- Upgrade from v1 Settings:
ALTER TABLE IF EXISTS "Settings" ADD COLUMN IF NOT EXISTS "firstName" TEXT;
ALTER TABLE IF EXISTS "Settings" ADD COLUMN IF NOT EXISTS "lastName" TEXT;
ALTER TABLE IF EXISTS "Settings" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE IF EXISTS "Settings" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE IF EXISTS "Settings" ADD COLUMN IF NOT EXISTS "linkedInUrl" TEXT;
INSERT INTO "Settings" ("id") VALUES ('singleton') ON CONFLICT DO NOTHING;

-- ---------- Log ----------
CREATE TABLE IF NOT EXISTS "Log" (
    "id"         TEXT NOT NULL,
    "timestamp"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "level"      TEXT NOT NULL,
    "category"   TEXT NOT NULL,
    "pipelineId" TEXT,
    "jobTitle"   TEXT,
    "message"    TEXT NOT NULL,
    "detail"     TEXT,
    CONSTRAINT "Log_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Log_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "Pipeline"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "Log_timestamp_idx" ON "Log"("timestamp" DESC);
CREATE INDEX IF NOT EXISTS "Log_level_idx" ON "Log"("level");
CREATE INDEX IF NOT EXISTS "Log_category_idx" ON "Log"("category");
CREATE INDEX IF NOT EXISTS "Log_pipelineId_idx" ON "Log"("pipelineId");
