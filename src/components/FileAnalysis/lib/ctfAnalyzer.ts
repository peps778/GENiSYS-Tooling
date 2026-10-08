import type {
  EmbeddedFileCandidate,
  StringExtractionResult,
} from '../types/fileAnalysis';

export type CtfSeverity = 'high' | 'medium' | 'low' | 'info';

export interface CtfFinding {
  id: string;
  severity: CtfSeverity;
  category:
    | 'flag'
    | 'credential'
    | 'network'
    | 'encoding'
    | 'command'
    | 'format'
    | 'executable'
    | 'anomaly';
  title: string;
  value: string;
  offset: number | null;
  why: string;
  nextStep: string;
}

export interface CtfTransform {
  name: string;
  description: string;
  output: string;
}

export interface CtfTriageResult {
  score: number;
  findings: CtfFinding[];
  transforms: CtfTransform[];
  recommendedCommands: string[];
}

// ---------------------------------------------------------------------------
// Tunables — every loop is bounded so adversarial input can't hang the tab.
// ---------------------------------------------------------------------------
const MAX_PRINTABLE_BYTES = 20 * 1024 * 1024; // 20 MB
const MAX_BITSTREAM_BITS = 2_000_000;
const MAX_BITSTREAM_FINDINGS = 20;
const MAX_FINDINGS = 250;
const MAX_TRANSFORMS = 20;
const MAX_MATCHES_PER_PATTERN = 80;
const MAX_DECODE_DEPTH = 3;
const MAX_CANDIDATES_PER_LEVEL = 30;
const MAX_VISITED = 500;
const MAX_FINDING_VALUE = 240;

const SEVERITY_WEIGHT: Record<CtfSeverity, number> = {
  high: 25,
  medium: 10,
  low: 3,
  info: 1,
};

// ---------------------------------------------------------------------------
// Pattern catalogue.
//
// Stored as source/flags strings so we can build a fresh RegExp per call —
// never share `lastIndex` state across invocations.
//
// A match is a LEAD, not proof. Always phrased conservatively.
// ---------------------------------------------------------------------------
interface PatternDef {
  source: string;
  flags: string;
  category: CtfFinding['category'];
  severity: CtfSeverity;
  title: string;
  why: string;
  nextStep: string;
}

const PATTERNS: PatternDef[] = [
  // Known CTF flag prefixes — high confidence.
  {
    source:
      '\\b(?:flag|ctf|picoctf|htb|thm|academy|uiuctf|dice|pico|ctflearn|hackthebox|tryhackme|ritsec|angstrom|buckeye|utflag|ictf|ductf|corctf|grey|hsctf|vsctf|sekaictf|maple|irisctf|bi0s|lactf|downunder)\\b\\{[^}\\r\\n]{1,200}\\}',
    flags: 'gi',
    category: 'flag',
    severity: 'high',
    title: 'Flag-shaped token',
    why: 'The bytes contain a token matching a known CTF flag prefix.',
    nextStep:
      'Verify the surrounding bytes and confirm the challenge-specific flag format.',
  },
  // Generic `word{body}` — catches unknown/custom prefixes (e.g. `academy{…}`).
  {
    source: '\\b[A-Za-z][A-Za-z0-9_]{3,29}\\{[^}\\r\\n]{1,200}\\}',
    flags: 'g',
    category: 'flag',
    severity: 'medium',
    title: 'Brace-delimited token',
    why: 'The bytes contain a word{...}-shaped token that may be a flag.',
    nextStep:
      'Confirm the exact format with the challenge; treat it as a lead if unsure.',
  },
  {
    source:
      '\\b(?:password|passwd|passphrase|secret|api[_-]?key|token)\\s*[:=]\\s*[^\\s"\'`]{3,160}',
    flags: 'gi',
    category: 'credential',
    severity: 'high',
    title: 'Credential-like assignment',
    why: 'A string resembles a hard-coded secret or credential assignment.',
    nextStep:
      'Inspect the exact offset and surrounding strings; treat it as a lead.',
  },
  {
    source: '\\b(?:https?|ftp):\\/\\/[^\\s"\'<>]{4,240}',
    flags: 'gi',
    category: 'network',
    severity: 'medium',
    title: 'URL',
    why: 'A network endpoint is embedded in readable data.',
    nextStep: 'Inspect the endpoint and correlate it with other strings.',
  },
  {
    source: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}(?::\\d{1,5})?\\b',
    flags: 'g',
    category: 'network',
    severity: 'medium',
    title: 'IPv4 address',
    why: 'A dotted-quad network address appears in the file.',
    nextStep:
      'Check whether it is a hard-coded endpoint, test data, or metadata.',
  },
  {
    source: '\\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}\\b',
    flags: 'gi',
    category: 'credential',
    severity: 'medium',
    title: 'Email address',
    why: 'An email-like identifier appears in the file.',
    nextStep: 'Correlate it with challenge context; do not assume ownership.',
  },
  {
    source:
      '\\b(?:cmd\\.exe|powershell(?:\\.exe)?|\\/bin\\/(?:sh|bash)|\\/usr\\/bin\\/(?:sh|bash)|nc(?:\\.exe)?|netcat|curl|wget|chmod|python(?:3)?|perl|php)\\b',
    flags: 'gi',
    category: 'command',
    severity: 'medium',
    title: 'Command/tool reference',
    why: 'A command interpreter or common challenge utility is referenced.',
    nextStep:
      'Search nearby strings and inspect call sites if executable code is available.',
  },
  {
    source:
      '\\b(?:base64|rot13|hex|xor|aes|des|rc4|sha(?:1|224|256|384|512)|md5)\\b',
    flags: 'gi',
    category: 'encoding',
    severity: 'low',
    title: 'Encoding/crypto keyword',
    why: 'The file references a transformation or cryptographic primitive.',
    nextStep: 'Look for encoded blobs and constants near the keyword.',
  },
];

// ---------------------------------------------------------------------------
// Printable view.
//
// Every input byte maps to EXACTLY one character (printable byte → itself,
// anything else → '\n'). That preserves `view.length === data.length`, which
// is what lets us use `match.index` as a byte offset for ASCII-only matches.
// ---------------------------------------------------------------------------
function printableView(
  data: Uint8Array,
  cap: number,
): { text: string; truncated: boolean } {
  const end = Math.min(data.length, cap);
  const CHUNK = 8192;
  const parts: string[] = [];
  let buf = '';
  for (let i = 0; i < end; i++) {
    const b = data[i];
    buf += b >= 0x20 && b <= 0x7e ? String.fromCharCode(b) : '\n';
    if (buf.length >= CHUNK) {
      parts.push(buf);
      buf = '';
    }
  }
  if (buf) parts.push(buf);
  return { text: parts.join(''), truncated: end < data.length };
}

// ---------------------------------------------------------------------------
// Decoders. Each returns null on invalid input; never throws.
// ---------------------------------------------------------------------------

/** Base64 with optional padding, tolerant of whitespace. */
function tryBase64(input: string): string | null {
  const s = input.replace(/\s+/g, '');
  if (s.length < 8) return null;
  const rem = s.length % 4;
  if (rem === 1) return null; // 1 leftover char is never valid base64
  const padded = rem === 0 ? s : s + '='.repeat(4 - rem);
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(padded)) return null;
  try {
    return atob(padded);
  } catch {
    return null;
  }
}

function tryBase64UrlSafe(input: string): string | null {
  if (!/[-_]/.test(input)) return null;
  return tryBase64(input.replace(/-/g, '+').replace(/_/g, '/'));
}

function tryHex(input: string): string | null {
  if (input.length < 8 || input.length % 2 !== 0) return null;
  if (!/^[0-9a-fA-F]+$/.test(input)) return null;
  let out = '';
  for (let i = 0; i < input.length; i += 2) {
    const b = parseInt(input.slice(i, i + 2), 16);
    out += String.fromCharCode(b);
  }
  return out;
}

function rot13(s: string): string {
  return s.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= 'Z' ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });
}

/** Longest run of printable ASCII chars in `s`. */
function hasPrintableRun(s: string, minRun = 6): boolean {
  let run = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c >= 0x20 && c <= 0x7e) {
      if (++run >= minRun) return true;
    } else {
      run = 0;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Pattern scan — reusable for raw text AND decoded payloads.
// ---------------------------------------------------------------------------
let findingSeq = 0;

function scanPatterns(
  text: string,
  baseOffset: number,
  provenance: string | null,
): CtfFinding[] {
  const out: CtfFinding[] = [];
  if (!text) return out;

  for (const p of PATTERNS) {
    const re = new RegExp(p.source, p.flags);
    let count = 0;
    let match: RegExpExecArray | null;

    while (
      count < MAX_MATCHES_PER_PATTERN &&
      (match = re.exec(text)) !== null
    ) {
      // Guard against zero-length matches (none of ours are, but be safe).
      if (re.lastIndex === match.index) re.lastIndex++;
      if (match[0].length === 0) continue;

      const raw = match[0];
      const offset = baseOffset + (match.index ?? 0);
      const title = provenance ? `${p.title} (${provenance})` : p.title;

      out.push({
        id: `f${findingSeq++}-${p.category}`,
        severity: p.severity,
        category: p.category,
        title,
        value: raw.slice(0, MAX_FINDING_VALUE),
        offset,
        why: provenance ? `${p.why} Surfaced via ${provenance}.` : p.why,
        nextStep: p.nextStep,
      });
      count++;
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Dedup: collapse (category, value, offset) collisions, preferring higher
// severity. This means `flag{…}` matched by both the known-prefix pattern
// and the generic pattern keeps the `high` version.
// ---------------------------------------------------------------------------
function uniqueFindings(findings: CtfFinding[]): CtfFinding[] {
  const byKey = new Map<string, CtfFinding>();
  for (const f of findings) {
    const key = `${f.category}|${f.value}|${f.offset}`;
    const existing = byKey.get(key);
    if (
      !existing ||
      SEVERITY_WEIGHT[f.severity] > SEVERITY_WEIGHT[existing.severity]
    ) {
      byKey.set(key, f);
    }
  }
  return Array.from(byKey.values());
}

// ---------------------------------------------------------------------------
// Recursive decode pipeline.
//
// At each level: find base64/hex-looking blobs, decode them with every
// applicable decoder, record a transform, RE-SCAN the decoded payload with
// the pattern engine, then recurse (bounded).
// ---------------------------------------------------------------------------
function decodeAndScan(
  text: string,
  baseOffset: number,
  provenance: string | null,
  visited: Set<string>,
  findings: CtfFinding[],
  transforms: CtfTransform[],
  depth: number,
): void {
  if (depth >= MAX_DECODE_DEPTH) return;
  if (transforms.length >= MAX_TRANSFORMS) return;
  if (visited.size >= MAX_VISITED) return;
  if (findings.length >= MAX_FINDINGS * 2) return; // pre-dedup headroom

  const B64_RE = /[A-Za-z0-9+/_-]{16,}={0,2}/g;
  let m: RegExpExecArray | null;
  let count = 0;

  while (count < MAX_CANDIDATES_PER_LEVEL && (m = B64_RE.exec(text)) !== null) {
    count++;
    const blob = m[0];
    if (blob.length > 4096) continue; // absurd — skip
    const blobOffset = baseOffset + (m.index ?? 0);

    if (visited.has(blob)) continue;
    visited.add(blob);

    // --- Base64 (standard) ---
    const decodedStd = tryBase64(blob);
    // --- Base64 (URL-safe) ---
    const decodedUrl = tryBase64UrlSafe(blob);
    // --- Hex (only if the blob is hex-shaped) ---
    const decodedHex = tryHex(blob);

    const attempts: Array<{ name: string; output: string }> = [];
    if (decodedStd) attempts.push({ name: 'Base64', output: decodedStd });
    if (decodedUrl && decodedUrl !== decodedStd)
      attempts.push({ name: 'Base64 (URL-safe)', output: decodedUrl });
    if (decodedHex && decodedHex !== decodedStd)
      attempts.push({ name: 'Hex', output: decodedHex });

    for (const attempt of attempts) {
      const out = attempt.output;
      if (!out || out.length < 4) continue;
      // Reject decodes that are pure binary noise.
      if (!hasPrintableRun(out, 6)) continue;
      if (visited.has(out)) continue;
      visited.add(out);

      const prov = provenance
        ? `${provenance} → ${attempt.name}`
        : `${attempt.name} decode of blob at 0x${blobOffset.toString(16)}`;

      if (transforms.length < MAX_TRANSFORMS) {
        transforms.push({
          name: `${attempt.name} candidate`,
          description: `Decoded ${blob.length} chars from ${attempt.name} at byte 0x${blobOffset.toString(
            16,
          )}.`,
          output: out.replace(/[^\x20-\x7e]/g, '.').slice(0, 160),
        });
      }

      // KEY FIX: promote decoded content into real findings.
      findings.push(...scanPatterns(out, blobOffset, prov));

      decodeAndScan(
        out,
        blobOffset,
        prov,
        visited,
        findings,
        transforms,
        depth + 1,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Bitstream scan: 7/8-bit, MSB/LSB, flag-shaped tokens only.
// ---------------------------------------------------------------------------
const FLAG_RE = /\b(?:flag|ctf)\{[^}\r\n]{2,120}\}/i;

function scanBitstreams(data: Uint8Array): CtfFinding[] {
  const findings: CtfFinding[] = [];
  if (data.length === 0) return findings;

  const maxBits = Math.min(data.length * 8, MAX_BITSTREAM_BITS);
  const WINDOW = 256;

  for (const width of [7, 8] as const) {
    for (const reverse of [false, true] as const) {
      const chars: string[] = [];
      const bitAt: number[] = [];

      for (let bit = 0; bit + width <= maxBits; bit++) {
        let value = 0;
        for (let j = 0; j < width; j++) {
          const absolute = bit + j;
          const byte = data[absolute >> 3];
          const bitIndex = absolute & 7;
          const v = (byte >> (reverse ? 7 - bitIndex : bitIndex)) & 1;
          value |= v << (width - 1 - j);
        }
        const ch =
          value >= 0x20 && value <= 0x7e ? String.fromCharCode(value) : ' ';
        chars.push(ch);
        bitAt.push(bit);

        if (chars.length > WINDOW) {
          chars.shift();
          bitAt.shift();
        }

        // Cheap gate: a flag token always ends in `}`.
        if (ch !== '}') continue;

        const match = chars.join('').match(FLAG_RE);
        if (!match || match.index === undefined) continue;

        const offset = Math.floor(bitAt[match.index] / 8);
        findings.push({
          id: `bit-${width}-${reverse ? 'r' : 'f'}-${offset}-${findingSeq++}`,
          severity: 'high',
          category: 'flag',
          title: `${width}-bit ${
            reverse ? 'reversed ' : ''
          }bitstream flag-shaped token`,
          value: match[0],
          offset,
          why: 'A printable CTF-style token emerged from a bit-level interpretation.',
          nextStep:
            'Reconstruct the bitstream at the reported alignment and verify the complete token.',
        });

        if (findings.length >= MAX_BITSTREAM_FINDINGS) return findings;
      }
    }
  }
  return findings;
}

// ---------------------------------------------------------------------------
// Public entry point.
// ---------------------------------------------------------------------------
export function analyzeCtfContent(
  data: Uint8Array,
  strings: StringExtractionResult | null,
  embeddedCandidates: EmbeddedFileCandidate[],
): CtfTriageResult {
  findingSeq = 0;

  const { text, truncated } = printableView(data, MAX_PRINTABLE_BYTES);
  const findings: CtfFinding[] = [];
  const transforms: CtfTransform[] = [];

  // 1. Direct pattern scan on the raw printable view.
  findings.push(...scanPatterns(text, 0, null));

  // 2. High-signal printable strings from the extractor.
  const matches = strings?.matches ?? [];
  const interesting = matches.filter((m) =>
    /(?:flag|ctf|key|secret|password|token|admin|login|debug|usage|error|http|ssh|ftp|\/bin\/|cmd|powershell)/i.test(
      m.value,
    ),
  );
  for (const match of interesting.slice(0, 80)) {
    findings.push({
      id: `str-${findingSeq++}`,
      severity: /flag|secret|password|token/i.test(match.value)
        ? 'high'
        : 'low',
      category: 'anomaly',
      title: 'Interesting string',
      value: match.value.slice(0, MAX_FINDING_VALUE),
      offset: match.offset,
      why: 'The string contains a keyword commonly useful during CTF triage.',
      nextStep:
        'Jump to the offset in Hex and inspect nearby strings/instructions.',
    });
  }
  const CONFIDENCE_SEVERITY: Record<
    EmbeddedFileCandidate['confidence'],
    CtfSeverity
  > = {
    confirmed: 'medium',
    probable: 'low',
    unknown: 'info',
  };
  // 3. Embedded file signatures.
  const hasExecutableSig = embeddedCandidates.some((c) =>
    /^(?:elf|pe|mach-?o)$/i.test(c.format),
  );
  for (const candidate of embeddedCandidates.slice(0, 50)) {
    findings.push({
      id: `emb-${findingSeq++}`,
      severity: CONFIDENCE_SEVERITY[candidate.confidence],
      category: 'format',
      title: 'Embedded file signature',
      value: `${candidate.format} @ 0x${candidate.offset.toString(16)}`,
      offset: candidate.offset,
      why: 'A second file-format signature occurs inside the loaded bytes.',
      nextStep:
        'Inspect or export the candidate and analyze it as a separate artifact.',
    });
  }

  // 4. Bitstream scan.
  findings.push(...scanBitstreams(data));

  // 5. Recursive decode: base64/hex → re-scan → recurse (bounded).
  const visited = new Set<string>();
  decodeAndScan(text, 0, null, visited, findings, transforms, 0);

  // 6. ROT13 pass: transform the whole text once and scan for flags.
  const rot = rot13(text);
  const rotFindings = scanPatterns(rot, 0, 'ROT13');
  if (rotFindings.length > 0) {
    findings.push(...rotFindings);
    if (transforms.length < MAX_TRANSFORMS) {
      transforms.push({
        name: 'ROT13',
        description:
          'Text transformed with ROT13; produced flag-shaped output.',
        output: rot.replace(/[^\x20-\x7e]/g, '.').slice(0, 160),
      });
    }
  }

  // 7. Truncation notice.
  if (truncated) {
    findings.push({
      id: `trunc-${findingSeq++}`,
      severity: 'info',
      category: 'anomaly',
      title: 'Input truncated for analysis',
      value: `Only the first ${MAX_PRINTABLE_BYTES} bytes were scanned.`,
      offset: null,
      why: 'The file exceeds the analyzer’s in-memory scan budget.',
      nextStep: 'Split the file or analyze it in a native tool.',
    });
  }

  // 8. Dedupe once, derive both score and findings from the same list.
  const unique = uniqueFindings(findings).slice(0, MAX_FINDINGS);
  const score = Math.min(
    100,
    unique.reduce((n, f) => n + SEVERITY_WEIGHT[f.severity], 0),
  );

  // 9. Adaptive command recommendations.
  const isPdf = /^\s*%PDF-/.test(text);
  const anyBase64 = transforms.some((t) => t.name.startsWith('Base64'));

  const recommendedCommands: string[] = [
    'file ./sample',
    'strings -n 4 ./sample',
    'grep -aEi "flag|ctf|password|secret|key|token" ./sample',
    'binwalk ./sample',
    'xxd -g 1 -l 256 ./sample',
  ];
  if (isPdf) {
    recommendedCommands.push(
      'exiftool ./sample',
      'pdfinfo ./sample',
      'qpdf --qdf --object-streams=disable ./sample out.pdf',
    );
  }
  if (anyBase64) {
    recommendedCommands.push(
      'grep -aEo "[A-Za-z0-9+/=_-]{16,}" ./sample | while read b; do echo "$b" | base64 -d; done',
    );
  }
  if (hasExecutableSig) {
    recommendedCommands.push('readelf -h ./sample', 'objdump -d ./sample');
  }

  return {
    score,
    findings: unique,
    transforms: transforms.slice(0, MAX_TRANSFORMS),
    recommendedCommands,
  };
}
