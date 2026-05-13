export function matchesKeywords(text: string, keywords: string[]): boolean {
  if (!keywords.length) return true;
  const hay = text.toLowerCase();
  return keywords.some((k) => {
    const kw = k.trim().toLowerCase();
    return kw.length > 0 && hay.includes(kw);
  });
}
