import { auth } from './firebase';

import { scheduleSessionTimeouts } from './session';

const API_URL = import.meta.env.PUBLIC_API_URL;

/**
 * Represents the GENiSYS application session returned
 * by the Django /api/me/ endpoint.
 */
export interface CurrentUserSession {
  absolute_expires_at: string;
  idle_expires_at: string;
}

/**
 * Represents the authenticated Firebase identity and
 * corresponding GENiSYS application session.
 */
export interface CurrentUser {
  uid: string;
  email: string | null;
  email_verified: boolean;
  session: CurrentUserSession;
}

/**
 * Known application-level session error codes.
 */
export type SessionErrorCode =
  'session_absolute_timeout' | 'session_idle_timeout';

/**
 * Represents an HTTP error returned by the GENiSYS backend.
 */
export class ApiError extends Error {
  readonly status: number;

  readonly responseBody?: unknown;

  readonly code?: string;

  constructor(
    message: string,
    status: number,
    responseBody?: unknown,
    code?: string,
  ) {
    super(message);

    this.name = 'ApiError';

    this.status = status;

    this.responseBody = responseBody;

    this.code = code;
  }
}

/**
 * Determines whether an unknown value matches the expected
 * GENiSYS session structure.
 */
function isCurrentUserSession(value: unknown): value is CurrentUserSession {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const data = value as Record<string, unknown>;

  return (
    typeof data.absolute_expires_at === 'string' &&
    typeof data.idle_expires_at === 'string'
  );
}

/**
 * Determines whether an unknown value matches the
 * expected /api/me/ response structure.
 */
function isCurrentUser(value: unknown): value is CurrentUser {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const data = value as Record<string, unknown>;

  return (
    typeof data.uid === 'string' &&
    (typeof data.email === 'string' || data.email === null) &&
    typeof data.email_verified === 'boolean' &&
    isCurrentUserSession(data.session)
  );
}

/**
 * Extract a machine-readable backend error code
 * when one is available.
 */
function getErrorCode(value: unknown): string | undefined {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }

  const data = value as Record<string, unknown>;

  if (typeof data.code === 'string') {
    return data.code;
  }

  return undefined;
}

/**
 * Extract the human-readable backend error message.
 */
function getErrorMessage(value: unknown): string {
  if (typeof value !== 'object' || value === null) {
    return 'The Django backend rejected the request.';
  }

  const data = value as Record<string, unknown>;

  if (typeof data.detail === 'string') {
    return data.detail;
  }

  return 'The Django backend rejected the request.';
}

/**
 * Retrieves the currently authenticated Firebase user's
 * identity and GENiSYS application session.
 *
 * Django remains authoritative for session expiration.
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  const user = auth.currentUser;

  if (!user) {
    throw new ApiError('No authenticated Firebase user.', 401);
  }

  let token: string;

  try {
    token = await user.getIdToken();
  } catch (error) {
    console.error('[GENiSYS Auth] Failed to obtain Firebase ID token.', error);

    throw new ApiError(
      'Unable to obtain the Firebase authentication token.',
      401,
    );
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}/api/me/`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
  } catch (error) {
    console.error('[GENiSYS Auth] Django backend is unreachable.', {
      apiUrl: API_URL,
      error,
    });

    throw new ApiError('The GENiSYS backend is unreachable.', 0);
  }

  let responseBody: unknown;

  try {
    responseBody = await response.json();
  } catch {
    responseBody = undefined;
  }

  if (!response.ok) {
    const message = getErrorMessage(responseBody);

    const code = getErrorCode(responseBody);

    console.error('[GENiSYS Auth] Backend authentication request failed.', {
      status: response.status,
      statusText: response.statusText,
      message,
      code,
    });

    throw new ApiError(message, response.status, responseBody, code);
  }

  if (!isCurrentUser(responseBody)) {
    console.error(
      '[GENiSYS Auth] Backend returned an invalid authentication response.',
      {
        status: response.status,
        responseBody,
      },
    );

    throw new ApiError(
      'The backend returned an invalid authentication response.',
      response.status,
      responseBody,
    );
  }

  /**
   * Django supplies the authoritative expiration
   * timestamps for the current GENiSYS session.
   */
  scheduleSessionTimeouts(
    responseBody.session.absolute_expires_at,
    responseBody.session.idle_expires_at,
  );

  return responseBody;
}
