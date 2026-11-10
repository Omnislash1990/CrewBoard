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
4. Create the Cloud Firestore **default** database. The rules in `firestore.rules` are the real access check for users, jobs, and notifications. Publish them only after this change is approved:

```bash
npx firebase deploy --only firestore:rules --project <project-id>
```

5. Copy the web app config into `.env.local` and into Vercel as `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, and `NEXT_PUBLIC_FIREBASE_APP_ID`. Set them for Production and Preview. Changing them requires a new deployment, because Next inlines `NEXT_PUBLIC_*` at build time. `authDomain` stays `<project-id>.firebaseapp.com`.
6. The first office admin still has to be created by hand. A new sign-in can only write `role: "worker"`, and nobody can change their own role. After that admin exists, promote other people from **Crew** in the office portal:

```json
{
  "uid": "THE_AUTH_UID",
  "name": "Sam Patel",
  "email": "sam@example.com",
  "role": "admin",
  "phone": "07700 900123"
}
```

The document ID must be the Auth UID. Password reset uses the Email/Password provider and returns to `/login`, so every host that serves the app must stay in Authorised domains.

7. Optional crew email. In-app alerts do not need this. Set both server env vars in Vercel (Production and Preview) or email is skipped:

- `RESEND_API_KEY`
- `NOTIFY_EMAIL_FROM` — a sender Resend will accept, for example `CrewBoard <crew@yourdomain.com>`

There is no SMS provider.

8. Jobs are written by the admin Toggl parser and can be edited, reassigned, or deleted from the live jobs table:

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
| `/login` | Public | Email/password, with show/hide |
| `/forgot-password` | Public | Firebase password reset email |
| `/register` | Public | Create a worker account |
| `/admin` | `admin` | Dispatch, then edit, reassign, or delete jobs |
| `/admin/crew` | `admin` | Promote or demote crew |
| `/rota` | `worker` | Mobile rota and alerts |

The session cookie only chooses a redirect. It is not a credential. Firestore rules decide who can read or write users, jobs, and notifications. `POST /api/notify-worker` checks a Firebase ID token and an admin profile; it does not trust the cookie. Workers only read their own alerts and can mark them read.
