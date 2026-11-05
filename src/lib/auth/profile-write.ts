type ProfileWriteGate = {
  promise: Promise<void>;
  resolve: () => void;
  reject: (reason: unknown) => void;
};

let gate: ProfileWriteGate | null = null;

/**
 * Opens a gate before Firebase Auth creates the user, so the auth listener
 * waits for the matching Firestore write instead of deciding the profile is
 * missing while that write is still in flight.
 */
export function beginProfileWrite(): ProfileWriteGate {
  let resolve!: () => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  const finish = () => {
    if (gate?.promise === promise) gate = null;
  };
  promise.then(finish, finish);

  gate = { promise, resolve, reject };
  return gate;
}

export function waitForProfileWrite() {
  return gate?.promise ?? Promise.resolve();
}
