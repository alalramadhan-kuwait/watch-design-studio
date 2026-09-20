# Watch Design Studio

A parametric watch dial and case design studio. Engine, UI, artwork and the case
photograph all live inside a single `index.html`. No build step, no server, no
database, and no network — your designs stay on the visitor's own device and
are never uploaded.

| file | what it does | required |
|---|---|---|
| `index.html` | the whole app | yes |
| `manifest.webmanifest` | makes it installable: name, icon, its own window | to install it |
| `sw.js` | holds the app offline and announces new versions | to install it |
| `app/` | the icon and the iOS launch screens | to install it |
| `robots.txt` | keeps the site out of search results | no |
| `_headers` | security headers, and stops a stale copy being served after an update | no |
| `.nojekyll` | stops GitHub Pages stripping `_headers` | only on GitHub Pages |

## Putting it online

Nothing here needs building. Upload the folder and it works.

- **Netlify Drop** — drag the folder onto app.netlify.com/drop. Live in ~30s.
- **Cloudflare Pages** — Workers & Pages → Create → Pages → Upload assets.
- **Vercel** — vercel.com/new, drag the folder.
- **GitHub Pages** — push to a repo, then Settings → Pages → pick the branch.

All four are free at this size.

## Installing it on a phone

Open the site and add it to the Home Screen — **Share → Add to Home Screen** on
iOS, **⋮ → Install app** on Android. It then runs in its own window with no
browser chrome, its own icon and launch screen, and it opens in well under a
second because the whole app is already on the device.

Installed or not, the studio never zooms the interface: a pinch is for looking
closer at the watch, and the canvas has its own − / + / Fit for that.

## Updating it

Replace `index.html` and deploy. The service worker fetches the new copy in the
background, and the app says *A new version is ready* with an Update button
rather than swapping itself out mid-edit. Taking it writes the design in
progress to disk first, so the reload comes back to exactly the watch that was
on screen.

Deploying from this repository stamps the commit into `sw.js` automatically,
which is what tells a browser the version changed. Uploading the folder by hand
to another host means editing the `BUILD` line in `sw.js` yourself — if it never
changes, browsers will keep serving the copy they already have.

## Before sharing the link

**Anyone with the link can download everything** — the case photograph, the
numeral faces, the wordmark and the whole parametric engine are inside
`index.html`. `robots.txt` and the page's own `noindex` keep it out of search,
but that is obscurity, not access control.

For real protection use a host that can gate it:

- Cloudflare Pages → Access → self-hosted application → one-time PIN by email
- Netlify → Site settings → Access control → password protection

GitHub Pages has no access control on a free plan.

## Saved work lives in the browser

Every change is saved automatically to the browser's own storage and the app
reopens on your work in progress, so closing the tab costs nothing. Named
versions — Save version — are the points you deliberately return to.

That storage is per-device:

- It does **not** follow you between devices or browsers.
- Clearing browsing data deletes it. So does Private/Incognito browsing.
- In **iOS Safari as a tab**, it is cleared after about seven days of not
  visiting the site. Adding the app to the Home Screen is exempt from that,
  which is the better reason to install it than the icon.

If the browser refuses to store anything, the app says so in red and warns you
once — take that seriously, because then edits really are lost on close.

**Export → Save design file (JSON)** is the only copy that leaves the device.
It is the reliable way to move a design between devices or to back one up.
Designs that sync by themselves would need accounts and a backend.

## Worth knowing

- **The page requests nothing of anyone else.** The interface lettering, every
  dial face and the case photograph are carried inside the file; the only
  things fetched are the page, its manifest and its icons, all from the same
  place. It works with no network at all, and opening it tells no one
  anything. Nothing to block, nothing to leak, nothing to go down.
- First visit is about 1.9 MB — fine on wifi, slow on mobile data. After that
  the service worker holds it, and opening takes about a second whatever the
  connection is doing:

  | | first visit | once installed |
  |---|---|---|
  | wifi | 1.6 s | 1.0 s |
  | 4G | 4.8 s | 1.0 s |
  | slow 3G | 40 s | 0.9 s |
  | no network at all | — | 1.0 s |

  Measured to the first drawn watch, on a throttled headless browser; a real
  phone is quicker. The dial surface starts coarse and sharpens a second or
  two later.
- The renderer is CPU-heavy — shading the dial surface is most of it, and the
  cost rises with the square of the preview resolution under Scene. Smooth on
  a current phone or laptop; an older Android will feel slower, especially
  while dragging a slider. Lower the preview resolution if it drags.
- **Share** carries a lighter dial surface than **Export image (PNG)**, so it
  can be produced without locking the page up. Geometry, numerals and
  lettering are vector and identical in both. For artwork, use Export.

## Atelier tools

The Atelier strip adds a searchable collection of 47 techniques across engine
turning, decorative relief, surface finishes, stone, lettering and hands. Surface
swatches use the actual material shader and the current dial colour. Applying a
technique is one undoable edit and opens its component properties.

Seven additional procedural height fields are available in the dial, zone and
close-up pattern selectors: tapisserie, perlage, Geneva waves, écaille, chevron,
linen and hammered relief. They are visual studies, not manufacturing toolpaths.
Use Studio or Neutral rendering for material previews; the legacy renderer uses
its original simplified surface illustration.

**Design studies** offers six coordinated dial directions. A study preserves the
case geometry, changes dial styling, and switches from the photograph to the drawn
case so strap colours can be previewed. Undo restores the prior design.

**Design check** reports approximate hand clearance, base-colour contrast,
component envelopes, dial coverage and surface detail scale. It always calls out
production review: it does not validate movement compatibility, dial feet,
vertical hand clearance or manufacturing feasibility.

**Specification** exports a JSON brief containing the design state, reference case
specification and check results. Reopen it using Export → More formats → Open
design file. Imported photographs, slabs and fonts remain separate assets, as in
the existing design export workflow.

Run the dependency-free regression suite with Node.js 18 or newer:

```sh
node --test tests/atelier.test.cjs
```

## Syncing your saved versions

Saved versions live in the browser's own storage, so until you sign in they are
that device's alone — which is why a version named on a desktop was not on the
phone. Signing in with your Timekeeper account (the same email and password as
the Daily Store Report) copies them through `public.watch_designs` in the shared
Supabase project, and they appear on every device you sign in on. Row-level
security keys every row to the person who saved it; nobody sees anybody else's.

The local list stays the working set, so saving, opening and deleting versions
all work with no connection and catch up when there is one. Deletes leave a
tombstone, so throwing a version away on one device does not bring it back from
another. Only named versions travel: the design you are in the middle of stays
on the device you are editing it on, and so does its autosave.

Signing out stops the copying. It leaves this device's versions where they are.
