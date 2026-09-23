import { useEffect, useMemo, useState } from 'react';
import type {
  Confidence,
  FlagLogEntry,
  FlagLogStatus,
  SOPCategoryId,
} from '../types/notesSop';

const STORAGE_KEY = 'notes-sop.flag-logbook.v1';

const categoryOptions: Array<{ id: SOPCategoryId; label: string }> = [
  { id: 'enumeration', label: 'Enumeration' },
  { id: 'web', label: 'Web' },
  { id: 'network', label: 'Network' },
  { id: 'forensics', label: 'Forensics' },
  { id: 'stego', label: 'Stego' },
  { id: 'encoding', label: 'Encoding' },
  { id: 'vulnerabilities', label: 'Vulnerability' },
];

const blankEntry = (): FlagLogEntry => ({
  id: `FLAG-${Date.now()}`,
  timestamp: new Date().toISOString(),
  category: 'web',
  source: '',
  location: '',
  flag: '',
  status: 'candidate',
  confidence: 'low',
  evidence: '',
  verification: '',
  notes: '',
});

export default function FlagLogbook({
  onCountChange,
}: {
  onCountChange?: (count: number) => void;
}) {
  const [entries, setEntries] = useState<FlagLogEntry[]>([]);
  const [draft, setDraft] = useState<FlagLogEntry>(blankEntry);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | FlagLogStatus>(
    'all',
  );

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setEntries(JSON.parse(raw) as FlagLogEntry[]);
    } catch {
      setEntries([]);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // Local persistence is best-effort; the visible session remains authoritative.
    }
    onCountChange?.(entries.length);
  }, [entries, onCountChange]);

  const filteredEntries = useMemo(() => {
    const normalized = filter.trim().toLowerCase();
    return entries.filter((entry) => {
      const statusMatches =
        statusFilter === 'all' || entry.status === statusFilter;
      const textMatches =
        !normalized ||
        [
          entry.id,
          entry.source,
          entry.location,
          entry.flag,
          entry.evidence,
          entry.verification,
          entry.notes,
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalized);
      return statusMatches && textMatches;
    });
  }, [entries, filter, statusFilter]);

  const updateDraft = <K extends keyof FlagLogEntry>(
    key: K,
    value: FlagLogEntry[K],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const addEntry = () => {
    if (!draft.flag.trim() || !draft.source.trim()) return;
    setEntries((current) => [
      {
        ...draft,
        id: `FLAG-${Date.now()}`,
        timestamp: new Date().toISOString(),
      },
      ...current,
    ]);
    setDraft(blankEntry());
  };

  const removeEntry = (id: string) =>
    setEntries((current) => current.filter((entry) => entry.id !== id));

  const exportLog = () => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `flag-logbook-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <LogbookStat label="Total" value={entries.length} />
        <LogbookStat
          label="Candidates"
          value={entries.filter((x) => x.status === 'candidate').length}
        />
        <LogbookStat
          label="Confirmed"
          value={entries.filter((x) => x.status === 'confirmed').length}
        />
        <LogbookStat
          label="Rejected / duplicate"
          value={
            entries.filter(
              (x) => x.status === 'rejected' || x.status === 'duplicate',
            ).length
          }
        />
      </div>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-bold text-slate-900">
            Record a flag candidate
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Record provenance and verification separately. Do not mark a
            candidate confirmed until the value is independently validated.
          </p>
        </div>
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
          <Field
            label="Source"
            value={draft.source}
            onChange={(v) => updateDraft('source', v)}
            placeholder="target / file / PCAP"
          />
          <Field
            label="Location"
            value={draft.location}
            onChange={(v) => updateDraft('location', v)}
            placeholder="URL / offset / packet / path"
          />
          <Field
            label="Flag"
            value={draft.flag}
            onChange={(v) => updateDraft('flag', v)}
            placeholder="candidate value"
          />
          <SelectField
            label="Category"
            value={draft.category}
            onChange={(v) => updateDraft('category', v as SOPCategoryId)}
            options={categoryOptions.map((x) => ({
              value: x.id,
              label: x.label,
            }))}
          />
          <SelectField
            label="Status"
            value={draft.status}
            onChange={(v) => updateDraft('status', v as FlagLogStatus)}
            options={['candidate', 'confirmed', 'duplicate', 'rejected'].map(
              (x) => ({ value: x, label: x }),
            )}
          />
          <SelectField
            label="Confidence"
            value={draft.confidence}
            onChange={(v) => updateDraft('confidence', v as Confidence)}
            options={['low', 'medium', 'high', 'confirmed'].map((x) => ({
              value: x,
              label: x,
            }))}
          />
          <TextArea
            label="Evidence"
            value={draft.evidence}
            onChange={(v) => updateDraft('evidence', v)}
            placeholder="Exact observation, output, or artifact reference"
            className="md:col-span-2"
          />
          <TextArea
            label="Verification"
            value={draft.verification}
            onChange={(v) => updateDraft('verification', v)}
            placeholder="How the candidate was verified"
            className="md:col-span-2"
          />
          <TextArea
            label="Notes"
            value={draft.notes}
            onChange={(v) => updateDraft('notes', v)}
            placeholder="Dead ends, context, next action"
            className="md:col-span-2 xl:col-span-4"
          />
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3">
          <button
            type="button"
            onClick={() => setDraft(blankEntry())}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={addEntry}
            disabled={!draft.flag.trim() || !draft.source.trim()}
            className="rounded-md bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Add to logbook
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-4 py-3">
          <input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Filter logbook..."
            className="h-9 min-w-56 flex-1 rounded-md border border-slate-300 bg-slate-50 px-3 text-xs outline-none focus:border-emerald-500 focus:bg-white"
          />
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as typeof statusFilter)
            }
            className="h-9 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-700"
          >
            <option value="all">All statuses</option>
            <option value="candidate">Candidate</option>
            <option value="confirmed">Confirmed</option>
            <option value="duplicate">Duplicate</option>
            <option value="rejected">Rejected</option>
          </select>
          <button
            type="button"
            onClick={exportLog}
            disabled={!entries.length}
            className="h-9 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={() => setEntries([])}
            disabled={!entries.length}
            className="h-9 rounded-md border border-red-200 bg-white px-3 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-40"
          >
            Clear log
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredEntries.map((entry) => (
            <article key={entry.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-slate-500">
                      {entry.id}
                    </span>
                    <StatusBadge status={entry.status} />
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                      {entry.confidence}
                    </span>
                  </div>
                  <h3 className="mt-2 break-all text-sm font-bold text-slate-900">
                    {entry.flag}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {entry.source} ·{' '}
                    {entry.location || 'location not specified'} ·{' '}
                    {new Date(entry.timestamp).toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeEntry(entry.id)}
                  className="rounded-md px-2 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <LogText title="Evidence" value={entry.evidence} />
                <LogText title="Verification" value={entry.verification} />
              </div>
              {entry.notes && (
                <LogText title="Notes" value={entry.notes} className="mt-3" />
              )}
            </article>
          ))}
          {!filteredEntries.length && (
            <div className="p-10 text-center text-xs text-slate-500">
              No logbook entries match the current filter.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  className = '',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full resize-y rounded-md border border-slate-300 bg-white px-2.5 py-2 text-xs leading-5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function LogbookStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold tracking-tight text-slate-900">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: FlagLogStatus }) {
  const styles: Record<FlagLogStatus, string> = {
    candidate: 'bg-amber-50 text-amber-700',
    confirmed: 'bg-emerald-50 text-emerald-700',
    duplicate: 'bg-slate-100 text-slate-600',
    rejected: 'bg-red-50 text-red-700',
  };
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function LogText({
  title,
  value,
  className = '',
}: {
  title: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {title}
      </p>
      <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-slate-700">
        {value || 'Not recorded.'}
      </p>
    </div>
  );
}
