import { initializeApp, getApps, getApp } from 'firebase/app';
// @ts-ignore - getReactNativePersistence is available at runtime in firebase/auth for React Native
import { initializeAuth, getReactNativePersistence, GoogleAuthProvider, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '../config/env';

const firebaseConfig = {
  apiKey: ENV.FIREBASE_API_KEY,
  authDomain: ENV.FIREBASE_AUTH_DOMAIN,
  projectId: ENV.FIREBASE_PROJECT_ID,
  storageBucket: ENV.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: ENV.FIREBASE_MESSAGING_SENDER_ID,
  appId: ENV.FIREBASE_APP_ID,
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

const db = getFirestore(app, ENV.FIREBASE_DATABASE_ID);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };
