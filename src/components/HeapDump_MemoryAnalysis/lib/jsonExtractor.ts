/**
 * jsonExtractor.ts
 *
 * Finds JSON-shaped substrings inside the extracted string table and
 * attempts to parse them, so users can pull structured data (config
 * blobs, API payloads, cached state, etc.) out of a heap dump. Pure
 * function, no DOM/React dependency.
 */

import type { JsonExtractResult } from "../types/heap";

const MIN_CANDIDATE_LENGTH = 2; // "{}" / "[]"
/** Avoid pathological scans on extremely long single strings. */
const MAX_STRING_LENGTH_TO_SCAN = 2_000_000;

/**
 * Scans a single string for balanced {...} / [...] regions using a
 * simple bracket-matching walk. This is more robust than a regex for
 * nested JSON and tolerates surrounding non-JSON text.
 */
export function findJsonCandidates(source: string): string[] {
  if (source.length > MAX_STRING_LENGTH_TO_SCAN) {
    source = source.slice(0, MAX_STRING_LENGTH_TO_SCAN);
  }

  const candidates: string[] = [];
  const openers: Record<string, string> = { "{": "}", "[": "]" };

  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (ch !== "{" && ch !== "[") continue;

    const closer = openers[ch];
    let depth = 0;
    let inString = false;
    let escaped = false;
    let end = -1;

    for (let j = i; j < source.length; j++) {
      const c = source[j];

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (c === "\\") {
          escaped = true;
        } else if (c === '"') {
          inString = false;
        }
        continue;
      }

      if (c === '"') {
        inString = true;
        continue;
      }
      if (c === ch) depth++;
      else if (c === closer) {
        depth--;
        if (depth === 0) {
          end = j;
          break;
        }
      }
    }

    if (end !== -1 && end - i + 1 >= MIN_CANDIDATE_LENGTH) {
      candidates.push(source.slice(i, end + 1));
      i = end; // Skip past this candidate to avoid re-scanning inside it.
    }
  }

  return candidates;
}

/**
 * Extracts and attempts to parse JSON candidates across every string
 * in the table. Both valid and invalid candidates are returned (with
 * `valid` set accordingly) so the UI can show "near miss" data too.
 */
export function extractJsonFromStrings(strings: string[]): JsonExtractResult[] {
  const results: JsonExtractResult[] = [];
  let idCounter = 0;

  strings.forEach((source, sourceStringId) => {
    if (!source) return;

    // Fast path: the whole string is itself valid JSON.
    const trimmed = source.trim();
    if (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    ) {
      try {
        const parsed = JSON.parse(trimmed);
        results.push({ id: idCounter++, raw: trimmed, valid: true, parsed, sourceStringId });
        return;
      } catch {
        // Fall through to sub-candidate scanning below.
      }
    }

    const candidates = findJsonCandidates(source);
    for (const candidate of candidates) {
      try {
        const parsed = JSON.parse(candidate);
        results.push({ id: idCounter++, raw: candidate, valid: true, parsed, sourceStringId });
      } catch {
        results.push({ id: idCounter++, raw: candidate, valid: false, sourceStringId });
      }
    }
  });

  return results;
}
