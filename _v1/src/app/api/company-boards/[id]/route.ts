import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { active } = (await req.json()) as { active?: boolean };
  const updated = await prisma.companyBoard.update({
    where: { id: params.id },
    data: { active: !!active },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await prisma.companyBoard.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
