import type { GeneratorPurpose, GeneratorState } from '../types/linuxDocs';
import { validateGeneratedCommand } from './commandValidation';

const value = (state: GeneratorState, key: string, fallback = '') => {
  const current = state.values[key];
  return current === undefined ? fallback : String(current);
};

const flag = (condition: boolean, text: string) => (condition ? text : '');

export function generateCommand(
  purpose: GeneratorPurpose,
  state: GeneratorState,
): string {
  const v = (key: string, fallback = '') => value(state, key, fallback);

  switch (purpose.id) {
    case 'search-text': {
      const pattern = v('pattern', 'pattern').replace(/'/g, "'\\''");
      const path = v('path', '.');
      return `grep ${flag(Boolean(state.values.ignoreCase), '-i ')}${flag(Boolean(state.values.regex), '-E ')}${flag(Boolean(state.values.recursive), '-r ')}'${pattern}' ${path}`.trim();
    }
    case 'inspect-binary': {
      const tool = v('tool', 'file');
      const path = v('path', 'artifact.bin');
      if (tool === 'file') return `file --mime ${path}`;
      if (tool === 'strings') return `strings ${path}`;
      if (tool === 'xxd') return `xxd -l ${v('bytes', '64')} ${path}`;
      return `hexdump -C ${path}`;
    }
    case 'find-files': {
      const parts = [`find ${v('path', '.')}`, `-type ${v('type', 'f')}`];
      if (v('name')) parts.push(`-name '${v('name').replace(/'/g, "'\\''")}'`);
      if (v('mtime')) parts.push(`-mtime -${v('mtime')}`);
      return parts.join(' ');
    }
    case 'inspect-http': {
      const url = v('url', 'https://example.test/');
      const mode = v('mode', 'headers');
      const token = v('token');
      const auth = token
        ? ` -H 'Authorization: Bearer ${token.replace(/'/g, "'\\''")}'`
        : '';
      if (mode === 'json')
        return `curl -sS -H 'Accept: application/json'${auth} ${url}`;
      if (mode === 'redirects') return `curl -iL${auth} ${url}`;
      if (mode === 'post')
        return `curl -sS -X POST -H 'Content-Type: application/json'${auth} -d '{}' ${url}`;
      return `curl -I${auth} ${url}`;
    }
    case 'scan-services': {
      const target = v('target', '192.0.2.10');
      const mode = v('mode', 'ports');
      if (mode === 'discovery') return `nmap -sn ${target}`;
      if (mode === 'version') return `nmap -sV ${target}`;
      if (mode === 'top')
        return `nmap --top-ports ${v('top', '100')} ${target}`;
      return `nmap -p ${v('ports', '22,80,443')} ${target}`;
    }
    case 'extract-json':
      return `jq '${v('expression', '.').replace(/'/g, "'\\''")}' ${v('path', 'response.json')}`;
    case 'search-logs':
      return `grep ${flag(Boolean(state.values.lines), '-n ')}${flag(Boolean(state.values.ignoreCase), '-i ')}-E '${v('pattern', 'error|failed')}' ${v('path', 'app.log')}`.trim();
    case 'calculate-hash':
      return `${v('algorithm', 'sha256')}sum ${v('path', 'artifact.bin')}`;
    default:
      return '';
  }
}

export function generateValidatedCommand(
  purpose: GeneratorPurpose,
  state: GeneratorState,
) {
  const command = generateCommand(purpose, state);
  return { command, validation: validateGeneratedCommand(command) };
}
