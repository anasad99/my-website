# Anas El Aadil — portfolio

## Deploying to Vercel

**Root Directory:** leave it as the repo root (`.` / blank) — `package.json`
and `server.js` are at the top level, not in a subfolder.

**Environment variables:** set `ADMIN_USERNAME`, `ADMIN_PASSWORD`,
`SESSION_SECRET`, and the `SMTP_*` / `CONTACT_TO_EMAIL` vars in the Vercel
project's Settings → Environment Variables. Never put real values in
`.env.example` (it's committed to git) — only `.env` locally, which is
gitignored.

### Persistent storage (required for the admin dashboard to actually work)

Vercel runs this as a serverless function with a read-only filesystem (only
`/tmp` is writable, and it's wiped on every redeploy/cold start). Without
extra storage, anything added through `/admin` — works, messages, uploaded
images — disappears the moment a fresh instance spins up. Two free services
fix this, both set up from the Vercel dashboard's **Storage** tab:

1. **Storage → Create Database → Upstash (Redis), Marketplace Database
   Providers** — connect it to this project. This is where `data/projects.json`
   and `data/messages.json` actually live once configured. Free tier: 10k
   commands/day, 256MB — far more than this site needs.
2. **Storage → Create Database → Blob** — connect it too. This is where
   uploaded work images live. Free tier covers a personal portfolio's worth
   of images comfortably.

Connecting either through the dashboard auto-injects the right environment
variables (`KV_REST_API_URL`, `KV_REST_API_TOKEN`, `BLOB_READ_WRITE_TOKEN`) —
no need to set them manually unless you also want to test against the same
live database from your local `.env` (see `.env.example` for where to put
them).

**Without these connected**, the site still works for browsing — it just
falls back to the same non-persistent local-file behavior described above,
and the admin dashboard prints a warning in the function logs saying so.

For an admin dashboard that persists without needing either of these, run
this on a host with a real filesystem instead (a VPS, Render, Railway,
Hostinger Node.js hosting) — no code changes needed there, since local disk
is what `lib/kv-store.js` and `lib/blob-storage.js` fall back to automatically
when the above aren't configured.
