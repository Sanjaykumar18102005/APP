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
import * as AuthSession from 'expo-auth-session';
import { syncUserProfile } from './user-service';

// Required for expo-auth-session to complete authentication on mobile browsers
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
  redirectUri: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const FIREBASE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '987579083588-4g2sdq0o8upc9g9l2jcl7b6i6e5yfqcf.apps.googleusercontent.com';

// Generate runtime redirect URI.
let redirectUri = AuthSession.makeRedirectUri({ scheme: 'promptglow' });

// If running in Expo Go (redirectUri starts with exp://), Google blocks exp:// custom schemes.
// In Expo Go, we construct the Expo Auth Proxy URL (https://auth.expo.io) for Google OAuth compatibility.
if (redirectUri.startsWith('exp://')) {
  redirectUri = 'https://auth.expo.io';
}

console.log('[Google Auth Config] Calculated runtime redirectUri:', redirectUri);
console.log('[Google Auth Config] Loaded FIREBASE_WEB_CLIENT_ID:', FIREBASE_WEB_CLIENT_ID);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Configure Google Auth Request
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: FIREBASE_WEB_CLIENT_ID,
    webClientId: FIREBASE_WEB_CLIENT_ID,
    redirectUri: redirectUri,
    selectAccount: true,
  });

  // Handle Google OAuth response
  useEffect(() => {
    const handleGoogleResponse = async () => {
      console.log('[Google Auth] Received response type:', response?.type);
      if (response?.type === 'success') {
        const authInfo = response.authentication as any;
        console.log('[Google Auth] Auth response params/authentication:', response.params, authInfo);
        const { idToken, accessToken } = authInfo ?? {};

        try {
          let credential;
          const token = idToken || response.params?.id_token;
          const rawAccessToken = accessToken || response.params?.access_token;

          if (token) {
            console.log('[Google Auth] Creating credential with idToken length:', token.length);
            credential = GoogleAuthProvider.credential(token);
          } else if (rawAccessToken) {
            console.log('[Google Auth] Creating credential with rawAccessToken length:', rawAccessToken.length);
            credential = GoogleAuthProvider.credential(null, rawAccessToken);
          } else {
            console.error('[Google Auth] Error: No token or access_token in OAuth response!');
            setAuthError('Google Sign-In failed: No ID token or Access token received from Google.');
            return;
          }

          console.log('[Google Auth] Calling signInWithCredential with Firebase...');
          const cred = await signInWithCredential(auth, credential);
          console.log('[Google Auth] Firebase authentication success! User UID:', cred.user.uid);

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
          console.error('[Google Auth] Firebase signInWithCredential error:', err);
          setAuthError(formatAuthError(err));
        }
      } else if (response?.type === 'error') {
        console.error('[Google Auth] Response type error:', response.error);
        setAuthError('Google Sign-In failed. Please ensure the redirect URI is added to Google Cloud Console.');
      } else if (response?.type === 'dismiss') {
        console.log('[Google Auth] Authentication session dismissed by user.');
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
    console.log('[Google Auth] Prompting Google OAuth flow...');
    console.log('[Google Auth] Prompting with request:', !!request, 'redirectUri:', redirectUri);
    try {
      if (!request) {
        console.warn('[Google Auth] Google Auth request not initialized yet');
      }
      const result = await promptAsync();
      console.log('[Google Auth] promptAsync result:', result);
      if (result?.type === 'dismiss') {
        console.log('[Google Auth] User dismissed login prompt');
      }
    } catch (err: any) {
      console.error('[Google Auth] promptAsync error:', err);
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
