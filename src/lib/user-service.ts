import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, increment, deleteField } from 'firebase/firestore';

export interface UserPreferences {
  defaultTone: string;
  defaultLanguage: string;
  notificationsEnabled: boolean;
  offlineModeEnabled: boolean;
}

export interface UserDocData {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  plan: string;
  totalPromptsGenerated: number;
  totalChats: number;
  totalVisionAnalyzed: number;
  createdAt: number;
  createdAtISO: string;
  createdAtFormatted: string;
  lastActiveAt: number;
  lastActiveAtISO: string;
  lastActiveAtFormatted: string;
  preferences: UserPreferences;
  apiStatus: {
    groqConnected: boolean;
    whisperConnected: boolean;
    visionConnected: boolean;
  };
}

export async function syncUserProfile(user: { uid: string; displayName?: string | null; email?: string | null; photoURL?: string | null }) {
  if (!db || !user || !user.uid || user.uid === 'sandbox_guest_user') return null;

  const now = new Date();
  const timestampMs = now.getTime();
  const isoStr = now.toISOString();
  const formattedStr = now.toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'medium'
  });

  try {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const existingData = snap.data();
      let apiStatus = existingData.apiStatus || {};
      if ('geminiConnected' in apiStatus) {
        delete apiStatus.geminiConnected;
      }
      apiStatus = {
        groqConnected: true,
        whisperConnected: true,
        visionConnected: true,
        ...apiStatus
      };

      if (existingData.apiStatus && 'geminiConnected' in existingData.apiStatus) {
        await updateDoc(userRef, {
          'apiStatus.geminiConnected': deleteField()
        }).catch(err => console.warn("Could not delete geminiConnected:", err));
      }

      const updatePayload = {
        displayName: user.displayName || existingData.displayName || 'Explorer',
        email: user.email || existingData.email || '',
        photoURL: user.photoURL || existingData.photoURL || '',
        lastActiveAt: timestampMs,
        lastActiveAtISO: isoStr,
        lastActiveAtFormatted: formattedStr,
        apiStatus,
      };

      await updateDoc(userRef, updatePayload);
      return { ...existingData, ...updatePayload };
    } else {
      const newProfile: UserDocData = {
        uid: user.uid,
        displayName: user.displayName || 'Explorer',
        email: user.email || '',
        photoURL: user.photoURL || '',
        plan: 'free',
        totalPromptsGenerated: 0,
        totalChats: 0,
        totalVisionAnalyzed: 0,
        createdAt: timestampMs,
        createdAtISO: isoStr,
        createdAtFormatted: formattedStr,
        lastActiveAt: timestampMs,
        lastActiveAtISO: isoStr,
        lastActiveAtFormatted: formattedStr,
        preferences: {
          defaultTone: 'professional',
          defaultLanguage: 'en',
          notificationsEnabled: true,
          offlineModeEnabled: false,
        },
        apiStatus: {
          groqConnected: true,
          whisperConnected: true,
          visionConnected: true,
        },
      };

      await setDoc(userRef, newProfile);
      return newProfile;
    }
  } catch (err) {
    console.warn("Could not sync user profile in Firestore:", err);
    return null;
  }
}

export async function incrementUserStat(uid: string, statName: 'totalPromptsGenerated' | 'totalChats' | 'totalVisionAnalyzed') {
  if (!db || !uid || uid === 'sandbox_guest_user') return;
  const now = new Date();
  const timestampMs = now.getTime();
  const isoStr = now.toISOString();
  const formattedStr = now.toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'medium'
  });

  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      uid,
      [statName]: increment(1),
      lastActiveAt: timestampMs,
      lastActiveAtISO: isoStr,
      lastActiveAtFormatted: formattedStr,
    }, { merge: true });
  } catch (err) {
    console.warn(`Failed to increment ${statName}:`, err);
  }
}
