import { describe, it, expect } from 'vitest';
import { generateTcpdumpCommand } from '../lib/packetCommandGenerator';
describe('packet command generator', () =>
  it('creates a filtered command', () =>
    expect(
      generateTcpdumpCommand({
        interfaceName: 'eth0',
        protocol: 'tcp',
        port: '443',
      }),
    ).toBe('tcpdump -i eth0 -nn tcp and port 443')));
