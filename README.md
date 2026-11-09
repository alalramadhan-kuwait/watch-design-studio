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
eight steps — **Start** (continue the design you were on, or begin from a
plain dial, a preset, a reference design or a saved version), **Case**, **Dial** (colour, surface, minute track),
**Markers** (numeral system and font, how they are made, colour, size and
position, or index shapes), **Hands** (shape, metal, lume, seconds hand),
**Text** (the built-in NOREL logo or its shield alone, your own logo uploaded as a PNG, JPG or SVG, or a name typed in a font; two lines of lettering and where they sit), **Date**
(day and date windows, their discs and magnifier) and **Finish** (name, the
design check, saving and sharing). Figures and indices under a day or date
window are left off, as a dial maker would.

Nothing has been taken away. Each step's **More options** sheet holds the
rest of that part's settings (see below), with a link at its foot that opens
the **full editor** at it, and the **Full editor**
button in the top bar switches over entirely (**Simple mode** switches back).
Both drive the same design, so undo, versions and exports see every change
whichever one made it. The browser remembers which one you used last.

Since v3.0.0 simple mode moves differently:

- **Where you are.** On a phone the panel opens with "Dial · step 3 of 8"
  and a numbered bar: finished steps are gold, the current one black. Tap a
  number to jump, or the label for a list of all eight steps with what each
  still needs. On a desktop the step pills carry the same ticks and dots.
- **Short tabs.** Long steps are cut into tabs that each fit about one
  screen: Case (Shape · Metal and strap), Dial (Colour · Surface · Minute
  track), Markers (Style · Font or Shape · Made by · Size, plus Gems when
  the dial has them), Hands (Shape · Seconds), Text (Logo · Lines · Colour)
  and Date (Day window · Day lettering · Date window). The day window's
  width is Narrow, Standard or Wide (the degree slider that repeated it is
  in the full editor), and a design with another width shows it as a chip.
- **The watch is framed on the part you edit:** the case on Start, Case and
  Finish, the whole dial for Dial, Markers, Hands and Text, the centre for
  the seconds hand, and a close-up of the day or date window on Date.
  **Whole watch** (top right of the watch) shows everything and switches
  back. Choosing a design or a case frames it again, so a 41 mm NOREL is no
  longer shown at the 36 mm Vernoy's framing.
- **Start** shows the design you are working on first, with **Continue
  designing** (it returns to the step you were on), then other starting
  points (**See all** shows them as a grid) and your saved versions. A first
  visit opens on the NOREL B6098G-A1, the watch being made. A reload within
  half an hour goes straight back to the step you were on.
- **Choices name themselves.** Every swatch has its name under it, and the
  chosen colour reads "Powder blue · nearest Pantone 651 C" (the hex code is
  in the full editor). Everything you tap is at least 44 pt, and a toggle's
  words switch it as well as the switch.
- **Sliders** show their value in millimetres (a position reads "6.6 mm
  below the centre"), have − and + (↑ and ↓ for positions) for fine steps,
  holding repeats, a mark where the design started and **↺ Back to …** once
  moved. One press, or one hold, is one undo step.
- **Warnings** sit on the step that can fix them, in plain words with the fix
  beside them where there is one: "The printing won't show on this dial ·
  Print in white", "The numerals run under the bezel · Make them fit", "The
  day window reaches the 11 and 1 · Narrow to 33.5°", "The magnifier doesn't
  cover the whole date". The step's number in the bar and its tab carry an
  amber dot. Finish lists them all the same way.
- **A tap lights at once**; the watch is drawn a frame later, with a slow
  shimmer if it takes a while. Thumbnails are kept until something they show
  changes.
- **Finish** ends with **Done ✓**: it saves a version under the design's
  name and offers Share, Export or Keep refining. Messages appear over the
  foot of the watch, never over Next.
- **Preview time.** While you edit, the seconds hand rests at 37 s rather
  than across the lettering at 6, and on the Text step it is left out. Only
  the picture on screen changes: the design, its exports and every saved
  file keep the time they were saved with.
- **On its side**, a phone shows the watch on the left and the steps on the
  right.

All the words simple mode shows are in `index.html`: its sentences in one
table (`GSTR`, English and Arabic under the same keys) and its short labels in
another (`GWORD`, by their English wording).

**One glossary.** Both modes use the same words: the full editor shows its
drop-down values by name (Sunburst, Guilloché, Pearl sheen rather than
`sunburst`, `guilloche`, `mop`), calls the date lens the **Magnifier**, the
text component **Text**, and the ⋯ menu's save **Save version**. The values
stored in a design file do not change. In the full editor at laptop widths
the toolbar sits tighter, and on a narrower window it takes a second row
rather than pushing Share and Export off the screen.

## The 3D view, rebuilt (v3.4.0)

**3D view** now shows the NOREL as a product render rather than a sketch:

- **The real case.** The case middle, lugs, crown and case back are Blue
  Creations' own STEP of the B6098G-A1 assembly (R1), tessellated into
  `app/norel-case-r1.glb` (0.7 MB, about 48,000 triangles) by
  `tools/norel-case-glb.py`. It is fetched only the first time the 3D view
  opens, and the offline copy keeps it. The bezel, crystal and cyclops are
  built in code to the **R4** numbers (3 Nov drawing): bezel Ø41.00 with 72
  flutes 0.41 deep, ring Ø34.20, glass Ø33.50 × 1.50, opening Ø31.40, 11.20
  over the crystal, cyclops Ø7.00 cut to 5.50, 1.10 high, 10.00 mm out at 3.
  `src/relief-model.js` says which numbers come from which source. R3 and
  Concept D designs use the same case with their own bezel and glass sizes.
- **The bracelet.** A President-style bracelet made in code: rounded links in
  rows of three with gaps, brushed outers and a polished centre, end links
  that follow the lug tops, tapering from 21 mm to the 16 mm clasp and
  curving down and away as it would round a wrist.
- **Light and metal.** A softbox studio built in code (no image is
  downloaded), polished steel and gold as mirrors, brushed steel with a
  directional grain, a soft contact shadow, a sapphire crystal that adds a
  reflection without dimming the dial, and a clear cyclops that shows the
  date window and the dial round it magnified 2.2× about the lens's centre,
  clipped to the lens and carried with it as the view turns. (The 3D view
  prints the date plain and does the magnifying itself; with the crystal
  switched off the 2D drawing's view through the lens stays on the dial.)
- **The design in relief.** The dial artwork is drawn at twice the size it
  was. Hands are bevelled metal; applied markers stand at the marker height;
  **applied metal numerals** (Numerals → applied, metal) are traced from the
  font and stand up off the dial at their own height and bevel; gem hours
  carry cut stones. Two-tone puts gold on the bezel, crown and centre links;
  a gold case is gold throughout; a gem-set bezel is a ring of stones.
- Other cases (the Vernoy cushion) keep the earlier build, in the new studio.

About 80,000 triangles in all for the NOREL; it opens in two to three
seconds on a laptop, most of which is drawing the dial artwork.
To rebuild the case model after a new STEP arrives:
`python3 tools/norel-case-glb.py <case_assembly.stp> app/norel-case-r1.glb`
(needs CadQuery's OCP), then `npm run build`.

## More options (v3.3.0)

Every step after Start has a **More** button: beside the tabs on a phone,
beside the step's name on a desktop, and as a row at the foot of a tab
("More dial options ›" with what it holds). It opens a sheet with the rest
of that part's settings, so simple mode now reaches every setting the full
editor has. On a phone the sheet rises over the panel and the watch stays in
view above it; on a wide screen (1100 px and up) it opens beside the panel,
the steps stay where they are and the watch gives up the room. **Done**, or
Escape, closes it. The sheet is in Arabic and reads right to left like the
rest of simple mode, and everything on it is a 44 pt target.

- **Case:** the crown stone's colour (Vernoy), keeping to the factory
  drawing, the shadow round the dial on the photograph, and lining up a case
  photograph added in the full editor.
- **Dial:** four more finishes (brushed, sandblasted, metallic, circular
  brushed), doming, satin, the ray count and the dial's own size; every
  guilloché setting (cell, groove spacing and angle, stamped look, waves,
  twist, grid angle, facets); the stone slab's size, turn and cut, a new cut
  at a tap, and its light and shine controls; the minute track's size,
  thickness, five-minute marks, raised print and break at the lettering;
  and the parts a dial can add, each with its own switch: **chapter ring**,
  **hour track**, **dial zones** (add, remove and set each zone: size, step
  height, colour, finish, its own engine turning and its edge), **engraved
  borders** (add, remove and set each band), **crosshair** and **sub-dial**.
- **Markers:** the numeral layout (Persian numerals, which hours, size and
  distance over the full range, spacing, upright or along the radius,
  following the curve, slant for the drawn sets), all six ways of making
  them with their materials, metal, height and bevel, the engraving's depth,
  bevel, shadow, highlight and light, and the markers' count, distance, cone
  shape and room for numerals.
- **Hands:** each hand on its own (Hour, Minute, Seconds): all 25 shapes as
  pictures, the length (to the minute track, the numerals, a share of the
  minute hand, or millimetres), width, tail, centre boss, the Breguet ring's
  size, place and wall, stem, taper and waist, metal, finish and lume; and
  whether the hands move together, what they share, the minute hand's
  slimness and matching the set to one hand.
- **Text:** all nine ways of making the logo (printed, raised print,
  engraved, embossed, debossed, applied metal, nameplate, embossed cartouche,
  reserved cartouche) with every one of their settings, the cartouche or
  plate's shape, size, border and inside, all seventeen pieces of artwork,
  letter spacing, curving the logo and the line colour.
- **Date:** the date window's size, position, magnifier (1.5× too), frame
  colour and the date shown; the day window's width in degrees, bevel or
  frame width, name size, frame colour and the day shown.
- **Finish:** the preview time, the front, side or back view, and the light.

The sheet is drawn from the full editor's own field definitions (`SCHEMA`),
so the ranges, the choices and the controls a choice brings (a clous pattern's
grid angle, a zone's bead size, a nameplate's metal) are the full editor's.
`G_MORE` in `index.html` lists which of them each step offers and in what
order, with plain names for each and their Arabic in `GWORD`. A value set on
a sheet is written through the same rules as the full editor's panel
(`fieldInput`, `fieldChosen`, and `runAct` for buttons such as Add a zone),
so a numeral system keeps a face it has and a supplied hand takes its drawn
length in either mode. Two settings show only where they act: slant for the
drawn numeral sets, and letter spacing for a typed logo. On a sheet a linked
set follows whichever hand is changed.

In the full editor the minute track, date window and day window panels now
show the controls a choice brings straight away (the frame width once the day
window has a frame, the edge light once the track is raised print); before,
they followed the design the page opened with.

Existing designs draw exactly as before (checked byte for byte on every
preset and reference design), and nothing on the sheets uses an SVG filter.

## Simple mode in Arabic (v3.1.0)

Simple mode can be used in Arabic. The switch is on the Start step
(**English · عربي**), in the ⋯ menu on a phone, and beside **Full editor** in
the top bar on a desktop; the choice is remembered on the device. Every step,
tab, chip, note, warning, toast and button is in plain Modern Standard
Arabic as it is written in the Gulf, with the words a watch buyer uses there:
ميناء، عقارب، إطار، نافذة اليوم، نافذة التاريخ، مؤشرات، and القالب for the
case and المحرك for the movement (from v3.2.0). Millimetres and
degrees keep Western digits ("3.30 ملم"), and brand and reference names
(NOREL, Pantone, Day-Date, Sellita, Blue Creations) stay as printed.

In Arabic the panel reads right to left: the step bar starts at the right, the
rows of choices start at the right and fade at their left, a slider's minus
is on the right and it fills from the right, and a switch is on with its knob
at the left. The watch itself is never mirrored. The design check's rows read
in Arabic on each step and on Finish.

**The full editor stays in English**, as do the header above the watch and
the ⋯ menu's export and version entries. The interface's Arabic is IBM Plex
Sans Arabic (SIL Open Font License), carried inside `index.html` like the rest
of the interface lettering, so it works offline under the service worker with
nothing fetched.

## Arabic on the dial

The logo text, the line under the logo and the lower text can be set in
Arabic, for example **أوتوماتيك** as the lower text. Text → Logo and Text →
Lines show a face for each, as it will print: the dial's serif or sans, or
one of five Arabic faces — **Naskh** (Noto Naskh Arabic), **Amiri**,
**Cairo**, **El Messiri** and **Tajawal**, the same faces and names as the day
and date discs, so a dial can be lettered and dated in one face. They carry
the whole Arabic alphabet (the disc faces carry only the day names) and are
embedded and written into exports. Reem Kufi is not offered: its joins broke.
In the full editor they are in Text → Advanced → Logo font and beside each
line's text.

Arabic is never set along a curved path: Safari pulls the letters apart and
runs them backwards. A curved Arabic line is set straight, joined by the
font, and bent onto its arc in thin slices, as the day name and supplied
artwork already are. Arabic is not letter-spaced. Lettering with no Arabic in
it is drawn exactly as before.

## Day disc in two languages

Date → Day window → Day names offers **Arabic**, **English**, **Arabic and
English** together (الجمعة and FRI in one window, the Arabic on the right) and
**Alternating** (the week printed twice round the disc, Arabic and English in
turn; setting the day picks which shows, and **In the window** chooses which
the drawing shows). Each language has its own face. Neither is the stock
SW240-1 disc, so the design check flags it until **Sellita confirms a
bilingual SW240-1 day disc**.

## ١١ and ١ beside the day window

Date → the figures beside the window can be moved aside, made smaller, left
off, left touching, or replaced by **markers**: a short baton at 1 and at 11
in the numerals' colour or metal, its outer end on the numerals' outer edge.
Moved or made smaller, the two change together so the dial stays balanced.

## Gems and diamond-set numerals

**Markers → Gems** puts a gem at every hour; the **Layout** chips mix them
with numerals or indices (gems at 6 & 9, numerals at 6 & 9, diamond at each
hour, all baguettes, sapphire 6 & 9, special 6), and **Each hour…** opens a
small dial where each hour is set to a numeral, index, accent index, gem,
accent gem or nothing. On the NOREL, 12 and 3 sit under the day window and
the date with its magnifier, so they are locked empty. **Same at every hour**
goes back to the ordinary numerals and indices exactly as they were.

- **Cuts:** round brilliant (one, or two or three stacked along the radius),
  baguette (one, or two side by side) and princess, bezel-set, in prongs or
  in a channel, in white, yellow or rose gold, steel or black.
- **Stones:** diamond, black diamond, blue sapphire, ruby and emerald, natural
  or lab-grown (the brief says "lab-grown"; the drawing does not change).
- **Readout:** stones, size, carats, how high the gems stand, and the room
  left under the minute hand at the SW240-1 hand height chosen (4 is
  standard). Hand undersides are estimates from Sellita's fitting heights
  until Blue Creations confirms the hands.
- **Accent gem** is a second stone for the hours set to it (the sapphire at
  6 & 9). Plain indices take a **Finish** too: colour, or a metal.
- **Diamond-set numerals** (Made by → Diamond-set, applied metal figures in a
  font) are drawn as one row of stones packed into each figure's own
  strokes. At 3.3 mm most figures are too thin to hold a stone; the Thickness
  slider and the Lalezar face show the idea (the NOREL · diamond-set
  numerals example on the Start step). It is always flagged for review: the
  maker would have to redraw the figures bold, and 4 mm sets more easily.

The Design check gains rows for the hands, the day and date windows and
magnifier, the minute track, marker spacing, the seat in the dial, the
setting and stone, and a production review for the setter. The full
editor has the same controls under **Hour by hour** and **Gems**. Gems and
their shadows are plain shapes, never SVG filters, so they show in the
photographed view on iPhone too; the 3D view raises each gem hour as a metal
boss of the setting's outline.

## Two-tone, gem-set bezel, pavé and ombré (v3.2.0)

**Two-tone and gold cases.** Case → Metal and strap offers Steel, **Steel and
yellow gold**, **Steel and rose gold** (Rolesor-style: gold bezel, crown and
bracelet centre links on a steel case), and whole cases in yellow, rose or
white gold. On the drawn case those parts are painted in gold. On the NOREL
photograph (Blue Creations' steel render) the gold is laid onto the picture
itself: each pixel's brightness is looked up on a measured gold ramp, so the
flutes, the brushed links and the crown keep their own light and shade. The
parts that take it are measured off that photograph (`NOREL_R4.photoParts`):
the bezel from the crystal's edge to its rim (an ellipse, as the render looks
at it slightly off the axis), the crown, and the centre links 4.50 mm either
side of the axis. A photograph with no measured parts (the earlier NOREL
drawings) cannot show two-tone, so the drawn case takes over with a toast, as
it already did for a finish or a strap. Black and custom colours still show
the drawing.

**Gem-set bezel** (round cases). Under the metal: **Fluted**, **Round
stones** (round brilliants, Ø1.5–2.7, 52 at the default Ø2.10) or
**Baguettes** (60 tapered baguettes set edge to edge), in diamond, black
diamond, sapphire, ruby or emerald. The ring is the case drawing's own,
bezelOD Ø41.00 to bezelID Ø34.20, 3.40 mm wide, with 0.35 mm of polished gold
kept each side; it is made in the case's gold, or white gold on steel. On the
photograph it is drawn over the photographed bezel. The design check raises
**Gem-set bezel**: the NOREL is drawn with a fluted steel bezel, so Blue
Creations must make a gem-set one and quote it.

**Pavé dial.** Dial → Surface → Pavé: **Whole dial**, **Centre** (inside the
markers) or **Outer ring** (from the markers' inner edge to the minute
track), with the stone (Ø0.8–1.3, 1.00 default) and the gold of the dial
under it. Stones run in a row along each edge and a packed field between, a
bead of gold in each gap, and are kept clear of the day and date windows, the
hands' centre, a sub-dial, the lettering, and printed numerals and indices
(applied figures and gem markers stand on the stones). The design check
raises **Pavé dial** with the count and carats: the NOREL blank is brass
Ø32.50 × 0.40 mm, while a pavé dial is normally 18k gold about 0.8–1.0 mm
thick, so Blue Creations must confirm the stack height first.

**Ombré.** Dial → Surface → Ombré (0–100 %) deepens any colour toward the
edge, over a sunburst or any other surface, under the printing. Picking
**Green ombré** or **Black ombré** from the watch classics turns it on at
70 %. In the full editor these are Case → Two-tone, Gem-set bezel, Bezel
stones and size, and Dial base → Ombré, Pavé and its stone, size and metal.

Nothing is drawn with an SVG filter: shadows are offset copies, highlights
are gradients, and a few stones are drawn once and repeated with `<use>`.
Designs that use none of this draw exactly as before (checked byte for byte
on every preset and reference design).

## Stone and mother-of-pearl dials

In simple mode, **Dial → Surface → Stone** lists the sixteen stones
(malachite, tiger's eye, meteorite, aventurine, lapis lazuli, turquoise,
rhodonite, sodalite, carnelian, jade, onyx, snowflake obsidian, opal, white
onyx, pietersite, red jasper), each drawn from its photographed slab.
**Mother of pearl** uses the photographed nacre slab. Where the printing
(numerals, printed markers, logo and text, minute track) would not read on
the dial, a warning says so at the top of the Dial, Markers and Text steps
and a button sets it to white, or to navy on a pale dial. This works for every dial colour, not only
stones: the test is the contrast against the dial colour, or for a stone
against the slab's measured average tone. (The full editor's **mop** finish
is a pearl sheen over the dial colour, not the nacre slab; simple mode shows
it as **Pearl sheen**.)

## Numeral and lettering colours

A dial is usually printed in one ink, so simple mode has one **Printing
colour**. It is offered wherever something printed is edited (Dial → Minute
track, Markers → Made by, Text → Colour), and choosing it there recolours
everything printed in it: the logo and lettering, printed numerals or
markers, and the minute track. Applied metal is not printing and keeps its
metal. **Set the … separately** gives one part a colour of its own; **Use the
printing colour** puts it back. The row shows seven inks (white, silver,
navy, royal blue, black, gold, red) and the last colours you used; **More
colours** opens the 28 print colours a dial printer is asked for and
**Pantone**, the full library searchable by code (for example 289 C). The
**Any** swatch still takes any colour. The day and date discs and their
lettering are parts of the movement and keep their own colours.

## The NOREL case photograph

The R4 (3 Nov) case is shown in Blue Creations' own render of the watch on
its bracelet (`app/case-norel-r4-real.jpg`): their case, fluted bezel, crown
and bracelet, with the designed dial drawn into the opening (Ø31.40 = 65.14%
of the picture's width, centred). The supplier's dial, text and colour labels
were removed from the picture first.

The photograph is the steel case on its bracelet. Gold (two-tone or a whole
gold case) and a gem-set bezel are laid onto it (see "Two-tone, gem-set bezel,
pavé and ombré"). Black or a custom colour, a finish or the strap while
**Show as a photograph** is on switches to the drawn case, which shows them,
and a message says so.

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
first and reopens. With nothing to install, a tap on the label says which
version and build you have.

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
