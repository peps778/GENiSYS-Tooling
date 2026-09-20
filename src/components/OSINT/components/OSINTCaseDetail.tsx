import { useState } from "react";
import type { OSINTCase } from "../types/osint";

type Notes = { observation: string; hypothesis: string; evidence: string; contradiction: string; followUp: string; conclusion: string };
const initialNotes: Notes = { observation: "", hypothesis: "", evidence: "", contradiction: "", followUp: "", conclusion: "" };

export default function OSINTCaseDetail({ item, onAddFlag }: { item: OSINTCase; onAddFlag?: () => void }) {
  const [notes, setNotes] = useState<Notes>(initialNotes);
  const update = (key: keyof Notes, value: string) => setNotes(prev => ({ ...prev, [key]: value }));
  return <article className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
    <header className="border-b border-slate-200 bg-white px-5 py-5 sm:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-emerald-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-emerald-700">{item.id}</span>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">{item.difficulty}</span>
        <span className="rounded-md border border-slate-200 px-2 py-1 text-[9px] font-semibold text-slate-500">{item.phase}</span>
        <span className="rounded-md border border-slate-200 px-2 py-1 text-[9px] font-semibold text-slate-500">{item.status ?? "lead"}</span>
        {onAddFlag && <button type="button" onClick={onAddFlag} className="ml-auto rounded-md bg-emerald-700 px-2.5 py-1.5 text-[10px] font-bold text-white shadow-sm hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-200">Add to Flag Logbook</button>}
      </div>
      <h2 className="mt-3 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">{item.title}</h2>
      <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">{item.situation}</p>
    </header>

    <div className="space-y-6 p-5 sm:p-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <Info title="Objective" text={item.objective} />
        <Info title="Initial observation" text={item.initialObservation} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ListSection title="Recommended collection" items={item.collectionMethod} />
        <ListSection title="Validation" items={item.validationSteps} />
        <ListSection title="Evidence to preserve" items={item.evidenceToPreserve} />
        <ListSection title="False-positive considerations" items={item.falsePositiveConsiderations} />
        <ListSection title="Next step" items={item.nextSteps} />
        <ListSection title="Stop condition" items={item.stopConditions} />
      </div>

      <section className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Interpretation guardrail</p>
        <p className="mt-2 text-sm leading-6 text-slate-700">{item.interpretation}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <ListSection title="Related tools" items={item.relatedTools} />
        <ListSection title="Related cases" items={item.relatedCases} />
      </div>

      <section className="overflow-hidden rounded-lg border border-slate-200">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-bold text-slate-900">Investigation notes</p>
          <p className="mt-0.5 text-[10px] leading-4 text-slate-500">Keep observations, hypotheses, and conclusions separate. A hypothesis does not become a fact without validation.</p>
        </div>
        <div className="grid gap-px bg-slate-200 sm:grid-cols-2">
          <NoteField label="Observation" value={notes.observation} onChange={v => update("observation", v)} placeholder="What did you directly observe?" />
          <NoteField label="Hypothesis" value={notes.hypothesis} onChange={v => update("hypothesis", v)} placeholder="What could explain the observation?" />
          <NoteField label="Evidence" value={notes.evidence} onChange={v => update("evidence", v)} placeholder="What source or artifact supports it?" />
          <NoteField label="Contradiction" value={notes.contradiction} onChange={v => update("contradiction", v)} placeholder="What conflicts with the hypothesis?" />
          <NoteField label="Follow-up" value={notes.followUp} onChange={v => update("followUp", v)} placeholder="What should be checked next?" />
          <NoteField label="Conclusion" value={notes.conclusion} onChange={v => update("conclusion", v)} placeholder="What is supported after validation?" />
        </div>
      </section>
    </div>
  </article>;
}
function Info({ title, text }: { title: string; text: string }) { return <section className="rounded-lg border border-slate-200 bg-slate-50/60 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{title}</p><p className="mt-2 text-sm leading-6 text-slate-700">{text}</p></section>; }
function ListSection({ title, items }: { title: string; items: string[] }) { return <section className="min-w-0 rounded-lg border border-slate-200 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{title}</p><ul className="mt-2 space-y-1.5 text-xs leading-5 text-slate-700">{items.map((x,i)=><li key={`${x}-${i}`} className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-emerald-600"/><span className="min-w-0 break-words">{x}</span></li>)}</ul></section>; }
function NoteField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) { return <label className="bg-white p-3"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span><textarea value={value} onChange={e => onChange(e.target.value)} rows={4} placeholder={placeholder} className="mt-1.5 block w-full resize-y rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs leading-5 text-slate-700 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100" /></label>; }
