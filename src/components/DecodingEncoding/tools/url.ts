import type { TransformResult } from "../types/decoding";

export function urlEncode(input: string): TransformResult {
  if (input.length === 0) {
    return { ok: false, output: "", error: "Input is empty." };
  }
  try {
    return { ok: true, output: encodeURIComponent(input) };
  } catch {
    return { ok: false, output: "", error: "Unable to URL-encode input." };
  }
}

export function urlDecode(input: string): TransformResult {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return { ok: false, output: "", error: "Input is empty." };
  }
  try {
    return { ok: true, output: decodeURIComponent(trimmed) };
  } catch {
    return {
      ok: false,
      output: "",
      error: "Invalid URL-encoded input: malformed percent-encoding sequence.",
    };
  }
}
