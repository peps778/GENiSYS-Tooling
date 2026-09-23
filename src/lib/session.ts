import { signOut } from 'firebase/auth';
import Swal from 'sweetalert2';

import { auth } from './firebase';

export type SessionTimeoutReason = 'idle' | 'absolute';

let timeoutTimer: number | null = null;

let currentReason: SessionTimeoutReason | null = null;

/**
 * Clear the currently scheduled session timeout.
 */
function clearSessionTimer(): void {
  if (timeoutTimer !== null) {
    window.clearTimeout(timeoutTimer);
    timeoutTimer = null;
  }
}

/**
 * Return the user-facing session expiration notice.
 */
function getTimeoutMessage(reason: SessionTimeoutReason) {
  if (reason === 'idle') {
    return {
      title: 'Session timed out',
      message: 'Session timed out due to inactivity.',
    };
  }

  return {
    title: 'Session expired',
    message: 'Session expired.',
  };
}

/**
 * Terminate the Firebase authentication session and
 * inform the user that the GENiSYS application session
 * has ended.
 */
export async function terminateSession(
  reason: SessionTimeoutReason,
): Promise<void> {
  clearSessionTimer();

  /**
   * Prevent multiple simultaneous timeout handlers from
   * displaying multiple dialogs or performing multiple
   * redirects.
   */
  if (currentReason !== null) {
    return;
  }

  currentReason = reason;

  const { title, message } = getTimeoutMessage(reason);

  console.warn(`[GENiSYS Auth] Session terminated: ${reason}`);

  try {
    await signOut(auth);
  } catch (error) {
    /**
     * Firebase sign-out failure should not prevent the
     * user from being redirected away from the protected
     * application interface.
     */
    console.error('[GENiSYS Auth] Failed to clear Firebase session.', error);
  }

  await Swal.fire({
    icon: 'warning',
    title,
    text: message,
    confirmButtonText: 'Sign in again',
  });

  window.location.assign('/login');
}

/**
 * Reset the frontend session controller.
 *
 * This should be called after a successful login or when
 * the application intentionally signs the user out.
 */
export function resetSessionController(): void {
  clearSessionTimer();
  currentReason = null;
}

/**
 * Schedule the next frontend session timeout using the
 * expiration timestamps supplied by Django.
 *
 * The frontend timer exists for user experience only.
 * Django remains authoritative and independently validates
 * the session on protected API requests.
 */
export function scheduleSessionTimeouts(
  absoluteExpiresAt: string,
  idleExpiresAt: string,
): void {
  clearSessionTimer();

  currentReason = null;

  const absoluteTime = new Date(absoluteExpiresAt).getTime();

  const idleTime = new Date(idleExpiresAt).getTime();

  const now = Date.now();

  const absoluteDelay = absoluteTime - now;

  const idleDelay = idleTime - now;

  /**
   * Invalid timestamps should not silently create a
   * broken timeout.
   */
  if (Number.isNaN(absoluteTime) || Number.isNaN(idleTime)) {
    console.error('[GENiSYS Auth] Invalid session expiration timestamps.', {
      absoluteExpiresAt,
      idleExpiresAt,
    });

    return;
  }

  /**
   * If the absolute timeout has already passed,
   * absolute expiration takes precedence.
   */
  if (absoluteDelay <= 0) {
    void terminateSession('absolute');
    return;
  }

  /**
   * If the idle timeout has already passed, terminate
   * the session immediately.
   */
  if (idleDelay <= 0) {
    void terminateSession('idle');
    return;
  }

  /**
   * Whichever timeout occurs first determines the next
   * frontend session action.
   */
  if (idleDelay < absoluteDelay) {
    timeoutTimer = window.setTimeout(() => {
      void terminateSession('idle');
    }, idleDelay);

    return;
  }

  timeoutTimer = window.setTimeout(() => {
    void terminateSession('absolute');
  }, absoluteDelay);
}
