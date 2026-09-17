import type { MetasploitReference } from "../types/linuxDocs";

export const metasploitReferences: MetasploitReference[] = [
  { command: "msfconsole", purpose: "Start the Metasploit console.", example: "msfconsole", notes: ["Use only in an authorized lab or engagement."] },
  { command: "help", purpose: "Show available console commands.", example: "help", notes: [] },
  { command: "search", purpose: "Search the local module database.", example: "search type:auxiliary name:http", notes: ["Use searches to understand available modules before selecting one."] },
  { command: "info", purpose: "Display module metadata and references.", example: "info auxiliary/scanner/http/http_version", notes: [] },
  { command: "use", purpose: "Select a module.", example: "use auxiliary/scanner/http/http_version", notes: ["Selection does not execute a module."] },
  { command: "show options", purpose: "Display configurable module options.", example: "show options", notes: [] },
  { command: "show targets", purpose: "Display supported module targets when applicable.", example: "show targets", notes: [] },
  { command: "show payloads", purpose: "Display compatible payloads when applicable.", example: "show payloads", notes: [] },
  { command: "set", purpose: "Set an option for the current module.", example: "set RHOSTS 192.0.2.10", notes: ["Use only approved target values."] },
  { command: "setg", purpose: "Set a global option.", example: "setg RHOSTS 192.0.2.10", notes: ["Global state can affect later modules; clear it when finished."] },
  { command: "unset", purpose: "Remove a module option.", example: "unset RHOSTS", notes: [] },
  { command: "check", purpose: "Run a module's check operation when supported.", example: "check", notes: ["Not every module supports check."] },
  { command: "run", purpose: "Execute the selected module.", example: "run", notes: ["Execution is potentially disruptive and must be explicitly authorized."] },
  { command: "exploit", purpose: "Execute an exploit module.", example: "exploit", notes: ["Lab/engagement use only."] },
  { command: "back", purpose: "Leave the current module.", example: "back", notes: [] },
  { command: "sessions", purpose: "List or interact with framework sessions.", example: "sessions -l", notes: ["Session handling is sensitive and must remain within the authorized scope."] },
  { command: "jobs", purpose: "List or manage background jobs.", example: "jobs -l", notes: [] },
  { command: "background", purpose: "Background the current compatible session.", example: "background", notes: ["Only use with authorized lab/engagement sessions."] },
  { command: "exit", purpose: "Exit the console.", example: "exit", notes: [] },
];
