import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp, getDocFromServer, collection, query, where, getDocs, addDoc, orderBy, limit, onSnapshot, deleteDoc, writeBatch } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export { signInWithPopup, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, collection, query, where, orderBy, limit, onSnapshot, addDoc, serverTimestamp, doc, getDoc, setDoc, deleteDoc, writeBatch };
export type { FirebaseUser };

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}

export async function syncUserProfile(user: FirebaseUser, username?: string) {
  const userRef = doc(db, 'users', user.uid);
  try {
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        displayName: user.displayName || username || 'User',
        email: user.email,
        photoURL: user.photoURL,
        createdAt: serverTimestamp()
      });
      
      if (username) {
        const usernameRef = doc(db, 'usernames', username.toLowerCase());
        await setDoc(usernameRef, {
          uid: user.uid,
          email: user.email
        });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
  }
}

export async function getEmailByUsername(username: string): Promise<string | null> {
  try {
    const usernameRef = doc(db, 'usernames', username.toLowerCase());
    const usernameDoc = await getDoc(usernameRef);
    if (usernameDoc.exists()) {
      return usernameDoc.data().email;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `usernames/${username}`);
    return null;
  }
}

export async function saveSummary(uid: string, result: any, type: 'URL' | 'File' | 'Text', url?: string) {
  try {
    await addDoc(collection(db, 'summaries'), {
      uid,
      title: result.title,
      summary: result.summary,
      keySections: result.keySections || [],
      links: result.links || [],
      mainTopics: result.mainTopics || [],
      hasProgrammingContent: result.hasProgrammingContent || false,
      extractedCodeSnippets: result.extractedCodeSnippets || [],
      type,
      url: url || null,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'summaries');
  }
}

export async function getUserSummaries(uid: string) {
  try {
    const q = query(
      collection(db, 'summaries'),
      where('uid', '==', uid),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'summaries');
    return [];
  }
}

export async function getUserProfile(uid: string) {
  const userRef = doc(db, 'users', uid);
  try {
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
    return null;
  }
}

export async function updateUserProfile(uid: string, data: { 
  displayName?: string, 
  photoURL?: string,
  notifications?: {
    emailSummaries?: boolean,
    activityAlerts?: boolean,
    weeklyDigest?: boolean,
    newFeatures?: boolean
  },
  privacy?: {
    publicProfile?: boolean,
    dataSharing?: boolean,
    searchIndexing?: boolean
  }
}) {
  const userRef = doc(db, 'users', uid);
  try {
    await setDoc(userRef, data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
}

export async function deleteSummary(id: string) {
  try {
    await deleteDoc(doc(db, 'summaries', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `summaries/${id}`);
  }
}

export async function deleteMultipleSummaries(ids: string[]) {
  try {
    const batch = writeBatch(db);
    ids.forEach(id => {
      batch.delete(doc(db, 'summaries', id));
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'summaries (batch)');
  }
}
