/**
 * Maps Firebase registration error codes to user-facing messages.
 * Scoped to the registration feature — the login feature keeps its
 * own copy in its own folder, intentionally, so the two stay
 * independent.
 */
export function getFirebaseErrorMessage(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    default:
      return 'Unable to create your account. Please try again.';
  }
}
