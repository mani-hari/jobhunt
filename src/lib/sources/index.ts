import type { NormalizedJob } from "@/lib/types";
import { prisma } from "@/lib/db";
import { fetchAdzuna } from "./adzuna";
import { fetchJSearch } from "./jsearch";
import { fetchRemoteOK } from "./remoteok";
import { fetchJobBank } from "./jobbank";
import { fetchGreenhouse } from "./greenhouse";
import { fetchLever } from "./lever";
import { fetchAshby } from "./ashby";
import { fetchGoogleCse } from "./googlecse";

export interface SourceContext {
  keywords: string[]; // expanded title queries
  location: string;
  remote: boolean;
}

export async function fetchAllSources(ctx: SourceContext): Promise<NormalizedJob[]> {
  const boards = await prisma.companyBoard.findMany({ where: { active: true } });
  const greenhouseBoards = boards.filter((b) => b.ats === "greenhouse");
  const leverBoards = boards.filter((b) => b.ats === "lever");
  const ashbyBoards = boards.filter((b) => b.ats === "ashby");

  const tasks = [
    safe("adzuna", fetchAdzuna(ctx)),
    safe("jsearch", fetchJSearch(ctx)),
    safe("remoteok", fetchRemoteOK(ctx)),
    safe("jobbank", fetchJobBank(ctx)),
    safe("greenhouse", fetchGreenhouse(ctx, greenhouseBoards)),
    safe("lever", fetchLever(ctx, leverBoards)),
    safe("ashby", fetchAshby(ctx, ashbyBoards)),
    safe("google", fetchGoogleCse(ctx)),
  ];
  const results = await Promise.all(tasks);
  return results.flat();
}

async function safe(name: string, p: Promise<NormalizedJob[]>): Promise<NormalizedJob[]> {
  try {
    return await p;
  } catch (err) {
    console.error(`[source:${name}] failed`, err);
    return [];
  }
}
