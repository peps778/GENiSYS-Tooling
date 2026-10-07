/**
 * Central type definitions and tool registry for the Decoding / Encoding
 * workspace. The registry drives the UI (navigation, tool selector, workspace
 * headers) so tool names/metadata are defined exactly once.
 */

export type ToolCategoryId =
  'encode-decode' | 'text-numbers' | 'ciphers' | 'hashes' | 'files';

export type ToolId =
  | 'base64'
  | 'base32'
  | 'base16'
  | 'url'
  | 'hex-ascii'
  | 'binary'
  | 'decimal-character'
  | 'caesar'
  | 'xor'
  | 'cipher-helpers'
  | 'hash-identifier'
  | 'hash-calculator'
  | 'file-signature';

export type SupportedIOKind =
  | 'text'
  | 'hex'
  | 'binary'
  | 'base64'
  | 'base32'
  | 'base16'
  | 'decimal'
  | 'file'
  | 'hash';

export interface ToolCategory {
  id: ToolCategoryId;
  label: string;
  shortLabel: string;
}

export interface ToolDefinition {
  id: ToolId;
  category: ToolCategoryId;
  label: string;
  description: string;
  supportedInput: SupportedIOKind[];
  supportedOutput: SupportedIOKind[];
}

export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    id: 'encode-decode',
    label: 'Encode / Decode',
    shortLabel: 'Encode / Decode',
  },
  { id: 'text-numbers', label: 'Text & Numbers', shortLabel: 'Text & Numbers' },
  { id: 'ciphers', label: 'Ciphers', shortLabel: 'Ciphers' },
  { id: 'hashes', label: 'Hashes', shortLabel: 'Hashes' },
  { id: 'files', label: 'Files', shortLabel: 'Files' },
];

export const TOOL_REGISTRY: ToolDefinition[] = [
  {
    id: 'base64',
    category: 'encode-decode',
    label: 'Base64',
    description: 'Encode or decode Base64 data.',
    supportedInput: ['text', 'base64'],
    supportedOutput: ['text', 'base64'],
  },
  {
    id: 'base32',
    category: 'encode-decode',
    label: 'Base32',
    description: 'Encode or decode RFC 4648 Base32 data.',
    supportedInput: ['text', 'base32'],
    supportedOutput: ['text', 'base32'],
  },
  {
    id: 'base16',
    category: 'encode-decode',
    label: 'Base16',
    description: 'Encode or decode Base16 (hexadecimal) data.',
    supportedInput: ['text', 'base16'],
    supportedOutput: ['text', 'base16'],
  },
  {
    id: 'url',
    category: 'encode-decode',
    label: 'URL Encoding',
    description: 'Percent-encode or decode URL components.',
    supportedInput: ['text'],
    supportedOutput: ['text'],
  },
  {
    id: 'hex-ascii',
    category: 'text-numbers',
    label: 'Hex / ASCII',
    description: 'Convert between hexadecimal byte sequences and ASCII text.',
    supportedInput: ['text', 'hex'],
    supportedOutput: ['text', 'hex'],
  },
  {
    id: 'binary',
    category: 'text-numbers',
    label: 'Binary',
    description: 'Convert between binary byte sequences and text.',
    supportedInput: ['text', 'binary'],
    supportedOutput: ['text', 'binary'],
  },
  {
    id: 'decimal-character',
    category: 'text-numbers',
    label: 'Decimal / Character',
    description:
      'Convert between space-separated decimal code points and characters.',
    supportedInput: ['text', 'decimal'],
    supportedOutput: ['text', 'decimal'],
  },
  {
    id: 'caesar',
    category: 'ciphers',
    label: 'ROT / Caesar',
    description:
      'Shift alphabetic (and optionally numeric) characters by a configurable amount.',
    supportedInput: ['text'],
    supportedOutput: ['text'],
  },
  {
    id: 'xor',
    category: 'ciphers',
    label: 'XOR',
    description: 'Apply a repeating-key XOR transformation to the input.',
    supportedInput: ['text', 'hex', 'binary'],
    supportedOutput: ['text', 'hex', 'binary'],
  },
  {
    id: 'cipher-helpers',
    category: 'ciphers',
    label: 'Cipher Helpers',
    description:
      'Lightweight classical transformations: Atbash, reverse, and character swap utilities.',
    supportedInput: ['text'],
    supportedOutput: ['text'],
  },
  {
    id: 'hash-identifier',
    category: 'hashes',
    label: 'Hash Identifier',
    description:
      "Identify likely hash algorithms from a hash's length and character set.",
    supportedInput: ['hash'],
    supportedOutput: ['text'],
  },
  {
    id: 'hash-calculator',
    category: 'hashes',
    label: 'Hash Calculator',
    description:
      'Calculate common cryptographic hashes and checksums locally from text.',
    supportedInput: ['text'],
    supportedOutput: ['hash'],
  },
  {
    id: 'file-signature',
    category: 'files',
    label: 'File Signature',
    description:
      "Identify a file's type from its magic bytes rather than its extension.",
    supportedInput: ['file', 'hex'],
    supportedOutput: ['text'],
  },
];

export function getToolsForCategory(
  category: ToolCategoryId,
): ToolDefinition[] {
  return TOOL_REGISTRY.filter((tool) => tool.category === category);
}

export function getToolById(id: ToolId): ToolDefinition | undefined {
  return TOOL_REGISTRY.find((tool) => tool.id === id);
}

/** Generic result shape returned by every pure transformation function. */
export interface TransformResult {
  ok: boolean;
  output: string;
  error?: string;
  meta?: Record<string, string | number>;
}

/** A single entry in the operation history log. */
export interface HistoryEntry {
  id: string;
  toolId: ToolId;
  toolLabel: string;
  inputSummary: string;
  outputSummary: string;
  timestamp: number;
}

export const MAX_HISTORY_SUMMARY_LENGTH = 64;
export const MAX_REASONABLE_INPUT_LENGTH = 200_000;
