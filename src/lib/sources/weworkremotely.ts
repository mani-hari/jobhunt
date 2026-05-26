import Parser from "rss-parser";
import { NormalizedJob } from "@/lib/types";

const parser = new Parser();

export async function fetchWeWorkRemotely(keyword: string, limit: number): Promise<NormalizedJob[]> {
  try {
    const feed = await parser.parseURL("https://weworkremotely.com/remote-jobs.rss");
    const kw = keyword.toLowerCase();
    const matches = feed.items
      .filter((item) => {
        const text = `${item.title ?? ""} ${item.contentSnippet ?? ""}`.toLowerCase();
        return text.includes(kw);
      })
      .slice(0, limit);

    return matches.map((item) => ({
      title: item.title ?? "Unknown",
      company: item.creator ?? "Unknown",
      location: "Remote",
      description: item.contentSnippet ?? item.content ?? "",
      jobType: "remote",
      sourceUrl: item.link ?? "",
      source: "weworkremotely" as const,
      postedAt: item.pubDate ? new Date(item.pubDate) : undefined,
      autoApplyEligible: false,
    }));
  } catch {
    return [];
  }
}
