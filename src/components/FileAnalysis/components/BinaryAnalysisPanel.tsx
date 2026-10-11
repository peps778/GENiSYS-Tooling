import React from 'react';
import type { BinaryStatistics } from '../types/fileAnalysis';
import {
  recoverBytePermutations,
  type PermutationCandidate,
} from '../lib/bytePermutationRecovery';

interface BinaryAnalysisPanelProps {
  stats: BinaryStatistics;
  rawData?: Uint8Array | null;
}

function exportPermutationSample(candidate: PermutationCandidate) {
  const blob = new Blob([candidate.bytes], {
    type: 'application/octet-stream',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `permutation-sample-${candidate.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.bin`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
        {label}
      </p>
      <p className="mt-1 font-mono text-xl text-[#111827]">{value}</p>
      {sub && <p className="mt-1 text-xs text-[#9CA3AF]">{sub}</p>}
    </div>
  );
}

export function BinaryAnalysisPanel({
  stats,
  rawData,
}: BinaryAnalysisPanelProps) {
  const permutationCandidates = rawData
    ? recoverBytePermutations(rawData, 6)
    : [];
  const entropyLabel =
    stats.entropyEstimate >= 7.5 ? 'High byte entropy observed' : null;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Entropy estimate"
          value={`${stats.entropyEstimate.toFixed(2)} bits/byte`}
          sub="0–8 scale"
        />
        <Stat
          label="Printable ratio"
          value={`${(stats.printableRatio * 100).toFixed(1)}%`}
        />
        <Stat
          label="Null-byte ratio"
          value={`${(stats.nullByteRatio * 100).toFixed(1)}%`}
        />
        <Stat
          label="Size analyzed"
          value={`${stats.sizeBytes.toLocaleString()} B`}
        />
      </div>

      {entropyLabel && (
        <div className="rounded-[12px] border border-[#E5E7EB] bg-[#F9FAFB] p-4 text-sm text-[#6B7280]">
          {entropyLabel}. High entropy can indicate compressed, encrypted, or
          otherwise dense data — it is not, on its own, evidence of encryption
          or malicious content. Interpret alongside other findings.
        </div>
      )}

      <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
          Top Byte Frequencies
        </p>
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-[#9CA3AF]">
              <th className="py-1 font-normal">Byte</th>
              <th className="py-1 font-normal">Count</th>
              <th className="py-1 font-normal">Share</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F9FAFB]">
            {stats.topBytes.map((entry) => (
              <tr key={entry.byte}>
                <td className="py-1.5 font-mono text-[#111827]">
                  0x{entry.byte.toString(16).toUpperCase().padStart(2, '0')}
                </td>
                <td className="py-1.5 font-mono text-[#6B7280]">
                  {entry.count.toLocaleString()}
                </td>
                <td className="py-1.5 font-mono text-[#6B7280]">
                  {stats.sizeBytes > 0
                    ? `${((entry.count / stats.sizeBytes) * 100).toFixed(2)}%`
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {permutationCandidates.length > 0 && (
        <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
            Byte-permutation recovery hypotheses
          </p>
          <p className="mt-2 text-xs leading-5 text-[#6B7280]">
            Tests common reversible reorderings against printable-text and
            flag-like signals. Candidates are ranked heuristically; a high score
            is not proof of the original transform. Analysis and exported
            candidates are capped to the first 64 KiB of the file.
          </p>
          <div className="mt-3 space-y-2">
            {permutationCandidates.map((candidate: PermutationCandidate) => (
              <article
                key={candidate.name}
                className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium text-[#111827]">
                    {candidate.name}
                  </span>
                  <span className="text-xs text-[#6B7280]">
                    Score {candidate.score.toFixed(1)} ·{' '}
                    {(candidate.printableRatio * 100).toFixed(1)}% printable
                  </span>
                </div>
                {candidate.flagLike && (
                  <p className="mt-1 text-xs font-medium text-[#15803D]">
                    Flag-like text signal detected; verify manually.
                  </p>
                )}
                <pre className="mt-2 max-h-24 overflow-auto whitespace-pre-wrap break-all font-mono text-xs text-[#374151]">
                  {candidate.preview}
                </pre>
                <button
                  type="button"
                  onClick={() => exportPermutationSample(candidate)}
                  className="mt-2 rounded-md border border-[#D1D5DB] px-3 py-1.5 text-xs font-medium text-[#374151] hover:bg-white"
                >
                  Export candidate sample
                </button>
              </article>
            ))}
          </div>
        </div>
      )}

      {stats.detectedTextRegions.length > 0 && (
        <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
            Detected Text Regions ({stats.detectedTextRegions.length})
          </p>
          <ul className="mt-2 grid gap-1 font-mono text-xs text-[#6B7280] sm:grid-cols-2">
            {stats.detectedTextRegions.slice(0, 20).map((region, i) => (
              <li key={i}>
                0x{region.offset.toString(16).toUpperCase().padStart(8, '0')} ·{' '}
                {region.length} bytes
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default BinaryAnalysisPanel;
