import { describe, expect, it } from "vitest";
import { base32Decode, base32Encode } from "../tools/base32";

describe("base32", () => {
  it("encodes plain text", () => {
    const result = base32Encode("hello");
    expect(result.ok).toBe(true);
    expect(result.output).toBe("NBSWY3DP");
  });

  it("decodes valid base32", () => {
    const result = base32Decode("NBSWY3DP");
    expect(result.ok).toBe(true);
    expect(result.output).toBe("hello");
  });

  it("rejects invalid characters", () => {
    const result = base32Decode("this-is-not-base32!");
    expect(result.ok).toBe(false);
  });

  it("rejects empty input", () => {
    expect(base32Encode("").ok).toBe(false);
    expect(base32Decode("").ok).toBe(false);
  });
});
