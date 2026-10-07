export type ToolCategoryId = 'static-analysis' | 'binary-analysis' | 'text-analysis';

export type ToolId =
  | 'file-analyzer'
  | 'hex-viewer'
  | 'strings'
  | 'entropy'
  | 'byte-frequency'
  | 'header-parser'
  | 'pattern-search';

export interface ToolDefinition {
  id: ToolId;
  category: ToolCategoryId;
  label: string;
  description: string;
}

export interface TransformResult {
  ok: boolean;
  output: string;
  error?: string;
  meta?: Record<string, string | number>;
}

export interface HistoryEntry {
  id: string;
  toolId: ToolId;
  toolLabel: string;
  inputSummary: string;
  outputSummary: string;
  timestamp: number;
}

export interface AnalysisTarget {
  name: string;
  bytes: Uint8Array;
}

export const TOOL_CATEGORIES: { id: ToolCategoryId; label: string }[] = [
  { id: 'static-analysis', label: 'Static Analysis' },
  { id: 'binary-analysis', label: 'Binary Analysis' },
  { id: 'text-analysis', label: 'Text Analysis' },
];

export const TOOL_REGISTRY: ToolDefinition[] = [
  {
    id: 'file-analyzer',
    category: 'static-analysis',
    label: 'File Analyzer',
    description: 'Inspect file type, size, magic bytes, and basic structural metadata.',
  },
  {
    id: 'header-parser',
    category: 'static-analysis',
    label: 'Executable Headers',
    description: 'Parse common PE, ELF, and Mach-O header fields without executing the file.',
  },
  {
    id: 'pattern-search',
    category: 'static-analysis',
    label: 'Pattern Search',
    description: 'Search raw bytes for hexadecimal signatures or ASCII/UTF-8 patterns.',
  },
  {
    id: 'hex-viewer',
    category: 'binary-analysis',
    label: 'Hex Viewer',
    description: 'Render binary data as offsets, hexadecimal bytes, and printable ASCII.',
  },
  {
    id: 'entropy',
    category: 'binary-analysis',
    label: 'Entropy',
    description: 'Calculate Shannon entropy to identify structured, compressed, or high-entropy regions.',
  },
  {
    id: 'byte-frequency',
    category: 'binary-analysis',
    label: 'Byte Frequency',
    description: 'Count byte values and expose distribution characteristics of a sample.',
  },
  {
    id: 'strings',
    category: 'text-analysis',
    label: 'Strings',
    description: 'Extract printable ASCII and UTF-16LE strings with offsets.',
  },
];

export const MAX_ANALYSIS_BYTES = 16 * 1024 * 1024;
export const MAX_HISTORY_SUMMARY_LENGTH = 64;

export function getToolsForCategory(category: ToolCategoryId): ToolDefinition[] {
  return TOOL_REGISTRY.filter((tool) => tool.category === category);
}

export function getToolById(id: ToolId): ToolDefinition | undefined {
  return TOOL_REGISTRY.find((tool) => tool.id === id);
}
