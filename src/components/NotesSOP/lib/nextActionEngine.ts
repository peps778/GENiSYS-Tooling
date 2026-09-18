import type { SOPCase } from '../types/notesSop';

export interface NextAction {
  title: string;
  reason: string;
  caseId?: string;
  source: 'branch' | 'alternative' | 'related';
}

export function getNextActions(
  currentCase: SOPCase,
  completedActions: string[] = [],
  deadEnds: string[] = [],
): NextAction[] {
  const completed = completedActions.map((x) => x.toLowerCase());
  const dead = deadEnds.map((x) => x.toLowerCase());

  const candidates: NextAction[] = [
    ...currentCase.branches.map((branch) => ({
      title: branch.nextAction,
      reason: `Branch: ${branch.condition}`,
      caseId: branch.nextCaseId,
      source: 'branch' as const,
    })),
    ...currentCase.alternativePaths.map((path) => ({
      title: path,
      reason:
        'Alternative path for when the current branch is blocked or inconclusive.',
      source: 'alternative' as const,
    })),
    ...currentCase.relatedCases.map((id) => ({
      title: id,
      reason: 'Related investigation case.',
      caseId: id,
      source: 'related' as const,
    })),
  ];

  const seen = new Set<string>();
  return candidates
    .filter((candidate) => {
      const key = candidate.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return (
        !completed.some((item) => key.includes(item) || item.includes(key)) &&
        !dead.some((item) => key.includes(item) || item.includes(key))
      );
    })
    .slice(0, 6);
}
