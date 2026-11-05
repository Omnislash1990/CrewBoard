# CrewBoard

Job dispatch and rota for a UK trades crew. One Next.js app, two views:

- **Office** (`/admin`) — paste Toggl lines, preview the job card, assign workers, save to Firestore.
- **Crew** (`/rota`) — mobile-first PWA feed of jobs assigned to the signed-in worker, live via `onSnapshot`.

Firebase Auth + Firestore RBAC: each `users/{uid}` document has `role: "admin" | "worker"`. Next.js 16 route protection lives in `src/proxy.ts` (the replacement for `middleware.ts`).

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Fill `.env.local` from the Firebase project settings (Authentication → Email/Password and Google, plus Firestore).

Local sign-up can be exercised without the cloud project by running the Auth and Firestore emulators (`npx firebase emulators:start --only auth,firestore --project <project-id>`) and setting `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=1` in `.env.local`. That flag is ignored outside `next dev`.

## Firebase setup

1. Create a Firebase project. Enable **Email/Password** and **Google** under Authentication → Sign-in method.
2. Under Authentication → Settings → Authorised domains, add every host that serves the app (`localhost` is usually already there). For this deployment add `crew-board-chi.vercel.app`, plus each Vercel preview host you use. Firebase does not accept a wildcard for `*.vercel.app`.
3. Google sign-in finishes on the Firebase handler, not on the Vercel URL. The OAuth redirect URI is `https://<project-id>.firebaseapp.com/__/auth/handler`. Enabling Google in the Firebase console normally adds that URI to the OAuth client. Do not replace it with the Vercel domain.
4. Create the Cloud Firestore **default** database, then deploy the rules in `firestore.rules`.
5. Copy the web app config into `.env.local` and into Vercel as `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, and `NEXT_PUBLIC_FIREBASE_APP_ID`. Set them for Production and Preview. Changing them requires a new deployment, because Next inlines `NEXT_PUBLIC_*` at build time. `authDomain` stays `<project-id>.firebaseapp.com`.
6. Create Auth users, then matching documents in the `users` collection **before** that person signs in if they must be an admin. The first successful sign-in creates a `worker` profile when no document exists, and workers cannot promote themselves:

```json
{
  "uid": "THE_AUTH_UID",
  "name": "Sam Patel",
  "role": "admin",
  "phone": "07700 900123"
}
```

Worker documents use `"role": "worker"`. The document ID must be the Auth UID.

7. Jobs are written by the admin Toggl parser:

```json
{
  "id": "auto",
  "client": "Hargreaves",
  "title": "Bathroom reinstatement",
  "duration": "3h 15m",
  "notes": "Escape of water, strip ceiling and reboard",
  "status": "assigned",
  "assignedWorkerIds": ["workerUid1"],
  "createdAt": "serverTimestamp"
}
```

Paste format:

```
Client - Job - Time - Notes
```

## Routes

| Path | Who | What |
| --- | --- | --- |
| `/login` | Public | Email/password |
| `/admin` | `admin` | Desktop dispatch board + Toggl parser |
| `/rota` | `worker` | Mobile rota PWA |

Role cookies are set after login so `src/proxy.ts` can redirect. Layouts still re-check the Firestore profile.
