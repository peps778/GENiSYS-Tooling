import { describe, expect, it } from 'vitest';
import { linuxCommands } from '../data/commands';
import { filterByCategory, searchCommands } from '../lib/commandSearch';

describe('command search', () => {
  it('finds binary commands by a tag', () => {
    const results = searchCommands(linuxCommands, 'binary');
    const names = results.map((result) => result.command.name);
    expect(names).toEqual(
      expect.arrayContaining(['file', 'strings', 'xxd', 'hexdump', 'od']),
    );
  });

  it('finds HTTP-related commands', () => {
    const results = searchCommands(linuxCommands, 'HTTP');
    expect(results.map((result) => result.command.name)).toEqual(
      expect.arrayContaining(['curl', 'httpx', 'wget']),
    );
  });

  it('filters by category', () => {
    const results = filterByCategory(linuxCommands, 'dns');
    expect(results.length).toBeGreaterThanOrEqual(4);
    expect(results.every((command) => command.category === 'dns')).toBe(true);
  });
});
