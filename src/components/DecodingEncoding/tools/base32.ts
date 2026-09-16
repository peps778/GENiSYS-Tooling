import type { TransformResult } from "../types/decoding";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const BASE32_PATTERN = /^[A-Z2-7]*=*$/;

export function base32Encode(input: string): TransformResult {
  if (input.length === 0) {
    return { ok: false, output: "", error: "Input is empty." };
  }
  const bytes = new TextEncoder().encode(input);
  let bits = "";
  for (const byte of bytes) bits += byte.toString(2).padStart(8, "0");

  let output = "";
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, "0");
    output += ALPHABET[parseInt(chunk, 2)];
  }
  while (output.length % 8 !== 0) output += "=";
  return { ok: true, output };
}

export function base32Decode(input: string): TransformResult {
  const cleaned = input.trim().toUpperCase().replace(/\s+/g, "");
  if (cleaned.length === 0) {
    return { ok: false, output: "", error: "Input is empty." };
  }
  if (!BASE32_PATTERN.test(cleaned)) {
    return { ok: false, output: "", error: "Invalid Base32 input: unexpected characters." };
  }
  const withoutPadding = cleaned.replace(/=+$/, "");
  let bits = "";
  for (const char of withoutPadding) {
    const value = ALPHABET.indexOf(char);
    if (value === -1) {
      return { ok: false, output: "", error: `Invalid Base32 character: "${char}".` };
    }
    bits += value.toString(2).padStart(5, "0");
  }
  const byteCount = Math.floor(bits.length / 8);
  if (byteCount === 0) {
    return { ok: false, output: "", error: "Invalid Base32 input: too short to decode." };
  }
  const bytes = new Uint8Array(byteCount);
  for (let i = 0; i < byteCount; i++) {
    bytes[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
  }
  try {
    const output = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    return { ok: true, output, meta: { bytes: byteCount } };
  } catch {
    return { ok: false, output: "", error: "Invalid Base32 input: could not decode." };
  }
}
