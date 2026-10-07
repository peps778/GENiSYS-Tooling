export type ExecutableFormat = 'ELF' | 'PE' | 'Mach-O' | 'Unknown';

export interface ExecutableSection {
  name: string;
  offset: number;
  size: number;
  virtualAddress: number;
  flags: string;
}

export interface DisassembledInstruction {
  offset: number;
  address: number;
  bytes: string;
  mnemonic: string;
  operands: string;
  pseudo: string;
  confidence: 'decoded' | 'heuristic' | 'unknown';
}

export interface ExecutableAnalysis {
  format: ExecutableFormat;
  architecture: string;
  bits: 32 | 64 | null;
  entryPoint: number | null;
  entryFileOffset: number | null;
  sections: ExecutableSection[];
  imports: string[];
  exports: string[];
  strings: string[];
  instructions: DisassembledInstruction[];
  notes: string[];
}

const u16le = (d: Uint8Array, o: number) =>
  o + 2 <= d.length ? d[o] | (d[o + 1] << 8) : 0;
const u32le = (d: Uint8Array, o: number) =>
  o + 4 <= d.length
    ? (d[o] | (d[o + 1] << 8) | (d[o + 2] << 16) | (d[o + 3] << 24)) >>> 0
    : 0;
const u64le = (d: Uint8Array, o: number): number => {
  if (o + 8 > d.length) return 0;
  const lo = u32le(d, o);
  const hi = u32le(d, o + 4);
  return hi * 0x100000000 + lo;
};
const ascii = (d: Uint8Array, o: number, n: number) =>
  new TextDecoder('ascii')
    .decode(d.subarray(o, Math.min(d.length, o + n)))
    .replace(/\0.*$/, '');

function hexBytes(d: Uint8Array, o: number, n: number) {
  return Array.from(d.subarray(o, Math.min(d.length, o + n)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(' ');
}

function readCString(d: Uint8Array, o: number, limit = 240) {
  let s = '';
  for (let i = o; i < Math.min(d.length, o + limit); i++) {
    if (d[i] === 0) break;
    if (d[i] < 0x20 || d[i] > 0x7e) break;
    s += String.fromCharCode(d[i]);
  }
  return s;
}

function mapElfVaToFileOffset(sections: ExecutableSection[], address: number) {
  const section = sections.find(
    (s) =>
      address >= s.virtualAddress &&
      address < s.virtualAddress + Math.max(s.size, 1),
  );
  return section ? section.offset + (address - section.virtualAddress) : null;
}

function parseElf(data: Uint8Array): ExecutableAnalysis {
  const cls = data[4];
  const bits = cls === 2 ? 64 : cls === 1 ? 32 : null;
  const machine = u16le(data, 18);
  const architecture =
    machine === 0x3
      ? 'x86'
      : machine === 0x3e
        ? 'x86-64'
        : machine === 0x28
          ? 'ARM'
          : machine === 0xb7
            ? 'AArch64'
            : `ELF machine 0x${machine.toString(16)}`;
  const entryPoint = bits === 64 ? u64le(data, 24) : u32le(data, 24);
  const shoff = bits === 64 ? u64le(data, 40) : u32le(data, 32);
  const shentsize = u16le(data, bits === 64 ? 58 : 46);
  const shnum = u16le(data, bits === 64 ? 60 : 48);
  const shstrndx = u16le(data, bits === 64 ? 62 : 50);
  const sections: ExecutableSection[] = [];
  if (shoff && shentsize && shnum && shoff + shentsize * shnum <= data.length) {
    const raw: Array<{
      name: number;
      type: number;
      offset: number;
      size: number;
      addr: number;
      flags: number;
    }> = [];
    for (let i = 0; i < shnum; i++) {
      const o = shoff + i * shentsize;
      const name = u32le(data, o);
      const type = u32le(data, o + 4);
      const flags = bits === 64 ? u64le(data, o + 8) : u32le(data, o + 8);
      const addr = bits === 64 ? u64le(data, o + 16) : u32le(data, o + 12);
      const offset = bits === 64 ? u64le(data, o + 24) : u32le(data, o + 16);
      const size = bits === 64 ? u64le(data, o + 32) : u32le(data, o + 20);
      raw.push({ name, type, offset, size, addr, flags });
    }
    const str = raw[shstrndx];
    for (const s of raw) {
      const name =
        str && str.offset + s.name < data.length
          ? readCString(data, str.offset + s.name)
          : '';
      const executable = (s.flags & 0x4) !== 0;
      sections.push({
        name: name || `<section ${sections.length}>`,
        offset: s.offset,
        size: s.size,
        virtualAddress: s.addr,
        flags: executable ? 'X' : (s.flags & 0x2) !== 0 ? 'W' : 'R',
      });
    }
  }
  const entryFileOffset = mapElfVaToFileOffset(sections, entryPoint);
  const codeSection =
    sections.find((s) => s.name === '.text' && s.offset < data.length) ??
    sections.find((s) => s.flags.includes('X') && s.offset < data.length);
  const instructions = codeSection
    ? disassembleX86(
        data,
        codeSection.offset,
        Math.min(codeSection.size, 8192),
        codeSection.virtualAddress,
      )
    : [];
  const strings = extractInterestingStrings(data);
  return {
    format: 'ELF',
    architecture,
    bits,
    entryPoint,
    entryFileOffset,
    sections,
    imports: strings.filter((s) =>
      /^(?:puts|printf|scanf|strcmp|strncmp|strcpy|memcpy|system|execve|open|read|write|socket|connect|gets|fgets|malloc|free)$/i.test(
        s,
      ),
    ),
    exports: [],
    strings,
    instructions,
    notes: [
      'ELF structure was parsed from the file header and section table.',
      entryFileOffset == null
        ? 'The entry point could not be mapped through the available section table.'
        : `Entry point maps to file offset 0x${entryFileOffset.toString(16)}.`,
      'The instruction view is a lightweight browser decoder for common x86/x86-64 opcodes, not a replacement for a full native disassembler.',
    ],
  };
}

function parsePe(data: Uint8Array): ExecutableAnalysis {
  const pe = u32le(data, 0x3c);
  if (pe < 0x40 || pe + 24 > data.length || ascii(data, pe, 2) !== 'PE') {
    return {
      format: 'PE',
      architecture: 'invalid PE',
      bits: null,
      entryPoint: null,
      entryFileOffset: null,
      sections: [],
      imports: [],
      exports: [],
      strings: [],
      instructions: [],
      notes: [
        'MZ header exists, but the PE header pointer/signature is invalid.',
      ],
    };
  }
  const machine = u16le(data, pe + 4);
  const numberOfSections = u16le(data, pe + 6);
  const optional = pe + 24;
  const magic = u16le(data, optional);
  const bits = magic === 0x20b ? 64 : magic === 0x10b ? 32 : null;
  const architecture =
    machine === 0x8664
      ? 'x86-64'
      : machine === 0x14c
        ? 'x86'
        : `PE machine 0x${machine.toString(16)}`;
  const entryRva = u32le(data, optional + 16);
  const sectionTable = optional + (bits === 64 ? 240 : 224);
  const sections: ExecutableSection[] = [];
  for (let i = 0; i < numberOfSections; i++) {
    const o = sectionTable + i * 40;
    if (o + 40 > data.length) break;
    const name = ascii(data, o, 8);
    const virtualSize = u32le(data, o + 8);
    const virtualAddress = u32le(data, o + 12);
    const rawSize = u32le(data, o + 16);
    const rawOffset = u32le(data, o + 20);
    const characteristics = u32le(data, o + 36);
    sections.push({
      name,
      offset: rawOffset,
      size: rawSize,
      virtualAddress,
      flags: `${characteristics & 0x20000000 ? 'X' : ''}${characteristics & 0x80000000 ? 'W' : 'R'}`,
    });
    void virtualSize;
  }
  const section = sections.find(
    (s) => entryRva >= s.virtualAddress && entryRva < s.virtualAddress + s.size,
  );
  const entryFileOffset = section
    ? section.offset + entryRva - section.virtualAddress
    : null;
  const instructions =
    section && entryFileOffset != null
      ? disassembleX86(
          data,
          entryFileOffset,
          Math.min(section.size - (entryFileOffset - section.offset), 8192),
          section.virtualAddress,
        )
      : [];
  const strings = extractInterestingStrings(data);
  return {
    format: 'PE',
    architecture,
    bits,
    entryPoint: entryRva,
    entryFileOffset,
    sections,
    imports: strings.filter((s) =>
      /^(?:kernel32|user32|advapi32|ws2_32|wininet|urlmon|ntdll|msvcrt|printf|scanf|strcmp|strcpy|memcpy|system|CreateFile|VirtualAlloc|WinExec|ShellExecute)$/i.test(
        s,
      ),
    ),
    exports: [],
    strings,
    instructions,
    notes: [
      'PE headers and section table were parsed in-browser.',
      entryFileOffset == null
        ? 'The PE entry RVA could not be mapped to a raw file offset.'
        : `Entry RVA 0x${entryRva.toString(16)} maps to file offset 0x${entryFileOffset.toString(16)}.`,
      'The instruction view is a lightweight x86/x86-64 decoder; use a full disassembler for unsupported instructions.',
    ],
  };
}

function extractInterestingStrings(data: Uint8Array): string[] {
  const out: string[] = [];
  let s = '';
  for (let i = 0; i < data.length; i++) {
    const b = data[i];
    if (b >= 0x20 && b <= 0x7e) s += String.fromCharCode(b);
    else {
      if (s.length >= 4) out.push(s.slice(0, 240));
      s = '';
    }
    if (out.length >= 500) break;
  }
  if (s.length >= 4 && out.length < 500) out.push(s.slice(0, 240));
  return [...new Set(out)];
}

function reg32(code: number) {
  return ['eax', 'ecx', 'edx', 'ebx', 'esp', 'ebp', 'esi', 'edi'][code & 7];
}

function disassembleX86(
  data: Uint8Array,
  offset: number,
  length: number,
  address: number,
): DisassembledInstruction[] {
  const out: DisassembledInstruction[] = [];
  const end = Math.min(data.length, offset + length);
  let i = offset;
  while (i < end && out.length < 800) {
    const start = i;
    const op = data[i++];
    let mnemonic = 'db';
    let operands = `0x${op.toString(16).padStart(2, '0')}`;
    let pseudo = `/* unknown opcode 0x${op.toString(16).padStart(2, '0')} */`;
    let size = 1;
    let confidence: DisassembledInstruction['confidence'] = 'unknown';
    if (op === 0x90) {
      mnemonic = 'nop';
      operands = '';
      pseudo = '/* no operation */';
      confidence = 'decoded';
    } else if (op === 0xc3) {
      mnemonic = 'ret';
      operands = '';
      pseudo = 'return;';
      confidence = 'decoded';
    } else if (op === 0xcc) {
      mnemonic = 'int3';
      operands = '';
      pseudo = '/* debugger breakpoint */';
      confidence = 'decoded';
    } else if (op === 0x55) {
      mnemonic = 'push';
      operands = 'ebp';
      pseudo = 'save_frame();';
      confidence = 'decoded';
    } else if (op === 0x5d) {
      mnemonic = 'pop';
      operands = 'ebp';
      pseudo = 'restore_frame();';
      confidence = 'decoded';
    } else if (op === 0x31 && i < end && data[i] === 0xc0) {
      i++;
      size = 2;
      mnemonic = 'xor';
      operands = 'eax, eax';
      pseudo = 'eax = 0;';
      confidence = 'decoded';
    } else if (op === 0x33 && i < end && data[i] === 0xc0) {
      i++;
      size = 2;
      mnemonic = 'xor';
      operands = 'eax, eax';
      pseudo = 'eax = 0;';
      confidence = 'decoded';
    } else if (op === 0x89 && i < end && data[i] === 0xe5) {
      i++;
      size = 2;
      mnemonic = 'mov';
      operands = 'ebp, esp';
      pseudo = 'frame_pointer = stack_pointer;';
      confidence = 'decoded';
    } else if (op === 0x8b && i < end && data[i] === 0xec) {
      i++;
      size = 2;
      mnemonic = 'mov';
      operands = 'ebp, esp';
      pseudo = 'frame_pointer = stack_pointer;';
      confidence = 'decoded';
    } else if (op === 0xb8 && i + 4 <= end) {
      const imm = u32le(data, i);
      i += 4;
      size = 5;
      mnemonic = 'mov';
      operands = `eax, 0x${imm.toString(16)}`;
      pseudo = `eax = 0x${imm.toString(16)};`;
      confidence = 'decoded';
    } else if (op === 0x68 && i + 4 <= end) {
      const imm = u32le(data, i);
      i += 4;
      size = 5;
      mnemonic = 'push';
      operands = `0x${imm.toString(16)}`;
      pseudo = `push(0x${imm.toString(16)});`;
      confidence = 'decoded';
    } else if (op === 0x6a && i < end) {
      const imm = data[i++];
      size = 2;
      mnemonic = 'push';
      operands = `0x${imm.toString(16)}`;
      pseudo = `push(0x${imm.toString(16)});`;
      confidence = 'decoded';
    } else if (op === 0xe8 && i + 4 <= end) {
      const rel = u32le(data, i);
      const signed = rel > 0x7fffffff ? rel - 0x100000000 : rel;
      i += 4;
      size = 5;
      const target = address + (start - offset) + size + signed;
      mnemonic = 'call';
      operands = `0x${target.toString(16)}`;
      pseudo = `call(sub_${target.toString(16)});`;
      confidence = 'decoded';
    } else if (op === 0xe9 && i + 4 <= end) {
      const rel = u32le(data, i);
      const signed = rel > 0x7fffffff ? rel - 0x100000000 : rel;
      i += 4;
      size = 5;
      const target = address + (start - offset) + size + signed;
      mnemonic = 'jmp';
      operands = `0x${target.toString(16)}`;
      pseudo = `goto loc_${target.toString(16)};`;
      confidence = 'decoded';
    } else if (op === 0xeb && i < end) {
      const rel = (data[i++] << 24) >> 24;
      size = 2;
      const target = address + (start - offset) + size + rel;
      mnemonic = 'jmp';
      operands = `0x${target.toString(16)}`;
      pseudo = `goto loc_${target.toString(16)};`;
      confidence = 'decoded';
    } else if (op >= 0x50 && op <= 0x57) {
      const r = reg32(op - 0x50);
      mnemonic = 'push';
      operands = r;
      pseudo = `push(${r});`;
      confidence = 'decoded';
    } else if (op >= 0x58 && op <= 0x5f) {
      const r = reg32(op - 0x58);
      mnemonic = 'pop';
      operands = r;
      pseudo = `${r} = pop();`;
      confidence = 'decoded';
    } else if (op === 0x83 && i + 2 <= end) {
      const modrm = data[i++],
        imm = data[i++];
      size = 3;
      const rm = reg32(modrm);
      const group = (modrm >> 3) & 7;
      const name =
        group === 0 ? 'add' : group === 5 ? 'sub' : group === 6 ? 'xor' : null;
      if (name) {
        mnemonic = name;
        operands = `${rm}, ${imm}`;
        pseudo = `${rm} ${name === 'add' ? '+=' : name === 'sub' ? '-=' : '^='} ${imm};`;
        confidence = 'decoded';
      }
    }
    out.push({
      offset: start,
      address: address + (start - offset),
      bytes: hexBytes(data, start, size),
      mnemonic,
      operands,
      pseudo,
      confidence,
    });
  }
  return out;
}

export function analyzeExecutable(data: Uint8Array): ExecutableAnalysis {
  if (
    data.length >= 4 &&
    data[0] === 0x7f &&
    data[1] === 0x45 &&
    data[2] === 0x4c &&
    data[3] === 0x46
  )
    return parseElf(data);
  if (data.length >= 2 && data[0] === 0x4d && data[1] === 0x5a)
    return parsePe(data);
  if (
    data.length >= 4 &&
    ((data[0] === 0xfe &&
      data[1] === 0xed &&
      data[2] === 0xfa &&
      data[3] === 0xce) ||
      (data[0] === 0xcf &&
        data[1] === 0xfa &&
        data[2] === 0xed &&
        data[3] === 0xfe))
  ) {
    return {
      format: 'Mach-O',
      architecture: 'Mach-O (header recognized)',
      bits: null,
      entryPoint: null,
      entryFileOffset: null,
      sections: [],
      imports: [],
      exports: [],
      strings: extractInterestingStrings(data),
      instructions: [],
      notes: [
        'Mach-O magic recognized. Full Mach-O parsing is intentionally not guessed.',
      ],
    };
  }
  return {
    format: 'Unknown',
    architecture: 'Unknown',
    bits: null,
    entryPoint: null,
    entryFileOffset: null,
    sections: [],
    imports: [],
    exports: [],
    strings: extractInterestingStrings(data),
    instructions: [],
    notes: ['No supported native executable header was recognized.'],
  };
}
