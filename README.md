# NOOR — Quran Explorer

A calm, RTL-first Quran reading experience built with React 19, TypeScript and Vite. Read and listen to the Quran, explore tafsir, track personal reading, use the tasbih counter, reflect through “Quran by Feelings”, and complete a shared Khatmah with family and friends.

## Getting started

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

Lint:

```bash
npm run lint
```

## Features

- Full Quran reader with Uthmani Arabic, Saheeh International translation, transliteration and verified tafsir sources
- Audio player with multiple reciters and per-ayah playback
- Surah and Juz browsing, search, bookmarks and reading progress
- Tasbih counter and prayer times
- **Quran by Feelings** — curated, verified passages for different emotional states
- **Shared Khatmah** — groups with invitation links, anonymous participation, Juz distribution and live progress

## Shared Khatmah setup

Shared Khatmah uses Supabase (Postgres, Anonymous Auth, Realtime, RLS). It is inactive until you provide frontend environment variables and apply the SQL migration. No credentials are included in this repository.

See **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** for complete instructions and **[supabase/migrations/0001_shared_khatmah.sql](./supabase/migrations/0001_shared_khatmah.sql)** for the schema and policies.

Environment variables (copy `.env.example` to `.env.local`):

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_REPLACE_ME
```

Add the same variables to your Cloudflare Pages project settings. The existing `public/_redirects` file enables deep links such as `/khatmah/<invite-code>`.

## Deployment

Hosting remains Cloudflare Pages:

- Build command: `npm run build`
- Output directory: `dist`

The service worker in `public/sw.js` caches the app shell and runtime assets; remote Quran, tafsir and Supabase data are deliberately not cached as application-owned content.
