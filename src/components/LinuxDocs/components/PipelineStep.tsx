import type { PipelineStep as PipelineStepType } from '../types/linuxDocs';
import { CopyCommandButton } from './CopyCommandButton';

export function PipelineStep({
  step,
  index,
}: {
  step: PipelineStepType;
  index: number;
}) {
  return (
    <div className="flex min-w-0 gap-3 rounded-md border border-slate-200 bg-white p-3">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-700">
        {index + 1}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-slate-800">{step.title}</p>
            <p className="text-[11px] text-slate-500">{step.purpose}</p>
          </div>
          <CopyCommandButton command={step.command} />
        </div>
        <pre className="mt-2 min-w-0 overflow-x-auto rounded bg-slate-950 p-2.5 text-xs text-slate-100">
          <code>{step.command}</code>
        </pre>
      </div>
    </div>
  );
}
