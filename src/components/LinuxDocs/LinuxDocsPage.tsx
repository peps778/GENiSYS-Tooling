import { useMemo, useState } from "react";
import { commands } from "./data/commands";
import { categories } from "./data/categories";
import { searchCommands } from "./lib/commandSearch";
import type { CommandCategory } from "./types/linuxDocs";
import CommandCard from "./components/CommandCard";
import CommandDetail from "./components/CommandDetail";
import CommandGenerator from "./components/CommandGenerator";
import KaliReference from "./components/KaliReference";
import PythonReference from "./components/PythonReference";
import Workflows from "./components/Workflows";

const specialCategories = new Set(["Kali / Tools", "Workflows", "Generator"]);

type View = "reference" | "generator" | "kali" | "workflows" | "python";

export default function LinuxDocsPage() {
  const [view, setView] = useState<View>("reference");
  const [category, setCategory] = useState<string>("All");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(commands[0]?.id ?? "");

  const filtered = useMemo(() => {
    const searched = searchCommands(commands, query);
    if (category === "All" || specialCategories.has(category)) return searched;
    return searched.filter((command) => command.category === category);
  }, [category, query]);

  const selected = filtered.find((command) => command.id === selectedId) ?? filtered[0] ?? commands[0];

  function selectCategory(value: string) {
    setCategory(value);
    if (specialCategories.has(value)) {
      if (value === "Generator") setView("generator");
      else if (value === "Kali / Tools") setView("kali");
      else if (value === "Workflows") setView("workflows");
    } else {
      setView("reference");
    }
  }

  return <div className="min-w-0">
    <header className="mb-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-green-600">GENiSYS / Linux Security Reference</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-950">Linux Docs</h1><p className="mt-1 max-w-2xl text-sm text-gray-500">Practical command reference, security workflows, Kali tooling, and a non-executing command generator.</p></div><div className="rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-xs text-green-700">Authorized testing only</div></div></header>
    <div className="mb-5 rounded-lg border border-gray-200 bg-white p-3"><div className="flex flex-wrap gap-2">{(["reference", "generator", "kali", "workflows", "python"] as View[]).map((item) => <button key={item} type="button" onClick={() => setView(item)} className={["rounded-md px-3 py-1.5 text-xs font-medium capitalize", view === item ? "bg-green-600 text-white" : "text-gray-600 hover:bg-gray-100"].join(" ")}>{item === "kali" ? "Kali / Tools" : item}</button>)}</div></div>
    {view === "generator" ? <CommandGenerator /> : view === "kali" ? <KaliReference /> : view === "workflows" ? <Workflows /> : view === "python" ? <PythonReference /> : <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)_minmax(420px,1.3fr)]">
      <aside className="rounded-xl border border-gray-200 bg-white p-3"><div className="px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">Categories</div><div className="space-y-1">{categories.map((item) => <button key={item} type="button" onClick={() => selectCategory(item)} className={["w-full rounded-lg px-3 py-2 text-left text-xs font-medium", category === item && view === "reference" ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50"].join(" ")}>{item}</button>)}</div></aside>
      <section className="min-w-0"><div className="mb-3"><input aria-label="Search Linux commands" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search commands, flags, tags, or concepts..." className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100" /></div><div className="mb-3 flex items-center justify-between px-1 text-xs text-gray-400"><span>{filtered.length} reference{filtered.length === 1 ? "" : "s"}</span><span>{category}</span></div><div className="space-y-2">{filtered.map((command) => <CommandCard key={command.id} command={command} selected={selected?.id === command.id} onSelect={() => setSelectedId(command.id)} />)}{filtered.length === 0 && <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">No commands match this search.</div>}</div></section>
      <section className="min-w-0">{selected ? <CommandDetail command={selected} /> : null}</section>
    </div>}
    <p className="mt-6 text-[11px] leading-5 text-gray-400">Use reconnaissance, scanning, exploitation, and post-exploitation techniques only on systems you own or are explicitly authorized to test. Generated commands are displayed and copied only; GENiSYS does not execute them.</p>
  </div>;
}

