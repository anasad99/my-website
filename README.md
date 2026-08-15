# Anas El Aadil — portfolio

Three static pages, one shared stylesheet.

| File | Figma nodes (desktop / tablet / mobile) |
|---|---|
| `index.html` | `363:631` · `363:672` · `363:713` |
| `project.html` | `363:431` · `363:497` · `363:563` |
| `about.html` | `363:106` · `363:147` · `363:188` |
| `contact.html` | no Figma frame — see below |

`styles.css` and `nav.js` are shared by all four. `contact.js` is used only by
the contact page.

## Setup

```bash
bash download-assets.sh   # 25 files into ./assets
open index.html
```

**No terminal?** Open `get-assets.html` in any browser and press the button —
it downloads the same 25 files. Move them into `assets/`.

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

Out of the box the form validates in the browser and then opens the visitor's
email client with the message prefilled. That works with no server, but it's a
fallback, not a real submission — some visitors have no mail client configured.

To post it properly, pick a service and put its URL in the `data-endpoint`
attribute on the `<form>` in `contact.html`:

- **Formspree** — sign up, create a form, use `https://formspree.io/f/xxxxxxx`
- **Web3Forms** — free, no account; add your access key as a hidden input
- **Netlify Forms** — if you host on Netlify, add `netlify` to the `<form>` tag
  instead and it's handled for you

`contact.js` already posts a `FormData` object and handles success and failure
states, so any of these works without further changes.

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

**Other Projects cards** all link to `#`. Range Crazy, Madame FC and Véloce need
their own pages, or point them at `project.html` for now.

## Structure notes

The nav and footer markup is duplicated across the four files — normal for
static HTML, but it means a nav change is a three-file edit. If this grows past
a handful of pages, an include step (Eleventy, Astro, or even a small build
script) would earn its keep.
