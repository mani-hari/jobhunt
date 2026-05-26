import { db } from "@/lib/db";

type LogEntry = {
  level: "info" | "warn" | "error";
  category: "fetch" | "score" | "generate" | "apply" | "schedule" | "system";
  pipelineId?: string;
  jobTitle?: string;
  message: string;
  detail?: string;
};

export async function log(entry: LogEntry): Promise<void> {
  try {
    await db.log.create({ data: entry });
  } catch {
    // Never let logging break the caller
    console.error("[logger] failed to write log:", entry.message);
  }
}
