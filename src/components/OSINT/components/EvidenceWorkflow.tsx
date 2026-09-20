import { useState } from "react";
import type { EvidenceClassification, EvidenceRecord } from "../types/osint";
const empty: EvidenceRecord={id:"",sourceUrl:"",sourceType:"",collectedAt:"",timezone:"",collector:"",description:"",relevantPassage:"",sourceReliability:"unknown",corroboratingSources:[],classification:"observed",confidence:"low",notes:""};
export default function EvidenceWorkflow(){
 const [record,setRecord]=useState(empty);
 const update=(k:keyof EvidenceRecord,v:unknown)=>setRecord(x=>({...x,[k]:v}));
 const input="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-100";
 return <div className="space-y-4">
  <section className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">Evidence workflow</p><div className="mt-3 grid gap-2 md:grid-cols-4 xl:grid-cols-8">{["Identify Source","Record URL","Record Date/Time","Capture Content","Hash Artifact","Record Context","Corroborate","Classify / Preserve"].map((x,i)=><div key={x} className="rounded-md border border-slate-200 bg-slate-50 p-2.5 text-center"><span className="text-[9px] font-bold text-emerald-700">{i+1}</span><p className="mt-1 text-[10px] font-semibold text-slate-700">{x}</p></div>)}</div></section>
  <section className="overflow-hidden rounded-lg border border-slate-200 bg-white"><div className="border-b border-slate-200 bg-slate-50 px-4 py-3"><p className="text-xs font-bold text-slate-900">Evidence record</p><p className="mt-0.5 text-[11px] text-slate-500">Primary evidence, corroboration, and derived information must remain distinguishable.</p></div>
   <div className="grid gap-4 p-4 md:grid-cols-2">
    {([["Evidence ID","id"],["Source URL","sourceUrl"],["Source type","sourceType"],["Collection date/time","collectedAt"],["Timezone","timezone"],["Collector","collector"],["SHA-256","sha256"],["Downloaded artifact","downloadedArtifact"]] as const).map(([label,key])=><label key={key} className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}<input value={(record[key] as string|undefined)??""} onChange={e=>update(key,e.target.value)} className={input}/></label>)}
    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Source reliability<select value={record.sourceReliability} onChange={e=>update("sourceReliability",e.target.value)} className={input}>{["unknown","low","medium","high"].map(x=><option key={x}>{x}</option>)}</select></label>
    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Classification<select value={record.classification} onChange={e=>update("classification",e.target.value as EvidenceClassification)} className={input}>{["observed","corroborated","unverified","contradicted","historical","current","archived","derived"].map(x=><option key={x}>{x}</option>)}</select></label>
    <label className="md:col-span-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">Description<textarea value={record.description} onChange={e=>update("description",e.target.value)} className={`${input} min-h-20 resize-y`}/></label>
    <label className="md:col-span-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">Relevant passage / observation<textarea value={record.relevantPassage} onChange={e=>update("relevantPassage",e.target.value)} className={`${input} min-h-24 resize-y`}/></label>
    <label className="md:col-span-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">Notes<textarea value={record.notes} onChange={e=>update("notes",e.target.value)} className={`${input} min-h-20 resize-y`}/></label>
   </div>
   <div className="border-t border-slate-200 bg-slate-50 px-4 py-3"><pre className="overflow-x-auto rounded-md bg-slate-950 p-3 text-[10px] leading-5 text-slate-200">{JSON.stringify(record,null,2)}</pre></div>
  </section>
  <section className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Reporting workflow</p><div className="mt-3 flex flex-wrap gap-2 text-[10px] font-semibold text-slate-600">{["Executive Summary","Scope","Collection Method","Sources","Timeline","Findings","Corroboration","Limitations","Evidence","Confidence","Unresolved Questions","Further Investigation"].map(x=><span key={x} className="rounded bg-slate-100 px-2 py-1">{x}</span>)}</div></section>
 </div>;
}
