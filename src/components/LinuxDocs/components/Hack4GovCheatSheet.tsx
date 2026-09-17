import { hack4GovItems, evidenceWorkflow } from '../data/hack4gov';
import { CopyCommandButton } from './CopyCommandButton';

const phaseLabels = {
  triage: 'Initial triage',
  web: 'Web',
  dns: 'DNS',
  forensics: 'File analysis',
  logs: 'Log analysis',
  evidence: 'Evidence handling',
} as const;

export function Hack4GovCheatSheet() {
  const phases = Array.from(new Set(hack4GovItems.map((item) => item.phase)));
  return (
    <div className="space-y-4">
      {phases.map((phase) => (
        <section key={phase}>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            {phaseLabels[phase]}
          </h3>
          <div className="grid gap-2 md:grid-cols-2">
            {hack4GovItems
              .filter((item) => item.phase === phase)
              .map((item) => (
                <article
                  key={item.title}
                  className="min-w-0 rounded-md border border-slate-200 bg-white p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {item.purpose}
                      </p>
                    </div>
                    <CopyCommandButton command={item.command} />
                  </div>
                  <pre className="mt-2 min-w-0 overflow-x-auto rounded bg-slate-950 p-2.5 text-xs text-slate-100">
                    <code>{item.command}</code>
                  </pre>
                </article>
              ))}
          </div>
        </section>
      ))}
      <section className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800">
          Evidence workflow
        </h3>
        <div className="mt-3 flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
          {evidenceWorkflow.map((step, index) => (
            <div
              key={step}
              className="flex items-center gap-2 text-xs font-medium text-emerald-900"
            >
              <span>
                {index + 1}. {step}
              </span>
              {index < evidenceWorkflow.length - 1 && (
                <span className="hidden sm:inline">→</span>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
