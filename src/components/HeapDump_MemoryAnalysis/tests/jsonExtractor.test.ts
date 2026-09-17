import { describe, expect, it } from 'vitest';
import {
  extractJsonFromStrings,
  findJsonCandidates,
} from '../lib/jsonExtractor';

describe('findJsonCandidates', () => {
  it('finds a JSON object embedded in surrounding text', () => {
    const source = 'log: prefix {"a":1,"b":2} suffix';
    const candidates = findJsonCandidates(source);
    expect(candidates).toContain('{"a":1,"b":2}');
  });

  it('finds a JSON array embedded in surrounding text', () => {
    const source = 'values=[1,2,3] end';
    const candidates = findJsonCandidates(source);
    expect(candidates).toContain('[1,2,3]');
  });

  it('handles nested structures without truncating early', () => {
    const source = '{"outer":{"inner":[1,2,{"deep":true}]}}';
    const candidates = findJsonCandidates(source);
    expect(candidates[0]).toBe(source);
  });

  it('does not get confused by braces inside string values', () => {
    const source = '{"msg":"contains a { brace"}';
    const candidates = findJsonCandidates(source);
    expect(candidates).toContain(source);
  });

  it('returns an empty array when there is no bracket-like content', () => {
    expect(findJsonCandidates('just plain text')).toEqual([]);
  });
});

describe('extractJsonFromStrings', () => {
  it('parses a string that is entirely valid JSON', () => {
    const results = extractJsonFromStrings(['{"user":"alice","active":true}']);
    expect(results).toHaveLength(1);
    expect(results[0].valid).toBe(true);
    expect(results[0].parsed).toEqual({ user: 'alice', active: true });
  });

  it('extracts a valid JSON candidate embedded within a larger string', () => {
    const results = extractJsonFromStrings([
      'cache entry: {"id":42} committed',
    ]);
    const valid = results.find((r) => r.valid);
    expect(valid).toBeDefined();
    expect(valid?.parsed).toEqual({ id: 42 });
  });

  it('marks unparsable bracketed content as invalid rather than dropping it', () => {
    const results = extractJsonFromStrings(['broken: {not valid json,,}']);
    expect(results.some((r) => r.valid === false)).toBe(true);
  });

  it('returns no results for strings without any JSON-shaped content', () => {
    expect(
      extractJsonFromStrings(['hello world', 'another plain line']),
    ).toEqual([]);
  });

  it('handles an empty input array', () => {
    expect(extractJsonFromStrings([])).toEqual([]);
  });

  it('tracks the correct source string id across multiple entries', () => {
    const results = extractJsonFromStrings(['no json here', '{"ok":true}']);
    expect(results[0].sourceStringId).toBe(1);
  });
});
