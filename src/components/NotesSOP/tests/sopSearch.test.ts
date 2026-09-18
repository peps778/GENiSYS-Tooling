import { describe, expect, it } from "vitest";
import { searchSOP } from "../lib/sopSearch";
import { enumerationCases } from "../data/enumerationCases";
import { vulnerabilities } from "../data/vulnerabilities";

describe("searchSOP", () => {
  const cases = enumerationCases;

  it("finds a case by title", () => {
    expect(searchSOP(cases, vulnerabilities, "unknown target")[0]?.id).toBe("enum-unknown-target");
  });

  it("finds commands", () => {
    expect(searchSOP(cases, vulnerabilities, "nmap").some((x) => x.type === "case")).toBe(true);
  });

  it("finds vulnerabilities", () => {
    expect(searchSOP(cases, vulnerabilities, "SQL Injection").some((x) => x.id === "vuln-sql")).toBe(true);
  });

  it("is case insensitive", () => {
    expect(searchSOP(cases, vulnerabilities, "NMAP").length).toBeGreaterThan(0);
  });

  it("returns no results for unknown text", () => {
    expect(searchSOP(cases, vulnerabilities, "zzzz-no-match")).toEqual([]);
  });
});
