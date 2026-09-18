import { describe, expect, it } from 'vitest';
import { chooseBranches, fallbackBranch } from '../lib/decisionEngine';
import { enumerationCases } from '../data/enumerationCases';

describe('decisionEngine', () => {
  const branches = enumerationCases[0].branches;

  it('matches a branch from an observation', () => {
    expect(
      chooseBranches(branches, 'HTTP is open').some((x) => x.id === 'http'),
    ).toBe(true);
  });

  it('finds a fallback branch', () => {
    expect(fallbackBranch(branches)?.id).toBe('none');
  });

  it('returns no matches for empty input', () => {
    expect(chooseBranches(branches, '')).toEqual([]);
  });
});
