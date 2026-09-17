import React from 'react';
import type { FileMetadata, MetadataFieldStatus } from '../types/fileAnalysis';

interface MetadataPanelProps {
  metadata: FileMetadata;
}

const STATUS_LABELS: Record<MetadataFieldStatus, string> = {
  available: 'Available',
  unavailable: 'Unavailable',
  'not-applicable': 'Not applicable',
};

const STATUS_STYLES: Record<MetadataFieldStatus, string> = {
  available: 'text-[#15803D]',
  unavailable: 'text-[#9CA3AF]',
  'not-applicable': 'text-[#9CA3AF]',
};

export function MetadataPanel({ metadata }: MetadataPanelProps) {
  const isMono = (label: string) => /magic|hash|sha|bytes|hex/i.test(label);

  return (
    <div className="space-y-4">
      <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
          {metadata.category === 'generic'
            ? 'Generic Metadata'
            : `${capitalize(metadata.category)} Metadata`}
        </p>

        <table className="mt-3 w-full text-sm">
          <tbody className="divide-y divide-[#E5E7EB]">
            {metadata.fields.map((field, i) => (
              <tr key={i}>
                <td className="py-2 pr-3 text-[#6B7280]">{field.label}</td>
                <td
                  className={`py-2 text-right ${field.status !== 'available' ? STATUS_STYLES[field.status] : 'text-[#111827]'} ${isMono(field.label) ? 'font-mono' : ''}`}
                >
                  {field.status === 'available'
                    ? field.value
                    : STATUS_LABELS[field.status]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {metadata.limitations.length > 0 && (
        <div className="rounded-[12px] border border-[#E5E7EB] bg-[#F9FAFB] p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
            Limitations
          </p>
          <ul className="mt-2 space-y-1">
            {metadata.limitations.map((note, i) => (
              <li key={i} className="text-xs text-[#6B7280]">
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default MetadataPanel;
