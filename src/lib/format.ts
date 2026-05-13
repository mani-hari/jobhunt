export function timeAgo(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

export function formatSalary(min?: number | null, max?: number | null): string | null {
  if (!min && !max) return null;
  const fmt = (n: number) => `$${Math.round(n / 1000)}k`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  return fmt((min ?? max) as number);
}

export function scoreColor(score: number | null | undefined) {
  if (score == null) return "bg-line";
  if (score >= 75) return "bg-accent-green";
  if (score >= 50) return "bg-accent-amber";
  return "bg-accent-red";
}

export function scoreLabel(score: number | null | undefined) {
  if (score == null) return "Unscored";
  if (score >= 75) return "Strong fit";
  if (score >= 50) return "Possible fit";
  return "Weak fit";
}
