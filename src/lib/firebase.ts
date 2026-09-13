import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  getDocFromServer,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Conversation, ChatMessage, UserSettings, UserProfile } from '../types';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);

// Google Auth Provider
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({
  prompt: 'select_account'
});

// Operational Types for Error Handlers
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

// Hardened Firestore Error Handler conforming to FirestoreErrorInfo
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

/**
 * Helper to recursively sanitize objects and eliminate any undefined values, transforming them to null or deleting them.
 */
function cleanUndefined(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null) return null;
  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefined(item));
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val !== undefined) {
        cleaned[key] = cleanUndefined(val);
      }
    }
    return cleaned;
  }
  return obj;
}

// Cloud Firestore Persistence Helpers

/**
 * Checks if the current Firebase user matches the target userId
 */
export function isUserAuthenticated(userId: string): boolean {
  return !!(auth.currentUser && auth.currentUser.uid === userId);
}

/**
 * Saves/updates user profile document
 */
export async function dbSaveUserProfile(userId: string, profile: UserProfile) {
  if (!isUserAuthenticated(userId)) {
    return;
  }
  const path = `users/${userId}`;
  try {
    const cleanedProfile = cleanUndefined({
      ...profile,
      signedInAt: Date.now()
    });
    await setDoc(doc(db, 'users', userId), cleanedProfile, { merge: true });
  } catch (error) {
    console.warn('Firestore UserProfile write error:', error);
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Saves settings to user document
 */
export async function dbSaveUserSettings(userId: string, settings: UserSettings) {
  if (!isUserAuthenticated(userId)) {
    return;
  }
  const path = `users/${userId}`;
  try {
    const cleanedSettings = cleanUndefined(settings);
    await setDoc(doc(db, 'users', userId), { settings: cleanedSettings }, { merge: true });
  } catch (error) {
    console.warn('Firestore UserSettings write error:', error);
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Subscribes to real-time conversations of a user
 */
export function dbSubscribeConversations(userId: string, onUpdate: (conversations: Conversation[]) => void) {
  if (!isUserAuthenticated(userId)) {
    return () => {};
  }
  const path = `users/${userId}/conversations`;
  try {
    const q = query(collection(db, 'users', userId, 'conversations'), orderBy('updatedAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const list: Conversation[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          id: doc.id,
          title: data.title || 'New Conversation',
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt || Date.now(),
          pinned: data.pinned || false,
          model: data.model || '',
          agentId: data.agentId || '',
          projectId: data.projectId || '',
          messages: data.messages || [] // messages are populated either inline or via messages collection
        });
      });
      onUpdate(list);
    }, (error) => {
      console.warn('Firestore conversations snapshot error:', error);
      handleFirestoreError(error, OperationType.GET, path);
    });
  } catch (error) {
    console.warn('Firestore subscribe error:', error);
    handleFirestoreError(error, OperationType.GET, path);
    return () => {};
  }
}

/**
 * Saves/creates a conversation document
 */
export async function dbSaveConversation(userId: string, conversation: Conversation) {
  if (!isUserAuthenticated(userId)) {
    return;
  }
  const path = `users/${userId}/conversations/${conversation.id}`;
  try {
    // We save metadata and inline messages
    const payload = cleanUndefined({
      title: conversation.title,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      pinned: !!conversation.pinned,
      model: conversation.model || '',
      agentId: conversation.agentId || '',
      projectId: conversation.projectId || '',
      messages: conversation.messages || []
    });
    await setDoc(doc(db, 'users', userId, 'conversations', conversation.id), payload, { merge: true });
  } catch (error) {
    console.warn('Firestore conversation write error:', error);
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Deletes a conversation document
 */
export async function dbDeleteConversation(userId: string, conversationId: string) {
  if (!isUserAuthenticated(userId)) {
    return;
  }
  const path = `users/${userId}/conversations/${conversationId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'conversations', conversationId));
  } catch (error) {
    console.warn('Firestore conversation delete error:', error);
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

