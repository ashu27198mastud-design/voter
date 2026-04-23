import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { 
  getAuth, 
  GoogleAuthProvider, 
  RecaptchaVerifier, 
  PhoneAuthProvider, 
  PhoneMultiFactorGenerator,
  multiFactor 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase conditionally to prevent build-time errors when env vars are missing
// We check for a real-looking key (must start with AIza) to avoid placeholders breaking the build
const isConfigValid = !!firebaseConfig.apiKey && firebaseConfig.apiKey.startsWith('AIza');

const app = !isConfigValid 
  ? (null as unknown as ReturnType<typeof initializeApp>)
  : (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig));

const auth = isConfigValid ? getAuth(app) : (null as unknown as ReturnType<typeof getAuth>);
const googleProvider = isConfigValid ? new GoogleAuthProvider() : (null as unknown as GoogleAuthProvider);
const db = isConfigValid ? getFirestore(app) : (null as unknown as ReturnType<typeof getFirestore>);

export { 
  app, 
  auth, 
  googleProvider, 
  db, 
  RecaptchaVerifier, 
  PhoneAuthProvider, 
  PhoneMultiFactorGenerator, 
  multiFactor 
};

export const getSafeAnalytics = async () => {
  if (isConfigValid && typeof window !== 'undefined' && (await isSupported())) {
    return getAnalytics(app);
  }
  return null;
};

export const logFirebaseEvent = async (name: string, params?: Record<string, unknown>) => {
  const analytics = await getSafeAnalytics();
  if (analytics) {
    const { logEvent } = await import('firebase/analytics');
    logEvent(analytics, name, params);
  }
};

