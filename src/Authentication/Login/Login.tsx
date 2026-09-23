import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useLogin } from '../Login/useLogin';

/** Minimal inline icons so this component has no new icon-library dependency. */
function EyeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-10.5-7-10.5-7a19.14 19.14 0 0 1 4.22-5.06M9.9 4.24A10.6 10.6 0 0 1 12 4c7 0 10.5 7 10.5 7a19.2 19.2 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <path d="M1 1l22 22" />
    </svg>
  );
}

const Login = () => {
  const {
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
  } = useLogin();

  const [showPassword, setShowPassword] = useState(false);

  if (view === 'unverified') {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-white p-6 text-slate-950">
        <div className="w-full max-w-sm rounded-2xl border border-emerald-900/10 bg-white/80 p-6 shadow-sm shadow-emerald-900/5">
          <div className="mb-4 flex items-center gap-3">
            <span className="font-mono text-[10px] text-emerald-600/70">02 /</span>
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
            <span className="text-slate-700">{pendingUser?.email}</span>. Verify your email to
            finish signing in.
          </p>

          {resendStatus && (
            <p className="mt-3 text-[11px] leading-5 text-emerald-700">{resendStatus}</p>
          )}

          {error && (
            <p role="alert" className="mt-3 text-[11px] leading-5 text-red-600">
              {error}
            </p>
          )}

          <div className="mt-5 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={handleCheckVerification}
              disabled={loading}
              className="rounded-lg border border-emerald-500/30 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700 transition-all duration-300 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Checking...' : "I've verified, continue"}
            </button>

            <button
              type="button"
              onClick={handleResendVerification}
              disabled={loading}
              className="rounded-lg border border-emerald-900/10 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 transition-all duration-300 hover:border-emerald-300 hover:bg-emerald-50/50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Resend verification email
            </button>

            <button
              type="button"
              onClick={handleBackToForm}
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
          <span className="font-mono text-[10px] text-emerald-600/70">00 /</span>
          <span className="h-px w-8 bg-emerald-500/30" />
          <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-slate-400">
            Hack4Gov Toolkit
          </span>
        </div>

        <h1 className="text-2xl font-bold leading-tight tracking-[-0.03em] text-green-950">
          Sign in
        </h1>
        <p className="mt-1.5 text-xs text-slate-500">Access the GENiSYS workspace.</p>

        <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
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
              onChange={(event) => setEmail(event.target.value)}
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

            <div className="relative mt-1.5">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={loading}
                className="w-full rounded-lg border border-emerald-900/10 bg-white px-3 py-2.5 pr-10 text-sm text-slate-950 outline-none transition-all duration-300 placeholder:text-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 disabled:opacity-60"
                placeholder="••••••••"
              />

              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                disabled={loading}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition-colors duration-200 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
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
            {loading ? 'Authenticating...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-5 text-center text-[11px] text-slate-400">
          Need an account?{' '}
          <Link to="/registration" className="font-medium text-emerald-600 hover:text-emerald-700">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
