import { describe, expect, it } from "vitest";
import { formatEvidence } from "../lib/evidenceFormatter";
import { emptyFinding } from "../data/evidenceTemplates";

describe("evidenceFormatter", () => {
  it("formats a finding with observation and interpretation", () => {
    const finding = { ...emptyFinding(), observation: "Port 80 is open", interpretation: "HTTP is exposed" };
    const output = formatEvidence(finding);
    expect(output).toContain("Observation: Port 80 is open");
    expect(output).toContain("Interpretation: HTTP is exposed");
  });

  it("includes optional command information", () => {
    const output = formatEvidence({ ...emptyFinding(), command: "nmap TARGET" });
    expect(output).toContain("Command: nmap TARGET");
  });
});
