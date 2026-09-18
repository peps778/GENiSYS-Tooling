import { describe, expect, it } from "vitest";
import { getNextActions } from "../lib/nextActionEngine";
import { enumerationCases } from "../data/enumerationCases";

describe("nextActionEngine", () => {
  it("returns branch actions", () => {
    expect(getNextActions(enumerationCases[0]).length).toBeGreaterThan(0);
  });

  it("does not repeat a completed action", () => {
    const actions = getNextActions(enumerationCases[0], ["Web enumeration"]);
    expect(actions.every((x) => !x.title.toLowerCase().includes("web enumeration"))).toBe(true);
  });

  it("can exclude a dead-end", () => {
    const actions = getNextActions(enumerationCases[0], [], ["DNS investigation"]);
    expect(actions.every((x) => !x.title.toLowerCase().includes("dns investigation"))).toBe(true);
  });
});
