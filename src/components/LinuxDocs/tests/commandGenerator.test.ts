import { describe, expect, it } from "vitest";
import { generateCommand } from "../lib/commandGenerator";

describe("Linux Docs command generator", () => {
  it("generates an Nmap command", () => {
    const result = generateCommand("network-scan", { target: "TARGET", ports: "22,80", serviceDetection: true });
    expect(result.valid).toBe(true);
    expect(result.command).toContain("nmap");
    expect(result.command).not.toContain("undefined");
  });
  it("rejects a missing target", () => expect(generateCommand("network-scan", {}).valid).toBe(false));
});
