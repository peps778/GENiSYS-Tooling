export type OSINTCategory =
  | 'overview'
  | 'quick-reference'
  | 'dns'
  | 'whois'
  | 'subdomains'
  | 'url-domain'
  | 'metadata'
  | 'search'
  | 'username-email'
  | 'public-evidence'
  | 'tools'
  | 'evidence-workflow'
  | 'cases'
  | 'logbook';

export type OSINTDifficulty = 'foundational' | 'intermediate' | 'advanced';
export type OSINTPhase =
  | 'discovery'
  | 'enumeration'
  | 'correlation'
  | 'validation'
  | 'evidence'
  | 'reporting';
export type EvidenceClassification =
  | 'observed'
  | 'corroborated'
  | 'unverified'
  | 'contradicted'
  | 'historical'
  | 'current'
  | 'archived'
  | 'derived';

export interface OSINTCase {
  id: string;
  title: string;
  category: Exclude<
    OSINTCategory,
    'overview' | 'quick-reference' | 'logbook' | 'cases'
  >;
  difficulty: OSINTDifficulty;
  phase: OSINTPhase;
  situation: string;
  objective: string;
  initialObservation: string;
  collectionMethod: string[];
  validationSteps: string[];
  evidenceToPreserve: string[];
  interpretation: string;
  falsePositiveConsiderations: string[];
  nextSteps: string[];
  stopConditions: string[];
  relatedCases: string[];
  relatedTools: string[];
  evidenceTypes: string[];
  status?: 'lead' | 'active' | 'validated' | 'closed';
}

export interface OSINTReference {
  id: string;
  name: string;
  summary: string;
  command?: string;
  details: string[];
  tags: string[];
}

export interface OSINTTool {
  id: string;
  name: string;
  category: string;
  purpose: string;
  typicalInput: string;
  typicalOutput: string;
  safeUse: string;
  evidenceProduced: string;
  limitations: string;
  relatedTools: string[];
}

export interface OSINTSection {
  id: OSINTCategory;
  number: string;
  title: string;
  description: string;
}

export type OSINTFlagStatus =
  | 'candidate'
  | 'investigating'
  | 'confirmed'
  | 'duplicate'
  | 'rejected'
  | 'needs-review';

export interface OSINTFlagEntry {
  id: string;
  caseId?: string;
  timestamp: string;
  target: string;
  finding: string;
  source: string;
  evidence: string;
  url: string;
  status: OSINTFlagStatus;
  confidence: 'low' | 'medium' | 'high';
  verification: string;
  notes: string;
}

export interface EvidenceRecord {
  id: string;
  sourceUrl: string;
  sourceType: string;
  collectedAt: string;
  timezone: string;
  collector: string;
  description: string;
  relevantPassage: string;
  screenshot?: string;
  downloadedArtifact?: string;
  sha256?: string;
  sourceReliability: 'unknown' | 'low' | 'medium' | 'high';
  corroboratingSources: string[];
  classification: EvidenceClassification;
  confidence: 'low' | 'medium' | 'high';
  notes: string;
}
