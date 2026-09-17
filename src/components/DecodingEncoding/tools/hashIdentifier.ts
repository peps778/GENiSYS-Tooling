import type { TransformResult } from '../types/decoding';

export interface HashCandidate {
  algorithm: string;
  confidence: 'high' | 'medium' | 'low';
  note: string;
}

export interface HashIdentificationResult {
  length: number;
  characterSet: string;
  candidates: HashCandidate[];
}

const HEX_ONLY = /^[0-9a-fA-F]+$/;
const BASE64_LIKE = /^[A-Za-z0-9+/]+={0,2}$/;

function describeCharacterSet(value: string): string {
  if (HEX_ONLY.test(value)) return 'Hexadecimal (0-9, a-f)';
  if (BASE64_LIKE.test(value)) return 'Base64 (A-Z, a-z, 0-9, +, /, =)';
  return 'Mixed / non-standard characters';
}

/**
 * Heuristic hash *identification*, not decryption. Many algorithms share the
 * same output length and character set, so multiple candidates are returned
 * whenever the representation is ambiguous.
 */
export function identifyHash(input: string): TransformResult {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return { ok: false, output: '', error: 'Input is empty.' };
  }
  if (/\s/.test(trimmed)) {
    return {
      ok: false,
      output: '',
      error: 'Invalid hash input: value should not contain whitespace.',
    };
  }

  const length = trimmed.length;
  const characterSet = describeCharacterSet(trimmed);
  const candidates: HashCandidate[] = [];

  if (HEX_ONLY.test(trimmed)) {
    switch (length) {
      case 8:
        candidates.push({
          algorithm: 'CRC32',
          confidence: 'medium',
          note: '8 hex characters (32-bit checksum).',
        });
        break;
      case 16:
        candidates.push({
          algorithm: 'MySQL323 / short CRC64',
          confidence: 'low',
          note: '16 hex characters.',
        });
        break;
      case 32:
        candidates.push({
          algorithm: 'MD5',
          confidence: 'high',
          note: '32 hex characters (128-bit).',
        });
        candidates.push({
          algorithm: 'NTLM',
          confidence: 'medium',
          note: 'NTLM hashes are also 32 hex characters.',
        });
        candidates.push({
          algorithm: 'MD4',
          confidence: 'low',
          note: 'MD4 also produces a 128-bit digest.',
        });
        break;
      case 40:
        candidates.push({
          algorithm: 'SHA-1',
          confidence: 'high',
          note: '40 hex characters (160-bit).',
        });
        candidates.push({
          algorithm: 'RIPEMD-160',
          confidence: 'low',
          note: 'Also a 160-bit digest.',
        });
        break;
      case 56:
        candidates.push({
          algorithm: 'SHA-224 / SHA3-224',
          confidence: 'medium',
          note: '56 hex characters (224-bit).',
        });
        break;
      case 64:
        candidates.push({
          algorithm: 'SHA-256',
          confidence: 'high',
          note: '64 hex characters (256-bit).',
        });
        candidates.push({
          algorithm: 'SHA3-256',
          confidence: 'medium',
          note: 'Also a 256-bit digest.',
        });
        break;
      case 96:
        candidates.push({
          algorithm: 'SHA-384',
          confidence: 'high',
          note: '96 hex characters (384-bit).',
        });
        break;
      case 128:
        candidates.push({
          algorithm: 'SHA-512',
          confidence: 'high',
          note: '128 hex characters (512-bit).',
        });
        candidates.push({
          algorithm: 'SHA3-512',
          confidence: 'medium',
          note: 'Also a 512-bit digest.',
        });
        break;
      default:
        candidates.push({
          algorithm: 'Unknown',
          confidence: 'low',
          note: `${length} hex characters does not match a common fixed-length digest.`,
        });
    }
  } else if (/^\$2[aby]?\$/.test(trimmed)) {
    candidates.push({
      algorithm: 'bcrypt',
      confidence: 'high',
      note: 'Matches the bcrypt "$2a/2b/2y$" prefix format.',
    });
  } else if (/^\$1\$/.test(trimmed)) {
    candidates.push({
      algorithm: 'MD5 crypt',
      confidence: 'high',
      note: 'Matches the "$1$" MD5-crypt prefix format.',
    });
  } else if (/^\$6\$/.test(trimmed)) {
    candidates.push({
      algorithm: 'SHA-512 crypt',
      confidence: 'high',
      note: 'Matches the "$6$" SHA-512-crypt prefix format.',
    });
  } else if (BASE64_LIKE.test(trimmed)) {
    candidates.push({
      algorithm: 'Base64-encoded digest',
      confidence: 'low',
      note: 'Character set matches Base64; algorithm cannot be narrowed further from format alone.',
    });
  } else {
    candidates.push({
      algorithm: 'Unknown',
      confidence: 'low',
      note: 'Input does not match a recognized hash character set or prefix format.',
    });
  }

  const result: HashIdentificationResult = { length, characterSet, candidates };
  return { ok: true, output: JSON.stringify(result), meta: { length } };
}
