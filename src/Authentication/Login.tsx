import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  type User,
} from 'firebase/auth';
import Swal from 'sweetalert2';

import { auth } from '../lib/firebase';
import { getCurrentUser } from '../lib/api';

type ViewState = 'form' | 'unverified';

type BackendFailureType =
  | 'offline'
  | 'unauthorized'
  | 'forbidden'
  | 'server'
  | 'network'
  | 'unknown';

/**
 * GENiSYS SweetAlert configuration.
 *
 * The styling intentionally follows the existing application branding:
 * emerald accents, white surfaces, compact typography, and restrained
 * borders/shadows.
 */
const swalTheme = {
  customClass: {
    popup: 'rounded-2xl border border-emerald-900/10 shadow-xl',
    title: 'text-lg font-bold text-green-950',
    htmlContainer: 'text-xs leading-6 text-slate-500',
    confirmButton:
      'rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-white',
    cancelButton:
      'rounded-lg border border-emerald-900/10 bg-white px-5 py-2.5 text-xs font-semibold text-slate-600',
  },
  buttonsStyling: false,
  background: '#ffffff',
};

/**
 * Firebase authentication errors are intentionally mapped to user-facing
 * messages rather than exposing raw Firebase error objects.
 */
function getFirebaseErrorMessage(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';

    case 'auth/user-disabled':
      return 'This account has been disabled. Contact an administrator.';

    /*
     * Firebase intentionally groups these credential failures so that
     * the application does not reveal whether an email address exists.
     */
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
 * to establish a connection with Django.
 *
 * Fetch normally surfaces an unavailable backend as a TypeError.
 */
function isNetworkFailure(error: unknown): boolean {
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
 * Attempts to classify a Django/API failure without exposing internal
 * backend implementation details to the user.
 */
function getBackendFailureType(
  error: unknown
): BackendFailureType {
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
 * Converts an internal backend failure into a safe user-facing message.
 *
 * Detailed technical information remains in the browser console.
 */
function getBackendErrorMessage(
  failureType: BackendFailureType
): string {
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
 * Displays a branded authentication error.
 */
async function showAuthError(
  title: string,
  message: string,
  technicalContext?: string
) {
  console.error(
    `[GENiSYS Auth] ${technicalContext ?? title}: ${message}`
  );

  await Swal.fire({
    ...swalTheme,
    icon: 'error',
    title,
    text: message,
    confirmButtonText: 'Try Again',
  });
}

/**
 * Displays a branded informational message.
 */
async function showAuthInfo(
  title: string,
  message: string
) {
  await Swal.fire({
    ...swalTheme,
    icon: 'info',
    title,
    text: message,
    confirmButtonText: 'OK',
  });
}

/**
 * Displays a branded success message.
 */
async function showAuthSuccess(
  title: string,
  message: string
) {
  await Swal.fire({
    ...swalTheme,
    icon: 'success',
    title,
    text: message,
    confirmButtonText: 'Continue',
  });
}

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [view, setView] =
    useState<ViewState>('form');

  const [pendingUser, setPendingUser] =
    useState<User | null>(null);

  const [resendStatus, setResendStatus] =
    useState<string | null>(null);

  /**
   * Authenticates the Firebase identity against Django.
   *
   * Firebase remains responsible for credential verification.
   * Django is the mandatory application authentication and
   * authorization boundary.
   */
  const authenticateWithBackend = async (
    user: User
  ) => {
    console.log(
      '[GENiSYS Auth] Starting Django authentication.'
    );

    console.log(
      '[GENiSYS Auth] Firebase identity:',
      {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
      }
    );

    try {
      /*
       * getCurrentUser() obtains the Firebase ID token and sends:
       *
       * Authorization: Bearer <firebase-id-token>
       *
       * The token itself is never logged.
       */
      const backendUser =
        await getCurrentUser();

      console.log(
        '[GENiSYS Auth] Django authentication successful.'
      );

      console.log(
        '[GENiSYS Auth] Django identity:',
        {
          uid: backendUser.uid,
          email: backendUser.email,
          email_verified:
            backendUser.email_verified,
        }
      );

      return backendUser;
    } catch (error) {
      const failureType =
        getBackendFailureType(error);

      console.error(
        '[GENiSYS Auth] Django authentication failed.',
        {
          failureType,
          error,
        }
      );

      /*
       * Firebase may still have an authenticated user even though
       * Django rejected the application session.
       *
       * Sign the Firebase user out so that Firebase authentication
       * alone cannot leave GENiSYS in an authenticated state.
       */
      console.log(
        '[GENiSYS Auth] Revoking local Firebase session after Django authentication failure.'
      );

      try {
        await signOut(auth);

        console.log(
          '[GENiSYS Auth] Firebase session cleared.'
        );
      } catch (signOutError) {
        console.error(
          '[GENiSYS Auth] Failed to clear Firebase session.',
          signOutError
        );
      }

      throw {
        type: failureType,
        originalError: error,
      };
    }
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError(null);
    setResendStatus(null);
    setLoading(true);

    console.log(
      '[GENiSYS Auth] Login request initiated.'
    );

    /*
     * Never log the password.
     *
     * The email is acceptable for development diagnostics,
     * but production logging should preferably use a request
     * correlation ID instead of personal data.
     */
    console.log(
      '[GENiSYS Auth] Authentication identifier:',
      email
    );

    try {
      /*
       * ---------------------------------------------------------
       * STEP 1
       * Firebase validates the user's credentials.
       * ---------------------------------------------------------
       */
      console.log(
        '[GENiSYS Auth] Contacting Firebase Authentication.'
      );

      const credential =
        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

      const { user } = credential;

      console.log(
        '[GENiSYS Auth] Firebase authentication successful.',
        {
          uid: user.uid,
          email: user.email,
          emailVerified:
            user.emailVerified,
        }
      );

      /*
       * ---------------------------------------------------------
       * STEP 2
       * Require verified email before application access.
       * ---------------------------------------------------------
       */
      if (!user.emailVerified) {
        console.log(
          '[GENiSYS Auth] Email verification required.'
        );

        setPendingUser(user);
        setView('unverified');
        setLoading(false);

        return;
      }

      /*
       * ---------------------------------------------------------
       * STEP 3
       * Forward Firebase identity to Django.
       * ---------------------------------------------------------
       */
      console.log(
        '[GENiSYS Auth] Firebase identity verified.'
      );

      console.log(
        '[GENiSYS Auth] Forwarding Firebase identity to Django.'
      );

      await authenticateWithBackend(user);

      /*
       * ---------------------------------------------------------
       * STEP 4
       * Only navigate after Django approves the identity.
       * ---------------------------------------------------------
       */
      console.log(
        '[GENiSYS Auth] Application authentication successful.'
      );

      console.log(
        '[GENiSYS Auth] Redirecting to GENiSYS workspace.'
      );

      navigate('/');
    } catch (error) {
      const firebaseCode =
        (error as { code?: string }).code ?? '';

      /*
       * Firebase authentication failure.
       */
      if (firebaseCode.startsWith('auth/')) {
        console.error(
          '[GENiSYS Auth] Firebase authentication rejected.',
          {
            code: firebaseCode,
          }
        );

        const message =
          getFirebaseErrorMessage(
            firebaseCode
          );

        setError(message);

        await showAuthError(
          'Sign-in unsuccessful',
          message,
          `Firebase authentication failure: ${firebaseCode}`
        );

        setLoading(false);

        return;
      }

      /*
       * Django authentication failure.
       */
      const wrappedError =
        error as {
          type?: BackendFailureType;
          originalError?: unknown;
        };

      const failureType =
        wrappedError.type ??
        getBackendFailureType(error);

      const message =
        getBackendErrorMessage(
          failureType
        );

      setError(message);

      /*
       * Server unavailable.
       */
      if (failureType === 'offline') {
        console.error(
          '[GENiSYS Auth] Django server appears to be offline.',
          wrappedError.originalError
        );

        await showAuthError(
          'Backend unavailable',
          'GENiSYS could not connect to the authentication server. Make sure the Django backend is running and try again.',
          'Django server unavailable'
        );
      }

      /*
       * Django rejected the Firebase identity.
       */
      else if (
        failureType === 'unauthorized'
      ) {
        console.error(
          '[GENiSYS Auth] Django rejected the Firebase identity.',
          wrappedError.originalError
        );

        await showAuthError(
          'Authentication rejected',
          'The backend could not verify your authentication session. Please sign in again.',
          'Django returned an authentication failure'
        );
      }

      /*
       * Django authenticated the user but refused authorization.
       */
      else if (
        failureType === 'forbidden'
      ) {
        console.error(
          '[GENiSYS Auth] Django denied application access.',
          wrappedError.originalError
        );

        await showAuthError(
          'Access denied',
          'Your account is authenticated but is not authorized to access GENiSYS.',
          'Django authorization failure'
        );
      }

      /*
       * Django/server-side failure.
       */
      else if (
        failureType === 'server'
      ) {
        console.error(
          '[GENiSYS Auth] Django returned a server-side failure.',
          wrappedError.originalError
        );

        await showAuthError(
          'Server error',
          'The GENiSYS backend encountered an internal error. Please try again later.',
          'Django server-side failure'
        );
      }

      /*
       * Unknown backend/network failure.
       */
      else {
        console.error(
          '[GENiSYS Auth] Unexpected backend authentication failure.',
          wrappedError.originalError ?? error
        );

        await showAuthError(
          'Authentication error',
          message,
          'Unexpected Django authentication failure'
        );
      }

      setLoading(false);
    }
  };

  const handleResendVerification =
    async () => {
      if (!pendingUser) {
        return;
      }

      setResendStatus(null);

      console.log(
        '[GENiSYS Auth] Sending Firebase email verification.'
      );

      try {
        await sendEmailVerification(
          pendingUser
        );

        console.log(
          '[GENiSYS Auth] Verification email sent successfully.'
        );

        setResendStatus(
          'Verification email sent. Check your inbox.'
        );

        await showAuthSuccess(
          'Verification email sent',
          'Check your inbox and follow the verification link.'
        );
      } catch (error) {
        console.error(
          '[GENiSYS Auth] Failed to send verification email.',
          error
        );

        setResendStatus(
          'Could not send verification email. Try again shortly.'
        );

        await showAuthError(
          'Unable to send email',
          'The verification email could not be sent. Please try again shortly.',
          'Firebase verification email failure'
        );
      }
    };

  const handleCheckVerification =
    async () => {
      if (!pendingUser) {
        return;
      }

      setResendStatus(null);
      setError(null);
      setLoading(true);

      console.log(
        '[GENiSYS Auth] Refreshing Firebase verification state.'
      );

      try {
        /*
         * Refresh the Firebase user so emailVerified contains
         * the latest value from Firebase Authentication.
         */
        await pendingUser.reload();

        console.log(
          '[GENiSYS Auth] Current verification state:',
          {
            email: pendingUser.email,
            emailVerified:
              pendingUser.emailVerified,
          }
        );

        if (!pendingUser.emailVerified) {
          console.log(
            '[GENiSYS Auth] Email is still unverified.'
          );

          setResendStatus(
            'Still not verified. Check your inbox and spam folder.'
          );

          await showAuthInfo(
            'Verification still required',
            'Your email has not been verified yet. Open the verification email and follow the link.'
          );

          setLoading(false);

          return;
        }

        console.log(
          '[GENiSYS Auth] Email verification confirmed.'
        );

        /*
         * The user is now email-verified in Firebase.
         *
         * Django still has to approve the application session.
         */
        console.log(
          '[GENiSYS Auth] Forwarding verified identity to Django.'
        );

        await authenticateWithBackend(
          pendingUser
        );

        console.log(
          '[GENiSYS Auth] Django authentication successful.'
        );

        navigate('/');
      } catch (error) {
        const wrappedError =
          error as {
            type?: BackendFailureType;
            originalError?: unknown;
          };

        /*
         * If authenticateWithBackend() threw its wrapped error,
         * preserve the classification.
         */
        const failureType =
          wrappedError.type ??
          getBackendFailureType(error);

        /*
         * Verification itself may fail independently from Django.
         */
        if (
          !wrappedError.type &&
          !isNetworkFailure(error)
        ) {
          console.error(
            '[GENiSYS Auth] Failed while checking email verification.',
            error
          );

          setResendStatus(
            'Could not check verification status. Try again.'
          );

          await showAuthError(
            'Verification check failed',
            'We could not confirm your email verification status. Please try again.',
            'Firebase verification state refresh failure'
          );

          setLoading(false);

          return;
        }

        const message =
          getBackendErrorMessage(
            failureType
          );

        console.error(
          '[GENiSYS Auth] Verification/backend authentication failure.',
          {
            failureType,
            error,
          }
        );

        setError(message);

        if (
          failureType === 'offline'
        ) {
          await showAuthError(
            'Backend unavailable',
            'GENiSYS could not connect to the authentication server. Make sure the Django backend is running and try again.',
            'Django server unavailable during verification'
          );
        } else if (
          failureType === 'forbidden'
        ) {
          await showAuthError(
            'Access denied',
            'Your account is authenticated but is not authorized to access GENiSYS.',
            'Django authorization failure during verification'
          );
        } else {
          await showAuthError(
            'Authentication failed',
            message,
            'Django authentication failure during verification'
          );
        }

        setLoading(false);
      }
    };

  if (view === 'unverified') {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-white p-6 text-slate-950">
        <div className="w-full max-w-sm rounded-2xl border border-emerald-900/10 bg-white/80 p-6 shadow-sm shadow-emerald-900/5">
          <div className="mb-4 flex items-center gap-3">
            <span className="font-mono text-[10px] text-emerald-600/70">
              02 /
            </span>

            <span className="h-px w-8 bg-emerald-500/30" />

            <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-slate-400">
              Verification Required
            </span>
          </div>

          <h1 className="text-lg font-bold leading-tight tracking-[-0.02em] text-green-950">
            Verify your email
          </h1>

          <p className="mt-3 text-xs leading-6 text-slate-500">
            We sent a verification link to{' '}
            <span className="text-slate-700">
              {pendingUser?.email}
            </span>
            . Verify your email to finish signing in.
          </p>

          {resendStatus && (
            <p className="mt-3 text-[11px] leading-5 text-emerald-700">
              {resendStatus}
            </p>
          )}

          {error && (
            <p
              role="alert"
              className="mt-3 text-[11px] leading-5 text-red-600"
            >
              {error}
            </p>
          )}

          <div className="mt-5 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={
                handleCheckVerification
              }
              disabled={loading}
              className="rounded-lg border border-emerald-500/30 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700 transition-all duration-300 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? 'Checking...'
                : "I've verified, continue"}
            </button>

            <button
              type="button"
              onClick={
                handleResendVerification
              }
              disabled={loading}
              className="rounded-lg border border-emerald-900/10 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 transition-all duration-300 hover:border-emerald-300 hover:bg-emerald-50/50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Resend verification email
            </button>

            <button
              type="button"
              onClick={() => {
                console.log(
                  '[GENiSYS Auth] Returning to login form.'
                );

                setView('form');
                setPendingUser(null);
                setResendStatus(null);
                setError(null);
              }}
              disabled={loading}
              className="mt-1 text-[11px] font-medium text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
            >
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white p-6 text-slate-950">
      <div className="w-full max-w-sm rounded-2xl border border-emerald-900/10 bg-white/80 p-6 shadow-sm shadow-emerald-900/5">
        <div className="mb-4 flex items-center gap-3">
          <span className="font-mono text-[10px] text-emerald-600/70">
            00 /
          </span>

          <span className="h-px w-8 bg-emerald-500/30" />

          <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-slate-400">
            Hack4Gov Toolkit
          </span>
        </div>

        <h1 className="text-2xl font-bold leading-tight tracking-[-0.03em] text-green-950">
          Sign in
        </h1>

        <p className="mt-1.5 text-xs text-slate-500">
          Access the GENiSYS workspace.
        </p>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-6 flex flex-col gap-4"
        >
          <div>
            <label
              htmlFor="login-email"
              className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400"
            >
              Email
            </label>

            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              disabled={loading}
              className="mt-1.5 w-full rounded-lg border border-emerald-900/10 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition-all duration-300 placeholder:text-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 disabled:opacity-60"
              placeholder="you@agency.gov"
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400"
            >
              Password
            </label>

            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              disabled={loading}
              className="mt-1.5 w-full rounded-lg border border-emerald-900/10 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition-all duration-300 placeholder:text-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 disabled:opacity-60"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="text-[11px] leading-5 text-red-600"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-white transition-all duration-300 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? 'Authenticating...'
              : 'Sign in'}
          </button>
        </form>

        <p className="mt-5 text-center text-[11px] text-slate-400">
          Need an account?{' '}
          <Link
            to="/registration"
            className="font-medium text-emerald-600 hover:text-emerald-700"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;