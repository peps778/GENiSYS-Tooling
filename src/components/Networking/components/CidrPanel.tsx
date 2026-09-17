import { useState } from 'react';
import { calculateCidr } from '../lib/cidrCalculator';
import ConceptCard from './ConceptCard';
export default function CidrPanel() {
  const [input, setInput] = useState('192.168.1.0/24');
  const [error, setError] = useState('');
  const [result, setResult] = useState(() => calculateCidr('192.168.1.0/24'));
  function calc() {
    try {
      setResult(calculateCidr(input));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid CIDR');
    }
  }
  return (
    <ConceptCard
      title="CIDR / Subnet Calculator"
      description="Enter an IPv4 CIDR block."
    >
      <div className="nr-form-row">
        <input
          className="nr-inline-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && calc()}
        />
        <button className="nr-button" onClick={calc}>
          Calculate
        </button>
      </div>
      {error && <p className="nr-error">{error}</p>}
      {result && (
        <div className="nr-stat-grid">
          {Object.entries(result)
            .filter(([k]) => k !== 'input')
            .map(([k, v]) => (
              <div className="nr-stat" key={k}>
                <span>
                  {k
                    .replace(/[A-Z]/g, (m) => ` ${m}`)
                    .replace(/^./, (m) => m.toUpperCase())}
                </span>
                <b>{v}</b>
              </div>
            ))}
        </div>
      )}
      <p className="nr-muted">
        Common prefixes: /8, /16, /20, /21, /22, /23, /24, /25, /26, /27, /28,
        /29, /30, /31, /32.
      </p>
    </ConceptCard>
  );
}
