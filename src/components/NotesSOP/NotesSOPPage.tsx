import { useMemo, useState } from 'react';
import SOPSidebar from './components/SOPSidebar';
import CaseCard from './components/CaseCard';
import DecisionTree from './components/DecisionTree';
import FindingRecorder from './components/FindingRecorder';
import TimeTracker from './components/TimeTracker';
import VulnerabilityCard from './components/VulnerabilityCard';
import NotesSOPHeader from './components/NotesSOPHeader';
import QuickReference from './components/QuickReference';
import FlagLogbook from './components/FlagLogbook';
import { SOP_SECTIONS } from './data/sections';
import { enumerationCases } from './data/enumerationCases';
import { webTestingCases } from './data/webTestingCases';
import { networkCases } from './data/networkCases';
import { forensicsCases } from './data/forensicsCases';
import { stegoCases } from './data/stegoCases';
import { encodingCases } from './data/encodingCases';
import { TOOL_CASES } from './data/toolCases';
import { nextStepCases } from './data/nextStepCases';
import { vulnerabilities } from './data/vulnerabilities';
import { emptyFinding } from './data/evidenceTemplates';
import { searchSOP } from './lib/sopSearch';
import type { EvidenceFinding, SOPCase, SOPCategoryId } from './types/notesSop';

const CASES: SOPCase[] = [
  ...enumerationCases,
  ...webTestingCases,
  ...networkCases,
  ...forensicsCases,
  ...stegoCases,
  ...encodingCases,
  ...nextStepCases,
  ...TOOL_CASES,
];

export default function NotesSOPPage() {
  const [section, setSection] = useState<SOPCategoryId>('reference');
  const [query, setQuery] = useState('');
  const [selectedCaseId, setSelectedCaseId] = useState(CASES[0]?.id ?? '');
  const [finding, setFinding] = useState<EvidenceFinding>(emptyFinding());
  const [showRecorder, setShowRecorder] = useState(false);
  const [flagCount, setFlagCount] = useState(0);

  const sectionCases = useMemo(
    () => CASES.filter((item) => item.category === section),
    [section],
  );

  const selectedCase =
    CASES.find((item) => item.id === selectedCaseId) ?? sectionCases[0];

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

  const activeSection = SOP_SECTIONS.find((item) => item.id === section);

  return (
    <main className="flex min-h-0 min-w-0 flex-1 overflow-hidden bg-slate-100 text-slate-900">
      <SOPSidebar
        sections={SOP_SECTIONS}
        active={section}
        onSelect={selectSection}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <NotesSOPHeader
          caseCount={CASES.length}
          referenceCount={vulnerabilities.length}
          flagCount={flagCount}
          query={query}
          onQueryChange={setQuery}
        />

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="mx-auto w-full max-w-[1600px] space-y-4 p-3 sm:p-4 lg:p-5">
            <div className="sticky top-0 z-20 -mx-1 rounded-md border border-slate-200 bg-slate-100/95 p-2 backdrop-blur-sm lg:hidden">
              <select
                value={section}
                onChange={(event) => selectSection(event.target.value)}
                className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700"
              >
                {SOP_SECTIONS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.number} · {item.title}
                  </option>
                ))}
              </select>
            </div>

            <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    <span>Reference</span>
                    <span aria-hidden="true">/</span>
                    <span className="text-emerald-700">
                      {activeSection?.title ?? 'Workspace'}
                    </span>
                  </div>
                  <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                    {activeSection?.title ?? 'Investigation Reference'}
                  </h1>
                  <p className="mt-1 max-w-4xl text-xs leading-5 text-slate-500 sm:text-sm">
                    {activeSection?.description ??
                      'Structured investigation references and evidence workflows.'}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Stat title="Cases" value={String(CASES.length)} />
                  <Stat title="Vuln refs" value={String(vulnerabilities.length)} />
                  <Stat title="Sections" value={String(SOP_SECTIONS.length)} />
                </div>
              </div>
            </section>

            {query && (
              <SearchResults
                query={query}
                results={searchResults}
                onClear={() => setQuery('')}
                onSelectCase={(id) => {
                  const item = CASES.find((x) => x.id === id);
                  if (item) selectCase(item);
                }}
              />
            )}

            {section === 'reference' ? (
              <QuickReference />
            ) : section === 'logbook' ? (
              <FlagLogbook onCountChange={setFlagCount} />
            ) : section === 'vulnerabilities' ? (
              <VulnerabilitySection />
            ) : section === 'evidence' ? (
              <EvidenceSection
                finding={finding}
                setFinding={setFinding}
                showRecorder={showRecorder}
                setShowRecorder={setShowRecorder}
              />
            ) : section === 'time' ? (
              <TimeSection />
            ) : (
              <CaseSection
                cases={sectionCases}
                selectedCase={selectedCase}
                onSelect={selectCase}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function SearchResults({
  query,
  results,
  onClear,
  onSelectCase,
}: {
  query: string;
  results: Array<{ type: 'case' | 'vulnerability'; id: string; title: string; summary: string }>;
  onClear: () => void;
  onSelectCase: (id: string) => void;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-emerald-200 bg-white">
      <div className="flex items-center justify-between border-b border-emerald-100 bg-emerald-50/60 px-4 py-3">
        <div>
          <p className="text-xs font-bold text-emerald-900">Search results</p>
          <p className="mt-0.5 text-[11px] text-emerald-700/70">
            {results.length} match{results.length === 1 ? '' : 'es'} for “{query}”
          </p>
        </div>
        <button type="button" onClick={onClear} className="rounded-md px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100">
          Clear
        </button>
      </div>
      <div className="divide-y divide-slate-100">
        {results.length ? results.map((result) => (
          <button
            key={`${result.type}-${result.id}`}
            type="button"
            onClick={() => result.type === 'case' && onSelectCase(result.id)}
            className="block w-full px-4 py-3 text-left transition hover:bg-slate-50"
          >
            <div className="flex items-center gap-2">
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                {result.type}
              </span>
              <p className="text-sm font-semibold text-slate-900">{result.title}</p>
            </div>
            <p className="mt-1 text-xs text-slate-500">{result.summary}</p>
          </button>
        )) : (
          <p className="px-4 py-6 text-xs text-slate-500">No matching cases or references.</p>
        )}
      </div>
    </section>
  );
}

function CaseSection({
  cases,
  selectedCase,
  onSelect,
}: {
  cases: SOPCase[];
  selectedCase?: SOPCase;
  onSelect: (item: SOPCase) => void;
}) {
  if (!selectedCase) return <EmptyState text="No cases are defined for this section yet." />;

  return (
    <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white xl:sticky xl:top-[92px] xl:self-start">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-3 py-3">
          <div>
            <p className="text-xs font-bold text-slate-900">Case Library</p>
            <p className="mt-0.5 text-[10px] text-slate-400">Select an investigation path</p>
          </div>
          <span className="rounded-md bg-white px-2 py-1 text-[10px] font-bold text-slate-500 ring-1 ring-slate-200">
            {cases.length}
          </span>
        </div>
        <div className="max-h-[calc(100vh-185px)] overflow-y-auto">
          {cases.map((item) => (
            <CaseCard key={item.id} item={item} selected={item.id === selectedCase.id} onClick={() => onSelect(item)} />
          ))}
        </div>
      </aside>

      <article className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-emerald-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-emerald-700">{selectedCase.estimatedTime}</span>
            <span className="rounded-md bg-slate-100 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">{selectedCase.difficulty}</span>
            <span className="rounded-md border border-slate-200 px-2 py-1 text-[9px] font-semibold text-slate-500">SOP case</span>
          </div>
          <h2 className="mt-3 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">{selectedCase.title}</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">{selectedCase.summary}</p>
        </div>

        <div className="space-y-7 p-5 sm:p-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <InfoGrid title="When to use" items={selectedCase.whenToUse} />
            <InfoGrid title="Initial checks" items={selectedCase.initialChecks} />
          </div>

          <section>
            <SectionHeading title="Investigation workflow" />
            <div className="overflow-hidden rounded-lg border border-slate-200">
              {selectedCase.steps.map((step, index) => (
                <div key={step.id} className="border-b border-slate-200 p-4 last:border-b-0 sm:p-5">
                  <div className="flex gap-4">
                    <div className="relative flex shrink-0 flex-col items-center">
                      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-700 text-[10px] font-bold text-white">{String(index + 1).padStart(2, '0')}</span>
                      {index < selectedCase.steps.length - 1 && <span className="mt-2 h-full min-h-8 w-px bg-slate-200" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900">{step.action}</p>
                      <p className="mt-1 text-sm leading-5 text-slate-600">{step.purpose}</p>
                      {step.command && <pre className="mt-4 overflow-x-auto rounded-md border border-slate-800 bg-slate-950 p-3 text-xs leading-5 text-slate-200"><code>{step.command}</code></pre>}
                      <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <InfoBlock title="Expected observation" value={step.expectedObservation} />
                        <InfoBlock title="Possible results" value={step.possibleResults.join(' • ')} />
                      </div>
                      {step.evidence.length > 0 && <div className="mt-4"><InfoBlock title="Evidence" value={step.evidence.join(' • ')} /></div>}
                      {step.notes && <div className="mt-4"><InfoBlock title="Notes" value={step.notes} /></div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <SectionHeading title="Decision branches" />
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 sm:p-5"><DecisionTree branches={selectedCase.branches} /></div>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <InfoGrid title="Prerequisites" items={selectedCase.prerequisites} />
            <InfoGrid title="Observations" items={selectedCase.observations} />
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
    <div className="space-y-4">
      <PageIntro title="Evidence Capture" description="Record raw observations, interpretations, and verification separately so findings remain reproducible." />
      <div className="grid gap-3 md:grid-cols-3">
        <Stat title="Observation" value="Raw fact" />
        <Stat title="Interpretation" value="Reasoned meaning" />
        <Stat title="Confirmation" value="Evidence-backed state" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
        <div><p className="text-xs font-semibold text-slate-800">Structured finding</p><p className="mt-0.5 text-[11px] text-slate-400">Capture exact evidence before deciding what it means.</p></div>
        <button type="button" onClick={() => setShowRecorder(!showRecorder)} className="rounded-md bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-800">{showRecorder ? 'Hide recorder' : 'Open recorder'}</button>
      </div>
      {showRecorder && <FindingRecorder finding={finding} onChange={setFinding} />}
    </div>
  );
}

function VulnerabilitySection() {
  return <div className="space-y-4"><PageIntro title="Common Vulnerabilities" description="Use each reference as a set of possible cases, observations, validation paths, false positives, and evidence requirements." /><div className="grid gap-3">{vulnerabilities.map((item) => <VulnerabilityCard key={item.id} item={item} />)}</div></div>;
}

function TimeSection() {
  const [milestone, setMilestone] = useState('Initial discovery');
  const milestones = ['Initial discovery', '10 min', '20 min', '30 min', '45 min', '60 min', 'Final verification'];
  return (
    <div className="space-y-4">
      <PageIntro title="Time Management" description="Use time as a pivot mechanism. Prefer information gain and verification over repeating low-yield actions." />
      <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-2">{milestones.map((item) => <button key={item} type="button" onClick={() => setMilestone(item)} className={`rounded-md px-3 py-2 text-xs font-semibold transition ${milestone === item ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{item}</button>)}</div>
      <TimeTracker />
      <div className="grid gap-3 lg:grid-cols-3">
        <InfoGrid title="At this point" items={milestone === 'Final verification' ? ['Verify strongest findings', 'Record evidence', 'Avoid low-confidence new branches'] : ['Review completed actions', 'Identify strongest open lead', 'Mark dead ends', 'Choose a branch with new information potential']} />
        <InfoGrid title="Pivot questions" items={['What new evidence appeared?', 'Am I repeating the same action?', 'Is another attack surface unexplored?', 'Can this finding be verified now?']} />
        <InfoGrid title="Record" items={['Current case', 'Elapsed time', 'Completed checks', 'Dead ends', 'Open leads']} />
      </div>
    </div>
  );
}

function PageIntro({ title, description }: { title: string; description: string }) {
  return <div><p className="text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-700">Investigation reference</p><h2 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{title}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p></div>;
}

function SectionHeading({ title }: { title: string }) { return <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{title}</h3>; }

function InfoGrid({ title, items }: { title: string; items: string[] }) {
  return <section className="rounded-lg border border-slate-200 bg-slate-50/60 p-4"><SectionHeading title={title} /><ul className="space-y-2 text-sm text-slate-700">{items.map((item) => <li key={item} className="flex gap-2 leading-5"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-400" />{item}</li>)}</ul></section>;
}

function InfoBlock({ title, value }: { title: string; value: string }) { return <div><p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{title}</p><p className="mt-1 text-xs leading-5 text-slate-700">{value}</p></div>; }

function Stat({ title, value }: { title: string; value: string }) { return <div className="rounded-md border border-slate-200 bg-white px-3 py-2"><p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{title}</p><p className="mt-1 text-xs font-bold text-slate-800">{value}</p></div>; }

function EmptyState({ text }: { text: string }) { return <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">{text}</div>; }
