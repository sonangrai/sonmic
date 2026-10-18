# sonmic

A private, installable music app for families. Paste a YouTube link and sonmic saves the
audio to your device, so it plays offline. Downloads run through a small backend on your
own computer, and only people with an account on that backend can use it.

> **Personal use only.** sonmic isn't affiliated with YouTube or Google. YouTube's
> [Terms of Service](https://www.youtube.com/t/terms) don't allow downloading content
> unless YouTube offers a download option or you have permission. Only save audio you have
> the right to keep, and don't share or redistribute it.

## Tech stack

| Part | Technology |
| --- | --- |
| Frontend | Next.js 16 (App Router, Cache Components), React 19, TypeScript |
| UI | [sonahang-ui](https://ui.sonahangrai.com.np) components and design tokens |
| Offline | PWA (web manifest + service worker), audio stored in IndexedDB |
| Backend | Python, FastAPI, Uvicorn, yt-dlp (uses Node.js as its JavaScript runtime) |
| Accounts | SQLite, scrypt password hashes, bearer tokens (only token hashes are stored) |
| Public access | Cloudflare quick tunnel (`cloudflared`) to the backend |
| Hosting | Frontend on Vercel; backend on your own Mac |

## How it works

```
 Browser / installed app (Vercel)                Your Mac
┌─────────────────────────────────┐   HTTPS   ┌──────────────────────────────┐
│ Next.js frontend                │  tunnel   │ FastAPI backend              │
│  • setup → login → player       │ ────────▶ │  • /auth/login, /me, /logout │
│  • token in localStorage        │           │  • /download (needs a token) │
│  • audio saved in IndexedDB     │ ◀──────── │  • yt-dlp → audio file       │
└─────────────────────────────────┘   audio   │  • users + sessions: SQLite  │
                                              └──────────────────────────────┘
```

1. **Setup:** on first launch the app asks for the backend address and checks `/health`.
2. **Login:** username and password go to the backend, which returns a token.
3. **Download:** the app sends the YouTube link with the token; the backend fetches the
   audio with yt-dlp and streams it back.
4. **Listen:** the app stores the audio in the browser (IndexedDB). It plays offline, even
   when the backend is off.

The backend is what enforces access: `/download` rejects requests without a valid token.
The setup and login screens only guide the user.

## Getting started

### Requirements

- **Home computer:** a Mac, Node.js 20.9+, pnpm 10, Python 3.10+, and
  `cloudflared` (`brew install cloudflared`)
- **Family devices:** a recent browser (Chrome, Edge, Safari or Firefox)

### Install

```bash
pnpm install

# Backend: the scripts expect the virtual environment at backend/.venv
python3 -m venv backend/.venv
backend/.venv/bin/pip install -r backend/requirements.txt
cp backend/.env.example backend/.env   # then add your site to ALLOWED_ORIGINS
```

### Create accounts

```bash
pnpm user add <name>      # add someone, or change their password
pnpm user list
pnpm user remove <name>
```

### Run

```bash
pnpm dev        # local development: frontend on :3000, backend on :8000
pnpm backend    # share the backend: starts it and prints a public HTTPS address
```

`pnpm backend` copies the address to the clipboard. Paste it on each device under
**Settings → Backend server** (or on the first-launch screen). The address changes on
every run; logins stay valid.

`pnpm dev` and `pnpm backend` both use port 8000, so stop one before starting the other
(or run `PORT=8001 pnpm backend`). Only `pnpm backend` reads `backend/.env`.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Frontend and backend together, with reload |
| `pnpm build` / `pnpm start` | Production build, then run both |
| `pnpm backend` | Backend + Cloudflare tunnel for use from other devices |
| `pnpm user …` | Manage backend accounts |
| `pnpm lint` | ESLint |

## Configuration

| Where | Variable | Purpose |
| --- | --- | --- |
| `backend/.env` | `ALLOWED_ORIGINS` | Sites allowed to call the API (add your Vercel URL) |
| `backend/.env` | `MAX_DURATION_SECONDS`, `MAX_FILESIZE_MB` | Download limits (default 30 min, 150 MB) |
| Vercel | `NEXT_PUBLIC_SITE_URL` | Only for a custom domain; used for canonical links and the sitemap |

## Project structure

```
app/            Next.js pages: / (home), /setup, /login, /player, /settings
app/components/ Shared UI (header, auth gate, forms, icons)
lib/            Client logic: API calls, session, backend address, IndexedDB store
backend/        FastAPI app (main.py), accounts (auth.py), user CLI (manage.py)
scripts/        backend.sh: backend + tunnel launcher
public/         Service worker and app icons
```
