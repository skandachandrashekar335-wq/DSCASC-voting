# CR-ELECT — Single-Use College CR Election

A simple, static React + Vite + TypeScript + Tailwind + Firebase Firestore web app for running a
one-time Class Representative election (Dayananda Sagar College of Arts, Science and Commerce — BBA, Section B).

Students scan a QR / open the link, pick **one boy + one girl**, and submit. One vote per browser.
The admin reveals results from a hidden `/control` page.

---

## Quick start (local)

```bash
npm install
cp .env.example .env.local   # then fill in your Firebase web config
npm run dev
```

Open http://localhost:5173

> Without Firebase config the app builds and runs, but voting/results show a "Firebase not configured"
> message. Add the config to `.env.local` to make it fully functional.

---

## What to edit

### Candidates
**`src/config/candidates.ts`**
- Each candidate: `id`, `name`, `gender` (`"MALE"`|`"FEMALE"`), `photo`, `introduction`, `promises`, `vision`, `goals`, `achievements`, `manifesto`.
- Photos: drop files in `public/candidates/` (e.g. `public/candidates/candidate-male-1.jpg`) and reference `"/candidates/candidate-male-1.jpg"`. Missing images show a clean initials placeholder automatically.

### Election info & dates
**`src/config/election.ts`**
- `collegeName`, `collegeLogo`, `department`, `className`, `section`, `electionTitle`, `electionDescription`, `votingRules`.
- `votingStart`, `votingEnd`, `resultRevealTime` — ISO strings, interpreted in the browser's local time.

### College logo
Drop `public/college-logo.png`. If missing, a `DSC / ASC` placeholder is shown.

---

## Firebase setup (required for voting)

1. Create a Firebase project at https://console.firebase.google.com
2. **Build → Firestore Database → Create** (start in production mode).
3. **Build → Authentication → Sign-in method → enable Google** (used only for the admin `/control` page).
4. **Project settings → Your apps → Web app** → copy the config values.
5. Put them in `.env.local` (see `.env.example`). Variables:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
6. Deploy the security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```
   (install Firebase CLI: `npm i -g firebase-tools`, run `firebase login`, `firebase init firestore` if needed, use the included `firestore.rules`.)

These are **public web** config values — safe to ship in the frontend. No admin keys are used client-side.

---

## Using the admin control page (`/control`)

1. Open `/control`, sign in with Google.
2. First sign-in: click **Initialize Election** — you become the admin (your email is written to the allowlist). Subsequent sign-ins from other Google accounts are denied.
3. Use **Cast 5 Test Votes**, **Refresh**, **Reveal Results**, **Reset Test Election** (with confirmation).
4. The public result page (`/results`) stays on the suspense screen until you press **Reveal Results**.

---

## Deployment (Vercel — static)

```bash
npm install
npm run build      # outputs dist/
npm run preview    # local check
```

- Import the repo into Vercel, or run `vercel`. Build command `npm run build`, output `dist`.
- Add the same `VITE_FIREBASE_*` env vars in Vercel project settings.
- Firebase Hosting also works (static build).

---

## Teacher Handover

To transfer the project to another person after the election:

1. **Firebase project** — add the new owner as a Firebase project Owner/Editor in the Firebase console (gear → Users and permissions).
2. **Firestore** — the database lives in the same Firebase project; no separate setup.
3. **Firebase Authentication** — Google sign-in is already enabled; the admin allowlist is stored in
   `elections/cr-election-2026/control/admin` (field `adminEmails`). To change the admin, edit that document (or reset and re-initialize).
4. **Hosting / Vercel** — transfer the Vercel project (Vercel → Settings → Members) and/or the Git repo.
5. **Environment variable NAMES** — `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`. (Public web config — not secrets.)
6. **Election configuration** — `src/config/election.ts`.
7. **Candidate information** — `src/config/candidates.ts`.
8. **How to reset** — open `/control` (admin), click **Reset Test Election**, confirm.
9. **How to reveal results** — open `/control` (admin), click **Reveal Results**.

No secrets are included in this README. The Firebase **web** config is public by design; never place a
Firebase Admin private key or any `GROQ_API_KEY` in frontend variables.

---

## Known limitations

- **One vote per browser**, not per person. A user can vote again by clearing browser data, using another browser, or another device. This is intentional for a single-use demo — no student login by design.
- **Admin protection** is a Google-sign-in email allowlist. It is suitable for a one-time demo, not a high-security election. The crucial privacy guarantee (students cannot read real ballots/counts before reveal) is enforced by **Firestore rules**, not just the UI.
- Suspense screen animation is **fake** visual movement only; it never reads or shows real counts. Final results always come from real stored ballots.
- Reset deletes docs in batches of 400; for unusually large datasets run it a couple of times.
- Candidate photos and college logo are optional assets; missing files degrade gracefully.
