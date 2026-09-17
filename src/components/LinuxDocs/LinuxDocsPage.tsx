import { useMemo, useState } from "react";
import { linuxCommands } from "./data/commands";
import { commandCategories } from "./data/categories";
import { searchCommands, filterByCategory } from "./lib/commandSearch";
import type { CommandCategory } from "./types/linuxDocs";
import { LinuxDocsHeader } from "./components/LinuxDocsHeader";
import { LinuxDocsSidebar } from "./components/LinuxDocsSidebar";
import { CommandSearch } from "./components/CommandSearch";
import { CategoryTabs } from "./components/CategoryTabs";
import { CommandCard } from "./components/CommandCard";
import { CommandGenerator } from "./components/CommandGenerator";
import { PipelineBuilder } from "./components/PipelineBuilder";
import { KaliReference } from "./components/KaliReference";
import { MetasploitReference } from "./components/MetasploitReference";
import { KatanaReference } from "./components/KatanaReference";
import { PythonOneLiners } from "./components/PythonOneLiners";
import { Hack4GovCheatSheet } from "./components/Hack4GovCheatSheet";
import { SafetyNotice } from "./components/SafetyNotice";

export function LinuxDocsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CommandCategory | "all">("all");
  const [mobileArea, setMobileArea] = useState("commands");

  const filtered = useMemo(() => {
    const categoryCommands = filterByCategory(linuxCommands, category);
    return query ? searchCommands(categoryCommands, query).map((result) => result.command) : categoryCommands;
  }, [query, category]);

  return (
    <main className="flex min-h-0 min-w-0 flex-1 overflow-hidden bg-slate-100">
      <LinuxDocsSidebar categories={commandCategories} selected={category} onChange={setCategory} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <LinuxDocsHeader commandCount={linuxCommands.length} />
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="mx-auto min-w-0 max-w-[1600px] space-y-4 p-3 sm:p-4">
            <SafetyNotice />
            <div className="sticky top-0 z-10 -mx-1 rounded-md border border-slate-200 bg-slate-100/95 p-2 backdrop-blur-sm">
              <CommandSearch query={query} onQueryChange={setQuery} resultCount={filtered.length} />
              <div className="mt-2 lg:hidden">
                <select value={mobileArea} onChange={(event) => setMobileArea(event.target.value)} className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700">
                  <option value="commands">Command library</option>
                  <option value="generator">Command generator</option>
                  <option value="pipelines">Pipeline builder</option>
                  <option value="kali">Kali reference</option>
                  <option value="metasploit">Metasploit</option>
                  <option value="katana">Katana</option>
                  <option value="python">Python one-liners</option>
                  <option value="hack4gov">Hack4Gov cheat sheet</option>
                </select>
              </div>
            </div>

            <section className={`${mobileArea === "commands" ? "" : "hidden lg:block"} min-w-0 space-y-3`}>
              <div className="hidden lg:block"><CategoryTabs categories={commandCategories} selected={category} onChange={setCategory} /></div>
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {filtered.map((command, index) => <CommandCard key={command.id} command={command} defaultOpen={index === 0 && !query} />)}
              </div>
              {filtered.length === 0 && <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">No commands match the current search and category.</div>}
            </section>

            <section className={`${mobileArea === "generator" ? "" : "hidden lg:block"} rounded-lg border border-slate-200 bg-white p-4`}>
              <div className="mb-4"><h2 className="text-sm font-bold text-slate-900">Command generator</h2><p className="mt-1 text-xs text-slate-500">Purpose → attributes → generated command → copy. Generation is local and never executes a shell command.</p></div>
              <CommandGenerator />
            </section>

            <section className={`${mobileArea === "pipelines" ? "" : "hidden lg:block"} rounded-lg border border-slate-200 bg-white p-4`}>
              <div className="mb-4"><h2 className="text-sm font-bold text-slate-900">Pipeline builder</h2><p className="mt-1 text-xs text-slate-500">Reusable, read-oriented workflows for triage and evidence handling.</p></div>
              <PipelineBuilder />
            </section>

            <section className={`${mobileArea === "kali" ? "" : "hidden lg:block"} rounded-lg border border-slate-200 bg-white p-4`}>
              <h2 className="mb-1 text-sm font-bold text-slate-900">Kali reference</h2><p className="mb-3 text-xs text-slate-500">Shared KaliTool contract: name, purpose, command, category, tags.</p><KaliReference />
            </section>

            <section className={`${mobileArea === "metasploit" ? "" : "hidden lg:block"} rounded-lg border border-slate-200 bg-white p-4`}>
              <h2 className="mb-1 text-sm font-bold text-slate-900">Metasploit / msfconsole</h2><p className="mb-3 text-xs text-amber-700">Authorized lab or engagement use only.</p><MetasploitReference />
            </section>

            <section className={`${mobileArea === "katana" ? "" : "hidden lg:block"} rounded-lg border border-slate-200 bg-white p-4`}>
              <h2 className="mb-1 text-sm font-bold text-slate-900">Katana reference</h2><p className="mb-3 text-xs text-slate-500">Crawling, JavaScript parsing, output, deduplication, and endpoint filtering.</p><KatanaReference />
            </section>

            <section className={`${mobileArea === "python" ? "" : "hidden lg:block"} rounded-lg border border-slate-200 bg-white p-4`}>
              <h2 className="mb-1 text-sm font-bold text-slate-900">Python one-liners</h2><p className="mb-3 text-xs text-slate-500">Local analysis, parsing, hashing, and controlled connectivity checks.</p><PythonOneLiners />
            </section>

            <section className={`${mobileArea === "hack4gov" ? "" : "hidden lg:block"} rounded-lg border border-slate-200 bg-white p-4`}>
              <h2 className="mb-1 text-sm font-bold text-slate-900">Hack4Gov quick reference</h2><p className="mb-3 text-xs text-slate-500">Initial triage, web, DNS, file analysis, logs, and evidence handling.</p><Hack4GovCheatSheet />
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

export default LinuxDocsPage;
