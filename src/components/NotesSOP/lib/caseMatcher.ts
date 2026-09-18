import type { SOPCase } from "../types/notesSop";

export function matchCases(cases: SOPCase[], observation: string): SOPCase[] {
  const q = observation.trim().toLowerCase();
  if (!q) return [];

  const words = q.split(/[^a-z0-9]+/).filter((word) => word.length >= 3);

  return cases
    .map((item) => {
      const haystack = [
        item.title, item.summary, ...item.tags, ...item.observations,
        ...item.whenToUse, ...item.initialChecks,
      ].join(" ").toLowerCase();

      const score = words.reduce((total, word) => total + (haystack.includes(word) ? 1 : 0), 0);
      return { item, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
}
