import { createHash } from "crypto";

export function dedupeHash(title: string, company: string, location: string) {
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
  return createHash("sha1").update(`${norm(title)}|${norm(company)}|${norm(location)}`).digest("hex");
}
