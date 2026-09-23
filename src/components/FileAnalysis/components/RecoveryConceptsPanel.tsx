import React from 'react';
import type { EmbeddedFileCandidate } from '../types/fileAnalysis';

interface RecoveryConceptsPanelProps {
  candidates: EmbeddedFileCandidate[];
  onInspect: (candidate: EmbeddedFileCandidate) => void;
  onOpenInHexViewer: (offset: number) => void;
  onExport: (candidate: EmbeddedFileCandidate) => void;
}

const CONCEPTS: { title: string; description: string }[] = [
  {
    title: 'Deleted directory entries',
    description:
      "Filesystems typically mark a file's directory entry as free without erasing its data, until that space is reused.",
  },
  {
    title: 'Filesystem metadata',
    description:
      "Timestamps, permissions, and allocation tables describe files, but the browser's File API only ever sees the bytes of a file you explicitly select — never raw disk structures.",
  },
  {
    title: 'Unallocated space',
    description:
      "Space a filesystem considers free may still contain old data until it's overwritten.",
  },
  {
    title: 'File carving',
    description:
      'Reconstructing files from raw data using known signatures and structure, without relying on filesystem metadata.',
  },
  {
    title: 'Slack space',
    description:
      "The unused space between a file's logical end and the end of its last allocated cluster can retain remnants of earlier data.",
  },
  {
    title: 'Fragmented files',
    description:
      "A file's contents can be split across non-contiguous regions, which naive signature scanning cannot reliably reassemble.",
  },
];

export function RecoveryConceptsPanel({
  candidates,
  onInspect,
  onOpenInHexViewer,
  onExport,
}: RecoveryConceptsPanelProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
          Recovery Concepts
        </p>
        <p className="mt-2 text-sm text-[#6B7280]">
          A browser's File API reads only the bytes of a file you select — it
          cannot access an unallocated filesystem region or recover a file that
          isn't present in what you loaded. The concepts below explain what
          "deleted-file recovery" involves at the filesystem level; the
          practical tool below works only on the bytes already loaded into this
          session.
        </p>
        <dl className="mt-3 space-y-3">
          {CONCEPTS.map((concept) => (
            <div key={concept.title}>
              <dt className="text-sm font-medium text-[#111827]">
                {concept.title}
              </dt>
              <dd className="text-sm text-[#6B7280]">{concept.description}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
          Candidate Embedded Files
        </p>
        <p className="mt-1 text-xs text-[#9CA3AF]">
          Signature matches found within the loaded data. A byte signature alone
          is not confirmation of a complete, valid file — treat these as
          candidates for further inspection.
        </p>

        {candidates.length === 0 ? (
          <p className="mt-3 text-sm text-[#6B7280]">
            No embedded file signatures found.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-[#E5E7EB]">
            {candidates.map((candidate) => (
              <li
                key={candidate.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-[#111827]">
                    {candidate.format}
                    <span className="ml-2 rounded-[6px] border border-[#E5E7EB] px-1.5 py-0.5 text-xs font-normal text-[#6B7280]">
                      Candidate
                    </span>
                  </p>
                  <p className="font-mono text-xs text-[#9CA3AF]">
                    Offset 0x
                    {candidate.offset
                      .toString(16)
                      .toUpperCase()
                      .padStart(8, '0')}
                    {candidate.endOffset !== null &&
                      ` – 0x${candidate.endOffset.toString(16).toUpperCase().padStart(8, '0')}`}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-medium">
                  <button
                    onClick={() => onInspect(candidate)}
                    className="text-[#16A34A] hover:text-[#15803D]"
                  >
                    Inspect
                  </button>
                  <button
                    onClick={() => onOpenInHexViewer(candidate.offset)}
                    className="text-[#16A34A] hover:text-[#15803D]"
                  >
                    Open in Hex Viewer
                  </button>
                  <button
                    onClick={() => onExport(candidate)}
                    className="text-[#16A34A] hover:text-[#15803D]"
                  >
                    Export
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default RecoveryConceptsPanel;
