import type { PasswordRequirementCheck } from './passwordPolicy';

interface PasswordRequirementsProps {
  checks: PasswordRequirementCheck[];
}

/**
 * Renders the password policy as a live checklist. Each row updates
 * color/marker on every keystroke via the `met` flag computed in
 * useRegistration (from passwordPolicy.evaluatePassword).
 */
export function PasswordRequirements({ checks }: PasswordRequirementsProps) {
  return (
    <ul className="mt-2 flex flex-col gap-1">
      {checks.map((check) => (
        <li
          key={check.id}
          className={`text-[11px] leading-5 transition-colors duration-200 ${
            check.met ? 'text-emerald-600' : 'text-slate-400'
          }`}
        >
          <span className="mr-1.5">{check.met ? '✓' : '•'}</span>
          {check.label}
        </li>
      ))}
    </ul>
  );
}
