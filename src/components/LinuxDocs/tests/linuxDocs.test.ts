import { describe, expect, it } from "vitest";
import { linuxCommands } from "../data/commands";
import { kaliTools } from "../data/kali";
import { commandCategories } from "../data/categories";
import { validateGeneratedCommand } from "../lib/commandValidation";

describe("Linux Docs contracts", () => {
  it("keeps every Kali tool on the shared contract", () => {
    for (const tool of kaliTools) {
      expect(Object.keys(tool).sort()).toEqual(["category", "command", "name", "purpose", "tags"]);
      expect(typeof tool.name).toBe("string");
      expect(typeof tool.purpose).toBe("string");
      expect(typeof tool.command).toBe("string");
      expect(typeof tool.category).toBe("string");
      expect(Array.isArray(tool.tags)).toBe(true);
    }
  });

  it("contains all major requested categories", () => {
    const categories = new Set(linuxCommands.map((command) => command.category));
    expect(categories).toEqual(expect.objectContaining({}));
    for (const category of ["core", "text", "forensics", "process", "network", "dns", "web", "nmap"]) {
      expect(categories.has(category)).toBe(true);
    }
    expect(commandCategories.map((item) => item.id)).toEqual(expect.arrayContaining(["core", "text", "forensics", "process", "network", "dns", "web", "nmap"]));
  });

  it("flags destructive shell patterns", () => {
    expect(validateGeneratedCommand("rm -rf /").valid).toBe(false);
    expect(validateGeneratedCommand("mkfs.ext4 /dev/sda").valid).toBe(false);
    expect(validateGeneratedCommand("grep -n error app.log").valid).toBe(true);
  });
});
