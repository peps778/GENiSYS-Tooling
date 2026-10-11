import React, { useEffect, useRef, useState } from 'react';
import { analyzeCode, type CodeAnalysis } from '../lib/codeAnalyzer';
import { computeSpectrogram, computeWaveform } from '../lib/audioVisualizer';

interface Props {
  file: File;
}

function AudioSignature({ file }: Props) {
  const [status, setStatus] = useState('Reading audio stream…');
  const [data, setData] = useState<{
    duration: number;
    rate: number;
    channels: number;
    peaks: number[];
    spectrogram: ReturnType<typeof computeSpectrogram>;
  } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let active = true;
    let context: AudioContext | null = null;
    setData(null);
    if (file.size > 80 * 1024 * 1024) {
      setStatus(
        'Audio preview skipped for files over 80 MB to avoid excessive memory use.',
      );
      return () => {
        active = false;
      };
    }
    file
      .arrayBuffer()
      .then(async (buffer) => {
        if (!active) return;
        const AudioContextCtor =
          window.AudioContext ||
          (
            window as typeof window & {
              webkitAudioContext?: typeof AudioContext;
            }
          ).webkitAudioContext;
        if (!AudioContextCtor)
          throw new Error('Web Audio API is not available in this browser.');
        context = new AudioContextCtor();
        const audio = await context.decodeAudioData(buffer.slice(0));
        if (!active) return;
        const channels = Array.from(
          { length: audio.numberOfChannels },
          (_, i) => new Float32Array(audio.getChannelData(i)),
        );
        const pcm = { channels, sampleRate: audio.sampleRate };
        const waveform = computeWaveform(pcm, 900);
        const spectrogram = computeSpectrogram(pcm, {
          fftSize: 1024,
          maxColumns: 1200,
          minDb: -100,
          maxDb: -20,
        });
        setData({
          duration: audio.duration,
          rate: audio.sampleRate,
          channels: audio.numberOfChannels,
          peaks: waveform.peaks,
          spectrogram,
        });
        setStatus(
          'Decoded with the browser audio engine. Spectrogram contrast is normalized for inspection; visuals alone cannot confirm steganography.',
        );
      })
      .catch((error: unknown) => {
        if (active)
          setStatus(
            error instanceof Error
              ? `Audio decoding unavailable: ${error.message}`
              : 'Audio decoding failed. The file may use an unsupported codec.',
          );
      });
    return () => {
      active = false;
      if (context) void context.close();
    };
  }, [file]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data || data.spectrogram.width === 0) return;
    const { width, height, magnitudes } = data.spectrogram;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const image = ctx.createImageData(width, height);
    // Higher frequencies are displayed at the top, matching common spectrograms.
    for (let y = 0; y < height; y++) {
      const sourceBin = height - 1 - y;
      for (let x = 0; x < width; x++) {
        const level = Math.max(
          0,
          Math.min(1, magnitudes[sourceBin * width + x] ?? 0),
        );
        const offset = (y * width + x) * 4;
        image.data[offset] = Math.round(12 + level * 42);
        image.data[offset + 1] = Math.round(18 + level * 220);
        image.data[offset + 2] = Math.round(30 + level * 85);
        image.data[offset + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
  }, [data]);

  return (
    <section className="rounded-[12px] border border-[#E5E7EB] bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-[#111827]">
            Audio signature & steganography triage
          </h3>
          <p className="mt-1 text-xs text-[#6B7280]">
            Waveform and short-time Fourier transform (STFT) spectrogram
          </p>
        </div>
        {data && (
          <span className="rounded-full border border-[#BBF7D0] bg-[#F0FDF4] px-2 py-1 text-xs text-[#15803D]">
            {data.rate.toLocaleString()} Hz · {data.channels} ch
          </span>
        )}
      </div>
      <p className="mt-3 text-xs text-[#6B7280]">{status}</p>
      {data && (
        <>
          <div
            className="mt-3 flex h-24 items-center gap-px overflow-hidden rounded-lg bg-[#0C021E] px-1"
            aria-label="Audio waveform overview"
          >
            {data.peaks.map((peak, i) => (
              <span
                key={i}
                className="min-w-0 flex-1 rounded-sm bg-[#36DE55]"
                style={{
                  height: `${Math.max(2, peak * 100)}%`,
                  opacity: 0.35 + peak * 0.65,
                }}
              />
            ))}
          </div>
          <div className="mt-4">
            <div className="mb-2 flex justify-between text-xs text-[#6B7280]">
              <span>High frequency</span>
              <span>{data.duration.toFixed(2)} s</span>
            </div>
            {data.spectrogram.width > 0 ? (
              <canvas
                ref={canvasRef}
                className="block h-48 w-full rounded-lg bg-[#0C021E] object-fill"
                style={{ imageRendering: 'pixelated' }}
                aria-label="Audio spectrogram showing frequency energy over time"
              />
            ) : (
              <div className="rounded-lg bg-[#F9FAFB] p-3 text-xs text-[#6B7280]">
                Audio is shorter than the selected FFT window. Use a smaller FFT
                to inspect very short clips.
              </div>
            )}
            <div className="mt-1 flex justify-between text-[11px] text-[#6B7280]">
              <span>0 Hz</span>
              <span>Frequency increases upward · time moves left to right</span>
              <span>{Math.round(data.rate / 2).toLocaleString()} Hz</span>
            </div>
          </div>
          <p className="mt-3 text-xs leading-5 text-[#6B7280]">
            Look for narrowband tones, repeated horizontal or vertical
            structures, abrupt spectral changes, and unexpected silence. STFT
            visuals are clues only; codec artifacts and ordinary music can
            produce similar patterns. LSB, phase, metadata, and ultrasonic
            payload checks require separate tests.
          </p>
        </>
      )}
    </section>
  );
}

export function CodeAnalysisPanel({ file }: Props) {
  const [analysis, setAnalysis] = useState<CodeAnalysis | null>(null);
  useEffect(() => {
    let active = true;
    file
      .text()
      .then((source) => {
        if (active)
          setAnalysis(analyzeCode(source.slice(0, 2_000_000), file.name));
      })
      .catch(() => {
        if (active) setAnalysis(null);
      });
    return () => {
      active = false;
    };
  }, [file]);

  if (
    /\.(?:wav|mp3|ogg|oga|opus|m4a|aac|flac|aiff?|wma)$/i.test(file.name) ||
    file.type.startsWith('audio/')
  ) {
    return <AudioSignature file={file} />;
  }
  if (
    !/\.(?:py|js|jsx|ts|tsx|java|php|c|h|cpp|cc|cs|go|rs|rb|pl|sh|ps1)$/i.test(
      file.name,
    )
  )
    return null;
  if (!analysis)
    return (
      <section className="rounded-[12px] border border-[#E5E7EB] bg-white p-4 text-sm text-[#6B7280]">
        Reading source for static code indicators…
      </section>
    );

  return (
    <section className="rounded-[12px] border border-[#E5E7EB] bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-[#111827]">
            Static code analysis
          </h3>
          <p className="mt-1 text-xs text-[#6B7280]">
            Language: {analysis.language} · {analysis.lines} lines · no code
            executed
          </p>
        </div>
        <span className="rounded-full border border-[#E5E7EB] bg-[#F9FAFB] px-2 py-1 text-xs text-[#4B5563]">
          {analysis.findings.length} indicators
        </span>
      </div>
      {analysis.findings.length === 0 ? (
        <p className="mt-3 text-sm text-[#6B7280]">
          No supported shift, byte-transform, conversion, or dynamic-execution
          patterns were matched. This is not proof that the source is benign.
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {analysis.findings.map((f) => (
            <article
              key={f.id}
              className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-[#111827]">
                  {f.title}
                </span>
                <span className="text-xs text-[#6B7280]">
                  Line {f.line} · {f.severity}
                </span>
              </div>
              <pre className="mt-2 overflow-auto whitespace-pre-wrap break-all font-mono text-xs text-[#374151]">
                {f.snippet}
              </pre>
              <p className="mt-2 text-xs leading-5 text-[#6B7280]">
                {f.explanation}
              </p>
              <p className="mt-1 text-xs leading-5 text-[#4B5563]">
                Next: {f.nextStep}
              </p>
            </article>
          ))}
        </div>
      )}
      {analysis.permutationCandidates.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-[#4B5563]">
            Byte permutation candidates
          </h4>
          <ul className="mt-2 space-y-1">
            {analysis.permutationCandidates.map((item) => (
              <li
                key={item}
                className="rounded bg-[#F9FAFB] p-2 font-mono text-xs text-[#374151]"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
      {analysis.shiftCandidates.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-[#4B5563]">
            Shift / rotation candidates
          </h4>
          <ul className="mt-2 space-y-1">
            {analysis.shiftCandidates.map((item) => (
              <li
                key={item}
                className="rounded bg-[#F9FAFB] p-2 font-mono text-xs text-[#374151]"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="mt-3 text-xs text-[#9CA3AF]">
        Pattern matching is heuristic. Results can include false positives and
        do not replace parsing, data-flow analysis, or manual verification.
      </p>
    </section>
  );
}
