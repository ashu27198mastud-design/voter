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

// Check for valid config
const isConfigValid = !!firebaseConfig.apiKey && firebaseConfig.apiKey.startsWith('AIza');

// Initialize primitives
let app: any = null;
let auth: any = null;
let googleProvider: any = null;
let db: any = null;

if (isConfigValid) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    db = getFirestore(app);
  } catch (error) {
    console.warn('Firebase initialization failed:', error);
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
  multiFactor 
};

export const getSafeAnalytics = async () => {
  if (isConfigValid && typeof window !== 'undefined' && (await isSupported())) {
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
