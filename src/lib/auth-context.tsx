import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, isFirebaseConfigured, signInWithGoogle, signOut as firebaseSignOut } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { syncUserProfile } from './user-service';

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
  loginWithGoogle: () => Promise<void>;
  loginAsGuest: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('promptglow_sandbox_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      const sandboxSaved = localStorage.getItem('promptglow_sandbox_user');
      if (sandboxSaved) {
        setUser(JSON.parse(sandboxSaved));
        setLoading(false);
        return;
      }

      if (firebaseUser) {
        const u = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
        };
        setUser(u);
        setAuthError(null);
        syncUserProfile(u).catch(err => console.warn("Failed to sync profile:", err));
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setAuthError(null);
    if (!isFirebaseConfigured || !auth) {
      const msg = "Firebase is not configured cleanly in environment settings. Please verify VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID.";
      setAuthError(msg);
      throw new Error(msg);
    }
    try {
      localStorage.removeItem('promptglow_sandbox_user');
      await signInWithGoogle();
    } catch (e: any) {
      const errMsg = e?.message || "Google sign-in popup error occurred.";
      console.error("Firebase Sign-In Error:", errMsg);
      setAuthError(errMsg);
      throw e;
    }
  };

  const loginAsGuest = () => {
    setAuthError(null);
    const guestUser: UserProfile = {
      uid: 'sandbox_guest_user',
      displayName: 'Sandbox Explorer',
      email: 'explorer@promptglow.sandbox',
      photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
      isSandbox: true,
    };
    localStorage.setItem('promptglow_sandbox_user', JSON.stringify(guestUser));
    setUser(guestUser);
  };

  const logout = async () => {
    setAuthError(null);
    localStorage.removeItem('promptglow_sandbox_user');
    setUser(null);
    if (isFirebaseConfigured && auth) {
      try {
        await firebaseSignOut();
      } catch (e) {
        console.error("Error signing out from Firebase:", e);
      }
    }
  };

  const clearAuthError = () => setAuthError(null);

  return (
    <AuthContext.Provider value={{ user, loading, authError, clearAuthError, loginWithGoogle, loginAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
