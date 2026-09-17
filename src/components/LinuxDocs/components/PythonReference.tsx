import { pythonOneLiners } from "../data/python";
import CopyCommandButton from "./CopyCommandButton";

export default function PythonReference() { return <section className="rounded-xl border border-gray-200 bg-white p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-green-600">Python One-Liners</p><div className="mt-4 space-y-2">{pythonOneLiners.map(([label, command]) => <div key={label} className="rounded-lg border border-gray-200 p-3"><div className="flex items-center justify-between gap-3"><span className="text-xs font-medium text-gray-600">{label}</span><CopyCommandButton value={command} /></div><code className="mt-2 block overflow-x-auto rounded bg-gray-950 p-3 font-mono text-xs text-green-300">{command}</code></div>)}</div></section>; }
