import type { ReactNode } from "react";
const quickStarts = [
["Domain Investigation","Map registration, DNS, hosting, and public references.","Domain → DNS → current source","Registrar + DNS + primary source","High"],
["DNS Investigation","Resolve and classify records without over-interpreting them.","Query relevant records","Resolver output + timestamp","High"],
["Subdomain Discovery","Build a public hostname inventory.","Passive discovery","Hostname + source","High"],
["WHOIS","Build a dated registration lifecycle.","Current/historical lookup","Registration record","Medium"],
["URL Analysis","Parse and normalize URL structure.","Preserve original URL","Original + normalized form","High"],
["Metadata","Extract artifact metadata and test chronology.","Preserve original first","Artifact + metadata + hash","High"],
["Search Engine Research","Locate public primary sources.","Exact/provider-neutral search","Query + primary URL","Medium"],
["Username Investigation","Correlate public identifiers cautiously.","Exact search","Profile URL + corroboration","Medium"],
["Email Investigation","Characterize public address/domain relationships.","Domain + public references","Address + DNS/source","Medium"],
["Public Evidence","Preserve provenance and context.","Record source first","Evidence record + hash","High"],
["Evidence Preservation","Make observations reproducible.","Capture + timestamp","Artifact + SHA-256","High"],
];

export default function Overview({ onSection }: { onSection: (id:string)=>void }) {
  return <div className="space-y-4">
    <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">Investigation workflow</p><h2 className="mt-1 text-lg font-bold tracking-tight text-slate-950">Observe before you conclude</h2><p className="mt-1 text-xs leading-5 text-slate-500">Use the workflow to keep discovery, correlation, validation, and evidence preservation separate.</p></div><span className="rounded-md bg-slate-100 px-2 py-1 text-[9px] font-bold uppercase text-slate-500">Public-source reference</span></div>
      <div className="mt-5 grid gap-2 md:grid-cols-4 xl:grid-cols-8">{["Define Target","Scope","Discover","Correlate","Validate","Capture Evidence","Document","Stop / Escalate"].map((x,i)=><div key={x} className="relative rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">{i<7&&<span className="absolute -right-2 top-1/2 hidden text-slate-300 xl:block">→</span>}<span className="text-[9px] font-bold text-emerald-700">{String(i+1).padStart(2,"0")}</span><p className="mt-1 text-[11px] font-semibold text-slate-800">{x}</p></div>)}</div>
    </section>
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {quickStarts.map(([title,description,first,evidence,priority],i)=><button key={title} type="button" onClick={()=>onSection(i===0?"url-domain":i===1?"dns":i===2?"subdomains":i===3?"whois":i===4?"url-domain":i===5?"metadata":i===6?"search":i===7||i===8?"username-email":"public-evidence")} className="rounded-lg border border-slate-200 bg-white p-4 text-left transition hover:border-emerald-300 hover:shadow-sm">
        <div className="flex items-start justify-between gap-3"><h3 className="text-sm font-bold text-slate-900">{title}</h3><span className="rounded bg-emerald-50 px-1.5 py-1 text-[9px] font-bold uppercase text-emerald-700">{priority} evidence</span></div>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p><div className="mt-3 grid gap-2 text-[10px] text-slate-600"><span><b>First action:</b> {first}</span><span><b>Evidence:</b> {evidence}</span></div>
      </button>)}
    </section>
    <section className="grid gap-3 lg:grid-cols-2">
      <RulePanel title="Never assume"><ul>{["Same username = same person","Same name = same person","Same avatar = same person","Same email domain = same person","Same IP = same organization","Same hostname = same system","WHOIS registrant = current owner","Metadata author = actual author","Search result = current truth","Archived page = current state"].map(x=><li key={x}>• {x}</li>)}</ul></RulePanel>
      <RulePanel title="Legal / ethical scope"><ul>{["Use information that is publicly accessible or explicitly authorized for collection.","Do not bypass authentication or access private accounts.","Do not defeat access controls or attempt unauthorized password recovery.","Do not interact with systems outside authorized scope.","Do not collect unnecessary personal information.","Preserve only information relevant to the investigation."].map(x=><li key={x}>• {x}</li>)}</ul></RulePanel>
    </section>
  </div>;
}
function RulePanel({title,children}:{title:string;children:ReactNode}){return <section className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</p><div className="mt-2 space-y-1.5 text-xs leading-5 text-slate-700">{children}</div></section>}
