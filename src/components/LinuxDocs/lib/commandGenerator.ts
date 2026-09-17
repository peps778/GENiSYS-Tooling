import type { GeneratedCommand, GeneratorPurpose } from "../types/linuxDocs";

const clean = (value: string) => value.trim();
const shellSafe = (value: string) => value.replace(/[\n\r]/g, "").trim();

export function generateCommand(purpose: GeneratorPurpose, values: Record<string, string | boolean>): GeneratedCommand {
  const target = shellSafe(String(values.target ?? ""));

  switch (purpose) {
    case "file-search": {
      const path = shellSafe(String(values.path || "."));
      const pattern = shellSafe(String(values.pattern || "*"));
      const type = values.type === "directory" ? "d" : "f";
      return { command: `find ${path} -type ${type} -name '${pattern.replaceAll("'", "'\\''")}'`, explanation: "Search a filesystem tree by type and filename pattern.", valid: Boolean(path && pattern) };
    }
    case "text-search": {
      const path = shellSafe(String(values.path || "."));
      const term = clean(String(values.term || ""));
      if (!term) return { command: "", explanation: "A search term is required.", valid: false };
      const flags = `${values.ignoreCase ? "i" : ""}${values.lineNumbers ? "n" : ""}${values.recursive ? "R" : ""}`;
      return { command: `grep -${flags || "n"} '${term.replaceAll("'", "'\\''")}' ${path}`, explanation: "Search text using grep with the selected options.", valid: true };
    }
    case "network-scan": {
      if (!target) return { command: "", explanation: "A target is required.", valid: false };
      const flags = [values.pingDisabled ? "-Pn" : "", values.serviceDetection ? "-sV" : "", values.defaultScripts ? "-sC" : ""].filter(Boolean).join(" ");
      const ports = shellSafe(String(values.ports || ""));
      return { command: `nmap ${flags}${ports ? ` -p ${ports}` : ""} ${target}`.replace(/  +/g, " "), explanation: "Generate an Nmap command for an authorized assessment target.", valid: true };
    }
    case "http-request": {
      if (!target) return { command: "", explanation: "A URL is required.", valid: false };
      const method = String(values.method || "GET").toUpperCase();
      const parts = [`curl -s`, method !== "GET" ? `-X ${method}` : "", values.followRedirects ? "-L" : "", values.headers ? `-H '${shellSafe(String(values.headers))}'` : "", target].filter(Boolean);
      return { command: parts.join(" "), explanation: "Generate a curl request without executing it.", valid: true };
    }
    case "dns-query": {
      if (!target) return { command: "", explanation: "A domain is required.", valid: false };
      const record = String(values.record || "A").toUpperCase();
      return { command: `dig +short ${record} ${target}`, explanation: "Generate a concise DNS query.", valid: true };
    }
    case "file-inspection": {
      if (!target) return { command: "", explanation: "A file is required.", valid: false };
      const commands = [values.identify ? `file ${target}` : "", values.strings ? `strings -n 8 ${target}` : "", values.hex ? `xxd -l ${shellSafe(String(values.bytes || "128"))} ${target}` : "", values.hash ? `sha256sum ${target}` : ""].filter(Boolean);
      return { command: commands.join("\n"), explanation: "Generate a non-executing file inspection checklist.", valid: commands.length > 0 };
    }
    case "json-filter": {
      if (!target) return { command: "", explanation: "A JSON file or input path is required.", valid: false };
      const filter = shellSafe(String(values.filter || "."));
      return { command: `jq -r '${filter.replaceAll("'", "'\\''")}' ${target}`, explanation: "Generate a jq JSON filter.", valid: true };
    }
    case "process-investigation": {
      const commands = [values.processes ? "ps aux" : "", values.sockets ? "ss -tunap" : "", values.networkFiles ? "lsof -i" : ""].filter(Boolean);
      return { command: commands.join("\n"), explanation: "Generate local process/network investigation commands.", valid: commands.length > 0 };
    }
  }
}
