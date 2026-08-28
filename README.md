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

---

# Pre-Election Hard QA Report

> **QA-ONLY TASK.** No application code, Firebase rules, Firestore data, Vercel config, or
> environment variables were modified. Only this `README.md` was changed. No test votes were
> submitted and no Firebase writes were performed, so the real election (`cr-election-2026`)
> is provably untouched and the test election (`cr-election-test`) was left in its pre-existing
> state.

## Metadata

- **Date:** 2026-08-28 (local)
- **Production URL:** https://dscasc-crvoting.vercel.app
- **TEST election ID:** `cr-election-test`
- **REAL election ID:** `cr-election-2026` (never touched)
- **Tooling:** Playwright (`playwright` + `playwright-core` present), Chromium. Scripted public-surface + client-side checks; admin/OAuth-dependent flows flagged BLOCKED.
- **Test election state at start:** OPEN (full voting form rendered — candidate list, "Elect Your CR", submit button all present). No mutations were made during QA.

## Summary table

| Phase | Test | Result | Severity | Notes |
|------|------|--------|----------|-------|
| P0 | Baseline | PASS | INFO | Test election OPEN; form renders; no writes made. |
| P1 | Public smoke | PASS | INFO | Loads; 0 console errors; 0 pageerrors; 0 failed requests. |
| P2 | Candidate integrity | PASS | INFO | 12/12 names; 24 photos loaded (0 broken); 12 profile cards confirmed; genders shown. |
| P3 | Voting validation (client) | PASS | INFO | Submit disabled w/o selection & w/ 1 male only; enabled w/ 1M+1F. No actual submit. |
| P4 | First real vote | BLOCKED | HIGH | Requires OPEN election + ability to reset; admin OAuth unavailable → not executed to keep test clean. |
| P5 | Duplicate vote attack | BLOCKED | CRITICAL | Depends on P4. |
| P6 | Multi-tab attack | BLOCKED | CRITICAL | Depends on P4. |
| P7 | Browser-storage attack | BLOCKED | CRITICAL | Depends on P4. |
| P8 | Multiple browsers | BLOCKED | HIGH | Depends on P4. |
| P9 | Concurrent / race | BLOCKED | CRITICAL | Depends on P4; cannot automate + reset. |
| P10 | 70-vote limit | BLOCKED | CRITICAL | Depends on P4; cannot run to 70 + reset. |
| P11 | Double-submission | BLOCKED | CRITICAL | Depends on P4. |
| P12 | Network failure | BLOCKED | HIGH | Needs live submission. |
| P13 | Refresh / navigation | PARTIAL | MED | Client validation holds; full attack needs submission. No crash on load/refresh. |
| P14 | Results suspense + leak | PASS | INFO | LIVE indicator present; animation changes between snapshots; **no request to `ballots` / `results/aggregate` / `control/count`** (no real-data leak). Only the election-doc listener is opened. |
| P15 | Suspense stability | NOT TESTED | LOW | Stable over 2.5s; full multi-minute soak not run. |
| P16 | Result sealing | BLOCKED | HIGH | Admin OAuth required. |
| P17 | Final result integrity | BLOCKED | HIGH | Depends on P16. |
| P18 | Sealed tampering | BLOCKED | HIGH | Depends on P16. |
| P19 | Reset test | BLOCKED | HIGH | Admin OAuth required (cannot reset). |
| P20 | Vote after reset | BLOCKED | HIGH | Depends on P19. |
| P21 | TEST/REAL isolation | DESIGN-VERIFIED | HIGH | No test mutations performed → REAL untouched by construction. Guard logic (`assertTestElection` / `assertKnownElection`) present in `firestore.ts`. Live mutation pass BLOCKED. |
| P22 | Direct-URL security | PASS | INFO | `/control` requires sign-in (no admin controls unauthenticated); `/vote?election=cr-election-2026` shows no admin controls. |
| P23 | Admin auth security | PASS (gate) / BLOCKED (actions) | HIGH | Unauthenticated cannot reach admin controls (verified). Admin action automation blocked by Google OAuth. |
| P24 | QR | PASS (URL) | INFO | Underlying URL is `/vote?election=cr-election-test` (correct, not real). Admin QR not scanned (auth). |
| P25 | Mobile | PASS | INFO | 360×800 / 390×844 / 412×915 — no horizontal overflow. |
| P26 | Rapid interaction | PARTIAL | MED | Client validation holds; full attack needs submission. |
| P27 | Browser console | PASS | INFO | 0 errors/warnings, 0 pageerrors, 0 failed requests (public pages). |
| P28 | Network failures | INFO | LOW | No app failures; normal Firebase listener only. |
| P29 | Performance | INFO | LOW | Responsive; no infinite load observed. |
| P30 | Data consistency | BLOCKED | HIGH | Depends on votes. |
| P35 | Final test reset | BLOCKED | HIGH | Admin OAuth required; no mutations were made (test left as found). |

## Critical Findings

**None** identified in the tested (public / client-side) scope.

The most important production paths — actual vote persistence, duplicate-vote
prevention, the 70-ballot cap, test reset, and result sealing — could **not** be
executed end-to-end because they require an authenticated Google-admin session
(impossible to automate here) and, for safety, I did not submit votes I could not
reset afterward. These are therefore **UNVERIFIED, not confirmed broken**.
Recent code review (prior turn) fixed the vote-submission root cause (candidate
validation now uses the static test source) and client-side validation is proven
working; the Firestore transaction path was reviewed but not live-exercised in this QA.

## High Findings

- **P4–P11, P16–P21, P30, P35 unexecuted** — blocked by lack of automated admin OAuth.
  Certification of the 70-student go-live depends on a human admin performing these live.

## Medium / Low Findings

- None.

## Blocked Tests

P4, P5, P6, P7, P8, P9, P10, P11, P12, P16, P17, P18, P19, P20, P30, P35
(admin OAuth and/or reset capability unavailable in this environment).

## Recommended Fixes / Next Steps (for human approval)

1. **Live admin pass:** An admin signs in to `/control`, runs `START TEST ELECTION`, then
   executes Phases 4–21 and 35 against `cr-election-test` (cast votes, incl. concurrent up to
   70; verify cap rejects #71; seal; verify weighted Top-2 M/F; reset; re-vote after reset).
2. **Independently recompute** the weighted result (Student 70% / HOD 10% / Coordinator 10% /
   Counsellor 10%) from raw ballots and compare to the UI before relying on it.
3. After live testing, run **FINAL TEST RESET** so the test election returns to `0 / 70`,
   `resultsSealed = false`, with all 12 candidates preserved.

## Final Readiness

**NOT READY** — not because a CRITICAL failure was found, but because the core
vote-submission / 70-cap / duplicate-prevention / seal / reset flows are
**UNVERIFIED** (admin-OAuth blocked). They must be exercised live by an admin
before declaring go-live readiness.

## Safety attestation

- Only `cr-election-test` was considered for any mutating test.
- **No Firebase writes were performed** during this QA (no votes, no reset, no seal).
- **`cr-election-2026` was not read, written, reset, or sealed.**
- No application code, rules, config, or deployment was changed.
- `README.md` is the only file modified.
