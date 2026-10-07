import React, { useMemo, useState } from 'react';
import type { CtfFinding, CtfTriageResult } from '../types/fileAnalysis';

interface Props {
  triage: CtfTriageResult;
  onJump: (offset: number) => void;
  onRunCommand: (command: string) => void;
}

const severityClass: Record<CtfFinding['severity'], string> = {
  high: 'border-red-200 bg-red-50 text-red-800',
  medium: 'border-amber-200 bg-amber-50 text-amber-800',
  low: 'border-blue-200 bg-blue-50 text-blue-800',
  info: 'border-[#E5E7EB] bg-[#F9FAFB] text-[#4B5563]',
};

export function CtfWorkbenchPanel({ triage, onJump, onRunCommand }: Props) {
  const [filter, setFilter] = useState<'all' | CtfFinding['severity']>('all');
  const findings = useMemo(
    () =>
      filter === 'all'
        ? triage.findings
        : triage.findings.filter((f) => f.severity === filter),
    [filter, triage.findings],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-[180px_1fr]">
        <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
            CTF Triage Score
          </p>
          <div className="mt-2 text-3xl font-semibold text-[#111827]">
            {triage.score}
          </div>
          <p className="mt-1 text-xs text-[#6B7280]">
            heuristic lead score / 100
          </p>
          <p className="mt-3 text-xs text-[#9CA3AF]">
            A high score means more challenge-oriented indicators were observed;
            it is not a verdict.
          </p>
        </div>

        <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
                Recommended first moves
              </p>
              <p className="mt-1 text-sm text-[#111827]">
                Start with the least destructive, highest-signal checks.
              </p>
            </div>
            <div className="flex gap-1">
              {(['all', 'high', 'medium', 'low'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setFilter(v)}
                  className={`rounded-[8px] border px-2.5 py-1 text-xs font-medium ${filter === v ? 'border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]' : 'border-[#E5E7EB] text-[#6B7280]'}`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {triage.recommendedCommands.map((command) => (
              <button
                key={command}
                type="button"
                onClick={() => onRunCommand(command)}
                className="rounded-[8px] border border-[#E5E7EB] bg-[#F9FAFB] px-2.5 py-1.5 font-mono text-xs text-[#374151] hover:border-[#BBF7D0] hover:bg-[#F0FDF4]"
              >
                {command}
              </button>
            ))}
          </div>
        </div>
      </div>

      {triage.transforms.length > 0 && (
        <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
            Automatic transform candidates
          </p>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {triage.transforms.map((t, i) => (
              <div
                key={`${t.name}-${i}`}
                className="rounded-[10px] border border-[#E5E7EB] bg-[#F9FAFB] p-3"
              >
                <p className="text-sm font-medium text-[#111827]">{t.name}</p>
                <p className="mt-1 text-xs text-[#6B7280]">{t.description}</p>
                <pre className="mt-2 max-h-24 overflow-auto whitespace-pre-wrap break-all rounded border border-[#E5E7EB] bg-white p-2 font-mono text-xs text-[#374151]">
                  {t.output}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-[12px] border border-[#E5E7EB] bg-white shadow-sm">
        <div className="border-b border-[#E5E7EB] px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
            Investigation leads
          </p>
          <p className="mt-1 text-xs text-[#9CA3AF]">
            {findings.length} displayed / {triage.findings.length} total. Leads
            require verification.
          </p>
        </div>
        <div className="divide-y divide-[#E5E7EB]">
          {findings.length === 0 && (
            <div className="p-5 text-sm text-[#6B7280]">
              No findings in this filter.
            </div>
          )}
          {findings.map((f) => (
            <div
              key={f.id}
              className="grid gap-3 p-4 md:grid-cols-[auto_1fr_auto]"
            >
              <span
                className={`h-fit rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${severityClass[f.severity]}`}
              >
                {f.severity}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#111827]">{f.title}</p>
                <pre className="mt-1 overflow-auto whitespace-pre-wrap break-all font-mono text-xs text-[#374151]">
                  {f.value}
                </pre>
                <p className="mt-2 text-xs text-[#6B7280]">
                  <span className="font-medium text-[#374151]">Why:</span>{' '}
                  {f.why}
                </p>
                <p className="mt-1 text-xs text-[#6B7280]">
                  <span className="font-medium text-[#374151]">Next:</span>{' '}
                  {f.nextStep}
                </p>
              </div>
              {f.offset !== null && (
                <button
                  type="button"
                  onClick={() => f.offset !== null && onJump(f.offset)}
                  className="h-fit rounded-[8px] border border-[#E5E7EB] px-2.5 py-1 text-xs font-medium text-[#374151] hover:border-[#BBF7D0] hover:bg-[#F0FDF4]"
                >
                  0x{f.offset.toString(16)}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
export default CtfWorkbenchPanel;
