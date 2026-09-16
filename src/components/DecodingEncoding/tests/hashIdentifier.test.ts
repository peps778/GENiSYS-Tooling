import { describe, expect, it } from "vitest";
import { identifyHash } from "../tools/hashIdentifier";
import type { HashIdentificationResult } from "../tools/hashIdentifier";

describe("hashIdentifier", () => {
  it("flags a 32-hex-character value with MD5/NTLM candidates", () => {
    const result = identifyHash("5d41402abc4b2a76b9719d911017c592");
    expect(result.ok).toBe(true);
    const parsed = JSON.parse(result.output) as HashIdentificationResult;
    expect(parsed.length).toBe(32);
    expect(parsed.candidates.some((c) => c.algorithm === "MD5")).toBe(true);
  });

  it("flags a 64-hex-character value as SHA-256", () => {
    const hex64 = "a".repeat(64);
    const result = identifyHash(hex64);
    expect(result.ok).toBe(true);
    const parsed = JSON.parse(result.output) as HashIdentificationResult;
    expect(parsed.candidates.some((c) => c.algorithm === "SHA-256")).toBe(true);
  });

  it("rejects input containing whitespace", () => {
    const result = identifyHash("abc 123");
    expect(result.ok).toBe(false);
  });

  it("rejects empty input", () => {
    expect(identifyHash("").ok).toBe(false);
  });

  it("recognizes a bcrypt-formatted value", () => {
    const result = identifyHash("$2b$12$KIXQ8b1s0v7z8s8s8s8s8u");
    expect(result.ok).toBe(true);
    const parsed = JSON.parse(result.output) as HashIdentificationResult;
    expect(parsed.candidates[0].algorithm).toBe("bcrypt");
  });
});
