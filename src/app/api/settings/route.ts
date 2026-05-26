import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

async function ensure() {
  return db.settings.upsert({
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
  const updated = await db.settings.update({
    where: { id: "singleton" },
    data: {
      preferredLocation: body.preferredLocation,
      openToRemote: !!body.openToRemote,
      minSalary: body.minSalary ?? null,
      preferredIndustries: JSON.stringify(body.preferredIndustries ?? []),
      dealBreakers: body.dealBreakers ?? null,
      yearsExperience: Number(body.yearsExperience ?? 0),
      keyStrengths: JSON.stringify(body.keyStrengths ?? []),
      careerGapNote: body.careerGapNote ?? "",
      firstName: body.firstName ?? null,
      lastName: body.lastName ?? null,
      email: body.email ?? null,
      phone: body.phone ?? null,
      linkedInUrl: body.linkedInUrl ?? null,
    },
  });
  return NextResponse.json({
    ...updated,
    preferredIndustries: JSON.parse(updated.preferredIndustries),
    keyStrengths: JSON.parse(updated.keyStrengths),
  });
}
