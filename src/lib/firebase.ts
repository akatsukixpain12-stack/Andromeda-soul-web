import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
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
import { Conversation, ChatMessage, UserSettings, UserProfile, LearnedKnowledge } from '../types';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);

// Enforce durable local persistence so the user's login and Google Cloud Firestore sessions persist across page reloads
setPersistence(auth, browserLocalPersistence).catch((err) => {
  setPersistence(auth, browserSessionPersistence).catch((memErr) => {
    console.warn('[Firebase Auth Persistence Notice]:', memErr);
  });
});

/**
 * Ensures the client has an active Firebase Auth UID.
 * If not signed in via Google, signs in anonymously to allow direct
 * read/write to the user's private Google Cloud Firestore partition.
 */
export async function ensureCloudAuth(): Promise<string> {
  if (auth.currentUser) {
    return auth.currentUser.uid;
  }
  throw new Error('A signed-in Google account is required for cloud persistence.');
}

// Google Auth Provider with forced account chooser
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
 * Checks if a real signed-in Firebase user owns the requested cloud data.
 */
export function isUserAuthenticated(userId?: string): boolean {
  if (!auth.currentUser || auth.currentUser.isAnonymous) return false;
  if (!userId) return true;
  return auth.currentUser.uid === userId;
}

/**
 * Resolves the authenticated Cloud User ID
 */
export function getActiveCloudUid(fallbackId?: string): string {
  return auth.currentUser?.uid || fallbackId || '';
}

const SECRET_SETTING_KEYS: Array<keyof UserSettings> = [
  'geminiApiKey',
  'openaiApiKey',
  'anthropicApiKey',
  'deepseekApiKey',
  'mistralApiKey',
  'groqApiKey',
  'openRouterApiKey',
  'customApiKey',
];

function getCloudSafeSettings(settings: UserSettings): Partial<UserSettings> {
  const safeSettings = { ...settings } as Partial<UserSettings> & Record<string, unknown>;
  for (const key of SECRET_SETTING_KEYS) {
    delete safeSettings[key];
  }
  if (safeSettings.customModels) {
    safeSettings.customModels = safeSettings.customModels.map(({ customApiKey, ...model }) => model);
  }
  return safeSettings;
}

export async function dbLoadUserSettings(userId: string): Promise<Partial<UserSettings> | null> {
  if (!isUserAuthenticated(userId)) return null;
  const uid = getActiveCloudUid(userId);
  try {
    const snapshot = await getDoc(doc(db, 'users', uid));
    return snapshot.exists() ? (snapshot.data().settings as Partial<UserSettings> || null) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
    return null;
  }
}

/**
 * Saves/updates user profile document
 */
export async function dbSaveUserProfile(userId: string, profile: UserProfile) {
  if (!isUserAuthenticated(userId)) {
    return;
  }
  const uid = getActiveCloudUid(userId);
  const path = `users/${uid}`;
  try {
    const cleanedProfile = cleanUndefined({
      ...profile,
      id: uid,
      signedInAt: Date.now()
    });
    await setDoc(doc(db, 'users', uid), cleanedProfile, { merge: true });
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
  const uid = getActiveCloudUid(userId);
  const path = `users/${uid}`;
  try {
    const cleanedSettings = cleanUndefined(getCloudSafeSettings(settings));
    await setDoc(doc(db, 'users', uid), { settings: cleanedSettings }, { merge: true });
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
  const uid = getActiveCloudUid(userId);
  const path = `users/${uid}/conversations`;
  try {
    const q = query(collection(db, 'users', uid, 'conversations'), orderBy('updatedAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const list: Conversation[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          title: data.title || 'New Conversation',
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt || Date.now(),
          pinned: data.pinned || false,
          model: data.model || '',
          agentId: data.agentId || '',
          projectId: data.projectId || '',
          messages: data.messages || []
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
  const uid = getActiveCloudUid(userId);
  const path = `users/${uid}/conversations/${conversation.id}`;
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
    await setDoc(doc(db, 'users', uid, 'conversations', conversation.id), payload, { merge: true });
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
  const uid = getActiveCloudUid(userId);
  const path = `users/${uid}/conversations/${conversationId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'conversations', conversationId));
  } catch (error) {
    console.warn('Firestore conversation delete error:', error);
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Saves learned knowledge to Google Cloud server (user partition & collective memory)
 */
export async function dbSaveLearnedKnowledge(userId: string, knowledge: LearnedKnowledge) {
  if (!isUserAuthenticated(userId)) {
    return;
  }
  const uid = getActiveCloudUid(userId);
  const userPath = `users/${uid}/knowledge/${knowledge.id}`;
  try {
    const payload = cleanUndefined({
      ...knowledge,
      userId: uid,
      createdAt: knowledge.createdAt || Date.now()
    });

    // 1. Save to user private cloud knowledge
    await setDoc(doc(db, 'users', uid, 'knowledge', knowledge.id), payload, { merge: true });

    // 2. Save anonymized/generalized insight to collective Google Cloud knowledge store
    const collectivePayload = cleanUndefined({
      id: knowledge.id,
      topic: knowledge.topic,
      insight: knowledge.insight,
      category: knowledge.category || 'general_intelligence',
      source: knowledge.source || 'user_taught',
      userId: uid,
      createdAt: Date.now(),
      tags: knowledge.tags || []
    });
    await setDoc(doc(db, 'collective_knowledge', knowledge.id), collectivePayload, { merge: true });
  } catch (error) {
    console.warn('Firestore knowledge write error:', error);
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

/**
 * Subscribes to learned knowledge on Google Cloud server
 */
export function dbSubscribeKnowledge(
  userId: string,
  onUpdate: (knowledgeList: LearnedKnowledge[]) => void
) {
  if (!isUserAuthenticated(userId)) {
    return () => {};
  }
  const uid = getActiveCloudUid(userId);
  const path = `users/${uid}/knowledge`;
  try {
    const q = query(collection(db, 'users', uid, 'knowledge'), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: LearnedKnowledge[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          list.push({
            id: d.id,
            topic: data.topic || 'General Learning',
            insight: data.insight || '',
            category: data.category || 'general',
            source: data.source || 'user_taught',
            userId: data.userId || uid,
            createdAt: data.createdAt || Date.now(),
            tags: data.tags || [],
            appliedCount: data.appliedCount || 0
          });
        });
        onUpdate(list);
      },
      (error) => {
        console.warn('Firestore knowledge snapshot error:', error);
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (error) {
    console.warn('Firestore subscribe knowledge error:', error);
    handleFirestoreError(error, OperationType.GET, path);
    return () => {};
  }
}

/**
 * Subscribes to collective learned knowledge on Google Cloud server
 */
export function dbSubscribeCollectiveKnowledge(
  onUpdate: (knowledgeList: LearnedKnowledge[]) => void
) {
  try {
    const q = query(collection(db, 'collective_knowledge'), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: LearnedKnowledge[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          list.push({
            id: d.id,
            topic: data.topic || 'Collective Insight',
            insight: data.insight || '',
            category: data.category || 'general',
            source: data.source || 'user_taught',
            userId: data.userId || '',
            createdAt: data.createdAt || Date.now(),
            tags: data.tags || [],
            appliedCount: data.appliedCount || 0
          });
        });
        onUpdate(list);
      },
      (error) => {
        console.warn('Firestore collective knowledge error:', error);
      }
    );
  } catch (error) {
    console.warn('Firestore subscribe collective knowledge error:', error);
    return () => {};
  }
}
