import type { SOPCase, VulnerabilityReference } from "../types/notesSop";

export function searchSOP(
  cases: SOPCase[],
  vulnerabilities: VulnerabilityReference[],
  query: string,
): Array<{ type: "case" | "vulnerability"; id: string; title: string; summary: string }> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: Array<{ type: "case" | "vulnerability"; id: string; title: string; summary: string }> = [];

  for (const item of cases) {
    const haystack = [
      item.title, item.summary, ...item.tags, ...item.observations,
      ...item.whenToUse, ...item.steps.flatMap((s) => [s.action, s.purpose, s.command ?? ""]),
    ].join(" ").toLowerCase();

    if (haystack.includes(q)) {
      results.push({ type: "case", id: item.id, title: item.title, summary: item.summary });
    }
  }

  for (const item of vulnerabilities) {
    const haystack = [
      item.name, item.summary, ...item.tags, ...item.cases, ...item.observations,
    ].join(" ").toLowerCase();

    if (haystack.includes(q)) {
      results.push({ type: "vulnerability", id: item.id, title: item.name, summary: item.summary });
    }
  }

  return results;
}
