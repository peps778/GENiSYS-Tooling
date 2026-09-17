import { useMemo, useState } from "react";
import { generateCommand } from "../lib/commandGenerator";
import type { GeneratorPurpose } from "../types/linuxDocs";
import CopyCommandButton from "./CopyCommandButton";

const purposes: Array<[GeneratorPurpose, string]> = [
  ["file-search", "File Search"], ["text-search", "Text Search"], ["network-scan", "Network Scan"], ["http-request", "HTTP Request"], ["dns-query", "DNS Query"], ["file-inspection", "File Inspection"], ["json-filter", "JSON Filter"], ["process-investigation", "Process Investigation"],
];

export default function CommandGenerator() {
  const [purpose, setPurpose] = useState<GeneratorPurpose>("network-scan");
  const [values, setValues] = useState<Record<string, string | boolean>>({ target: "TARGET", ports: "22,80,443", serviceDetection: true });
  const result = useMemo(() => generateCommand(purpose, values), [purpose, values]);

  function update(key: string, value: string | boolean) { setValues((current) => ({ ...current, [key]: value })); }

  const field = (label: string, key: string, placeholder: string) => <label className="block"><span className="mb-1.5 block text-xs font-medium text-gray-600">{label}</span><input value={String(values[key] ?? "")} onChange={(event) => update(key, event.target.value)} placeholder={placeholder} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100" /></label>;
  const check = (label: string, key: string) => <label className="flex items-center gap-2 text-sm text-gray-600"><input type="checkbox" checked={Boolean(values[key])} onChange={(event) => update(key, event.target.checked)} className="rounded border-gray-300 text-green-600 focus:ring-green-500" />{label}</label>;

  return <section className="space-y-5">
    <div className="grid gap-4 rounded-xl border border-gray-200 bg-white p-5 lg:grid-cols-[280px_1fr]">
      <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-green-600">01 / Purpose</p><div className="mt-3 space-y-1">{purposes.map(([id, label]) => <button key={id} type="button" onClick={() => setPurpose(id)} className={["w-full rounded-lg px-3 py-2 text-left text-sm", purpose === id ? "bg-green-50 font-medium text-green-700" : "text-gray-600 hover:bg-gray-50"].join(" ")}>{label}</button>)}</div></div>
      <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-green-600">02 / Attributes</p><div className="mt-3 grid gap-4 sm:grid-cols-2">
        {(purpose === "network-scan") && <>{field("Target", "target", "TARGET")}{field("Ports", "ports", "22,80,443")}{check("Service detection", "serviceDetection")}{check("Default scripts", "defaultScripts")}{check("Disable ping discovery", "pingDisabled")}</>}
        {purpose === "file-search" && <>{field("Path", "path", ".")}{field("Filename pattern", "pattern", "*.log")}<label className="block"><span className="mb-1.5 block text-xs font-medium text-gray-600">Type</span><select value={String(values.type ?? "file")} onChange={(e) => update("type", e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"><option value="file">File</option><option value="directory">Directory</option></select></label></>}
        {purpose === "text-search" && <>{field("Search term", "term", "pattern")}{field("Path", "path", ".")}{check("Ignore case", "ignoreCase")}{check("Line numbers", "lineNumbers")}{check("Recursive", "recursive")}</>}
        {purpose === "http-request" && <>{field("URL", "target", "https://TARGET")}{field("Header", "headers", "Authorization: Bearer ...")}{check("Follow redirects", "followRedirects")}<label className="block"><span className="mb-1.5 block text-xs font-medium text-gray-600">Method</span><select value={String(values.method ?? "GET")} onChange={(e) => update("method", e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"><option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option></select></label></>}
        {purpose === "dns-query" && <>{field("Domain", "target", "example.com")}{field("Record", "record", "A")}</>}
        {purpose === "file-inspection" && <>{field("File", "target", "sample.bin")}{field("Hex bytes", "bytes", "128")}{check("Identify type", "identify")}{check("Extract strings", "strings")}{check("Inspect hex", "hex")}{check("Calculate SHA-256", "hash")}</>}
        {purpose === "json-filter" && <>{field("JSON input", "target", "data.json")}{field("jq filter", "filter", ".[] | .url")}</>}
        {purpose === "process-investigation" && <>{check("Processes", "processes")}{check("Sockets", "sockets")}{check("Network files", "networkFiles")}</>}
      </div></div>
    </div>
    <div className="rounded-xl border border-gray-200 bg-white p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-green-600">03 / Generated command</p><p className="mt-1 text-xs text-gray-500">Generation only. GENiSYS never executes the result.</p></div><CopyCommandButton value={result.command} /></div><pre className="mt-4 max-h-64 overflow-auto rounded-lg bg-gray-950 p-4 font-mono text-sm leading-6 text-green-300"><code>{result.command || "Configure the required attributes."}</code></pre>{!result.valid && <p className="mt-2 text-xs text-red-600">{result.explanation}</p>}</div>
  </section>;
}
