# Shared Khatmah — Supabase setup

This feature is **not connected to any external service by default**. Until you complete the steps below, NOOR shows a clear “setup required” message instead of pretending that group data is live.

Nothing in this repository contains Supabase credentials.

---

## 1. Create the Supabase project

1. Create a project at <https://supabase.com/dashboard>.
2. Note the **Project URL** (`https://<ref>.supabase.co`).
3. Open **Project Settings → API** and copy the **publishable key** (`sb_publishable_…`). Older projects label this as the `anon` key. Both are accepted by the app.
4. **Never** copy the `service_role` or secret key into frontend configuration. The app only needs the publishable key; elevated operations are performed by database functions.

---

## 2. Apply the database migration

Open the Supabase SQL editor and paste the whole contents of:

```text
supabase/migrations/0001_shared_khatmah.sql
```

Run it. It creates:

- `khatmahs`, `khatmah_participants`, `khatmah_juz`
- 30 juz rows automatically for every new Khatmah
- Row Level Security policies on every table
- `SECURITY DEFINER` RPCs for create, join, assign, auto-assign, self-select, progress, joining control and listing
- Realtime publication setup

The migration is idempotent enough to re-run: tables, policies, triggers and functions use `if not exists` / `drop ... if exists` where appropriate.

---

## 3. Enable anonymous sign-ins

In Supabase dashboard:

1. **Authentication → Providers → Anonymous Sign-Ins** → enable.
2. **Authentication → Settings** → keep **Session persistence** enabled (default).
3. Optionally reduce the anonymous session lifetime to suit your policy.

The app calls `signInAnonymously()` only when there is no existing session, so a returning browser keeps its identity. A display name is **never** used to identify a participant.

> Tell users: clearing browser data, using a different browser/device, or losing the anonymous session may prevent recovery of their identity and progress. There is no email/password recovery in this version.

---

## 4. Configure the frontend

Create `.env.local` in the project root:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_REPLACE_ME
```

For older projects you may use `VITE_SUPABASE_ANON_KEY` instead.

Then restart the dev server:

```bash
npm install
npm run dev
```

The **Shared Khatmah** section on the homepage and the sidebar item become active once both values are present.

---

## 5. Cloudflare Pages deployment

Keep the existing Cloudflare Pages project. In **Settings → Environment variables**, add the same two variables for **Production** (and Preview if you want preview builds to use Supabase):

| Variable | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable / anon key |

Build settings remain:

- Build command: `npm run build`
- Build output directory: `dist`

`public/_redirects` is copied into `dist` and allows deep links such as `/khatmah/<invite-code>` and `/reader/2` to load the React app.

---

## 6. Realtime verification

The migration adds `khatmahs`, `khatmah_participants` and `khatmah_juz` to the `supabase_realtime` publication with `REPLICA IDENTITY FULL`. RLS applies to Realtime events, so members only receive changes for groups they belong to.

If events do not arrive:

- confirm the tables are in **Database → Publications → supabase_realtime**
- confirm Realtime is enabled for the project
- check the browser console for channel `CHANNEL_ERROR`
- use the in-app **Refresh** button; network interruptions are handled by refetching on reconnect

---

## 7. Security model

- All three tables have RLS enabled.
- Direct writes to `khatmah_juz` are not permitted from the client; every progress change goes through a function that checks membership and ownership.
- `assign_juz`, `auto_assign_juz`, `set_joining_open` verify `is_khatmah_owner(auth.uid())`.
- `set_juz_status` verifies that the caller is the participant assigned to that juz.
- `self_select_juz` uses a conditional update so two people cannot claim the same available juz.
- Participant identity and role are protected by a trigger; only `display_name` is editable by the participant.
- Invite preview is a minimal `SECURITY DEFINER` function keyed by the unique invite code; it does not expose other groups.
- No privileged key exists in frontend code or environment variables.

---

## 8. Suggested two-browser test

1. In browser A, open **Shared Khatmah → Create a Khatmah** and create a group.
2. Copy the generated invitation link from the dedicated page.
3. In browser B (a different profile / private window), open that link.
4. Join with a different display name.
5. In browser A, assign a juz to browser B, or use **Auto-assign available juz**.
6. In browser B, start the juz and mark it complete.
7. In browser A, confirm the progress bar and Juz card update without refreshing.
8. In browser B, try assigning someone else or editing another participant. It must fail.
9. Refresh both browsers and confirm progress persists.
10. Open an invalid/changed invitation code and confirm the friendly error state.
11. Turn off the network, then restore it; the page should reconnect and refetch.

---

## 9. Known limitations

- Anonymous identities are browser-bound; there is no account recovery or email upgrade in this version.
- Completed Khatmahs remain visible in the member’s history via the group list; deleted groups are removed by database cascades.
- The feature is deliberately not gamified: opening a juz in the reader never records completion.
