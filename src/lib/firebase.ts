// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import * as mockFirebase from './firebase-mock';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "mock-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "mock-domain",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mock-project-id",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "mock-bucket",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "mock-sender-id",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "mock-app-id",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "mock-measurement-id"
};

// Check if we should use mock implementation
const useMock = process.env.NEXT_PUBLIC_USE_FIREBASE_MOCK === "true";

let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let googleProvider: GoogleAuthProvider;

if (useMock) {
  console.log("Using mock Firebase implementation");
  // Use mock implementation
  auth = mockFirebase.auth;
  db = mockFirebase.db;
  storage = mockFirebase.storage;
  googleProvider = mockFirebase.googleProvider as GoogleAuthProvider;
} else {
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  
  // Initialize Firebase services
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  googleProvider = new GoogleAuthProvider();
  
  // Add scopes to Google provider
  googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
  googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');
}

export { auth, db, storage, googleProvider };
