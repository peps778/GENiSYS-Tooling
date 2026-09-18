import type { SOPCase } from '../types/notesSop';

export const nextStepCases: SOPCase[] = [
  {
    id: 'next-open-web',
    category: 'next',
    title: 'I Found Ports 80 and 22',
    summary:
      'Use the observed services to create several possible next paths instead of blindly following a universal order.',
    whenToUse: ['HTTP and SSH discovered', 'Basic scan completed'],
    prerequisites: ['Port scan recorded'],
    observations: ['80/tcp', '22/tcp'],
    initialChecks: [
      'Inspect HTTP baseline',
      'Record SSH version/banner if available',
    ],
    steps: [
      {
        id: 'a',
        action: 'Choose a branch based on information gain',
        purpose:
          'Prefer paths that can reveal additional application or service context.',
        expectedObservation:
          'Web content, SSH metadata, or additional DNS context.',
        possibleResults: ['Web clues', 'SSH clues', 'No useful clue'],
        evidence: ['Command outputs'],
      },
    ],
    branches: [
      {
        id: 'web',
        condition: 'HTTP provides an application',
        result: 'Web attack surface',
        nextAction: 'Use Web Service/Login/API cases.',
        nextCaseId: 'enum-web-service',
        evidence: ['URL', 'Response'],
      },
      {
        id: 'ssh',
        condition: 'SSH provides a useful service/version clue',
        result: 'SSH service path',
        nextAction:
          'Research the service behavior within the authorized environment.',
        evidence: ['Banner/version'],
      },
      {
        id: 'none',
        condition: 'Both paths provide little information',
        result: 'Pivot',
        nextAction:
          'Check DNS, other in-scope hosts, challenge artifacts, or unusual ports.',
        evidence: ['Dead-end note'],
      },
    ],
    alternativePaths: [
      'DNS/reverse DNS',
      'Virtual host clues',
      'Other discovered hosts',
    ],
    evidenceToRecord: ['Completed actions', 'Open leads', 'Dead ends'],
    stopConditions: [
      'Do not spend the entire session repeatedly enumerating the same two services',
    ],
    relatedCases: ['enum-web-service', 'enum-unknown-target'],
    estimatedTime: '5–15 min',
    difficulty: 'beginner',
    tags: ['pivot', 'next-step', 'ports', 'web', 'ssh'],
  },
];
