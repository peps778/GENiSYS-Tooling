import { useEffect, useMemo, useState } from 'react';
import type { OSINTFlagEntry, OSINTFlagStatus } from '../types/osint';

const STORAGE_KEY = 'notes-sop.flag-logbook.v1';
const blank = (): OSINTFlagEntry => ({
  id: `FLAG-OSINT-${Date.now()}`,
  timestamp: new Date().toISOString(),
  target: '',
  finding: '',
  source: '',
  evidence: '',
  url: '',
  status: 'candidate',
  confidence: 'low',
  verification: '',
  notes: '',
});

export default function FlagLogbook({
  onCountChange,
}: {
  onCountChange?: (count: number) => void;
}) {
  const [entries, setEntries] = useState<OSINTFlagEntry[]>([]);
  const [draft, setDraft] = useState<OSINTFlagEntry>(blank());
  const [filter, setFilter] = useState('');
  const [status, setStatus] = useState<'all' | OSINTFlagStatus>('all');
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setEntries(parsed as OSINTFlagEntry[]);
      }
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {}
    onCountChange?.(entries.length);
  }, [entries, onCountChange]);
  const filtered = useMemo(() => {
    const q = filter.toLowerCase().trim();
    return entries.filter(
      (x) =>
        (status === 'all' || x.status === status) &&
        (!q || Object.values(x).join(' ').toLowerCase().includes(q)),
    );
  }, [entries, filter, status]);
  const update = (k: keyof OSINTFlagEntry, v: string) =>
    setDraft((x) => ({ ...x, [k]: v }));
  const add = () => {
    if (!draft.finding.trim() || !draft.source.trim()) return;
    setEntries((x) => [
      {
        ...draft,
        id: `FLAG-OSINT-${Date.now()}`,
        timestamp: new Date().toISOString(),
      },
      ...x,
    ]);
    setDraft(blank());
  };
  const exportLog = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(
      new Blob([JSON.stringify(entries, null, 2)], {
        type: 'application/json',
      }),
    );
    a.download = `osint-flag-logbook-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        {[
          ['Total', entries.length],
          [
            'Candidates',
            entries.filter((x) => x.status === 'candidate').length,
          ],
          ['Confirmed', entries.filter((x) => x.status === 'confirmed').length],
          [
            'Needs review',
            entries.filter((x) => x.status === 'needs-review').length,
          ],
        ].map(([l, v]) => (
          <div
            key={l as string}
            className="rounded-lg border border-slate-200 bg-white px-4 py-3"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {l}
            </p>
            <p className="mt-1 text-lg font-bold text-slate-800">{v}</p>
          </div>
        ))}
      </div>
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-bold text-slate-900">
            Record an OSINT finding
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Keep the finding, provenance, verification, and confidence separate.
          </p>
        </div>
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
          {(
            [
              'target',
              'finding',
              'source',
              'url',
              'evidence',
              'verification',
              'notes',
            ] as const
          ).map((k) => (
            <label
              key={k}
              className={`${k === 'notes' || k === 'evidence' || k === 'verification' ? 'md:col-span-2 xl:col-span-4' : ''} text-[10px] font-bold uppercase tracking-wider text-slate-500`}
            >
              {k}
              <textarea
                value={draft[k]}
                onChange={(e) => update(k, e.target.value)}
                className="mt-1.5 min-h-12 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />
            </label>
          ))}
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Status
            <select
              value={draft.status}
              onChange={(e) => update('status', e.target.value)}
              className="mt-1.5 h-9 w-full rounded-lg border border-gray-200 px-2 text-xs"
            >
              {[
                'candidate',
                'investigating',
                'confirmed',
                'duplicate',
                'rejected',
                'needs-review',
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Confidence
            <select
              value={draft.confidence}
              onChange={(e) => update('confidence', e.target.value)}
              className="mt-1.5 h-9 w-full rounded-lg border border-gray-200 px-2 text-xs"
            >
              {['low', 'medium', 'high'].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3">
          <button
            type="button"
            onClick={() => setDraft(blank())}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-600"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={add}
            disabled={!draft.finding.trim() || !draft.source.trim()}
            className="rounded-md bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
          >
            Add to logbook
          </button>
        </div>
      </section>
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap gap-2 border-b border-slate-200 p-3">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter logbook..."
            className="h-9 min-w-56 flex-1 rounded-md border border-slate-300 bg-slate-50 px-3 text-xs"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className="h-9 rounded-md border border-slate-300 px-2 text-xs"
          >
            {[
              'all',
              'candidate',
              'investigating',
              'confirmed',
              'duplicate',
              'rejected',
              'needs-review',
            ].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={exportLog}
            className="h-9 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold"
          >
            Export JSON
          </button>
        </div>
        <div className="divide-y divide-slate-100">
          {filtered.map((x) => (
            <div key={x.id} className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] text-slate-400">
                  {x.id}
                </span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-500">
                  {x.status}
                </span>
                <span className="text-xs font-semibold text-slate-800">
                  {x.target}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-700">{x.finding}</p>
              <p className="mt-1 text-[11px] text-slate-500">
                {x.source} {x.url && `• ${x.url}`}
              </p>
            </div>
          ))}
          {!filtered.length && (
            <p className="p-8 text-center text-xs text-slate-500">
              No logbook entries match this filter.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
