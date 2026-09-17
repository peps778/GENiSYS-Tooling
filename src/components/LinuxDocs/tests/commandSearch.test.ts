import { describe, expect, it } from "vitest";
import { commands } from "../data/commands";
import { searchCommands } from "../lib/commandSearch";

describe("Linux Docs command search", () => {
  it("returns all commands for an empty query", () => expect(searchCommands(commands, "")).toHaveLength(commands.length));
  it("finds an exact command", () => expect(searchCommands(commands, "grep").some((item) => item.name === "grep")).toBe(true));
  it("finds a command by tag", () => expect(searchCommands(commands, "regex").some((item) => item.name === "grep")).toBe(true));
});
