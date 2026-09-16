import { describe, expect, it } from "vitest";
import { binaryToText, textToBinary } from "../tools/binary";

describe("binary", () => {
  it("converts binary to text", () => {
    const result = binaryToText("01001000 01101001");
    expect(result.ok).toBe(true);
    expect(result.output).toBe("Hi");
  });

  it("converts text to binary", () => {
    const result = textToBinary("Hi");
    expect(result.ok).toBe(true);
    expect(result.output).toBe("01001000 01101001");
  });

  it("rejects non-multiple-of-8 bit strings", () => {
    const result = binaryToText("0100100");
    expect(result.ok).toBe(false);
  });

  it("rejects non-binary characters", () => {
    const result = binaryToText("0102000");
    expect(result.ok).toBe(false);
  });
});
