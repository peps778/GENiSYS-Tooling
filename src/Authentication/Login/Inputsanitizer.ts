/**
 * Client-side input sanitization for the GENiSYS login form.
 *
 * IMPORTANT — read before relying on this module:
 *
 * This is a defense-in-depth / early-feedback layer only. It cannot,
 * by itself, prevent SQL injection or server-side template injection
 * (SSTI), because:
 *
 *   1. Any client-side check can be bypassed entirely by calling the
 *      API directly (curl, Postman, a modified client, etc.) — the
 *      browser is not a trust boundary.
 *   2. In this app, email/password never reach a SQL query or a
 *      template engine on the client. Firebase Authentication treats
 *      them as opaque credential strings.
 *
 * The only real protection is on the backend:
 *   - SQLi: Django's ORM / parameterized queries, never string-
 *     interpolating request data into raw SQL.
 *   - SSTI: never rendering a template (Jinja2 / Django templates)
 *     using user-supplied data as the *template source* itself, and
 *     always treating request data as a template *variable*, not
 *     as template code.
 *
 * What this module does do:
 *   - Strips characters (control/null bytes) that have no legitimate
 *     use in an email or password and can be used to smuggle payloads
 *     past naive backend filters.
 *   - Flags input containing classic SQLi/SSTI marker sequences so the
 *     UI can reject it early with a friendly message.
 *   - Deliberately does NOT strip ordinary punctuation from passwords
 *     (quotes, dashes, braces, etc. are all valid in real passwords) —
 *     doing so would silently corrupt a user's actual credential.
 */

export interface SanitizationResult {
  value: string;
  error: string | null;
}

const CONTROL_CHARACTERS_PATTERN =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

const EMAIL_FORMAT_PATTERN =
  /^[^\s@"'<>;]+@[^\s@"'<>;]+\.[^\s@"'<>;]{2,}$/;

/**
 * Sequences that are essentially never legitimate in an email address
 * and are common SQL injection / SSTI probes.
 */
const SQLI_PATTERNS: RegExp[] = [
  /(--)|(\/\*)|(\*\/)/, // SQL comment markers
  /;\s*(drop|delete|update|insert|select)\b/i,
  /\bunion\b\s+\bselect\b/i,
  /\bor\b\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?/i, // classic "OR 1=1"
  /\bxp_cmdshell\b/i,
];

const SSTI_PATTERNS: RegExp[] = [
  /\{\{.*\}\}/s, // Jinja2 / Django template expression
  /\{%.*%\}/s, // Jinja2 / Django template tag
  /\$\{.*\}/s, // JS template literal / EL injection
  /<%.*%>/s, // ERB/ASP-style template tag
];

function stripControlCharacters(value: string): string {
  return value.replace(CONTROL_CHARACTERS_PATTERN, '');
}

function matchesAny(value: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(value));
}

/**
 * Sanitizes and validates the email field.
 *
 * Trims whitespace, strips control characters, lowercases (email
 * addresses are case-insensitive for practical purposes), validates
 * the shape of the address, and rejects classic injection markers
 * that have no place in an email address.
 */
export function sanitizeEmailInput(rawValue: string): SanitizationResult {
  const cleaned = stripControlCharacters(rawValue).trim().toLowerCase();

  if (cleaned.length === 0) {
    return { value: cleaned, error: 'Email is required.' };
  }

  if (cleaned.length > 254) {
    return { value: cleaned, error: 'Email address is too long.' };
  }

  if (matchesAny(cleaned, SQLI_PATTERNS) || matchesAny(cleaned, SSTI_PATTERNS)) {
    return {
      value: cleaned,
      error: 'Email address contains characters that are not allowed.',
    };
  }

  if (!EMAIL_FORMAT_PATTERN.test(cleaned)) {
    return { value: cleaned, error: 'Please enter a valid email address.' };
  }

  return { value: cleaned, error: null };
}

/**
 * Sanitizes and validates the password field.
 *
 * Only strips control/null characters (never ordinary punctuation, so
 * a legitimate password isn't corrupted) and rejects input containing
 * unambiguous SQLi/SSTI payload markers or absurd lengths.
 */
export function sanitizePasswordInput(rawValue: string): SanitizationResult {
  const cleaned = stripControlCharacters(rawValue);

  if (cleaned.length === 0) {
    return { value: cleaned, error: 'Password is required.' };
  }

  if (cleaned.length > 128) {
    return { value: cleaned, error: 'Password is too long.' };
  }

  if (matchesAny(cleaned, SQLI_PATTERNS) || matchesAny(cleaned, SSTI_PATTERNS)) {
    return {
      value: cleaned,
      error: 'Password contains characters that are not allowed.',
    };
  }

  return { value: cleaned, error: null };
}
