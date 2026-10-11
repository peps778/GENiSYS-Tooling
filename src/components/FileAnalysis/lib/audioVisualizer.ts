import type {
  AudioSpectrogram,
  AudioWaveform,
  PcmData,
} from '../types/fileAnalysis';

// ---------------------------------------------------------------------------
// Waveform — cheap; called on every load for the top-of-view overview.
// ---------------------------------------------------------------------------

export function computeWaveform(
  pcm: PcmData,
  targetWidth = 1000,
): AudioWaveform {
  const channelCount = pcm.channels.length;
  const width = Number.isFinite(targetWidth)
    ? Math.max(1, Math.min(10000, Math.floor(targetWidth)))
    : 1000;
  const sampleRate =
    Number.isFinite(pcm.sampleRate) && pcm.sampleRate > 0 ? pcm.sampleRate : 0;

  if (channelCount === 0 || pcm.channels[0].length === 0 || sampleRate === 0) {
    return {
      peaks: new Array(width).fill(0),
      duration: 0,
      sampleRate,
      channels: channelCount,
    };
  }

  const totalSamples = pcm.channels[0].length;
  const peaks: number[] = new Array(width).fill(0);

  for (let col = 0; col < width; col++) {
    const start = Math.floor((col * totalSamples) / width);
    const end = Math.max(
      start + 1,
      Math.floor(((col + 1) * totalSamples) / width),
    );
    let peak = 0;
    for (const channel of pcm.channels) {
      for (let i = start; i < end; i++) {
        const v = Math.abs(channel[i]);
        if (v > peak) peak = v;
      }
    }
    peaks[col] = peak;
  }

  return {
    peaks,
    duration: totalSamples / sampleRate,
    sampleRate,
    channels: channelCount,
  };
}

// ---------------------------------------------------------------------------
// Spectrogram — the primary view for CTF audio stego.
//
// Hidden text, images, and tones are drawn in the frequency domain and are
// only visible here, not in the waveform.
// ---------------------------------------------------------------------------

export interface SpectrogramOptions {
  /** FFT size; rounded up to the nearest power of two. Default 1024. */
  fftSize?: number;
  /** Hop between frames. Default `fftSize / 4`. */
  hopSize?: number;
  /** Hard cap on output columns. Default 1024. */
  maxColumns?: number;
  /** Lower dB bound, normalized to 0. Default -100. */
  minDb?: number;
  /** Upper dB bound, normalized to 1. Default -20. */
  maxDb?: number;
}

export function computeSpectrogram(
  pcm: PcmData,
  options: SpectrogramOptions = {},
): AudioSpectrogram {
  // Keep FFT allocations bounded even when options come from untrusted UI input.
  const requestedFft = Number.isFinite(options.fftSize)
    ? Math.floor(options.fftSize!)
    : 1024;
  const fftSize = nearestPow2(Math.max(32, Math.min(8192, requestedFft)));
  const requestedHop = Number.isFinite(options.hopSize)
    ? Math.floor(options.hopSize!)
    : Math.floor(fftSize / 4);
  const hopSize = Math.max(1, Math.min(fftSize, requestedHop));
  const requestedColumns = Number.isFinite(options.maxColumns)
    ? Math.floor(options.maxColumns!)
    : 1024;
  const maxColumns = Math.max(1, Math.min(4096, requestedColumns));
  const requestedMinDb = Number.isFinite(options.minDb) ? options.minDb! : -100;
  const requestedMaxDb = Number.isFinite(options.maxDb) ? options.maxDb! : -20;
  const minDb = Math.min(requestedMinDb, requestedMaxDb - 1);
  const maxDb = Math.max(requestedMaxDb, minDb + 1);
  const halfBins = fftSize / 2;
  const sampleRate =
    Number.isFinite(pcm.sampleRate) && pcm.sampleRate > 0 ? pcm.sampleRate : 0;

  if (
    sampleRate === 0 ||
    pcm.channels.length === 0 ||
    pcm.channels[0].length < fftSize
  ) {
    return {
      width: 0,
      height: halfBins,
      magnitudes: new Float32Array(0),
      fftSize,
      timeStep: sampleRate > 0 ? hopSize / sampleRate : 0,
      freqStep: sampleRate > 0 ? sampleRate / fftSize : 0,
      minDb,
      maxDb,
    };
  }

  // Analyze channels independently so anti-phase stereo content cannot cancel out.
  const channels = pcm.channels.filter((channel) => channel.length >= fftSize);
  const sampleCount =
    channels.length > 0
      ? Math.min(...channels.map((channel) => channel.length))
      : 0;
  const window = hannWindow(fftSize);

  const availableColumns = Math.max(
    1,
    Math.floor((sampleCount - fftSize) / hopSize) + 1,
  );
  const columnStride = Math.max(1, Math.ceil(availableColumns / maxColumns));
  const width = Math.ceil(availableColumns / columnStride);

  const magnitudes = new Float32Array(width * halfBins);
  const re = new Float32Array(fftSize);
  const im = new Float32Array(fftSize);
  const strongestMagnitude = new Float32Array(halfBins);

  for (let col = 0; col < width; col++) {
    const frameStart = col * columnStride * hopSize;
    strongestMagnitude.fill(0);
    for (const channel of channels) {
      for (let i = 0; i < fftSize; i++) {
        re[i] = channel[frameStart + i] * window[i];
        im[i] = 0;
      }
      fftInPlace(re, im);
      for (let bin = 0; bin < halfBins; bin++) {
        const mag = Math.sqrt(re[bin] * re[bin] + im[bin] * im[bin]);
        if (mag > strongestMagnitude[bin]) strongestMagnitude[bin] = mag;
      }
    }
    for (let bin = 0; bin < halfBins; bin++) {
      const db = 20 * Math.log10(strongestMagnitude[bin] + 1e-12);
      magnitudes[bin * width + col] = clamp01((db - minDb) / (maxDb - minDb));
    }
  }

  return {
    width,
    height: halfBins,
    magnitudes,
    fftSize,
    timeStep: (hopSize * columnStride) / sampleRate,
    freqStep: sampleRate / fftSize,
    minDb,
    maxDb,
  };
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function hannWindow(size: number): Float32Array {
  const w = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    w[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (size - 1)));
  }
  return w;
}

function nearestPow2(n: number): number {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

// ---------------------------------------------------------------------------
// Radix-2 Cooley-Tukey FFT. In-place, decimation-in-time.
// ---------------------------------------------------------------------------

function fftInPlace(re: Float32Array, im: Float32Array): void {
  const n = re.length;
  if (n <= 1 || (n & (n - 1)) !== 0) return; // powers of two only

  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const tr = re[i];
      re[i] = re[j];
      re[j] = tr;
      const ti = im[i];
      im[i] = im[j];
      im[j] = ti;
    }
  }

  for (let len = 2; len <= n; len <<= 1) {
    const angle = (-2 * Math.PI) / len;
    const wRe = Math.cos(angle);
    const wIm = Math.sin(angle);
    for (let i = 0; i < n; i += len) {
      let curRe = 1;
      let curIm = 0;
      const half = len >> 1;
      for (let j = 0; j < half; j++) {
        const uRe = re[i + j];
        const uIm = im[i + j];
        const vRe = re[i + j + half] * curRe - im[i + j + half] * curIm;
        const vIm = re[i + j + half] * curIm + im[i + j + half] * curRe;
        re[i + j] = uRe + vRe;
        im[i + j] = uIm + vIm;
        re[i + j + half] = uRe - vRe;
        im[i + j + half] = uIm - vIm;
        const nRe = curRe * wRe - curIm * wIm;
        const nIm = curRe * wIm + curIm * wRe;
        curRe = nRe;
        curIm = nIm;
      }
    }
  }
}
