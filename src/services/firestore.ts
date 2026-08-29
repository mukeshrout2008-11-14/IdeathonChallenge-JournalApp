import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy,
  getDocs
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { JournalEntry } from '../types';
import { stripUndefined } from '../lib/utils';

/**
 * Returns reference to a user's isolated interactions subcollection:
 * /users/{userId}/interactions
 */
export function getUserInteractionsCollection(userId: string) {
  if (!userId) throw new Error('User ID is required for Firestore operations.');
  return collection(db, 'users', userId, 'interactions');
}

/**
 * Saves or updates a journal interaction with guaranteed payload hygiene (undefined-stripping).
 */
export async function saveJournalEntry(userId: string, entry: JournalEntry): Promise<void> {
  if (!userId) throw new Error('Authentication required: Missing user ID.');
  if (!entry.id) throw new Error('Entry ID is required.');

  const docRef = doc(db, 'users', userId, 'interactions', entry.id);
  const cleanPayload = stripUndefined({
    ...entry,
    userId,
    updatedAt: Date.now(),
  });

  await setDoc(docRef, cleanPayload, { merge: true });
}

/**
 * Deletes a journal interaction document.
 */
export async function deleteJournalEntry(userId: string, entryId: string): Promise<void> {
  if (!userId || !entryId) throw new Error('Invalid delete parameters.');
  const docRef = doc(db, 'users', userId, 'interactions', entryId);
  await deleteDoc(docRef);
}

/**
 * Updates pin status for quick access.
 */
export async function togglePinJournalEntry(
  userId: string, 
  entryId: string, 
  pinned: boolean
): Promise<void> {
  if (!userId || !entryId) throw new Error('Invalid update parameters.');
  const docRef = doc(db, 'users', userId, 'interactions', entryId);
  await updateDoc(docRef, { pinned, updatedAt: Date.now() });
}

/**
 * Subscribes to real-time updates of the user's isolated interactions.
 */
export function subscribeToUserEntries(
  userId: string,
  onUpdate: (entries: JournalEntry[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!userId) return () => {};

  const colRef = getUserInteractionsCollection(userId);
  const q = query(colRef, orderBy('updatedAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const entries: JournalEntry[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as JournalEntry;
        entries.push({
          ...data,
          id: docSnap.id,
        });
      });
      onUpdate(entries);
    },
    (err) => {
      console.error('Firestore snapshot listener error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * One-time fetch of user entries as fallback.
 */
export async function fetchUserEntries(userId: string): Promise<JournalEntry[]> {
  if (!userId) return [];
  const colRef = getUserInteractionsCollection(userId);
  const q = query(colRef, orderBy('updatedAt', 'desc'));
  const snapshot = await getDocs(q);
  const entries: JournalEntry[] = [];
  snapshot.forEach((docSnap) => {
    entries.push({ ...(docSnap.data() as JournalEntry), id: docSnap.id });
  });
  return entries;
}
