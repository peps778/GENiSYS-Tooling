export type CommandCategory =
  | "Linux Basics"
  | "Text Processing"
  | "File Analysis"
  | "Filesystem"
  | "Permissions"
  | "Processes"
  | "Networking"
  | "DNS"
  | "HTTP"
  | "JSON"
  | "Reconnaissance"
  | "Kali Linux"
  | "Metasploit"
  | "Katana"
  | "Python";

export interface CommandOption {
  flag: string;
  description: string;
}

export interface CommandExample {
  description: string;
  command: string;
}

export interface LinuxCommand {
  id: string;
  name: string;
  category: CommandCategory;
  summary: string;
  description: string;
  syntax: string;
  tags: string[];
  options: CommandOption[];
  examples: CommandExample[];
  relatedCommands: string[];
}

export type GeneratorPurpose =
  | "file-search"
  | "text-search"
  | "network-scan"
  | "http-request"
  | "dns-query"
  | "file-inspection"
  | "json-filter"
  | "process-investigation";

export interface GeneratorDefinition {
  id: GeneratorPurpose;
  name: string;
  description: string;
}

export interface GeneratedCommand {
  command: string;
  explanation: string;
  valid: boolean;
}
