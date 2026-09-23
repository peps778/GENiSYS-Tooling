interface PasswordMatchStatusProps {
  confirmPassword: string;
  matches: boolean;
}

/**
 * Live feedback for the confirm-password field. Stays silent until
 * the user starts typing a confirmation, then updates on every
 * keystroke until the two values match.
 */
export function PasswordMatchStatus({
  confirmPassword,
  matches,
}: PasswordMatchStatusProps) {
  if (confirmPassword.length === 0) {
    return null;
  }

  return (
    <p
      className={`mt-1.5 text-[11px] leading-5 transition-colors duration-200 ${
        matches ? 'text-emerald-600' : 'text-red-600'
      }`}
    >
      {matches ? 'Passwords match.' : 'Passwords do not match yet.'}
    </p>
  );
}
