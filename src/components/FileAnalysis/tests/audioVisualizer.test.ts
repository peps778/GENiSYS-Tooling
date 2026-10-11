import { describe, expect, it } from 'vitest';
import { computeSpectrogram, computeWaveform } from '../lib/audioVisualizer';
import type { PcmData } from '../types/fileAnalysis';

function sineWave(
  frequency: number,
  sampleRate = 8192,
  length = 8192,
): PcmData {
  const samples = new Float32Array(length);
  for (let i = 0; i < length; i++)
    samples[i] = Math.sin((2 * Math.PI * frequency * i) / sampleRate);
  return { channels: [samples], sampleRate };
}

describe('audio visualizers', () => {
  it('places a steady tone near its expected spectrogram frequency bin', () => {
    const pcm = sineWave(512);
    const result = computeSpectrogram(pcm, { fftSize: 1024, maxColumns: 20 });
    expect(result.width).toBeGreaterThan(0);
    const column = Math.floor(result.width / 2);
    let strongestBin = 0;
    let strongestValue = -1;
    for (let bin = 1; bin < result.height; bin++) {
      const value = result.magnitudes[bin * result.width + column];
      if (value > strongestValue) {
        strongestValue = value;
        strongestBin = bin;
      }
    }
    // The FFT's frequency resolution is one bin, so allow a one-bin peak offset.
    expect(Math.abs(strongestBin * result.freqStep - 512)).toBeLessThanOrEqual(
      result.freqStep,
    );
  });

  it('preserves energy from anti-phase stereo channels', () => {
    const left = sineWave(1024).channels[0];
    const right = left.map((sample) => -sample);
    const result = computeSpectrogram(
      { channels: [left, right], sampleRate: 8192 },
      { fftSize: 1024 },
    );
    expect(
      Math.max(
        ...Array.from(
          { length: result.height },
          (_, bin) => result.magnitudes[bin * result.width],
        ),
      ),
    ).toBeGreaterThan(0.8);
  });

  it('returns an empty spectrogram for clips shorter than the FFT window', () => {
    const result = computeSpectrogram(sineWave(440, 8192, 128), {
      fftSize: 1024,
    });
    expect(result.width).toBe(0);
    expect(result.magnitudes.length).toBe(0);
  });

  it('bounds waveform width and handles invalid sample rates', () => {
    const pcm = sineWave(440, 8192, 10);
    expect(computeWaveform(pcm, 0).peaks).toHaveLength(1);
    expect(computeWaveform({ ...pcm, sampleRate: 0 }).duration).toBe(0);
  });

  it('bounds unsafe FFT and column options', () => {
    const result = computeSpectrogram(sineWave(512), {
      fftSize: 1_000_000,
      maxColumns: 100_000,
      minDb: -20,
      maxDb: -20,
    });
    expect(result.fftSize).toBeLessThanOrEqual(8192);
    expect(result.width).toBeLessThanOrEqual(4096);
    expect(Number.isFinite(result.freqStep)).toBe(true);
  });
});
