import { describe, expect, it } from "vitest";
import { commands } from "../data/commands";

describe("Linux Docs data integrity", () => {
  it("contains the required core references", () => {
    const names = new Set(commands.map((command) => command.name));
    ["grep", "sed", "awk", "cut", "sort", "uniq", "strings", "file", "xxd", "base64", "curl", "wget", "find", "locate", "tar", "unzip", "chmod", "ps", "ss", "dig", "nslookup", "nmap", "jq", "python3"].forEach((name) => expect(names.has(name)).toBe(true));
  });
  it("does not contain empty command definitions", () => commands.forEach((command) => {
    expect(command.id).toBeTruthy(); expect(command.name).toBeTruthy(); expect(command.syntax).toBeTruthy(); expect(command.examples.length).toBeGreaterThan(0);
  }));
});
