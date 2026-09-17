/**
 * regexSearch.ts
 *
 * User-supplied regex search over the extracted string table. Pure
 * function, no DOM/React dependency, safe to unit test directly and to
 * run inside the worker thread.
 */

import type { RegexSearchResult } from '../types/heap';

export interface RegexSearchOptions {
  /** Maximum number of results to return before truncating. */
  limit?: number;
  /** Radius (characters) of context to keep on either side of a match. */
  contextRadius?: number;
}

export interface RegexSearchOutcome {
  results: RegexSearchResult[];
  truncated: boolean;
  error?: string;
}

const DEFAULT_LIMIT = 500;
const DEFAULT_CONTEXT_RADIUS = 24;
/** Upper bound on user pattern length to reduce ReDoS blast radius. */
const MAX_PATTERN_LENGTH = 500;

function buildContext(
  source: string,
  start: number,
  end: number,
  radius: number,
): string {
  const from = Math.max(0, start - radius);
  const to = Math.min(source.length, end + radius);
  const prefix = from > 0 ? '\u2026' : '';
  const suffix = to < source.length ? '\u2026' : '';
  return `${prefix}${source.slice(from, to)}${suffix}`;
}

/**
 * Safely compiles a user-supplied pattern. Never throws; instead
 * returns null plus an error message so callers can surface it in the
 * UI instead of crashing the worker.
 */
export function compileSafeRegex(
  pattern: string,
  flags: string,
): { regex: RegExp | null; error?: string } {
  if (!pattern) {
    return { regex: null, error: 'Pattern is empty.' };
  }
  if (pattern.length > MAX_PATTERN_LENGTH) {
    return {
      regex: null,
      error: `Pattern exceeds maximum length of ${MAX_PATTERN_LENGTH} characters.`,
    };
  }

  // Always force the global flag so we can iterate all matches; strip
  // any global flag the caller already passed to avoid duplicates.
  const safeFlags = `g${flags.replace(/g/g, '')}`;

  try {
    return { regex: new RegExp(pattern, safeFlags) };
  } catch (err) {
    return {
      regex: null,
      error: err instanceof Error ? err.message : 'Invalid regular expression.',
    };
  }
}

/**
 * Runs a compiled pattern across every extracted string, returning a
 * flat, capped list of results plus a `truncated` flag so the UI can
 * inform the user more results exist than were returned.
 */
export function searchStrings(
  strings: string[],
  pattern: string,
  flags: string = '',
  options: RegexSearchOptions = {},
): RegexSearchOutcome {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const contextRadius = options.contextRadius ?? DEFAULT_CONTEXT_RADIUS;

  const { regex, error } = compileSafeRegex(pattern, flags);
  if (!regex) {
    return { results: [], truncated: false, error };
  }

  const results: RegexSearchResult[] = [];
  let idCounter = 0;
  let truncated = false;

  outer: for (
    let sourceStringId = 0;
    sourceStringId < strings.length;
    sourceStringId++
  ) {
    const source = strings[sourceStringId];
    if (!source) continue;

    regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(source)) !== null) {
      if (results.length >= limit) {
        truncated = true;
        break outer;
      }

      results.push({
        id: idCounter++,
        match: match[0],
        index: match.index,
        context: buildContext(
          source,
          match.index,
          match.index + match[0].length,
          contextRadius,
        ),
        groups: match
          .slice(1)
          .filter((g): g is string => typeof g === 'string'),
        sourceStringId,
      });

      if (match[0].length === 0) {
        regex.lastIndex++;
      }
    }
  }

  return { results, truncated };
}
