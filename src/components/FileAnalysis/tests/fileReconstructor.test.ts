import { describe, it, expect } from "vitest";
import { findEmbeddedCandidates, extractCandidateBytes } from "../lib/fileReconstructor";

function padded(prefixLen: number, signature: number[], suffixLen = 0): Uint8Array {
  const bytes = new Array(prefixLen).fill(0x00);
  bytes.push(...signature);
  bytes.push(...new Array(suffixLen).fill(0x00));
  return new Uint8Array(bytes);
}

describe("findEmbeddedCandidates", () => {
  it("finds an embedded PNG signature at a non-zero offset", () => {
    const data = padded(100, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const candidates = findEmbeddedCandidates(data);
    const png = candidates.find((c) => c.format === "PNG");
    expect(png).toBeDefined();
    expect(png?.offset).toBe(100);
  });

  it("finds an embedded JPEG signature at a non-zero offset", () => {
    const data = padded(50, [0xff, 0xd8, 0xff]);
    const candidates = findEmbeddedCandidates(data);
    const jpeg = candidates.find((c) => c.format === "JPEG");
    expect(jpeg?.offset).toBe(50);
  });

  it("finds an embedded PDF signature", () => {
    const data = padded(20, [0x25, 0x50, 0x44, 0x46, 0x2d]);
    const candidates = findEmbeddedCandidates(data);
    expect(candidates.find((c) => c.format === "PDF")?.offset).toBe(20);
  });

  it("finds multiple candidates in one buffer", () => {
    const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    const jpeg = [0xff, 0xd8, 0xff];
    const combined = new Uint8Array([...new Array(10).fill(0), ...png, ...new Array(10).fill(0), ...jpeg]);
    const candidates = findEmbeddedCandidates(combined);
    expect(candidates.length).toBe(2);
    expect(candidates[0].offset).toBeLessThan(candidates[1].offset);
  });

  it("reports offsets in ascending order", () => {
    const jpeg = [0xff, 0xd8, 0xff];
    const combined = new Uint8Array([...new Array(5).fill(0), ...jpeg, ...new Array(5).fill(0), ...jpeg]);
    const candidates = findEmbeddedCandidates(combined);
    for (let i = 1; i < candidates.length; i++) {
      expect(candidates[i].offset).toBeGreaterThanOrEqual(candidates[i - 1].offset);
    }
  });

  it("produces no false positives on random, signature-free data", () => {
    const data = new Uint8Array([0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88]);
    const candidates = findEmbeddedCandidates(data);
    expect(candidates.length).toBe(0);
  });

  it("finds a reliable end offset for a self-contained PNG", () => {
    const iend = [0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82];
    const data = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...iend]);
    const candidates = findEmbeddedCandidates(data);
    const png = candidates.find((c) => c.format === "PNG");
    expect(png?.endOffset).toBe(data.length);
  });
});

describe("extractCandidateBytes", () => {
  it("extracts the exact byte range for a candidate", () => {
    const data = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
    const extracted = extractCandidateBytes(data, 2, 5);
    expect(Array.from(extracted)).toEqual([3, 4, 5]);
  });

  it("extracts to end of buffer when endOffset is null", () => {
    const data = new Uint8Array([1, 2, 3, 4, 5]);
    const extracted = extractCandidateBytes(data, 3, null);
    expect(Array.from(extracted)).toEqual([4, 5]);
  });
});
