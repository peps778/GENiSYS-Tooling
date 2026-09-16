import { describe, expect, it } from "vitest";
import { compileSafeRegex, searchStrings } from "../lib/regexSearch";

describe("compileSafeRegex", () => {
  it("compiles a valid pattern and forces the global flag", () => {
    const { regex, error } = compileSafeRegex("foo\\d+", "i");
    expect(error).toBeUndefined();
    expect(regex).not.toBeNull();
    expect(regex?.flags).toContain("g");
    expect(regex?.flags).toContain("i");
  });

  it("returns an error for an empty pattern", () => {
    const { regex, error } = compileSafeRegex("", "");
    expect(regex).toBeNull();
    expect(error).toBeDefined();
  });

  it("returns an error instead of throwing for invalid regex syntax", () => {
    const { regex, error } = compileSafeRegex("(unterminated", "");
    expect(regex).toBeNull();
    expect(error).toBeDefined();
  });

  it("rejects patterns exceeding the maximum length", () => {
    const { regex, error } = compileSafeRegex("a".repeat(1000), "");
    expect(regex).toBeNull();
    expect(error).toMatch(/maximum length/i);
  });
});

describe("searchStrings", () => {
  const corpus = [
    "user_token=abc123",
    "another line with no match",
    "second_token=def456 and a duplicate_token=ghi789",
  ];

  it("finds matches across multiple strings", () => {
    const outcome = searchStrings(corpus, "\\w+_token=\\w+", "");
    expect(outcome.error).toBeUndefined();
    expect(outcome.results.length).toBeGreaterThanOrEqual(3);
  });

  it("respects case-insensitive flag", () => {
    const outcome = searchStrings(["HELLO world"], "hello", "i");
    expect(outcome.results).toHaveLength(1);
  });

  it("is case sensitive without the flag", () => {
    const outcome = searchStrings(["HELLO world"], "hello", "");
    expect(outcome.results).toHaveLength(0);
  });

  it("returns multiple matches within a single string", () => {
    const outcome = searchStrings(
      ["second_token=def456 and a duplicate_token=ghi789"],
      "\\w+_token=\\w+",
      ""
    );
    expect(outcome.results).toHaveLength(2);
  });

  it("surfaces a compile error instead of throwing for invalid patterns", () => {
    const outcome = searchStrings(corpus, "(unterminated", "");
    expect(outcome.results).toEqual([]);
    expect(outcome.error).toBeDefined();
  });

  it("truncates results and reports truncated:true when the limit is hit", () => {
    const many = Array.from({ length: 50 }, (_, i) => `token${i}`);
    const outcome = searchStrings(many, "token\\d+", "", { limit: 10 });
    expect(outcome.results).toHaveLength(10);
    expect(outcome.truncated).toBe(true);
  });

  it("handles an empty string corpus", () => {
    const outcome = searchStrings([], "anything", "");
    expect(outcome.results).toEqual([]);
    expect(outcome.truncated).toBe(false);
  });

  it("does not infinite-loop on zero-length matches", () => {
    const outcome = searchStrings(["abc"], "x*", "");
    // Should terminate and produce a bounded number of results.
    expect(outcome.results.length).toBeLessThanOrEqual(4);
  });
});
