import type {
  StringEncoding,
  StringExtractionResult,
  StringMatch,
} from '../types/fileAnalysis';

export interface StringExtractionOptions {
  minLength?: number;
  encoding?: StringEncoding;
  /** Hard cap on the number of matches returned (pagination/virtualization safety net). */
  maxMatches?: number;
}

const DEFAULT_MIN_LENGTH = 4;
const DEFAULT_MAX_MATCHES = 5000;

function isPrintableAsciiByte(b: number): boolean {
  return b >= 0x20 && b <= 0x7e;
}

/**
 * Extracts printable ASCII strings from a buffer. This is the fast,
 * dependency-free path and is always safe to run on arbitrary binary data.
 */
function extractAsciiStrings(
  data: Uint8Array,
  minLength: number,
  maxMatches: number,
) {
  const matches: StringMatch[] = [];
  let runStart = -1;
  let id = 0;
  let totalFound = 0;

  const flushRun = (runEnd: number) => {
    const length = runEnd - runStart;
    if (length >= minLength) {
      totalFound++;
      if (matches.length < maxMatches) {
        const bytes = data.subarray(runStart, runEnd);
        const value = new TextDecoder('ascii').decode(bytes);
        matches.push({
          id: id++,
          value,
          offset: runStart,
          length,
          encoding: 'ascii',
        });
      }
    }
    runStart = -1;
  };

  for (let i = 0; i < data.length; i++) {
    if (isPrintableAsciiByte(data[i])) {
      if (runStart === -1) runStart = i;
    } else if (runStart !== -1) {
      flushRun(i);
    }
  }
  if (runStart !== -1) flushRun(data.length);

  return { matches, totalFound };
}

/**
 * Extracts printable UTF-8 text sequences. Falls back gracefully: any byte
 * sequence that fails to decode as valid UTF-8 simply ends the current run
 * rather than throwing.
 */
function extractUtf8Strings(
  data: Uint8Array,
  minLength: number,
  maxMatches: number,
) {
  const matches: StringMatch[] = [];
  let id = 0;
  let totalFound = 0;
  let runStart = -1;
  let runText = '';
  const decoder = new TextDecoder('utf-8', { fatal: true });

  const flushRun = (runEndByteOffset: number) => {
    if (runText.length >= minLength) {
      totalFound++;
      if (matches.length < maxMatches) {
        matches.push({
          id: id++,
          value: runText,
          offset: runStart,
          length: runEndByteOffset - runStart,
          encoding: 'utf8',
        });
      }
    }
    runStart = -1;
    runText = '';
  };

  let i = 0;
  while (i < data.length) {
    // Determine expected sequence length from the leading byte.
    const byte = data[i];
    let seqLen = 1;
    if (byte >= 0x20 && byte <= 0x7e) seqLen = 1;
    else if ((byte & 0xe0) === 0xc0) seqLen = 2;
    else if ((byte & 0xf0) === 0xe0) seqLen = 3;
    else if ((byte & 0xf8) === 0xf0) seqLen = 4;
    else {
      if (runStart !== -1) flushRun(i);
      i++;
      continue;
    }

    const slice = data.subarray(i, i + seqLen);
    if (slice.length < seqLen) {
      if (runStart !== -1) flushRun(i);
      break;
    }

    try {
      const chunk = decoder.decode(slice);
      const printable =
        seqLen === 1
          ? isPrintableAsciiByte(byte)
          : chunk.trim().length > 0 || chunk.length > 0;
      if (!printable) {
        if (runStart !== -1) flushRun(i);
        i += seqLen;
        continue;
      }
      if (runStart === -1) runStart = i;
      runText += chunk;
      i += seqLen;
    } catch {
      if (runStart !== -1) flushRun(i);
      i++;
    }
  }
  if (runStart !== -1) flushRun(data.length);

  return { matches, totalFound };
}

export function extractStrings(
  data: Uint8Array,
  options: StringExtractionOptions = {},
): StringExtractionResult {
  const minLength = options.minLength ?? DEFAULT_MIN_LENGTH;
  const encoding = options.encoding ?? 'ascii';
  const maxMatches = options.maxMatches ?? DEFAULT_MAX_MATCHES;

  const { matches, totalFound } =
    encoding === 'utf8'
      ? extractUtf8Strings(data, minLength, maxMatches)
      : extractAsciiStrings(data, minLength, maxMatches);

  return {
    matches,
    totalFound,
    truncated: totalFound > matches.length,
    minLength,
  };
}
