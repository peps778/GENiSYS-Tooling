export interface PermutationCandidate {
  name: string;
  score: number;
  printableRatio: number;
  flagLike: boolean;
  preview: string;
  bytes: Uint8Array;
}

const MAX_INPUT_BYTES = 65_536;

/** Generate bounded, common permutation hypotheses without executing the sample. */
export function recoverBytePermutations(
  input: Uint8Array,
  limit = 8,
): PermutationCandidate[] {
  if (input.length < 2) return [];
  const source = input.subarray(0, Math.min(input.length, MAX_INPUT_BYTES));
  const candidates: Array<{ name: string; bytes: Uint8Array }> = [];
  const add = (name: string, mapper: (index: number) => number) => {
    const output = new Uint8Array(source.length);
    for (let i = 0; i < source.length; i++) output[i] = source[mapper(i)];
    candidates.push({ name, bytes: output });
  };

  add('Reverse byte order', (i) => source.length - 1 - i);
  add('Even bytes then odd bytes', (i) =>
    i < Math.ceil(source.length / 2)
      ? i * 2
      : (i - Math.ceil(source.length / 2)) * 2 + 1,
  );
  add('Odd bytes then even bytes', (i) =>
    i < Math.floor(source.length / 2)
      ? i * 2 + 1
      : (i - Math.floor(source.length / 2)) * 2,
  );

  // Small cyclic rotations are common in hand-written CTF encoders.
  for (let shift = 1; shift <= Math.min(16, source.length - 1); shift++) {
    add(`Rotate order by ${shift}`, (i) => (i + shift) % source.length);
  }

  // XOR-index permutations are bijective when the buffer length is a power of two.
  if ((source.length & (source.length - 1)) === 0) {
    for (let mask = 1; mask < source.length && mask <= 128; mask <<= 1) {
      add(`XOR index mask 0x${mask.toString(16)}`, (i) => i ^ mask);
    }
  }

  // Affine maps are permutations only when multiplier and length are coprime.
  for (
    let multiplier = 2;
    multiplier <= Math.min(17, source.length - 1);
    multiplier++
  ) {
    if (gcd(multiplier, source.length) !== 1) continue;
    for (const offset of [0, 1, Math.floor(source.length / 2)]) {
      add(
        `Affine index (${multiplier}×i+${offset}) mod n`,
        (i) => (multiplier * i + offset) % source.length,
      );
    }
  }

  const unique = new Set<string>();
  const ranked = candidates
    .map((candidate) => ({ ...candidate, ...scoreBytes(candidate.bytes) }))
    .filter((candidate) => {
      const key = `${candidate.bytes.length}:${candidate.preview}`;
      if (unique.has(key)) return false;
      unique.add(key);
      return true;
    })
    .sort((a, b) => b.score - a.score || b.printableRatio - a.printableRatio)
    .slice(0, Math.max(1, Math.min(20, Math.floor(limit))));

  return ranked;
}

function scoreBytes(
  bytes: Uint8Array,
): Pick<
  PermutationCandidate,
  'score' | 'printableRatio' | 'flagLike' | 'preview'
> {
  let printable = 0;
  let controls = 0;
  for (const byte of bytes) {
    if (byte === 9 || byte === 10 || byte === 13 || (byte >= 32 && byte <= 126))
      printable++;
    else if (byte < 32 || byte === 127) controls++;
  }
  const printableRatio = printable / Math.max(1, bytes.length);
  const previewLength = Math.min(240, bytes.length);
  let preview = '';
  for (let i = 0; i < previewLength; i++) {
    const b = bytes[i];
    preview +=
      b === 9 || b === 10 || b === 13 || (b >= 32 && b <= 126)
        ? String.fromCharCode(b)
        : '·';
  }
  const flagLike = /(?:flag|ctf|picoctf|hack)[\w-]{0,24}\{[^{}]{1,100}\}/i.test(
    preview,
  );
  const score = Math.max(
    0,
    Math.min(
      100,
      printableRatio * 85 +
        (flagLike ? 15 : 0) -
        (controls / Math.max(1, bytes.length)) * 20,
    ),
  );
  return { score, printableRatio, flagLike, preview };
}

function gcd(a: number, b: number): number {
  while (b !== 0) [a, b] = [b, a % b];
  return a;
}
