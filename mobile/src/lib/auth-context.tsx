import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from './firebase';
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  signInAnonymously,
  signInWithCredential,
  GoogleAuthProvider
} from 'firebase/auth';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { syncUserProfile } from './user-service';

// Required for expo-auth-session to close the browser after OAuth
WebBrowser.maybeCompleteAuthSession();

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  isSandbox?: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================
// IMPORTANT: To enable real Google Sign-In, get your Web Client ID from:
// Firebase Console → Authentication → Sign-in method → Google → 
//   "Web SDK configuration" → "Web client ID"
// Then replace the value below:
// ============================================================
const FIREBASE_WEB_CLIENT_ID = '987579083588-4g2sdq0o8upc9g9l2jcl7b6i6e5yfqcf.apps.googleusercontent.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // expo-auth-session Google provider — uses Expo Go proxy in development
  // expoClientId: Uses auth.expo.io proxy (no real client ID needed for Expo Go dev)
  // webClientId: The Firebase Web Client ID for production
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: FIREBASE_WEB_CLIENT_ID,
    selectAccount: true,
  });

  // Handle Google OAuth response
  useEffect(() => {
    const handleGoogleResponse = async () => {
      if (response?.type === 'success') {
        const { id_token, access_token } = response.authentication ?? {};
        
        try {
          let credential;
          if (id_token) {
            credential = GoogleAuthProvider.credential(id_token);
          } else if (access_token) {
            credential = GoogleAuthProvider.credential(null, access_token);
          } else {
            setAuthError('Google Sign-In failed: No token received.');
            return;
          }

          const cred = await signInWithCredential(auth, credential);
          const u: UserProfile = {
            uid: cred.user.uid,
            displayName: cred.user.displayName || 'Google User',
            email: cred.user.email,
            photoURL: cred.user.photoURL || '',
          };
          await AsyncStorage.removeItem('promptglow_mobile_user');
          setUser(u);
          setAuthError(null);
          await syncUserProfile(u);
        } catch (err: any) {
          setAuthError(formatAuthError(err));
        }
      } else if (response?.type === 'error') {
        setAuthError('Google Sign-In failed. Please try again.');
      }
    };

    if (response) {
      handleGoogleResponse();
    }
  }, [response]);

  useEffect(() => {
    let firebaseUnsub: (() => void) | undefined;

    AsyncStorage.getItem('promptglow_mobile_user').then((saved) => {
      if (saved) {
        try {
          setUser(JSON.parse(saved));
        } catch {
          AsyncStorage.removeItem('promptglow_mobile_user');
        }
        setLoading(false);
      } else if (auth) {
        firebaseUnsub = onAuthStateChanged(auth, (firebaseUser) => {
          if (firebaseUser && !firebaseUser.isAnonymous) {
            const u: UserProfile = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || 'Explorer',
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || '',
            };
            setUser(u);
            syncUserProfile(u).catch(console.warn);
          } else {
            setUser(null);
          }
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => {
      if (firebaseUnsub) firebaseUnsub();
    };
  }, []);

  const formatAuthError = (err: any): string => {
    const code = err?.code || '';
    const message = err?.message || '';

    if (code === 'auth/operation-not-allowed' || message.includes('operation-not-allowed')) {
      return 'Email/Password Sign-In is disabled in Firebase Console. Please enable it under Authentication → Sign-in method.';
    }
    if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
      return 'Invalid email or password. Please check your credentials.';
    }
    if (code === 'auth/email-already-in-use') {
      return 'An account already exists with this email. Please sign in instead.';
    }
    if (code === 'auth/weak-password') {
      return 'Password is too weak. Please use at least 6 characters.';
    }
    if (code === 'auth/invalid-email') {
      return 'Please enter a valid email address.';
    }
    return message || 'Authentication failed. Please try again.';
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setAuthError(null);
    if (!auth) throw new Error('Firebase Auth is not configured.');
    try {
      await AsyncStorage.removeItem('promptglow_mobile_user');
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const u: UserProfile = {
        uid: cred.user.uid,
        displayName: cred.user.displayName || email.split('@')[0],
        email: cred.user.email,
        photoURL: cred.user.photoURL || '',
      };
      setUser(u);
      await syncUserProfile(u);
    } catch (err: any) {
      const msg = formatAuthError(err);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    setAuthError(null);
    if (!auth) throw new Error('Firebase Auth is not configured.');
    try {
      await AsyncStorage.removeItem('promptglow_mobile_user');
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      if (cred.user && name) {
        await updateProfile(cred.user, { displayName: name });
      }
      const u: UserProfile = {
        uid: cred.user.uid,
        displayName: name || email.split('@')[0],
        email: cred.user.email,
        photoURL: cred.user.photoURL || '',
      };
      setUser(u);
      await syncUserProfile(u);
    } catch (err: any) {
      const msg = formatAuthError(err);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const loginWithGoogle = async () => {
    setAuthError(null);
    try {
      // Opens the real Google account picker in a browser sheet
      const result = await promptAsync();
      if (result?.type === 'dismiss') {
        // User cancelled — no error needed
      }
    } catch (err: any) {
      setAuthError('Google Sign-In could not be launched. Please try again.');
    }
  };

  const loginAsGuest = async () => {
    setAuthError(null);
    let guestUid = `sandbox_guest_${Date.now()}`;

    if (auth) {
      try {
        const anonCred = await signInAnonymously(auth);
        if (anonCred?.user) guestUid = anonCred.user.uid;
      } catch (e) {
        console.warn('Anonymous sign-in fallback:', e);
      }
    }

    const guestUser: UserProfile = {
      uid: guestUid,
      displayName: 'Sandbox Explorer',
      email: 'explorer@promptglow.sandbox',
      photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
      isSandbox: true,
    };

    await AsyncStorage.setItem('promptglow_mobile_user', JSON.stringify(guestUser));
    setUser(guestUser);
    syncUserProfile(guestUser).catch(console.warn);
  };

  const logout = async () => {
    setAuthError(null);
    await AsyncStorage.removeItem('promptglow_mobile_user');
    setUser(null);
    if (auth) {
      try {
        await firebaseSignOut(auth);
      } catch (e) {
        console.warn('Sign out error:', e);
      }
    }
  };

  const clearAuthError = () => setAuthError(null);

  return (
    <AuthContext.Provider value={{ user, loading, authError, clearAuthError, loginWithEmail, registerWithEmail, loginWithGoogle, loginAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
