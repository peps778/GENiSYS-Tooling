/**
 * heapSnapshotParser.test.ts
 *
 * Written for Vitest (describe/it/expect from "vitest"). The APIs used
 * are also Jest-compatible if this project uses Jest instead — just
 * swap the import.
 */
import { describe, expect, it } from 'vitest';
import {
  detectFormat,
  extractPrintableStrings,
  extractV8Strings,
  isV8SnapshotShape,
  parseHeapSnapshot,
} from '../lib/heapSnapshotParser';

function toBuffer(text: string): ArrayBuffer {
  return new TextEncoder().encode(text).buffer;
}

const VALID_V8_SNAPSHOT = {
  snapshot: {
    meta: { node_fields: [] },
    node_count: 3,
    edge_count: 2,
  },
  nodes: [],
  edges: [],
  strings: [
    'hello world',
    'API_KEY=abc123def456ghi789',
    'https://internal.example.com/api/v1/users',
  ],
};

describe('isV8SnapshotShape', () => {
  it('accepts a well-formed V8 snapshot object', () => {
    expect(isV8SnapshotShape(VALID_V8_SNAPSHOT)).toBe(true);
  });

  it('rejects plain objects without a snapshot/strings shape', () => {
    expect(isV8SnapshotShape({ foo: 'bar' })).toBe(false);
  });

  it('rejects arrays and primitives', () => {
    expect(isV8SnapshotShape([1, 2, 3])).toBe(false);
    expect(isV8SnapshotShape('string')).toBe(false);
    expect(isV8SnapshotShape(null)).toBe(false);
  });
});

describe('detectFormat', () => {
  it('detects a valid V8 JSON snapshot', () => {
    const result = detectFormat(toBuffer(JSON.stringify(VALID_V8_SNAPSHOT)));
    expect(result.format).toBe('v8-json');
  });

  it('flags malformed JSON that starts like an object', () => {
    const result = detectFormat(toBuffer('{"snapshot": { "node_count": 1, '));
    expect(result.format).toBe('malformed');
  });

  it('flags valid JSON that is not a heap snapshot as unknown', () => {
    const result = detectFormat(toBuffer(JSON.stringify({ hello: 'world' })));
    expect(result.format).toBe('unknown');
  });

  it('flags non-JSON binary-ish content as unknown', () => {
    const result = detectFormat(
      toBuffer('\x00\x01BINARYDATA\x02\x03 some printable text'),
    );
    expect(result.format).toBe('unknown');
  });

  it('treats an empty buffer as malformed', () => {
    const result = detectFormat(new ArrayBuffer(0));
    expect(result.format).toBe('malformed');
  });
});

describe('extractV8Strings', () => {
  it("returns only the string entries from a snapshot's strings table", () => {
    const strings = extractV8Strings(VALID_V8_SNAPSHOT);
    expect(strings).toHaveLength(3);
    expect(strings).toContain('hello world');
  });

  it('returns an empty array when strings is missing', () => {
    expect(extractV8Strings({})).toEqual([]);
  });
});

describe('extractPrintableStrings', () => {
  it('extracts printable ASCII runs at or above the minimum length', () => {
    const bytes = new Uint8Array([
      0x00,
      0x00, // non-printable
      ...Array.from('password123').map((c) => c.charCodeAt(0)),
      0x01,
      ...Array.from('ab').map((c) => c.charCodeAt(0)), // shorter than default min length
      0x00,
      ...Array.from('secret-token').map((c) => c.charCodeAt(0)),
    ]);
    const result = extractPrintableStrings(bytes.buffer);
    expect(result).toContain('password123');
    expect(result).toContain('secret-token');
    expect(result).not.toContain('ab');
  });

  it('respects a custom minimum length', () => {
    const bytes = new Uint8Array(Array.from('ab').map((c) => c.charCodeAt(0)));
    expect(extractPrintableStrings(bytes.buffer, 2)).toEqual(['ab']);
    expect(extractPrintableStrings(bytes.buffer, 3)).toEqual([]);
  });

  it('handles empty input without throwing', () => {
    expect(extractPrintableStrings(new ArrayBuffer(0))).toEqual([]);
  });

  it('handles a very large contiguous printable run without stack overflow', () => {
    const large = 'x'.repeat(500_000);
    const bytes = new TextEncoder().encode(large);
    const result = extractPrintableStrings(bytes.buffer);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveLength(500_000);
  });
});

describe('parseHeapSnapshot', () => {
  it('parses a valid V8 snapshot end-to-end', () => {
    const buffer = toBuffer(JSON.stringify(VALID_V8_SNAPSHOT));
    const { summary, strings } = parseHeapSnapshot(
      buffer,
      'dump.heapsnapshot',
      buffer.byteLength,
    );
    expect(summary.format).toBe('v8-json');
    expect(summary.stringCount).toBe(3);
    expect(summary.nodeCount).toBe(3);
    expect(summary.edgeCount).toBe(2);
    expect(strings).toContain('https://internal.example.com/api/v1/users');
  });

  it('falls back to printable-string extraction for malformed JSON', () => {
    const text = '{"snapshot": broken json here "api_key": "abc123secretvalue"';
    const buffer = toBuffer(text);
    const { summary, strings } = parseHeapSnapshot(
      buffer,
      'broken.snapshot',
      buffer.byteLength,
    );
    expect(summary.format).toBe('malformed');
    expect(summary.warnings.length).toBeGreaterThan(0);
    expect(strings.join(' ')).toContain('api_key');
  });

  it('falls back to printable-string extraction for unknown/unsupported formats', () => {
    const text =
      'FIREFOX_HEAP_DUMP_V1 some binary-ish payload with readable-token-value';
    const buffer = toBuffer(text);
    const { summary, strings } = parseHeapSnapshot(
      buffer,
      'firefox.dump',
      buffer.byteLength,
    );
    expect(summary.format).toBe('unknown');
    expect(strings.join(' ')).toContain('readable-token-value');
  });

  it('handles empty input gracefully', () => {
    const buffer = new ArrayBuffer(0);
    const { summary, strings } = parseHeapSnapshot(buffer, 'empty.bin', 0);
    expect(summary.format).toBe('malformed');
    expect(strings).toEqual([]);
    expect(summary.stringCount).toBe(0);
  });

  it('surfaces a warning for very large files without crashing', () => {
    const buffer = toBuffer('a'.repeat(1000));
    const { summary } = parseHeapSnapshot(
      buffer,
      'huge.dump',
      250 * 1024 * 1024,
    );
    expect(
      summary.warnings.some((w) => w.toLowerCase().includes('large')),
    ).toBe(true);
  });
});
