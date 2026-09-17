import { identifyFile, extractReportedExtension } from './fileIdentifier';
import type {
  FormatGuessEvidence,
  FormatGuessResult,
} from '../types/fileAnalysis';

/**
 * Combines multiple evidence sources into a single format guess, using a
 * strict precedence order: reliable signature > structural indicator >
 * MIME > extension. Extension alone can never win against a conflicting
 * signature -- it can only surface a mismatch.
 */
export function guessFormat(
  data: Uint8Array,
  filename: string,
  reportedMime: string | null,
): FormatGuessResult {
  const identification = identifyFile(data, filename);
  const reportedExtension = extractReportedExtension(filename);
  const evidence: FormatGuessEvidence[] = [];

  if (identification.signature) {
    evidence.push({
      source: 'signature',
      value: identification.signature.format,
      weight: identification.signature.confidence === 'confirmed' ? 100 : 60,
    });
  }

  if (reportedMime) {
    evidence.push({ source: 'mime', value: reportedMime, weight: 30 });
  }

  if (reportedExtension) {
    evidence.push({
      source: 'extension',
      value: reportedExtension,
      weight: 10,
    });
  }

  if (evidence.length === 0) {
    return {
      bestGuess: 'Unknown',
      mime: null,
      confidence: 'unknown',
      evidence,
      conflict: false,
      conflictDetail: null,
    };
  }

  // Highest-weight evidence wins.
  const winner = evidence.reduce((a, b) => (b.weight > a.weight ? b : a));

  const conflict = identification.extensionMismatch;
  const conflictDetail = conflict
    ? `Filename suggests ${reportedExtension || '(no extension)'}, but detected bytes indicate ${identification.detectedType}`
    : null;

  return {
    bestGuess:
      winner.source === 'signature'
        ? identification.detectedType
        : winner.value,
    mime: identification.mime ?? reportedMime,
    confidence: identification.signature
      ? identification.confidence
      : 'unknown',
    evidence,
    conflict,
    conflictDetail,
  };
}
