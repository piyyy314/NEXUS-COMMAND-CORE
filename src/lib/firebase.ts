import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged as realOnAuthStateChanged } from "firebase/auth";
import { getFirestore, collection as realCollection, query as realQuery, where as realWhere, onSnapshot as realOnSnapshot, doc as realDoc, deleteDoc as realDeleteDoc, addDoc as realAddDoc, Timestamp as realTimestamp } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Check if we should use offline sandbox mode
export const isOfflineFallback = 
  !firebaseConfig || 
  firebaseConfig.projectId === "remixed-project-id" || 
  firebaseConfig.apiKey === "remixed-api-key" ||
  firebaseConfig.apiKey === "";

// Try initializing real firebase, but guard against immediate failure
let app: any = null;
let realAuth: any = null;
let realDb: any = null;

if (!isOfflineFallback) {
  try {
    app = initializeApp(firebaseConfig);
    realAuth = getAuth(app);
    realDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  } catch (error) {
    console.warn("Firebase initialization failed, falling back to offline sandbox:", error);
  }
}

// ----------------------------------------------------
// Mock Implementation for Offline Mode
// ----------------------------------------------------

class MockAuth {
  currentUser: any = null;
  private listeners: Array<(user: any) => void> = [];

  constructor() {
    const saved = localStorage.getItem("nexus_session_user");
    if (saved) {
      try {
        this.currentUser = JSON.parse(saved);
      } catch (e) {
        this.currentUser = null;
      }
    }
  }

  onAuthStateChanged(callback: (user: any) => void) {
    this.listeners.push(callback);
    setTimeout(() => callback(this.currentUser), 0);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  trigger(user: any) {
    this.currentUser = user;
    if (user) {
      localStorage.setItem("nexus_session_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("nexus_session_user");
    }
    this.listeners.forEach(callback => callback(user));
  }
}

export const mockAuthInstance = new MockAuth();

// Expose Auth instance
export const auth = isOfflineFallback ? mockAuthInstance : realAuth;
export const db = isOfflineFallback ? { type: "mock-db" } : realDb;

// Mock Timestamp
export class MockTimestamp {
  seconds: number;
  nanoseconds: number;
  constructor(seconds: number, nanoseconds: number) {
    this.seconds = seconds;
    this.nanoseconds = nanoseconds;
  }
  static now() {
    return new MockTimestamp(Math.floor(Date.now() / 1000), 0);
  }
  static fromDate(date: Date) {
    return new MockTimestamp(Math.floor(date.getTime() / 1000), 0);
  }
  toDate() {
    return new Date(this.seconds * 1000);
  }
  toMillis() {
    return this.seconds * 1000;
  }
}

export interface Timestamp {
  seconds: number;
  nanoseconds: number;
  toDate(): Date;
  toMillis(): number;
}

export const Timestamp = isOfflineFallback ? MockTimestamp : (realTimestamp as any);

// Helper to interact with localStorage
const getLocalCollection = (collectionName: string): any[] => {
  const data = localStorage.getItem(`nexus_db_${collectionName}`);
  if (!data) return [];
  try {
    const parsed = JSON.parse(data);
    return parsed.map((item: any) => {
      // Reconstruct timestamp as MockTimestamp or Date string if needed
      if (item.timestamp && typeof item.timestamp === "string") {
        const d = new Date(item.timestamp);
        item.timestamp = MockTimestamp.fromDate(d);
      }
      return item;
    });
  } catch (e) {
    return [];
  }
};

const saveLocalCollection = (collectionName: string, items: any[]) => {
  const serialized = items.map(item => {
    const copy = { ...item };
    if (copy.timestamp && typeof copy.timestamp.toDate === "function") {
      copy.timestamp = copy.timestamp.toDate().toISOString();
    }
    return copy;
  });
  localStorage.setItem(`nexus_db_${collectionName}`, JSON.stringify(serialized));
};

interface ActiveListener {
  id: string;
  collectionPath: string;
  constraints: any[];
  callback: (snapshot: any) => void;
  errorCallback?: (error: any) => void;
}

let activeListeners: ActiveListener[] = [];

const triggerListenersForPath = (collectionPath: string) => {
  const listeners = activeListeners.filter(l => l.collectionPath === collectionPath);
  if (listeners.length === 0) return;

  const items = getLocalCollection(collectionPath);
  listeners.forEach(listener => {
    // Apply filters
    let filtered = [...items];
    listener.constraints.forEach(c => {
      if (c && c.type === "where") {
        const { field, op, value } = c;
        if (op === "==") {
          filtered = filtered.filter(item => item[field] === value);
        }
      }
    });

    // Create custom snapshot
    const docs = filtered.map(item => ({
      id: item.id,
      data: () => {
        const { id, ...rest } = item;
        return rest;
      }
    }));

    const snapshot = {
      docs,
      forEach: (cb: (doc: any) => void) => docs.forEach(cb),
      empty: docs.length === 0,
      size: docs.length
    };

    listener.callback(snapshot);
  });
};

// Mock firestore functions
export const collection = (dbInstance: any, path: string) => {
  if (!isOfflineFallback && dbInstance && dbInstance.type !== "mock-db") {
    return realCollection(dbInstance, path);
  }
  return { type: "collection", path };
};

export const doc = (dbInstance: any, path: string, id?: string) => {
  if (!isOfflineFallback && dbInstance && dbInstance.type !== "mock-db") {
    return id ? realDoc(dbInstance, path, id) : realDoc(dbInstance, path);
  }
  return { type: "doc", path, id: id || Math.random().toString(36).substring(2, 11) };
};

export const query = (collectionRef: any, ...constraints: any[]) => {
  if (!isOfflineFallback && collectionRef && collectionRef.type !== "collection") {
    return realQuery(collectionRef, ...constraints);
  }
  return { type: "query", collectionRef, constraints };
};

export const where = (field: string, op: string, value: any) => {
  if (!isOfflineFallback) {
    try {
      return realWhere(field, op as any, value);
    } catch (e) {
      // Fallback
    }
  }
  return { type: "where", field, op, value };
};

export const addDoc = async (collectionRef: any, data: any) => {
  if (!isOfflineFallback && collectionRef && collectionRef.type !== "collection") {
    return await realAddDoc(collectionRef, data);
  }
  const path = collectionRef.path;
  const items = getLocalCollection(path);
  const newId = Math.random().toString(36).substring(2, 15);
  const newItem = { id: newId, ...data };
  items.push(newItem);
  saveLocalCollection(path, items);

  setTimeout(() => triggerListenersForPath(path), 50);

  return { id: newId };
};

export const deleteDoc = async (docRef: any) => {
  if (!isOfflineFallback && docRef && docRef.type !== "doc") {
    return await realDeleteDoc(docRef);
  }
  const path = docRef.path || "loot";
  const id = docRef.id;

  const items = getLocalCollection(path);
  const updated = items.filter(item => item.id !== id);
  saveLocalCollection(path, updated);

  setTimeout(() => triggerListenersForPath(path), 50);
};

export const onSnapshot = (
  queryOrRef: any, 
  callback: (snapshot: any) => void, 
  errorCallback?: (error: any) => void
) => {
  if (!isOfflineFallback && queryOrRef && queryOrRef.type !== "query" && queryOrRef.type !== "collection") {
    return realOnSnapshot(queryOrRef, callback, errorCallback);
  }

  const isQuery = queryOrRef.type === "query";
  const collectionRef = isQuery ? queryOrRef.collectionRef : queryOrRef;
  const collectionPath = collectionRef.path;
  const constraints = isQuery ? queryOrRef.constraints : [];

  const listenerId = Math.random().toString(36).substring(2, 11);
  const listener: ActiveListener = {
    id: listenerId,
    collectionPath,
    constraints,
    callback,
    errorCallback
  };

  activeListeners.push(listener);

  setTimeout(() => {
    const items = getLocalCollection(collectionPath);
    let filtered = [...items];
    constraints.forEach((c: any) => {
      if (c && c.type === "where") {
        const { field, op, value } = c;
        if (op === "==") {
          filtered = filtered.filter(item => item[field] === value);
        }
      }
    });

    const docs = filtered.map(item => ({
      id: item.id,
      data: () => {
        const { id, ...rest } = item;
        return rest;
      }
    }));

    callback({
      docs,
      forEach: (cb: (doc: any) => void) => docs.forEach(cb),
      empty: docs.length === 0,
      size: docs.length
    });
  }, 10);

  return () => {
    activeListeners = activeListeners.filter(l => l.id !== listenerId);
  };
};

export const onAuthStateChanged = (
  authInstance: any, 
  callback: (user: any) => void
) => {
  if (!isOfflineFallback) {
    return realOnAuthStateChanged(authInstance, callback);
  }
  return mockAuthInstance.onAuthStateChanged(callback);
};

// ----------------------------------------------------
// Core Auth Functions
// ----------------------------------------------------

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  const errorMessage = JSON.stringify(errInfo);
  console.error('Firestore Error: ', errorMessage);
  throw new Error(errorMessage);
}

export const signInWithGoogle = async () => {
  if (isOfflineFallback) {
    const mockUser = {
      uid: "operative_local_01",
      email: "alexhuhter313@gmail.com",
      displayName: "Operative Alex",
      emailVerified: true,
      providerData: [{ providerId: "google.com", email: "alexhuhter313@gmail.com" }]
    };
    mockAuthInstance.trigger(mockUser);
    return;
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    await signInWithPopup(realAuth, provider);
  } catch (error) {
    console.error("Google sign-in failed:", error);
  }
};

export const logout = async () => {
  if (isOfflineFallback) {
    mockAuthInstance.trigger(null);
    return;
  }

  try {
    await signOut(realAuth);
  } catch (error) {
    console.error("Logout failed:", error);
  }
};
