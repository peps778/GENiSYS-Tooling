import type { Confidence, EvidenceFinding } from '../types/notesSop';

export function inferConfidence(
  finding: Pick<
    EvidenceFinding,
    'observation' | 'interpretation' | 'evidenceType'
  >,
): Confidence {
  const evidence =
    `${finding.observation} ${finding.interpretation} ${finding.evidenceType}`.toLowerCase();
  if (!finding.observation.trim()) return 'low';
  if (/confirmed|verified|valid file|matches challenge/i.test(evidence))
    return 'confirmed';
  if (/repeat|comparison|response|hash|offset/i.test(evidence)) return 'high';
  if (/possible|candidate|suspected/i.test(evidence)) return 'medium';
  return 'low';
}
