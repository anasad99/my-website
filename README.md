# Anas El Aadil — portfolio

## Deploying to Vercel

**Root Directory:** leave it as the repo root (`.` / blank) — `package.json`
and `server.js` are at the top level, not in a subfolder.

**Environment variables:** set `ADMIN_USERNAME`, `ADMIN_PASSWORD`,
`SESSION_SECRET`, and the `SMTP_*` / `CONTACT_TO_EMAIL` vars in the Vercel
project's Settings → Environment Variables. Never put real values in
`.env.example` (it's committed to git) — only `.env` locally, which is
gitignored.

**Known limitation on Vercel:** Vercel runs this as a serverless function
with a read-only filesystem (only `/tmp` is writable, and it's wiped between
cold starts). So on Vercel specifically:

- Works/messages added or deleted through `/admin` reset to the last deploy's
  `data/projects.json` on the next cold start — they don't persist.
- Uploaded work images likewise don't persist.
- Admin login sessions are in-memory and can drop between requests hitting
  different serverless instances.

The site still renders and the contact form still saves + emails correctly
within a given warm instance; it just isn't durable storage. For an admin
dashboard that actually persists, run this on a host with a real filesystem
(a VPS, Render, Railway, Hostinger Node.js hosting, etc.) instead — no code
changes needed there, since that's the environment this app was built for.
