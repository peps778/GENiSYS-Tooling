import type { ExecutableAnalysis } from './executableAnalyzer';
import { analyzeBinary } from './binaryAnalyzer';
import { extractStrings } from './stringExtractor';
import { identifyFile } from './fileIdentifier';
import { findEmbeddedCandidates } from './fileReconstructor';

export interface VirtualShellContext {
  filename: string;
  data: Uint8Array;
  executable?: ExecutableAnalysis | null;
}

// ---------------------------------------------------------------------------
// Low-level utilities
// ---------------------------------------------------------------------------

function toHex(data: Uint8Array, start: number, length: number): string {
  const end = Math.min(data.length, Math.max(0, start) + Math.max(0, length));
  const rows: string[] = [];
  for (let o = Math.max(0, start); o < end; o += 16) {
    const row = data.subarray(o, Math.min(end, o + 16));
    const hex = Array.from(row)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(' ')
      .padEnd(47);
    const ascii = Array.from(row)
      .map((b) => (b >= 0x20 && b <= 0x7e ? String.fromCharCode(b) : '.'))
      .join('');
    rows.push(`${o.toString(16).padStart(8, '0')}  ${hex}  |${ascii}|`);
  }
  return rows.join('\n');
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KiB`;
  return `${(n / 1024 / 1024).toFixed(2)} MiB`;
}

/** Byte-preserving string view: each byte becomes one Latin-1 character. */
function stringToBytes(s: string): Uint8Array {
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i) & 0xff;
  return out;
}

/** Printable view: bytes outside 0x20-0x7E become newlines. */
function printableView(data: Uint8Array): string {
  let out = '';
  for (const b of data)
    out += b >= 0x20 && b <= 0x7e ? String.fromCharCode(b) : '\n';
  return out;
}

// ---------------------------------------------------------------------------
// Tokenizer and option parser
// ---------------------------------------------------------------------------

/**
 * Split a command line into pipeline stages. Respects single and double
 * quotes, so `grep "a|b"` is one stage and `strings | grep flag` is two.
 */
function splitPipeline(input: string): string[] {
  const stages: string[] = [];
  let buf = '';
  let quote: '"' | "'" | null = null;
  let escaped = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (escaped) {
      buf += ch;
      escaped = false;
      continue;
    }
    if (quote === '"' && ch === '\\') {
      escaped = true;
      buf += ch;
      continue;
    }
    if (quote) {
      buf += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      buf += ch;
      continue;
    }
    if (ch === '|') {
      stages.push(buf);
      buf = '';
      continue;
    }
    buf += ch;
  }
  if (buf.trim()) stages.push(buf);
  return stages.map((s) => s.trim()).filter(Boolean);
}

/** Split a single stage into argv, honoring quotes. */
function tokenize(stage: string): string[] {
  const tokens: string[] = [];
  let buf = '';
  let quote: '"' | "'" | null = null;
  let escaped = false;
  for (let i = 0; i < stage.length; i++) {
    const ch = stage[i];
    if (escaped) {
      buf += ch;
      escaped = false;
      continue;
    }
    if (quote === '"' && ch === '\\') {
      escaped = true;
      continue;
    }
    if (quote) {
      if (ch === quote) quote = null;
      else buf += ch;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === ' ' || ch === '\t') {
      if (buf) {
        tokens.push(buf);
        buf = '';
      }
      continue;
    }
    buf += ch;
  }
  if (buf) tokens.push(buf);
  return tokens;
}

interface ParsedArgs {
  flags: Set<string>;
  values: Map<string, string>;
  positional: string[];
}

/**
 * Parse `argv` into flags, values, and positional arguments. `valueFlags`
 * names the options that consume a value. Short options support both `-n 4`
 * and `-n4`, and cluster like `-ivn`. Long options use `--name=value` or
 * `--name value` for value flags.
 */
function parseArgs(argv: string[], valueFlags: string[] = []): ParsedArgs {
  const flags = new Set<string>();
  const values = new Map<string, string>();
  const positional: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--') {
      positional.push(...argv.slice(i + 1));
      break;
    }
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq >= 0) {
        values.set(a.slice(2, eq), a.slice(eq + 1));
      } else if (valueFlags.includes(a.slice(2))) {
        values.set(a.slice(2), argv[++i] ?? '');
      } else {
        flags.add(a.slice(2));
      }
      continue;
    }
    if (a.startsWith('-') && a.length > 1) {
      let j = 1;
      while (j < a.length) {
        const c = a[j];
        if (valueFlags.includes(c)) {
          const rest = a.slice(j + 1);
          values.set(c, rest || argv[++i] || '');
          break;
        }
        flags.add(c);
        j++;
      }
      continue;
    }
    positional.push(a);
  }
  return { flags, values, positional };
}

function splitLines(s: string): string[] {
  return s === '' ? [] : s.split(/\r?\n/);
}

// ---------------------------------------------------------------------------
// Text-command implementations
// ---------------------------------------------------------------------------

function cmdGrep(argv: string[], input: string): string {
  const { flags, values, positional } = parseArgs(argv, ['e', 'm']);
  const pattern = values.get('e') ?? positional[0] ?? '';
  if (!pattern) return 'error: grep: missing pattern';

  let re: RegExp;
  try {
    re = new RegExp(pattern, flags.has('i') ? 'gi' : 'g');
  } catch {
    return `error: grep: invalid regex: ${pattern}`;
  }

  const invert = flags.has('v');
  const countOnly = flags.has('c');
  const only = flags.has('o');
  const lineNo = flags.has('n');
  const max = Number(values.get('m') ?? 0) || Infinity;
  const lines = splitLines(input);

  if (countOnly) {
    let n = 0;
    for (const line of lines) {
      re.lastIndex = 0;
      if (re.test(line) !== invert) n++;
    }
    return String(n);
  }

  if (only) {
    const hits: string[] = [];
    for (const line of lines) {
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(line)) !== null) {
        hits.push(m[0]);
        if (hits.length >= max) return hits.join('\n');
        if (m.index === re.lastIndex) re.lastIndex++;
      }
    }
    return hits.length ? hits.join('\n') : '(no matches)';
  }

  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    re.lastIndex = 0;
    if (re.test(lines[i]) === invert) continue;
    out.push(lineNo ? `${i + 1}:${lines[i]}` : lines[i]);
    if (out.length >= max) break;
  }
  return out.length ? out.join('\n') : '(no matches)';
}

/** Accepts both `-n N` and `-N`. */
function extractCount(argv: string[]): number {
  const { values, positional } = parseArgs(argv, ['n']);
  if (values.has('n')) {
    const n = Number(values.get('n'));
    if (Number.isFinite(n) && n > 0) return n;
  }
  for (const a of argv) {
    const m = a.match(/^-(\d+)$/);
    if (m) return Number(m[1]) || 10;
  }
  const n = Number(positional[0]);
  return Number.isFinite(n) && n > 0 ? n : 10;
}

function cmdHead(argv: string[], input: string): string {
  return splitLines(input).slice(0, extractCount(argv)).join('\n');
}

function cmdTail(argv: string[], input: string): string {
  const n = extractCount(argv);
  return splitLines(input).slice(-n).join('\n');
}

function cmdWc(argv: string[], input: string): string {
  const { flags } = parseArgs(argv);
  const lines = splitLines(input).length;
  const words = input.trim() === '' ? 0 : input.trim().split(/\s+/).length;
  const bytes = input.length;
  if (flags.has('l')) return String(lines);
  if (flags.has('w')) return String(words);
  if (flags.has('c')) return String(bytes);
  return `${lines}\t${words}\t${bytes}`;
}

function cmdSort(argv: string[], input: string): string {
  const { flags } = parseArgs(argv);
  const reverse = flags.has('r');
  const numeric = flags.has('n');
  const dedupe = flags.has('u');
  let lines = splitLines(input).sort((a, b) =>
    numeric
      ? (parseFloat(a) || 0) - (parseFloat(b) || 0)
      : a < b
        ? -1
        : a > b
          ? 1
          : 0,
  );
  if (dedupe) {
    const seen = new Set<string>();
    lines = lines.filter((l) => (seen.has(l) ? false : (seen.add(l), true)));
  }
  if (reverse) lines.reverse();
  return lines.join('\n');
}

function cmdUniq(argv: string[], input: string): string {
  const { flags } = parseArgs(argv);
  const withCount = flags.has('c');
  const onlyUniq = flags.has('u');
  const onlyDup = flags.has('d');
  const lines = splitLines(input);
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    let j = i;
    while (j < lines.length && lines[j] === lines[i]) j++;
    const count = j - i;
    const pass =
      (!onlyUniq && !onlyDup) ||
      (onlyUniq && count === 1) ||
      (onlyDup && count > 1);
    if (pass) {
      out.push(
        withCount ? `${String(count).padStart(7)} ${lines[i]}` : lines[i],
      );
    }
    i = j;
  }
  return out.join('\n');
}

function cmdCut(argv: string[], input: string): string {
  const { values } = parseArgs(argv, ['d', 'f']);
  const delim = values.get('d') ?? '\t';
  const spec = values.get('f') ?? '';
  if (!spec) return 'error: cut: -f is required';
  const fields: number[] = [];
  for (const part of spec.split(',')) {
    const m = part.match(/^(\d+)-(\d*)$/);
    if (m) {
      const lo = Number(m[1]);
      const hi = m[2] ? Number(m[2]) : lo;
      for (let i = lo; i <= hi; i++) fields.push(i);
    } else {
      fields.push(Number(part));
    }
  }
  if (fields.some((f) => !Number.isFinite(f) || f < 1)) {
    return `error: cut: invalid field list: ${spec}`;
  }
  return splitLines(input)
    .map((line) => {
      const parts = line.split(delim);
      return fields.map((f) => parts[f - 1] ?? '').join(delim);
    })
    .join('\n');
}

/** Expand POSIX set ranges like `a-z` and `0-9`. */
function expandSet(s: string): string {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    if (i + 2 < s.length && s[i + 1] === '-' && s[i + 2] >= s[i]) {
      const lo = s.charCodeAt(i);
      const hi = s.charCodeAt(i + 2);
      for (let c = lo; c <= hi; c++) out += String.fromCharCode(c);
      i += 2;
    } else {
      out += s[i];
    }
  }
  return out;
}

function cmdTr(argv: string[], input: string): string {
  const { flags, positional } = parseArgs(argv);
  const deleteMode = flags.has('d');
  const unescape = (s: string) =>
    s.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\r/g, '\r');
  const from = expandSet(unescape(positional[0] ?? ''));
  const to = expandSet(unescape(positional[1] ?? ''));
  if (!from) return 'error: tr: missing SET1';
  let out = '';
  for (const ch of input) {
    const idx = from.indexOf(ch);
    if (deleteMode) {
      if (idx < 0) out += ch;
      continue;
    }
    if (idx < 0) out += ch;
    else out += to[idx] ?? to[to.length - 1] ?? '';
  }
  return out;
}

function cmdSed(argv: string[], input: string): string {
  const { positional } = parseArgs(argv);
  const script = positional.join(' ');
  const m = script.match(/^s(.)(.*?)\1(.*?)\1([gi]*)$/);
  if (!m) return 'error: sed: only s/from/to/[gi] is supported';
  const [, , from, to, spec] = m;
  const flagStr = `${spec.includes('g') ? 'g' : ''}${spec.includes('i') ? 'i' : ''}`;
  let re: RegExp;
  try {
    re = new RegExp(from, flagStr);
  } catch {
    return `error: sed: invalid regex: ${from}`;
  }
  return splitLines(input)
    .map((line) => line.replace(re, to))
    .join('\n');
}

function cmdRot13(input: string): string {
  return input.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= 'Z' ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });
}

function cmdBase64(argv: string[], input: string): string {
  const { flags, positional } = parseArgs(argv);
  const source = positional[0] ?? input;
  if (flags.has('d')) {
    const s = source.replace(/\s+/g, '');
    const padded = s + '='.repeat((4 - (s.length % 4)) % 4);
    try {
      return atob(padded);
    } catch {
      return 'error: base64: invalid input';
    }
  }
  try {
    return btoa(source);
  } catch {
    return 'error: base64: input contains non-Latin1 characters';
  }
}

function cmdEcho(argv: string[]): string {
  return parseArgs(argv).positional.join(' ');
}

async function sha256(data: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', data as BufferSource);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ---------------------------------------------------------------------------
// Command table
// ---------------------------------------------------------------------------

type Stage = (stdin: string | null) => Promise<string> | string;

const HELP_TEXT = [
  'GENiSYS virtual CTF shell — safe, in-memory commands only.',
  '',
  'File inspection (reads the loaded artifact by default):',
  '  file                        identify the loaded artifact',
  '  sha256sum                   compute SHA-256 of the loaded artifact',
  '  strings [-n N]              extract printable strings',
  '  xxd [-s OFF] [-l LEN]       hex dump (also: hexdump)',
  '  binwalk                     scan for embedded signatures',
  '  entropy                     binary entropy statistics',
  '  readelf                     inspect ELF structure (if applicable)',
  '  objdump                     disassemble (if applicable)',
  '  cat                         printable view of the whole file',
  '',
  'Text filters (accept stdin from a pipe):',
  '  grep [-i] [-v] [-c] [-o] [-n] [-m N] PATTERN',
  '  head [-n N | -N]        tail [-n N | -N]',
  '  wc [-l] [-w] [-c]  sort [-n] [-r] [-u]  uniq [-c] [-u] [-d]',
  '  cut -d DELIM -f LIST        tr [-d] SET1 [SET2]',
  '  sed s/from/to/[gi]          base64 [-d] [TOKEN]    rot13',
  '',
  'Shell:',
  '  echo TEXT                   help                       clear',
  '',
  'Examples:',
  '  strings | grep -i flag',
  '  strings | sort | uniq -c | sort -rn | head -20',
  '  xxd -l 512 | grep "89 50"',
  '  echo YWJjZGVm | base64 -d',
  '  grep -n "password" | head -5',
  '  xxd -l 32 | cut -d " " -f 2-8 | tr -d " "',
].join('\n');

function buildStage(
  name: string,
  args: string[],
  ctx: VirtualShellContext,
  isFirst: boolean,
): Stage | null {
  const stdinOrPrintable = (stdin: string | null) =>
    stdin !== null ? stdin : printableView(ctx.data);

  switch (name) {
    case 'help':
    case '?':
      return () => HELP_TEXT;

    case 'echo':
      return () => cmdEcho(args);

    case 'file': {
      const id = identifyFile(ctx.data, ctx.filename);
      const mismatch = id.extensionMismatch ? ' [extension mismatch]' : '';
      return () =>
        `${ctx.filename}: ${id.detectedType} (${id.confidence})${mismatch}`;
    }

    case 'sha256sum':
      return async () => `${await sha256(ctx.data)}  ${ctx.filename}`;

    case 'strings':
      return (stdin) => {
        const { values } = parseArgs(args, ['n']);
        const min = Math.max(2, Number(values.get('n') ?? 4) || 4);
        const source = stdin !== null ? stringToBytes(stdin) : ctx.data;
        const r = extractStrings(source, { minLength: min, maxMatches: 2000 });
        return (
          r.matches
            .map((m) => `${m.offset.toString(16).padStart(8, '0')} ${m.value}`)
            .join('\n') || '(no printable strings)'
        );
      };

    case 'grep':
      return (stdin) => cmdGrep(args, stdinOrPrintable(stdin));
    case 'head':
      return (stdin) => cmdHead(args, stdinOrPrintable(stdin));
    case 'tail':
      return (stdin) => cmdTail(args, stdinOrPrintable(stdin));
    case 'wc':
      return (stdin) => cmdWc(args, stdinOrPrintable(stdin));
    case 'sort':
      return (stdin) => cmdSort(args, stdinOrPrintable(stdin));
    case 'uniq':
      return (stdin) => cmdUniq(args, stdinOrPrintable(stdin));
    case 'cut':
      return (stdin) => cmdCut(args, stdinOrPrintable(stdin));
    case 'tr':
      return (stdin) => cmdTr(args, stdinOrPrintable(stdin));
    case 'sed':
      return (stdin) => cmdSed(args, stdinOrPrintable(stdin));
    case 'rot13':
      return (stdin) => cmdRot13(stdinOrPrintable(stdin));
    case 'base64':
      return (stdin) => cmdBase64(args, stdin ?? '');

    case 'xxd':
    case 'hexdump': {
      const { flags, values } = parseArgs(args, ['s', 'l']);
      const reverse = flags.has('r');
      const start = Number(values.get('s') ?? 0) || 0;
      const length = Number(values.get('l') ?? (isFirst ? 256 : 4096)) || 256;
      return (stdin) => {
        if (reverse) {
          const hex = (stdin ?? '').replace(/[^0-9a-fA-F]/g, '');
          if (hex.length % 2 !== 0) {
            return 'error: xxd -r: odd-length hex input';
          }
          let out = '';
          for (let i = 0; i < hex.length; i += 2) {
            out += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
          }
          return out;
        }
        const data = stdin !== null ? stringToBytes(stdin) : ctx.data;
        return toHex(data, start, Math.min(length, 4096));
      };
    }

    case 'binwalk': {
      const candidates = findEmbeddedCandidates(ctx.data);
      return () =>
        candidates.length
          ? candidates
              .map(
                (c) =>
                  `${c.offset.toString(16).padStart(8, '0')}  ${c.format}  ${c.confidence}`,
              )
              .join('\n')
          : 'No embedded signature candidates found.';
    }

    case 'entropy': {
      const s = analyzeBinary(ctx.data);
      return () =>
        `size=${formatBytes(s.sizeBytes)}\n` +
        `entropy=${s.entropyEstimate.toFixed(4)} bits/byte\n` +
        `printable=${(s.printableRatio * 100).toFixed(2)}%\n` +
        `null-bytes=${(s.nullByteRatio * 100).toFixed(2)}%`;
    }

    case 'readelf': {
      const exe = ctx.executable;
      if (!exe || exe.format !== 'ELF') {
        return () =>
          'error: readelf: loaded file is not a recognized ELF executable.';
      }
      return () =>
        [
          `ELF ${exe.bits ?? '?'}-bit ${exe.architecture}`,
          `Entry point: 0x${(exe.entryPoint ?? 0).toString(16)}`,
          ...exe.sections.map(
            (s) =>
              `${s.name.padEnd(18)} off 0x${s.offset
                .toString(16)
                .padStart(8, '0')} size 0x${s.size
                .toString(16)
                .padStart(8, '0')} ${s.flags}`,
          ),
        ].join('\n');
    }

    case 'objdump': {
      const exe = ctx.executable;
      if (!exe || exe.instructions.length === 0) {
        return () =>
          'error: objdump: no supported instruction stream was mapped.';
      }
      return () =>
        exe.instructions
          .map((i) =>
            `${i.address.toString(16).padStart(8, '0')}: ${i.bytes.padEnd(20)} ${i.mnemonic} ${i.operands}`.trimEnd(),
          )
          .join('\n');
    }

    case 'cat':
      return (stdin) =>
        stdin !== null
          ? stdin.slice(0, 12000)
          : printableView(ctx.data).slice(0, 12000);

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

const MAX_OUTPUT_CHARS = 64 * 1024;

export async function runVirtualShell(
  input: string,
  ctx: VirtualShellContext,
): Promise<string> {
  const stages = splitPipeline(input);
  if (stages.length === 0) return '';

  let output: string | null = null;
  let cleared = false;

  for (let i = 0; i < stages.length; i++) {
    const argv = tokenize(stages[i]);
    if (argv.length === 0) continue;
    const name = argv[0].toLowerCase();

    if (name === 'clear' || name === 'cls') {
      output = '';
      cleared = true;
      continue;
    }

    const stage = buildStage(name, argv.slice(1), ctx, i === 0);
    if (!stage) {
      const hint =
        i === 0 ? ' Type "help".' : ' Only text filters can follow a pipe.';
      return `error: ${name}: command not available in the safe virtual shell.${hint}`;
    }

    output = await stage(output);
  }

  if (cleared) return '';
  const final = output ?? '';
  return final.length > MAX_OUTPUT_CHARS
    ? `${final.slice(0, MAX_OUTPUT_CHARS)}\n[truncated: ${
        final.length - MAX_OUTPUT_CHARS
      } more characters]`
    : final;
}
