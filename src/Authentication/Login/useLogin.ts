import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  type User,
} from 'firebase/auth';

import { auth } from '../../lib/firebase';
import { getCurrentUser } from '../../lib/api';
import {
  getFirebaseErrorMessage,
  getBackendErrorMessage,
  wrapBackendError,
  isWrappedBackendError,
  isNetworkFailure,
  getBackendFailureType,
} from '../Login/authErrors';
import { showAuthError, showAuthInfo, showAuthSuccess } from '../Login/Authalerts';
import { sanitizeEmailInput, sanitizePasswordInput } from '../Login/Inputsanitizer';

type ViewState = 'form' | 'unverified';

export function useLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewState>('form');
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  /**
   * Authenticates the Firebase identity against Django. Firebase
   * remains responsible for credential verification; Django is the
   * mandatory application authentication and authorization boundary.
   */
  const authenticateWithBackend = async (user: User) => {
    console.log('[GENiSYS Auth] Starting Django authentication.');
    console.log('[GENiSYS Auth] Firebase identity:', {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
    });

    try {
      // getCurrentUser() obtains the Firebase ID token and sends it
      // as "Authorization: Bearer <firebase-id-token>". The token
      // itself is never logged.
      const backendUser = await getCurrentUser();

      console.log('[GENiSYS Auth] Django authentication successful.');
      console.log('[GENiSYS Auth] Django identity:', {
        uid: backendUser.uid,
        email: backendUser.email,
        email_verified: backendUser.email_verified,
      });

      return backendUser;
    } catch (backendError) {
      const wrapped = wrapBackendError(backendError);

      console.error('[GENiSYS Auth] Django authentication failed.', wrapped);

      // Firebase may still have an authenticated user even though
      // Django rejected the application session. Sign the Firebase
      // user out so that Firebase authentication alone can't leave
      // GENiSYS in an authenticated state.
      console.log(
        '[GENiSYS Auth] Revoking local Firebase session after Django authentication failure.'
      );

      try {
        await signOut(auth);
        console.log('[GENiSYS Auth] Firebase session cleared.');
      } catch (signOutError) {
        console.error('[GENiSYS Auth] Failed to clear Firebase session.', signOutError);
      }

      throw wrapped;
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError(null);
    setResendStatus(null);

    // Sanitize/validate before ever touching Firebase. This is a
    // UX / defense-in-depth layer — see inputSanitizer.ts for why
    // real SQLi/SSTI protection lives on the backend, not here.
    const emailResult = sanitizeEmailInput(email);
    const passwordResult = sanitizePasswordInput(password);

    if (emailResult.error || passwordResult.error) {
      const message = emailResult.error ?? passwordResult.error ?? 'Invalid input.';
      setError(message);
      await showAuthError('Invalid input', message, 'Client-side input validation failed');
      return;
    }

    const sanitizedEmail = emailResult.value;
    const sanitizedPassword = passwordResult.value;

    setLoading(true);
    console.log('[GENiSYS Auth] Login request initiated.');
    console.log('[GENiSYS Auth] Authentication identifier:', sanitizedEmail);

    try {
      // STEP 1: Firebase validates the user's credentials.
      console.log('[GENiSYS Auth] Contacting Firebase Authentication.');

      const credential = await signInWithEmailAndPassword(
        auth,
        sanitizedEmail,
        sanitizedPassword
      );
      const { user } = credential;

      console.log('[GENiSYS Auth] Firebase authentication successful.', {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
      });

      // STEP 2: Require verified email before application access.
      if (!user.emailVerified) {
        console.log('[GENiSYS Auth] Email verification required.');
        setPendingUser(user);
        setView('unverified');
        setLoading(false);
        return;
      }

      // STEP 3: Forward Firebase identity to Django.
      console.log('[GENiSYS Auth] Firebase identity verified.');
      console.log('[GENiSYS Auth] Forwarding Firebase identity to Django.');
      await authenticateWithBackend(user);

      // STEP 4: Only navigate after Django approves the identity.
      console.log('[GENiSYS Auth] Application authentication successful.');
      console.log('[GENiSYS Auth] Redirecting to GENiSYS workspace.');
      navigate('/');
    } catch (caughtError) {
      const firebaseCode = (caughtError as { code?: string }).code ?? '';

      if (firebaseCode.startsWith('auth/')) {
        console.error('[GENiSYS Auth] Firebase authentication rejected.', {
          code: firebaseCode,
        });

        const message = getFirebaseErrorMessage(firebaseCode);
        setError(message);
        await showAuthError(
          'Sign-in unsuccessful',
          message,
          `Firebase authentication failure: ${firebaseCode}`
        );
        setLoading(false);
        return;
      }

      const failureType = isWrappedBackendError(caughtError)
        ? caughtError.type
        : getBackendFailureType(caughtError);
      const originalError = isWrappedBackendError(caughtError)
        ? caughtError.originalError
        : caughtError;

      const message = getBackendErrorMessage(failureType);
      setError(message);

      switch (failureType) {
        case 'offline':
          console.error('[GENiSYS Auth] Django server appears to be offline.', originalError);
          await showAuthError(
            'Backend unavailable',
            'GENiSYS could not connect to the authentication server. Make sure the Django backend is running and try again.',
            'Django server unavailable'
          );
          break;

        case 'unauthorized':
          console.error('[GENiSYS Auth] Django rejected the Firebase identity.', originalError);
          await showAuthError(
            'Authentication rejected',
            'The backend could not verify your authentication session. Please sign in again.',
            'Django returned an authentication failure'
          );
          break;

        case 'forbidden':
          console.error('[GENiSYS Auth] Django denied application access.', originalError);
          await showAuthError(
            'Access denied',
            'Your account is authenticated but is not authorized to access GENiSYS.',
            'Django authorization failure'
          );
          break;

        case 'server':
          console.error('[GENiSYS Auth] Django returned a server-side failure.', originalError);
          await showAuthError(
            'Server error',
            'The GENiSYS backend encountered an internal error. Please try again later.',
            'Django server-side failure'
          );
          break;

        default:
          console.error(
            '[GENiSYS Auth] Unexpected backend authentication failure.',
            originalError
          );
          await showAuthError('Authentication error', message, 'Unexpected Django authentication failure');
      }

      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!pendingUser) {
      return;
    }

    setResendStatus(null);
    console.log('[GENiSYS Auth] Sending Firebase email verification.');

    try {
      await sendEmailVerification(pendingUser);
      console.log('[GENiSYS Auth] Verification email sent successfully.');
      setResendStatus('Verification email sent. Check your inbox.');
      await showAuthSuccess(
        'Verification email sent',
        'Check your inbox and follow the verification link.'
      );
    } catch (sendError) {
      console.error('[GENiSYS Auth] Failed to send verification email.', sendError);
      setResendStatus('Could not send verification email. Try again shortly.');
      await showAuthError(
        'Unable to send email',
        'The verification email could not be sent. Please try again shortly.',
        'Firebase verification email failure'
      );
    }
  };

  const handleCheckVerification = async () => {
    if (!pendingUser) {
      return;
    }

    setResendStatus(null);
    setError(null);
    setLoading(true);
    console.log('[GENiSYS Auth] Refreshing Firebase verification state.');

    try {
      await pendingUser.reload();

      console.log('[GENiSYS Auth] Current verification state:', {
        email: pendingUser.email,
        emailVerified: pendingUser.emailVerified,
      });

      if (!pendingUser.emailVerified) {
        console.log('[GENiSYS Auth] Email is still unverified.');
        setResendStatus('Still not verified. Check your inbox and spam folder.');
        await showAuthInfo(
          'Verification still required',
          'Your email has not been verified yet. Open the verification email and follow the link.'
        );
        setLoading(false);
        return;
      }

      console.log('[GENiSYS Auth] Email verification confirmed.');
      console.log('[GENiSYS Auth] Forwarding verified identity to Django.');
      await authenticateWithBackend(pendingUser);
      console.log('[GENiSYS Auth] Django authentication successful.');
      navigate('/');
    } catch (caughtError) {
      const wrapped = isWrappedBackendError(caughtError) ? caughtError : null;

      // Verification itself may fail independently from Django.
      if (!wrapped && !isNetworkFailure(caughtError)) {
        console.error(
          '[GENiSYS Auth] Failed while checking email verification.',
          caughtError
        );
        setResendStatus('Could not check verification status. Try again.');
        await showAuthError(
          'Verification check failed',
          'We could not confirm your email verification status. Please try again.',
          'Firebase verification state refresh failure'
        );
        setLoading(false);
        return;
      }

      const failureType = wrapped ? wrapped.type : getBackendFailureType(caughtError);
      const message = getBackendErrorMessage(failureType);

      console.error('[GENiSYS Auth] Verification/backend authentication failure.', {
        failureType,
        caughtError,
      });

      setError(message);

      if (failureType === 'offline') {
        await showAuthError(
          'Backend unavailable',
          'GENiSYS could not connect to the authentication server. Make sure the Django backend is running and try again.',
          'Django server unavailable during verification'
        );
      } else if (failureType === 'forbidden') {
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

  const handleBackToForm = () => {
    console.log('[GENiSYS Auth] Returning to login form.');
    setView('form');
    setPendingUser(null);
    setResendStatus(null);
    setError(null);
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    error,
    view,
    pendingUser,
    resendStatus,
    handleSubmit,
    handleResendVerification,
    handleCheckVerification,
    handleBackToForm,
  };
}
