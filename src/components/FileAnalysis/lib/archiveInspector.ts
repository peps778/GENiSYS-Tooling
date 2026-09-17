import type { ArchiveEntry, ArchiveInformation } from '../types/fileAnalysis';

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_DIR_SIGNATURE = 0x02014b50;

const COMPRESSION_METHODS: Record<number, string> = {
  0: 'Stored (no compression)',
  8: 'Deflate',
  9: 'Deflate64',
  12: 'BZIP2',
  14: 'LZMA',
  99: 'AES-encrypted',
};

function readUint16LE(data: Uint8Array, offset: number): number {
  return data[offset] | (data[offset + 1] << 8);
}

function readUint32LE(data: Uint8Array, offset: number): number {
  return (
    (data[offset] |
      (data[offset + 1] << 8) |
      (data[offset + 2] << 16) |
      (data[offset + 3] << 24)) >>>
    0
  );
}

/** Locates the End Of Central Directory record by scanning backward from EOF. */
function findEocd(data: Uint8Array): number | null {
  // EOCD is at least 22 bytes, and the comment field can push it back further
  // (max comment length is 65535 bytes).
  const minOffset = Math.max(0, data.length - 22 - 65535);
  for (let i = data.length - 22; i >= minOffset; i--) {
    if (readUint32LE(data, i) === EOCD_SIGNATURE) return i;
  }
  return null;
}

/**
 * Parses ZIP entries from the central directory. Safe to call on
 * arbitrary/malformed data -- returns as many valid entries as it can parse
 * and stops cleanly rather than throwing on truncated/corrupt input.
 */
export function inspectZipArchive(data: Uint8Array): ArchiveInformation {
  const limitations: string[] = [];
  const eocdOffset = findEocd(data);

  if (eocdOffset === null) {
    return {
      archiveType: 'unsupported',
      entryCount: 0,
      entries: [],
      supported: false,
      limitations: [
        'End-of-central-directory record not found; not a valid ZIP or file is truncated.',
      ],
    };
  }

  const totalEntries = readUint16LE(data, eocdOffset + 10);
  const centralDirOffset = readUint32LE(data, eocdOffset + 16);

  const entries: ArchiveEntry[] = [];
  let offset = centralDirOffset;

  for (let i = 0; i < totalEntries; i++) {
    if (offset + 46 > data.length) {
      limitations.push(
        'Central directory truncated before all entries could be read.',
      );
      break;
    }
    if (readUint32LE(data, offset) !== CENTRAL_DIR_SIGNATURE) {
      limitations.push(
        'Central directory entry signature mismatch; stopped parsing further entries.',
      );
      break;
    }

    const compressionMethodCode = readUint16LE(data, offset + 10);
    const compressedSize = readUint32LE(data, offset + 20);
    const uncompressedSize = readUint32LE(data, offset + 24);
    const nameLength = readUint16LE(data, offset + 28);
    const extraLength = readUint16LE(data, offset + 30);
    const commentLength = readUint16LE(data, offset + 32);

    const nameStart = offset + 46;
    const nameEnd = nameStart + nameLength;
    if (nameEnd > data.length) {
      limitations.push(
        'Entry filename extends beyond buffer; stopped parsing further entries.',
      );
      break;
    }
    const name = new TextDecoder('utf-8').decode(
      data.subarray(nameStart, nameEnd),
    );

    entries.push({
      name,
      isDirectory: name.endsWith('/'),
      compressedSize,
      uncompressedSize,
      compressionMethod:
        COMPRESSION_METHODS[compressionMethodCode] ??
        `Unknown (code ${compressionMethodCode})`,
    });

    offset = nameEnd + extraLength + commentLength;
  }

  return {
    archiveType: 'zip',
    entryCount: entries.length,
    entries,
    supported: true,
    limitations,
  };
}

/** True when the buffer looks like a ZIP local-file-header or EOCD-only (empty) archive. */
export function looksLikeZip(data: Uint8Array): boolean {
  if (data.length < 4) return false;
  const sig = readUint32LE(data, 0);
  return sig === 0x04034b50 || sig === EOCD_SIGNATURE;
}
