import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '../lib/firebase';

function getFirebaseErrorMessage(code: string): string {
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

// UI-only feature flag. This does not gate account creation on the
// backend — Django/Firebase Admin remain the actual security boundary.
const registrationEnabled = import.meta.env.PUBLIC_REGISTRATION_ENABLED === 'true';

const Registration = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    setError(null);

    if (!email || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(credential.user);
      setSubmitted(true);
    } catch (err) {
      const code = (err as { code?: string }).code ?? '';
      setError(getFirebaseErrorMessage(code));
    } finally {
      setLoading(false);
    }
  };

  if (!registrationEnabled) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-white p-6 text-slate-950">
        <div className="w-full max-w-sm rounded-2xl border border-emerald-900/10 bg-white/80 p-6 text-center shadow-sm shadow-emerald-900/5">
          <h1 className="text-lg font-bold leading-tight tracking-[-0.02em] text-green-950">
            Registration is currently unavailable
          </h1>
          <p className="mt-3 text-xs leading-6 text-slate-500">
            New account creation is disabled at this time. Contact an administrator if
            you need access.
          </p>
          <Link
            to="/login"
            className="mt-5 inline-block rounded-lg border border-emerald-900/10 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 transition-all duration-300 hover:border-emerald-300 hover:bg-emerald-50/50"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-white p-6 text-slate-950">
        <div className="w-full max-w-sm rounded-2xl border border-emerald-900/10 bg-white/80 p-6 shadow-sm shadow-emerald-900/5">
          <div className="mb-4 flex items-center gap-3">
            <span className="font-mono text-[10px] text-emerald-600/70">03 /</span>
            <span className="h-px w-8 bg-emerald-500/30" />
            <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-slate-400">
              Verify Email
            </span>
          </div>

          <h1 className="text-lg font-bold leading-tight tracking-[-0.02em] text-green-950">
            Check your inbox
          </h1>

          <p className="mt-3 text-xs leading-6 text-slate-500">
            A verification link has been sent to{' '}
            <span className="text-slate-700">{email}</span>. Verify your email, then
            sign in.
          </p>

          <Link
            to="/login"
            className="mt-5 inline-block rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-white transition-all duration-300 hover:bg-emerald-700"
          >
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white p-6 text-slate-950">
      <div className="w-full max-w-sm rounded-2xl border border-emerald-900/10 bg-white/80 p-6 shadow-sm shadow-emerald-900/5">
        <div className="mb-4 flex items-center gap-3">
          <span className="font-mono text-[10px] text-emerald-600/70">00 /</span>
          <span className="h-px w-8 bg-emerald-500/30" />
          <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-slate-400">
            Hack4Gov Toolkit
          </span>
        </div>

        <h1 className="text-2xl font-bold leading-tight tracking-[-0.03em] text-green-950">
          Create account
        </h1>
        <p className="mt-1.5 text-xs text-slate-500">Register for GENiSYS workspace access.</p>

        <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
          <div>
            <label
              htmlFor="reg-email"
              className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400"
            >
              Email
            </label>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={loading}
              className="mt-1.5 w-full rounded-lg border border-emerald-900/10 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition-all duration-300 placeholder:text-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 disabled:opacity-60"
              placeholder="you@agency.gov"
            />
          </div>

          <div>
            <label
              htmlFor="reg-password"
              className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400"
            >
              Password
            </label>
            <input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={loading}
              className="mt-1.5 w-full rounded-lg border border-emerald-900/10 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition-all duration-300 placeholder:text-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 disabled:opacity-60"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label
              htmlFor="reg-confirm-password"
              className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400"
            >
              Confirm password
            </label>
            <input
              id="reg-confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              disabled={loading}
              className="mt-1.5 w-full rounded-lg border border-emerald-900/10 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition-all duration-300 placeholder:text-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 disabled:opacity-60"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p role="alert" className="text-[11px] leading-5 text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-white transition-all duration-300 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-5 text-center text-[11px] text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-emerald-600 hover:text-emerald-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Registration;