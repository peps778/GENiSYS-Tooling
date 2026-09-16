import { describe, expect, it } from "vitest";
import { urlDecode, urlEncode } from "../tools/url";

describe("url", () => {
  it("encodes special characters", () => {
    const result = urlEncode("a b&c=d");
    expect(result.ok).toBe(true);
    expect(result.output).toBe("a%20b%26c%3Dd");
  });

  it("decodes percent-encoded input", () => {
    const result = urlDecode("a%20b%26c%3Dd");
    expect(result.ok).toBe(true);
    expect(result.output).toBe("a b&c=d");
  });

  it("rejects malformed percent-encoding", () => {
    const result = urlDecode("100% off%");
    expect(result.ok).toBe(false);
  });

  it("rejects empty input", () => {
    expect(urlEncode("").ok).toBe(false);
    expect(urlDecode("").ok).toBe(false);
  });
});
