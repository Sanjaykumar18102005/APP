import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';



const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID || import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID || import.meta.env.VITE_FIREBASE_APP_ID,
  firestoreDatabaseId: process.env.FIREBASE_DATABASE_ID || import.meta.env.VITE_FIREBASE_DATABASE_ID,
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
    if (error.code === 'auth/unauthorized-domain') {
       alert(`Domain not authorized: "${window.location.hostname}". \n\nPlease add this domain to "Authorized domains" in your Firebase Console (Authentication > Settings).`);
    } else if (error.code === 'auth/operation-not-allowed') {
       alert("Google Sign-in is not enabled. Please enable it in Firebase Console (Authentication > Sign-in method).");
    } else {
       alert(`Login failed: ${error.message}`);
    }
    throw error;
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
