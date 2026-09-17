import type { LinuxCommand, SearchResult } from "../types/linuxDocs";

const searchable = (command: LinuxCommand) => [
  ["name", command.name],
  ["description", command.description],
  ["syntax", command.syntax],
  ["category", command.category],
  ["tags", command.tags.join(" ")],
  ["examples", command.examples.map((example) => `${example.description} ${example.command}`).join(" ")],
] as const;

export function searchCommands(commands: LinuxCommand[], query: string): SearchResult[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return commands.map((command) => ({ command, score: 0, matchedFields: [] }));
  }

  return commands
    .map((command) => {
      const fields = searchable(command);
      const matchedFields = fields.filter(([, value]) => value.toLowerCase().includes(normalized)).map(([field]) => field);
      let score = matchedFields.length;
      if (command.name.toLowerCase() === normalized) score += 10;
      if (command.tags.some((tag) => tag.toLowerCase() === normalized)) score += 6;
      if (command.name.toLowerCase().includes(normalized)) score += 4;
      return { command, score, matchedFields };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.command.name.localeCompare(b.command.name));
}

export function filterByCategory(commands: LinuxCommand[], category: LinuxCommand["category"] | "all"): LinuxCommand[] {
  return category === "all" ? commands : commands.filter((command) => command.category === category);
}
