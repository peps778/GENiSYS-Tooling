import { useState, type ReactNode } from 'react';

import { EyeIcon, EyeOffIcon } from './PasswordVisibilityIcons';

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  disabled?: boolean;
  placeholder?: string;
  /** Optional content rendered below the input, e.g. requirements or a match indicator. */
  children?: ReactNode;
}

/**
 * Password `<input>` with a show/hide toggle, styled identically to
 * the rest of the form's inputs. Visibility state is local to each
 * field, so the password and confirm-password fields toggle
 * independently.
 */
export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  disabled,
  placeholder,
  children,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label
        htmlFor={id}
        className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400"
      >
        {label}
      </label>

      <div className="relative mt-1.5">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className="w-full rounded-lg border border-emerald-900/10 bg-white px-3 py-2.5 pr-10 text-sm text-slate-950 outline-none transition-all duration-300 placeholder:text-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 disabled:opacity-60"
          placeholder={placeholder}
        />

        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          disabled={disabled}
          tabIndex={-1}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition-colors duration-200 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>

      {children}
    </div>
  );
}
