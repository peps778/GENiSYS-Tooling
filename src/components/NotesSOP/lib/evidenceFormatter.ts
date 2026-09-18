import type { EvidenceFinding } from "../types/notesSop";

export function formatEvidence(finding: EvidenceFinding): string {
  const lines = [
    `[${finding.id}] ${finding.status.toUpperCase()}`,
    `Timestamp: ${finding.timestamp}`,
    `Category: ${finding.category}`,
    `Source: ${finding.source || "Not recorded"}`,
    `Target: ${finding.target || "Not recorded"}`,
    `Observation: ${finding.observation || "Not recorded"}`,
    `Interpretation: ${finding.interpretation || "Not recorded"}`,
    `Confidence: ${finding.confidence}`,
    `Evidence type: ${finding.evidenceType}`,
  ];

  if (finding.command) lines.push(`Command: ${finding.command}`);
  if (finding.output) lines.push(`Output: ${finding.output}`);
  if (finding.file) lines.push(`File: ${finding.file}`);
  if (finding.offset) lines.push(`Offset: ${finding.offset}`);
  if (finding.hash) lines.push(`Hash: ${finding.hash}`);
  if (finding.relatedCase) lines.push(`Related case: ${finding.relatedCase}`);
  if (finding.notes) lines.push(`Notes: ${finding.notes}`);

  return lines.join("\n");
}
