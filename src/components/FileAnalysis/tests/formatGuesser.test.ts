import { describe, it, expect } from "vitest";
import { guessFormat } from "../lib/formatGuesser";

describe("guessFormat", () => {
  it("prefers signature evidence over a matching extension", () => {
    const data = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]); // PDF
    const result = guessFormat(data, "doc.pdf", "application/pdf");
    expect(result.bestGuess).toBe("PDF document");
    expect(result.conflict).toBe(false);
  });

  it("flags a conflict when the extension disagrees with the signature", () => {
    const data = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]); // PDF bytes
    const result = guessFormat(data, "photo.jpg", "image/jpeg");
    expect(result.bestGuess).toBe("PDF document");
    expect(result.conflict).toBe(true);
    expect(result.conflictDetail).toContain(".jpg");
  });

  it("falls back to MIME evidence when there is no reliable signature", () => {
    const data = new Uint8Array([0x11, 0x22, 0x33]);
    const result = guessFormat(data, "file.dat", "text/plain");
    expect(result.evidence.some((e) => e.source === "mime")).toBe(true);
  });

  it("reports Unknown with no evidence for an unrecognizable file with no metadata", () => {
    const data = new Uint8Array([0x11, 0x22, 0x33]);
    const result = guessFormat(data, "noextension", null);
    expect(result.bestGuess).toBe("Unknown");
    expect(result.confidence).toBe("unknown");
  });

  it("does not report a conflict when signature and extension agree", () => {
    const data = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const result = guessFormat(data, "image.png", "image/png");
    expect(result.conflict).toBe(false);
  });
});
