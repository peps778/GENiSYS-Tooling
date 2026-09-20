import type { OSINTCase, OSINTReference, OSINTTool } from "../types/osint";

function matches(values: unknown[], query: string) {
  const q = query.trim().toLowerCase();
  return !q || values.flatMap(value => Array.isArray(value) ? value : [value]).filter(Boolean).join(" ").toLowerCase().includes(q);
}

export function searchOSINTCases(cases: OSINTCase[], query: string): OSINTCase[] {
  return cases.filter(item => matches([
    item.id, item.title, item.category, item.difficulty, item.phase, item.situation, item.objective, item.initialObservation, item.interpretation,
    item.collectionMethod, item.validationSteps, item.evidenceToPreserve, item.falsePositiveConsiderations, item.nextSteps, item.stopConditions,
    item.relatedTools, item.evidenceTypes,
  ], query));
}
export function searchOSINTTools(tools: OSINTTool[], query: string): OSINTTool[] { return tools.filter(tool => matches(Object.values(tool), query)); }
export function searchOSINTReferences(groups: Array<{ items: OSINTReference[] }>, query: string): OSINTReference[] { return groups.flatMap(group => group.items).filter(item => matches([item.id, item.name, item.summary, item.command, item.details, item.tags], query)); }
