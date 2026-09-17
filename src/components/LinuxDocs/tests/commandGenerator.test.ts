import { describe, expect, it } from 'vitest';
import { generatorPurposes } from '../data/generator';
import { generateCommand } from '../lib/commandGenerator';

describe('command generator', () => {
  it('generates a deterministic grep command', () => {
    const purpose = generatorPurposes.find(
      (item) => item.id === 'search-text',
    )!;
    const state = {
      purpose: purpose.id,
      values: {
        pattern: 'failed|denied',
        path: 'auth.log',
        regex: true,
        ignoreCase: true,
        recursive: false,
      },
    };
    expect(generateCommand(purpose, state)).toBe(
      "grep -i -E 'failed|denied' auth.log",
    );
  });

  it('changes command family with the selected purpose', () => {
    const purpose = generatorPurposes.find(
      (item) => item.id === 'scan-services',
    )!;
    const state = {
      purpose: purpose.id,
      values: {
        target: '192.0.2.10',
        mode: 'version',
        ports: '22,80',
        top: '100',
      },
    };
    expect(generateCommand(purpose, state)).toBe('nmap -sV 192.0.2.10');
  });
});
