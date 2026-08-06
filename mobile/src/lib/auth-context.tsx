import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
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
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { syncUserProfile } from './user-service';
import { ENV } from '../config/env';


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
  redirectUri: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const FIREBASE_WEB_CLIENT_ID = ENV.GOOGLE_WEB_CLIENT_ID;
const GOOGLE_ANDROID_CLIENT_ID = ENV.GOOGLE_ANDROID_CLIENT_ID;

// NOTE: GoogleSignin is configured inside loginWithGoogle() to guarantee ENV values are loaded

const redirectUri = 'promptglow://';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    // Subscribe to Firebase Auth state changes as the single source of truth
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('[Auth] onAuthStateChanged triggered. User UID:', firebaseUser?.uid);
      if (firebaseUser && !firebaseUser.isAnonymous) {
        const u: UserProfile = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || 'Explorer',
          email: firebaseUser.email || '',
          photoURL: firebaseUser.photoURL || '',
        };
        setUser(u);
        await AsyncStorage.setItem('promptglow_mobile_user', JSON.stringify(u));
        syncUserProfile(u).catch(console.warn);
      } else {
        // Fallback check for Guest/Sandbox mode users which are saved locally
        const saved = await AsyncStorage.getItem('promptglow_mobile_user');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed.isSandbox) {
              setUser(parsed);
              setLoading(false);
              return;
            }
          } catch {
            await AsyncStorage.removeItem('promptglow_mobile_user');
          }
        }
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const formatAuthError = (err: any): string => {
    const message = err?.message || String(err);
    const code = err?.code || '';

    if (message.includes('DEVELOPER_ERROR') || String(code) === '10' || message.includes('code 10')) {
      // SHA-1 mismatch or OAuth client not configured for this build — show friendly fallback
      return 'Google Sign-In is not available for this build. Please use Email/Password or continue as a Guest instead.';
    }
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
    console.log('[Google Auth] Initiating Native Google Sign-In...');
    console.log('[Google Auth] webClientId:', ENV.GOOGLE_WEB_CLIENT_ID);
    console.log('[Google Auth] androidClientId:', ENV.GOOGLE_ANDROID_CLIENT_ID);
    try {
      // Configure right before sign-in so ENV values are always fresh
      GoogleSignin.configure({
        webClientId: ENV.GOOGLE_WEB_CLIENT_ID,
        scopes: ['email', 'profile'],
        offlineAccess: true,
      });

      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      console.log('[Google Auth] Raw response type:', response?.type);

      // Support both v16+ {type, data} and older {user, idToken} response shapes
      const googleUser = (response as any)?.data?.user ?? (response as any)?.user;
      const idToken = (response as any)?.data?.idToken ?? (response as any)?.idToken;

      console.log('[Google Auth] googleUser present:', !!googleUser, '| idToken present:', !!idToken);

      if (!googleUser) {
        console.warn('[Google Auth] No user object in response - user may have cancelled');
        return;
      }

      const userEmail = googleUser?.email || '';
      const userName = googleUser?.name || googleUser?.givenName || userEmail.split('@')[0] || 'Google User';
      const userPhoto = googleUser?.photo || '';
      const googleId = googleUser?.id || String(Date.now());

      let firebaseUid = `google_${googleId}`;

      if (idToken && auth) {
        try {
          console.log('[Google Auth] Signing in to Firebase with credential...');
          const credential = GoogleAuthProvider.credential(idToken);
          const cred = await signInWithCredential(auth, credential);
          if (cred?.user?.uid) {
            firebaseUid = cred.user.uid;
            console.log('[Google Auth] Firebase UID:', firebaseUid);
          }
        } catch (fbErr: any) {
          console.error('[Google Auth] Firebase credential verification failed:', fbErr?.code, fbErr?.message);
          Alert.alert(
            'Firebase Auth Sync Error',
            `Google authentication succeeded, but Firebase rejected the credential:\n\nError: ${fbErr?.message || fbErr}\nCode: ${fbErr?.code || 'unknown'}\n\nPlease check if Google Sign-In is enabled in your Firebase console.`
          );
        }
      } else {
        console.warn('[Google Auth] No idToken received in response.');
        Alert.alert(
          'Google Sign-In Warning',
          'Failed to retrieve security token (idToken) from Google. Firebase profile sync might be incomplete.'
        );
      }

      const u: UserProfile = {
        uid: firebaseUid,
        displayName: userName,
        email: userEmail,
        photoURL: userPhoto,
      };

      await AsyncStorage.setItem('promptglow_mobile_user', JSON.stringify(u));
      setUser(u);
      setAuthError(null);
      await syncUserProfile(u);
      console.log('[Google Auth] Sign-in complete:', userEmail);
    } catch (err: any) {
      const errCode = String(err?.code ?? '');
      const errMsg = err?.message || String(err);
      console.error('[Google Auth] SIGN-IN ERROR — code:', errCode, '| message:', errMsg);
      console.error('[Google Auth] Full error:', JSON.stringify(err));

      // DEVELOPER_ERROR (code 10) = SHA-1/webClientId mismatch
      if (errMsg.includes('DEVELOPER_ERROR') || errCode === '10' || errMsg.includes('code 10')) {
        console.error('[Google Auth] DEVELOPER_ERROR detected.');
        console.error('  webClientId used:', ENV.GOOGLE_WEB_CLIENT_ID);
        console.error('  SHA-1 must be registered in Firebase Console for package com.promptglow.mobile');
        setAuthError('Google Sign-In failed (DEVELOPER_ERROR). Check logcat for details. You can use Email or Guest mode below.');
        return;
      }

      // Silently ignore cancellation
      const isCancelled =
        errMsg.includes('CANCELLED') ||
        errMsg.includes('12501') ||
        errCode === '12501' ||
        errCode === 'SIGN_IN_CANCELLED';

      if (!isCancelled) {
        setAuthError(formatAuthError(err));
      }
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
        console.warn('Firebase Sign out error:', e);
      }
    }
    try {
      // Ensure GoogleSignin is configured in this session before signing out
      GoogleSignin.configure({
        webClientId: ENV.GOOGLE_WEB_CLIENT_ID,
        scopes: ['email', 'profile'],
        offlineAccess: true,
      });
      // Clear native Google session so the account picker shows again on next login
      await GoogleSignin.signOut();
    } catch (e) {
      console.warn('Google Sign out error:', e);
    }
  };

  const clearAuthError = () => setAuthError(null);

  return (
    <AuthContext.Provider value={{ user, loading, authError, clearAuthError, loginWithEmail, registerWithEmail, loginWithGoogle, loginAsGuest, logout, redirectUri }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
