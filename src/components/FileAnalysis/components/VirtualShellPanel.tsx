import React, { useEffect, useRef, useState } from 'react';

interface Props {
  filename: string;
  output: string;
  onRun: (command: string) => Promise<void>;
  initialCommand?: string | null;
}

export function VirtualShellPanel({
  filename,
  output,
  onRun,
  initialCommand,
}: Props) {
  const [command, setCommand] = useState('');
  const [running, setRunning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialCommand) setCommand(initialCommand);
  }, [initialCommand]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || running) return;
    const next = command.trim();
    setCommand('');
    setRunning(true);
    try {
      await onRun(next);
    } finally {
      setRunning(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="overflow-hidden rounded-[12px] border border-[#D1D5DB] bg-[#111827] shadow-sm">
      <div className="flex items-center justify-between border-b border-[#374151] px-4 py-2">
        <div>
          <span className="font-mono text-xs text-[#D1D5DB]">genisys@ctf</span>
          <span className="font-mono text-xs text-[#9CA3AF]">:{filename}</span>
        </div>
        <span className="text-[10px] uppercase tracking-wide text-[#86EFAC]">
          sandboxed virtual shell
        </span>
      </div>
      <pre className="max-h-[560px] min-h-[260px] overflow-auto whitespace-pre-wrap break-words p-4 font-mono text-xs leading-5 text-[#D1D5DB]">
        {output || 'Type help for available commands.'}
      </pre>
      <form
        onSubmit={submit}
        className="flex items-center border-t border-[#374151] px-4 py-3"
      >
        <span className="mr-2 font-mono text-xs text-[#86EFAC]">$</span>
        <input
          ref={inputRef}
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          disabled={running}
          className="min-w-0 flex-1 bg-transparent font-mono text-xs text-white outline-none placeholder:text-[#6B7280]"
          placeholder='strings | grep -i "flag"'
        />
        <button
          type="submit"
          disabled={running}
          className="ml-3 rounded-[7px] bg-[#3FA94F] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          {running ? 'RUN' : 'EXEC'}
        </button>
      </form>
    </div>
  );
}
export default VirtualShellPanel;
