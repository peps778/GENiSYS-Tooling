import { describe, expect, it } from "vitest";
import { bytesToHexPreview, identifyFromHexString, matchFileSignature } from "../tools/fileSignatures";

describe("fileSignatures", () => {
  it("matches a PNG signature", () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
    const match = matchFileSignature(bytes);
    expect(match?.definition.name).toBe("PNG Image");
  });

  it("matches a PDF signature", () => {
    const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
    const match = matchFileSignature(bytes);
    expect(match?.definition.name).toBe("PDF Document");
  });

  it("returns null for unrecognized bytes", () => {
    const bytes = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
    expect(matchFileSignature(bytes)).toBeNull();
  });

  it("does not rely on filenames — only matches on byte content", () => {
    // A .txt-looking payload that actually starts with PNG magic bytes.
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const match = matchFileSignature(bytes);
    expect(match?.definition.name).toBe("PNG Image");
  });

  it("builds a hex preview capped at the requested length", () => {
    const bytes = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
    expect(bytesToHexPreview(bytes)).toBe("DE AD BE EF");
    expect(bytesToHexPreview(bytes, 2)).toBe("DE AD");
  });

  it("identifies a signature from a manually entered hex string", () => {
    const result = identifyFromHexString("504b0304");
    expect(result.ok).toBe(true);
    expect(result.output).toContain("ZIP Archive");
  });

  it("rejects invalid hex input for manual lookups", () => {
    const result = identifyFromHexString("zz");
    expect(result.ok).toBe(false);
  });
});
