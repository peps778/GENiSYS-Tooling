import type { KatanaReference } from '../types/linuxDocs';

export const katanaReferences: KatanaReference[] = [
  {
    command: 'katana -u URL',
    purpose: 'Basic crawl of an approved web target.',
    example: 'katana -u https://example.test',
    tags: ['crawl', 'basic'],
  },
  {
    command: 'katana -u URL -d 3',
    purpose: 'Limit crawl depth.',
    example: 'katana -u https://example.test -d 3',
    tags: ['depth', 'crawl'],
  },
  {
    command: 'katana -u URL -jc',
    purpose: 'Parse JavaScript content during crawling.',
    example: 'katana -u https://example.test -jc',
    tags: ['javascript', 'endpoints'],
  },
  {
    command: 'katana -u URL -o endpoints.txt',
    purpose: 'Write discovered URLs to a file.',
    example: 'katana -u https://example.test -o endpoints.txt',
    tags: ['output', 'evidence'],
  },
  {
    command: 'katana -list targets.txt',
    purpose: 'Crawl multiple targets from a file.',
    example: 'katana -list targets.txt -o crawl.txt',
    tags: ['multiple-targets', 'batch'],
  },
  {
    command: 'katana -u URL -silent | sort -u',
    purpose: 'Produce quiet, sorted, deduplicated URL output.',
    example: 'katana -u https://example.test -silent | sort -u',
    tags: ['sorting', 'dedupe'],
  },
  {
    command: "katana -u URL | grep -Ei '/(api|admin|login|graphql)'",
    purpose: 'Filter discovered endpoints for common application areas.',
    example:
      "katana -u https://example.test | grep -Ei '/(api|admin|login|graphql)'",
    tags: ['api', 'admin', 'login', 'graphql'],
  },
];
