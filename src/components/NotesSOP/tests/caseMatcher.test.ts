import { describe, expect, it } from 'vitest';
import { matchCases } from '../lib/caseMatcher';
import { enumerationCases } from '../data/enumerationCases';

describe('caseMatcher', () => {
  it('matches relevant observations', () => {
    expect(
      matchCases(enumerationCases, 'web service HTTP').map((x) => x.id),
    ).toContain('enum-web-service');
  });

  it('returns no result for empty input', () => {
    expect(matchCases(enumerationCases, '')).toEqual([]);
  });
});
