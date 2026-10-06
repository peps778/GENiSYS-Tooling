import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

/**
 * Signs the user out of Firebase and returns to the login screen.
 *
 * Firebase is the source of truth for authentication, so signing out
 * here is what actually changes the auth state used by the router.
 */
export async function logout(): Promise<void> {
  try {
    await signOut(auth);

    window.location.href = '/login';
  } catch (error) {}
}
