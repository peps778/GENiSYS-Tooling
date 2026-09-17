import React, { useMemo, useState } from "react";
import { readHexRange, formatOffset, parseOffsetInput, searchAscii, searchHex } from "../lib/hexReader";
import { ToolSelector } from "./ToolSelector";

interface HexViewerProps {
  data: Uint8Array;
  onExportRange?: (start: number, end: number) => void;
  /** Set together to request jumping to a specific offset from outside (e.g. Recovery tab). */
  externalJumpOffset?: number | null;
  externalJumpNonce?: number;
}

const WINDOW_ROWS = 32;
const BYTES_PER_ROW_OPTIONS = ["8", "16", "32"] as const;

export function HexViewer({ data, onExportRange, externalJumpOffset, externalJumpNonce }: HexViewerProps) {
  const [bytesPerRow, setBytesPerRow] = useState<(typeof BYTES_PER_ROW_OPTIONS)[number]>("16");
  const rowWidth = Number(bytesPerRow);
  const windowSize = WINDOW_ROWS * rowWidth;

  const [windowStart, setWindowStart] = useState(0);
  const [offsetInput, setOffsetInput] = useState("");
  const [searchMode, setSearchMode] = useState<"ascii" | "hex">("ascii");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<number[] | null>(null);
  const [selectedByteRange, setSelectedByteRange] = useState<[number, number] | null>(null);

  const range = useMemo(
    () => readHexRange(data, windowStart, windowSize, rowWidth),
    [data, windowStart, windowSize, rowWidth]
  );

  const maxOffset = Math.max(0, data.length - 1);

  const jumpTo = (offset: number) => {
    const clamped = Math.max(0, Math.min(offset, maxOffset));
    // Align to a row boundary so the target offset appears at the top.
    setWindowStart(clamped - (clamped % rowWidth));
  };

  // External jump requests (e.g. "Open in Hex Viewer" from the Recovery tab)
  // arrive as an (offset, nonce) pair so the same offset can be re-requested
  // and still trigger a jump even if the viewer hasn't moved since.
  const lastJumpNonce = React.useRef<number | undefined>(undefined);
  React.useEffect(() => {
    if (
      externalJumpOffset === undefined ||
      externalJumpOffset === null ||
      externalJumpNonce === undefined ||
      externalJumpNonce === lastJumpNonce.current
    ) {
      return;
    }
    lastJumpNonce.current = externalJumpNonce;
    jumpTo(externalJumpOffset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalJumpOffset, externalJumpNonce]);

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseOffsetInput(offsetInput);
    if (parsed !== null) jumpTo(parsed);
  };

  const runSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    const results = searchMode === "ascii" ? searchAscii(data, searchQuery) : searchHex(data, searchQuery);
    setSearchResults(results);
    if (results.length > 0) jumpTo(results[0]);
  };

  const copyRowsAsHex = async () => {
    const text = range.rows.map((r) => r.hex.join(" ")).join("\n");
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* clipboard unavailable; no-op */
    }
  };

  const copyRowsAsAscii = async () => {
    const text = range.rows.map((r) => r.ascii).join("\n");
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* clipboard unavailable; no-op */
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 rounded-[12px] border border-[#E5E7EB] bg-white p-3 shadow-sm">
        <form onSubmit={handleJumpSubmit} className="flex items-center gap-2">
          <label className="text-xs text-[#6B7280]">Jump to offset</label>
          <input
            value={offsetInput}
            onChange={(e) => setOffsetInput(e.target.value)}
            placeholder="0x0000"
            className="w-28 rounded-[8px] border border-[#E5E7EB] px-2 py-1 text-sm font-mono text-[#111827] outline-none focus:border-[#16A34A]"
          />
          <button
            type="submit"
            className="rounded-[8px] border border-[#E5E7EB] px-2 py-1 text-xs font-medium text-[#111827] hover:border-[#BBF7D0] hover:bg-[#F0FDF4]"
          >
            Go
          </button>
        </form>

        <ToolSelector
          ariaLabel="Bytes per row"
          value={bytesPerRow}
          onChange={setBytesPerRow}
          options={BYTES_PER_ROW_OPTIONS.map((v) => ({ value: v, label: `${v}/row` }))}
        />

        <div className="ml-auto flex items-center gap-2">
          <button type="button" onClick={copyRowsAsHex} className="text-xs font-medium text-[#16A34A] hover:text-[#15803D]">
            Copy hex
          </button>
          <button type="button" onClick={copyRowsAsAscii} className="text-xs font-medium text-[#16A34A] hover:text-[#15803D]">
            Copy ASCII
          </button>
          {onExportRange && selectedByteRange && (
            <button
              type="button"
              onClick={() => onExportRange(selectedByteRange[0], selectedByteRange[1])}
              className="text-xs font-medium text-[#16A34A] hover:text-[#15803D]"
            >
              Export range
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-[12px] border border-[#E5E7EB] bg-white p-3 shadow-sm">
        <ToolSelector
          ariaLabel="Search mode"
          value={searchMode}
          onChange={setSearchMode}
          options={[
            { value: "ascii", label: "ASCII" },
            { value: "hex", label: "Hex" },
          ]}
        />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runSearch()}
          placeholder={searchMode === "ascii" ? "Search text..." : "Search bytes, e.g. FF D8 FF"}
          className="min-w-[180px] flex-1 rounded-[8px] border border-[#E5E7EB] px-3 py-1.5 text-sm font-mono text-[#111827] outline-none focus:border-[#16A34A]"
        />
        <button
          type="button"
          onClick={runSearch}
          className="rounded-[8px] border border-[#E5E7EB] px-3 py-1.5 text-xs font-medium text-[#111827] hover:border-[#BBF7D0] hover:bg-[#F0FDF4]"
        >
          Search
        </button>
        {searchResults && (
          <span className="text-xs text-[#6B7280]">
            {searchResults.length} match{searchResults.length === 1 ? "" : "es"}
          </span>
        )}
      </div>

      <div className="overflow-x-auto rounded-[12px] border border-[#E5E7EB] bg-white shadow-sm">
        <table className="w-full min-w-[560px] border-collapse font-mono text-xs">
          <thead>
            <tr className="border-b border-[#E5E7EB] text-left text-[#9CA3AF]">
              <th className="px-3 py-2 font-normal">Offset</th>
              <th className="px-3 py-2 font-normal">Hex</th>
              <th className="px-3 py-2 font-normal">ASCII</th>
            </tr>
          </thead>
          <tbody>
            {range.rows.map((row) => {
              const rowEnd = row.offset + row.hex.length;
              const isSelected = selectedByteRange?.[0] === row.offset && selectedByteRange?.[1] === rowEnd;
              return (
                <tr
                  key={row.offset}
                  onClick={() => setSelectedByteRange(isSelected ? null : [row.offset, rowEnd])}
                  className={[
                    "cursor-pointer border-b border-[#F9FAFB] hover:bg-[#F9FAFB]",
                    isSelected ? "bg-[#F0FDF4]" : "",
                  ].join(" ")}
                >
                  <td className="whitespace-nowrap px-3 py-1 text-[#9CA3AF]">{formatOffset(row.offset)}</td>
                  <td className="whitespace-nowrap px-3 py-1 text-[#111827]">{row.hex.join(" ")}</td>
                  <td className="whitespace-nowrap px-3 py-1 text-[#6B7280]">{row.ascii}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between rounded-[12px] border border-[#E5E7EB] bg-white px-4 py-2 text-xs text-[#6B7280] shadow-sm">
        <button
          type="button"
          disabled={windowStart === 0}
          onClick={() => jumpTo(windowStart - windowSize)}
          className="rounded-[6px] border border-[#E5E7EB] px-2 py-1 disabled:opacity-40"
        >
          Previous
        </button>
        <span className="font-mono">
          {formatOffset(range.startOffset)} – {formatOffset(range.endOffset)} of {formatOffset(data.length)}
        </span>
        <button
          type="button"
          disabled={range.endOffset >= data.length}
          onClick={() => jumpTo(windowStart + windowSize)}
          className="rounded-[6px] border border-[#E5E7EB] px-2 py-1 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default HexViewer;
