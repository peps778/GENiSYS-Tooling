import type { LinuxCommand } from "../types/linuxDocs";
import CopyCommandButton from "./CopyCommandButton";

export default function CommandDetail({ command }: { command: LinuxCommand }) {
  return (
    <article className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-green-600">Command Reference</p><h2 className="mt-2 font-mono text-2xl font-semibold text-gray-950">{command.name}</h2></div><span className="rounded-md bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">{command.category}</span></div>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-gray-600">{command.description}</p>
        <div className="mt-5 rounded-lg bg-gray-950 p-4"><div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500">Syntax</div><code className="break-all font-mono text-sm text-green-300">{command.syntax}</code></div>
      </div>
      <div className="grid gap-6 p-6 lg:grid-cols-2">
        <section><h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Common options</h3><div className="mt-3 divide-y divide-gray-100 rounded-lg border border-gray-200">{command.options.length ? command.options.map((option) => <div key={option.flag} className="grid grid-cols-[minmax(90px,150px)_1fr] gap-3 p-3 text-sm"><code className="font-mono text-green-700">{option.flag}</code><span className="text-gray-600">{option.description}</span></div>) : <p className="p-3 text-sm text-gray-500">No additional options listed.</p>}</div></section>
        <section><h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Practical examples</h3><div className="mt-3 space-y-3">{command.examples.map((example) => <div key={example.command} className="overflow-hidden rounded-lg border border-gray-200"><div className="flex items-center justify-between gap-3 border-b border-gray-100 px-3 py-2"><span className="text-xs text-gray-500">{example.description}</span><CopyCommandButton value={example.command} /></div><pre className="overflow-x-auto bg-gray-950 p-3 font-mono text-xs leading-5 text-gray-200"><code>{example.command}</code></pre></div>)}</div></section>
      </div>
      <div className="border-t border-gray-100 px-6 py-4"><div className="flex flex-wrap gap-2">{command.tags.map((tag) => <span key={tag} className="rounded-md bg-gray-100 px-2 py-1 text-[10px] text-gray-500">#{tag}</span>)}</div></div>
    </article>
  );
}
