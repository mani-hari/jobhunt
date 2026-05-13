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
  // Greenhouse
  { ats: "greenhouse", slug: "wealthsimple", name: "Wealthsimple" },
  { ats: "greenhouse", slug: "shopify", name: "Shopify" },
  { ats: "greenhouse", slug: "hootsuite", name: "Hootsuite" },
  { ats: "greenhouse", slug: "ada", name: "Ada" },
  { ats: "greenhouse", slug: "ritualco", name: "Ritual" },
  { ats: "greenhouse", slug: "thinkific", name: "Thinkific" },
  { ats: "greenhouse", slug: "clio", name: "Clio" },
  { ats: "greenhouse", slug: "coinbase", name: "Coinbase" },
  // Lever
  { ats: "lever", slug: "neo", name: "Neo Financial" },
  { ats: "lever", slug: "koho", name: "KOHO" },
  { ats: "lever", slug: "borrowell", name: "Borrowell" },
  { ats: "lever", slug: "drwealth", name: "DRWealth" },
  { ats: "lever", slug: "ledn", name: "Ledn" },
  { ats: "lever", slug: "bitbuy", name: "Bitbuy" },
  // Ashby
  { ats: "ashby", slug: "ramp", name: "Ramp" },
  { ats: "ashby", slug: "linear", name: "Linear" },
  { ats: "ashby", slug: "vanta", name: "Vanta" },
  { ats: "ashby", slug: "openai", name: "OpenAI" },
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
