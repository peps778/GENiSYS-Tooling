import type { TransformResult } from '../types/reverseEngineering';
import { hexToBytes } from './bytes';

export function findBytes(haystack: Uint8Array, needle: Uint8Array): number[] {
  if (!needle.length || needle.length > haystack.length) return [];
  const matches: number[] = [];
  outer: for (let i = 0; i <= haystack.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++)
      if (haystack[i + j] !== needle[j]) continue outer;
    matches.push(i);
  }
  return matches;
}

export function searchHexPattern(
  inputHex: string,
  patternHex: string,
): TransformResult {
  const input = hexToBytes(inputHex);
  const pattern = hexToBytes(patternHex);
  if (!input.ok || !input.bytes) return input;
  if (!pattern.ok || !pattern.bytes) return pattern;
  const matches = findBytes(input.bytes, pattern.bytes);
  return {
    ok: true,
    output: matches.length
      ? matches
          .map(
            (offset) => `0x${offset.toString(16).padStart(8, '0')} (${offset})`,
          )
          .join('\n')
      : 'No matches found.',
    meta: { matches: matches.length },
  };
}
