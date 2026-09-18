import type { SOPSection } from '../types/notesSop';

export const SOP_SECTIONS: SOPSection[] = [
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
    title: 'Flag / Evidence',
    description: 'Structured findings, candidates, and confirmation.',
  },
  {
    id: 'time',
    number: '09',
    title: 'Time Management',
    description: 'Pivot and time-boxing cases.',
  },
  {
    id: 'vulnerabilities',
    number: '10',
    title: 'Common Vulnerabilities',
    description: 'Case-based vulnerability investigation references.',
  },
];
