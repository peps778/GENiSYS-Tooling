import { useMemo, useState, type ReactNode } from "react";
import OSINTSidebar from "./components/OSINTSidebar";
import OSINTHeader from "./components/OSINTHeader";
import OSINTCaseCard from "./components/OSINTCaseCard";
import OSINTCaseDetail from "./components/OSINTCaseDetail";
import QuickReference from "./components/QuickReference";
import Overview from "./components/Overview";
import EvidenceWorkflow from "./components/EvidenceWorkflow";
import ToolLibrary from "./components/ToolLibrary";
import FlagLogbook from "./components/FlagLogbook";
import { OSINT_CASES } from "./data/cases";
import { osintTools } from "./data/osintTools";
import { quickReferenceGroups } from "./data/quickReference";
import { OSINT_SECTIONS } from "./data/sections";
import { searchOSINTCases, searchOSINTReferences, searchOSINTTools } from "./lib/osintSearch";
import type { OSINTCase, OSINTCategory, OSINTDifficulty, OSINTPhase } from "./types/osint";

export default function OSINTPage() {
  const [section, setSection] = useState<OSINTCategory>("overview");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(OSINT_CASES[0]?.id ?? "");
  const [flagCount, setFlagCount] = useState(0);
  const [category, setCategory] = useState<"all" | OSINTCase["category"]>("all");
  const [difficulty, setDifficulty] = useState<"all" | OSINTDifficulty>("all");
  const [phase, setPhase] = useState<"all" | OSINTPhase>("all");
  const [tool, setTool] = useState("all");
  const [evidence, setEvidence] = useState("all");
  const [status, setStatus] = useState<"all" | NonNullable<OSINTCase["status"]>>( "all");

  const filteredCases = useMemo(() => searchOSINTCases(OSINT_CASES, query).filter(x =>
    (category === "all" || x.category === category) &&
    (difficulty === "all" || x.difficulty === difficulty) &&
    (phase === "all" || x.phase === phase) &&
    (tool === "all" || x.relatedTools.includes(tool)) &&
    (evidence === "all" || x.evidenceTypes.includes(evidence)) &&
    (status === "all" || x.status === status)
  ), [query, category, difficulty, phase, tool, evidence, status]);

  const globalResults = useMemo(() => ({
    cases: searchOSINTCases(OSINT_CASES, query).slice(0, 6),
    tools: searchOSINTTools(osintTools, query).slice(0, 4),
    references: searchOSINTReferences(quickReferenceGroups, query).slice(0, 5),
  }), [query]);

  const activeSection = OSINT_SECTIONS.find(x => x.id === section) ?? OSINT_SECTIONS[0];
  const selectSection = (id: string) => setSection(id as OSINTCategory);
  const clearFilters = () => { setQuery(""); setCategory("all"); setDifficulty("all"); setPhase("all"); setTool("all"); setEvidence("all"); setStatus("all"); };

  const jumpToCase = (id: string) => { setSelectedId(id); setSection("cases"); };
  const jumpTo = (id: OSINTCategory) => setSection(id);

  return (
    <div className="isolate flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-slate-50">
      <OSINTHeader
        caseCount={OSINT_CASES.length}
        toolCount={osintTools.length}
        flagCount={flagCount}
        query={query}
        onQueryChange={setQuery}
        searchResults={query.trim() ? <GlobalSearchResults results={globalResults} onCase={jumpToCase} onSection={jumpTo} /> : undefined}
      />
      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        <OSINTSidebar sections={OSINT_SECTIONS} active={section} onSelect={selectSection} />
        <main className="min-w-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="mx-auto w-full max-w-[1600px] px-3 py-3 sm:px-5 sm:py-5">
            <div className="mb-3 lg:hidden">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">OSINT section</label>
              <select value={section} onChange={e => selectSection(e.target.value)} aria-label="OSINT section" className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-xs">
                {OSINT_SECTIONS.map(x => <option key={x.id} value={x.id}>{x.number} — {x.title}</option>)}
              </select>
            </div>

            <section className="mb-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className="flex flex-wrap items-start justify-between gap-4 px-4 py-4 sm:px-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400"><span>OSINT</span><span>/</span><span className="text-emerald-700">{activeSection.title}</span></div>
                  <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">{activeSection.title}</h1>
                  <p className="mt-1 max-w-4xl text-xs leading-5 text-slate-500 sm:text-sm">{activeSection.description}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Stat title="Cases" value={String(OSINT_CASES.length)} />
                  <Stat title="Tools" value={String(osintTools.length)} />
                  <Stat title="Scenarios" value={String(112)} />
                </div>
              </div>
              {section === "cases" && <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 text-[10px] text-slate-500 sm:px-5"><span className="font-semibold text-slate-700">Master case library</span> · Search globally above, then narrow by category, phase, evidence, tool, difficulty, or status.</div>}
            </section>

            {section === "overview" ? <Overview onSection={selectSection} /> :
             section === "quick-reference" ? <QuickReference /> :
             section === "public-evidence" || section === "evidence-workflow" ? <EvidenceWorkflow /> :
             section === "tools" ? <ToolLibrary /> :
             section === "logbook" ? <FlagLogbook onCountChange={setFlagCount} /> :
             <CaseWorkspace cases={filteredCases} selected={filteredCases.find(x => x.id === selectedId) ?? filteredCases[0]} category={category} setCategory={setCategory} difficulty={difficulty} setDifficulty={setDifficulty} phase={phase} setPhase={setPhase} tool={tool} setTool={setTool} evidence={evidence} setEvidence={setEvidence} status={status} setStatus={setStatus} clearFilters={clearFilters} onSelect={setSelectedId} onAddFlag={() => setSection("logbook")} />
            }
          </div>
        </main>
      </div>
    </div>
  );
}

function GlobalSearchResults({ results, onCase, onSection }: { results: { cases: OSINTCase[]; tools: typeof osintTools; references: ReturnType<typeof searchOSINTReferences> }; onCase: (id: string) => void; onSection: (id: OSINTCategory) => void }) {
  const total = results.cases.length + results.tools.length + results.references.length;
  return <div className="absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
    <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Global OSINT search</span><span className="text-[10px] text-slate-400">{total} quick matches</span></div>
    <div className="max-h-[55vh] overflow-y-auto">
      {results.cases.length > 0 && <SearchGroup title="Cases" onView={() => onSection("cases")}>{results.cases.map(item => <button key={item.id} type="button" onClick={() => onCase(item.id)} className="block w-full border-b border-slate-100 px-3 py-2.5 text-left hover:bg-emerald-50/60"><div className="flex gap-2"><span className="shrink-0 rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">{item.id}</span><span className="min-w-0 truncate text-xs font-semibold text-slate-800">{item.title}</span></div><p className="mt-1 line-clamp-1 pl-0 text-[10px] text-slate-500">{item.situation}</p></button>)}</SearchGroup>}
      {results.tools.length > 0 && <SearchGroup title="Tools" onView={() => onSection("tools")}>{results.tools.map(item => <button key={item.id} type="button" onClick={() => onSection("tools")} className="block w-full border-b border-slate-100 px-3 py-2.5 text-left hover:bg-emerald-50/60"><span className="text-xs font-semibold text-slate-800">{item.name}</span><span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-500">{item.category}</span><p className="mt-1 text-[10px] text-slate-500">{item.purpose}</p></button>)}</SearchGroup>}
      {results.references.length > 0 && <SearchGroup title="Quick reference" onView={() => onSection("quick-reference")}>{results.references.map(item => <button key={item.id} type="button" onClick={() => onSection("quick-reference")} className="block w-full border-b border-slate-100 px-3 py-2.5 text-left hover:bg-emerald-50/60"><span className="text-xs font-semibold text-slate-800">{item.name}</span><p className="mt-1 text-[10px] text-slate-500">{item.summary}</p></button>)}</SearchGroup>}
      {total === 0 && <div className="px-4 py-8 text-center text-xs text-slate-500">No matching cases, tools, or reference entries. Try a domain term, tool name, record type, evidence type, or case keyword.</div>}
    </div>
  </div>;
}
function SearchGroup({ title, onView, children }: { title: string; onView: () => void; children: ReactNode }) { return <section><div className="flex items-center justify-between border-b border-slate-100 px-3 py-2"><span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{title}</span><button type="button" onClick={onView} className="text-[9px] font-semibold text-emerald-700 hover:underline">View section</button></div>{children}</section>; }
function CaseWorkspace({cases,selected,category,setCategory,difficulty,setDifficulty,phase,setPhase,tool,setTool,evidence,setEvidence,status,setStatus,clearFilters,onSelect,onAddFlag}:{cases:OSINTCase[];selected?:OSINTCase;category:"all"|OSINTCase["category"];setCategory:(x:"all"|OSINTCase["category"])=>void;difficulty:"all"|OSINTDifficulty;setDifficulty:(x:"all"|OSINTDifficulty)=>void;phase:"all"|OSINTPhase;setPhase:(x:"all"|OSINTPhase)=>void;tool:string;setTool:(x:string)=>void;evidence:string;setEvidence:(x:string)=>void;status:"all"|NonNullable<OSINTCase["status"]>;setStatus:(x:"all"|NonNullable<OSINTCase["status"]>)=>void;clearFilters:()=>void;onSelect:(id:string)=>void;onAddFlag:()=>void}) {
  const activeFilterCount = [category,difficulty,phase,tool,evidence,status].filter(x => x !== "all").length;
  return <div className="space-y-3">
    <details open className="overflow-hidden rounded-lg border border-slate-200 bg-white"><summary className="cursor-pointer list-none border-b border-slate-200 bg-slate-50/70 px-3 py-2.5"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold text-slate-900">Case filters</p><p className="mt-0.5 text-[10px] text-slate-400">{activeFilterCount ? `${activeFilterCount} active filters` : "All investigation cases"}</p></div><span className="text-[11px] text-slate-400">⌄</span></div></summary><div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      <Select label="Category" value={category} onChange={setCategory} options={["all","dns","whois","subdomains","url-domain","metadata","search","username-email","public-evidence"]}/><Select label="Difficulty" value={difficulty} onChange={setDifficulty} options={["all","foundational","intermediate","advanced"]}/><Select label="Phase" value={phase} onChange={setPhase} options={["all","discovery","enumeration","correlation","validation","evidence","reporting"]}/><Select label="Tool" value={tool} onChange={setTool} options={["all",...osintTools.map(x=>x.name)]}/><Select label="Evidence type" value={evidence} onChange={setEvidence} options={["all",...Array.from(new Set(OSINT_CASES.flatMap(x=>x.evidenceTypes)))]}/><Select label="Status" value={status} onChange={setStatus} options={["all","lead","active","validated","closed"]}/><button type="button" onClick={clearFilters} className="self-end rounded-md border border-slate-300 bg-white px-3 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-50">Clear filters</button>
    </div></details>
    <div className="grid min-w-0 gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white xl:sticky xl:top-3 xl:self-start"><div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-3 py-3"><div><p className="text-xs font-bold text-slate-900">Case Library</p><p className="mt-0.5 text-[10px] text-slate-400">{cases.length} matching cases</p></div><span className="rounded-md bg-white px-2 py-1 text-[10px] font-bold text-slate-500 ring-1 ring-slate-200">{cases.length}</span></div><div className="max-h-[calc(100vh-330px)] overflow-y-auto">{cases.map(x=><OSINTCaseCard key={x.id} item={x} selected={x.id===selected?.id} onClick={()=>onSelect(x.id)}/>)}</div>{!cases.length&&<p className="p-8 text-center text-xs leading-5 text-slate-500">No cases match the current search and filters. Clear a filter or broaden the search.</p>}</aside>
      {selected?<OSINTCaseDetail item={selected} onAddFlag={onAddFlag}/>:<div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-xs text-slate-500">No case selected.</div>}
    </div>
  </div>;
}
function Select<T extends string>({label,value,onChange,options}:{label:string;value:T;onChange:(v:T)=>void;options:T[]}){return <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}<select value={value} onChange={e=>onChange(e.target.value as T)} className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] font-medium text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100">{options.map(x=><option key={x} value={x}>{x==="all"?"All":x}</option>)}</select></label>}
function Stat({title,value}:{title:string;value:string}){return <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-right"><p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{title}</p><p className="text-xs font-bold text-slate-700">{value}</p></div>}
