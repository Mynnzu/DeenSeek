import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Custom firestore database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export { 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  firebaseSignOut, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
};
export type { User };

// Firestore Helper Functions for User Profile
export async function syncUserProfile(user: User) {
  if (!user) return;
  const userRef = doc(db, 'users', user.uid);
  await setDoc(userRef, {
    id: user.uid,
    email: user.email || '',
    displayName: user.displayName || user.email?.split('@')[0] || 'User',
    photoURL: user.photoURL || '',
    createdAt: new Date().toISOString()
  }, { merge: true });
}

export interface StoredSession {
  id: string;
  userId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface StoredMessage {
  id: string;
  sessionId: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// Save or Update Chat Session
export async function saveChatSession(userId: string, session: { id: string; title: string; createdAt: number }) {
  if (!userId) return;
  const sessionRef = doc(db, 'users', userId, 'chatSessions', session.id);
  await setDoc(sessionRef, {
    id: session.id,
    userId,
    title: session.title,
    createdAt: session.createdAt,
    updatedAt: Date.now()
  }, { merge: true });
}

// Save Messages in a Chat Session
export async function saveChatMessage(userId: string, sessionId: string, message: { id: string; role: 'user' | 'assistant'; content: string; timestamp: number }) {
  if (!userId || !sessionId) return;
  const msgRef = doc(db, 'users', userId, 'chatSessions', sessionId, 'messages', message.id);
  await setDoc(msgRef, {
    id: message.id,
    sessionId,
    userId,
    role: message.role,
    content: message.content,
    timestamp: message.timestamp
  }, { merge: true });
}

// Delete Chat Session
export async function deleteChatSession(userId: string, sessionId: string) {
  if (!userId || !sessionId) return;
  
  // Delete all messages in subcollection first
  const messagesRef = collection(db, 'users', userId, 'chatSessions', sessionId, 'messages');
  const msgSnap = await getDocs(messagesRef);
  for (const docSnap of msgSnap.docs) {
    await deleteDoc(docSnap.ref);
  }
  
  // Delete session document
  const sessionRef = doc(db, 'users', userId, 'chatSessions', sessionId);
  await deleteDoc(sessionRef);
}

// Subscribe to User's Chat Sessions
export function subscribeToUserSessions(userId: string, callback: (sessions: StoredSession[]) => void) {
  if (!userId) {
    callback([]);
    return () => {};
  }

  const sessionsRef = collection(db, 'users', userId, 'chatSessions');
  const q = query(sessionsRef, orderBy('updatedAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const sessions: StoredSession[] = [];
    snapshot.forEach((doc) => {
      sessions.push(doc.data() as StoredSession);
    });
    callback(sessions);
  }, (err) => {
    console.error('Error fetching user chat sessions:', err);
  });
}

// Subscribe to Messages in a Session
export function subscribeToSessionMessages(userId: string, sessionId: string, callback: (messages: StoredMessage[]) => void) {
  if (!userId || !sessionId) {
    callback([]);
    return () => {};
  }

  const messagesRef = collection(db, 'users', userId, 'chatSessions', sessionId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const msgs: StoredMessage[] = [];
    snapshot.forEach((doc) => {
      msgs.push(doc.data() as StoredMessage);
    });
    callback(msgs);
  }, (err) => {
    console.error('Error fetching session messages:', err);
  });
}
