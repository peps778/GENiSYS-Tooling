import type { TransformResult } from "../types/decoding";

export type XorKeyFormat = "ascii" | "hex" | "binary";
export type XorOutputFormat = "text" | "hex" | "binary";

function parseKeyBytes(key: string, format: XorKeyFormat): Uint8Array | null {
  const trimmed = key.trim();
  if (trimmed.length === 0) return null;

  if (format === "ascii") {
    return new TextEncoder().encode(key);
  }

  if (format === "hex") {
    const cleaned = trimmed.replace(/\s+/g, "");
    if (!/^[0-9a-fA-F]+$/.test(cleaned) || cleaned.length % 2 !== 0) return null;
    const bytes = new Uint8Array(cleaned.length / 2);
    for (let i = 0; i < cleaned.length; i += 2) bytes[i / 2] = parseInt(cleaned.slice(i, i + 2), 16);
    return bytes;
  }

  // binary
  const cleaned = trimmed.replace(/\s+/g, "");
  if (!/^[01]+$/.test(cleaned) || cleaned.length % 8 !== 0) return null;
  const bytes = new Uint8Array(cleaned.length / 8);
  for (let i = 0; i < cleaned.length; i += 8) bytes[i / 8] = parseInt(cleaned.slice(i, i + 8), 2);
  return bytes;
}

function formatOutput(bytes: Uint8Array, format: XorOutputFormat): string {
  if (format === "hex") {
    return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join(" ").toUpperCase();
  }
  if (format === "binary") {
    return Array.from(bytes).map((b) => b.toString(2).padStart(8, "0")).join(" ");
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

export function xorTransform(
  input: string,
  key: string,
  keyFormat: XorKeyFormat,
  outputFormat: XorOutputFormat
): TransformResult {
  if (input.length === 0) {
    return { ok: false, output: "", error: "Input is empty." };
  }
  if (key.trim().length === 0) {
    return { ok: false, output: "", error: "XOR key is missing." };
  }

  const keyBytes = parseKeyBytes(key, keyFormat);
  if (!keyBytes || keyBytes.length === 0) {
    return {
      ok: false,
      output: "",
      error: `Invalid XOR key: does not match the selected ${keyFormat} format.`,
    };
  }

  const inputBytes = new TextEncoder().encode(input);
  const resultBytes = new Uint8Array(inputBytes.length);
  for (let i = 0; i < inputBytes.length; i++) {
    resultBytes[i] = inputBytes[i] ^ keyBytes[i % keyBytes.length];
  }

  return {
    ok: true,
    output: formatOutput(resultBytes, outputFormat),
    meta: { bytes: resultBytes.length, keyLength: keyBytes.length },
  };
}
