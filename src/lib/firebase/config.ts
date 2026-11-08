import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import {
  connectFirestoreEmulator,
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
  type FirestoreLocalCache,
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
 * Opens Firestore for this Firebase app.
 *
 * In the browser, rota reads and status writes go through an IndexedDB cache
 * (`persistentLocalCache` with `persistentMultipleTabManager`). A worker who
 * loses signal can still open jobs already on the device, and a status change
 * is queued until the phone is online again. Another tab shares that cache
 * instead of failing with `failed-precondition`.
 *
 * Next.js also evaluates this module on the server. IndexedDB is not used
 * there; that path gets an in-memory cache. If the persistent cache cannot
 * start, the failure is logged and Auth still receives a Firestore instance.
 *
 * Call this instead of `getFirestore()`. A `getFirestore()` call first locks
 * in the default memory cache, and persistence cannot be enabled afterwards.
 */
export function createFirestore(app: FirebaseApp): Firestore {
  if (!canUsePersistentFirestoreCache()) {
    return openFirestore(app, memoryLocalCache());
  }

  try {
    return openFirestore(
      app,
      persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    );
  } catch (error) {
    console.warn(
      "Firestore offline persistence could not be enabled. Sign-in will continue with an in-memory cache.",
      error,
    );
    return openFirestore(app, memoryLocalCache());
  }
}

function openFirestore(app: FirebaseApp, localCache: FirestoreLocalCache): Firestore {
  try {
    return initializeFirestore(app, { localCache });
  } catch (error) {
    if (!isFirestoreAlreadyStarted(error)) throw error;
    console.warn(
      "Firestore was already started. Reusing that instance so auth can continue.",
      error,
    );
    return getFirestore(app);
  }
}

function isFirestoreAlreadyStarted(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "failed-precondition"
  );
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

/**
 * Shared Firestore instance for rota listeners and job writes.
 * `null` when the web config is missing. Created with the offline cache
 * above, not with a bare `getFirestore()` call.
 */
export const db: Firestore | null = readFirestore();

function readFirestore(): Firestore | null {
  try {
    return tryGetFirebase()?.db ?? null;
  } catch (error) {
    console.warn(
      "Firestore is not available. Sign-in will continue without rota data.",
      error,
    );
    return null;
  }
}

function connectLocalEmulators(auth: Auth, db: Firestore) {
  // Attached only after the cache is chosen, and only for `next dev`.
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
