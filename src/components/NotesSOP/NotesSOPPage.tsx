import { useMemo, useState } from "react";
import SOPSidebar from "./components/SOPSidebar";
import SearchBar from "./components/SearchBar";
import CaseCard from "./components/CaseCard";
import DecisionTree from "./components/DecisionTree";
import FindingRecorder from "./components/FindingRecorder";
import TimeTracker from "./components/TimeTracker";
import VulnerabilityCard from "./components/VulnerabilityCard";
import { SOP_SECTIONS } from "./data/sections";
import { enumerationCases } from "./data/enumerationCases";
import { webTestingCases } from "./data/webTestingCases";
import { networkCases } from "./data/networkCases";
import { forensicsCases } from "./data/forensicsCases";
import { stegoCases } from "./data/stegoCases";
import { encodingCases } from "./data/encodingCases";
import { nextStepCases } from "./data/nextStepCases";
import { vulnerabilities } from "./data/vulnerabilities";
import { emptyFinding } from "./data/evidenceTemplates";
import { searchSOP } from "./lib/sopSearch";
import type { EvidenceFinding, SOPCase, SOPCategoryId } from "./types/notesSop";

const CASES: SOPCase[] = [
  ...enumerationCases,
  ...webTestingCases,
  ...networkCases,
  ...forensicsCases,
  ...stegoCases,
  ...encodingCases,
  ...nextStepCases,
];

export default function NotesSOPPage() {
  const [section, setSection] = useState<SOPCategoryId>("enumeration");
  const [query, setQuery] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState(CASES[0].id);
  const [finding, setFinding] = useState<EvidenceFinding>(emptyFinding());
  const [showRecorder, setShowRecorder] = useState(false);

  const sectionCases = useMemo(
    () => CASES.filter((item) => item.category === section),
    [section],
  );

  const selectedCase = CASES.find((item) => item.id === selectedCaseId) ?? sectionCases[0];

  const searchResults = useMemo(
    () => searchSOP(CASES, vulnerabilities, query),
    [query],
  );

  const selectSection = (id: string) => {
    const next = id as SOPCategoryId;
    setSection(next);
    const first = CASES.find((item) => item.category === next);
    if (first) setSelectedCaseId(first.id);
  };

  const selectCase = (item: SOPCase) => {
    setSection(item.category);
    setSelectedCaseId(item.id);
  };

  const isVulnerabilities = section === "vulnerabilities";
  const isEvidence = section === "evidence";
  const isTime = section === "time";

  const activeSection = SOP_SECTIONS.find((item) => item.id === section);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {/* <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-700 text-xs font-black tracking-tight text-white shadow-sm">G</div> */}
            {/* <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-bold tracking-tight text-gray-950">GENiSYS</p>
              <p className="truncate text-[10px] uppercase tracking-[0.16em] text-gray-400">Investigation workspace</p>
            </div> */}
          </div>

          <div className="hidden h-7 w-px bg-gray-200 md:block" />

          <div className="min-w-0 flex-1 md:max-w-sm">
            <p className="truncate text-sm font-semibold text-gray-800">Notes / SOP</p>
            <p className="hidden truncate text-[10px] text-gray-400 md:block">Case-driven investigation playbooks</p>
          </div>

          <div className="ml-auto w-full max-w-md">
            <SearchBar value={query} onChange={setQuery} />
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-[11px] font-medium text-gray-500">Workspace ready</span>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row">
        <SOPSidebar sections={SOP_SECTIONS} active={section} onSelect={selectSection} />

        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">
                  <span>Reference</span>
                  <span aria-hidden="true">/</span>
                  <span className="text-green-700">{activeSection?.title ?? "Workspace"}</span>
                </div>
                <h1 className="mt-1 text-xl font-bold tracking-tight text-gray-950 sm:text-2xl">{activeSection?.title ?? "Investigation Reference"}</h1>
                <p className="mt-1 max-w-3xl text-xs leading-5 text-gray-500 sm:text-sm">{activeSection?.description ?? "Structured investigation references and evidence workflows."}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-right">
                <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Library</p>
                <p className="mt-0.5 text-xs font-semibold text-gray-700">{CASES.length} cases · {vulnerabilities.length} refs</p>
              </div>
            </div>

            {query && (
              <section className="mb-5 overflow-hidden rounded-xl border border-green-200 bg-white">
                <div className="flex items-center justify-between border-b border-green-100 bg-green-50/60 px-4 py-3">
                  <div>
                    <p className="text-xs font-bold text-green-900">Search results</p>
                    <p className="mt-0.5 text-[11px] text-green-700/70">Matches across cases and reference material</p>
                  </div>
                  <button onClick={() => setQuery("")} className="rounded-md px-2 py-1 text-[11px] font-semibold text-green-700 hover:bg-green-100">Clear</button>
                </div>
                <div className="divide-y divide-gray-100">
                  {searchResults.length ? searchResults.map((result) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => {
                        if (result.type === "case") {
                          const item = CASES.find((x) => x.id === result.id);
                          if (item) selectCase(item);
                        }
                      }}
                      className="block w-full px-4 py-3 text-left transition hover:bg-gray-50"
                    >
                      <p className="text-sm font-semibold text-gray-900">{result.title}</p>
                      <p className="mt-1 text-xs text-gray-500">{result.summary}</p>
                    </button>
                  )) : <p className="px-4 py-5 text-sm text-gray-500">No matching cases or references.</p>}
                </div>
              </section>
            )}

            {isVulnerabilities ? (
              <VulnerabilitySection />
            ) : isEvidence ? (
              <EvidenceSection finding={finding} setFinding={setFinding} showRecorder={showRecorder} setShowRecorder={setShowRecorder} />
            ) : isTime ? (
              <TimeSection />
            ) : (
              <CaseSection cases={sectionCases} selectedCase={selectedCase} onSelect={selectCase} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function CaseSection({ cases, selectedCase, onSelect }: { cases: SOPCase[]; selectedCase?: SOPCase; onSelect: (item: SOPCase) => void }) {
  if (!selectedCase) return <EmptyState text="No cases are defined for this section yet." />;

  return (
    <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white xl:sticky xl:top-[88px] xl:self-start">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50/70 px-4 py-3">
          <div>
            <p className="text-xs font-bold text-gray-900">Case Library</p>
            <p className="mt-0.5 text-[10px] text-gray-400">Select an investigation path</p>
          </div>
          <span className="rounded-md bg-white px-2 py-1 text-[10px] font-bold text-gray-500 ring-1 ring-gray-200">{cases.length}</span>
        </div>
        <div className="max-h-[calc(100vh-170px)] overflow-y-auto">
          {cases.map((item) => (
            <CaseCard key={item.id} item={item} selected={item.id === selectedCase.id} onClick={() => onSelect(item)} />
          ))}
        </div>
      </aside>

      <article className="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-green-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-green-700">{selectedCase.estimatedTime}</span>
            <span className="rounded-md bg-gray-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-500">{selectedCase.difficulty}</span>
            <span className="rounded-md border border-gray-200 px-2 py-1 text-[10px] font-semibold text-gray-500">SOP case</span>
          </div>
          <h2 className="mt-3 text-xl font-bold tracking-tight text-gray-950 sm:text-2xl">{selectedCase.title}</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-gray-600">{selectedCase.summary}</p>
        </div>

        <div className="space-y-7 p-5 sm:p-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <InfoGrid title="When to use" items={selectedCase.whenToUse} />
            <InfoGrid title="Initial checks" items={selectedCase.initialChecks} />
          </div>

          <section>
            <SectionHeading title="Investigation workflow" />
            <div className="overflow-hidden rounded-xl border border-gray-200">
              {selectedCase.steps.map((step, index) => (
                <div key={step.id} className="relative border-b border-gray-200 p-4 last:border-b-0 sm:p-5">
                  <div className="flex gap-4">
                    <div className="relative flex shrink-0 flex-col items-center">
                      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-green-700 text-[11px] font-bold text-white">{String(index + 1).padStart(2, "0")}</span>
                      {index < selectedCase.steps.length - 1 && <span className="mt-2 h-full min-h-8 w-px bg-gray-200" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-900">{step.action}</p>
                      <p className="mt-1 text-sm leading-5 text-gray-600">{step.purpose}</p>
                      {step.command && <pre className="mt-4 overflow-x-auto rounded-lg border border-gray-800 bg-gray-950 p-3 text-xs leading-5 text-gray-200"><code>{step.command}</code></pre>}
                      <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Expected observation</p>
                          <p className="mt-1 text-sm leading-5 text-gray-700">{step.expectedObservation}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Possible results</p>
                          <p className="mt-1 text-sm leading-5 text-gray-700">{step.possibleResults.join(" • ")}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <SectionHeading title="Decision branches" />
            <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 sm:p-5">
              <DecisionTree branches={selectedCase.branches} />
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <InfoGrid title="Alternative paths" items={selectedCase.alternativePaths} />
            <InfoGrid title="Stop conditions" items={selectedCase.stopConditions} />
            <InfoGrid title="Evidence to record" items={selectedCase.evidenceToRecord} />
            <InfoGrid title="Related cases" items={selectedCase.relatedCases} />
          </div>
        </div>
      </article>
    </div>
  );
}

function EvidenceSection({ finding, setFinding, showRecorder, setShowRecorder }: { finding: EvidenceFinding; setFinding: (f: EvidenceFinding) => void; showRecorder: boolean; setShowRecorder: (v: boolean) => void }) {
  return (
    <div className="max-w-6xl space-y-5">
      <PageIntro title="Flag / Evidence Recording" description="Separate what you observed from what you think it means, then record how it was verified." />
      <div className="grid gap-3 md:grid-cols-3">
        <Stat title="Observation" value="Raw fact" />
        <Stat title="Interpretation" value="Reasoned meaning" />
        <Stat title="Confirmation" value="Evidence-backed state" />
      </div>
      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3">
        <div>
          <p className="text-xs font-semibold text-gray-800">Structured finding</p>
          <p className="mt-0.5 text-[11px] text-gray-400">Capture the evidence without mixing observation and interpretation.</p>
        </div>
        <button onClick={() => setShowRecorder(!showRecorder)} className="rounded-lg bg-green-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-green-800">
          {showRecorder ? "Hide recorder" : "Open recorder"}
        </button>
      </div>
      {showRecorder && <FindingRecorder finding={finding} onChange={setFinding} />}
    </div>
  );
}

function VulnerabilitySection() {
  return (
    <div className="space-y-5">
      <PageIntro title="Common Vulnerabilities" description="Use each reference as a set of possible cases, observations, validation paths, false positives, and evidence requirements." />
      <div className="grid gap-4">
        {vulnerabilities.map((item) => <VulnerabilityCard key={item.id} item={item} />)}
      </div>
    </div>
  );
}

function TimeSection() {
  const [milestone, setMilestone] = useState("Initial discovery");
  const milestones = ["Initial discovery", "10 min", "20 min", "30 min", "45 min", "60 min", "Final verification"];
  return (
    <div className="max-w-6xl space-y-5">
      <PageIntro title="Time Management" description="Time management is a pivot mechanism, not a rigid sequence. Use evidence and information gain to decide whether to continue." />
      <div className="flex flex-wrap gap-1 rounded-xl border border-gray-200 bg-white p-2">
        {milestones.map((item) => (
          <button key={item} onClick={() => setMilestone(item)} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${milestone === item ? "bg-green-700 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
            {item}
          </button>
        ))}
      </div>
      <TimeTracker />
      <div className="grid gap-4 lg:grid-cols-3">
        <InfoGrid title="At this point" items={milestone === "Final verification" ? ["Verify strongest findings", "Record evidence", "Avoid low-confidence new branches"] : ["Review completed actions", "Identify strongest open lead", "Mark dead ends", "Choose a branch with new information potential"]} />
        <InfoGrid title="Pivot questions" items={["What new evidence appeared?", "Am I repeating the same action?", "Is another attack surface unexplored?", "Can this finding be verified now?"]} />
        <InfoGrid title="Record" items={["Current case", "Elapsed time", "Completed checks", "Dead ends", "Open leads"]} />
      </div>
    </div>
  );
}

function PageIntro({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-green-700">Investigation reference</p>
      <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">{description}</p>
    </div>
  );
}

function SectionHeading({ title }: { title: string }) {
  return <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">{title}</h3>;
}

function InfoGrid({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
      <SectionHeading title={title} />
      <ul className="space-y-2 text-sm text-gray-700">
        {items.map((item) => <li key={item} className="flex gap-2 leading-5"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gray-400" />{item}</li>)}
      </ul>
    </section>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{title}</p>
      <p className="mt-1.5 text-sm font-bold text-gray-900">{value}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">{text}</div>;
}
