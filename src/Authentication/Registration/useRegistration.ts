import { useState, type FormEvent } from 'react';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';

import { auth } from '../../lib/firebase';
import { evaluatePassword } from './passwordPolicy';
import { getFirebaseErrorMessage } from './firebaseErrorMessages';

export function useRegistration() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Recomputed on every render from current input — this is what
  // drives the live checklist and match indicator as the user types.
  const passwordPolicy = evaluatePassword(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    setError(null);

    if (!email || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }

    if (!passwordPolicy.isValid) {
      setError('Password does not meet the requirements below.');
      return;
    }

    if (!passwordsMatch) {
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

  return {
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    loading,
    error,
    submitted,
    passwordChecks: passwordPolicy.checks,
    passwordsMatch,
    handleSubmit,
  };
}
