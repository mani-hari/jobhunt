import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

async function ensure() {
  return prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
}

export async function GET() {
  const s = await ensure();
  return NextResponse.json({
    ...s,
    preferredIndustries: JSON.parse(s.preferredIndustries) as string[],
    keyStrengths: JSON.parse(s.keyStrengths) as string[],
  });
}

export async function PUT(req: Request) {
  const body = await req.json();
  await ensure();
  const updated = await prisma.settings.update({
    where: { id: "singleton" },
    data: {
      preferredLocation: body.preferredLocation,
      openToRemote: !!body.openToRemote,
      openToRelocation: body.openToRelocation,
      minSalary: body.minSalary ?? null,
      preferredIndustries: JSON.stringify(body.preferredIndustries ?? []),
      dealBreakers: body.dealBreakers ?? null,
      yearsExperience: Number(body.yearsExperience ?? 0),
      keyStrengths: JSON.stringify(body.keyStrengths ?? []),
      careerGapNote: body.careerGapNote ?? "",
    },
  });
  return NextResponse.json({
    ...updated,
    preferredIndustries: JSON.parse(updated.preferredIndustries),
    keyStrengths: JSON.parse(updated.keyStrengths),
  });
}
