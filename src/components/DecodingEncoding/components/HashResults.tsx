import React from 'react';
import type { HashIdentificationResult } from '../tools/hashIdentifier';

interface HashResultsProps {
  result: HashIdentificationResult;
  hashValue: string;
}

const CONFIDENCE_STYLES: Record<string, string> = {
  high: 'bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]',
  medium: 'bg-[#FEFCE8] border-[#FEF08A] text-[#A16207]',
  low: 'bg-[#F9FAFB] border-[#E5E7EB] text-[#6B7280]',
};

export default function HashResults({ result, hashValue }: HashResultsProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-[10px] border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-[#6B7280]">Length</dt>
          <dd className="font-mono text-sm text-[#111827]">
            {result.length} characters
          </dd>
        </div>
        <div>
          <dt className="text-xs text-[#6B7280]">Character set</dt>
          <dd className="font-mono text-sm text-[#111827]">
            {result.characterSet}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs text-[#6B7280]">Format</dt>
          <dd className="text-sm text-[#111827]">{result.format}</dd>
        </div>
      </div>

      {result.candidates.length > 1 && (
        <p className="text-xs text-[#6B7280]">
          Multiple algorithms can produce this length and character set. Results
          are heuristic, not definitive.
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {result.candidates.map((candidate) => (
          <li
            key={candidate.algorithm}
            className={`flex items-center justify-between gap-3 rounded-[10px] border px-3.5 py-2.5 ${CONFIDENCE_STYLES[candidate.confidence]}`}
          >
            <div>
              <p className="text-sm font-medium">{candidate.algorithm}</p>
              <p className="text-xs opacity-80">{candidate.note}</p>
            </div>
            <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide">
              {candidate.confidence}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-2 border-t border-[#E5E7EB] pt-3">
        <a
          href={`https://crackstation.net/?hash=${encodeURIComponent(hashValue)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-10 items-center justify-center rounded-[10px] bg-[#16A34A] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#15803D] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2"
          aria-label="Open CrackStation to look up the detected hash"
        >
          Open in CrackStation
        </a>
        {hashValue.split('.').length === 3 && (
          <a
            href={`https://www.jwt.io/#debugger-io?token=${encodeURIComponent(hashValue)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center justify-center rounded-[10px] border border-[#D1D5DB] bg-white px-4 py-2 text-sm font-medium text-[#111827] transition hover:bg-[#F9FAFB] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2"
          >
            Open in JWT Editor
          </a>
        )}
      </div>
      <p className="text-xs text-[#6B7280]">
        Hash identification is heuristic. CrackStation may not accept prefilled
        hashes from URL parameters; paste the detected value there if it is not
        populated automatically. JWT structure does not prove signature
        validity.
      </p>
    </div>
  );
}
