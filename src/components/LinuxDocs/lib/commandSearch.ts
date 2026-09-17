import type { LinuxCommand } from "../types/linuxDocs";

export function searchCommands(commands: LinuxCommand[], query: string): LinuxCommand[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return commands;

  return commands.filter((command) => {
    const haystack = [
      command.name,
      command.summary,
      command.description,
      command.category,
      ...command.tags,
      ...command.relatedCommands,
    ].join(" ").toLowerCase();
    return haystack.includes(normalized);
  });
}
