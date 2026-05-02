# AGENTS.md — Straterize

Strava-powered runner's analytics dashboard. Built with TanStack Start (full-stack React SSR), Drizzle ORM, Better Auth, Recharts, and Leaflet. MVP covers OAuth, activity feed, and analytics dashboard (Phases 1–3).

## Stack

| Concern | Tool |
|---|---|
| Framework | TanStack Start `1.120.20` + TanStack Router (file-based) |
| Data fetching | TanStack Query `5.99.2` — server loaders + `useInfiniteQuery` client-side |
| Auth / sessions | Better Auth `1.6.5` — session cookies only; Strava OAuth flow is manual |
| ORM | Drizzle ORM `0.45.2` + `@libsql/client` (SQLite via Turso) |
| Charts | Recharts `3.8.1` |
| Maps | react-leaflet `5.0.0` + OpenStreetMap tiles (no API key required) |
| Styling | Tailwind CSS v4 |
| Runtime | Node.js v20 |

## Dev Commands

```bash
npm run dev          # start dev server at http://localhost:3000
npm run build        # production build
npm run db:push      # sync Drizzle schema to local.db (run after any schema change)
npm run db:studio    # open Drizzle Studio in browser to inspect tables
```

> `db:push` must be re-run whenever `app/lib/db/schema.ts` changes. There are no auto-migrations in dev.

## Project Structure

```
app/
  routes/             # File-based routes (TanStack Router)
    __root.tsx        # Root layout — QueryClient provider lives here
    index.tsx         # Landing page / "Connect with Strava" CTA
    dashboard.tsx     # Protected main dashboard
    activities/
      index.tsx       # Infinite scroll activity feed
      $id.tsx         # Activity detail: map + elevation chart + splits
    auth/
      strava.ts       # Redirects to Strava OAuth authorize URL
      callback.tsx    # Exchanges OAuth code for tokens, stores in DB
  lib/
    strava.ts         # Typed Strava API fetch wrapper + token refresh logic
    auth.ts           # Better Auth config (session management only)
    polyline.ts       # Google Encoded Polyline decoder (manual, no dep)
    db/
      schema.ts       # Drizzle table definitions — source of truth for DB shape
      client.ts       # Drizzle client instance (import `db` from here)
  components/         # Reusable UI components
  server/functions/   # TanStack Start createServerFn() — server-only logic
app.config.ts         # TanStack Start / Vite config
drizzle.config.ts     # Points to schema, outputs to drizzle/migrations/, dialect sqlite
.env                  # Required — see below
local.db              # SQLite file created by db:push (gitignored)
```

## Environment Variables

All required in `.env` before the app will run:

```env
STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
STRAVA_REDIRECT_URI=http://localhost:3000/auth/callback
DATABASE_URL=file:./local.db
BETTER_AUTH_SECRET=        # any random 32+ char string
```

Get Strava credentials at `https://www.strava.com/settings/api`. Set "Authorization Callback Domain" to `localhost` during development.

## Key Architecture Decisions

- **Strava OAuth is manual** — Better Auth does not have a built-in Strava provider. The authorize redirect and code exchange are implemented in `app/routes/auth/strava.ts` and `app/routes/auth/callback.tsx`. Better Auth is used only for session cookie lifecycle.
- **Token refresh** — `app/lib/strava.ts` checks `expires_at` before every API call and silently refreshes if the token expires within 5 minutes. Access tokens expire every 6 hours.
- **Activity caching** — Fetched activities are stored in the `activities` SQLite table. Subsequent loads read from DB, not Strava, to stay within rate limits (100 req/15min, 1000/day).
- **Server functions** — Use `createServerFn()` from `@tanstack/start` for anything that touches the DB or Strava API. These run server-side only and are called from loaders or client components.
- **Polyline decoding** — Strava returns routes as Google Encoded Polyline strings. `app/lib/polyline.ts` decodes these to `[lat, lng][]` arrays for Leaflet. No external dependency.
- **Filtered to runs** — All activity queries filter on `sport_type = 'Run'` or equivalent. The dashboard is runner-specific.

## Database Schema (3 tables)

- `users` — strava_id, name, avatar, city, country
- `strava_tokens` — access_token, refresh_token, expires_at, user_id FK
- `activities` — cached Strava activity data + raw_json column for full response

## Route Protection

Dashboard and activity routes redirect to `/` if no valid session exists. Check session in the route `loader` using a server function before rendering.

## Strava API Scopes

Request `read,activity:read` during OAuth. `activity:read_all` is needed for private activities — not required for MVP.

## MVP Scope (Phases 1–3)

- **Phase 1** — OAuth flow, token storage, athlete profile on `/dashboard`
- **Phase 2** — Infinite scroll activity feed, activity detail with Leaflet map + elevation chart + splits table
- **Phase 3** — Analytics: weekly mileage BarChart, pace trend LineChart, best efforts table, stat cards (avg cadence, avg HR, long run weeks)
