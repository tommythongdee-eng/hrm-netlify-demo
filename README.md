# HRM for Thai SMEs — Netlify demo

A standalone, self-contained copy of the HRM app (Next.js web + NestJS API), packaged as a single
folder that deploys entirely on Netlify — no separate backend host, no database to provision. It's
a genuine working demo (real login, real data), not a static mockup.

## Deploy it (GitHub + Netlify)

1. **Push this folder to a new GitHub repo.** From inside `netlify-demo/`:
   ```bash
   git init
   git add -A
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-new-empty-github-repo-url>
   git push -u origin main
   ```
   (If you'd rather use the GitHub website: create a new empty repo there, then follow the "push an
   existing repository" instructions it shows you, pointing at this folder.)

2. **Connect it on Netlify:**
   - Go to [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project**.
   - Choose GitHub, authorize if asked, and pick the repo you just pushed.
   - Netlify should auto-detect the build settings from `netlify.toml` in this folder — just click
     **Deploy**. No environment variables need to be set for the demo to work.
   - The first deploy takes a few minutes (it builds both the Next.js app and the API function).

3. **Open the deployed URL** Netlify gives you and log in with the credentials below.

## Login credentials

| Role | Email | Password |
|---|---|---|
| Org Owner | `owner@demo-sme.local` | `Demo1234!` |
| Superadmin (`/superadmin/login`) | `superadmin@hrm-platform.local` | `SuperAdmin1234!` |

The org starts with **no employees** — the seed script only creates the organization, owner
account, and platform plans, so add a few via **Employees → Add employee** to see the rest of the
app (attendance, leave, payroll, etc.) with real data.

## How this works

- The Next.js app (`app/`, `components/`, `lib/`) deploys normally via Netlify's built-in Next.js
  support (`@netlify/plugin-nextjs`).
- The NestJS API is wrapped as a single Netlify Function at `netlify/functions/api/`, reached
  same-origin at `/api/*` (Netlify rewrites that to the function — no CORS involved).
- The database is SQLite, copied from a pre-migrated, pre-seeded template
  (`netlify/functions/api/prisma/seed-template.db`) into `/tmp` the first time the function runs in
  a given container.

## Known limitations (please read before assuming something's broken)

- **Data resets periodically.** Netlify Functions only get a writable `/tmp`, which is wiped
  whenever the function's container recycles (after a stretch of inactivity, or a new deploy).
  Anything you create — employees, payroll runs, uploaded documents — will disappear when that
  happens. This is expected for a free serverless demo, not a bug.
- **Uploaded documents and the dev-mode invite emails also reset** for the same reason.
- **The JWT signing secrets are baked-in demo defaults**, not private. Fine for throwaway seeded
  data; don't reuse this setup for anything real. (You can override them by setting
  `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` as Netlify environment variables if you want.)
- **The first request after idle time is slower** (cold start — the API has to boot up again),
  typically well under a couple of seconds. Requests after that are fast until the container goes
  idle again.
- **No mobile app and no real payment gateway** — same as the main project; out of scope here too.

## Local development (optional)

```bash
# Web app
npm install
npm run dev            # http://localhost:3000

# API function, in a separate terminal
cd netlify/functions/api
npm install
npm run build           # prisma generate + tsc
DATABASE_URL="file:./local-dev.db" node -e "require('fs').copyFileSync('prisma/seed-template.db','local-dev.db')"
DATABASE_URL="file:./local-dev.db" PORT=4000 node dist/local.js
```
Then set `NEXT_PUBLIC_API_URL=http://localhost:4000/api` in a `.env.local` at the web app root
before running `npm run dev`, since the production default (`/api`, same-origin via Netlify's
redirect) doesn't apply when running the two halves as separate local servers.

## If the first deploy doesn't work

I don't have a Netlify account, so I couldn't do a live end-to-end deploy myself — everything above
was verified locally (the API boots, logs in, and serves authenticated requests correctly; the
Next.js app builds cleanly standalone). If something goes wrong on the actual Netlify infrastructure,
open the failing deploy or function log in the Netlify dashboard and share it — the most likely
culprits, in rough order of likelihood, are noted in code comments in `netlify.toml` and
`netlify/functions/api/api.js`.
