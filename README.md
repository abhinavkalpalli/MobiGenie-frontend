This is the MobiGenie frontend — a [Next.js](https://nextjs.org) 16 (App Router, Turbopack) app that provides the chat UI for MobiGenie, an AI phone recommendation assistant.

> **Note:** This project pins a Next.js version that may differ from what you know — check `node_modules/next/dist/docs/` for anything unfamiliar before assuming standard behavior (see `AGENTS.md`).

## Stack

- Next.js 16 / React 19 (App Router, client components, no global state library — plain hooks)
- Tailwind CSS 4
- `@react-oauth/google` for Google Sign-In

## Prerequisites

- Node.js 20+
- The [backend](../backend/README.md) running and reachable (defaults to `http://localhost:3000/api/v1`)

## Setup

```bash
npm install
```

Create `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your-google-oauth-client-id>
```

## Running

```bash
npm run dev
```

Runs on **port 3003** (see `package.json`'s `dev` script) — open [http://localhost:3003](http://localhost:3003).

```bash
npm run build   # production build
npm run start   # serve production build
npm run lint    # eslint
```

## App structure

| Path | Purpose |
|---|---|
| `app/login` | Sign in / sign up / OTP verification / forgot-password / Google login / guest login |
| `app/page.tsx` | Main chat UI (sessions sidebar + streaming chat window) |
| `app/admin` | Admin-only dashboard — user management, phone catalog management (role-gated via `useAdminAuth`) |
| `hooks/useAuth.ts` | Loads the current user from `/auth/me`, retries via `/auth/refresh`, redirects to `/login` on failure |
| `hooks/useChat.ts` | Session list, message loading, and SSE-streamed chat sending |
| `lib/api.ts` | Typed `fetch` wrapper (`apiFetch`) + `authApi`/`sessionApi`/`chatApi`/`adminApi`, plus the raw SSE `streamQuery` client |
| `lib/auth.ts` | No-op token helpers (tokens live in httpOnly cookies set by the backend — not accessible from JS) |
| `types/index.ts` | Shared TS types (`User`, `Phone`, `Session`, `Message`, ...) |

## Auth model

The backend issues JWTs as **httpOnly cookies** (`accessToken` / `refreshToken`); the frontend never reads or stores tokens itself — every API call is made with `credentials: "include"`. `useAuth` re-derives the session on mount by calling `/auth/me`, falling back to `/auth/refresh` once before redirecting to `/login`.

Three ways to authenticate from `/login`:
- Email/password (with OTP email verification on sign-up)
- Google Sign-In
- **Guest login** — starts an ephemeral session with no account required, capped at 2 chats / 5 messages. When a guest hits either limit, a modal (`components/GuestLimitModal.tsx`) prompts them to log in; existing guest chat history stays readable, but creating new chats or sending further messages is blocked until they sign in.

## Learn more

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
