/**
 * Detects a specific, common obfuscation: a file whose on-disk bytes are
 * plain ASCII text made up of '0'/'1' characters (optionally separated by
 * whitespace), where every 8 characters spells out one byte of an entirely
 * different, real file in binary-text form.
 *
 * This is deliberately narrow and strict. A byte-level signature scan can
 * never see the "real" file's magic bytes here, because they don't exist
 * on disk -- they only exist after this decoding step. Treating arbitrary
 * text as a candidate would produce false positives, so this only accepts
 * input where *every* non-whitespace byte is literally '0' or '1'.
 */

const ASCII_ZERO = 0x30;
const ASCII_ONE = 0x31;

function isWhitespaceByte(b: number): boolean {
  return b === 0x09 || b === 0x0a || b === 0x0d || b === 0x20; // \t \n \r space
}

export interface AsciiBitstreamDetection {
  isBitstream: boolean;
  totalBytes: number;
  bitCharCount: number;
  whitespaceCount: number;
  otherCount: number;
}

/**
 * Reports the character-composition of `data` without decoding it. Useful
 * for explaining *why* something was or wasn't treated as a candidate.
 */
export function detectAsciiBitstream(
  data: Uint8Array,
): AsciiBitstreamDetection {
  let bitCharCount = 0;
  let whitespaceCount = 0;
  let otherCount = 0;

  for (let i = 0; i < data.length; i++) {
    const b = data[i];
    if (b === ASCII_ZERO || b === ASCII_ONE) bitCharCount++;
    else if (isWhitespaceByte(b)) whitespaceCount++;
    else otherCount++;
  }

  const isBitstream =
    data.length > 0 &&
    otherCount === 0 &&
    bitCharCount > 0 &&
    bitCharCount % 8 === 0;

  return {
    isBitstream,
    totalBytes: data.length,
    bitCharCount,
    whitespaceCount,
    otherCount,
  };
}

/**
 * Decodes `data` as an ASCII '0'/'1' bitstream (ignoring whitespace) into
 * the real bytes it represents, MSB-first per byte. Returns null when the
 * input is not a pure bitstream (any non-bit, non-whitespace byte present)
 * or doesn't contain a whole number of bytes.
 */
export function decodeAsciiBitstream(data: Uint8Array): Uint8Array | null {
  const bits: number[] = [];

  for (let i = 0; i < data.length; i++) {
    const b = data[i];
    if (b === ASCII_ZERO) bits.push(0);
    else if (b === ASCII_ONE) bits.push(1);
    else if (isWhitespaceByte(b)) continue;
    else return null;
  }

  if (bits.length === 0 || bits.length % 8 !== 0) return null;

  const out = new Uint8Array(bits.length / 8);
  for (let i = 0; i < out.length; i++) {
    let byte = 0;
    for (let j = 0; j < 8; j++) {
      byte = (byte << 1) | bits[i * 8 + j];
    }
    out[i] = byte;
  }
  return out;
}
