import React, { useState } from "react";
import type { FormatCandidate } from "../tools/formatDetector";
import { detectFormats } from "../tools/formatDetector";

interface SmartDetectPanelProps {
  onUseCandidate: (candidate: FormatCandidate, input: string) => void;
}

function confidenceLabel(confidence: number): { label: string; className: string } {
  if (confidence >= 0.8) return { label: "Likely", className: "bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]" };
  if (confidence >= 0.5) return { label: "Possible", className: "bg-[#FEFCE8] border-[#FEF08A] text-[#A16207]" };
  return { label: "Weak match", className: "bg-[#F9FAFB] border-[#E5E7EB] text-[#6B7280]" };
}

export default function SmartDetectPanel({ onUseCandidate }: SmartDetectPanelProps) {
  const [value, setValue] = useState("");
  const [candidates, setCandidates] = useState<FormatCandidate[] | null>(null);

  function runDetection() {
    setCandidates(detectFormats(value));
  }

  return (
    <div className="flex flex-col gap-3 rounded-[12px] border border-[#E5E7EB] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold text-[#111827]">Auto-Detect Format</h2>
        <p className="text-xs text-[#6B7280]">
          Paste any encoded value. Candidates are ranked heuristically by character set, structure, and
          decode-success checks — treat this as a strong starting guess, not a certainty, especially for short or
          ambiguous inputs.
        </p>
      </div>

      <textarea
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setCandidates(null);
        }}
        placeholder="Paste data here to identify its likely format…"
        rows={3}
        spellCheck={false}
        aria-label="Auto-detect input"
        className="w-full resize-y rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-2.5 font-mono text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]"
      />

      <div>
        <button
          type="button"
          onClick={runDetection}
          disabled={value.trim().length === 0}
          className="rounded-[10px] bg-[#16A34A] px-4 py-2 text-sm font-medium text-white hover:bg-[#15803D] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2"
        >
          Detect Format
        </button>
      </div>

      {candidates && candidates.length === 0 && (
        <p className="text-sm text-[#6B7280]">No recognizable structured format detected — it may already be plain text.</p>
      )}

      {candidates && candidates.length > 0 && (
        <ul className="flex flex-col gap-2">
          {candidates.map((candidate, idx) => {
            const { label, className } = confidenceLabel(candidate.confidence);
            return (
              <li
                key={`${candidate.toolId}-${idx}`}
                className={`flex items-center justify-between gap-3 rounded-[10px] border px-3.5 py-2.5 ${className}`}
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{candidate.toolLabel}</span>
                    <span className="rounded-full bg-white/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                      {label} · {Math.round(candidate.confidence * 100)}%
                    </span>
                  </div>
                  <p className="text-xs opacity-80">{candidate.reason}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onUseCandidate(candidate, value)}
                  className="whitespace-nowrap rounded-[10px] border border-current px-3 py-1.5 text-xs font-medium hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]"
                >
                  Use This
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
