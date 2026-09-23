/**
 * Password policy for account registration.
 *
 * Kept as a pure module (no React, no Firebase) so it can be unit
 * tested on its own and reused anywhere a password needs to be
 * scored — independent of the login feature's own logic.
 */

export interface PasswordRequirementCheck {
  id: 'minLength' | 'uppercase' | 'symbol';
  label: string;
  met: boolean;
}

export interface PasswordPolicyResult {
  checks: PasswordRequirementCheck[];
  isValid: boolean;
}

const MIN_LENGTH = 8;
const UPPERCASE_PATTERN = /[A-Z]/;
const SYMBOL_PATTERN = /[^A-Za-z0-9]/;

/**
 * Evaluates a candidate password against the registration policy:
 * at least 8 characters, one uppercase letter, one symbol.
 *
 * Returns per-requirement results so the UI can render a live
 * checklist that updates on every keystroke.
 */
export function evaluatePassword(password: string): PasswordPolicyResult {
  const checks: PasswordRequirementCheck[] = [
    {
      id: 'minLength',
      label: 'At least 8 characters',
      met: password.length >= MIN_LENGTH,
    },
    {
      id: 'uppercase',
      label: 'One uppercase letter',
      met: UPPERCASE_PATTERN.test(password),
    },
    {
      id: 'symbol',
      label: 'One symbol (e.g. ! @ # $ %)',
      met: SYMBOL_PATTERN.test(password),
    },
  ];

  return {
    checks,
    isValid: checks.every((check) => check.met),
  };
}
