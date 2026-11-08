# Watch Design Studio

A parametric watch dial and case design studio. The 2D engine, UI, artwork and case photograph live in
`index.html`; the optional 3D view loads a bundled renderer from `vendor/`.
No build step is needed to run the committed app, no server API, no
database, and no third-party network requests — your designs stay on the visitor's own device and
are never uploaded.

| file | what it does | required |
|---|---|---|
| `index.html` | editor and 2D engine | yes |
| `vendor/` | optional Three.js 3D renderer and license | for 3D |
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

Replace `index.html` and `vendor/` and deploy. The service worker fetches the new copy in the
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
  things fetched are the page, its 3D bundle, its manifest and its icons, all from the same
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

## Simple mode and the full editor

The studio opens in **simple mode**: one panel that walks through a watch in
eight steps — **Start** (a fresh standard dial, a preset, a reference design
or a saved version), **Case**, **Dial** (colour, surface, minute track),
**Markers** (numeral system and font, how they are made, colour, size and
position, or index shapes), **Hands** (shape, metal, lume, seconds hand),
**Text** (the built-in NOREL logo or its shield alone, your own logo uploaded as a PNG, JPG or SVG, or a name typed in a font; two lines of lettering and where they sit), **Date**
(day and date windows, their discs and magnifier) and **Finish** (name, the
design check, saving and sharing). Figures and indices under a day or date
window are left off, as a dial maker would.

Nothing has been taken away. Every step ends with a link to all the settings
for that part, which opens the **full editor** at it, and the **Full editor**
button in the top bar switches over entirely (**Simple mode** switches back).
Both drive the same design, so undo, versions and exports see every change
whichever one made it. The browser remembers which one you used last.

On a phone the watch keeps the top of the screen and the steps the bottom.
Each row of choices scrolls sideways, and the full editor is under **⋯**.
A first visit opens on the standard dial.

## Stone and mother-of-pearl dials

In simple mode, **Dial → Surface → Stone** lists the sixteen stones
(malachite, tiger's eye, meteorite, aventurine, lapis lazuli, turquoise,
rhodonite, sodalite, carnelian, jade, onyx, snowflake obsidian, opal, white
onyx, pietersite, red jasper), each drawn from its photographed slab.
**Mother of pearl** uses the photographed nacre slab. Where the printing
(numerals, logo and text, minute track) would not read on the chosen stone,
a button sets it to white, or to navy on a pale stone; the test is the
contrast against the slab's measured average tone.

## Numeral and lettering colours

In simple mode the numerals, hour markers, minute track and text each take
**Print colours** (28 inks a dial printer is asked for, from cream and
vintage lume to teal, burgundy and rose gold) or **Pantone**, the full
library searchable by code (for example 289 C). The nearest Pantone is
named under the swatches for any colour picked. The **+** swatch still
takes any colour.

## The NOREL case photograph

The R4 (3 Nov) case is shown in Blue Creations' own render of the watch on
its bracelet (`app/case-norel-r4-real.jpg`): their case, fluted bezel, crown
and bracelet, with the designed dial drawn into the opening (Ø31.40 = 65.14%
of the picture's width, centred). The supplier's dial, text and colour labels
were removed from the picture first.

## The NOREL logo

NOREL's logo is built in as vector artwork, traced from the client's file of
5 Nov 2026: **NOREL logo** (the shield over the wordmark), **NOREL shield** and
**NOREL wordmark**. Being vectors, they stay sharp at any size and take the
lettering colour, raised print or an applied metal like the other marks. The
NOREL start design opens with the full logo in navy, 5.4 mm high, centred
8.2 mm above the centre, just under the day window. In simple mode choose it
under **Text → Logo**.

## Dial colours

Three collections in the Dial step (and in the full editor's colour field):
**Studio**, a short house palette; **Watch classics**, 27 dial colours of
well-known watches, each measured as the median colour of the dial in the
maker's own catalogue photograph and labelled with the reference it came
from; and **Pantone**, the full library: 2,131 colours (Solid Coated, Pastels &
Neons and the Metallic guides, as of 2015), grouped by hue and searchable by
code, with the code under each swatch. The sRGB values come from the open
[pantonr](https://github.com/thompsongl/pantonr) data (MIT), built from
Pantone's own swatch files; the names and the standard are Pantone's, and the
newer 2001–2347 C codes are not included. The full editor keeps the earlier
curated list as **Dial picks** and takes a typed code (Enter applies it).
A photograph is one lighting of a dial, so a measured colour is a starting
point; Pantone stays the binding reference. RAL Classic was considered and
left out: its published values carry no open licence.

## Versions and updates

The version and its date show in the top-left corner of the watch screen
(**v2.1.0 · 2 Nov**), and with the build at the foot of the ⋯ menu, so any
screenshot says which version it came from. `APP_VERSION` in `index.html` is
raised with every change people will notice (major: a new way of working;
minor: something new to do; patch: a fix). Each deploy stamps the commit and
date into the app and publishes `version.json`.

The app keeps an offline copy. On opening it asks the site for
`version.json`; if a newer version is published, it installs straight away
when nothing has been changed since the app opened, and otherwise the label
turns orange (**update to vX**) and a tap installs it. The design is saved
first and reopens.

## Cases

A design names the case it is drawn for. **Case → Case** offers three, each fixed
to its factory drawings:

| case | what it is |
|---|---|
| Vernoy cushion · RD26-0172 | the original 36 mm cushion case, with its photograph template |
| NOREL B6098G-A1 · R3 | Blue Creations' 41 mm round case as drawn: 40.0 / 34.8 fluted bezel (72 V flutes 0.41 mm deep, taken from their STEP; the photograph uses that bezel), Ø32.5 opening, President bracelet, Sellita SW240-1 day-date |
| NOREL B6098G-A1 · Concept D | the proposal: a 41.0 bezel flush with the case, 33.8 inside (3.6 mm of flutes and land a side), Ø31.4 opening, 2.5× cyclops |
| NOREL B6098G-A1 · R4 (3 Nov) | Blue Creations' assembly drawing of 2026.11.03, Concept D taken up: Ø41 bezel flush, (3.40) ring to Ø34.2, Ø33.5 glass, Ø31.4 opening, Ø32.5 dial, 11.2 mm; a Ø7.0 × 5.5 cut-circle cyclops centred 10.0 mm out (date at 9.95) |

Changing the case refits the dial: every radial measurement — chapter ring,
tracks, zones, borders, numerals, indices, logo position — is scaled by the
ratio of the two openings, and it is one undo step. The NOREL cases also switch
on the **Day window** and place the **Date window** where the SW240-1 shows
them: the day disc at R11.27–13.17 mm through at most 53°, the date through
2.40 × 2.00 mm centred 9.95 mm out at 3. The window radius is the movement's;
the arc, frames, cyclops and the printing on the discs (Arabic or English day
names, Western or Arabic-Indic dates) are design choices. **Design check**
reports a window larger than the movement aperture, a date moved off its ring,
a magnified date bigger than the lens, a day arc past 53°, and numerals at 11
and 1 that run into the day window.

The case photograph is of the Vernoy case, so it is not composited over a NOREL
case; the drawn case is used instead. Concept D is a proposal: its bezel seat,
crystal, cyclops and dial seat are for Blue Creations to confirm.

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
npm test
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

## 3D dial and case preview

Choose **3D view** in the Atelier strip. Drag to orbit, scroll or pinch to zoom,
or focus the canvas and use the arrow keys. Perspective, Front and Macro buttons
reset the camera; Rotate starts optional animation. **Save 3D image** exports PNG.

The **Silver meteorite · twin subdials** study applies a photo-inspired silver
dial with two recessed registers, applied markers and polished hands. It retains
the existing cushion case dimensions. Undo restores the previous design.

Applied index silhouettes and hands are extruded from the editor's artwork.
Subdials have real openings, walls and lowered floors. Marker height, bevel,
subdial recess, hand height, material roughness, light direction and crystal dome
are adjustable and saved with the existing design JSON and browser autosave.
Hand height is kept at least 0.2 mm above the selected marker height. The crystal
is a transparent reflection surface, not an optical refraction simulation.

This is an appearance study, not manufacturing CAD: case lugs and strap are
simplified, numeral/logo/date artwork remains flat, and production clearance
requires independent verification. Subdials outside the dial or overlapping
another register are omitted from the 3D recesses. WebGL is required for 3D;
the existing 2D editor remains available without it. The bundle is precached for
offline use and all rendering stays on the device.

To modify the renderer, use Node.js 22 or newer:

```sh
npm ci
npm run build
npm test
```

Commit `vendor/relief3d.bundle.js` after changing `src/`. Three.js is distributed
under the included MIT license. Hosting requires the committed files only.
