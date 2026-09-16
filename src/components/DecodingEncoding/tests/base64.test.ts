import { describe, expect, it } from "vitest";
import { base64Decode, base64Encode } from "../tools/base64";

describe("base64", () => {
  it("encodes plain text", () => {
    const result = base64Encode("hello world");
    expect(result.ok).toBe(true);
    expect(result.output).toBe("aGVsbG8gd29ybGQ=");
  });

  it("decodes valid base64", () => {
    const result = base64Decode("aGVsbG8gd29ybGQ=");
    expect(result.ok).toBe(true);
    expect(result.output).toBe("hello world");
  });

  it("rejects invalid base64 characters", () => {
    const result = base64Decode("not_valid_base64!!");
    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("rejects empty input", () => {
    expect(base64Encode("").ok).toBe(false);
    expect(base64Decode("").ok).toBe(false);
  });

  it("round-trips unicode text", () => {
    const encoded = base64Encode("héllo 🌍");
    expect(encoded.ok).toBe(true);
    const decoded = base64Decode(encoded.output);
    expect(decoded.ok).toBe(true);
    expect(decoded.output).toBe("héllo 🌍");
  });
});
