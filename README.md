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

Fill `.env.local` from the Firebase project settings (Authentication → Email/Password, plus Firestore).

## Firebase setup

1. Create a Firebase project and enable **Email/Password** auth.
2. Create Firestore in production mode, then deploy the rules in `firestore.rules`.
3. Create Auth users, then matching documents in the `users` collection:

```json
{
  "uid": "THE_AUTH_UID",
  "name": "Sam Patel",
  "role": "admin",
  "phone": "07700 900123"
}
```

Worker documents use `"role": "worker"`. The document ID must be the Auth UID.

4. Jobs are written by the admin Toggl parser:

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
