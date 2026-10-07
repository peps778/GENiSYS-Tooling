import React, { useEffect, useMemo, useState } from 'react';
import ToolCategoryNav from './components/ToolCategoryNav';
import ToolSelector from './components/ToolSelector';
import InputEditor from './components/InputEditor';
import OutputViewer from './components/OutputViewer';
import FileDropzone from './components/FileDropzone';
import OperationHistory from './components/OperationHistory';
import AnalysisSummary from './components/AnalysisSummary';
import PatternInput from './components/PatternInput';
import { useDebouncedValue } from './utils/useDebouncedValue';
import { TOOL_CATEGORIES, getToolById, getToolsForCategory, MAX_HISTORY_SUMMARY_LENGTH, type HistoryEntry, type ToolCategoryId, type ToolId } from './types/reverseEngineering';
import { analyzeFile, identifySignature } from './tools/fileAnalyzer';
import { hexToBytes } from './tools/bytes';
import { hexView } from './tools/hexViewer';
import { stringsTool } from './tools/strings';
import { entropyTool } from './tools/entropy';
import { byteFrequency } from './tools/byteFrequency';
import { parseHeaders } from './tools/headers';
import { searchHexPattern } from './tools/patternSearch';

const EXAMPLES: Partial<Record<ToolId, string>> = {
  'file-analyzer': '89 50 4E 47 0D 0A 1A 0A',
  'hex-viewer': '48 65 6C 6C 6F 20 52 45',
  strings: '4D 5A 00 00 48 65 6C 6C 6F 20 57 6F 72 6C 64 00 54 65 73 74',
  entropy: '00 00 00 00 11 11 11 11 22 22 22 22 33 33 33 33',
  'byte-frequency': '00 00 01 01 01 02 03 03 04 05',
  'header-parser': '7F 45 4C 46 02 01 01 00 00 00 00 00 00 00 00 00 02 00 3E 00',
  'pattern-search': '48 65 6C 6C 6F 20 48 65 6C 6C 6F',
};

function summarize(value: string): string {
  const trimmed = value.replace(/\s+/g, ' ').trim();
  return trimmed.length <= MAX_HISTORY_SUMMARY_LENGTH ? trimmed : `${trimmed.slice(0, MAX_HISTORY_SUMMARY_LENGTH)}…`;
}

export default function ReverseEngineeringPage() {
  const [activeCategory, setActiveCategory] = useState<ToolCategoryId>(TOOL_CATEGORIES[0].id);
  const [activeTool, setActiveTool] = useState<ToolId>(getToolsForCategory(TOOL_CATEGORIES[0].id)[0].id);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [bytes, setBytes] = useState<Uint8Array>(new Uint8Array());
  const [pattern, setPattern] = useState('');
  const [minStringLength, setMinStringLength] = useState('4');
  const [autoRun, setAutoRun] = useState(true);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const tool = getToolById(activeTool);
  const debouncedInput = useDebouncedValue(input, 300);

  function pushHistory(label: string, source: string, result: string) {
    setHistory((prev) => [{ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, toolId: activeTool, toolLabel: label, inputSummary: summarize(source), outputSummary: summarize(result), timestamp: Date.now() }, ...prev].slice(0, 50));
  }

  function resetWorkspace() {
    setInput(''); setOutput(''); setError(null); setBytes(new Uint8Array()); setFileName(null); setPattern('');
  }

  function selectCategory(category: ToolCategoryId) {
    setActiveCategory(category);
    setActiveTool(getToolsForCategory(category)[0].id);
    resetWorkspace();
  }

  function selectTool(id: ToolId) {
    setActiveTool(id);
    setOutput(''); setError(null);
  }

  function loadHexTarget(value: string, name = 'manual-bytes') {
    const parsed = hexToBytes(value);
    if (!parsed.ok || !parsed.bytes) { setError(parsed.error ?? 'Invalid bytes.'); return false; }
    setBytes(parsed.bytes); setFileName(name); setError(null); return true;
  }

  async function handleFileSelected(file: File) {
    if (file.size > 16 * 1024 * 1024) { setError('For browser safety, this module limits analysis to 16 MiB per file.'); return; }
    try {
      const data = new Uint8Array(await file.arrayBuffer());
      setBytes(data); setFileName(file.name); setInput(''); setError(null);
      const signature = identifySignature(data);
      setOutput(`Loaded ${file.name} (${file.size.toLocaleString()} bytes)${signature ? ` — ${signature.name}` : ''}`);
      pushHistory('File Analysis', file.name, signature?.name ?? 'Unknown');
    } catch { setError('File read error: unable to read the selected file.'); }
  }

  function execute() {
    if (!tool) return;
    let result;
    if (activeTool === 'file-analyzer') result = analyzeFile(fileName ?? 'manual-bytes', bytes);
    else if (activeTool === 'hex-viewer') result = hexView(input);
    else if (activeTool === 'strings') result = stringsTool(bytes, Number(minStringLength));
    else if (activeTool === 'entropy') result = entropyTool(bytes);
    else if (activeTool === 'byte-frequency') result = byteFrequency(bytes);
    else if (activeTool === 'header-parser') result = parseHeaders(bytes);
    else result = searchHexPattern(input, pattern);

    if (result.ok) { setOutput(result.output); setError(null); pushHistory(tool.label, activeTool === 'pattern-search' ? `${input} / ${pattern}` : fileName ?? input, result.output); }
    else { setOutput(''); setError(result.error ?? 'Analysis failed.'); }
  }

  function applyExample() {
    const example = EXAMPLES[activeTool];
    if (!example) return;
    setError(null); setOutput('');
    if (activeTool === 'hex-viewer') { setInput(example); return; }
    if (activeTool === 'pattern-search') { setInput(example); setPattern('48 65 6C 6C 6F'); return; }
    loadHexTarget(example, 'example-bytes');
  }

  const autoKey = useMemo(() => [activeTool, input, pattern, minStringLength, bytes.length, autoRun].join('␟'), [activeTool, input, pattern, minStringLength, bytes.length, autoRun]);
  const debouncedKey = useDebouncedValue(autoKey, 450);

  useEffect(() => {
    if (!autoRun || !debouncedKey) return;
    if (activeTool === 'hex-viewer' || activeTool === 'pattern-search') {
      if (!input.trim()) return;
    } else if (!bytes.length) return;
    execute();
    // Keep auto-run centralized so the tool functions stay pure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedKey, autoRun]);

  if (!tool) return null;

  return <div className="flex flex-col gap-6 bg-[#F9FAFB] px-6 py-8">
    <header className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wider text-[#16A34A]">Software Analysis</span>
      <h1 className="text-2xl font-semibold text-[#111827]">Reverse Engineering</h1>
      <p className="max-w-3xl text-sm text-[#6B7280]">Inspect binaries and files statically: identify formats, inspect bytes, extract strings, measure entropy, parse common executable headers, and search raw patterns.</p>
    </header>

    <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
      <FileDropzone onFileSelected={handleFileSelected} fileName={fileName} />
    </div>

    <div className="flex flex-col gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
      <ToolCategoryNav activeCategory={activeCategory} onSelect={selectCategory} />
      <ToolSelector category={activeCategory} activeTool={activeTool} onSelect={selectTool} />
    </div>

    <div className="flex flex-col gap-5 rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-lg font-semibold text-[#111827]">{tool.label}</h2><p className="text-sm text-[#6B7280]">{tool.description}</p></div>
        <div className="flex items-center gap-3">
          {EXAMPLES[activeTool] && <button type="button" onClick={applyExample} className="rounded-[10px] border border-[#E5E7EB] px-2.5 py-1.5 text-xs font-medium text-[#374151] hover:border-[#16A34A] hover:text-[#15803D]">Try Example</button>}
          <label className="flex items-center gap-2 text-xs font-medium text-[#6B7280]"><input type="checkbox" checked={autoRun} onChange={(e) => setAutoRun(e.target.checked)} className="h-3.5 w-3.5 rounded border-[#E5E7EB] text-[#16A34A]" />Auto-run</label>
        </div>
      </div>

      {bytes.length > 0 && <AnalysisSummary fileName={fileName} size={bytes.length} type={identifySignature(bytes)?.name ?? 'Unknown'} />}

      {activeTool === 'file-analyzer' && <div className="rounded-[10px] border border-[#BBF7D0] bg-[#F0FDF4] p-3 text-sm text-[#166534]">Load a file above or provide hexadecimal bytes through the Hex Viewer first.</div>}
      {activeTool === 'hex-viewer' && <InputEditor id="re-hex-input" label="Hex bytes" value={input} onChange={setInput} placeholder="48 65 6C 6C 6F" />}
      {activeTool === 'pattern-search' && <><InputEditor id="re-search-input" label="Hex data" value={input} onChange={setInput} placeholder="48 65 6C 6C 6F 20 48 69" /><PatternInput value={pattern} onChange={setPattern} /></>}
      {activeTool === 'strings' && <div className="flex items-end gap-3"><label className="flex flex-col gap-1.5 text-sm font-medium text-[#111827]">Minimum string length<input value={minStringLength} onChange={(e) => setMinStringLength(e.target.value)} inputMode="numeric" className="w-40 rounded-[10px] border border-[#E5E7EB] px-3 py-2.5 font-mono text-sm font-normal focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]" /></label><span className="pb-2.5 text-xs text-[#6B7280]">ASCII and UTF-16LE</span></div>}
      {activeTool !== 'hex-viewer' && activeTool !== 'pattern-search' && <div className="flex flex-col gap-2 rounded-[10px] border border-[#E5E7EB] bg-[#F9FAFB] p-3"><label htmlFor="re-target-hex" className="text-sm font-medium text-[#111827]">Manual hex target</label><div className="flex flex-col gap-2 sm:flex-row"><input id="re-target-hex" value={input} onChange={(e) => setInput(e.target.value)} placeholder="4D 5A 90 00 ..." spellCheck={false} className="min-w-0 flex-1 rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-2.5 font-mono text-sm text-[#111827] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]" /><button type="button" onClick={() => loadHexTarget(input)} className="rounded-[10px] border border-[#BBF7D0] bg-white px-3 py-2 text-sm font-medium text-[#15803D] hover:bg-[#F0FDF4]">Load bytes</button></div><p className="text-xs text-[#6B7280]">Paste raw bytes as hexadecimal when you do not want to upload a file.</p></div>}

      <OutputViewer id="re-output" label="Analysis output" value={output} error={error} rows={activeTool === 'hex-viewer' || activeTool === 'strings' ? 14 : 9} downloadFileName={`reverse-engineering-${activeTool}.txt`} />

      <button type="button" onClick={execute} className="self-start rounded-[10px] bg-[#16A34A] px-4 py-2 text-sm font-medium text-white hover:bg-[#15803D] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2">Analyze</button>
    </div>

    <OperationHistory entries={history} onClear={() => setHistory([])} />

    <section className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-[#111827]">Analysis principles</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <div className="rounded-[10px] bg-[#F9FAFB] p-3"><p className="text-xs font-semibold text-[#15803D]">Static first</p><p className="mt-1 text-xs leading-5 text-[#6B7280]">Files are inspected as bytes. Nothing is executed by this module.</p></div>
        <div className="rounded-[10px] bg-[#F9FAFB] p-3"><p className="text-xs font-semibold text-[#15803D]">Evidence over guesses</p><p className="mt-1 text-xs leading-5 text-[#6B7280]">Magic bytes and header fields are preferred over filenames and extensions.</p></div>
        <div className="rounded-[10px] bg-[#F9FAFB] p-3"><p className="text-xs font-semibold text-[#15803D]">Local analysis</p><p className="mt-1 text-xs leading-5 text-[#6B7280]">The browser processes the selected bytes locally; no upload is required.</p></div>
      </div>
    </section>
  </div>;
}
