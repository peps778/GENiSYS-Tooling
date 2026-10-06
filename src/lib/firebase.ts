import { initializeApp } from 'firebase/app';
import {
  getAnalytics,
  isSupported as isAnalyticsSupported,
} from 'firebase/analytics';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID,
  measurementId: import.meta.env.PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// TEMPORARY DEBUG — remove once the Firebase configuration issue is confirmed fixed.
// Logs which configuration keys are missing without exposing their values.
if (typeof window !== 'undefined') {
  const missing = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  console.log('[GENiSYS Firebase] Missing configuration keys:', missing);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth is the identity provider used across the app (Login, Registration,
// and the Django API client). Exported here so no component initializes
// Firebase or Auth on its own.
export const auth = getAuth(app);

// Analytics requires a browser environment. Astro renders on the server
// as well as the client, and getAnalytics() throws outside a browser, so
// it is only initialized when running client-side and supported.
export let analytics: ReturnType<typeof getAnalytics> | undefined;

if (typeof window !== 'undefined') {
  isAnalyticsSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {
      // Analytics is non-critical; silently skip if support detection fails.
    });
}

export default app;
