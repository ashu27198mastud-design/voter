import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';
import { 
  getAuth, 
  GoogleAuthProvider, 
  RecaptchaVerifier, 
  PhoneAuthProvider, 
  PhoneMultiFactorGenerator,
  multiFactor,
  Auth
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Strict check for valid config - prevents initialization with placeholders
const isConfigValid = typeof firebaseConfig.apiKey === 'string' && 
                      firebaseConfig.apiKey.length > 10 &&
                      firebaseConfig.apiKey.startsWith('AIza');

// Initialize primitives with extreme safety
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;
let db: Firestore | null = null;

// Only initialize if we are in a browser or if config is valid on server
if (isConfigValid) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    db = getFirestore(app);
  } catch (error) {
    // If it fails, we keep them as null
    if (typeof window !== 'undefined') {
      console.warn('Firebase failed to initialize:', error);
    }
  }
}

export { 
  app, 
  auth, 
  googleProvider, 
  db, 
  RecaptchaVerifier, 
  PhoneAuthProvider, 
  PhoneMultiFactorGenerator, 
  multiFactor,
  isConfigValid
};

export const getSafeAnalytics = async (): Promise<Analytics | null> => {
  if (isConfigValid && app && typeof window !== 'undefined' && (await isSupported())) {
    try {
      return getAnalytics(app);
    } catch (e) {
      return null;
    }
  }
  return null;
};

export const logFirebaseEvent = async (name: string, params?: Record<string, unknown>) => {
  const analytics = await getSafeAnalytics();
  if (analytics) {
    try {
      const { logEvent } = await import('firebase/analytics');
      logEvent(analytics, name, params);
    } catch (e) {
      // Ignore analytics errors
    }
  }
};
