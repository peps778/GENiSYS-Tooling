import { useState } from 'react';

export default function CommandBlock({
  command,
  description,
  notes,
}: {
  command: string;
  description?: string;
  notes?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyCommand() {
    try {
      await navigator.clipboard?.writeText(command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="nr-command-block">
      <div className="nr-command-topline">
        <span>COMMAND</span>
        <button type="button" onClick={copyCommand} aria-label="Copy command">
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <code>{command}</code>
      {description && <p>{description}</p>}
      {notes && <small>{notes}</small>}
    </div>
  );
}
