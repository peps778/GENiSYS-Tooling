import type { PythonOneLiner } from '../types/linuxDocs';

export const pythonOneLiners: PythonOneLiner[] = [
  {
    title: 'Local HTTP server',
    purpose: 'Serve a local working directory for controlled browser testing.',
    command: 'python3 -m http.server 8000 --bind 127.0.0.1',
    notes: ['Binds to loopback so the service is local-only.'],
  },
  {
    title: 'Read a file',
    purpose: 'Read a text file from Python.',
    command:
      'python3 -c "from pathlib import Path; print(Path(\'notes.txt\').read_text())"',
    notes: [],
  },
  {
    title: 'Binary/hex preview',
    purpose: 'Preview the first 64 bytes of a binary.',
    command:
      "python3 -c \"from pathlib import Path; print(Path('artifact.bin').read_bytes()[:64].hex(' '))\"",
    notes: [],
  },
  {
    title: 'SHA-256',
    purpose: 'Calculate a SHA-256 digest.',
    command:
      "python3 -c \"import hashlib; print(hashlib.sha256(open('artifact.bin','rb').read()).hexdigest())\"",
    notes: [
      'For very large files, use a chunked reader instead of loading the whole file.',
    ],
  },
  {
    title: 'JSON extraction',
    purpose: 'Extract a field from JSON.',
    command:
      "python3 -c \"import json; d=json.load(open('response.json')); print(d.get('data'))\"",
    notes: [],
  },
  {
    title: 'Stdin processing',
    purpose: 'Read standard input and emit normalized lines.',
    command:
      'python3 -c "import sys; print(\'\\n\'.join(x.strip() for x in sys.stdin if x.strip()))"',
    notes: [],
  },
  {
    title: 'Text normalization',
    purpose: 'Lowercase and collapse whitespace.',
    command:
      "python3 -c \"import re,sys; print(re.sub(r'\\\\s+',' ',sys.stdin.read()).strip().lower())\"",
    notes: [],
  },
  {
    title: 'TCP connectivity',
    purpose: 'Test TCP connectivity to an approved host and port.',
    command:
      "python3 -c \"import socket; s=socket.create_connection(('192.0.2.10',443),3); print('connected'); s.close()\"",
    notes: ['Use only against approved endpoints.'],
  },
  {
    title: 'Simple parsing',
    purpose:
      'Print the first two whitespace-separated fields from each stdin line.',
    command:
      'python3 -c "import sys; [print(*(x.split()[:2])) for x in sys.stdin if x.strip()]"',
    notes: [],
  },
];
