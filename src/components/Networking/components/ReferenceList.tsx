import { useState } from 'react';
import { CopyIcon } from './icons';
export default function ReferenceList({
  items,
}: {
  items: readonly (readonly [string, string])[];
}) {
  const [copied, setCopied] = useState('');
  async function copy(v: string) {
    await navigator.clipboard?.writeText(v);
    setCopied(v);
    setTimeout(() => setCopied(''), 1200);
  }
  return (
    <div className="nr-reference-list">
      {items.map(([cmd, desc]) => (
        <div className="nr-reference-row" key={cmd}>
          <div>
            <code>{cmd}</code>
            <p>{desc}</p>
          </div>
          <button
            className="nr-copy"
            onClick={() => copy(cmd)}
            title="Copy command"
          >
            {copied === cmd ? '✓' : <CopyIcon />}
          </button>
        </div>
      ))}
    </div>
  );
}
