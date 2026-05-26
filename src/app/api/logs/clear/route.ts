import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function DELETE() {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const { count } = await db.log.deleteMany({
    where: { timestamp: { lt: cutoff } },
  });
  return NextResponse.json({ deleted: count });
}
