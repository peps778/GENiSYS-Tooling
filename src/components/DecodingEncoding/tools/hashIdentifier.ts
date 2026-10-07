import type { TransformResult } from '../types/decoding';

export interface HashCandidate {
  algorithm: string;
  confidence: 'high' | 'medium' | 'low';
  note: string;
}

export interface HashIdentificationResult {
  length: number;
  characterSet: string;
  format: string;
  candidates: HashCandidate[];
}

const HEX_ONLY = /^[0-9a-fA-F]+$/;
const BASE64_LIKE = /^[A-Za-z0-9+/]+={0,2}$/;

function describeCharacterSet(value: string): string {
  if (HEX_ONLY.test(value)) return 'Hexadecimal (0-9, a-f)';
  if (BASE64_LIKE.test(value))
    return 'Base64 alphabet (A-Z, a-z, 0-9, +, /, =)';
  return 'Mixed / structured characters';
}

function candidate(
  algorithm: string,
  confidence: HashCandidate['confidence'],
  note: string,
): HashCandidate {
  return { algorithm, confidence, note };
}

function identifyCryptFormat(value: string): HashCandidate[] {
  if (/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value)) {
    return [
      candidate(
        'bcrypt',
        'high',
        'Valid bcrypt modular-crypt structure with a 60-character record.',
      ),
    ];
  }
  if (/^\$1\$[./A-Za-z0-9]{0,8}\$[./A-Za-z0-9]{22}$/.test(value)) {
    return [
      candidate('MD5 crypt', 'high', 'Valid $1$ modular-crypt structure.'),
    ];
  }
  if (/^\$5\$[./A-Za-z0-9]{0,16}\$[./A-Za-z0-9]{43}$/.test(value)) {
    return [
      candidate('SHA-256 crypt', 'high', 'Valid $5$ modular-crypt structure.'),
    ];
  }
  if (/^\$6\$[./A-Za-z0-9]{0,16}\$[./A-Za-z0-9]{86}$/.test(value)) {
    return [
      candidate('SHA-512 crypt', 'high', 'Valid $6$ modular-crypt structure.'),
    ];
  }
  if (/^\$argon2(id|i|d)\$v=\d+\$/.test(value)) {
    return [
      candidate(
        'Argon2',
        'high',
        'Matches an Argon2 modular password-hash prefix.',
      ),
    ];
  }
  if (/^\$scrypt\$/.test(value)) {
    return [
      candidate(
        'scrypt',
        'high',
        'Matches the scrypt modular password-hash prefix.',
      ),
    ];
  }
  return [];
}

function identifyHex(value: string): HashCandidate[] {
  switch (value.length) {
    case 8:
      return [
        candidate(
          'CRC32',
          'medium',
          '8 hexadecimal characters represent a 32-bit checksum.',
        ),
      ];
    case 16:
      return [
        candidate(
          'MySQL323',
          'medium',
          'MySQL 3.23 password hashes are 16 hexadecimal characters.',
        ),
        candidate(
          'CRC64',
          'low',
          'Some CRC64 representations use 16 hexadecimal characters.',
        ),
      ];
    case 32:
      return [
        candidate(
          'MD5',
          'high',
          '128-bit digest represented as 32 hexadecimal characters.',
        ),
        candidate(
          'NTLM',
          'high',
          'NT hashes are also 128-bit and indistinguishable from MD5 by shape alone.',
        ),
        candidate(
          'MD4',
          'medium',
          'MD4 also produces a 128-bit hexadecimal digest.',
        ),
        candidate(
          'LM',
          'low',
          'Legacy LM hashes use 32 hexadecimal characters, but have additional structural constraints.',
        ),
      ];
    case 40:
      return [
        candidate(
          'SHA-1',
          'high',
          '160-bit digest represented as 40 hexadecimal characters.',
        ),
        candidate('RIPEMD-160', 'medium', 'Also a 160-bit hexadecimal digest.'),
      ];
    case 56:
      return [
        candidate(
          'SHA-224',
          'high',
          '224-bit SHA-2 digest represented as 56 hexadecimal characters.',
        ),
        candidate(
          'SHA3-224',
          'medium',
          'SHA-3/224 has the same 224-bit hexadecimal length.',
        ),
      ];
    case 64:
      return [
        candidate(
          'SHA-256',
          'high',
          '256-bit SHA-2 digest represented as 64 hexadecimal characters.',
        ),
        candidate(
          'SHA3-256',
          'medium',
          'SHA-3/256 has the same 256-bit hexadecimal length.',
        ),
        candidate(
          'BLAKE2s-256',
          'low',
          'BLAKE2s can produce a 256-bit digest.',
        ),
      ];
    case 96:
      return [
        candidate(
          'SHA-384',
          'high',
          '384-bit SHA-2 digest represented as 96 hexadecimal characters.',
        ),
        candidate(
          'SHA3-384',
          'medium',
          'SHA-3/384 has the same 384-bit hexadecimal length.',
        ),
      ];
    case 128:
      return [
        candidate(
          'SHA-512',
          'high',
          '512-bit SHA-2 digest represented as 128 hexadecimal characters.',
        ),
        candidate(
          'SHA3-512',
          'medium',
          'SHA-3/512 has the same 512-bit hexadecimal length.',
        ),
        candidate(
          'BLAKE2b-512',
          'low',
          'BLAKE2b can produce a 512-bit digest.',
        ),
      ];
    default:
      return [];
  }
}

function identifyBase64Digest(value: string): HashCandidate[] {
  if (!BASE64_LIKE.test(value) || value.length < 8) return [];
  const byteLength = Math.floor((value.replace(/=+$/, '').length * 6) / 8);
  if ([16, 20, 28, 32, 48, 64].includes(byteLength)) {
    return [
      candidate(
        'Base64-encoded digest',
        'low',
        `${byteLength}-byte decoded length is compatible with common digest sizes; the underlying algorithm cannot be inferred.`,
      ),
    ];
  }
  return [];
}

export function identifyHash(input: string): TransformResult {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, output: '', error: 'Input is empty.' };
  if (/\s/.test(trimmed)) {
    return {
      ok: false,
      output: '',
      error: 'Invalid hash input: value should not contain whitespace.',
    };
  }

  const cryptCandidates = identifyCryptFormat(trimmed);
  const candidates = cryptCandidates.length
    ? cryptCandidates
    : HEX_ONLY.test(trimmed)
      ? identifyHex(trimmed)
      : identifyBase64Digest(trimmed);

  if (candidates.length === 0) {
    candidates.push(
      candidate(
        'Unknown',
        'low',
        'The value does not match a recognized fixed-length or modular hash representation.',
      ),
    );
  }

  const format = cryptCandidates.length
    ? 'Modular crypt / password-hash format'
    : HEX_ONLY.test(trimmed)
      ? 'Fixed-length hexadecimal digest/checksum'
      : BASE64_LIKE.test(trimmed)
        ? 'Base64-like digest representation'
        : 'Unrecognized';

  const result: HashIdentificationResult = {
    length: trimmed.length,
    characterSet: describeCharacterSet(trimmed),
    format,
    candidates,
  };

  return {
    ok: true,
    output: JSON.stringify(result),
    meta: { length: trimmed.length, format },
  };
}
