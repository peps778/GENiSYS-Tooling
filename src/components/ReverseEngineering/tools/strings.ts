import type { TransformResult } from '../types/reverseEngineering';

export interface ExtractedString {
  offset: number;
  encoding: 'ASCII' | 'UTF-16LE';
  value: string;
}

function isPrintable(byte: number): boolean {
  return byte >= 0x20 && byte <= 0x7e;
}

export function extractStrings(
  bytes: Uint8Array,
  minLength = 4,
): ExtractedString[] {
  const results: ExtractedString[] = [];
  let start = -1;
  for (let i = 0; i <= bytes.length; i++) {
    const printable = i < bytes.length && isPrintable(bytes[i]);
    if (printable && start < 0) start = i;
    if ((!printable || i === bytes.length) && start >= 0) {
      if (i - start >= minLength)
        results.push({
          offset: start,
          encoding: 'ASCII',
          value: new TextDecoder().decode(bytes.slice(start, i)),
        });
      start = -1;
    }
  }

  for (let i = 0; i + 1 < bytes.length;) {
    const startOffset = i;
    let value = '';
    while (
      i + 1 < bytes.length &&
      bytes[i] >= 0x20 &&
      bytes[i] <= 0x7e &&
      bytes[i + 1] === 0
    ) {
      value += String.fromCharCode(bytes[i]);
      i += 2;
    }
    if (value.length >= minLength)
      results.push({ offset: startOffset, encoding: 'UTF-16LE', value });
    else i = startOffset + 2;
  }
  return results.sort(
    (a, b) => a.offset - b.offset || a.encoding.localeCompare(b.encoding),
  );
}

export function stringsTool(bytes: Uint8Array, minLength = 4): TransformResult {
  if (minLength < 2 || minLength > 100)
    return {
      ok: false,
      output: '',
      error: 'Minimum string length must be between 2 and 100.',
    };
  const results = extractStrings(bytes, minLength);
  const output = results.length
    ? results
        .map(
          (item) =>
            `${item.offset.toString(16).padStart(8, '0')}  ${item.encoding.padEnd(8)}  ${item.value}`,
        )
        .join('\n')
    : 'No printable strings found.';
  return { ok: true, output, meta: { strings: results.length } };
}
