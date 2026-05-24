import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

// Use environment variables if available (for Netlify/Vercel/etc), otherwise use the JSON file
const getSafeVal = (envVal: string | undefined, jsonVal: string | undefined) => {
  const isPlaceHolder = (v: string | undefined) => !v || v.startsWith('YOUR_') || v.startsWith('MY_') || v === 'none';
  if (envVal && !isPlaceHolder(envVal)) return envVal;
  if (jsonVal && !isPlaceHolder(jsonVal)) return jsonVal;
  return undefined;
};

const firebaseConfig = {
  apiKey: getSafeVal(import.meta.env.VITE_FIREBASE_API_KEY, firebaseConfigJson.apiKey),
  authDomain: getSafeVal(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, firebaseConfigJson.authDomain),
  projectId: getSafeVal(import.meta.env.VITE_FIREBASE_PROJECT_ID, firebaseConfigJson.projectId),
  storageBucket: getSafeVal(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, firebaseConfigJson.storageBucket),
  messagingSenderId: getSafeVal(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID, firebaseConfigJson.messagingSenderId),
  appId: getSafeVal(import.meta.env.VITE_FIREBASE_APP_ID, firebaseConfigJson.appId),
  firestoreDatabaseId: getSafeVal(import.meta.env.VITE_FIREBASE_DATABASE_ID, firebaseConfigJson.firestoreDatabaseId),
};

export const isFirebaseConfigured = !!(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.apiKey.length > 15);

if (!isFirebaseConfigured) {
  console.warn("Firebase configuration is missing or incomplete. Some features will be disabled.");
}

// Only initialize if we have at least an API key and Project ID to avoid immediate crashes
let app: any = null;
let db: any = null;
let auth: any = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig as any);
    db = firebaseConfig.firestoreDatabaseId 
      ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
      : getFirestore(app);
    auth = getAuth(app);
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
}

export { app, db, auth };

export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    if (!auth) {
      throw new Error("Firebase is not configured correctly. Please check your environment variables.");
    }
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Error signing in with Google", error);
    let errorDetail = error?.message || "Unknown auth error";
    if (error.code === 'auth/unauthorized-domain') {
       errorDetail = `Domain not authorized: "${window.location.hostname}". Please add this domain to "Authorized domains" in your Firebase Console (Authentication > Settings).`;
    } else if (error.code === 'auth/operation-not-allowed') {
       errorDetail = "Google Sign-in is not enabled. Please enable it in Firebase Console (Authentication > Sign-in method).";
    }
    console.error("Auth Failure Detail:", errorDetail);
    throw new Error(errorDetail);
  }
};

export const signOut = async () => {
  try {
    if (auth) {
      await firebaseSignOut(auth);
    }
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};

export async function testConnection() {
  if (!db) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
if (isFirebaseConfigured) {
  testConnection();
}
