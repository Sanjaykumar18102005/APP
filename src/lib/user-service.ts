import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, increment, collection, addDoc, query, where, getDocs } from 'firebase/firestore';

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
      const updatePayload = {
        displayName: user.displayName || existingData.displayName || 'Explorer',
        email: user.email || existingData.email || '',
        photoURL: user.photoURL || existingData.photoURL || '',
        lastActiveAt: timestampMs,
        lastActiveAtISO: isoStr,
        lastActiveAtFormatted: formattedStr,
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

export async function savePromptHistoryToFirestore(user: { uid: string; email?: string | null }, idea: string, prompt: string, answers?: any[]) {
  if (!user || !user.uid || user.uid === 'sandbox_guest_user' || !db) return;
  const now = new Date();
  try {
    await addDoc(collection(db, 'promptHistory'), {
      userId: user.uid,
      userEmail: user.email || '',
      idea: idea || '',
      prompt: prompt || '',
      answers: answers || [],
      createdAt: now.getTime(),
      createdAtISO: now.toISOString(),
      createdAtFormatted: now.toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'medium' }),
    });
  } catch (err) {
    console.warn("Failed to save prompt history to Firestore:", err);
  }
}

export async function saveChatMessageToFirestore(user: { uid: string; email?: string | null }, messages: any[]) {
  if (!user || !user.uid || user.uid === 'sandbox_guest_user' || !db) return;
  const now = new Date();
  const lastMsg = messages[messages.length - 1]?.content || '';
  try {
    await addDoc(collection(db, 'chats'), {
      userId: user.uid,
      userEmail: user.email || '',
      lastMessage: lastMsg.substring(0, 300),
      messages: messages.slice(-10), // save last 10 messages snippet
      updatedAt: now.getTime(),
      updatedAtISO: now.toISOString(),
      updatedAtFormatted: now.toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'medium' }),
    });
  } catch (err) {
    console.warn("Failed to save chat message to Firestore:", err);
  }
}

export async function saveVisionScanToFirestore(user: { uid: string; email?: string | null }, aspectRatio: string, result: string) {
  if (!user || !user.uid || user.uid === 'sandbox_guest_user' || !db) return;
  const now = new Date();
  try {
    await addDoc(collection(db, 'visionScans'), {
      userId: user.uid,
      userEmail: user.email || '',
      aspectRatio,
      result: result.substring(0, 5000),
      createdAt: now.getTime(),
      createdAtISO: now.toISOString(),
      createdAtFormatted: now.toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'medium' }),
    });
  } catch (err) {
    console.warn("Failed to save vision scan to Firestore:", err);
  }
}

export async function fetchUserHistoryFromFirestore(uid: string) {
  if (!db || !uid || uid === 'sandbox_guest_user') return [];
  try {
    const q = query(collection(db, 'promptHistory'), where('userId', '==', uid));
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    list.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
    return list;
  } catch (err) {
    console.warn("Failed to fetch prompt history from Firestore:", err);
    return [];
  }
}
