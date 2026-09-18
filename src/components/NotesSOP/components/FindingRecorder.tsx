import type { EvidenceFinding } from "../types/notesSop";
import { formatEvidence } from "../lib/evidenceFormatter";

interface Props {
  finding: EvidenceFinding;
  onChange: (finding: EvidenceFinding) => void;
}

export default function FindingRecorder({ finding, onChange }: Props) {
  const update = <K extends keyof EvidenceFinding>(key: K, value: EvidenceFinding[K]) =>
    onChange({ ...finding, [key]: value });

  const inputClass = "mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-100";

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-200 bg-gray-50/70 px-5 py-4">
        <p className="text-sm font-bold text-gray-900">Finding Recorder</p>
        <p className="mt-1 text-xs text-gray-500">Keep observation, interpretation, and confirmation status separate.</p>
      </div>

      <div className="p-5">
        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Source</label>
            <input value={finding.source} onChange={(e) => update("source", e.target.value)} placeholder="Where was this observed?" className={inputClass} />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Target</label>
            <input value={finding.target} onChange={(e) => update("target", e.target.value)} placeholder="Host, file, endpoint, artifact..." className={inputClass} />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Observation</label>
            <textarea value={finding.observation} onChange={(e) => update("observation", e.target.value)} placeholder="Record the raw fact without interpretation." className={`${inputClass} min-h-28 resize-y`} />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Interpretation</label>
            <textarea value={finding.interpretation} onChange={(e) => update("interpretation", e.target.value)} placeholder="Explain what the observation may indicate." className={`${inputClass} min-h-28 resize-y`} />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Confidence</label>
            <select value={finding.confidence} onChange={(e) => update("confidence", e.target.value as EvidenceFinding["confidence"])} className={inputClass}>
              <option value="low">Low confidence</option>
              <option value="medium">Medium confidence</option>
              <option value="high">High confidence</option>
              <option value="confirmed">Confirmed</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Status</label>
            <select value={finding.status} onChange={(e) => update("status", e.target.value as EvidenceFinding["status"])} className={inputClass}>
              <option value="candidate">Candidate</option>
              <option value="confirmed">Confirmed</option>
              <option value="dead-end">Dead end</option>
            </select>
          </div>
        </div>

        <div className="mt-6 border-t border-gray-200 pt-5">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Generated evidence</p>
              <p className="mt-1 text-xs text-gray-400">Preview of the structured finding.</p>
            </div>
          </div>
          <pre className="overflow-x-auto rounded-lg bg-gray-950 p-4 text-xs leading-5 text-gray-200 whitespace-pre-wrap">{formatEvidence(finding)}</pre>
        </div>
      </div>
    </div>
  );
}
