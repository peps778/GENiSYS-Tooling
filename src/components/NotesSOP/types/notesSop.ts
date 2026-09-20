export type SOPCategoryId =
  | 'enumeration'
  | 'web'
  | 'network'
  | 'forensics'
  | 'stego'
  | 'encoding'
  | 'next'
  | 'evidence'
  | 'time'
  | 'vulnerabilities'
  | 'reference'
  | 'logbook';

export type Confidence = 'low' | 'medium' | 'high' | 'confirmed';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface SOPBranch {
  id: string;
  condition: string;
  result: string;
  nextAction: string;
  nextCaseId?: string;
  evidence?: string[];
}

export interface InvestigationStep {
  id: string;
  action: string;
  purpose: string;
  command?: string;
  expectedObservation: string;
  possibleResults: string[];
  evidence: string[];
  notes?: string;
}

export interface SOPCase {
  id: string;
  category: SOPCategoryId;
  title: string;
  summary: string;
  whenToUse: string[];
  prerequisites: string[];
  observations: string[];
  initialChecks: string[];
  steps: InvestigationStep[];
  branches: SOPBranch[];
  alternativePaths: string[];
  evidenceToRecord: string[];
  stopConditions: string[];
  relatedCases: string[];
  estimatedTime: string;
  difficulty: Difficulty;
  tags: string[];
}

export interface EvidenceFinding {
  id: string;
  timestamp: string;
  category: SOPCategoryId;
  source: string;
  target: string;
  observation: string;
  interpretation: string;
  confidence: Confidence;
  evidenceType: string;
  command?: string;
  output?: string;
  file?: string;
  offset?: string;
  hash?: string;
  relatedCase?: string;
  status: 'candidate' | 'confirmed' | 'dead-end';
  notes?: string;
}

export interface VulnerabilityReference {
  id: string;
  name: string;
  summary: string;
  whereItOccurs: string[];
  cases: string[];
  observations: string[];
  validation: string[];
  normalBehavior: string[];
  interestingBehavior: string[];
  branches: string[];
  evidence: string[];
  falsePositives: string[];
  remediation: string[];
  related: string[];
  tags: string[];
}

export interface SOPSection {
  id: SOPCategoryId;
  number: string;
  title: string;
  description: string;
}


export type FlagLogStatus = 'candidate' | 'confirmed' | 'duplicate' | 'rejected';

export interface FlagLogEntry {
  id: string;
  timestamp: string;
  category: SOPCategoryId;
  source: string;
  location: string;
  flag: string;
  status: FlagLogStatus;
  confidence: Confidence;
  evidence: string;
  verification: string;
  notes: string;
}
