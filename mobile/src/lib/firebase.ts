import { initializeApp, getApps, getApp } from 'firebase/app';
// @ts-ignore - getReactNativePersistence is available at runtime in firebase/auth for React Native
import { initializeAuth, getReactNativePersistence, GoogleAuthProvider, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAPlp8vU1T662M3LL0GeGV1UIJ3ZZX2I-s",
  authDomain: "gen-lang-client-0285677203.firebaseapp.com",
  projectId: "gen-lang-client-0285677203",
  storageBucket: "gen-lang-client-0285677203.firebasestorage.app",
  messagingSenderId: "987579083588",
  appId: "1:987579083588:web:2b0e98695a234a53a98511"
};

let app: ReturnType<typeof initializeApp>;
let auth: ReturnType<typeof getAuth>;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  // Initialize auth with AsyncStorage persistence so sessions survive app restarts
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage)
    });
  } catch (e) {
    auth = getAuth(app);
  }
} else {
  app = getApp();
  auth = getAuth(app);
}

const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };
