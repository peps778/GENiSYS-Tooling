import { describe, expect, it } from "vitest";
import { asciiToHex, hexToAscii } from "../tools/hexAscii";

describe("hexAscii", () => {
  it("converts hex to ascii", () => {
    const result = hexToAscii("48656c6c6f");
    expect(result.ok).toBe(true);
    expect(result.output).toBe("Hello");
  });

  it("converts ascii to hex", () => {
    const result = asciiToHex("Hi");
    expect(result.ok).toBe(true);
    expect(result.output).toBe("48 69");
  });

  it("rejects odd-length hex", () => {
    const result = hexToAscii("485");
    expect(result.ok).toBe(false);
  });

  it("rejects non-hex characters", () => {
    const result = hexToAscii("zz");
    expect(result.ok).toBe(false);
  });

  it("rejects empty input", () => {
    expect(hexToAscii("").ok).toBe(false);
    expect(asciiToHex("").ok).toBe(false);
  });
});
