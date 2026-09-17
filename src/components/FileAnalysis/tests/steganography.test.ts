import { describe, it, expect } from "vitest";
import { inspectPngChunks, inspectJpegTrailingData, inspectForAnomalies } from "../lib/steganography";

function u32be(n: number): number[] {
  return [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];
}

function chunk(type: string, dataLen = 0): number[] {
  const typeBytes = Array.from(type).map((c) => c.charCodeAt(0));
  return [...u32be(dataLen), ...typeBytes, ...new Array(dataLen).fill(0), 0, 0, 0, 0]; // fake CRC
}

function pngSignature(): number[] {
  return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
}

describe("inspectPngChunks", () => {
  it("does not flag known chunk types", () => {
    const data = new Uint8Array([...pngSignature(), ...chunk("IHDR", 13), ...chunk("IDAT", 0), ...chunk("IEND", 0)]);
    const findings = inspectPngChunks(data);
    expect(findings.some((f) => f.kind === "unknown-chunk")).toBe(false);
  });

  it("flags an unknown chunk type", () => {
    const data = new Uint8Array([...pngSignature(), ...chunk("zzZZ", 4), ...chunk("IEND", 0)]);
    const findings = inspectPngChunks(data);
    expect(findings.some((f) => f.kind === "unknown-chunk" && f.description.includes("zzZZ"))).toBe(true);
  });

  it("detects trailing data after IEND", () => {
    const base = [...pngSignature(), ...chunk("IEND", 0)];
    const data = new Uint8Array([...base, 0xde, 0xad, 0xbe, 0xef]);
    const findings = inspectPngChunks(data);
    const trailing = findings.find((f) => f.kind === "trailing-data");
    expect(trailing).toBeDefined();
    expect(trailing?.length).toBe(4);
  });

  it("does not report false-positive trailing data on a well-formed file", () => {
    const data = new Uint8Array([...pngSignature(), ...chunk("IEND", 0)]);
    const findings = inspectPngChunks(data);
    expect(findings.some((f) => f.kind === "trailing-data")).toBe(false);
  });

  it("returns no findings for non-PNG data", () => {
    const data = new Uint8Array([1, 2, 3, 4]);
    expect(inspectPngChunks(data)).toEqual([]);
  });
});

describe("inspectJpegTrailingData", () => {
  it("detects trailing data after the EOI marker", () => {
    const data = new Uint8Array([0xff, 0xd8, 0xff, 0xd9, 0x01, 0x02, 0x03]);
    const findings = inspectJpegTrailingData(data);
    expect(findings.length).toBe(1);
    expect(findings[0].length).toBe(3);
  });

  it("reports no findings for a JPEG with no trailing data", () => {
    const data = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
    expect(inspectJpegTrailingData(data)).toEqual([]);
  });
});

describe("inspectForAnomalies", () => {
  it("routes to the PNG checker for PNG format", () => {
    const data = new Uint8Array([...pngSignature(), ...chunk("IEND", 0), 1, 2]);
    const findings = inspectForAnomalies(data, "PNG image");
    expect(findings.some((f) => f.kind === "trailing-data")).toBe(true);
  });

  it("returns an empty array for formats without a dedicated check", () => {
    expect(inspectForAnomalies(new Uint8Array([1, 2, 3]), "SQLite database")).toEqual([]);
  });
});
