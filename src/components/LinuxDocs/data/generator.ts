import type { GeneratorPurpose } from '../types/linuxDocs';

export const generatorPurposes: GeneratorPurpose[] = [
  {
    id: 'search-text',
    label: 'Search text',
    description:
      'Build a read-only grep command for text, logs, or regex patterns.',
    attributes: [
      {
        id: 'pattern',
        label: 'Pattern',
        type: 'text',
        placeholder: 'failed|denied|invalid',
        required: true,
      },
      {
        id: 'path',
        label: 'Target/path',
        type: 'text',
        defaultValue: '.',
        required: true,
      },
      {
        id: 'regex',
        label: 'Use extended regex',
        type: 'boolean',
        defaultValue: 'true',
      },
      {
        id: 'ignoreCase',
        label: 'Ignore case',
        type: 'boolean',
        defaultValue: 'true',
      },
      {
        id: 'recursive',
        label: 'Recursive',
        type: 'boolean',
        defaultValue: 'false',
      },
    ],
  },
  {
    id: 'inspect-binary',
    label: 'Inspect binary',
    description: 'Generate a compact file, strings, or hex inspection command.',
    attributes: [
      {
        id: 'tool',
        label: 'Inspection',
        type: 'select',
        defaultValue: 'file',
        options: [
          { label: 'file', value: 'file' },
          { label: 'strings', value: 'strings' },
          { label: 'xxd', value: 'xxd' },
          { label: 'hexdump', value: 'hexdump' },
        ],
      },
      {
        id: 'path',
        label: 'Target/path',
        type: 'text',
        defaultValue: 'artifact.bin',
        required: true,
      },
      {
        id: 'bytes',
        label: 'Preview bytes',
        type: 'number',
        defaultValue: '64',
      },
    ],
  },
  {
    id: 'find-files',
    label: 'Find files',
    description: 'Generate a read-only find expression by name, type, or age.',
    attributes: [
      {
        id: 'path',
        label: 'Start path',
        type: 'text',
        defaultValue: '.',
        required: true,
      },
      { id: 'name', label: 'Name pattern', type: 'text', placeholder: '*.log' },
      {
        id: 'type',
        label: 'Type',
        type: 'select',
        defaultValue: 'f',
        options: [
          { label: 'file', value: 'f' },
          { label: 'directory', value: 'd' },
          { label: 'symlink', value: 'l' },
        ],
      },
      {
        id: 'mtime',
        label: 'Modified within days',
        type: 'number',
        placeholder: '2',
      },
    ],
  },
  {
    id: 'inspect-http',
    label: 'Inspect HTTP',
    description:
      'Build a curl request for response headers, JSON, redirects, or an authorized POST.',
    attributes: [
      {
        id: 'url',
        label: 'URL',
        type: 'text',
        defaultValue: 'https://example.test/',
        required: true,
      },
      {
        id: 'mode',
        label: 'Request',
        type: 'select',
        defaultValue: 'headers',
        options: [
          { label: 'headers', value: 'headers' },
          { label: 'GET JSON', value: 'json' },
          { label: 'follow redirects', value: 'redirects' },
          { label: 'POST JSON', value: 'post' },
        ],
      },
      {
        id: 'token',
        label: 'Bearer token',
        type: 'text',
        placeholder: 'optional; never use real secrets in shared notes',
      },
    ],
  },
  {
    id: 'scan-services',
    label: 'Scan services',
    description: 'Generate a focused Nmap command for an authorized target.',
    attributes: [
      {
        id: 'target',
        label: 'Target',
        type: 'text',
        defaultValue: '192.0.2.10',
        required: true,
      },
      {
        id: 'mode',
        label: 'Scan mode',
        type: 'select',
        defaultValue: 'ports',
        options: [
          { label: 'host discovery', value: 'discovery' },
          { label: 'selected ports', value: 'ports' },
          { label: 'service/version', value: 'version' },
          { label: 'top ports', value: 'top' },
        ],
      },
      { id: 'ports', label: 'Ports', type: 'text', defaultValue: '22,80,443' },
      { id: 'top', label: 'Top ports', type: 'number', defaultValue: '100' },
    ],
  },
  {
    id: 'extract-json',
    label: 'Extract JSON',
    description: 'Generate a jq expression for a local JSON response.',
    attributes: [
      {
        id: 'path',
        label: 'JSON file',
        type: 'text',
        defaultValue: 'response.json',
        required: true,
      },
      {
        id: 'expression',
        label: 'jq expression',
        type: 'text',
        defaultValue: '.',
        required: true,
      },
    ],
  },
  {
    id: 'search-logs',
    label: 'Search logs',
    description: 'Generate a read-only regex search for a log file.',
    attributes: [
      {
        id: 'path',
        label: 'Log path',
        type: 'text',
        defaultValue: 'app.log',
        required: true,
      },
      {
        id: 'pattern',
        label: 'Pattern',
        type: 'text',
        defaultValue: 'error|failed|denied',
        required: true,
      },
      {
        id: 'ignoreCase',
        label: 'Ignore case',
        type: 'boolean',
        defaultValue: 'true',
      },
      {
        id: 'lines',
        label: 'Show line numbers',
        type: 'boolean',
        defaultValue: 'true',
      },
    ],
  },
  {
    id: 'calculate-hash',
    label: 'Calculate hash',
    description: 'Generate an integrity/reference hash command.',
    attributes: [
      {
        id: 'algorithm',
        label: 'Algorithm',
        type: 'select',
        defaultValue: 'sha256',
        options: [
          { label: 'SHA-256', value: 'sha256' },
          { label: 'SHA-1 (legacy)', value: 'sha1' },
          { label: 'MD5 (legacy)', value: 'md5' },
        ],
      },
      {
        id: 'path',
        label: 'Artifact/path',
        type: 'text',
        defaultValue: 'artifact.bin',
        required: true,
      },
    ],
  },
];
