import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
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
  loginAsGuest: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

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

  const loginAsGuest = () => {
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

  return (
    <AuthContext.Provider value={{ user, loading, loginAsGuest, logout }}>
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
