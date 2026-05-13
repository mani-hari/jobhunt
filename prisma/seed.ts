import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_KEYWORDS = [
  { original: "Business Analyst", canonicalTitles: ["Business Systems Analyst", "Business Data Analyst", "Business Intelligence Analyst", "Business Process Analyst"] },
  { original: "Data Analyst", canonicalTitles: ["Data Analyst", "Analytics Analyst", "Reporting Analyst", "BI Analyst"] },
  { original: "Business Systems Analyst", canonicalTitles: ["Business Systems Analyst", "Systems Analyst", "Business Analyst - Systems"] },
  { original: "Data Governance Analyst", canonicalTitles: ["Data Governance Analyst", "Data Quality Analyst", "Data Steward", "Information Governance Analyst"] },
  { original: "AI Automation Specialist", canonicalTitles: ["AI Automation Specialist", "Intelligent Automation Analyst", "RPA Analyst", "AI Operations Specialist"] },
];

// Curated starter list of Canadian / Canada-friendly employers across fintech,
// banking-adjacent, insurance, and tech. Edit freely in /settings.
const DEFAULT_COMPANY_BOARDS: Array<{ ats: string; slug: string; name: string }> = [
  // Greenhouse — verified slugs (Canadian-first, then US tech with Canada/remote presence)
  { ats: "greenhouse", slug: "hootsuite", name: "Hootsuite" },
  { ats: "greenhouse", slug: "thinkific", name: "Thinkific" },
  { ats: "greenhouse", slug: "later", name: "Later" },
  { ats: "greenhouse", slug: "stripe", name: "Stripe" },
  { ats: "greenhouse", slug: "airbnb", name: "Airbnb" },
  { ats: "greenhouse", slug: "figma", name: "Figma" },
  { ats: "greenhouse", slug: "asana", name: "Asana" },
  { ats: "greenhouse", slug: "dropbox", name: "Dropbox" },
  { ats: "greenhouse", slug: "vercel", name: "Vercel" },
  { ats: "greenhouse", slug: "robinhood", name: "Robinhood" },
  { ats: "greenhouse", slug: "klaviyo", name: "Klaviyo" },
  { ats: "greenhouse", slug: "airtable", name: "Airtable" },
  { ats: "greenhouse", slug: "samsara", name: "Samsara" },
  // Lever
  { ats: "lever", slug: "metabase", name: "Metabase" },
  // Ashby
  { ats: "ashby", slug: "ramp", name: "Ramp" },
  { ats: "ashby", slug: "linear", name: "Linear" },
  { ats: "ashby", slug: "vanta", name: "Vanta" },
  { ats: "ashby", slug: "openai", name: "OpenAI" },
  { ats: "ashby", slug: "posthog", name: "PostHog" },
];

async function main() {
  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

  for (const k of DEFAULT_KEYWORDS) {
    const exists = await prisma.keyword.findFirst({ where: { original: k.original } });
    if (!exists) {
      await prisma.keyword.create({
        data: { original: k.original, canonicalTitles: JSON.stringify(k.canonicalTitles) },
      });
    }
  }

  for (const b of DEFAULT_COMPANY_BOARDS) {
    await prisma.companyBoard.upsert({
      where: { ats_slug: { ats: b.ats, slug: b.slug } },
      update: {},
      create: b,
    });
  }

  console.log("Seed complete.");
}

main().finally(() => prisma.$disconnect());
