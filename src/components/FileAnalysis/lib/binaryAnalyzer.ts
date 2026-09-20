import type { BinaryStatistics, ByteFrequencyEntry } from "../types/fileAnalysis";

const DEFAULT_MIN_TEXT_REGION_LENGTH = 8;
/** Cap the number of bytes actually scanned for expensive stats on huge files. */
const DEFAULT_SAMPLE_LIMIT = 8 * 1024 * 1024; // 8 MiB

function isPrintable(byte: number): boolean {
  return byte >= 0x20 && byte <= 0x7e;
}

/**
 * Shannon entropy estimate in bits/byte (0-8), computed deterministically
 * from a byte-frequency histogram over the sampled region.
 */
function computeEntropy(freq: Uint32Array, sampleSize: number): number {
  if (sampleSize === 0) return 0;
  let entropy = 0;
  for (let i = 0; i < 256; i++) {
    const count = freq[i];
    if (count === 0) continue;
    const p = count / sampleSize;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

function findTextRegions(data: Uint8Array, minLength: number): { offset: number; length: number }[] {
  const regions: { offset: number; length: number }[] = [];
  let runStart = -1;
  for (let i = 0; i < data.length; i++) {
    if (isPrintable(data[i])) {
      if (runStart === -1) runStart = i;
    } else if (runStart !== -1) {
      if (i - runStart >= minLength) regions.push({ offset: runStart, length: i - runStart });
      runStart = -1;
    }
  }
  if (runStart !== -1 && data.length - runStart >= minLength) {
    regions.push({ offset: runStart, length: data.length - runStart });
  }
  return regions;
}

export interface BinaryAnalysisOptions {
  sampleLimit?: number;
  minTextRegionLength?: number;
  topByteCount?: number;
}

/**
 * Computes bounded, deterministic statistics over `data`. For very large
 * buffers, analysis is limited to the first `sampleLimit` bytes so the UI
 * stays responsive; callers should surface that this is a sample, not the
 * whole file, when `data.length > sampleLimit`.
 */
export function analyzeBinary(data: Uint8Array, options: BinaryAnalysisOptions = {}): BinaryStatistics {
  const sampleLimit = options.sampleLimit ?? DEFAULT_SAMPLE_LIMIT;
  const minTextRegionLength = options.minTextRegionLength ?? DEFAULT_MIN_TEXT_REGION_LENGTH;
  const topByteCount = options.topByteCount ?? 8;

  const sample = data.length > sampleLimit ? data.subarray(0, sampleLimit) : data;

  const freq = new Uint32Array(256);
  let printableCount = 0;
  let nullCount = 0;
  for (let i = 0; i < sample.length; i++) {
    const b = sample[i];
    freq[b]++;
    if (isPrintable(b)) printableCount++;
    if (b === 0x00) nullCount++;
  }

  const entropyEstimate = computeEntropy(freq, sample.length);
  const printableRatio = sample.length === 0 ? 0 : printableCount / sample.length;
  const nullByteRatio = sample.length === 0 ? 0 : nullCount / sample.length;

  const topBytes: ByteFrequencyEntry[] = Array.from(freq)
    .map((count, byte) => ({ byte, count }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, topByteCount);

  const detectedTextRegions = findTextRegions(sample, minTextRegionLength).slice(0, 200);

  return {
    sizeBytes: data.length,
    entropyEstimate,
    printableRatio,
    nullByteRatio,
    topBytes,
    detectedTextRegions,
  };
}
