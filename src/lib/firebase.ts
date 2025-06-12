// Import the functions you need from the SDKs you need
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Function to determine the best authDomain to use
const getBestAuthDomain = () => {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "";
  }
  
  const hostname = window.location.hostname;
  
  // For production domains, use the current hostname directly
  if (hostname === 'earnstallions.xyz' || hostname === 'www.earnstallions.xyz' || hostname === 'earnstallions.com') {
    return hostname;
  }
  
  // For localhost, use the default Firebase authDomain
  return process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "";
};

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  // CRITICAL: Set the authDomain using our custom function
  authDomain: getBestAuthDomain(),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ""
};

// Log Firebase config for debugging (without sensitive data)
if (typeof window !== 'undefined') {
  console.log("Firebase authDomain:", firebaseConfig.authDomain);
  console.log("Current origin:", window.location.origin);
  console.log("Current hostname:", window.location.hostname);
}

// Check if any Firebase apps have been initialized
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let googleProvider: GoogleAuthProvider;

// Only initialize Firebase on the client side to avoid SSR issues
if (typeof window !== 'undefined') {
  try {
// Initialize Firebase
    app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Initialize Firebase services
    auth = getAuth(app);
    
// Set auth persistence to local (this helps with handling redirects)
    // Only set persistence on the client side
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error("Firebase auth persistence error:", error);
  });

    db = getFirestore(app);
    storage = getStorage(app);
    googleProvider = new GoogleAuthProvider();

// Add scopes to Google provider
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');
    
    // Set custom parameters to help with domain authorization
    googleProvider.setCustomParameters({
      prompt: 'select_account',
      login_hint: window.location.hostname
    });
    
    // Log current domain to help with debugging
    console.log("Current domain for Firebase auth:", window.location.origin);
    console.log("Auth config:", {
      authDomain: auth.config.authDomain,
      apiKey: "[REDACTED]"
    });
  } catch (error) {
    console.error("Error initializing Firebase:", error);
  }
} else {
  // Server-side initialization - use empty app
  try {
    app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    // Initialize with empty implementations that will be replaced on client side
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    googleProvider = new GoogleAuthProvider();
  } catch (error) {
    console.error("Error initializing Firebase on server:", error);
    // Fallback to dummy objects if initialization fails
    // @ts-ignore - Temporary stubs for server-side rendering
    auth = {};
    // @ts-ignore
    db = {};
    // @ts-ignore
    storage = {};
    googleProvider = new GoogleAuthProvider();
  }
}

export { auth, db, storage, googleProvider };
