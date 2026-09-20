import { describe, it, expect } from "vitest";
import { identifyFile, extractReportedExtension } from "../lib/fileIdentifier";

function buf(bytes: number[]): Uint8Array {
  return new Uint8Array(bytes);
}

describe("identifyFile", () => {
  it("identifies a JPEG by signature", () => {
    const data = buf([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
    const result = identifyFile(data, "photo.jpg");
    expect(result.detectedType).toBe("JPEG image");
    expect(result.confidence).toBe("confirmed");
    expect(result.extensionMismatch).toBe(false);
  });

  it("identifies a PNG by signature", () => {
    const data = buf([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const result = identifyFile(data, "image.png");
    expect(result.detectedType).toBe("PNG image");
    expect(result.signature?.offset).toBe(0);
  });

  it("identifies a PDF by signature", () => {
    const data = buf([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
    const result = identifyFile(data, "doc.pdf");
    expect(result.detectedType).toBe("PDF document");
  });

  it("identifies a ZIP by signature", () => {
    const data = buf([0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0]);
    const result = identifyFile(data, "archive.zip");
    expect(result.detectedType).toBe("ZIP archive");
  });

  it("identifies an ELF binary by signature", () => {
    const data = buf([0x7f, 0x45, 0x4c, 0x46, 1, 1, 1, 0]);
    const result = identifyFile(data, "prog");
    expect(result.detectedType).toBe("ELF binary");
    expect(result.confidence).toBe("confirmed");
  });

  it("reports Unknown for unrecognized binary data", () => {
    const data = buf([0x11, 0x22, 0x33, 0x44, 0x55]);
    const result = identifyFile(data, "mystery.bin");
    expect(result.detectedType).toBe("Unknown");
    expect(result.confidence).toBe("unknown");
    expect(result.signature).toBeNull();
  });

  it("flags an extension mismatch when filename disagrees with signature", () => {
    const data = buf([0x25, 0x50, 0x44, 0x46, 0x2d]); // PDF bytes
    const result = identifyFile(data, "photo.jpg");
    expect(result.detectedType).toBe("PDF document");
    expect(result.extensionMismatch).toBe(true);
  });

  it("does not flag a mismatch when there is no reported extension", () => {
    const data = buf([0x25, 0x50, 0x44, 0x46, 0x2d]);
    const result = identifyFile(data, "noextension");
    expect(result.extensionMismatch).toBe(false);
  });

  it("reports the correct signature offset", () => {
    const data = buf([0x7f, 0x45, 0x4c, 0x46]);
    const result = identifyFile(data, "a.elf");
    expect(result.signature?.offset).toBe(0);
  });

  it("handles truncated input gracefully without throwing", () => {
    const data = buf([0x89, 0x50]); // truncated PNG signature
    expect(() => identifyFile(data, "broken.png")).not.toThrow();
    const result = identifyFile(data, "broken.png");
    expect(result.detectedType).toBe("Unknown");
  });

  it("handles an empty buffer without throwing", () => {
    const data = new Uint8Array(0);
    expect(() => identifyFile(data, "empty.bin")).not.toThrow();
  });
});

describe("extractReportedExtension", () => {
  it("lower-cases and normalizes extensions", () => {
    expect(extractReportedExtension("Photo.JPG")).toBe(".jpg");
  });

  it("returns empty string when there is no extension", () => {
    expect(extractReportedExtension("README")).toBe("");
  });

  it("handles dotfiles without a trailing extension", () => {
    expect(extractReportedExtension(".gitignore")).toBe("");
  });
});
