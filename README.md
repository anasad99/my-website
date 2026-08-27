# Anas El Aadil — portfolio

A Node/Express site: `about.html` and `contact.html` are served as static
files, while the home page and each case-study page are rendered from
`data/projects.json` through EJS templates. Works are managed through a small
admin dashboard rather than by hand-editing HTML.

| Page | Figma nodes (desktop / tablet / mobile) | Source |
|---|---|---|
| Home (`/`) | `363:631` · `363:672` · `363:713` | `views/index.ejs` |
| Case study (`/project/:slug`) | `363:431` · `363:497` · `363:563` | `views/project.ejs` |
| `about.html` | `363:106` · `363:147` · `363:188` | static |
| `contact.html` | no Figma frame — see below | static |

`styles.css` and `nav.js` are shared by every page. `contact.js` is used only
by the contact page.

## Setup

```bash
bash download-assets.sh   # 25 files into ./assets
npm install
cp .env.example .env      # then set ADMIN_USERNAME / ADMIN_PASSWORD / SESSION_SECRET
npm start                 # http://localhost:3000
```

Use `npm run dev` instead of `npm start` to auto-restart on file changes.

**No terminal for the asset download?** Open `get-assets.html` in any browser
and press the button — it downloads the same 25 files. Move them into
`assets/`.

## Managing works

Projects live in `data/projects.json`, not in the HTML. To add, edit, or
remove one:

1. Go to `/admin/login` and sign in with the credentials from `.env`.
2. **Add a work** — fill in name, discipline, comma-separated services, the
   case-study text, and upload one or more images. The first image becomes
   the homepage/Other-Projects thumbnail; the rest fill out the case-study
   gallery (auto-arranged: wide, pair, wide, pair, …).
3. **Delete a work** from the same dashboard — this removes its entry from
   `data/projects.json` and its uploaded images under `assets/works/<slug>/`.

The home page's "Our work" section and every case-study page (including its
"Other Projects" list) are generated from this data on each request, so a new
work shows up everywhere immediately — no HTML editing required.

Uploaded images are written to `assets/works/<slug>/`; the original seed
images (`sv-*.png`, `imarchi-*.png`, etc.) stay in `assets/`.

## Assets

The script pulls from Figma's temporary export URLs, which **expire about 7 days
after export (roughly 22 August 2026)**. Run it soon. If the links are dead,
export the same layers by hand using the filenames in the script.

Everything comes from the desktop frames — the highest-resolution exports. The
CSS scales them down for tablet and mobile, so there's no reason to keep the
smaller variants.

## Fonts

**Aktiv Grotesk** (Dalton Maag, commercial) isn't bundled. Until you add a
licensed webfont and a `@font-face` block, the stack falls back to Helvetica
Neue → Helvetica → Arial. The 64px project titles are where you'll notice the
difference most.

Letter-spacing is in `em` (`-0.03em` / `-0.05em`) rather than Figma's px values,
so tracking survives any font-size change.

## Breakpoints

```
        ↓ 768px            ↓ 1280px
mobile  │  tablet          │  desktop
```

What actually changes at each:

**768px** — mobile menu becomes an inline nav; the oversized A.E.A masthead
appears (both mobile frames drop it entirely); project image pairs go
side-by-side; the Other Projects cards become a 3-up row; home page project
descriptions go two-column; footer goes horizontal.

**1280px** — nav swaps the A.E.A monogram for the full wordmark; the case-study
header splits into two columns; text measures widen (intro to 1080px, project
lead capped at 720px).

## The contact page

There was no Figma frame for this one, so it's built from the system the other
three establish: 64px head with tight tracking, hairline rules top and bottom,
15px gutters, underline-only form controls (no boxes or rounded corners — the
design never uses either), and the same 768 / 1280 breakpoints. At 1280px the
form and the details columns sit side by side, matching how the case-study
header splits.

I left the recurring "Connect with us to explore your project's potential" band
off this page — on a contact page it says the same thing twice. Paste the
`<section class="connect …">` block from `about.html` back in if you'd rather
keep every page identical.

### Wiring up the form

The form posts to the server's own `/contact` route (`data-endpoint="/contact"`
in `contact.html`) — no third-party form service needed. Every submission is:

1. Saved to `data/messages.json` and shown under **Messages** on `/admin`
   (readable, deletable — no SMTP required for this part).
2. Emailed to you, if SMTP is configured in `.env`
   (`SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` / `CONTACT_TO_EMAIL`, see
   `.env.example`). For Gmail, `SMTP_USER` is your address and `SMTP_PASS`
   must be an [App Password](https://myaccount.google.com/apppasswords), not
   your normal login password.

Without SMTP set, the form still works end-to-end — submissions just show up
only in `/admin`, not your inbox, and the dashboard displays a reminder that
email isn't configured. If `contact.js` can't reach the server at all (e.g.
opened as a local file instead of through `npm start`), it falls back to
opening the visitor's email client with the message prefilled.

## Decisions worth knowing

**Home page image strips scroll.** Figma clips the third image at the frame edge;
on the web that's unreachable content, so it's a scroll-snapping row.

**The nav sticks.** Absolute-at-top in Figma is ambiguous; sticky suits a
portfolio. Swap to `position: relative` if you disagree.

**Two Figma quirks I didn't reproduce literally.** The About page's intro
sections have fixed heights that clip their own 120px bottom padding — the
padding never renders. I used the tablet frame's 56px, which is the same layout
without a fixed height and is almost certainly the intent. Similarly the awards
strip is stretched to exactly 100px tall in Figma; here it scales proportionally
so the logos don't distort.

## Things to check

**The case-study lead paragraph is italic on desktop only.** Tablet and mobile
set it in regular. I matched the frames exactly, so it changes style at 1280px —
which looks like an accident rather than a decision. If it is, delete the
`.case-head__lead { font-style: italic; }` rule in the desktop media query.

**The `Case Study` link** pointed at a different Figma file in the design. It
currently links to `#main` as a placeholder.

**Social links** pointed at Figma's own URLs in every frame. They now point at
platform home pages — swap in the real profiles.

**Voice is inconsistent in the source.** The About page says "I'm Anas El Aadil"
while the project write-ups say "we built". I used first person on the contact
page to match About. Worth settling on one across the site.

**Other Projects cards** now come from `data/projects.json` — every real work
added through `/admin` gets its own case-study page automatically. The old
Range Crazy / Madame FC / Véloce placeholders (no real content behind them)
were dropped rather than wired to fake pages.

## Structure notes

The home page and case-study page share `views/partials/nav.ejs` and
`views/partials/footer.ejs`, so a nav change there is a one-file edit.
`about.html` and `contact.html` are still static, so the same markup is
duplicated in those two — if the site grows past these four pages, converting
them to EJS too (or introducing a full include step) would earn its keep.
