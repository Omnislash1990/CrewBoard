import { readFileSync } from "node:fs";
import { after, before, beforeEach, test } from "node:test";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  type Firestore,
} from "firebase/firestore";

let testEnv: RulesTestEnvironment;

const createdAt = new Date("2026-01-01T00:00:00Z");

function asDb(uid?: string) {
  const context = uid
    ? testEnv.authenticatedContext(uid)
    : testEnv.unauthenticatedContext();
  return context.firestore() as unknown as Firestore;
}

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "demo-crewboard",
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore() as unknown as Firestore;
    await setDoc(doc(db, "users/admin-1"), {
      uid: "admin-1",
      name: "Sam",
      email: "sam@crew.test",
      phone: "070",
      role: "admin",
    });
    await setDoc(doc(db, "users/worker-1"), {
      uid: "worker-1",
      name: "Jo",
      email: "jo@crew.test",
      phone: "071",
      role: "worker",
    });
    await setDoc(doc(db, "jobs/job-1"), {
      id: "job-1",
      client: "Hargreaves",
      title: "Bathroom",
      duration: "3h",
      notes: "",
      status: "assigned",
      assignedWorkerIds: ["worker-1"],
      createdAt,
    });
    await setDoc(doc(db, "jobs/job-2"), {
      id: "job-2",
      client: "Other",
      title: "Kitchen",
      duration: "1h",
      notes: "",
      status: "assigned",
      assignedWorkerIds: ["worker-9"],
      createdAt,
    });
    await setDoc(doc(db, "notifications/note-1"), {
      userId: "worker-1",
      title: "New job: Hargreaves",
      body: "Bathroom is on your rota.",
      read: false,
      createdAt,
      jobId: "job-1",
      kind: "job_assigned",
    });
  });
});

after(async () => {
  await testEnv.cleanup();
});

test("a worker cannot grant themselves admin", async () => {
  const db = asDb("worker-2");
  await assertFails(
    setDoc(doc(db, "users/worker-2"), {
      uid: "worker-2",
      name: "Pat",
      email: "pat@crew.test",
      phone: "",
      role: "admin",
    }),
  );
  await assertFails(
    updateDoc(doc(asDb("worker-1"), "users/worker-1"), { role: "admin" }),
  );
});

test("a worker can create their own worker profile", async () => {
  await assertSucceeds(
    setDoc(doc(asDb("worker-2"), "users/worker-2"), {
      uid: "worker-2",
      name: "Pat",
      email: "pat@crew.test",
      phone: "",
      role: "worker",
    }),
  );
});

test("an admin can change someone else's role but not their own", async () => {
  await assertSucceeds(
    updateDoc(doc(asDb("admin-1"), "users/worker-1"), { role: "admin" }),
  );
  await assertFails(
    updateDoc(doc(asDb("admin-1"), "users/admin-1"), { role: "worker" }),
  );
});

test("workers only see and update their own assigned jobs", async () => {
  await assertSucceeds(getDoc(doc(asDb("worker-1"), "jobs/job-1")));
  await assertFails(getDoc(doc(asDb("worker-1"), "jobs/job-2")));
  await assertFails(getDoc(doc(asDb(), "jobs/job-1")));
  await assertSucceeds(
    updateDoc(doc(asDb("worker-1"), "jobs/job-1"), { status: "in_progress" }),
  );
  await assertFails(
    updateDoc(doc(asDb("worker-1"), "jobs/job-1"), { title: "Stolen" }),
  );
  await assertFails(deleteDoc(doc(asDb("worker-1"), "jobs/job-1")));
});

test("an admin can edit and delete a dispatched job", async () => {
  await assertSucceeds(
    updateDoc(doc(asDb("admin-1"), "jobs/job-1"), {
      title: "Ceiling",
      assignedWorkerIds: ["worker-1", "worker-9"],
    }),
  );
  await assertSucceeds(deleteDoc(doc(asDb("admin-1"), "jobs/job-1")));
});

test("notifications stay private to the recipient", async () => {
  await assertSucceeds(getDoc(doc(asDb("worker-1"), "notifications/note-1")));
  await assertFails(getDoc(doc(asDb("worker-9"), "notifications/note-1")));
  await assertFails(getDoc(doc(asDb("admin-1"), "notifications/note-1")));
  await assertSucceeds(
    updateDoc(doc(asDb("worker-1"), "notifications/note-1"), { read: true }),
  );
  await assertFails(
    updateDoc(doc(asDb("worker-1"), "notifications/note-1"), {
      title: "Changed",
    }),
  );
  await assertFails(
    setDoc(doc(asDb("worker-1"), "notifications/note-2"), {
      userId: "worker-1",
      title: "Fake",
      body: "A worker cannot invent an alert.",
      read: false,
      createdAt,
      jobId: "job-1",
      kind: "job_assigned",
    }),
  );
  await assertSucceeds(
    setDoc(doc(asDb("admin-1"), "notifications/note-2"), {
      userId: "worker-1",
      title: "Updated: Hargreaves",
      body: "Bathroom was updated on your rota.",
      read: false,
      createdAt,
      jobId: "job-1",
      kind: "job_updated",
    }),
  );
});
