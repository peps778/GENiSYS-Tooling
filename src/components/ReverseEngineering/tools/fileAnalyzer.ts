import type { TransformResult } from '../types/reverseEngineering';
import { bytesToHex } from './bytes';

interface Signature {
  name: string;
  extension: string;
  mime: string;
  bytes: number[];
}

const SIGNATURES: Signature[] = [
  {
    name: 'PNG image',
    extension: '.png',
    mime: 'image/png',
    bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  },
  {
    name: 'JPEG image',
    extension: '.jpg/.jpeg',
    mime: 'image/jpeg',
    bytes: [0xff, 0xd8, 0xff],
  },
  {
    name: 'GIF image',
    extension: '.gif',
    mime: 'image/gif',
    bytes: [0x47, 0x49, 0x46, 0x38],
  },
  {
    name: 'PDF document',
    extension: '.pdf',
    mime: 'application/pdf',
    bytes: [0x25, 0x50, 0x44, 0x46, 0x2d],
  },
  {
    name: 'ZIP archive',
    extension: '.zip',
    mime: 'application/zip',
    bytes: [0x50, 0x4b, 0x03, 0x04],
  },
  {
    name: 'GZIP archive',
    extension: '.gz',
    mime: 'application/gzip',
    bytes: [0x1f, 0x8b, 0x08],
  },
  {
    name: 'Windows PE executable',
    extension: '.exe/.dll',
    mime: 'application/vnd.microsoft.portable-executable',
    bytes: [0x4d, 0x5a],
  },
  {
    name: 'ELF executable/object',
    extension: '.elf',
    mime: 'application/x-elf',
    bytes: [0x7f, 0x45, 0x4c, 0x46],
  },
  {
    name: 'WebAssembly module',
    extension: '.wasm',
    mime: 'application/wasm',
    bytes: [0x00, 0x61, 0x73, 0x6d],
  },
  {
    name: 'Mach-O 64-bit executable',
    extension: '.macho',
    mime: 'application/octet-stream',
    bytes: [0xcf, 0xfa, 0xed, 0xfe],
  },
  {
    name: 'Mach-O 32-bit executable',
    extension: '.macho',
    mime: 'application/octet-stream',
    bytes: [0xce, 0xfa, 0xed, 0xfe],
  },
];

function matches(bytes: Uint8Array, signature: number[]): boolean {
  return signature.every((value, index) => bytes[index] === value);
}

export function identifySignature(bytes: Uint8Array): Signature | null {
  return (
    SIGNATURES.find((signature) => matches(bytes, signature.bytes)) ?? null
  );
}

export function analyzeFile(name: string, bytes: Uint8Array): TransformResult {
  if (!bytes.length)
    return { ok: false, output: '', error: 'The file is empty.' };
  const signature = identifySignature(bytes);
  const output = [
    `Name: ${name}`,
    `Size: ${bytes.length.toLocaleString()} bytes`,
    `Type: ${signature?.name ?? 'Unknown / unrecognized'}`,
    `Extension: ${signature?.extension ?? '—'}`,
    `MIME: ${signature?.mime ?? 'application/octet-stream'}`,
    `Magic bytes: ${bytesToHex(bytes.slice(0, 16)).toUpperCase()}`,
    `First 16 bytes: ${bytesToHex(bytes.slice(0, 16))}`,
  ].join('\n');
  return {
    ok: true,
    output,
    meta: { size: bytes.length, type: signature?.name ?? 'Unknown' },
  };
}
