type FirestoreValue = { stringValue?: string };

export type StoredUser = {
  role: string;
  email: string;
  name: string;
};

function firestoreRoot(projectId: string) {
  const useEmulator =
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "1";
  if (useEmulator) {
    const host = process.env.FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8080";
    return `http://${host}/v1/projects/${projectId}/databases/(default)/documents`;
  }
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
}

export function parseStoredUser(body: unknown): StoredUser | null {
  if (typeof body !== "object" || body === null || !("fields" in body)) return null;
  const fields = body.fields;
  if (typeof fields !== "object" || fields === null) return null;
  const record = fields as Record<string, FirestoreValue>;
  return {
    role: record.role?.stringValue ?? "",
    email: record.email?.stringValue ?? "",
    name: record.name?.stringValue ?? "",
  };
}

export async function readStoredUser(
  projectId: string,
  uid: string,
  idToken: string,
): Promise<StoredUser | null> {
  const response = await fetch(
    `${firestoreRoot(projectId)}/users/${encodeURIComponent(uid)}`,
    { headers: { Authorization: `Bearer ${idToken}` } },
  );
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Could not read the user profile (${response.status}).`);
  }
  return parseStoredUser(await response.json());
}
