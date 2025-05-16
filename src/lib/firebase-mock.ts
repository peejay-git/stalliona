import { Auth } from "firebase/auth";
import { Firestore } from "firebase/firestore";
import { FirebaseStorage } from "firebase/storage";

// Create mock implementations
const mockAuth = {
  currentUser: null,
  onAuthStateChanged: (callback: any) => {
    // Never trigger auth state changes
    return () => {};
  }
} as unknown as Auth;

const mockDb = {} as Firestore;
const mockStorage = {} as FirebaseStorage;
const mockGoogleProvider = {};

// Export the mock objects
export const auth = mockAuth;
export const db = mockDb;
export const storage = mockStorage;
export const googleProvider = mockGoogleProvider;

console.log("Using mock Firebase for development"); 