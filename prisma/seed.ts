import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_KEYWORDS = [
  { original: "Business Analyst", canonicalTitles: ["Business Systems Analyst", "Business Data Analyst", "Business Intelligence Analyst", "Business Process Analyst"] },
  { original: "Data Analyst", canonicalTitles: ["Data Analyst", "Analytics Analyst", "Reporting Analyst", "BI Analyst"] },
  { original: "Business Systems Analyst", canonicalTitles: ["Business Systems Analyst", "Systems Analyst", "Business Analyst - Systems"] },
  { original: "Data Governance Analyst", canonicalTitles: ["Data Governance Analyst", "Data Quality Analyst", "Data Steward", "Information Governance Analyst"] },
  { original: "AI Automation Specialist", canonicalTitles: ["AI Automation Specialist", "Intelligent Automation Analyst", "RPA Analyst", "AI Operations Specialist"] },
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
  console.log("Seed complete.");
}

main().finally(() => prisma.$disconnect());
