import type { GeneratorPurpose } from "../types/linuxDocs";

export function GeneratorPurpose({ purposes, selected, onChange }: { purposes: GeneratorPurpose[]; selected: string; onChange: (id: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
      {purposes.map((purpose) => <button key={purpose.id} type="button" onClick={() => onChange(purpose.id)} className={`rounded-md border px-2.5 py-2 text-left text-xs ${selected === purpose.id ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}><span className="font-semibold">{purpose.label}</span><span className="mt-0.5 block text-[10px] text-slate-400">{purpose.description}</span></button>)}
    </div>
  );
}
