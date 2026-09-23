import React from 'react';
import type {
  EncodedContentCandidate,
  FileIdentification,
  Confidence,
} from '../types/fileAnalysis';

interface DetectionResultsProps {
  identification: FileIdentification;
  encodedContent?: EncodedContentCandidate | null;
  onOpenDecodedContent?: () => void;
  onExportDecodedContent?: () => void;
}

const CONFIDENCE_STYLES: Record<Confidence, string> = {
  confirmed: 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]',
  probable: 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]',
  unknown: 'bg-[#F9FAFB] text-[#6B7280] border-[#E5E7EB]',
};

const CONFIDENCE_LABELS: Record<Confidence, string> = {
  confirmed: 'Confirmed signature match',
  probable: 'Probable match',
  unknown: 'Unknown',
};

function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  return (
    <span
      className={`inline-flex items-center rounded-[8px] border px-2 py-0.5 text-xs font-medium ${CONFIDENCE_STYLES[confidence]}`}
    >
      {CONFIDENCE_LABELS[confidence]}
    </span>
  );
}

export function DetectionResults({
  identification,
  encodedContent,
  onOpenDecodedContent,
  onExportDecodedContent,
}: DetectionResultsProps) {
  const { signature, candidates, reportedExtension, extensionMismatch } =
    identification;

  return (
    <div className="space-y-4">
      {encodedContent && (
        <div className="rounded-[12px] border border-[#BBF7D0] bg-[#F0FDF4] p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[#15803D]">
            Text-Encoded Binary Detected
          </p>
          <p className="mt-2 text-sm text-[#111827]">
            This file's raw bytes are ASCII{' '}
            <span className="font-mono">'0'</span>/
            <span className="font-mono">'1'</span> characters — a
            bit-per-character text encoding of another file, not binary
            image/document data. No byte-level signature scan can see the real
            file's magic bytes until this is decoded (every 8 characters → 1
            byte).
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <dt className="text-[#6B7280]">Encoded length</dt>
            <dd className="text-right font-mono text-[#111827]">
              {encodedContent.originalLength.toLocaleString()} characters
            </dd>
            <dt className="text-[#6B7280]">Decoded length</dt>
            <dd className="text-right font-mono text-[#111827]">
              {encodedContent.decodedLength.toLocaleString()} bytes
            </dd>
            <dt className="text-[#6B7280]">Decoded content identifies as</dt>
            <dd className="text-right text-[#111827]">
              {encodedContent.decodedIdentification.detectedType}
              {encodedContent.decodedIdentification.confidence === 'confirmed'
                ? ' (confirmed)'
                : ' (probable)'}
            </dd>
          </dl>
          <div className="mt-3 flex gap-3">
            {onOpenDecodedContent && (
              <button
                type="button"
                onClick={onOpenDecodedContent}
                className="rounded-[8px] border border-[#16A34A] bg-white px-3 py-1.5 text-xs font-medium text-[#15803D] hover:bg-[#F0FDF4]"
              >
                Open decoded file as new analysis
              </button>
            )}
            {onExportDecodedContent && (
              <button
                type="button"
                onClick={onExportDecodedContent}
                className="rounded-[8px] border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-medium text-[#111827] hover:border-[#BBF7D0] hover:bg-[#F0FDF4]"
              >
                Export decoded file
              </button>
            )}
          </div>
        </div>
      )}

      <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
            File Identification
          </p>
          <ConfidenceBadge confidence={identification.confidence} />
        </div>

        <p className="mt-2 text-lg font-semibold text-[#111827]">
          {identification.detectedType}
        </p>

        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <dt className="text-[#6B7280]">MIME</dt>
          <dd className="text-right font-mono text-[#111827]">
            {identification.mime ?? '—'}
          </dd>

          <dt className="text-[#6B7280]">Extension (reported)</dt>
          <dd className="text-right font-mono text-[#111827]">
            {reportedExtension || '—'}
          </dd>

          <dt className="text-[#6B7280]">Extension (expected)</dt>
          <dd className="text-right font-mono text-[#111827]">
            {identification.expectedExtensions.length
              ? identification.expectedExtensions.join(', ')
              : '—'}
          </dd>

          {signature && (
            <>
              <dt className="text-[#6B7280]">Magic bytes</dt>
              <dd className="text-right font-mono text-[#111827]">
                {signature.magicHex}
              </dd>

              <dt className="text-[#6B7280]">Offset</dt>
              <dd className="text-right font-mono text-[#111827]">
                0x{signature.offset.toString(16).toUpperCase().padStart(8, '0')}
              </dd>

              <dt className="text-[#6B7280]">Detection</dt>
              <dd className="text-right text-[#111827]">{signature.reason}</dd>
            </>
          )}
        </dl>

        {extensionMismatch && (
          <div className="mt-3 rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
            Extension mismatch: filename suggests{' '}
            <span className="font-mono">{reportedExtension}</span>, but the
            detected signature indicates {identification.detectedType}.
          </div>
        )}
      </div>

      {candidates.length > 1 && (
        <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
            Other Signature Candidates
          </p>
          <ul className="mt-2 divide-y divide-[#E5E7EB]">
            {candidates
              .filter((c) => c !== signature)
              .map((c, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between gap-3 py-2 text-sm"
                >
                  <div>
                    <p className="text-[#111827]">{c.format}</p>
                    <p className="font-mono text-xs text-[#9CA3AF]">
                      {c.magicHex}
                    </p>
                  </div>
                  <ConfidenceBadge confidence={c.confidence} />
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default DetectionResults;
