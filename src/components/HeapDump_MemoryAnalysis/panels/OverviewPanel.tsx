/**
 * OverviewPanel.tsx
 *
 * At-a-glance summary of the loaded snapshot: key counts plus quick
 * links into the other tabs. Purely presentational.
 */
import type { HeapSummary } from "../types/heap";
import { AlertIcon } from "../components/icons";

export interface OverviewPanelProps {
  summary: HeapSummary;
  secretsCount: number | null;
  onGoToSecrets: () => void;
  onGoToStrings: () => void;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#E5E7EB] bg-white p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">{label}</p>
      <p className="mt-1 text-xl font-semibold text-[#111827]">{value}</p>
    </div>
  );
}

export default function OverviewPanel({
  summary,
  secretsCount,
  onGoToSecrets,
  onGoToStrings,
}: OverviewPanelProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Strings extracted" value={summary.stringCount.toLocaleString()} />
        <StatCard
          label="String bytes"
          value={summary.totalStringBytes.toLocaleString()}
        />
        <StatCard
          label="Nodes"
          value={summary.nodeCount !== undefined ? summary.nodeCount.toLocaleString() : "\u2014"}
        />
        <StatCard
          label="Potential secrets"
          value={secretsCount !== null ? secretsCount.toLocaleString() : "\u2014"}
        />
      </div>

      {summary.warnings.length > 0 && (
        <div className="rounded-md border border-[#E5E7EB] bg-[#F9FAFB] p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#4B5563]">Notes</p>
          <ul className="space-y-1.5">
            {summary.warnings.map((warning, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-[#4B5563]">
                <AlertIcon width={14} height={14} className="mt-0.5 flex-none text-[#9CA3AF]" />
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onGoToSecrets}
          className="rounded-md bg-[#16A34A] px-3 py-2 text-xs font-semibold text-white hover:bg-[#15803D]"
        >
          Scan for secrets
        </button>
        <button
          type="button"
          onClick={onGoToStrings}
          className="rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-semibold text-[#111827] hover:border-[#16A34A]"
        >
          Browse strings
        </button>
      </div>
    </div>
  );
}
