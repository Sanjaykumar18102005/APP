import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAPlp8vU1T662M3LL0GeGV1UIJ3ZZX2I-s",
  authDomain: "gen-lang-client-0285677203.firebaseapp.com",
  projectId: "gen-lang-client-0285677203",
  storageBucket: "gen-lang-client-0285677203.firebasestorage.app",
  messagingSenderId: "987579083588",
  appId: "1:987579083588:web:2b0e98695a234a53a98511"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
