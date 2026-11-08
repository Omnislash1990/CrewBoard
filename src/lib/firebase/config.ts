import {
  FirebaseError,
  getApp,
  getApps,
  initializeApp,
  type FirebaseApp,
} from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import {
  connectFirestoreEmulator,
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";
import { canUsePersistentFirestoreCache } from "@/lib/firebase/runtime";

function readPublicEnv(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

const firebaseConfig = {
  apiKey: readPublicEnv(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: readPublicEnv(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: readPublicEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: readPublicEnv(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: readPublicEnv(
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  ),
  appId: readPublicEnv(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
};

export function isFirebaseConfigured() {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId,
  );
}

type FirebaseClients = {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
};

let clients: FirebaseClients | null = null;

/**
 * Browser clients keep Firestore in IndexedDB so a worker can read the rota
 * and queue status updates with no signal. Next.js also renders client
 * modules on the server, where `window` is undefined, so that path uses an
 * in-memory cache and never opens IndexedDB.
 */
export function createFirestore(app: FirebaseApp): Firestore {
  try {
    return initializeFirestore(app, {
      localCache: canUsePersistentFirestoreCache()
        ? persistentLocalCache({
            tabManager: persistentMultipleTabManager(),
          })
        : memoryLocalCache(),
    });
  } catch (error) {
    if (
      error instanceof FirebaseError &&
      error.code === "failed-precondition"
    ) {
      return getFirestore(app);
    }
    throw error;
  }
}

export function getFirebase(): FirebaseClients {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase environment variables are missing.");
  }

  if (!clients) {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = createFirestore(app);
    connectLocalEmulators(auth, db);
    clients = { app, auth, db };
  }

  return clients;
}

export function tryGetFirebase() {
  if (!isFirebaseConfigured()) return null;
  return getFirebase();
}

function connectLocalEmulators(auth: Auth, db: Firestore) {
  if (typeof window === "undefined") return;
  if (
    process.env.NODE_ENV !== "development" ||
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR !== "1"
  ) {
    return;
  }

  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}
