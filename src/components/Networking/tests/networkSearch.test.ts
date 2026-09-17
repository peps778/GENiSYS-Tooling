import { describe, it, expect } from 'vitest';
import { searchReferences } from '../lib/networkSearch';
import { concepts } from '../data/concepts';
describe('network search', () => {
  it('finds TCP by tag/title', () =>
    expect(
      searchReferences(concepts, 'TCP').some((x) => x.id === 'tcp-udp'),
    ).toBe(true));
  it('returns all for empty query', () =>
    expect(searchReferences(concepts, '')).toHaveLength(concepts.length));
});
