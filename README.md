# CR Election Platform

A full-stack **College Class Representative (CR) election platform** built for
Dayananda Sagar College of Arts, Science and Commerce (BBA, Section B reference
election), designed to be reusable for any class/department/section.

- **Frontend:** React 18 · Vite · TypeScript · Tailwind CSS v4 ("Technical Minimalist" design system) · TanStack Query · Firebase JS SDK
- **Backend:** Node · Express · TypeScript · Firebase Admin SDK
- **Auth:** Google Sign-In only (Firebase Auth). No passwords stored anywhere.
- **Database:** Cloud Firestore
- **AI:** Groq API (`openai/gpt-oss-120b`) — server-side only

---

## Architecture principles

1. **AI never decides elections.** Groq only converts admin natural-language
   rules into a structured JSON proposal. An admin must review + approve it.
   A deterministic backend **rule engine** (`backend/src/services/electionRuleEngine.ts`)
   is the sole authority for eligibility, timing, selection limits and validity.
2. **Results are deterministic.** `resultsEngine.ts` uses pure integer
   basis-point arithmetic: students 70% / counsellor 15% / coordinator 15%
   (configurable). Ties are flagged, never auto-broken.
3. **Server time is authoritative.** Elections open/close based on server
   clock; client countdowns are display-only.
4. **Result privacy is enforced in the API.** Every `/api/results/*` route
   requires the ADMIN role at the middleware level. Students receive 403.

## Privacy model (honest version)

- `participations/{electionId}_{uid}` records *that* you voted.
- `ballots/{ballotId}` stores selections **without** the voter's uid.
- The participation→ballot link exists inside the transaction for integrity;
  no ordinary API joins them, and audit logs strip vote content. This is a
  practical privacy separation, **not** cryptographic anonymity.
- Admin can see turnout; ordinary admin UI never reveals who voted for whom.

## One vote per person

1. Primary: authenticated identity — deterministic participation doc ID.
2. Secondary: browser/device token issued on the public landing page.
3. Tertiary: Firestore transaction makes concurrent duplicate votes impossible.

---

## Prerequisites

- Node.js ≥ 20
- A Firebase project with **Google sign-in enabled**
  (Authentication → Sign-in method → Google)
- A Groq API key (https://console.groq.com)

## Setup

```bash
# 1. Install backend
cd backend
npm install

# 2. Configure backend environment
cp ../.env.example .env
#    → set GROQ_API_KEY, ADMIN_EMAILS (comma-separated emails that become admin)
#    → FIREBASE_SERVICE_ACCOUNT_PATH points to your service account key:
#      Firebase Console → Project settings → Service accounts → Generate new private key
#      save it as backend/serviceAccount.json (gitignored)

# 3. Configure frontend environment
cd ../frontend
cp ../.env.example ../frontend/.env   # fill VITE_FIREBASE_* values from Firebase web app config

# 4. Seed demo data (election, invitations, voters, officials)
cd ../backend
npm run seed

# 5. Run (two terminals)
cd backend  && npm run dev     # API on :4000
cd frontend && npm run dev     # App  on :5173
```

### Roles & first login

Users are provisioned automatically on their **first Google login**:

| Priority | Source |
|---|---|
| 1 | Existing profile in Firestore `users` collection |
| 2 | `roleAssignments/{email}` doc (created by seed / `set-role` / ROLES tab) |
| 3 | Candidate invitation matching email |
| 4 | Official invitation matching email (COUNSELLOR / COORDINATOR) |
| 5 | `ADMIN_EMAILS` env allowlist |
| 6 | Default: STUDENT |

Set any role manually:

```bash
cd backend
npm run set-role -- someone@gmail.com COUNSELLOR
```

## Testing

```bash
cd backend
npx vitest run        # rule engine, results engine, state machine, AI schema validation
npx tsc --noEmit      # typecheck both projects
```

## Production build

```bash
cd frontend && npm run build   # static bundle in dist/
cd backend  && npm run build && npm start
```

Serve the frontend bundle from any static host; point `/api` + `/uploads`
at the backend (the Vite dev proxy already does this locally).

## Key endpoints

```
GET  /api/public/elections/:token          QR landing data (no results, ever)
GET  /api/voting/election                  current election for the signed-in user
POST /api/voting/:id/ballot                student ballot (transactional)
POST /api/voting/:id/official-ballot       counsellor/coordinator ballot
POST /api/admin/elections/:id/rules/interpret   NL rules → Groq JSON proposal
POST /api/admin/elections/:id/rules/approve     activate rules (admin only)
GET  /api/results/:electionId              ADMIN ONLY (students get 403)
POST /api/results/:electionId/publish      CLOSED → RESULTS_PUBLISHED
GET  /api/audit                            admin audit trail
```

## Demo accounts (seeded, Google login required)

The seed prints the exact demo emails (admin, counsellor, coordinator,
candidates, students). All are marked as development/demo accounts.
