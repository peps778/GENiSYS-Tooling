import { describe, expect, it } from "vitest";
import { detectFormats } from "../tools/formatDetector";

describe("formatDetector", () => {
  it("detects Base64 with high confidence", () => {
    const candidates = detectFormats("aGVsbG8gd29ybGQ=");
    expect(candidates[0].toolId).toBe("base64");
    expect(candidates[0].confidence).toBeGreaterThan(0.7);
  });

  it("detects a PNG signature from hex bytes", () => {
    const candidates = detectFormats("89 50 4E 47 0D 0A 1A 0A");
    expect(candidates.some((c) => c.toolId === "file-signature")).toBe(true);
  });

  it("detects URL-encoded input", () => {
    const candidates = detectFormats("a%20b%26c%3Dd");
    expect(candidates.some((c) => c.toolId === "url")).toBe(true);
  });

  it("detects a binary byte sequence", () => {
    const candidates = detectFormats("01001000 01101001");
    expect(candidates.some((c) => c.toolId === "binary")).toBe(true);
  });

  it("detects a space-separated decimal code point list", () => {
    const candidates = detectFormats("65 66 67");
    expect(candidates.some((c) => c.toolId === "decimal-character")).toBe(true);
  });

  it("detects a likely MD5-length hash", () => {
    const candidates = detectFormats("5d41402abc4b2a76b9719d911017c592");
    expect(candidates.some((c) => c.toolId === "hash-identifier")).toBe(true);
  });

  it("suggests a Caesar shift for scrambled English text", () => {
    const candidates = detectFormats("Uryyb jbeyq, guvf vf n grfg zrffntr");
    const caesar = candidates.find((c) => c.toolId === "caesar");
    expect(caesar).toBeDefined();
    expect(caesar?.suggestedShift).toBe(13);
  });

  it("returns no candidates for empty input", () => {
    expect(detectFormats("")).toEqual([]);
    expect(detectFormats("   ")).toEqual([]);
  });

  it("never returns more than 6 candidates", () => {
    const candidates = detectFormats("48656c6c6f20776f726c64");
    expect(candidates.length).toBeLessThanOrEqual(6);
  });
});
