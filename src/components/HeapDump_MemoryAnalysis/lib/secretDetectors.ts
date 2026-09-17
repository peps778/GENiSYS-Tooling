/**
 * secretDetectors.ts
 *
 * Pure pattern-matching over already-extracted strings. This module
 * intentionally does no file I/O and no DOM access so it is trivial to
 * unit test and safe to run inside the worker.
 *
 * Detection is heuristic, defense-in-depth style scanning intended to
 * help an engineer find leaked credentials in a heap dump they already
 * have legitimate access to (e.g. their own application's memory) —
 * not to defeat any protection or target third-party systems.
 */

import type { SecretMatch, SecretSeverity, SecretType } from '../types/heap';

interface DetectorRule {
  type: SecretType;
  severity: SecretSeverity;
  pattern: RegExp;
}

/**
 * Each pattern is global so we can iterate all matches per string.
 * Patterns are deliberately conservative to keep false-positive rates
 * reasonable across arbitrary heap string tables.
 */
const RULES: DetectorRule[] = [
  {
    type: 'aws_key',
    severity: 'high',
    pattern: /\b(AKIA|ASIA)[A-Z0-9]{16}\b/g,
  },
  {
    type: 'jwt',
    severity: 'high',
    pattern: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
  },
  {
    type: 'private_key',
    severity: 'high',
    pattern: /-----BEGIN (RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/g,
  },
  {
    type: 'api_key',
    severity: 'high',
    // key/token style env-var assignments: API_KEY="...", apiKey: '...'
    pattern:
      /\b(?:api[_-]?key|secret[_-]?key|access[_-]?token|client[_-]?secret)\b\s*[:=]\s*["']?([A-Za-z0-9_\-./+]{16,})["']?/gi,
  },
  {
    type: 'token',
    severity: 'medium',
    pattern: /\b(?:bearer|token)\s+([A-Za-z0-9_\-.=]{20,})\b/gi,
  },
  {
    type: 'password',
    severity: 'high',
    pattern: /\b(?:password|passwd|pwd)\b\s*[:=]\s*["']?([^"'\s]{4,})["']?/gi,
  },
  {
    type: 'flag',
    severity: 'medium',
    pattern: /\b[a-zA-Z0-9_]{2,10}\{[^{}\s]{3,80}\}/g,
  },
  {
    type: 'url',
    severity: 'low',
    pattern: /\bhttps?:\/\/[^\s"'<>]+/g,
  },
  {
    type: 'endpoint',
    severity: 'low',
    pattern:
      /\B\/(?:api|v[0-9]+|graphql|internal|admin)(?:\/[A-Za-z0-9_\-{}]+)+/g,
  },
  {
    type: 'generic_secret',
    severity: 'medium',
    // Long, high-entropy-looking base64/hex blobs, e.g. session secrets.
    pattern: /\b(?=[A-Za-z0-9+/=]{32,})(?:[A-Za-z0-9+/]{4}){8,}={0,2}\b/g,
  },
];

/** Masks a value so the UI can show it without leaking the full secret. */
export function redactValue(value: string): string {
  if (value.length <= 8) {
    return '*'.repeat(value.length);
  }
  const visible = 4;
  return `${value.slice(0, visible)}${'*'.repeat(Math.max(0, value.length - visible * 2))}${value.slice(-visible)}`;
}

function buildContext(
  source: string,
  start: number,
  end: number,
  radius = 24,
): string {
  const from = Math.max(0, start - radius);
  const to = Math.min(source.length, end + radius);
  const prefix = from > 0 ? '\u2026' : '';
  const suffix = to < source.length ? '\u2026' : '';
  return `${prefix}${source.slice(from, to)}${suffix}`;
}

/**
 * Scans a list of extracted strings for likely secrets/credentials.
 * Returns a flat, ordered list suitable for direct rendering.
 */
export function detectSecrets(strings: string[]): SecretMatch[] {
  const matches: SecretMatch[] = [];
  let idCounter = 0;

  strings.forEach((source, sourceStringId) => {
    if (!source) return;

    for (const rule of RULES) {
      // Reset lastIndex per string since RegExp objects with the
      // global flag are stateful across .exec calls.
      rule.pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = rule.pattern.exec(source)) !== null) {
        const full = match[0];
        // Prefer a capture group when the rule defines one (keeps the
        // reported value tight, e.g. just the token, not "token: xyz").
        const value = match[1] ?? full;
        const start = match.index;
        const end = start + full.length;

        matches.push({
          id: idCounter++,
          type: rule.type,
          severity: rule.severity,
          value,
          redacted: redactValue(value),
          context: buildContext(source, start, end),
          sourceStringId,
        });

        // Guard against zero-length matches causing infinite loops.
        if (match[0].length === 0) {
          rule.pattern.lastIndex++;
        }
      }
    }
  });

  return matches;
}
