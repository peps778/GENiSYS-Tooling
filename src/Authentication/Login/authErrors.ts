/**
 * Error classification and user-facing message mapping for the
 * GENiSYS Firebase + Django authentication flow.
 */

export type BackendFailureType =
  | 'offline'
  | 'unauthorized'
  | 'forbidden'
  | 'server'
  | 'network'
  | 'unknown';

/**
 * Firebase authentication errors are intentionally mapped to
 * user-facing messages rather than exposing raw Firebase error
 * objects.
 */
export function getFirebaseErrorMessage(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';

    case 'auth/user-disabled':
      return 'This account has been disabled. Contact an administrator.';

    // Firebase intentionally groups these credential failures so the
    // application does not reveal whether an email address exists.
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'The email or password is incorrect.';

    case 'auth/too-many-requests':
      return 'Too many authentication attempts were detected. Please wait before trying again.';

    case 'auth/network-request-failed':
      return 'Firebase Authentication could not be reached. Check your internet connection and try again.';

    default:
      return 'Unable to authenticate your account. Please try again.';
  }
}

/**
 * Determines whether an error is caused by the browser being unable
 * to establish a connection with Django. Fetch normally surfaces an
 * unavailable backend as a TypeError.
 */
export function isNetworkFailure(error: unknown): boolean {
  if (error instanceof TypeError) {
    return true;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    return (
      message.includes('failed to fetch') ||
      message.includes('networkerror') ||
      message.includes('network request failed') ||
      message.includes('connection refused') ||
      message.includes('load failed')
    );
  }

  return false;
}

/**
 * Classifies a Django/API failure without exposing internal backend
 * implementation details to the user.
 */
export function getBackendFailureType(error: unknown): BackendFailureType {
  if (isNetworkFailure(error)) {
    return 'offline';
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (
      message.includes('401') ||
      message.includes('unauthorized') ||
      message.includes('authentication credentials')
    ) {
      return 'unauthorized';
    }

    if (
      message.includes('403') ||
      message.includes('forbidden') ||
      message.includes('permission')
    ) {
      return 'forbidden';
    }

    if (
      message.includes('500') ||
      message.includes('502') ||
      message.includes('503') ||
      message.includes('504') ||
      message.includes('server error')
    ) {
      return 'server';
    }
  }

  return 'unknown';
}

/**
 * Converts an internal backend failure into a safe user-facing
 * message. Detailed technical information stays in the console.
 */
export function getBackendErrorMessage(failureType: BackendFailureType): string {
  switch (failureType) {
    case 'offline':
      return 'The GENiSYS backend is currently unavailable. Please make sure the server is running and try again.';

    case 'unauthorized':
      return 'The backend could not verify your authentication session. Please sign in again.';

    case 'forbidden':
      return 'Your account is authenticated but is not authorized to access GENiSYS.';

    case 'server':
      return 'The GENiSYS backend encountered an internal error. Please try again later.';

    case 'network':
      return 'A network error prevented authentication. Check your connection and try again.';

    default:
      return 'The GENiSYS backend could not complete authentication. Please try again.';
  }
}

/**
 * Wraps a caught error together with its classified failure type, so
 * downstream callers don't need to re-classify it.
 */
export interface WrappedBackendError {
  type: BackendFailureType;
  originalError: unknown;
}

export function wrapBackendError(error: unknown): WrappedBackendError {
  return {
    type: getBackendFailureType(error),
    originalError: error,
  };
}

export function isWrappedBackendError(
  error: unknown
): error is WrappedBackendError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    'originalError' in error
  );
}
