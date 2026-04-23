import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { VoterContext, UserLocation } from "../types";

export interface UserProgress {
  location: UserLocation | null;
  voterContext: VoterContext | null;
  checklistProgress: Record<string, boolean>;
  lastUpdated: unknown;
}

/**
 * Saves user roadmap progress to Firestore.
 * Ensures data minimization by only storing non-sensitive context.
 */
export const saveUserProgress = async (userId: string, progress: Partial<UserProgress>) => {
  if (!db) return;
  try {
    const userRef = doc(db, "users", userId);
    const sanitizedProgress = { ...progress };
    if (sanitizedProgress.location) {
      const { formattedAddress, ...minimalLocation } = sanitizedProgress.location;
      sanitizedProgress.location = minimalLocation as UserLocation;
    }

    await setDoc(userRef, {
      ...sanitizedProgress,
      lastUpdated: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error("Error saving user progress:", error);
  }
};

/**
 * Retrieves user roadmap progress from Firestore.
 */
export const getUserProgress = async (userId: string): Promise<UserProgress | null> => {
  if (!db) return null;
  try {
    const userRef = doc(db, "users", userId);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProgress;
    }
    return null;
  } catch (error) {
    console.error("Error getting user progress:", error);
    return null;
  }
};
