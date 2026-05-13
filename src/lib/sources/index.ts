import type { NormalizedJob } from "@/lib/types";
import { fetchAdzuna } from "./adzuna";
import { fetchJSearch } from "./jsearch";
import { fetchRemoteOK } from "./remoteok";
import { fetchJobBank } from "./jobbank";

export interface SourceContext {
  keywords: string[]; // expanded title queries
  location: string;
  remote: boolean;
}

export async function fetchAllSources(ctx: SourceContext): Promise<NormalizedJob[]> {
  const tasks = [
    safe("adzuna", fetchAdzuna(ctx)),
    safe("jsearch", fetchJSearch(ctx)),
    safe("remoteok", fetchRemoteOK(ctx)),
    safe("jobbank", fetchJobBank(ctx)),
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
