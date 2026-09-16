import type { ToolId } from "../types/decoding";
import { base64Decode } from "./base64";
import { base32Decode } from "./base32";
import { matchFileSignature } from "./fileSignatures";

/**
 * Heuristic format auto-detection.
 *
 * These checks are based on character set, length, structure, and
 * decode-success/printability. Results are ranked estimates, not guarantees.
 */

export interface FormatCandidate {
  toolId: ToolId;
  toolLabel: string;
  /** 0-1. Relative confidence ranking, not an accuracy percentage. */
  confidence: number;
  reason: string;
  suggestedMode?: "encode" | "decode";
  suggestedDirection?: "forward" | "reverse";
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
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "has",
  "have",
  "hello",
  "in",
  "is",
  "it",
  "message",
  "of",
  "on",
  "or",
  "test",
  "that",
  "the",
  "this",
  "to",
  "was",
  "we",
  "with",
  "world",
]);

function englishnessScore(text: string): number {
  const letters = text.toLowerCase().match(/[a-z]/g);

  if (!letters || letters.length < 4) return 0;

  const counts: Record<string, number> = {};

  for (const ch of letters) {
    counts[ch] = (counts[ch] ?? 0) + 1;
  }

  let chiSquared = 0;

  for (const [letter, expectedPct] of Object.entries(ENGLISH_FREQ)) {
    const expected = (expectedPct / 100) * letters.length;
    const observed = counts[letter] ?? 0;

    chiSquared += Math.pow(observed - expected, 2) / (expected || 1);
  }

  return Math.max(0, 1 - chiSquared / 2000);
}

function wordScore(text: string): number {
  const words = text
    .toLowerCase()
    .match(/[a-z]+/g);

  if (!words || words.length === 0) return 0;

  let matches = 0;

  for (const word of words) {
    if (COMMON_ENGLISH_WORDS.has(word)) {
      matches++;
    }
  }

  return matches / words.length;
}

function combinedEnglishnessScore(text: string): number {
  const frequencyScore = englishnessScore(text);
  const words = wordScore(text);

  return Math.min(1, frequencyScore * 0.65 + words * 0.35);
}

function shiftLetter(char: string, shift: number): string {
  const isUpper = char >= "A" && char <= "Z";
  const isLower = char >= "a" && char <= "z";

  if (!isUpper && !isLower) return char;

  const base = isUpper ? 65 : 97;
  const code = char.charCodeAt(0) - base;

  return String.fromCharCode(
    (((code - shift) % 26) + 26) % 26 + base,
  );
}

function bestCaesarShift(
  input: string,
): { shift: number; score: number } {
  let best = {
    shift: 0,
    score: -Infinity,
  };

  for (let shift = 1; shift <= 25; shift++) {
    const attempt = Array.from(input)
      .map((char) => shiftLetter(char, shift))
      .join("");

    const score = combinedEnglishnessScore(attempt);

    if (score > best.score) {
      best = {
        shift,
        score,
      };
    }
  }

  return best;
}

function printableRatio(bytes: Uint8Array): number {
  if (bytes.length === 0) return 0;

  let printable = 0;

  for (const byte of bytes) {
    if (
      (byte >= 0x20 && byte <= 0x7e) ||
      byte === 0x09 ||
      byte === 0x0a ||
      byte === 0x0d
    ) {
      printable++;
    }
  }

  return printable / bytes.length;
}

export function detectFormats(rawInput: string): FormatCandidate[] {
  const input = rawInput.trim();
  const candidates: FormatCandidate[] = [];

  if (input.length === 0) return candidates;

  const stripped = input.replace(/\s+/g, "");
  const letters = (input.match(/[a-zA-Z]/g) ?? []).length;
  const alphaRatio = letters / input.length;

  // --- Base64 ---
  if (
    /^[A-Za-z0-9+/]+={0,2}$/.test(stripped) &&
    stripped.length % 4 === 0 &&
    stripped.length >= 8
  ) {
    const result = base64Decode(stripped);

    if (result.ok) {
      const bytes = new TextEncoder().encode(result.output);
      const ratio = printableRatio(bytes);

      candidates.push({
        toolId: "base64",
        toolLabel: "Base64",
        confidence: Math.min(0.97, 0.55 + ratio * 0.42),
        reason: `Decodes cleanly to ${Math.round(ratio * 100)}% printable text.`,
        suggestedMode: "decode",
      });
    }
  }

  // --- Base32 ---
  if (
    /^[A-Z2-7]+=*$/.test(stripped.toUpperCase()) &&
    stripped.length >= 8 &&
    /[A-Z]/.test(stripped)
  ) {
    const result = base32Decode(stripped);

    if (result.ok) {
      const bytes = new TextEncoder().encode(result.output);
      const ratio = printableRatio(bytes);

      candidates.push({
        toolId: "base32",
        toolLabel: "Base32",
        confidence: Math.min(0.9, 0.4 + ratio * 0.4),
        reason: `Decodes cleanly to ${Math.round(ratio * 100)}% printable text.`,
        suggestedMode: "decode",
      });
    }
  }

  // --- Hex family (Base16 / Hex-ASCII / file signature / hash) ---
  const hexCandidate = stripped.replace(/^0x/i, "");

  if (
    /^[0-9a-fA-F]+$/.test(hexCandidate) &&
    hexCandidate.length % 2 === 0 &&
    hexCandidate.length >= 2
  ) {
    const bytes = new Uint8Array(hexCandidate.length / 2);

    for (let i = 0; i < hexCandidate.length; i += 2) {
      bytes[i / 2] = parseInt(
        hexCandidate.slice(i, i + 2),
        16,
      );
    }

    const sig = matchFileSignature(bytes);

    if (sig) {
      candidates.push({
        toolId: "file-signature",
        toolLabel: "File Signature",
        confidence: 0.95,
        reason: `Matches the known magic bytes for ${sig.definition.name}.`,
      });
    }

    const ratio = printableRatio(bytes);

    if (ratio > 0.7) {
      candidates.push({
        toolId: "hex-ascii",
        toolLabel: "Hex / ASCII",
        confidence: Math.min(0.9, 0.4 + ratio * 0.45),
        reason: `Hex bytes decode to ${Math.round(ratio * 100)}% printable ASCII.`,
        suggestedDirection: "forward",
      });
    } else if (!sig) {
      candidates.push({
        toolId: "base16",
        toolLabel: "Base16",
        confidence: 0.45,
        reason: "Valid hexadecimal, but decoded bytes are mostly non-printable.",
        suggestedMode: "decode",
      });
    }

    const hashLengths: Record<number, number> = {
      8: 0.4,
      16: 0.3,
      32: 0.75,
      40: 0.8,
      56: 0.55,
      64: 0.75,
      96: 0.7,
      128: 0.75,
    };

    if (
      hashLengths[hexCandidate.length] !== undefined &&
      !/\s/.test(input)
    ) {
      candidates.push({
        toolId: "hash-identifier",
        toolLabel: "Hash Identifier",
        confidence: hashLengths[hexCandidate.length],
        reason: `${hexCandidate.length} hex characters is a common fixed-length digest size.`,
      });
    }
  }

  // --- Hash prefix formats (bcrypt / crypt) ---
  if (
    /^\$2[aby]?\$/.test(input) ||
    /^\$1\$/.test(input) ||
    /^\$6\$/.test(input)
  ) {
    candidates.push({
      toolId: "hash-identifier",
      toolLabel: "Hash Identifier",
      confidence: 0.97,
      reason: "Matches a recognized crypt-style hash prefix.",
    });
  }

  // --- Binary ---
  if (
    /^[01\s]+$/.test(input) &&
    stripped.length >= 8 &&
    stripped.length % 8 === 0
  ) {
    candidates.push({
      toolId: "binary",
      toolLabel: "Binary",
      confidence: 0.85,
      reason: `${stripped.length} bits, a clean multiple of 8.`,
      suggestedDirection: "forward",
    });
  }

  // --- URL encoding ---
  const percentMatches = input.match(/%[0-9a-fA-F]{2}/g);

  if (percentMatches && percentMatches.length > 0) {
    candidates.push({
      toolId: "url",
      toolLabel: "URL Encoding",
      confidence: Math.min(
        0.92,
        0.5 + percentMatches.length * 0.08,
      ),
      reason: `Found ${percentMatches.length} percent-encoded sequence(s).`,
      suggestedMode: "decode",
    });
  }

  // --- Decimal code point list ---
  if (/^\d+(\s+\d+)+$/.test(input)) {
    const tokens = input.split(/\s+/);
    const allValid = tokens.every(
      (token) => Number(token) <= 0x10ffff,
    );

    if (allValid) {
      candidates.push({
        toolId: "decimal-character",
        toolLabel: "Decimal / Character",
        confidence: 0.8,
        reason: `${tokens.length} space-separated numeric values, all valid code points.`,
        suggestedDirection: "forward",
      });
    }
  }

  // --- Caesar / ROT ---
  if (alphaRatio > 0.6 && letters >= 12) {
    const plainScore = combinedEnglishnessScore(input);
    const { shift, score } = bestCaesarShift(input);

    if (
      shift !== 0 &&
      score > 0.45 &&
      score > plainScore + 0.03
    ) {
      candidates.push({
        toolId: "caesar",
        toolLabel: "ROT / Caesar",
        confidence: Math.min(0.85, score),
        reason: `Shifting back by ${shift} produces more English-like text (heuristic, not definitive).`,
        suggestedShift: shift,
      });
    }
  }

  // --- Plain text fallback ---
  if (candidates.length === 0) {
    const bytes = new TextEncoder().encode(input);
    const ratio = printableRatio(bytes);

    if (ratio > 0.85) {
      candidates.push({
        toolId: "base64",
        toolLabel: "Plain text (no encoding detected)",
        confidence: 0.3,
        reason: "Input already looks like readable text — try Encode instead of Decode.",
        suggestedMode: "encode",
      });
    }
  }

  return candidates
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 6);
}