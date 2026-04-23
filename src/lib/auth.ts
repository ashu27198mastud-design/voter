import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User, 
  ConfirmationResult,
  ApplicationVerifier,
  PhoneAuthProvider,
  signInWithPhoneNumber
} from "firebase/auth";
import { 
  auth, 
  googleProvider, 
  RecaptchaVerifier, 
  multiFactor as firebaseMultiFactor 
} from "./firebase";

/**
 * Signs in the user using Google Provider.
 */
export const signInWithGoogle = async () => {
  if (!auth || !googleProvider) return null;
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

/**
 * Signs out the current user.
 */
export const logOut = async () => {
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

/**
 * Listens for auth state changes.
 */
export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, callback);
};

/**
 * Initializes the reCAPTCHA verifier for phone authentication.
 */
export const initRecaptcha = (containerId: string): ApplicationVerifier | null => {
  if (!auth || typeof window === 'undefined') return null;
  
  return new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved
    }
  });
};

/**
 * Sends an OTP to the specified phone number.
 */
export const sendPhoneOtp = async (phoneNumber: string, appVerifier: ApplicationVerifier): Promise<ConfirmationResult | null> => {
  if (!auth) return null;
  try {
    return await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
  } catch (error) {
    console.error("Error sending OTP:", error);
    throw error;
  }
};

/**
 * Enrolls a phone number for Multi-Factor Authentication.
 */
export const enrollPhoneMFA = async (session: unknown, phoneNumber: string, appVerifier: ApplicationVerifier) => {
  if (!auth || !auth.currentUser) return null;
  
  try {
    const phoneInfoOptions = {
      phoneNumber: phoneNumber,
      session: session as string // Cast to expected type if known, or leave as unknown if SDK allows
    };
    
    const phoneAuthProvider = new PhoneAuthProvider(auth);
    return await phoneAuthProvider.verifyPhoneNumber(phoneInfoOptions, appVerifier);
  } catch (error) {
    console.error("Error enrolling MFA:", error);
    throw error;
  }
};

/**
 * Unenrolls Multi-Factor Authentication for the user.
 */
export const unenrollPhoneMFA = async (factorUid: string) => {
  if (!auth || !auth.currentUser) return;
  try {
    const user = firebaseMultiFactor(auth.currentUser);
    await user.unenroll(factorUid);
  } catch (error) {
    console.error("Error unenrolling MFA:", error);
    throw error;
  }
};

/**
 * Checks if the current user has MFA enabled.
 */
export const isMFAEnabled = (): boolean => {
  if (!auth || !auth.currentUser) return false;
  const user = firebaseMultiFactor(auth.currentUser);
  return user.enrolledFactors.length > 0;
};
