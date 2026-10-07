import React from 'react';
import type { AnomalyFinding, Confidence } from '../types/fileAnalysis';

interface SteganographyPanelProps {
  findings: AnomalyFinding[];
  detectedFormat: string;
}

const KIND_LABELS: Record<AnomalyFinding['kind'], string> = {
  'trailing-data': 'Unexpected trailing bytes',
  'unknown-chunk': 'Unknown chunk',
  'embedded-signature': 'Embedded signature candidate',
  'structural-note': 'Structural note',
  'lsb-data': 'LSB data candidate',
  'silent-region': 'Silent region',
  'stego-signature': 'Steganography tool signature',
  'metadata-injection': 'Suspicious metadata',
  'appended-archive': 'Appended archive',
};

const CONFIDENCE_STYLES: Record<Confidence, string> = {
  confirmed: 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]',
  probable: 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]',
  unknown: 'bg-[#F9FAFB] text-[#6B7280] border-[#E5E7EB]',
};

export function SteganographyPanel({
  findings,
  detectedFormat,
}: SteganographyPanelProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-[12px] border border-[#E5E7EB] bg-[#F9FAFB] p-4 text-xs text-[#6B7280]">
        These checks report observable byte-level anomalies for {detectedFormat}
        . They are not a claim that steganography or hidden data has been
        detected — only that something warrants closer inspection.
      </div>

      {findings.length === 0 ? (
        <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <p className="text-sm text-[#111827]">
            No anomalies observed by the checks available for this format.
          </p>
          <p className="mt-1 text-xs text-[#9CA3AF]">
            This does not rule out hidden data; it means the specific checks run
            here found nothing.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {findings.map((finding, i) => (
            <li
              key={i}
              className="rounded-[12px] border border-[#E5E7EB] bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-[#111827]">
                  {KIND_LABELS[finding.kind]}
                </p>
                <span
                  className={`inline-flex items-center rounded-[8px] border px-2 py-0.5 text-xs font-medium ${CONFIDENCE_STYLES[finding.confidence]}`}
                >
                  {finding.confidence === 'confirmed'
                    ? 'Confirmed'
                    : finding.confidence === 'probable'
                      ? 'Candidate'
                      : 'Unknown'}
                </span>
              </div>
              <p className="mt-1 text-sm text-[#6B7280]">
                {finding.description}
              </p>
              {finding.offset !== null && (
                <p className="mt-1 font-mono text-xs text-[#9CA3AF]">
                  Offset 0x
                  {finding.offset.toString(16).toUpperCase().padStart(8, '0')}
                  {finding.length !== null ? ` · ${finding.length} bytes` : ''}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SteganographyPanel;
