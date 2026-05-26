import { NextRequest, NextResponse } from "next/server";
import { expandKeyword } from "@/lib/anthropic";

export async function POST(req: NextRequest) {
  const { keyword } = await req.json();
  if (!keyword?.trim()) {
    return NextResponse.json({ titles: [] });
  }
  const titles = await expandKeyword(keyword.trim());
  return NextResponse.json({ titles });
}
