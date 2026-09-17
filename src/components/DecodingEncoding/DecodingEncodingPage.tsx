import React, { useEffect, useMemo, useState } from "react";
import ToolCategoryNav from "./components/ToolCategoryNav";
import ToolSelector from "./components/ToolSelector";
import InputEditor from "./components/InputEditor";
import OutputViewer from "./components/OutputViewer";
import ConversionTable from "./components/ConversionTable";
import FileDropzone from "./components/FileDropzone";
import HashResults from "./components/HashResults";
import FileSignatureResults, { type FileSignatureViewModel } from "./components/FileSignatureResults";
import OperationHistory from "./components/OperationHistory";
import SmartDetectPanel from "./components/SmartDetectPanel";
import { useDebouncedValue } from "./utils/useDebouncedValue";

import {
  TOOL_CATEGORIES,
  getToolById,
  getToolsForCategory,
  MAX_HISTORY_SUMMARY_LENGTH,
  type ToolCategoryId,
  type ToolId,
  type HistoryEntry,
} from "./types/decoding";

import { base64Decode, base64Encode } from "./tools/base64";
import { base32Decode, base32Encode } from "./tools/base32";
import { base16Decode, base16Encode } from "./tools/base16";
import { urlDecode, urlEncode } from "./tools/url";
import { asciiToHex, hexToAscii } from "./tools/hexAscii";
import { binaryToText, textToBinary } from "./tools/binary";
import { characterToDecimal, decimalToCharacter } from "./tools/decimalCharacter";
import { caesarShift, modeForPreset, ROT_PRESETS, type CaesarMode } from "./tools/caesar";
import { xorTransform, type XorKeyFormat, type XorOutputFormat } from "./tools/xor";
import { CIPHER_HELPERS, runCipherHelper } from "./tools/cipherHelpers";
import { identifyHash, type HashIdentificationResult } from "./tools/hashIdentifier";
import { bytesToHexPreview, matchFileSignature } from "./tools/fileSignatures";
import { detectFormats, type FormatCandidate } from "./tools/formatDetector";

type EncodeDecodeMode = "encode" | "decode";
type Direction = "forward" | "reverse";

/** One representative sample per tool, used by the "Try Example" shortcut. */
const EXAMPLE_INPUTS: Partial<Record<ToolId, string>> = {
  base64: "aGVsbG8gd29ybGQ=",
  base32: "NBSWY3DP",
  base16: "48656C6C6F",
  url: "a%20b%26c%3Dd",
  "hex-ascii": "48656c6c6f",
  binary: "01001000 01101001",
  "decimal-character": "65 66 67",
  caesar: "Uryyb jbeyq",
  xor: "Hi",
  "cipher-helpers": "HELLO",
  "hash-identifier": "5d41402abc4b2a76b9719d911017c59",
  "file-signature": "89 50 4E 47 0D 0A 1A 0A",
};

function summarize(value: string): string {
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (trimmed.length <= MAX_HISTORY_SUMMARY_LENGTH) return trimmed;
  return `${trimmed.slice(0, MAX_HISTORY_SUMMARY_LENGTH)}…`;
}

export default function DecodingEncodingPage() {
  const [activeCategory, setActiveCategory] = useState<ToolCategoryId>(TOOL_CATEGORIES[0].id);
  const [activeTool, setActiveTool] = useState<ToolId>(getToolsForCategory(TOOL_CATEGORIES[0].id)[0].id);

  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<Record<string, string | number>>({});

  const [mode, setMode] = useState<EncodeDecodeMode>("decode");
  const [direction, setDirection] = useState<Direction>("forward");

  const [rotPreset, setRotPreset] = useState(ROT_PRESETS[0].id);
  const [customShift, setCustomShift] = useState<string>("13");
  const [caesarDirection, setCaesarDirection] = useState<EncodeDecodeMode>("encode");

  const [xorKey, setXorKey] = useState("");
  const [xorKeyFormat, setXorKeyFormat] = useState<XorKeyFormat>("ascii");
  const [xorOutputFormat, setXorOutputFormat] = useState<XorOutputFormat>("hex");

  const [helperId, setHelperId] = useState(CIPHER_HELPERS[0].id);

  const [hashResult, setHashResult] = useState<HashIdentificationResult | null>(null);
  const [fileSignatureResult, setFileSignatureResult] = useState<FileSignatureViewModel | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileHexInput, setFileHexInput] = useState("");

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [autoRun, setAutoRun] = useState(true);

  const tool = getToolById(activeTool);

  // Live, debounced format suggestions for whatever is currently in the
  // active tool's input box — lets the workspace nudge the user toward a
  // better-fitting tool without requiring the separate Auto-Detect panel.
  const debouncedInput = useDebouncedValue(input, 350);
  const inlineSuggestions = useMemo(() => {
    if (tool?.id === "file-signature" || tool?.id === "hash-identifier") return [];
    if (debouncedInput.trim().length < 4) return [];
    return detectFormats(debouncedInput).filter((c) => c.toolId !== activeTool);
  }, [debouncedInput, activeTool, tool?.id]);

  function pushHistory(toolLabel: string, inputSummary: string, outputSummary: string) {
    setHistory((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        toolId: activeTool,
        toolLabel,
        inputSummary: summarize(inputSummary),
        outputSummary: summarize(outputSummary),
        timestamp: Date.now(),
      },
      ...prev,
    ].slice(0, 50));
  }

  function resetWorkspace() {
    setInput("");
    setOutput("");
    setError(null);
    setMeta({});
    setHashResult(null);
    setFileSignatureResult(null);
    setFileName(null);
    setFileHexInput("");
  }

  function handleCategorySelect(category: ToolCategoryId) {
    setActiveCategory(category);
    const firstTool = getToolsForCategory(category)[0];
    setActiveTool(firstTool.id);
    resetWorkspace();
  }

  function handleToolSelect(id: ToolId) {
    setActiveTool(id);
    resetWorkspace();
  }

  function applyResult(result: { ok: boolean; output: string; error?: string; meta?: Record<string, string | number> }, toolLabel: string, inputForSummary: string) {
    if (result.ok) {
      setOutput(result.output);
      setError(null);
      setMeta(result.meta ?? {});
      pushHistory(toolLabel, inputForSummary, result.output);
    } else {
      setOutput("");
      setError(result.error ?? "Unknown error.");
      setMeta({});
    }
  }

  function handleExecute() {
    if (!tool) return;

    switch (tool.id) {
      case "base64": {
        const result = mode === "encode" ? base64Encode(input) : base64Decode(input);
        applyResult(result, tool.label, input);
        return;
      }
      case "base32": {
        const result = mode === "encode" ? base32Encode(input) : base32Decode(input);
        applyResult(result, tool.label, input);
        return;
      }
      case "base16": {
        const result = mode === "encode" ? base16Encode(input) : base16Decode(input);
        applyResult(result, tool.label, input);
        return;
      }
      case "url": {
        const result = mode === "encode" ? urlEncode(input) : urlDecode(input);
        applyResult(result, tool.label, input);
        return;
      }
      case "hex-ascii": {
        const result = direction === "forward" ? hexToAscii(input) : asciiToHex(input);
        applyResult(result, tool.label, input);
        return;
      }
      case "binary": {
        const result = direction === "forward" ? binaryToText(input) : textToBinary(input);
        applyResult(result, tool.label, input);
        return;
      }
      case "decimal-character": {
        const result = direction === "forward" ? decimalToCharacter(input) : characterToDecimal(input);
        applyResult(result, tool.label, input);
        return;
      }
      case "caesar": {
        const shiftValue = Number(customShift);
        if (customShift.trim() === "" || Number.isNaN(shiftValue)) {
          setError("Invalid Caesar shift: must be a whole number.");
          setOutput("");
          return;
        }
        const mode2: CaesarMode = modeForPreset(rotPreset);
        const effectiveShift = caesarDirection === "encode" ? shiftValue : -shiftValue;
        const result = caesarShift(input, effectiveShift, mode2);
        applyResult(result, tool.label, input);
        return;
      }
      case "xor": {
        const result = xorTransform(input, xorKey, xorKeyFormat, xorOutputFormat);
        applyResult(result, tool.label, input);
        return;
      }
      case "cipher-helpers": {
        const result = runCipherHelper(helperId, input);
        applyResult(result, tool.label, input);
        return;
      }
      case "hash-identifier": {
        const result = identifyHash(input);
        if (result.ok) {
          const parsed = JSON.parse(result.output) as HashIdentificationResult;
          setHashResult(parsed);
          setError(null);
          pushHistory(tool.label, input, `${parsed.candidates.length} candidate(s)`);
        } else {
          setHashResult(null);
          setError(result.error ?? "Unable to identify hash.");
        }
        return;
      }
      case "file-signature": {
        if (fileHexInput.trim().length === 0) {
          setError("Provide a file or a hexadecimal signature to analyze.");
          return;
        }
        const cleaned = fileHexInput.trim().replace(/\s+/g, "");
        if (!/^[0-9a-fA-F]+$/.test(cleaned) || cleaned.length % 2 !== 0) {
          setError("Invalid hexadecimal signature input.");
          return;
        }
        const bytes = new Uint8Array(cleaned.length / 2);
        for (let i = 0; i < cleaned.length; i += 2) bytes[i / 2] = parseInt(cleaned.slice(i, i + 2), 16);
        const match = matchFileSignature(bytes);
        const view: FileSignatureViewModel = {
          fileName: fileName ?? "(manual hex input)",
          fileSize: bytes.length,
          detectedType: match ? match.definition.name : "Unknown / unrecognized signature",
          mime: match ? match.definition.mime : "application/octet-stream",
          extension: match ? match.definition.extension : "—",
          magicBytes: match
            ? match.definition.signature.map((b) => b.toString(16).padStart(2, "0")).join(" ").toUpperCase()
            : "No known signature matched",
          offset: match ? match.definition.offset : 0,
          hexPreview: bytesToHexPreview(bytes),
        };
        setFileSignatureResult(view);
        setError(null);
        pushHistory(tool.label, view.fileName, view.detectedType);
        return;
      }
    }
  }

  async function handleFileSelected(file: File) {
    setFileName(file.name);
    setError(null);
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const match = matchFileSignature(bytes);
      const view: FileSignatureViewModel = {
        fileName: file.name,
        fileSize: file.size,
        detectedType: match ? match.definition.name : "Unknown / unrecognized signature",
        mime: match ? match.definition.mime : file.type || "application/octet-stream",
        extension: match ? match.definition.extension : "—",
        magicBytes: match
          ? match.definition.signature.map((b) => b.toString(16).padStart(2, "0")).join(" ").toUpperCase()
          : "No known signature matched",
        offset: match ? match.definition.offset : 0,
        hexPreview: bytesToHexPreview(bytes),
      };
      setFileSignatureResult(view);
      pushHistory("File Signature", file.name, view.detectedType);
    } catch {
      setError("File read error: unable to read the selected file.");
    }
  }

  function handleUseCandidate(candidate: FormatCandidate, sourceInput: string) {
    const targetTool = getToolById(candidate.toolId);
    if (!targetTool) return;
    setActiveCategory(targetTool.category);
    setActiveTool(candidate.toolId);
    setError(null);
    setOutput("");
    setMeta({});
    setHashResult(null);
    setFileSignatureResult(null);
    setFileName(null);

    if (candidate.suggestedMode) setMode(candidate.suggestedMode);
    if (candidate.suggestedDirection) setDirection(candidate.suggestedDirection);
    if (candidate.suggestedShift !== undefined) {
      setRotPreset("custom");
      setCustomShift(String(candidate.suggestedShift));
      setCaesarDirection("decode");
    }

    if (candidate.toolId === "file-signature") {
      setFileHexInput(sourceInput.trim());
      setInput("");
    } else {
      setInput(sourceInput);
      setFileHexInput("");
    }
  }

  function applyExample() {
    if (!tool) return;
    const example = EXAMPLE_INPUTS[tool.id];
    if (example === undefined) return;
    resetWorkspace();
    if (tool.id === "file-signature") {
      setFileHexInput(example);
    } else {
      setInput(example);
    }
    if (tool.id === "caesar") {
      setRotPreset("rot13");
      setCustomShift("13");
      setCaesarDirection("decode");
    }
    if (tool.id === "xor") {
      setXorKey("K");
      setXorKeyFormat("ascii");
      setXorOutputFormat("hex");
    }
  }

  // Auto-run: re-executes the current tool shortly after any relevant input
  // or control changes, so most tools no longer require an explicit click.
  const autoRunKey = [
    activeTool,
    input,
    mode,
    direction,
    rotPreset,
    customShift,
    caesarDirection,
    xorKey,
    xorKeyFormat,
    xorOutputFormat,
    helperId,
    fileHexInput,
  ].join("␟");
  const debouncedAutoRunKey = useDebouncedValue(autoRunKey, 400);

  useEffect(() => {
    if (!autoRun || !tool) return;
    if (!debouncedAutoRunKey.startsWith(`${activeTool}␟`)) return; // stale, mid-switch
    const relevantInput = tool.id === "file-signature" ? fileHexInput : input;
    if (relevantInput.trim().length === 0) return;
    if (tool.id === "xor" && xorKey.trim().length === 0) return;
    handleExecute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedAutoRunKey, autoRun]);

  const metaRows = useMemo(
    () =>
      Object.entries(meta).map(([label, value]) => ({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        value: String(value),
      })),
    [meta]
  );

  if (!tool) return null;

  return (
    <div className="flex flex-col gap-6 bg-[#F9FAFB] px-6 py-8">
      {/* Page header */}
      <header className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#16A34A]">
          Data Transformation
        </span>
        <h1 className="text-2xl font-semibold text-[#111827]">Decoding / Encoding</h1>
        <p className="max-w-3xl text-sm text-[#6B7280]">
          Transform, decode, identify, and inspect encoded data, text representations, ciphers, hashes, and file
          signatures.
        </p>
      </header>

      {/* Auto-detect entry point */}
      <SmartDetectPanel onUseCandidate={handleUseCandidate} />

      {/* Category + tool navigation */}
      <div className="flex flex-col gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <ToolCategoryNav activeCategory={activeCategory} onSelect={handleCategorySelect} />
        <ToolSelector category={activeCategory} activeTool={activeTool} onSelect={handleToolSelect} />
      </div>

      {/* Workspace */}
      <div className="flex flex-col gap-5 rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-[#111827]">{tool.label}</h2>
            <p className="text-sm text-[#6B7280]">{tool.description}</p>
          </div>
          <div className="flex items-center gap-3">
            {EXAMPLE_INPUTS[tool.id] !== undefined && (
              <button
                type="button"
                onClick={applyExample}
                className="rounded-[10px] border border-[#E5E7EB] px-2.5 py-1.5 text-xs font-medium text-[#374151] hover:border-[#16A34A] hover:text-[#15803D] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]"
              >
                Try Example
              </button>
            )}
            <label className="flex items-center gap-2 text-xs font-medium text-[#6B7280]">
              <input
                type="checkbox"
                checked={autoRun}
                onChange={(e) => setAutoRun(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-[#E5E7EB] text-[#16A34A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]"
              />
              Auto-run
            </label>
          </div>
        </div>

        {inlineSuggestions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-[10px] border border-[#BBF7D0] bg-[#F0FDF4] px-3.5 py-2.5">
            <span className="text-xs font-medium text-[#15803D]">This also looks like:</span>
            {inlineSuggestions.slice(0, 3).map((candidate, idx) => (
              <button
                key={`${candidate.toolId}-${idx}`}
                type="button"
                onClick={() => handleUseCandidate(candidate, input)}
                className="rounded-full border border-[#BBF7D0] bg-white px-2.5 py-1 text-xs font-medium text-[#15803D] hover:bg-[#F0FDF4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]"
              >
                {candidate.toolLabel} · {Math.round(candidate.confidence * 100)}%
              </button>
            ))}
          </div>
        )}

        {/* Tool-specific controls */}
        <div className="flex flex-wrap items-end gap-4">
          {(tool.id === "base64" || tool.id === "base32" || tool.id === "base16" || tool.id === "url") && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="mode-select" className="text-sm font-medium text-[#111827]">
                Mode
              </label>
              <select
                id="mode-select"
                value={mode}
                onChange={(e) => setMode(e.target.value as EncodeDecodeMode)}
                className="rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111827] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]"
              >
                <option value="decode">Decode</option>
                <option value="encode">Encode</option>
              </select>
            </div>
          )}

          {tool.id === "hex-ascii" && (
            <div className="flex gap-2" role="radiogroup" aria-label="Conversion direction">
              <button
                type="button"
                onClick={() => setDirection("forward")}
                aria-pressed={direction === "forward"}
                className={`rounded-[10px] border px-3 py-1.5 text-sm font-medium ${direction === "forward" ? "border-[#16A34A] bg-[#F0FDF4] text-[#15803D]" : "border-[#E5E7EB] text-[#6B7280]"}`}
              >
                Hex → ASCII
              </button>
              <button
                type="button"
                onClick={() => setDirection("reverse")}
                aria-pressed={direction === "reverse"}
                className={`rounded-[10px] border px-3 py-1.5 text-sm font-medium ${direction === "reverse" ? "border-[#16A34A] bg-[#F0FDF4] text-[#15803D]" : "border-[#E5E7EB] text-[#6B7280]"}`}
              >
                ASCII → Hex
              </button>
            </div>
          )}

          {tool.id === "binary" && (
            <div className="flex gap-2" role="radiogroup" aria-label="Conversion direction">
              <button
                type="button"
                onClick={() => setDirection("forward")}
                aria-pressed={direction === "forward"}
                className={`rounded-[10px] border px-3 py-1.5 text-sm font-medium ${direction === "forward" ? "border-[#16A34A] bg-[#F0FDF4] text-[#15803D]" : "border-[#E5E7EB] text-[#6B7280]"}`}
              >
                Binary → Text
              </button>
              <button
                type="button"
                onClick={() => setDirection("reverse")}
                aria-pressed={direction === "reverse"}
                className={`rounded-[10px] border px-3 py-1.5 text-sm font-medium ${direction === "reverse" ? "border-[#16A34A] bg-[#F0FDF4] text-[#15803D]" : "border-[#E5E7EB] text-[#6B7280]"}`}
              >
                Text → Binary
              </button>
            </div>
          )}

          {tool.id === "decimal-character" && (
            <div className="flex gap-2" role="radiogroup" aria-label="Conversion direction">
              <button
                type="button"
                onClick={() => setDirection("forward")}
                aria-pressed={direction === "forward"}
                className={`rounded-[10px] border px-3 py-1.5 text-sm font-medium ${direction === "forward" ? "border-[#16A34A] bg-[#F0FDF4] text-[#15803D]" : "border-[#E5E7EB] text-[#6B7280]"}`}
              >
                Decimal → Character
              </button>
              <button
                type="button"
                onClick={() => setDirection("reverse")}
                aria-pressed={direction === "reverse"}
                className={`rounded-[10px] border px-3 py-1.5 text-sm font-medium ${direction === "reverse" ? "border-[#16A34A] bg-[#F0FDF4] text-[#15803D]" : "border-[#E5E7EB] text-[#6B7280]"}`}
              >
                Character → Decimal
              </button>
            </div>
          )}

          {tool.id === "caesar" && (
            <>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="rot-preset" className="text-sm font-medium text-[#111827]">
                  Preset
                </label>
                <select
                  id="rot-preset"
                  value={rotPreset}
                  onChange={(e) => {
                    setRotPreset(e.target.value);
                    const preset = ROT_PRESETS.find((p) => p.id === e.target.value);
                    if (preset) setCustomShift(String(preset.shift));
                  }}
                  className="rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111827] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]"
                >
                  {ROT_PRESETS.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.label}
                    </option>
                  ))}
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="shift-value" className="text-sm font-medium text-[#111827]">
                  Shift
                </label>
                <input
                  id="shift-value"
                  type="number"
                  value={customShift}
                  onChange={(e) => {
                    setCustomShift(e.target.value);
                    setRotPreset("custom");
                  }}
                  className="w-24 rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111827] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="caesar-direction" className="text-sm font-medium text-[#111827]">
                  Direction
                </label>
                <select
                  id="caesar-direction"
                  value={caesarDirection}
                  onChange={(e) => setCaesarDirection(e.target.value as EncodeDecodeMode)}
                  className="rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111827] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]"
                >
                  <option value="encode">Shift forward</option>
                  <option value="decode">Shift back</option>
                </select>
              </div>
            </>
          )}

          {tool.id === "xor" && (
            <>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="xor-key" className="text-sm font-medium text-[#111827]">
                  Key
                </label>
                <input
                  id="xor-key"
                  type="text"
                  value={xorKey}
                  onChange={(e) => setXorKey(e.target.value)}
                  placeholder="Repeating key"
                  className="w-48 rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-2 font-mono text-sm text-[#111827] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="xor-key-format" className="text-sm font-medium text-[#111827]">
                  Key Format
                </label>
                <select
                  id="xor-key-format"
                  value={xorKeyFormat}
                  onChange={(e) => setXorKeyFormat(e.target.value as XorKeyFormat)}
                  className="rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111827] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]"
                >
                  <option value="ascii">ASCII</option>
                  <option value="hex">Hex</option>
                  <option value="binary">Binary</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="xor-output-format" className="text-sm font-medium text-[#111827]">
                  Output Format
                </label>
                <select
                  id="xor-output-format"
                  value={xorOutputFormat}
                  onChange={(e) => setXorOutputFormat(e.target.value as XorOutputFormat)}
                  className="rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111827] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]"
                >
                  <option value="text">Text</option>
                  <option value="hex">Hex</option>
                  <option value="binary">Binary</option>
                </select>
              </div>
            </>
          )}

          {tool.id === "cipher-helpers" && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="helper-select" className="text-sm font-medium text-[#111827]">
                Transformation
              </label>
              <select
                id="helper-select"
                value={helperId}
                onChange={(e) => setHelperId(e.target.value)}
                className="rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111827] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]"
              >
                {CIPHER_HELPERS.map((helper) => (
                  <option key={helper.id} value={helper.id}>
                    {helper.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-[#6B7280]">
                {CIPHER_HELPERS.find((h) => h.id === helperId)?.description}
              </p>
            </div>
          )}
        </div>

        {/* Input / execute / output for text-based tools */}
        {tool.id !== "file-signature" && tool.id !== "hash-identifier" && (
          <>
            <InputEditor
              id="tool-input"
              label="Input"
              value={input}
              onChange={setInput}
              placeholder="Paste or type data to transform…"
            />

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExecute}
                className="rounded-[10px] bg-[#16A34A] px-4 py-2 text-sm font-medium text-white hover:bg-[#15803D] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2"
              >
                {autoRun
                  ? "Run Now"
                  : tool.id === "caesar"
                  ? "Apply Shift"
                  : tool.id === "xor"
                  ? "Apply XOR"
                  : mode === "encode"
                  ? "Encode"
                  : "Decode"}
              </button>
              <button
                type="button"
                onClick={resetWorkspace}
                className="rounded-[10px] border border-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#374151] hover:border-[#16A34A] hover:text-[#15803D] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]"
              >
                Clear
              </button>
              {autoRun && (
                <span className="text-xs text-[#6B7280]">Auto-run is on — results update as you type.</span>
              )}
            </div>

            <OutputViewer id="tool-output" label="Output" value={output} error={error} downloadFileName="output.txt" />
            {metaRows.length > 0 && <ConversionTable rows={metaRows} />}
          </>
        )}

        {tool.id === "hash-identifier" && (
          <>
            <InputEditor
              id="hash-input"
              label="Hash Input"
              value={input}
              onChange={setInput}
              placeholder="Paste a hash value to identify…"
              rows={3}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleExecute}
                className="rounded-[10px] bg-[#16A34A] px-4 py-2 text-sm font-medium text-white hover:bg-[#15803D] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2"
              >
                Identify
              </button>
              <button
                type="button"
                onClick={resetWorkspace}
                className="rounded-[10px] border border-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#374151] hover:border-[#16A34A] hover:text-[#15803D] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]"
              >
                Clear
              </button>
            </div>
            {error && (
              <p role="alert" className="rounded-[10px] border border-[#FCA5A5] bg-[#FEF2F2] px-3 py-2 text-sm text-[#B91C1C]">
                {error}
              </p>
            )}
            {hashResult && <HashResults result={hashResult} />}
          </>
        )}

        {tool.id === "file-signature" && (
          <>
            <FileDropzone onFileSelected={handleFileSelected} fileName={fileName} />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="file-hex-input" className="text-sm font-medium text-[#111827]">
                Or enter a hexadecimal signature
              </label>
              <input
                id="file-hex-input"
                type="text"
                value={fileHexInput}
                onChange={(e) => setFileHexInput(e.target.value)}
                placeholder="e.g. 89 50 4E 47 0D 0A 1A 0A"
                className="rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-2 font-mono text-sm text-[#111827] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleExecute}
                className="rounded-[10px] bg-[#16A34A] px-4 py-2 text-sm font-medium text-white hover:bg-[#15803D] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2"
              >
                Analyze Signature
              </button>
              <button
                type="button"
                onClick={resetWorkspace}
                className="rounded-[10px] border border-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#374151] hover:border-[#16A34A] hover:text-[#15803D] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]"
              >
                Clear
              </button>
            </div>
            {error && (
              <p role="alert" className="rounded-[10px] border border-[#FCA5A5] bg-[#FEF2F2] px-3 py-2 text-sm text-[#B91C1C]">
                {error}
              </p>
            )}
            {fileSignatureResult && <FileSignatureResults data={fileSignatureResult} />}
          </>
        )}
      </div>

      <OperationHistory entries={history} onClear={() => setHistory([])} />
    </div>
  );
}
