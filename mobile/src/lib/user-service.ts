import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, increment, collection, addDoc, query, where, getDocs } from 'firebase/firestore';

export interface UserDocData {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  plan: string;
  totalPromptsGenerated: number;
  totalChats: number;
  totalVisionAnalyzed: number;
  createdAtFormatted?: string;
  lastActiveAtFormatted?: string;
}

export async function syncUserProfile(user: { uid: string; displayName?: string | null; email?: string | null; photoURL?: string | null }) {
  if (!db || !user || !user.uid || user.uid === 'sandbox_guest_user') return null;

  const now = new Date();
  const timestampMs = now.getTime();
  const isoStr = now.toISOString();
  const formattedStr = now.toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'medium' });

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
      return { ...existingData, ...updatePayload } as unknown as UserDocData;
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
        createdAtFormatted: formattedStr,
        lastActiveAtFormatted: formattedStr,
      };
      await setDoc(userRef, newProfile);
      return newProfile;
    }
  } catch (err) {
    console.warn("Could not sync mobile user profile in Firestore:", err);
    return null;
  }
}

export async function incrementUserStat(uid: string, statName: 'totalPromptsGenerated' | 'totalChats' | 'totalVisionAnalyzed') {
  if (!db || !uid || uid === 'sandbox_guest_user') return;
  const now = new Date();
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      uid,
      [statName]: increment(1),
      lastActiveAt: now.getTime(),
      lastActiveAtISO: now.toISOString(),
      lastActiveAtFormatted: now.toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'medium' }),
    }, { merge: true });
  } catch (err) {
    console.warn(`Failed to increment ${statName}:`, err);
  }
}

export async function savePromptHistoryToFirestore(user: { uid: string; email?: string | null }, idea: string, prompt: string) {
  if (!user || !user.uid || user.uid === 'sandbox_guest_user' || !db) return;
  const now = new Date();
  try {
    await addDoc(collection(db, 'promptHistory'), {
      userId: user.uid,
      userEmail: user.email || '',
      idea: idea || '',
      prompt: prompt || '',
      createdAt: now.getTime(),
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
      updatedAt: now.getTime(),
    });
  } catch (err) {
    console.warn("Failed to save chat to Firestore:", err);
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
      result: result.substring(0, 3000),
      createdAt: now.getTime(),
    });
  } catch (err) {
    console.warn("Failed to save vision scan to Firestore:", err);
  }
}
