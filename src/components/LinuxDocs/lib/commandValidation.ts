const destructivePatterns = [
  /\brm\s+-rf\b/i,
  /\bmkfs(\.|$|\s)/i,
  /\bdd\b[^|;&]*\bof=\/dev\//i,
  /\bshutdown\b/i,
  /\breboot\b/i,
  /\bpoweroff\b/i,
  /\b:\(\)\s*\{\s*:\|:\s*&\s*\};:/,
];

export function validateGeneratedCommand(command: string): {
  valid: boolean;
  issues: string[];
} {
  const issues = destructivePatterns
    .filter((pattern) => pattern.test(command))
    .map(() => 'Potentially destructive shell command detected.');

  return { valid: issues.length === 0, issues: [...new Set(issues)] };
}
