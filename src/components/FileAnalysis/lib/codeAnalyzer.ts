export type CodeLanguage =
  | 'python'
  | 'javascript'
  | 'java'
  | 'php'
  | 'c'
  | 'csharp'
  | 'go'
  | 'rust'
  | 'ruby'
  | 'shell'
  | 'powershell'
  | 'unknown';

export interface CodeFinding {
  id: string;
  title: string;
  severity: 'high' | 'medium' | 'low' | 'info';
  line: number;
  snippet: string;
  explanation: string;
  nextStep: string;
}

export interface CodeAnalysis {
  language: CodeLanguage;
  lines: number;
  findings: CodeFinding[];
  permutationCandidates: string[];
  shiftCandidates: string[];
}

const RULES: Array<{
  id: string;
  title: string;
  severity: CodeFinding['severity'];
  re: RegExp;
  explanation: string;
  nextStep: string;
}> = [
  {
    id: 'xor',
    title: 'XOR transformation',
    severity: 'medium',
    re: /\^\s*(?:0x[0-9a-f]+|\d+|[a-z_$][\w$]*)/i,
    explanation:
      'XOR is often used in byte-wise obfuscation, simple encryption, and CTF decoders.',
    nextStep:
      'Track the key and whether the operation is applied before or after indexing.',
  },
  {
    id: 'shift',
    title: 'Bitwise shift',
    severity: 'medium',
    re: /(?:<<|>>|>>>|<<=|>>=)\s*(?:\d+|[a-z_$][\w$]*)/i,
    explanation:
      'A shift may pack/unpack bits, implement arithmetic, or participate in a byte transform.',
    nextStep:
      'Check shift width, signedness, masking, and the order of operations.',
  },
  {
    id: 'rotate',
    title: 'Rotate-like expression',
    severity: 'medium',
    re: /(?:<<\s*\w+\s*\|\s*\w+\s*>>|>>\s*\w+\s*\|\s*\w+\s*<<|rol|ror|rotateLeft|rotateRight)/i,
    explanation: 'Combining opposite shifts is a common bit-rotation pattern.',
    nextStep:
      'Verify the complementary shift count and mask the result to the intended word size.',
  },
  {
    id: 'byte-permutation',
    title: 'Byte permutation / index remapping',
    severity: 'high',
    re: /(?:\[.{0,60}(?:i\s*\^\s*\d+|i\s*\*\s*\d+\s*%\s*(?:len\(|\.length)|(?:\(\s*i\s*[+-]\s*\d+\s*\)|i\s*[+-]\s*\d+)\s*%\s*(?:len\(|\w*\.length)|(?:length|len)\s*-\s*1\s*-\s*i|(?:i\s*%\s*\d+)|perm(?:ute|utation)?|shuffle|swap|reverse).{0,60}\]|(?:permute|permutation|shuffle|swapBytes|reverseBytes)\s*\()/i,
    explanation:
      'Index arithmetic or reorder operations may permute bytes rather than transform each byte in place.',
    nextStep:
      'Record the exact source-to-destination index mapping and test whether it is bijective for the buffer length.',
  },
  {
    id: 'byte-mask',
    title: 'Byte mask / truncation',
    severity: 'low',
    re: /(?:&\s*0x(?:ff|FFFF)|&\s*255|(?:0xff|255)\s*&)/i,
    explanation:
      'Masking can constrain values to a byte or word after shifts, arithmetic, or XOR.',
    nextStep:
      'Check whether values are signed and whether masking occurs at each step.',
  },
  {
    id: 'base-conversion',
    title: 'Byte/string conversion',
    severity: 'low',
    re: /(?:fromCharCode|charCodeAt|Uint8Array|bytearray|ord\(|chr\(|pack\(|unpack\(|Buffer\.from|\.encode\(|\.decode\()/i,
    explanation:
      'The code converts between bytes, code points, and strings; encoding choice can change the result.',
    nextStep:
      'Identify UTF-8 versus single-byte encodings and check for values above 255.',
  },
  {
    id: 'dynamic-execution',
    title: 'Dynamic code execution',
    severity: 'high',
    re: /(?:\beval\s*\(|new\s+Function\s*\(|exec\s*\(|assert\s*\(|preg_replace\s*\(.{0,80}\/e)/i,
    explanation:
      'Dynamic execution can hide the final behavior or execute decoded content.',
    nextStep:
      'Decode and inspect the input statically; do not execute untrusted code.',
  },
];

export function analyzeCode(source: string, filename = ''): CodeAnalysis {
  const language = detectLanguage(source, filename);
  const lines = source.split(/\r?\n/);
  const findings: CodeFinding[] = [];
  const seen = new Set<string>();
  lines.forEach((line, index) => {
    for (const rule of RULES) {
      if (!rule.re.test(line)) continue;
      const key = `${rule.id}:${index}`;
      if (seen.has(key)) continue;
      seen.add(key);
      findings.push({
        id: key,
        title: rule.title,
        severity: rule.severity,
        line: index + 1,
        snippet: line.trim().slice(0, 240),
        explanation: rule.explanation,
        nextStep: rule.nextStep,
      });
    }
  });

  const permutationCandidates = lines
    .map((line, i) => ({ line: i + 1, text: line.trim() }))
    .filter(({ text }) =>
      /(?:\[[^\]]*(?:i\s*\^\s*\d+|i\s*\*\s*\d+\s*%|(?:\(\s*i\s*[+-]\s*\d+\s*\)|i\s*[+-]\s*\d+)\s*%|length\s*-\s*1\s*-\s*i|shuffle|permute)|(?:reverse|shuffle|permutation|swapBytes)\s*\()/i.test(
        text,
      ),
    )
    .slice(0, 20)
    .map(({ line, text }) => `L${line}: ${text.slice(0, 180)}`);

  const shiftCandidates = lines
    .map((line, i) => ({ line: i + 1, text: line.trim() }))
    .filter(({ text }) =>
      /(?:<<|>>|>>>|rol|ror|rotateLeft|rotateRight)/i.test(text),
    )
    .slice(0, 20)
    .map(({ line, text }) => `L${line}: ${text.slice(0, 180)}`);

  return {
    language,
    lines: lines.length,
    findings,
    permutationCandidates,
    shiftCandidates,
  };
}

function detectLanguage(source: string, filename: string): CodeLanguage {
  const ext = filename.toLowerCase().split('.').pop();
  if (ext === 'py' || /\bdef\s+\w+\s*\(|\bimport\s+\w+/.test(source))
    return 'python';
  if (
    ext === 'js' ||
    ext === 'jsx' ||
    ext === 'ts' ||
    ext === 'tsx' ||
    /\b(const|let|function)\s+\w+/.test(source)
  )
    return 'javascript';
  if (
    ext === 'java' ||
    /\bpublic\s+(?:static\s+)?(?:class|void|int|String)\b/.test(source)
  )
    return 'java';
  if (ext === 'php' || /<\?php|\$\w+\s*=/.test(source)) return 'php';
  if (
    ['c', 'h', 'cpp', 'cc'].includes(ext ?? '') ||
    /#include\s*<|int\s+main\s*\(/.test(source)
  )
    return 'c';
  if (ext === 'cs' || /\busing\s+System\b|\bnamespace\s+\w+/.test(source))
    return 'csharp';
  if (ext === 'go' || /\bpackage\s+main\b|\bfunc\s+\w+\s*\(/.test(source))
    return 'go';
  if (ext === 'rs' || /\bfn\s+main\s*\(|\blet\s+mut\b/.test(source))
    return 'rust';
  if (ext === 'rb' || /\bdef\s+\w+|\bputs\s+/.test(source)) return 'ruby';
  if (
    ['sh', 'bash', 'zsh'].includes(ext ?? '') ||
    /^#!.*\b(?:ba)?sh\b/m.test(source)
  )
    return 'shell';
  if (
    ['ps1', 'psm1'].includes(ext ?? '') ||
    /\$PSVersionTable|\bWrite-Output\b/.test(source)
  )
    return 'powershell';
  return 'unknown';
}
