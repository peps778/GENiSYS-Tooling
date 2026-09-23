import { describe, expect, it } from 'vitest';
import { OSINT_CASES } from '../data/cases';
import { OSINT_SECTIONS } from '../data/sections';
import { osintTools, OSINT_TOOL_SCENARIOS } from '../data/osintTools';
import { searchOSINTCases } from '../lib/osintSearch';

describe('OSINT dataset integrity', () => {
  it('has unique deterministic case IDs', () => {
    const ids = OSINT_CASES.map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => /^CASE-OSINT-[A-Z]+-\d{3}$/.test(id))).toBe(true);
  });

  it('has the requested case coverage', () => {
    const count = (category: string) =>
      OSINT_CASES.filter((x) => x.category === category).length;
    expect(count('dns')).toBeGreaterThanOrEqual(50);
    expect(count('whois')).toBeGreaterThanOrEqual(30);
    expect(count('subdomains')).toBeGreaterThanOrEqual(50);
    expect(count('url-domain')).toBeGreaterThanOrEqual(50);
    expect(count('metadata')).toBeGreaterThanOrEqual(50);
    expect(count('search')).toBeGreaterThanOrEqual(50);
    expect(count('username-email')).toBeGreaterThanOrEqual(100);
    expect(count('public-evidence')).toBeGreaterThanOrEqual(50);
    expect(OSINT_CASES.length).toBeGreaterThanOrEqual(250);
  });

  it('requires every case field used by the detail view', () => {
    for (const item of OSINT_CASES) {
      expect(item.id).toBeTruthy();
      expect(item.title).toBeTruthy();
      expect(item.situation).toBeTruthy();
      expect(item.objective).toBeTruthy();
      expect(item.initialObservation).toBeTruthy();
      expect(item.collectionMethod.length).toBeGreaterThan(0);
      expect(item.validationSteps.length).toBeGreaterThan(0);
      expect(item.evidenceToPreserve.length).toBeGreaterThan(0);
      expect(item.falsePositiveConsiderations.length).toBeGreaterThan(0);
      expect(item.nextSteps.length).toBeGreaterThan(0);
      expect(item.stopConditions.length).toBeGreaterThan(0);
      expect(item.relatedCases.every((id) => id !== item.id)).toBe(true);
    }
  });

  it('has at least 100 tool scenarios', () => {
    expect(osintTools.length).toBeGreaterThan(0);
    expect(OSINT_TOOL_SCENARIOS.length).toBeGreaterThanOrEqual(100);
    expect(new Set(OSINT_TOOL_SCENARIOS.map((x) => x.id)).size).toBe(
      OSINT_TOOL_SCENARIOS.length,
    );
  });

  it('has every navigation section', () => {
    const titles = OSINT_SECTIONS.map((x) => x.title);
    for (const title of [
      'Overview',
      'Quick Reference',
      'DNS Enumeration',
      'WHOIS',
      'Subdomains',
      'URL & Domain Analysis',
      'Metadata',
      'Search Operators',
      'Username / Email Investigation',
      'Public-Source Evidence',
      'OSINT Tools',
      'Evidence Workflow',
      'Investigation Cases',
      'Flag Logbook',
    ]) {
      expect(titles).toContain(title);
    }
  });

  it('search is deterministic and empty query returns the source dataset', () => {
    expect(searchOSINTCases(OSINT_CASES, '')).toHaveLength(OSINT_CASES.length);
    expect(
      searchOSINTCases(OSINT_CASES, 'dangling CNAME').length,
    ).toBeGreaterThan(0);
  });
});
