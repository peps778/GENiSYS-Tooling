import type { ToolId } from '../types/decoding';
import { base16Decode } from './base16';
import { base32Decode, base32Encode } from './base32';
import { base64Decode, base64Encode } from './base64';
import { caesarShift } from './caesar';
import { matchFileSignature } from './fileSignatures';
import { identifyHash } from './hashIdentifier';

export interface FormatCandidate {
  toolId: ToolId;
  toolLabel: string;
  /** A ranking score from 0 to 1. It is not a probability. */
  confidence: number;
  reason: string;
  suggestedMode?: 'encode' | 'decode';
  suggestedDirection?: 'forward' | 'reverse';
  suggestedShift?: number;
}

const ENGLISH_FREQ: Record<string, number> = {
  a: 8.2,
  b: 1.5,
  c: 2.8,
  d: 4.3,
  e: 12.7,
  f: 2.2,
  g: 2.0,
  h: 6.1,
  i: 7.0,
  j: 0.15,
  k: 0.77,
  l: 4.0,
  m: 2.4,
  n: 6.7,
  o: 7.5,
  p: 1.9,
  q: 0.095,
  r: 6.0,
  s: 6.3,
  t: 9.1,
  u: 2.8,
  v: 0.98,
  w: 2.4,
  x: 0.15,
  y: 2.0,
  z: 0.074,
};

const COMMON_ENGLISH_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'has',
  'have',
  'hello',
  'in',
  'is',
  'it',
  'message',
  'of',
  'on',
  'or',
  'test',
  'that',
  'the',
  'this',
  'to',
  'was',
  'we',
  'with',
  'world',
]);

function utf8Bytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function decodeUtf8(bytes: Uint8Array): { text: string; valid: boolean } {
  try {
    return {
      text: new TextDecoder('utf-8', { fatal: true }).decode(bytes),
      valid: true,
    };
  } catch {
    return { text: '', valid: false };
  }
}

function printableRatio(text: string): number {
  if (!text) return 0;
  let printable = 0;
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    if (
      (code >= 0x20 && code <= 0x7e) ||
      code === 0x09 ||
      code === 0x0a ||
      code === 0x0d ||
      code >= 0xa0
    ) {
      printable++;
    }
  }
  return printable / Array.from(text).length;
}

function englishnessScore(text: string): number {
  const letters = text.toLowerCase().match(/[a-z]/g);
  if (!letters || letters.length < 5) return 0;

  const counts: Record<string, number> = {};
  for (const letter of letters) counts[letter] = (counts[letter] ?? 0) + 1;

  let chiSquared = 0;
  for (const [letter, expectedPct] of Object.entries(ENGLISH_FREQ)) {
    const expected = (expectedPct / 100) * letters.length;
    const observed = counts[letter] ?? 0;
    chiSquared += (observed - expected) ** 2 / Math.max(expected, 0.25);
  }

  const frequency = Math.max(0, 1 - chiSquared / 1600);
  const words = text.toLowerCase().match(/[a-z]+/g) ?? [];
  const wordRatio =
    words.length === 0
      ? 0
      : words.filter((word) => COMMON_ENGLISH_WORDS.has(word)).length /
        words.length;

  return Math.min(1, frequency * 0.7 + wordRatio * 0.3);
}

function bestCaesarShift(input: string): { shift: number; score: number } {
  let best = { shift: 0, score: 0 };
  for (let shift = 1; shift <= 25; shift++) {
    const result = caesarShift(input, -shift, 'alpha');
    if (!result.ok) continue;
    const score = englishnessScore(result.output);
    if (score > best.score) best = { shift, score };
  }
  return best;
}

function addCandidate(
  candidates: FormatCandidate[],
  candidate: FormatCandidate,
): void {
  candidates.push({
    ...candidate,
    confidence: Math.max(0, Math.min(1, candidate.confidence)),
  });
}

function looksLikeStrictBase64(value: string): boolean {
  if (value.length < 8 || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) return false;
  const firstPadding = value.indexOf('=');
  const body = firstPadding === -1 ? value : value.slice(0, firstPadding);
  const padding = firstPadding === -1 ? '' : value.slice(firstPadding);
  if (body.length % 4 === 1) return false;
  const requiredPadding = (4 - (body.length % 4)) % 4;
  return padding.length === 0 || padding.length === requiredPadding;
}

function looksLikeStrictBase32(value: string): boolean {
  return (
    value.length >= 8 &&
    value.length % 8 === 0 &&
    /^[A-Z2-7]*={0,6}$/.test(value) &&
    !/=.+/.test(value.replace(/={1,6}$/, ''))
  );
}

function hexToBytes(value: string): Uint8Array | null {
  const cleaned = value.replace(/^0x/i, '').replace(/\s+/g, '');
  if (!cleaned || cleaned.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(cleaned)) {
    return null;
  }
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleaned.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export function detectFormats(rawInput: string): FormatCandidate[] {
  const input = rawInput.trim();
  if (!input) return [];

  const candidates: FormatCandidate[] = [];
  const compact = input.replace(/\s+/g, '');

  // A known magic sequence is deterministic and should outrank generic hex.
  const hexBytes = hexToBytes(input);
  if (hexBytes) {
    const signature = matchFileSignature(hexBytes);
    if (signature) {
      addCandidate(candidates, {
        toolId: 'file-signature',
        toolLabel: 'File Signature',
        confidence: 0.995,
        reason: `Exact magic-byte match for ${signature.definition.name}.`,
      });
    }
  }

  // Hash identification is deliberately format-aware. It does not claim that
  // a digest algorithm can be proven from length alone.
  const hashResult = identifyHash(input);
  if (hashResult.ok) {
    const parsed = JSON.parse(hashResult.output) as {
      candidates: Array<{ algorithm: string; confidence: string }>;
    };
    const strongHash = parsed.candidates.some(
      (candidate) => candidate.confidence === 'high',
    );
    if (strongHash) {
      addCandidate(candidates, {
        toolId: 'hash-identifier',
        toolLabel: 'Hash Identifier',
        confidence: 0.82,
        reason:
          'The value matches a recognized hash representation; the exact algorithm may still be ambiguous.',
      });
    }
  }

  // Base64 must decode successfully and re-encode to the same canonical value.
  // This removes many false positives caused by character-set-only detection.
  if (looksLikeStrictBase64(compact)) {
    const decoded = base64Decode(compact);
    if (decoded.ok) {
      const canonical = base64Encode(decoded.output);
      const expectedCanonical =
        compact + '='.repeat((4 - (compact.length % 4)) % 4);
      const bytes = decoded.ok ? utf8Bytes(decoded.output) : new Uint8Array();
      const validUtf8 =
        decoded.ok && canonical.ok && canonical.output === expectedCanonical;
      const textQuality = validUtf8 ? printableRatio(decoded.output) : 0;
      if (validUtf8) {
        addCandidate(candidates, {
          toolId: 'base64',
          toolLabel: 'Base64',
          confidence: 0.55 + textQuality * 0.4,
          reason: `Canonical Base64 round-trip; decoded UTF-8 is ${Math.round(textQuality * 100)}% printable.`,
          suggestedMode: 'decode',
        });
      } else if (decoded.ok && bytes.length > 0) {
        addCandidate(candidates, {
          toolId: 'base64',
          toolLabel: 'Base64',
          confidence: 0.45,
          reason:
            'Valid Base64 syntax, but the decoded bytes are not clean UTF-8 text.',
          suggestedMode: 'decode',
        });
      }
    }
  }

  // Base32 gets the same canonical round-trip treatment as Base64.
  const upper = compact.toUpperCase();
  if (looksLikeStrictBase32(upper)) {
    const decoded = base32Decode(upper);
    if (decoded.ok) {
      const canonical = base32Encode(decoded.output);
      const quality = printableRatio(decoded.output);
      if (canonical.ok && canonical.output === upper) {
        addCandidate(candidates, {
          toolId: 'base32',
          toolLabel: 'Base32',
          confidence: 0.55 + quality * 0.38,
          reason: `Canonical RFC 4648 Base32 round-trip; decoded text is ${Math.round(quality * 100)}% printable.`,
          suggestedMode: 'decode',
        });
      }
    }
  }

  // Hex is inherently ambiguous with fixed-length hashes. Return both when
  // appropriate instead of pretending that character set alone can decide.
  if (hexBytes && !(/^[01\s]+$/.test(input) && compact.length % 8 === 0)) {
    const decoded = base16Decode(input);
    if (decoded.ok) {
      const quality = printableRatio(decoded.output);
      const numericPairTokens =
        /\s/.test(input) &&
        input.split(/\s+/).every((token) => /^\d{2}$/.test(token));
      addCandidate(candidates, {
        toolId: 'hex-ascii',
        toolLabel: 'Hex / ASCII',
        confidence: numericPairTokens
          ? Math.min(0.7, 0.48 + quality * 0.22)
          : 0.48 + quality * 0.45,
        reason: `Valid hexadecimal bytes; decoded text is ${Math.round(quality * 100)}% printable.`,
        suggestedDirection: 'forward',
      });

      if (quality < 0.65 && !matchFileSignature(hexBytes)) {
        addCandidate(candidates, {
          toolId: 'base16',
          toolLabel: 'Base16',
          confidence: 0.6,
          reason: 'Valid hexadecimal data with mostly non-text byte values.',
          suggestedMode: 'decode',
        });
      }
    }
  }

  // Binary is only considered strong when it represents complete bytes and
  // decoding yields useful printable data.
  if (
    /^[01\s]+$/.test(input) &&
    compact.length >= 8 &&
    compact.length % 8 === 0
  ) {
    const binaryBytes = new Uint8Array(compact.length / 8);
    for (let i = 0; i < binaryBytes.length; i++) {
      binaryBytes[i] = parseInt(compact.slice(i * 8, i * 8 + 8), 2);
    }
    const decoded = decodeUtf8(binaryBytes);
    if (decoded.valid) {
      const quality = printableRatio(decoded.text);
      addCandidate(candidates, {
        toolId: 'binary',
        toolLabel: 'Binary',
        confidence: 0.62 + quality * 0.33,
        reason: `Complete 8-bit groups; decoded UTF-8 is ${Math.round(quality * 100)}% printable.`,
        suggestedDirection: 'forward',
      });
    }
  }

  // URL encoding is strongest when decoding and re-encoding is lossless.
  const percentMatches = input.match(/%[0-9a-fA-F]{2}/g) ?? [];
  if (percentMatches.length > 0) {
    try {
      const decoded = decodeURIComponent(input);
      const canonical = encodeURIComponent(decoded);
      addCandidate(candidates, {
        toolId: 'url',
        toolLabel: 'URL Encoding',
        confidence: canonical === input ? 0.96 : 0.82,
        reason: `Found ${percentMatches.length} valid percent-encoded sequence(s).`,
        suggestedMode: 'decode',
      });
    } catch {
      // Malformed percent sequences are not URL-encoded data.
    }
  }

  // Decimal character data requires at least two values to avoid treating
  // ordinary numeric strings as a character encoding.
  if (/^\d+(?:\s+\d+)+$/.test(input)) {
    const tokens = input.split(/\s+/);
    const isBinaryByteGroups =
      tokens.length > 1 && tokens.every((token) => /^0[01]{7}$/.test(token));
    const values = tokens.map(Number);
    if (
      !isBinaryByteGroups &&
      values.every(
        (value) => Number.isInteger(value) && value >= 0 && value <= 0x10ffff,
      )
    ) {
      addCandidate(candidates, {
        toolId: 'decimal-character',
        toolLabel: 'Decimal / Character',
        confidence: 0.84,
        reason: `${values.length} space-separated Unicode code points are valid.`,
        suggestedDirection: 'forward',
      });
    }
  }

  // Caesar detection is deliberately conservative. Short text produces too
  // many statistically plausible shifts, so require a meaningful improvement.
  const letters = (input.match(/[a-zA-Z]/g) ?? []).length;
  if (/\s/.test(input) && letters >= 12 && letters / input.length >= 0.6) {
    const plainScore = englishnessScore(input);
    const best = bestCaesarShift(input);
    if (best.score >= 0.58 && best.score >= plainScore + 0.08) {
      addCandidate(candidates, {
        toolId: 'caesar',
        toolLabel: 'ROT / Caesar',
        confidence: Math.min(0.92, 0.55 + (best.score - plainScore)),
        reason: `Shift ${best.shift} produces substantially more English-like text.`,
        suggestedShift: best.shift,
      });
    }
  }

  return candidates
    .sort((a, b) => b.confidence - a.confidence)
    .filter((candidate, index, all) => {
      const previous = all[index - 1];
      return !previous || candidate.toolId !== previous.toolId;
    })
    .slice(0, 6);
}
