import type { LinuxCommand } from "../types/linuxDocs";

export default function CommandCard({ command, selected, onSelect }: { command: LinuxCommand; selected: boolean; onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect} className={["w-full rounded-lg border p-4 text-left transition", selected ? "border-green-300 bg-green-50/60" : "border-gray-200 bg-white hover:border-gray-300"].join(" ")}>
      <div className="flex items-start justify-between gap-3">
        <div><p className="font-mono text-sm font-semibold text-gray-950">{command.name}</p><p className="mt-1 text-xs leading-5 text-gray-500">{command.summary}</p></div>
        <span className="shrink-0 rounded-md bg-gray-100 px-2 py-1 text-[10px] font-medium text-gray-500">{command.category}</span>
      </div>
    </button>
  );
}
