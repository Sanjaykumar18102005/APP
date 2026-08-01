import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from './firebase';
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
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
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  loginAsGuest: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('promptglow_mobile_user').then((saved) => {
      if (saved) {
        setUser(JSON.parse(saved));
        setLoading(false);
      } else if (auth) {
        const unsub = onAuthStateChanged(auth, (firebaseUser) => {
          if (firebaseUser) {
            const u = {
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
        return () => unsub();
      } else {
        setLoading(false);
      }
    });
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    setAuthError(null);
    if (!auth) {
      throw new Error("Firebase Auth is not configured.");
    }
    try {
      await AsyncStorage.removeItem('promptglow_mobile_user');
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const u = {
        uid: cred.user.uid,
        displayName: cred.user.displayName || email.split('@')[0],
        email: cred.user.email,
        photoURL: cred.user.photoURL || '',
      };
      setUser(u);
      await syncUserProfile(u);
    } catch (err: any) {
      const msg = err.message || "Invalid email or password.";
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    setAuthError(null);
    if (!auth) {
      throw new Error("Firebase Auth is not configured.");
    }
    try {
      await AsyncStorage.removeItem('promptglow_mobile_user');
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      if (cred.user && name) {
        await updateProfile(cred.user, { displayName: name });
      }
      const u = {
        uid: cred.user.uid,
        displayName: name || email.split('@')[0],
        email: cred.user.email,
        photoURL: cred.user.photoURL || '',
      };
      setUser(u);
      await syncUserProfile(u);
    } catch (err: any) {
      const msg = err.message || "Registration failed. Check password length and email format.";
      setAuthError(msg);
      throw new Error(msg);
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
    AsyncStorage.setItem('promptglow_mobile_user', JSON.stringify(guestUser));
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
        console.warn("Sign out error:", e);
      }
    }
  };

  const clearAuthError = () => setAuthError(null);

  return (
    <AuthContext.Provider value={{ user, loading, authError, clearAuthError, loginWithEmail, registerWithEmail, loginAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
