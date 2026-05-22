import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, isFirebaseConfigured, signInWithGoogle, signOut as firebaseSignOut } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

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
  loginWithGoogle: () => Promise<void>;
  loginAsGuest: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    // Check if sandboxed guest is already saved in localStorage
    const saved = localStorage.getItem('promptglow_sandbox_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      // Only set Firebase user if not in guest mode
      const sandboxSaved = localStorage.getItem('promptglow_sandbox_user');
      if (sandboxSaved) {
        setUser(JSON.parse(sandboxSaved));
        setLoading(false);
        return;
      }

      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth) {
      console.warn("Firebase not loaded. Activating Sandbox Guest mode fallback.");
      loginAsGuest();
      return;
    }
    try {
      localStorage.removeItem('promptglow_sandbox_user');
      await signInWithGoogle();
    } catch (e: any) {
      console.error("Firebase popup sign-in encounter error. Attempting Sandbox Guest fallback:", e);
      // If error is related to popup blocking, third-party cookies, canceled window, etc., activate Guest fallback
      loginAsGuest();
    }
  };

  const loginAsGuest = () => {
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

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginAsGuest, logout }}>
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
