import React, { useMemo, useState } from 'react';
import type { ExecutableAnalysis } from '../types/fileAnalysis';

interface Props {
  analysis: ExecutableAnalysis | null;
  onJump: (offset: number) => void;
}

export function DisassemblyPanel({ analysis, onJump }: Props) {
  const [pseudo, setPseudo] = useState(true);
  const [filter, setFilter] = useState('');
  const rows = useMemo(() => {
    if (!analysis) return [];
    const q = filter.trim().toLowerCase();
    return q
      ? analysis.instructions.filter((i) =>
          `${i.mnemonic} ${i.operands} ${i.pseudo}`.toLowerCase().includes(q),
        )
      : analysis.instructions;
  }, [analysis, filter]);

  if (!analysis || analysis.format === 'Unknown') {
    return (
      <div className="rounded-[12px] border border-dashed border-[#E5E7EB] bg-white p-8 text-center text-sm text-[#6B7280]">
        No supported native executable header was recognized. This tab activates
        automatically for ELF, PE, and recognized Mach-O files.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Info label="Format" value={analysis.format} />
        <Info label="Architecture" value={analysis.architecture} />
        <Info
          label="Entry point"
          value={
            analysis.entryPoint == null
              ? '—'
              : `0x${analysis.entryPoint.toString(16)}`
          }
        />
        <Info
          label="Mapped file offset"
          value={
            analysis.entryFileOffset == null
              ? '—'
              : `0x${analysis.entryFileOffset.toString(16)}`
          }
        />
      </div>

      <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
              Browser disassembly
            </p>
            <p className="mt-1 text-xs text-[#9CA3AF]">
              Decoded instructions are a lightweight CTF aid, not a complete
              replacement for Capstone/Ghidra/radare2.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="filter mnemonic / operand"
              className="w-52 rounded-[8px] border border-[#E5E7EB] px-2.5 py-1.5 text-xs outline-none focus:border-[#86EFAC]"
            />
            <button
              type="button"
              onClick={() => setPseudo((v) => !v)}
              className="rounded-[8px] border border-[#E5E7EB] px-2.5 py-1.5 text-xs font-medium text-[#374151]"
            >
              {pseudo ? 'Assembly' : 'Pseudo-C'}
            </button>
          </div>
        </div>

        <div className="mt-3 overflow-auto rounded-[10px] border border-[#E5E7EB]">
          <table className="min-w-full text-left font-mono text-xs">
            <thead className="bg-[#F9FAFB] text-[#6B7280]">
              <tr>
                <th className="px-3 py-2">Address</th>
                <th className="px-3 py-2">Bytes</th>
                <th className="px-3 py-2">Instruction</th>
                <th className="px-3 py-2">Meaning</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((i) => (
                <tr
                  key={`${i.offset}-${i.address}`}
                  className="border-t border-[#F3F4F6] hover:bg-[#F9FAFB]"
                >
                  <td className="px-3 py-1.5 text-[#15803D]">
                    <button type="button" onClick={() => onJump(i.offset)}>
                      0x{i.address.toString(16)}
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-3 py-1.5 text-[#9CA3AF]">
                    {i.bytes}
                  </td>
                  <td className="whitespace-nowrap px-3 py-1.5 text-[#111827]">
                    {i.mnemonic} {i.operands}
                  </td>
                  <td className="px-3 py-1.5 text-[#6B7280]">
                    {pseudo ? i.pseudo : i.confidence}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <InfoList
          title="Sections"
          values={analysis.sections.map(
            (s) =>
              `${s.name}  off=0x${s.offset.toString(16)} size=0x${s.size.toString(16)} ${s.flags}`,
          )}
        />
        <InfoList
          title="Interesting imports / symbols"
          values={[...analysis.imports, ...analysis.exports].slice(0, 100)}
        />
      </div>

      <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
          Parser notes
        </p>
        <ul className="mt-2 space-y-1 text-xs text-[#6B7280]">
          {analysis.notes.map((n, i) => (
            <li key={i}>• {n}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-3 shadow-sm">
      <p className="text-[10px] uppercase tracking-wide text-[#9CA3AF]">
        {label}
      </p>
      <p className="mt-1 truncate font-mono text-sm text-[#111827]">{value}</p>
    </div>
  );
}
function InfoList({ title, values }: { title: string; values: string[] }) {
  return (
    <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
        {title}
      </p>
      {values.length ? (
        <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap font-mono text-xs text-[#374151]">
          {values.join('\n')}
        </pre>
      ) : (
        <p className="mt-2 text-xs text-[#9CA3AF]">None detected.</p>
      )}
    </div>
  );
}
export default DisassemblyPanel;
