import React from "react";
import type { HashIdentificationResult } from "../tools/hashIdentifier";

interface HashResultsProps {
  result: HashIdentificationResult;
}

const CONFIDENCE_STYLES: Record<string, string> = {
  high: "bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]",
  medium: "bg-[#FEFCE8] border-[#FEF08A] text-[#A16207]",
  low: "bg-[#F9FAFB] border-[#E5E7EB] text-[#6B7280]",
};

export default function HashResults({ result }: HashResultsProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-[10px] border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-[#6B7280]">Length</dt>
          <dd className="font-mono text-sm text-[#111827]">{result.length} characters</dd>
        </div>
        <div>
          <dt className="text-xs text-[#6B7280]">Character set</dt>
          <dd className="font-mono text-sm text-[#111827]">{result.characterSet}</dd>
        </div>
      </div>

      {result.candidates.length > 1 && (
        <p className="text-xs text-[#6B7280]">
          Multiple algorithms can produce this length and character set. Results are heuristic, not definitive.
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
    </div>
  );
}
