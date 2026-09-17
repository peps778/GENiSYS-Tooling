import { useMemo, useState } from "react";
import { pipelines } from "../data/pipelines";
import { buildPipelineCommand } from "../lib/pipelineBuilder";
import { CopyCommandButton } from "./CopyCommandButton";
import { PipelineStep } from "./PipelineStep";

export function PipelineBuilder() {
  const [selectedId, setSelectedId] = useState(pipelines[0].id);
  const pipeline = pipelines.find((item) => item.id === selectedId) ?? pipelines[0];
  const combined = useMemo(() => buildPipelineCommand(pipeline), [pipeline]);

  return (
    <section className="grid min-w-0 gap-4 xl:grid-cols-[210px_minmax(0,1fr)]">
      <nav className="flex min-w-0 gap-1 overflow-x-auto xl:block xl:space-y-1">
        {pipelines.map((item) => <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className={`block shrink-0 rounded-md px-3 py-2 text-left text-xs xl:w-full ${selectedId === item.id ? "bg-emerald-50 font-semibold text-emerald-700" : "text-slate-600 hover:bg-slate-50"}`}>{item.name}</button>)}
      </nav>
      <div className="min-w-0 space-y-3">
        <div><h3 className="text-sm font-semibold text-slate-900">{pipeline.name}</h3><p className="mt-1 text-xs text-slate-500">{pipeline.description}</p></div>
        <div className="space-y-2">{pipeline.steps.map((step, index) => <PipelineStep key={`${step.title}-${index}`} step={step} index={index} />)}</div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 flex items-center justify-between"><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Combined copyable representation</p><CopyCommandButton command={combined} /></div>
          <pre className="max-h-64 min-w-0 overflow-auto rounded bg-slate-950 p-3 text-xs leading-5 text-slate-100"><code>{combined}</code></pre>
        </div>
      </div>
    </section>
  );
}
