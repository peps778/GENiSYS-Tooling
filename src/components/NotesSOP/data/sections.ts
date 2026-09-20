import type { SOPSection } from '../types/notesSop';

export const SOP_SECTIONS: SOPSection[] = [
  {
    id: 'reference',
    number: '00',
    title: 'Quick Reference',
    description: 'High-value triage, protocol, evidence, and tool references.',
  },
  {
    id: 'enumeration',
    number: '01',
    title: 'Enumeration SOP',
    description: 'Case-driven discovery and service enumeration.',
  },
  {
    id: 'web',
    number: '02',
    title: 'Web Testing SOP',
    description: 'Branching web and API investigation cases.',
  },
  {
    id: 'network',
    number: '03',
    title: 'Network Investigation',
    description: 'Hosts, services, DNS, connections, and PCAPs.',
  },
  {
    id: 'forensics',
    number: '04',
    title: 'Forensics SOP',
    description: 'Files, memory, logs, PCAPs, and recovered artifacts.',
  },
  {
    id: 'stego',
    number: '05',
    title: 'Stego SOP',
    description: 'Layered image, audio, metadata, and embedded-data analysis.',
  },
  {
    id: 'encoding',
    number: '06',
    title: 'Encoding / Decoding',
    description: 'Observation-driven transformation decisions.',
  },
  {
    id: 'next',
    number: '07',
    title: 'What Do I Try Next?',
    description: 'Convert observations into possible next investigations.',
  },
  {
    id: 'evidence',
    number: '08',
    title: 'Evidence Capture',
    description: 'Separate observations, interpretations, and verification.',
  },
  {
    id: 'logbook',
    number: '09',
    title: 'Flag Logbook',
    description: 'Track flag candidates, verification, provenance, and status.',
  },
  {
    id: 'time',
    number: '10',
    title: 'Time Management',
    description: 'Time-boxing, pivots, dead ends, and final verification.',
  },
  {
    id: 'vulnerabilities',
    number: '11',
    title: 'Common Vulnerabilities',
    description: 'Case-based vulnerability investigation references.',
  },
];
