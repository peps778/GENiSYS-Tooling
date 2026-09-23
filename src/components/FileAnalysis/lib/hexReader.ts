import type { HexRange, HexRow } from '../types/fileAnalysis';

const DEFAULT_BYTES_PER_ROW = 16;

function toAsciiChar(byte: number): string {
  return byte >= 0x20 && byte <= 0x7e ? String.fromCharCode(byte) : '.';
}

function toHexByte(byte: number): string {
  return byte.toString(16).toUpperCase().padStart(2, '0');
}

/**
 * Builds hex rows for a bounded window of `data`. Never allocates more rows
 * than necessary for the requested [startOffset, startOffset + length) span,
 * and always clamps to the buffer's actual bounds -- callers can safely pass
 * a `length` larger than the remaining data (e.g. "read to end").
 */
export function readHexRange(
  data: Uint8Array,
  startOffset: number,
  length: number,
  bytesPerRow: number = DEFAULT_BYTES_PER_ROW,
): HexRange {
  const safeStart = Math.max(0, Math.min(startOffset, data.length));
  const safeEnd = Math.max(
    safeStart,
    Math.min(safeStart + length, data.length),
  );
  const rows: HexRow[] = [];

  for (let rowStart = safeStart; rowStart < safeEnd; rowStart += bytesPerRow) {
    const rowEnd = Math.min(rowStart + bytesPerRow, safeEnd);
    const hex: string[] = [];
    let ascii = '';
    for (let i = rowStart; i < rowEnd; i++) {
      hex.push(toHexByte(data[i]));
      ascii += toAsciiChar(data[i]);
    }
    rows.push({ offset: rowStart, hex, ascii });
  }

  return { startOffset: safeStart, endOffset: safeEnd, bytesPerRow, rows };
}

/** Formats a byte offset as a zero-padded 8-digit hex string, e.g. "0000A4F0". */
export function formatOffset(offset: number): string {
  return offset.toString(16).toUpperCase().padStart(8, '0');
}

/** Parses a user-entered offset string in hex ("0x1A00", "1A00") or decimal. */
export function parseOffsetInput(input: string): number | null {
  const trimmed = input.trim();
  if (trimmed === '') return null;
  const hexMatch =
    /^0x([0-9a-fA-F]+)$/.exec(trimmed) ?? /^([0-9a-fA-F]+)h$/i.exec(trimmed);
  if (hexMatch) {
    const parsed = parseInt(hexMatch[1], 16);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (/^[0-9]+$/.test(trimmed)) {
    return parseInt(trimmed, 10);
  }
  if (/^[0-9a-fA-F]+$/.test(trimmed)) {
    return parseInt(trimmed, 16);
  }
  return null;
}

/** Searches for a literal ASCII substring in `data`, bounded by maxResults. */
export function searchAscii(
  data: Uint8Array,
  query: string,
  maxResults = 500,
  caseSensitive = false,
): number[] {
  if (query.length === 0) return [];
  const haystack = new TextDecoder('latin1').decode(data);
  const hay = caseSensitive ? haystack : haystack.toLowerCase();
  const needle = caseSensitive ? query : query.toLowerCase();
  const results: number[] = [];
  let from = 0;
  while (results.length < maxResults) {
    const idx = hay.indexOf(needle, from);
    if (idx === -1) break;
    results.push(idx);
    from = idx + 1;
  }
  return results;
}

/** Searches for a hex byte pattern like "FF D8" or "FFD8" in `data`. */
export function searchHex(
  data: Uint8Array,
  hexQuery: string,
  maxResults = 500,
): number[] {
  const cleaned = hexQuery.replace(/\s+/g, '');
  if (
    cleaned.length === 0 ||
    cleaned.length % 2 !== 0 ||
    !/^[0-9a-fA-F]+$/.test(cleaned)
  ) {
    return [];
  }
  const pattern: number[] = [];
  for (let i = 0; i < cleaned.length; i += 2) {
    pattern.push(parseInt(cleaned.slice(i, i + 2), 16));
  }
  const results: number[] = [];
  outer: for (let i = 0; i <= data.length - pattern.length; i++) {
    for (let j = 0; j < pattern.length; j++) {
      if (data[i + j] !== pattern[j]) continue outer;
    }
    results.push(i);
    if (results.length >= maxResults) break;
  }
  return results;
}
