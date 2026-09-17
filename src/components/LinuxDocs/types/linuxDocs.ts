export type CommandCategory =
  | 'core'
  | 'text'
  | 'forensics'
  | 'process'
  | 'network'
  | 'dns'
  | 'web'
  | 'nmap'
  | 'logs'
  | 'security';

export interface CommandExample {
  description: string;
  command: string;
  authorizedOnly?: boolean;
}

export interface CommandFlag {
  flag: string;
  description: string;
}

export interface LinuxCommand {
  id: string;
  name: string;
  category: CommandCategory;
  description: string;
  syntax: string;
  examples: CommandExample[];
  flags: CommandFlag[];
  notes: string[];
  tags: string[];
}

export interface CommandCategoryInfo {
  id: CommandCategory;
  label: string;
  description: string;
}

export interface KaliTool {
  name: string;
  purpose: string;
  command: string;
  category: string;
  tags: string[];
}

export interface MetasploitReference {
  command: string;
  purpose: string;
  example: string;
  notes: string[];
}

export interface KatanaReference {
  command: string;
  purpose: string;
  example: string;
  tags: string[];
}

export interface PythonOneLiner {
  title: string;
  purpose: string;
  command: string;
  notes: string[];
}

export interface Hack4GovItem {
  title: string;
  purpose: string;
  command: string;
  phase: 'triage' | 'web' | 'dns' | 'forensics' | 'logs' | 'evidence';
}

export interface PipelineStep {
  title: string;
  purpose: string;
  command: string;
}

export interface Pipeline {
  id: string;
  name: string;
  description: string;
  steps: PipelineStep[];
}

export type GeneratorPurposeId =
  | 'search-text'
  | 'inspect-binary'
  | 'find-files'
  | 'inspect-http'
  | 'scan-services'
  | 'extract-json'
  | 'search-logs'
  | 'calculate-hash';

export type GeneratorFieldType = 'text' | 'select' | 'number' | 'boolean';

export interface GeneratorOption {
  label: string;
  value: string;
}

export interface GeneratorAttribute {
  id: string;
  label: string;
  type: GeneratorFieldType;
  placeholder?: string;
  defaultValue?: string;
  options?: GeneratorOption[];
  required?: boolean;
}

export interface GeneratorPurpose {
  id: GeneratorPurposeId;
  label: string;
  description: string;
  attributes: GeneratorAttribute[];
}

export interface GeneratorState {
  purpose: GeneratorPurposeId;
  values: Record<string, string | boolean>;
}

export interface SearchResult {
  command: LinuxCommand;
  score: number;
  matchedFields: string[];
}

export interface ValidationResult {
  valid: boolean;
  issues: string[];
}

export interface CategoryCount {
  category: CommandCategory;
  count: number;
}
