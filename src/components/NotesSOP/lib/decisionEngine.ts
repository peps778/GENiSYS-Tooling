import type { SOPBranch } from "../types/notesSop";

export function chooseBranches(branches: SOPBranch[], observation: string): SOPBranch[] {
  const text = observation.trim().toLowerCase();
  if (!text) return [];

  const tokens = text.split(/[^a-z0-9]+/).filter(Boolean);
  return branches.filter((branch) => {
    const haystack = `${branch.condition} ${branch.result} ${branch.nextAction}`.toLowerCase();
    return tokens.some((token) => token.length >= 3 && haystack.includes(token));
  });
}

export function fallbackBranch(branches: SOPBranch[]): SOPBranch | undefined {
  return branches.find((branch) =>
    /unknown|none|no useful|inconclusive|nothing|still/i.test(
      `${branch.condition} ${branch.result}`,
    ),
  );
}
