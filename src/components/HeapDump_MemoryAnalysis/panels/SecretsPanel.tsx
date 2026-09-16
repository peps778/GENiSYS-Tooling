/**
 * SecretsPanel.tsx
 *
 * Displays detected potential secrets, grouped by type, with values
 * masked by default. Reveal is an explicit per-row opt-in so nothing
 * sensitive is shown on screen by accident (e.g. during a screen share).
 */
import { useMemo, useState } from "react";
import type { SecretMatch, SecretSeverity, SecretType } from "../types/heap";
import { EyeIcon, EyeOffIcon, KeyIcon } from "../components/icons";

export interface SecretsPanelProps {
  secrets: SecretMatch[] | null;
  loading: boolean;
  onScan: () => void;
}

const SEVERITY_BADGE: Record<SecretSeverity, string> = {
  high: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-[#F0FDF4] text-[#15803D] border-[#16A34A]/30",
  low: "bg-[#F9FAFB] text-[#4B5563] border-[#E5E7EB]",
};

const TYPE_LABEL: Record<SecretType, string> = {
  api_key: "API Key",
  aws_key: "AWS Key",
  jwt: "JWT",
  private_key: "Private Key",
  password: "Password",
  token: "Token",
  url: "URL",
  endpoint: "Endpoint",
  flag: "Flag-like value",
  generic_secret: "Generic secret",
};

function Row({ secret }: { secret: SecretMatch }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[#E5E7EB] px-3 py-2.5 last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${SEVERITY_BADGE[secret.severity]}`}
          >
            {secret.severity}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
            {TYPE_LABEL[secret.type]}
          </span>
        </div>
        <p className="mt-1 break-all font-mono text-xs text-[#111827]">
          {revealed ? secret.value : secret.redacted}
        </p>
        <p className="mt-1 break-all font-mono text-[11px] text-[#9CA3AF]">{secret.context}</p>
      </div>
      <button
        type="button"
        onClick={() => setRevealed((r) => !r)}
        className="flex-none text-[#4B5563] hover:text-[#111827]"
        aria-label={revealed ? "Hide value" : "Reveal value"}
        title={revealed ? "Hide value" : "Reveal value"}
      >
        {revealed ? <EyeOffIcon width={16} height={16} /> : <EyeIcon width={16} height={16} />}
      </button>
    </div>
  );
}

export default function SecretsPanel({ secrets, loading, onScan }: SecretsPanelProps) {
  const grouped = useMemo(() => {
    if (!secrets) return new Map<SecretType, SecretMatch[]>();
    const map = new Map<SecretType, SecretMatch[]>();
    for (const secret of secrets) {
      const list = map.get(secret.type) ?? [];
      list.push(secret);
      map.set(secret.type, list);
    }
    return map;
  }, [secrets]);

  if (secrets === null) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-md border border-[#E5E7EB] bg-white py-12 text-center">
        <KeyIcon width={22} height={22} className="text-[#9CA3AF]" />
        <p className="text-sm text-[#4B5563]">Run a scan to look for tokens, keys, passwords, and URLs.</p>
        <button
          type="button"
          disabled={loading}
          onClick={onScan}
          className="rounded-md bg-[#16A34A] px-3 py-2 text-xs font-semibold text-white hover:bg-[#15803D] disabled:opacity-60"
        >
          {loading ? "Scanning\u2026" : "Scan for secrets"}
        </button>
      </div>
    );
  }

  if (secrets.length === 0) {
    return (
      <div className="rounded-md border border-[#E5E7EB] bg-white p-6 text-center text-sm text-[#4B5563]">
        No likely secrets were found in the extracted strings.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#4B5563]">
          {secrets.length.toLocaleString()} potential match{secrets.length === 1 ? "" : "es"}
        </p>
        <button
          type="button"
          onClick={onScan}
          disabled={loading}
          className="text-xs font-semibold uppercase tracking-wide text-[#15803D] hover:text-[#16A34A] disabled:opacity-60"
        >
          {loading ? "Scanning\u2026" : "Re-scan"}
        </button>
      </div>

      {[...grouped.entries()].map(([type, items]) => (
        <div key={type} className="overflow-hidden rounded-md border border-[#E5E7EB] bg-white">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#111827]">{TYPE_LABEL[type]}</p>
            <span className="text-[10px] font-semibold text-[#9CA3AF]">{items.length}</span>
          </div>
          {items.map((secret) => (
            <Row key={secret.id} secret={secret} />
          ))}
        </div>
      ))}
    </div>
  );
}
