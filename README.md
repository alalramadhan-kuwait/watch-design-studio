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
seven steps — **Case** (your watch and its case: the watches being made,
continuing the design you were on, **Start from…** a plain dial, a preset or
a saved version, then the case, its metal and its strap), **Dial** (colour, surface, minute track),
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

- **Where you are.** On a phone the panel opens with "Case · step 1 of 7"
  and a numbered bar: finished steps are gold, the current one black. Tap a
  number to jump, or the label for a list of all seven steps with what each
  still needs. On a desktop the step pills carry the same ticks and dots.
- **Short tabs.** Long steps are cut into tabs that each fit about one
  screen: Case (Watch · Metal and strap), Dial (Colour · Surface · Minute
  track), Markers (Style · Font or Shape · Made by · Size, plus Gems when
  the dial has them), Hands (Shape · Seconds), Text (Logo · Lines · Colour)
  and Date (Day window · Day lettering · Date window). The day window's
  width is Narrow, Standard or Wide (the degree slider that repeated it is
  in the full editor), and a design with another width shows it as a chip.
- **The watch is framed on the part you edit:** the case on Case and
  Finish, the whole dial for Dial, Markers, Hands and Text, the centre for
  the seconds hand, and a close-up of the day or date window on Date.
  **Whole watch** (top right of the watch) shows everything and switches
  back. Choosing a design or a case frames it again, so a 41 mm NOREL is no
  longer shown at the 36 mm Vernoy's framing.
- **The top of the Case step** (since v4.0.0; it was a Start step of its
  own) shows your watches (NOREL B6098G-A1, Time Keeper × Nivada and, since
  v4.2.0, Vernoy RD26-0172), and, after a while away, the design you were on
  with **Continue designing** (it returns to the step you were on).
  **Start from…** opens the other starting points and your saved versions.
  A first visit opens on the NOREL B6098G-A1, the watch being made. A reload
  within half an hour goes straight back to the step you were on.
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

## The Breguet figures take their thickness (v4.51.1)

The drawn Breguet set ignored "Thickness" altogether: it is drawn at 100
units and scaled to the figure, and its weight was never applied, printed,
applied or engraved. It now takes it as the Vernoy set does, in mm on the
dial (`kOf`). A widened engraved cut keeps its fill: its bevel is a bright
wall drawn round the widened figure and the fill laid over it, where before a
band as wide as the widening was drawn over a thin stroke and greyed it.
Gin's figures are 0.08 thicker, to the stroke weight of the dial it follows.
Every other saved design draws as before.

## Gin: a hand-engraved German silver dial (v4.51.0)

A new design under Designs, **Gin** (銀, silver), on the Vernoy cushion,
after a hand-engraved German silver dial from Tokyo (the picture sent): a
solid German silver dial bead-blasted to an even frost; Breguet-style
figures cut into it and filled with black lacquer, the cut walls left bright;
a separate outer ring brushed in fine circles carrying a dot at every minute,
larger at the fives, cut and filled the same; the case's own Vernoy wordmark
engraved and filled, nothing printed; slender heat-blued leaf hands on a
large boss; a crackled vintage leather strap in a light thread. Left out: the
small seconds at 9, which the Vernoy's 1062 does not drive, so every figure
stands. The chapter ring can now be brushed in circles ("circular") or
sandblasted.

## German silver, a dial engraved throughout, crackled leather (v4.50.0)

Three things a hand-engraved dial (as Naoya Hida & Co. make them in Tokyo)
is built from, and the studio did not have:

- **German silver** under "Dial made of": nickel silver, the metal such dials
  are cut from; frosted (sandblasted) it is a soft, even grey (`GERMAN_SILVER`).
  The maker's sheet reads "Solid German silver dial, …".
- **Engrave the track and the name the same way** (Markers › Made by, once the
  figures are engraved): the minute track, the indices, the name and the lines
  under it cut as the figures are and filled with the same lacquer, so
  nothing on the dial is printed (`engraveAll`). The name is cut shallow
  (0.035 mm), as fine dial lettering is, so the cut's walls do not swallow a
  thin wordmark.
- **Vintage crackle leather** on the Strap step, on the F77's photograph and
  the Vernoy's: dark leather whose finish has crazed into plates longer across
  the strap than along it, the cracks broken into short wandering runs of
  varying width with the pale grain showing in them, and loose flecks where
  the finish has flaked (`crackleTex`); light stitching. The Vernoy's strap
  step offers its own leather or this one, as pictures.

## A stainless steel dial (v4.49.0)

"Dial made of" offers stainless steel beside brass and the three golds. Like
a gold blank, under a finish that leaves the metal bare it turns the dial
steel's own grey (`blankColour`); enamel, lacquer, stone and mother of pearl
cover it; back to brass puts the colour before back. The maker's sheet reads
"Stainless steel dial, …". ("Brushed steel" under Finish is a look, the
grain and light of brushed steel, on whatever the dial is made of.)

## Changing the figures keeps the hour plots (v4.48.3)

Markers › Style: choosing Arabic-Indic, Western or Roman figures turned the
indices off every time, so on Noir 77 the square plots went with the
Western figures. Now that happens only when figures replace batons or a
clean dial; going from one set of figures to another changes only the
figures, and the plots, batons or dots between them stay.

## The dial shows what it is made of (v4.48.2)

Choosing a solid gold blank under "Dial made of" only told the maker's
sheet; the dial kept its colour. Now a gold blank under a finish that leaves
the metal bare (brushed, sunburst, sandblasted, guilloché and the rest)
turns the dial that gold, and any zone in the dial's colour with it;
enamel, lacquer, stone and mother of pearl cover the metal and keep their
colour. Going back to brass, or to another gold, while the dial is still
the gold that was set puts the colour before back (`dialBlankSet`, in simple
mode and the full editor). The colour can still be changed under Colour.

## Larger step icons (v4.48.1)

On a phone the eight step icons sat in a row beside the step's name, each
about 30 px. They have a row of their own under it now, full width: each
button 42 px tall and nearly half again as wide, the icon 26 px (was 19).

## A Strap step (v4.48.0)

The strap or bracelet has a step of its own, the seventh of eight, between the
calendar and Finish (so the steps before it keep their places): whether it is
shown; what it is, as pictures of the strap itself on the case's photograph
(rubber, Velcro fabric, alligator, the steel bracelet) where the photograph can
show it, else the band as the maker's sheet names it; its colour and
stitching; and how it closes (band style and maker, buckle, its colour and its
logo), which had been in Finish's "For the maker". A case that comes on its
own bracelet says so. The watch is framed whole on this step so the strap
can be seen, and a tap on the strap opens it. Case's tab is "Metal" now.

## More options on the tabs, and choices as pictures (v4.47.0)

What the More options sheet held is now on each step's own tabs, open, where
the rest of that step is: a team studied each step and placed every section.
Each section of `G_MORE` names its tab (`tab:`) and is drawn there by
`inlineMore` with the same controls, gates and folds the sheet had; a change
made there carries as one made in the sheet did (linked hands follow). The
More pill is offered only for a section without a tab, which is now none.

- **Case › Metal and strap**: the crown stone colour (where the case has one and
  the photograph is off), the photograph's shadow round the dial, and lining
  up a photograph added in the full editor. "Keep to the factory drawing" is
  the full editor's.
- **Dial**: surface, guilloché and stone on Surface; the minute track, chapter
  ring and hour track on Track; two new tabs, **Zones** (dial zones, engraved
  borders) and **Extras** (crosshair, sub-dial, power reserve, each offered
  only where the case's movement drives it, as before).
- **Markers**: **Direction** is a row of pictures on Size: Upright, Along the
  radius, Lower figures upright (v4.46.0's switch, no longer behind two other
  choices), Follow the curve (not offered for drawn sets or diamond-set
  figures, which stay straight); Line up by under it; which hours, spacing and
  slant below. How the numerals are made and engraving on Made by; index
  markers on Style.
- **Hands**: two new tabs, **Length** and **Details**, each with the hour /
  minute choice and whether the hands move together; every shape, the finish
  and "hands together" on Shape.
- **Text**: a new **Made by** tab for how the logo is made and its plate or
  cartouche; spacing on Logo. The logo artwork and the lines' making were on
  their tabs already.
- **Calendar** and **Finish**: their sections on their own pages.

Choices shown as pictures use `optTiles`: each card is the design with that
one choice made, the part it changes drawn small (without the material
raster) and kept until something it shows changes.

## Figures turned round the dial, reading upright (v4.46.0)

Radial figures (Numeral layout › Direction › Radial, with "Follow the curve"
off) can now have **"Lower figures read upright"**: the figures below 3 and 9
turn the other way, their tops towards the centre, so every figure reads
upright as it goes round the dial, as on the black Arabic-numeral Royal Oak:
the 12 and the 6 upright, the 9 and the 3 on their sides, the rest tilted along
the circle. Each is still placed by its own outer edge. Off, radial figures
draw as before (`numerals.flipLower`, in `place`).

Noir 77 uses it, with its figures larger (3.3 mm) and heavier, their outer
edges just inside the square plots, and the lines measured off the picture
turned upright (the photograph was taken with the watch turned about 37°).

## Noir 77, a steel bracelet for the F77, a rounded line face (v4.45.0)

A new design under Designs, **Noir 77**: the Time Keeper × Nivada F77 after
the black Arabic-numeral Royal Oak (the picture sent). The steel octagon on a
steel bracelet, a deep black dial, bold rounded figures in white raised print
(Reverso Study), white minute ticks with a square lume plot every five
minutes, lumed sword hands and an arrow-tipped seconds hand, Nivada's own
script under 12, "Time Keeper" in a rounded face with AUTOMATIC beneath it
above 6, and SWISS MADE either side of 6. Left out: the date at 3, which the
Soprod P024 does not drive, so the 3 is a figure like the others; the
maker's name and model are kept off (the design's research note names them
to avoid, and the design check holds it to that).

What the app did not have, added for it:
- **A steel bracelet on the F77's photograph** (Case › Metal and strap ›
  Strap › Steel bracelet). The strap's measured outline (`photoStrap`,
  `f77.strap`) takes rows of links in place of the rubber: a narrow polished
  centre link set half a link off the brushed outer links, dark joins, each
  link's lit edge bright and its far edge in shade, the brushing along the
  bracelet, lit as the photograph's strap is (`braceletTex`). The maker's
  sheet names a bracelet on a folding clasp. Nivada makes the F77 on an
  integrated bracelet; the edition's sheet names the rubber strap, and the
  app says to confirm the bracelet with Nivada.
- **A rounded Latin face for the lines**, Comfortaa SemiBold (SIL Open Font
  License 1.1, Latin subset, embedded), for a model line set the way a sports
  dial sets one. Its tile in the font picker shows the words typed.

## Thinner figures (v4.44.1)

"Thickness" now goes down to −0.30 mm (it stopped at −0.10), in simple mode
and the full editor, for printed and applied figures alike: the figure's own
shape is taken in by half that all round (the mask of v4.40.2). Past −0.15 a
note says that the thinnest parts of a figure (a hairline, a serif, the hook
of a 1) can thin to nothing, so each figure is checked in the preview.

## A real sandblasted finish (v4.44.0)

"Sandblasted" drew as plain matte: its grain was measured in picture pixels,
so on a dial of any size it faded to nothing (a brightness spread of 6 where a
photograph of an F.P. Journe sandblasted, silver-plated 18k gold dial shows
12 to 27). It now carries a frost: grains of about 0.035 mm, sized in mm so
they are the same at any picture size, each its own shade and its own tilt,
the brightest glinting (`FROST_*`, `M.frost`). Being metal, it keeps more of
the metal's colour in its reflection (metallic share 0.60, was 0.30). The
plain drawing (cards, the simple view) has a matching fine speckle, and simple
mode offers "Sandblasted" in Dial › Surface. With a solid gold blank (v4.43.0)
this is the frosted gold dial of the Journe: the maker's sheet reads "Solid
18k yellow gold dial, sandblasted, …". No saved design used the finish, so
every one draws as it did.

## Or Damier as made (v4.43.1)

Or Damier's numerals are printed, in a raised (double) print of blue ink, not
cut and filled with enamel; and its hands follow the watch: open rings with
broad spear tips beyond them, painted a dark satin grey (#38322F) rather than
blackened steel, on slightly broader stems. A painted hand's tip had the
polished-metal ridge a steel tip has, drawn as a bright stripe down a broad
spear; on paint it is now a soft sheen (steel and the other metals as before).

## A solid gold dial (v4.43.0)

What the dial is made of was fixed by the case (the drawing set's brass blank)
and could not be changed. It is a choice now, at the top of Dial › Surface
(and "Dial made of" in the full editor): the case's brass, or a blank of solid
18k yellow, rose or white gold (`dial.blank`, read by `dialBlank`). It is a
material, not a colour: the dial keeps the colour set under Colour. The
maker's sheet leads with it ("Solid 18k yellow gold dial, vertical brush,
PANTONE 134 C"), and the dial blank line of the specification, the case
note, the drawing guides, the pavé note and the engraving check all name it.
Or Damier's dial is 18k yellow gold, as the watch it follows is.

## Or Damier, and the Vernoy photograph in gold (v4.42.0)

A new design under Designs, **Or Damier**, after the gold basket-weave Vernoy
(the picture sent): the yellow gold cushion on a black alligator, a gold dial
brushed outside with a checker (damier) guilloché centre edged in beads, two
bead rings with the blue minute dots between them, blue enamel Roman numerals
cut into the dial and set radially (the Vernoy Radial Roman, a little
widened), VERNOY bent along a raised arched plaque, open-ring hands in
blackened steel and SWISS • MADE in the dot row at 6. No complication: the
picture has none, and the case's movement 1062 shows hours and minutes only,
so there is no seconds hand. Its colours were matched to the picture by
measuring the brushed ring and the guilloché in both (studio light).

**The Vernoy's photograph takes gold and any strap colour.** It used to show
steel on its brown strap only, and a gold Vernoy switched to the flat drawn
case. The case, lugs and crown are now found on the photograph by where they
are (`builtinTint` in the case record, in mm from the dial centre) and by
being steel-grey, and a whole gold case is laid onto them by their light, as
on the F77; the strap takes another colour by its own light, so its scales and
grain stay. The ruby cabochon and the white ground are left alone. Two-tone or
another finish still switches to the drawing. The presets on the Vernoy with
a strap colour of their own now show it on the photograph.

**Fine pomme rings.** A pomme was never drawn smaller than 0.17 of its hand's
length (its wall 0.030), so a long minute hand's open ring stayed 2 mm or more
whatever was set. Once a pomme or a wall is set on a hand (`fineRing`) the
floors drop to 0.07 and 0.012 for it and the hands linked to it; every design
saved before draws as it did.

## Tap the watch to edit what you tapped (v4.41.0)

In simple mode a tap on the watch opens what edits that part: its step, the
tab, and for a part kept in More options that sheet open on its section with
the step's other sections folded. Numerals open Markers › Font, indices
Markers › Shape, gems Markers › Gems; the logo or the lines under it Text
(whichever the tap is nearer); a hand Hands, the seconds hand its own tab;
the day and date windows Calendar; the minute track Dial › Minute track; a
chapter ring, an hour track, the sub-dial, a power reserve or engraved
borders Dial's More options; the plain dial Dial, on the tab already open;
the case round the opening Case. Parts drawn as part of the dial (the
tracks, rings, the sub-dial, the date window) are found by where the tap is,
in millimetres about the dial centre (`gPickTarget`). The click a mouse sends
on letting go of a pan or a pinch is no longer taken as a tap, in either
mode.

## The fonts as a grid (v4.40.3)

Markers › Font laid every face in one row to scroll sideways, three at a
time on a phone. They are a grid now, three across, all in view as the panel
scrolls down; a long name takes two lines rather than being cut.

## Thickness for every figure, thinner too (v4.40.2)

"Thickness" under Markers › Size was hidden for applied figures, and they
drew at their font's own weight whatever it held (only diamond-set ones took
it). It now works on every figure, applied metal included, both ways: thicker
grows each layer of a piece (top face, side walls) by its own colour; thinner
takes the figure's own shape in all round. Thinner used to be an outline in
the dial's colour, which showed as a flat edge on any textured dial; it is a
mask now, exact on every dial, finish and technique, engraving included. The
path-drawn Vernoy figures take the same width on the dial as type does. A
value a design carried unseen on applied figures is cleared once on opening,
so every saved design looks as it did.

## Pilot Study: the 0, 2 and 7 traced whole (v4.40.1)

In IWC's photograph the hands stand at 10:10 and lie over the 0, the 2 and
the 7, and those three had been rebuilt or repaired; the 2's top, under the
minute hand, did not come back clean. They are now traced whole from a review
photograph where the hands stand at 10:15 and all three are clear, brought to
the set's weight (that photograph draws strokes heavier by 0.03 of the height,
measured on the 5 in both). No figure of the face is rebuilt.

## Pilot Study (v4.40.0)

A new numeral face, **Pilot Study**: the IWC Big Pilot's Type A figures,
applied lume light on black, lifted from the maker's own straight-on
photograph of the Big Pilot's Watch 43 (all ten from the dial: the 0 from the
10). Three figures were touched by the hands and freed one by one: the 0 the
hour hand meets rebuilt from its symmetric half, the seconds hand taken off
the 7's bar along its path, and the minute hand's shadow on the 2 brightened
back. The lifting tool gained these for the faces that follow (`box`,
`unline`, `boost`, `keep_px`, and `open_per` in the build). Every figure
measured square; weight as printed. `tools/dial-font/pilot/`.

## Reverso Study (v4.39.0)

A new numeral face, **Reverso Study**: the Jaeger-LeCoultre Reverso's Art Deco
figures, bold with flared stroke ends, lifted from the maker's own
straight-on photograph of the Reverso Classic Monoface (8000 px, about 210 px
a figure). No sub-dial, so all ten figures are the watch's own; every figure
measured square; weight as printed. `tools/dial-font/reverso/`.

## Lange 1815 Study (v4.38.0)

A new numeral face, **Lange 1815 Study**: the A. Lange & Söhne 1815's
high-contrast serif figures with ball terminals, lifted from the maker's own
straight-on photograph (about 310 px a figure). The small seconds cuts the 6
in half on every 1815, so the 6 is the 9 turned upside down, as the face pairs
them; the build tool now draws such figures from another (`derive`). Every
figure measured square; weight as printed. `tools/dial-font/lange/`.

## Max Bill Study, and tools to lift any dial's figures (v4.37.0)

A new numeral face, **Max Bill Study**: the Junghans Max Bill's Bauhaus
figures, lifted from a photograph of the watch. The photograph was taken at an
angle, so the dial is first straightened through the printed minute numbers
round its edge (they sit on one circle at known angles), then each figure is
lifted upright, the dust on the crystal filtered out, the 0 the hour hand
partly covers rebuilt from its symmetric half, and the outlines fitted with
smooth curves between their corners, so there are no wedges. One height,
weight as printed. The tools are general, for the faces that follow:
`tools/dial-font/` (`dial.py` straightens a dial, `lift.py` lifts its figures,
`build.py` makes the font from a short settings file per watch).

## FPJ, the numerals new designs start in (v4.36.6)

A new design (Start from… › Plain dial) starts with the FPJ figures as its
numerals, so they are what appears when numerals are turned on. A design
switched to Western figures in a face that cannot draw them turns to FPJ too.
Designs already made keep their own numerals: the Time Keeper × Nivada keeps
its Arabic figures in Naskh. The default is `DEFAULT_NUMERAL_FONT`.

## FPJ figures retraced from the watch (v4.36.5)

The figures are lifted again from a clear photograph of the Journe dial, each
upright along its own radius (the dial's centre fitted to its edge) and
outlined between pixels at ten times the photograph's resolution, so the
shapes are Journe's: the slim 1 with its small flag and foot, the 2's swash
base, the open 4, the fine ball terminals. All at one height; each keeps the
weight printed on the watch, except the 7 and 8, which Journe printed small
beside his small seconds and which are thinned as they grow so their strokes
match. Outlines smoothed without wedges, corners kept. The dial has no 3, so
the 3 stays the studio's own. Tools and the lifted outlines:
`tools/fpj-font/retrace/`.

## FPJ figures seated, one by one (v4.36.4)

Each figure checked on its own, large on guides, and corrected where it was
off. Upright: the 0 by its counter and its mirror symmetry (a further 3°), the
5 by its top bar (+2.5°), the 6 by its bowl (−2°), the 7 by its bar end to
end (−2°), the 8 by its stacked counters (+1°); the 1, 3, 4 and 9 measured
square. Seated: the 2 had stood on the point of its tail with its base 85
units up, so the tail is trimmed and the base stands on the line, drawn to the
0's width; round and pointed edges now dip 10 units past the baseline and the
top line, as type does, while flat feet and bars sit on them. On the dial the
font is marked `seated`, so the figures share one baseline in their own frame
(each still centred across on its own ink): flat feet at 1.42–1.43 mm from the
circle, round bottoms at 1.46–1.47.

## FPJ figures upright (v4.36.3)

The trace had left three figures leaning, each traced off a dial where it sat
at an angle: the 0 about 10° to the left, the 2 and the 4 about 5° to the
right. They now stand upright on the baseline (the 4's stem at 91°, its bars
at 178°; the 2's base level; the 0's top over its bottom within 14 units of
700), so on a dial each figure lies exactly along its radius. The turns, and
the tools that measure them, are in `tools/fpj-font/`.

## The FPJ font rebuilt (v4.36.2)

The fault was in the font, so the font is fixed: its ten figures are rebuilt
from the photo trace at one height (700 units; the 7 had been 499 and the 8
549), with the trace's ragged edges smoothed away and each figure keeping its
weight as it is brought up to height. The tool, the original trace and the
method are in `tools/fpj-font/`. Measured on Chocolat 77 at 2.95 mm, every
figure is 2.95 to 2.96 mm straight from the font; the drawing-time evening of
4.36.1 stays for any other font marked `even`, and FPJ no longer needs it.

## Even figures (v4.36.1)

The FPJ numerals were traced at uneven heights: at one size the 7 came out
2.10 mm tall and the 8 2.32 mm against 2.95 mm for the 12, so radial figures
looked mixed in size and did not meet the same inner and outer circle. A font
can now be marked `even`, and its figures are then each drawn at the height of
the tallest; FPJ is. Measured on Chocolat 77, every figure is 2.93 to 2.95 mm
and centred on its circle within 0.04 mm. Other fonts are unchanged.

## The logo comes with the case (v4.36.0)

Each case carries its brand's own logo: the Nivada shield and script on the
Time Keeper × Nivada F77, the NOREL logo on the NOREL cases, the traced
Vernoy wordmark on the Vernoy. On those cases the Logo tab offers only that
brand's marks, then how the logo is made, its metal or colour, size and
position; typing a name, uploading another logo or picking another brand's
mark is not offered. A design that has anything else, opened or saved before,
is put back on the brand's logo, its size kept as it was read and the line
under it stepped down to clear it, and the check **Logo and the case** says so.
The Vernoy wordmark now takes the dial's ink (it came painted near-black).
A case added later comes with its own brand's logo in its record.

## Red gold, the photo tent, leather that reads as leather (v4.35.0)

Colours are now matched by measurement, not by eye: the reference and the
render are sampled at the same places and the colour is corrected until the
render reads what the reference does.

- **Red gold (5N)** joins the case metals: the warmer gold of a polished 5N
  case, its tones measured off a photograph of one. Rose gold is unchanged.
- **Photo tent** (Dial › More › View › Light): the dial lit as a maker
  photographs one, looking back at a dark tent instead of a bright sky, so a
  dark dial keeps its colour instead of taking a grey veil of reflection.
- **Alligator leather** redrawn from a photograph of a strap: one broad
  scale down the middle and narrower ones to the edges, meeting in thin
  creases with a lit rim; waxy mottling; padded edges that darken as they
  roll over; a soft sheen; and saddle stitching as a twisted cord that dives
  into the leather every 3 mm.
- Chocolat 77 measured against the reference: case #DCB394 (reference
  #DFB493), dial #5C3B26, centre #5A3926, strap #93401B, all as on the
  reference photograph.

## Designs tab; complications only with a movement that drives them (v4.34.0)

- **Designs**, the first tab of the Case step, holds every design in one
  place: the watches being made, what you saved (newest first, with
  **Save this design** beside it), the studio's Concepts, and Start from…
  for plain dials and studies. The case itself is chosen on the **Case** tab.
- A complication is designed in only with a movement that drives it and is
  known to fit the case (see `CLAUDE.md`). The Power reserve section and the
  small seconds hand are offered only where the case's movement has them;
  elsewhere the section says why. No case in the studio has such a movement
  yet, so neither is offered.
- The concepts follow the rule: Chocolat 77 keeps the Journe palette,
  numerals, hands and strap and leaves out the power reserve and small
  seconds, with a slim cream centre seconds as the P024 has; Basalt Nuit and
  Nachtschrift lose their date windows, the P024 in the F77 having no date.

## Power reserve, small seconds hand, lance hands, alligator strap (v4.33.0)

For dials laid out like a chronometer's, as in **Chocolat 77**:

- Dial › More › **Power reserve** (`power`): a sector sunk into the dial with
  its scale (56 · 42 · 28 · 14 · 0 by default) and a small hand. Its pivot is
  set as an hour and a distance from the centre; the scale runs between two
  bearings, and the figures turn to stay readable.
- The sub-dial can carry a **small seconds hand** with a ring counterweight,
  and a track marked every second (`sub.ticks` "60") rather than every five.
- A **Lance** hand: long, slender, tapering from a round boss.
- Case › Strap › **Alligator leather**: columns of domed scales, widest down
  the middle and narrowing to the edges, each column on its own rhythm, with
  separate stitches; the maker's sheet says leather.
- A full gold F77 is tinted on its photograph, the crown included.
- Two new checks say when the movement cannot drive what the dial shows: the
  Soprod P024 has no power-reserve indication and keeps its seconds at the
  centre, so both need another movement or a module (ask Nivada).

## Concepts (v4.32.0)

The designs made in the studio are kept in the repository, in `concepts/`
(each its design file and a picture, listed in `concepts/index.json`), and
shown on the start screen under **Concepts**, so each opens in one tap and
offline: Piste 77 (Noir Rosé, Météorite), Sommet 77, and the F77 challenge's
Porcelaine 77, Basalt Nuit, Lazuli, Nachtschrift and Huit Carrés. To add one,
put its file and picture in `concepts/` and a line in the index.
The Time Keeper × Nivada maker files (dial artwork, print layers, numerals,
maker's sheet) are kept in `deliverables/timekeeper-nivada/`.

## Outer chapter ring (rehaut) (v4.31.0, named so in v4.31.1)

Dial › Minute track › **Outer chapter ring (rehaut)** (`rehaut`), on a case
shown on its photograph: the ring between the dial and the bezel, which on the
F77 is polished steel, is printed in a colour (midnight, black, graphite, navy,
white or any) with a minute track of its own: **dots** or **ticks** at every
minute, the fives larger, in white, orange, red or sand. It is shaded as a
sloping ring is, runs from the opening out to the bezel (or to `rehaut.outerD`
for a slimmer ring), and the specification lists it as "Outer chapter ring
(rehaut)". Off unless chosen. The **Chapter ring** under Dial › More is the
band on the dial itself.

## Square plots and a Velcro strap (v4.30.0)

- **Square** index shape (main and accent): an applied square, side twice the
  width, its four chamfered edges each lit by where they face, with a square of
  lume set in it, as a sports dial's plots at 3, 6 and 9.
- **Strap › Fabric (Velcro)** in Case › Metal and strap, on a case with a
  measured strap on its photograph (the F77): the photograph's strap becomes a
  rib knit (columns 0.9 mm wide of twisted bumps 0.45 mm long, each a little
  different, in mm so the same at any size) in the strap colour, with a
  **Stitching** seam down each edge, a twisted cord in orange, white, red, sand
  or none. The maker's sheet's band type follows ("fabric Velcro").

## Timing flange (v4.29.0)

Dial › Minute track, for a sports watch's flange:

- **Ticks start from** the track's centre (as before), its **inner edge** or its
  **outer edge** (`minute.tickAlign`), so a scale can hang from the flange's
  edge with the numbers outside it.
- **Minute tick length** (`minute.tickLen`); unset, the length is as it was.
- **Fifths between the minutes** (`minute.fifths`): four fine ticks in each
  minute, a timing scale, with their own length.
- **Minute marks on the dial**: long marks at every minute between the hours,
  printed on the dial inside the flange (the hour track's new *Minute marks*
  style, `hour.style "minuteMarks"`), with their length, place and width.

## Granular dial (v4.28.0)

Dial › Surface › **Granular**: the fine, hard grain of a granular sports dial.
Each grain (0.07 mm unless set, 0.04–0.30) is distinctly lighter or darker than
its neighbours, the light ones glinting in the light, and each tilts the
surface a touch so the grain takes the light as it turns. It is sized in
millimetres, so the grain is the same in a phone preview and a 3000 px export;
**Grain size** and **Grain strength** set it. Tuned against the reference
photograph of a granular dial at the same pixels per millimetre (grain
contrast within a few levels). The bright grains lift how light the dial reads,
so a granular dial's paint is a little darker than it looks. The sheet calls it
"granular, coarse grain". "Grained" is unchanged.

## Painted hands (v4.27.0)

Hands › Shape › Metal and Hands › Seconds › Seconds hand metal now end in
**Painted**: no metal, a lacquered colour of the hand's own, chosen from
orange, red, yellow, blue, green, white and black or any colour ("+ Any").
A painted hand has its own material (its edges a shade of its colour, a soft
gloss rather than a metal's mirror), so orange reads as orange, not copper; its
lume still shows. The hour and minute hands are painted together; the seconds
on its own, and choosing a metal for the others leaves a painted seconds as it
is. It is stored as an empty metal with `paint: true`, so opening the file
again keeps it. The maker's sheet says "PANTONE 158 C painted, gloss".
Colour hands from older files, without the mark, draw as they always did.

## Track numbers (v4.26.0)

Dial › Minute track › **Track numbers**: *5 to 60* every five minutes, or *1 to
12*, round the track (`minute.nums`), as a sports watch's flange carries them.
They read along the edge, turned so the lower half stays upright, leave the gap
at 6 clear, and have their own height (0.80 mm unless set), radius and colour.
The specification says so, the dial artwork carries them in the track's ink,
and a check keeps them 0.30 mm inside the opening.

## The review's last open points (v4.25.0)

- **Date and the movement**: a date window on the F77's Soprod P024 without
  date is flagged (it would show the movement); a date needs the P024's date
  version, and Nivada to say where its disc shows.
- **Lines of writing apart**: the logo, the line under it and the line above 6
  must clear each other by 0.15 mm.
- **Lettering clear of the opening**: the text either side of 6 keeps 0.30 mm
  inside the case opening.
- Moving the logo now carries **the line under it** (GRENCHEN) by the same
  amount; Text › Logo can set it apart (`text.line2Follow`).
- The Text step says why the **seconds hand** is out of the picture there.

## Dial artwork for the maker (v4.24.0)

**Dial artwork (PDF)**, in Export and in Finish, is what a dial maker quotes,
prints and sets from, A4 landscape:

1. **Dial plan, 4:1**: the dial faint underneath; the blank and the visible
   edge, the minute track's rails, the circles the numerals and indexes are
   centred on with a cross at each, a mark at the height of each text line, the
   date opening (and outside its frame or bevel), all dimensioned from the
   centre in a table beside it.
2. **One page per ink**: the separation at 1:1, to print from, and at 4:1, to
   check by, with crop marks, the centre cross, the ink's hex and nearest
   Pantone, and the parts printed in it. A separation is the vector dial with
   only that ink left in it, in black (matched within ΔE 4, as the printing
   model shades an ink a touch; see-through lips and the offset second pass of
   raised print left out; stones, windows and applied parts never in it), laid
   in at 2400 dpi because the PDF cannot carry the dial's fonts.
3. **Stone setting, 4:1**, when there are stones: each stone's outline in place,
   labelled with its hour, and a table of cut, stone, size, setting, radius,
   angle, turn and height.

**Print layers — SVG** (Export › More formats) gives the same separations as
vector, one named layer per ink in its own colour, at 1:1.

The numerals PDF stays the font alone, as asked.

## Colour as made (v4.23.0)

The shaded render lights the dial with a studio lamp (ambient 0.30, the key at
52°), which lights a flat dial at 0.85 of full strength: a typed #F2ECDF came
out #DAD5C9, and the challenge's designers typed lighter colours to make the
render look right, colours that would have been made too light.

- Dial › Colour now shows the colour as typed beside the colour **on the
  render**, measured the way the review measured it (the dial alone, the median
  of a clear ring), with the difference in lightness.
- **Show the colour as made** (`render.asMade`) raises the light by that 0.85,
  so a flat dial renders at its paint colour (#F2ECDF renders #F2ECDF in enamel,
  within 3 levels in matte). The maker's sheet always gives the colour typed.
  Off unless chosen, so saved designs look as they did.
- Gloss, lacquer and enamel now carry a **clear coat** that shows: a soft
  reflection of the studio's softbox across the dial on the light's side
  (strength 0.05, 0.07 and 0.03 since v4.25.1, halved after it read as a grey
  swath on black lacquer). On a pale dial they no longer look matte.
  This changes how those three finishes render.

## Export, and the F77's bezel (v4.22.0)

- **Image size** is this device's choice and is kept (`wds:exportPx`), across
  designs and reloads. Without a choice a phone exports at 2400 px (was 1600,
  soft for 0.08 mm lines) and a computer at 3000. Sizes: Small 1200, Medium
  2000, Large 2400, Largest 3000; the Export sheet says the size in use.
- **File names** come from the design's name: accents kept as their letters
  ("Huit Carrés" → huit-carres), Arabic kept as Arabic, and the photograph or
  front view saved as `name.png` rather than `name-template.png`.
- **The drawn F77's bezel**: Case › Metal and strap › Drawn bezel. *As Nivada's
  drawing* (the near-round ring, as asked in v4.7.0, and the default) or *As
  the prototype*: eight-sided, as the prototype and the photograph are,
  measured off the photograph (17.75 mm to each flat, corners cut from 7.60,
  a 0.70 polished chamfer whose eight faces each take the light). It only
  changes the drawn case; the photograph is the prototype either way.

## Research board (v4.21.0)

Finish › **Research** keeps the research behind a design in its file
(`sheet.research`): references, each with a research id (as in the challenge's
`sources.json`), a title, a link (auction, archive, article) and what it gives
the design, and a list of **names to keep off the watch**. The references are
listed in the specification ("Reference R03 · Patek Philippe Ref. 2526, 1953:
enamel dial, applied gold figures · phillips.com/…"). The design check adds
**Names kept off the watch**: it looks for each name in the dial's writing (logo,
second line, lower line, the text either side of 6) and in the names of the
styles chosen (hands, numerals' face, dial pattern), and says where it found one.

The Director's review also suggested renaming presets that carry other houses'
names ("Royal Oak" hands, the "FPJ" face). Those were made by name on request,
so they are unchanged; the avoid-list is the guardrail.

## The maker's hand heights (v4.20.0)

Sellita publishes the SW240-1's hand fitting heights, so on the NOREL the gem
and raised-figure checks give the room under the hands. Nivada has not given
the Soprod P024's, so on the F77 those checks could only say "unknown". Now, on
any movement without Sellita's table, Markers › Gems (and the Height of applied
numerals) offers **I have the maker's hand heights**: switched on, the hour,
minute and seconds pipe heights above the dial seat can be set or typed
(`handSet.stack`, starting at Sellita's standard 1.00 / 1.40 / 1.80 mm). The
design check then works the clearance from them and says so ("from the hand
heights entered for the Soprod P024"), the specification lists them as entered
from the maker's data, and an SW240 movement keeps using Sellita's table.

## Finding a setting (v4.19.0)

The steps list (tap "step 3 of 7 ▾") has a **Find a setting** field. It
searches every control on every step's own pages and in every More sheet, as
the design in hand has them, in English or Arabic (with or without hamza and
tashkeel). A result opens its step, its tab or its More section, scrolls to the
control and lights it up. Alongside it, from the F77 challenge's findability
findings:

- The More sheet's sections open the way they were left, after a reload too
  (kept on the device as `wds.moreFolds`).
- A choice row of more than six wraps on a phone instead of scrolling, so the
  dial's ninth finish (Stone) is in sight.
- In a colour row **+ Any** comes first; once a colour of your own is set it
  shows that colour and its hex, selected.
- Labels say what they move: Numerals from centre, Indices from centre, Minute
  track diameter, Hour track diameter. Indices from centre is now beside the
  index size in Markers › Size.
- The Hands More sheet says at the top whether the hands move together and what
  a change carries to the other hands.
- The panel fades at its foot while there is more below, so a control cut off
  by the edge reads as "scroll on".

## Big date (v4.18.0)

In the Date step, **Windows → Big date** splits the opening into two windows
side by side, the tens on one disc and the units on another, with a **centre
bar** between them (0.8 mm unless set, at most 30% of the opening). With an
applied frame the bar is frame metal; with a bevelled cut each window is cut
on its own and the bar is dial. Dates 1 to 9 show a **0** in the tens window
or leave it **blank**. `date.w` stays the width of the whole opening, so every
fit check still measures it; turning the big date on widens a narrow window
to two of at least 2 mm and turning it off gives the single width back
(`date.wSingle`). The design check adds **Big date movement**: a big date
needs a movement with a big-date module, and the single-ring size and position
rows no longer judge it. Under the digit height, the step now gives the
opening's size and, with a frame or bevel, the size from outside it; the
specification lists both. Designs without a big date draw exactly as before.

## Carré stones and the invisible setting (v4.17.0)

A seventh gem card, **Carré**: a square step cut (twelve step facets round a
table, as on a baguette) instead of the princess's brilliant pinwheel. It sits
lower (0.62 × its side above the seat) and weighs about 0.017 ct at 1.30 mm.
Princess and carré can now be **Invisible**-set: the stones touch edge to edge
with no metal rim or bezel showing, so an on-point square reads as pure stone,
as in the 1956 reference. The maker's sheet names the cut ("carré") and the
setting ("invisible-set"). Designs that use neither draw exactly as before.

## Each hour its own size and turn (v4.16.0)

In "Each hour…", a picked hour carrying an index or a stone gets **Turn this
hour** (toward the centre, upright, on point at 45° to its radius, across)
and **Size of this hour** (×0.6–1.6), stored in `markers.tune[i]` as `{s, rot}`.
A stone keeps its facets lit for the angle it now lies at (`gemOnDial`'s
`rot`); an index turns about its own centre. The maker's sheet lists the
hours that differ ("12: 125% size; 1, 2, 4, 5, 7, 8, 10, 11: on point (45°)")
on page 1 and in the specification. Unset, every hour is as before, so saved
designs draw exactly as they did. This is what the F77 challenge's jewellery
designer could not do: square stones on point and a distinct 12.

## Honeycomb guilloché, brushed-steel chapter ring (v4.15.0)

**Nid d'abeille (honeycomb)** joins the guilloché patterns: hexagonal pyramids
on a hexagonal lattice, the cell the distance across the flats, with the lay
angle and facet contrast clous de Paris has (`guilFieldRaw` case "nid"). For
the dial and any dial zone. The chapter ring can be **brushed steel**, drawn
as the dial's own brushed steel.

## Minute track settings (v4.14.0)

A railroad's **Track width** is its width rail to rail (`trackWMM`; its old
"thickness" is half of it). New, each defaulting to the track as it always
was: **Rail weight** and **Tick weight** (`railW`, `tickW`, 0 = automatic),
**Five-minute marks** run inward, plain or flared (`fiveStyle`), and a **Gap
at 6** in degrees for lettering (`gap6`), the rails stopping at the last
minute mark either side. On the Dial step's Track tab and in the full editor.
A design check, "Minute track in view", warns when the track's outer edge runs
under the rehaut.

## Lume colour, and lume in every applied marker (v4.13.0)

One lume colour for the whole watch (`lume.color`: green-white, old radium,
vintage cream, white, ice blue, jade), on the Hands and Markers steps when
lume is on and in the full editor; every hand, marker and plot paints with it
(`lumeC`). Lume fill is offered for every applied marker shape, not only the
F77's plots: an insert down a baton, one in each bar of a double, a smaller
copy of a dagger, triangle or diamond, a disc in a dot (`indexLume`). The
maker's sheet specification has a Lume row. Unset, every part keeps the
green-white it always had, so saved designs draw as before.

## The maker's sheet with its data (v4.12.0)

Page 1 keeps the maker's approved layout, corrected:
- **Stones:** one row per stone definition with cut, size, count, hours,
  setting and carats ("4 × baguette diamond 2.8 × 1mm at 12, 3, 6, 9,
  bezel-set in white gold, ≈0.09 ct" and "8 × princess …"), where it printed
  "12 × baguette diamond Ø1.5mm" for every gem dial.
- **Indexes:** pieces counted, a double index as two.
- **Hands:** lengths as drawn to 0.1 mm and widths at their widest; rounded to
  the half millimetre, 8.3 and 13.2 read 8.5 and 13.

**Page 2, the specification** (`sheetSpec`, `buildSpecSVG`): one row per part
(case, dial, each dial zone, chapter ring, minute and hour tracks, numerals,
indexes, stones, logo, each text line, date and day windows, the three hands,
strap, notes) with its colour as hex and the nearest Pantone, and its size and
place in millimetres on the dial (figure and letter heights, radii, track
widths, window sizes). The preview shows both pages; the PDF has both.

## Sizes as heights on the dial (v4.11.4)

The numerals' **Figure height** is the height of the figures' ink (the dial
sets the font so the digits are 0.72 of the stored size, within 0.6–2.4 of
the font's own proportion: `numFigureK`); a size of 4.0 is 2.90 mm figures.
The text lines' **Letter height** is the height of their capitals, or of the
writing itself when it is Arabic (`lineCapK`). Both in simple mode, the More
sheets and the full editor, as virtual fields (`heightMM`, `line2CapMM`,
`footCapMM`, `splitCapMM`); the design keeps its font sizes, so saved designs
draw exactly as before. The figure height agrees with the numerals artwork's
outline measurement to 0.001 mm. The logo's size stays the height of the whole
mark.

## Typed values in simple mode (v4.11.3)

The figure beside every slider in simple mode, on the steps and in the More
sheets, is a button: tap it and it becomes a number field (the decimal keypad
on a phone) holding the value as stored, a percentage as a percentage. Enter
or leaving the field applies it as one change and one undo step, kept to the
slider's range but not to its step, so 0.35 mm is reachable where the steps
are 0.1. A comma counts as a decimal point; Escape leaves the value as it was.
In the F77 challenge one exact value took up to 84 taps of − and +.

## Strap colour on the real photograph (v4.11.2)

On a case whose strap is measured on its photograph (`K.photoStrap`, the
Time Keeper × Nivada F77), choosing another strap colour keeps the photograph
and re-colours the strap by its own light (`strapTintPixels`, done once per
colour and cached with the gold tints in `tintedPhoto`). It used to switch to
the drawn case, whose F77 had the wrong bezel, so all five designers in the
F77 challenge kept the black strap. The maker's sheet takes the colour from
the same picture and no longer tints its own copy. Cases without a measured
strap (Vernoy) behave as before.

## Improvement plan, phase 1: first fixes (v4.11.1)

From the F77 design challenge's reproduced bugs:
- **"Each hour…"** starts from the markers on the dial. When every hour had
  the same marker, the per-hour list still held what the project opened with,
  so switching brought back old Arabic numerals in place of batons.
- **Window notes** ("12 and 3 sit under the day and date windows", "the day
  and date discs run under the dial") show only on a watch with windows, and
  the checks name the case's own maker (`makerOf`; `TK_NIVADA.maker` is
  Nivada) instead of Blue Creations everywhere.
- **"To the minute track"** puts the tip on the track's inner edge for its
  style (the inner rail of a railroad, the inner ends of ticks, the inner edge
  of dots). A "stop short" of 0.82 saved with the F77 project used to carry
  over and leave the hand 2.4 mm short. The landmark itself is unchanged, so
  saved designs draw as before.
- **Linked hands** are linked by shape only by default, with the seconds
  hand left out. A change to the seconds hand never reaches the hour and
  minute hands, and when a linked change does reach another hand the screen
  says so.

## Date window: bevelled cut and digit height (v4.11.0)

On the Date step: **Window edge** (Bevelled cut, Applied frame, Thin line) and
**Digit height** in mm, also in the full editor. A bevelled cut is drawn as the
day window's is, a polished chamfer on each side lit by the scene's light, so a
frameless window reads as cut through the dial and not as a patch laid on it.
A digit height is the height of the figures' ink: the digits are centred by
their ink and made smaller if they would come within 0.3 mm of the window's
sides. Without them the window draws exactly as before (the edge stays the
frame width's thin line or applied frame, the digits 0.78 of the window); the
slider shows the height the window gives until one is set. The maker's sheet
names the digit height and the edge. Found in the F77 design challenge: Basalt
Nuit's frameless window was a flat patch with "28" touching its sides, and
Nachtschrift's digits could not reach the 2.2 mm its designer specified.

## Hand width in real millimetres (v4.10.5)

Every hand shape multiplies its base width by its own factor (`STYLE_W`:
dauphine ×3, leaf ×2.6, sword ×2.5, baton ×1.9…), and the hands' Width slider
showed the base width. In the F77 design challenge two designers set the
widths they wanted and got hands 1.7–1.8× too wide (a baton at "1.4" is
2.66 mm). The slider, in the guided "All hand settings" sheet and the full
editor, now shows and sets the width the hand is drawn at, at its widest
point, in steps of 0.01 mm (`widthMM`, a virtual field read and written by
`get`/`set`; `handDrawnK` has the measured factor, which for the tapered
leaf, feuille and obelisk blades is below `STYLE_W`). The design still keeps
the base width, so every saved design draws exactly as before.

## Step icons (v4.10.4)

Simple mode's seven steps are shown by a picture each instead of a number:
the case with its lugs, the dial's brushed face, the hour markers, the hands,
lettering (Aa), the calendar and a finishing flag. They replace the numbers
in the phone's step bar, the desktop step tabs and the list of all steps
(STEP_ICON, line drawings in the text colour). A step done is still gold,
the one open dark, and one with something to look at still has the orange
dot; the step's name is the button's label for VoiceOver and its tooltip.

## The artwork's figures are the dial's own (v4.10.2)

Checked pixel by pixel: every built-in font, all twelve hour figures, at
spacing 1, 12 and -10 and with a Thickness stroke, drawn as the dial draws
them (SVG text) and as the artwork does (outlines) at 300 px type. No pixel
differs by more than 2 px of anti-aliasing (about 0.03 mm on a real figure).
To get there:

- **Spacing in Arabic and Persian figures.** Chrome sets no letter-spacing in
  Arabic script, its digits included; WebKit does. So ١١ had a gap on an
  iPhone that it did not have on a computer. The dial now spaces those
  figures glyph by glyph (`dx`), which both draw alike, and the artwork uses
  the same gap. Western and Roman figures keep `letter-spacing`.
- **Kerning.** `tools/font-outlines.py` now writes each font's pair kerning
  (`k`); only Vernoy Radial Roman has any (IV, IX, VI, XI).
- **What the dial drew with.** `buildSVG(st, {numInfo:{}})` reports the font
  size, each figure's scale (١ and ١١ can be set smaller beside a day window),
  the spacing and the Thickness stroke; the artwork and the maker's sheet's
  numerals panel (now vector, from the outlines) use them.

## Numerals artwork for the maker (v4.10.0, font only since v4.10.3)

A second PDF beside the maker's sheet: *Numerals (PDF)* on the Finish step
(الأرقام PDF), *Numerals artwork (PDF)* in the Export sheet and in the
maker's sheet preview. One A4 landscape page, black on white, like the
maker's own artwork sheets: the font and nothing else. The ten digits in
two rows of five and 10, 11 and 12 under them, spread across the page so
each reads on its own, as large as the page allows, with only the font's
name, brand, design number and date at the top. No sizes and no heights:
those are in the specification and the maker's sheet. The glyphs are the
font's outlines untouched (no Thickness stroke, no shrinking); 10, 11 and 12
take the dial's spacing between their two digits. The page is vector, so
the maker can cut from it.

The outlines come from `app/font-outlines.json`, written from the built-in
fonts by `tools/font-outlines.py` (fontTools); run it again after adding a
built-in font. The service worker keeps the file for offline use. The two
drawn sets and uploaded fonts have no outlines there, so the studio says so
rather than sending a picture. The figures are sized as the dial draws them
(the digits' ink is 0.72 of the numeral size), and the maker's sheet now
gives that true height ("2.9mm high") in place of the size setting.

## The maker's sheet points at every part (v4.9.1)

The sheet's dial panel moved up into the room under the 200% render and
grew to the width of the hands and numerals panels below it. The dial is
drawn 42 mm across with one label per part: the applied logo, the script,
each line grouped by how it is made (printed, engraved and filled, tone on
tone, gloss on matte, brushed across, UV ink, with its colour where the
colour is part of the order), the numerals or indexes, the day and date
windows and the dial. Each label has a leader to its part, or one to each
part when several share a technique. The old dial slot is now a *Numerals*
panel: the twelve figures in their own font and colour, the font's name,
how they are made, their height and thickness. The specification list
names the font and gives one line for each technique
("Engraved, filled black: TIME KEEPER").

## Raised applied numerals (v4.9.0)

Simple mode's Markers › Made by tab offers a *Height* for applied numerals:
Standard 0.20 mm, High 0.35 mm, Extra high 0.50 mm (Arabic: عادي، مرتفع،
مرتفع جداً). It sets `numerals.height`, the piece height the drawing, the 3D
view and the full editor's *Piece height* slider (now up to 0.70 mm) already
use, so the walls and shadow grow with it. A note under the choice gives the
room the minute hand leaves over the figures on the SW240 (`numClear`), and
turns to a warning under 0.20 mm. The maker's sheet adds "raised X mm thick"
to the numerals line when the piece is taller than 0.25 mm.

## The maker's sheet (v4.8.0)

One A3 landscape PDF in the maker's own layout: Nivada Grenchen's design
sheet 103277_3, as redrawn in Claude Design and approved by the owner. It
is how the owner sends a design back to the factory.

- **Where.** Simple mode's Finish step has a *Maker's sheet (PDF)* tile
  (ورقة المصنع) and, under the name, a *For the maker* section, folded to
  one line until it is opened. The Export sheet has a *Maker's sheet (PDF)*
  button, the atelier bar a *Maker's sheet* button, and the full editor a
  *For the maker › Maker's sheet* component with the same fields. Each opens
  a preview of the page; *Make the PDF* then hands it to the usual Ready
  sheet: *Share…* (on an iPhone, the share sheet: Mail, WhatsApp, Save to
  Files) and *Save to device*.
- **What the owner fills in** (kept in the design as `sheet`, so it travels
  with saved versions and syncing): the maker's design number, the date
  (today if empty), the designer, and anything to change from the case's
  own: the brand on the footer, the movement, the band and its maker, the
  buckle, the hand references (W36017; the seconds hand "find existing"
  when empty), the finish of each part, the caseback's ring text, and notes.
  An empty field takes the case's: NIVADA GRENCHEN and "Automatic Soprod
  P024 (without Date)" on the Time Keeper × Nivada, "NOREL / Blue Creations"
  and the Sellita SW240-1 on the NOREL cases. The values stay in English,
  as the sheet does.
- **Versions.** Version A is the design on screen. Up to three saved
  versions stand beside it as A1 to A3 (picked on the preview; a label can
  be renamed), and one saved version can be named the maker's last, to
  compare A with. A lists every part; each later version lists only what
  differs from A. A part that differs only in colour is marked
  *(New color)* in red, with a swatch and its nearest Pantone code (Cool
  Gray 5 C); any other difference *(changed)*; a part that was not there
  *(New)*. The owner's own marks and notes on A's lines are kept
  (`sheet.rows`): the Time Keeper × Nivada design marks its dial
  *(changed)* and its script *(same as before)*, as the approved page does.
- **The lines** are written from the design in the maker's words: "Case:
  Stainless steel, vertical brush, polished bevels", "Shiny rose gold
  applied Arabic-Indic numerals, 12 pcs", "Applied logo rose gold (shiny &
  sandblasted)", "Black printed: GRENCHEN, TIME KEEPER, SWISS MADE",
  "Hands: Shiny rose gold, pencil (W36017)".
- **The page.** The versions at 1:1 and Version A at 200%, from the case
  photograph with the dial drawn in, on white (the photograph's studio
  ground is keyed out from its edges); where the photograph cannot show a
  version, the drawn case. A strap colour the photograph does not have is
  its own strap re-coloured, inside the strap's region measured off the
  photograph (`photoStrap`), so the grey fabric A1 stays on the photograph
  (its strap within ΔE 1 of Cool Gray 5 C, the case untouched). Below: the
  owner's two drawings of the F77, front and side (`app/tk-f77-*.png`);
  for a case without drawings, an outline drawn from its figures with the
  maker's four dimensions and callouts, and no side view; the caseback, its
  ring set glyph by glyph with the edition's XX/XX called out; a buckle for
  each kind of strap on the sheet; the hands at 1:1 with their references
  and lengths; the dial alone (no hands, no production guides) with
  callouts to the applied logo, the raised script, the applied indexes and
  the printing; the movement; the footer with the date, design number,
  designer and the brand.
- **How it is made.** The page is one SVG in millimetres (`buildSheetSVG`),
  which is both the preview and, through jsPDF 2.5.2 and svg2pdf.js 2.2.4,
  the PDF: text in the PDF's own Helvetica (not embedded), lines and shapes
  as vectors, the renders as JPEG at 280 dpi or more at their printed size.
  Words Helvetica cannot draw, Arabic above all, are drawn by the browser
  and placed as pictures, and are put in the PDF's keywords so it can still
  be searched. The two libraries (`vendor/`, MIT, licences beside them) are
  loaded the first time a sheet is made and are kept by the service worker,
  so it works offline. The file is named for the maker:
  `NIVADA-GRENCHEN_103277_4_2026-11-17.pdf`.
- **Size and time** (desktop Chromium, from a cold start): the Time Keeper ×
  Nivada with A1 about 0.6 MB, the preview about 2 s, the PDF a further
  0.25 s.

Every preset and file in `designs/` draws exactly as in 4.7.1 (buildSVG
and buildTemplate compared byte for byte, with the fonts loaded). The two
changes to shared code only add options: `buildSVG(…, {guides:false})`
leaves the dial's production guides out, and `svgToPng`'s fifth argument
can ask for another backing colour or the canvas itself.

## The F77 to Nivada's drawings and sheet (v4.7.0)

Nivada Grenchen's design sheet 103277_3 (16 July 2026) and its front and
side drawings replace the estimates the Time Keeper × Nivada was built on.

- **The figures.** 38.00 across the case at 3 and 9 (not the published
  37), 46.20 lug to lug, 22.80 across the lug blocks, 14.30 between them,
  12.20 high over the domed crystal, the Ø28.00 dial opening (27.50
  before), a Ø6.00 coin-edge crown, eight Ø1.50 screws, the Soprod P024
  automatic without date, a black flat rubber strap by Delugs. Glass, dial
  blank (now Ø29.00), movement holder and the bezel and middle heights stay
  estimates; the case's note in `index.html` says which is which. The Case
  card reads 38 mm.
- **The drawn case** (photograph off) is now Nivada's front drawing rather
  than the octagon read off the render: a near-round bezel ring (38.00
  across at 3 and 9, 37.10 from 12 to 6) with a polished chamfer round its
  edge, brushed upright, and a polished bevel to the crystal at Ø30.26;
  eight hex-socket screws on R17.06, two either side of 12 and of 6 at
  23.8° and two either side of 3 and of 9 at 22.2°; straight flat-topped
  lug blocks; flanks running from the lug blocks to meet the bezel
  tangentially, 21° from upright, with a polished strip down their outer
  edge and the lug tops and shoulders brushed upright; the crown with its
  collar and no guards. The drawing is not to scale (its dimension lines
  disagree by up to 15 %), so the written figures are used as written and
  the rest is measured at the scale its round parts agree on (17.40 px/mm).
- **The photograph** is unchanged and still lines up: its opening's place
  in the picture is what was measured, so the same 609.8 px is now 28.00
  mm, and the dial fills it exactly. The drawn case and the photograph
  agree on the opening, the 38 across, the flanks' angle and the screws to
  within half a millimetre; they differ where the render and the sheet
  differ: the render's bezel is twelve-sided, and its lug blocks are wider
  and shorter than the sheet's.
- **Saved designs** on this case, laid out for the 27.50 opening, are
  refitted to 28.00 when opened (every radial figure × 1.018, as changing
  case does), once.
- **The reference design** (`designs/timekeeper-nivada.json`, the sheet's
  Version A) is refitted the same way, with the hands at the sheet's
  lengths: hour and minute W36017, 8.5 and 12.0 mm; seconds 13.0 mm.

Every other preset and file in `designs/` draws exactly as in 4.6.0
(buildSVG and buildTemplate compared byte for byte, on every other case).

## How the lines are made: engraved, gloss, brushed, UV (v4.6.0)

From the owner, on the Time Keeper × Nivada: "Is there an option for the
lines to be engraved? And check if there is another technique that hides
them so they only show at certain angles."

- **Made by, for each line.** Text → Lines has a **Made by** row under the
  line under the logo (GRENCHEN), the line above 6 (TIME KEEPER) and the
  words either side of 6 (SWISS MADE), each set on its own. The full
  editor has the same under Text → **Lines made by**, and More options
  under **How the lines are made**. The choices:
  - **Printed**, as before and the default. Every older design draws
    exactly as it did.
  - **Raised print**: a second pass of ink, the logo's raised print.
  - **Engraved, filled**: cut into the dial and filled with the line
    colour. The wall on the light's side sits dark in the shadow of the
    lip, the far wall catches the light.
  - **Tone on tone**: cut and left open. The cut is the dial's own colour,
    so the letters are seen only by the light on their walls: faint with
    the light high or overhead, clearer as it drops and turns.
  - **Gloss on matte**: clear lacquer on the dial. It shows only where it
    throws the light back at you, brightest with the light from the 12
    side, gone with it from the 6 side.
  - **Brushed across**: on a brushed or brushed steel dial the letters are
    brushed at right angles to the dial (vertical grain, horizontal in the
    letters). Brushed metal is brightest with the light across its grain,
    so the letters are bright with the light from 12 or 6, dark with it
    from 3 or 9, and all but vanish at 45° between. On a dial that is not
    brushed they are shown tone on tone, and the step says so.
  - **UV ink**: invisible in daylight. **Show under UV** (in the step when
    a line uses it, and in More options) darkens the watch to the violet
    of a UV lamp and the ink glows blue-white. In the dial maker's artwork
    (the dial-only export) it is drawn in its own violet so it can be seen.
- **Light angle.** With any of the light-dependent ones chosen, the step
  shows a **Light angle** slider: the scene's own light (render.az, the
  same as View → Light from), to turn the light round and watch the
  lettering come and go. It changes the picture, not the design.
- **The minute track and printed batons.** The minute track's Made by
  (Dial → More options, or the full editor) adds engraved and filled,
  tone on tone and gloss on matte to printed and raised print; printed
  batons, dots, diamonds, triangles, daggers and doubles (applied off, no
  metal) get the same four under Markers → More options → Index markers.
  Beads, applied and metal markers stay as they are.
- **The design check.** Engraved lettering is cut about 0.05 mm deep: fine
  in the 0.40 mm brass dial, flagged under 0.35 mm. Tone on tone and gloss
  are flagged as possibly hard to read; UV ink as needing the supplier to
  confirm the ink; brushed across on a dial that is not brushed as shown
  engraved instead.
- **How it is drawn.** Each line is defined once and laid down again as
  offset copies, cut down by masks, lit by the scene's light direction and
  height. No SVG filter is used, because WebKit drops filters in the
  photograph view.

Every preset and file in `designs/` draws exactly as in 4.5.0 (buildSVG
and buildTemplate compared byte for byte, on every case).

## Nivada F77 hour markers (v4.5.0)

From the owner: "Add Nivada F77 indices also."

- **An F77 marker.** Markers → Shape has **Nivada F77** (نيفادا F77) next
  to Double. Chosen there it puts the markers where they sit on the F77 37
  mm, as shares of the dial opening, so they fit whichever case: the outer
  end at 0.948 of the radius and the inner end at 0.668, 0.28 of the radius
  long (3.85 mm on the F77) and 0.078 wide (1.07 mm), applied, in steel. A
  metal already chosen (gold, black) is kept.
- **The shape.** A polished bar with a pitched top: two long facets meeting
  at a ridge down the middle and a hip at each end, so one facet catches
  the light and the other falls dark, and each end shows a chevron. At 12,
  3, 6 and 9 the marker is a pair of slimmer bars side by side (1.56 mm
  across in all), as on the F77. A window covers its hour as it does any
  marker's. Printed, the bars are flat.
- **Lume.** The F77's markers carry no lume in the bar. Nivada's black MK1
  has a small lume plot beyond each marker's outer end; the owner's salmon
  dial has none, so the plots are off. **Lume plots** (Markers → Made by,
  or the full editor) turns them on, in the F77 hands' lume.
- **The F77 dial layout.** Markers → Layout has **F77 dial**: the F77
  markers at every hour a window leaves free, the minute track as the F77's
  ring of fine dots on the markers' outer ends (0.95 of the radius,
  0.22 mm dots, no larger fives), and the F77 hands.
- **3D.** Each bar stands up with its pitched top: walls to a little under
  half the marker height, then the two facets to the ridge, hipped at the
  ends. The lume plots stand as lume. The 3D view also no longer raises an
  index under a calendar window, which it did before for indices set the
  same at every hour.
- **Sources.** The owner's photograph (positions, lengths, widths, the
  pairs, the minute dots), at the same 12.4 px a millimetre as the F77
  hands; Nivada Grenchen's front render of the F77 SST Black MK1 (the
  proportions, the pairs at all four quarters, the lume plots); and
  Watchreport's macro of the blue F77 (the pitched top and the hips). The
  measurements are written out beside `F77_IX` in `index.html`.

Every existing index style, in colour and in each metal, applied and
printed, 12 or 60 of them, the same at every hour or set hour by hour, and
every preset and file in `designs/` draw exactly as in 4.4.0 (compared byte
for byte). The Time Keeper × Nivada design is unchanged.

## Nivada F77 hands (v4.4.0)

From the owner, with a photograph of a Nivada Grenchen F77 (salmon
basket-weave dial, date at 3): "Add this F77 hand also."

- **An F77 set.** Hands → Shape has **Nivada F77** (نيفادا F77) next to
  Royal Oak. Like Royal Oak and Day-date it sets all three hands at once, at
  the lengths and widths measured on the owner's photograph of the F77 37 mm,
  as shares of the dial opening: the minute hand to 0.87 of the radius, about
  0.9 mm wide; the hour hand to 0.59, about 1.0 mm wide; each with a short
  tail of 0.18 through the centre. The seconds hand is the F77's own: a fine
  steel needle to 0.88 of the radius with a small framed lume plot just
  inside the markers (0.585 to 0.68) and a flat counterweight bar reaching
  0.27 behind the centre.
- **The shape.** Straight bars with parallel sides and square ends, built
  as a U: two polished rails with a channel down the middle that runs the
  whole length and is open at the tip and at the end of the tail. The lume
  is white, as in the photograph, set into the channel (widened there to
  half the hand) from the same distance out on both hands to just short of
  the tip; past it the empty channel shows dark. The collets are the F77's: a
  wide one under the hour hand and a flat seconds cap with the pivot showing.
- **Lume and 3D.** The set turns the lume on. In the 3D view the channel is a
  groove below the rails and the lume sits in it; the seconds plot's lume is
  set into its frame. Lume off leaves the channel empty.
- **Metal.** The F77's hands are steel, so the set leaves the metal alone:
  steel stays steel, and gold, blued or black hands keep their colour.
- **Elsewhere.** The seconds tab has a **Nivada F77** card (the needle, plot
  and counterweight on their own). The full editor's Style list and the More
  options Shape cards have **Nivada F77** and **Nivada F77 seconds**; chosen
  there they change the shape only.
- **The Time Keeper × Nivada keeps its hands.** Nothing changes on a saved
  design or a preset until the F77 set is chosen.
- **Sources.** The owner's photograph (lengths, widths, where the lume lies),
  scaled by the 27.50 mm opening of the Time Keeper × Nivada case; Nivada
  Grenchen's own front render of the F77 SST Black MK1 (how the hands are
  built: the open channel, the tails, the seconds tip beyond the plot, the
  collets); and Watchreport's and Fratello's hands-on photographs of the blue
  F77. The measurements are written out beside `FACET["f77"]` in
  `index.html`.

Every existing hand style, with and without lume, and every preset and file
in `designs/` draw exactly as in 4.3.0 (compared byte for byte).

## Royal Oak hands (v4.3.0)

From the owner: "Add Royal Oak hands as one of the options."

- **A Royal Oak set.** Hands → Shape has **Royal Oak** (رويال أوك) next to
  Day-date. Like Day-date it sets all three hands at once, at the lengths and
  widths measured on the Royal Oak Selfwinding 41 mm (15510ST), as shares of
  the dial opening: the minute hand to 0.875 of the radius (the inner edge of
  the minute track), 1.26 mm wide; the hour hand to 0.57 (just inside the
  markers), 1.35 mm wide; neither with a tail. The seconds hand is the
  Royal Oak's own: a fine needle to 0.92 of the radius, with a long flat
  counterweight paddle with an open slot, reaching 0.40 of the radius behind
  the centre.
- **The shape.** Straight bars with parallel sides, a flat polished table
  between two bevels, square tips with chamfered corners, and a narrow neck
  with a 45° shoulder where each hand meets its collet. The collets are the
  Royal Oak's: a wide one under the hour hand and a flat seconds cap with the
  pivot showing.
- **Lume let in, not laid on.** The set turns the lume on, and on these hands
  it is a channel cut into the table: a dark wall round it, the edge toward
  the light in the wall's shadow. In the 3D view the channel is cut through
  the metal and the lume sits below it, and the seconds slot is open. Lume
  off leaves the polished table whole. The seconds hand never carries lume.
- **Metal.** Steel hands become white gold, as on the steel watch; hands
  already in gold, blued or black steel keep their metal. Every metal chip
  still works afterwards.
- **Elsewhere.** The seconds tab has a **Royal Oak** card (the needle and
  paddle on their own). The full editor's Style list and the More options
  Shape cards have **Royal Oak** and **Royal Oak seconds**; chosen there they
  change the shape only, as Day-date does.
- **Sources.** Audemars Piguet's product picture of the 15510ST (a straight-on
  render, used for the outline, widths and lengths) and Monochrome Watches'
  photographs of the 15500ST (used for the seconds counterweight, which the
  render hides under the minute hand). The measurements are written out
  beside `FACET["royal-oak"]` in `index.html`.

Every existing hand style, with and without lume, and every preset and file
in `designs/` draw exactly as in 4.2.0 (compared byte for byte).

## The Vernoy among your watches, a way off the earlier NOREL drawings, and a brushed steel dial (v4.2.0)

From the owner: "There is the third case. Vernoy." And, on the Time Keeper ×
Nivada: "The dial should be brushed steel that matches the case of the
watch. If the option isn't available, add it as a surface."

- **Three watches.** **Your watches** on the Case step is now NOREL
  B6098G-A1, Time Keeper × Nivada and **Vernoy RD26-0172** ("Cushion · 36
  mm"; فيرنوي RD26-0172, "وسادية · 36 ملم"). Tapping the Vernoy opens the
  *Vernoy — RD26-0172* design (the studio's own base design) on its
  photograph; it is no longer listed again under **Start from…**. On a phone
  the three cards sit in one row with no scrolling, each a full-size target.
- **The Vernoy's photograph is a real photograph.** The cushion case has had
  a photograph built in since the start (the page's own picture, lined up
  by `BUILTIN_CASE_CAL`), but 4.0.0 only counted a photograph kept as a file,
  so the Vernoy was treated as a drawing. Every place that asks whether a
  case has a photograph now asks `hasPhoto` (a file, or the built-in
  picture): the watch and case cards show it in the photograph, picking it
  shows the photograph, and it follows the same rules as the others. It
  shows its own polished steel on the dark brown strap; any other metal, a
  brushed or satin finish, another strap colour or the strap hidden switches
  to the drawing with **Show the real photo**, which puts back steel,
  polished and "the brown strap". Its designs draw exactly as before: the
  photograph view and the drawing of every preset and every file in
  `designs/` were compared byte for byte with 4.0.0.
- **Off an earlier NOREL drawing.** A design on NOREL R3 or Concept D (cases
  that have a render but no photograph of the real watch) shows a light note
  on the watch: **Switch to the 3 Nov case (real photo)** · "An earlier
  NOREL drawing, with no photograph." (انتقل إلى قالب 3 نوفمبر (صورة
  حقيقية)). Tapping it moves the design to the R4 case of 3 Nov on its real
  photograph, rescaled as any case change is.
- **Brushed steel, a new surface.** Dial → Surface has **Brushed steel**
  (ستيل مُمشّط), with a **Direction**: **Vertical** (the default, grain from
  12 to 6 as on the Nivada), **Horizontal** or **Circular**. It is drawn
  directly rather than by the light model, which smeared grain into a sheen:
  fine, dense lines of grain that vary in length and brightness (the same
  on every render), the odd deeper line, and a broad band of light lying
  across the grain on the side toward the studio light (on a circular brush,
  the bright bar through the centre that a record shows). The dial colour is
  the metal, so blue steel or champagne brush the same way. The cards and
  the plain 2D view draw it as strokes and a gradient, without SVG filters.
  It is stored as the finish `brushedsteel` with `brushDir`; the full editor
  lists it as **Brushed steel** with its **Direction**. The older
  **Brushed** finish is left exactly as it was, because the Valmont study
  uses it.
- **The Time Keeper × Nivada dial is brushed steel**, vertical, in #DDDFE1:
  the light grey of the case's brushed steel in its photograph (about
  #D4D4D4 on the bezel), and the lightest that keeps the rose gold hands
  above the studio's 2:1 contrast check, where a grey a shade darker raised
  a warning on Hands.

## The case first, the real photographs, and the F77 drawn as itself (v4.0.0)

From the owner's iPhone: "What is step 1? The first step should be the case.
Why are all the fake ones? Where is the Nivada F77 case?"

- **Step 1 is the Case.** Simple mode has seven steps, not eight: Case, Dial,
  Markers, Hands, Text, Date, Finish ("Case · step 1 of 7"). The Start step is
  gone and what it did is at the top of the Case step's **Watch** tab: the
  English / عربي switch, **Your watches** (NOREL B6098G-A1 and Time Keeper ×
  Nivada; tapping one opens its design), **Continue designing** when you come
  back after a while to a design left on a later step, and a **Start from…**
  row that opens a plain dial, the styles and your saved versions. Under them
  are the case cards; **Metal and strap** is the second tab. **Start from…**
  is also in the More menu on a phone, and the language switch stays there
  too. A reload within half an hour still returns to the step you were on (a
  step remembered by 3.x is moved down one, since Start no longer counts).
- **Real photographs, not drawings.** The watch cards and the case cards
  show a case that has a photograph (the NOREL's real photograph, the Time
  Keeper × Nivada) in that photograph, with the dial drawn into it; only a
  case without one (the Vernoy) is a drawing. Choosing such a case shows its
  photograph. A metal, finish or strap the photograph can show keeps it on
  screen: steel on either, and gold and two-tone on the NOREL, whose parts
  are measured off its photograph (v3.2.0). One it cannot show (black, satin,
  a gold F77, another strap colour, the strap hidden) switches to the
  drawing, and a dark **Show the real photo** button sits on the watch for as
  long as it stays drawn, including for a design saved that way. Tapping it
  puts back what the photograph shows (steel, its own finish, its strap) and
  says what changed. Going back to a choice it can show also brings the
  photograph back on its own.
- **The F77 drawn as itself.** With the photograph off, the Time Keeper ×
  Nivada was a round case with screws. It is now drawn as the F77, measured
  off its photograph so the two line up when switched: the octagonal bezel
  (flats 18.40 mm from the centre top and bottom, 18.05 at the sides,
  diagonals 17.95, corners rounded 2.0), brushed with a polished chamfer
  round its edge and a polished bevel down to the crystal, eight screws two
  to each long flat, the case middle with straight flanks and curved sides
  edged in a polished bevel, short lug blocks, the crown at 3 and the rubber
  strap narrowing away from the case. Its card reads **Nivada F77 · Time
  Keeper** (نيفادا F77 · تايم كيبر). The figures and how they were measured
  are in the case's note in `index.html`. Every other case, and every
  design's photograph view, draws exactly as before.

## Nivada's logo and SWISS MADE either side of 6 (v3.6.0)

The Time Keeper × Nivada dial now carries what 3.5.0 could not show.

- **Three built-in marks** under **Text → Logo → Artwork**: *Nivada shield +
  script* (the lock-up the dial uses: the shield above the name), *Nivada
  shield* and *Nivada script*. The shield is drawn as clean vector geometry
  from the reference picture: a heater shield with a wider band along the
  top, a fine groove inside the rim and a serif W standing in a groove of its
  own, so in applied metal every edge catches the light. The script is
  Gelasio SemiBold Italic (SIL Open Font Licence), set as outlines and widened
  a tenth to the wordmark's proportions; it was the closest of about fifty
  serif italics compared against the picture, and cleaner than a trace of a
  wordmark only 25 pixels high. Like every mark, they take any technique and
  metal; the design has them in applied rose gold with GRENCHEN printed under
  them as the second line.
- **Split either side of 6** (مقسوم حول ٦), a line of its own, so a dial
  can carry it and a footer above the 6. Type the two words as one line: it
  breaks at a `|`, else at a middle dot, else at the middle space (Arabic
  puts its first word on the right). Both words are the same size and sit on
  one circle, set by **Distance from centre**, with the same clear space
  either side of the 6 (**Space either side of 6**) whatever their lengths;
  **Lean with the curve** turns each along the circle, as on the reference,
  or leaves them upright. The minute track breaks for them and a pavé dial
  keeps clear of them. It is in simple mode's **Text → Lines** and in the
  full editor's Text panel; off by default, so no other design changes.
- **The design** now uses all three, and the fine minute track is gone: the
  reference has no track and no hour ticks, only the numerals. The logo,
  GRENCHEN, TIME KEEPER and SWISS MADE are placed and sized to the reference
  to within about 0.1 mm.

Remaining differences from the reference: the reference's GRENCHEN, TIME
KEEPER and SWISS MADE are a heavier, tighter sans than the studio's line
font; its script is the brand's own drawing, which Gelasio follows closely
but not letter for letter. (Its vertically brushed dial is drawn since
v4.2.0.)

## The Time Keeper × Nivada (v3.5.0)

A second watch beside the NOREL: a Time Keeper (@timekeeperkw, Kuwait) edition
of the Nivada Grenchen F77, from the owner's front render. **Start** now has a
**Your watches** row with both, NOREL B6098G-A1 and Time Keeper × Nivada
(تايم كيبر × نيفادا in Arabic); tapping one opens its design. A first visit
still opens on the NOREL.

- **The case** (`Time Keeper × Nivada · F77`) is a round dial opening in the
  integrated octagonal case: a flat bezel with eight screws, crown at 3,
  black rubber strap, no calendar (no day or date window, no cyclops).
  Published for the F77 37 mm: 37.00 across, 45.00 lug to lug, 12.60 high,
  10 ATM, a double-domed sapphire. Everything else (the Ø27.50 opening, the
  bezel, strap, crown, glass and dial blank) is an estimate measured off the
  render, and the case's own note in `index.html` says so. Replace them with
  Nivada's figures when a drawing arrives.
- **The photograph** (`app/case-timekeeper-nivada.jpg`) is the render with the
  dial artwork taken out and the opening filled plainly; the bezel, the
  flange and the strap are the render's own. It is cropped 2:3 on the dial
  and is 1040 × 1560. The opening was found by edge-fitting the dark line
  where the dial meets the flange: centre 50.00 / 47.84 %, Ø58.63 % of the
  width. Gold and a gem-set bezel are not laid onto this photograph, so
  those switch to the drawn case (since v4.0.0 the F77's own octagon; before
  it, the round case with a plain screwed bezel and a strap).
- **The design** (`designs/timekeeper-nivada.json`) is the render's dial as
  closely as the studio draws it: a grained silver-white dial, applied
  rose-gold Arabic-Indic numerals at all twelve hours (Noto Naskh Arabic),
  slim rose-gold pencil hands, a rose-gold seconds hand with a 3.5 mm tail,
  "Nivada" typed in applied rose gold over GRENCHEN, TIME KEEPER above 6, and
  a fine dark minute track. What it cannot show: the shield logo and the
  script "Nivada" (no built-in mark for them; upload the artwork under
  **Text → Logo** to use it), SWISS and MADE split either side of 6 (there is
  one footer line, and it carries TIME KEEPER), and the dial's vertical
  brushing (the brushed finish is drawn as a sunburst-like sheen, so grained
  is used).
- The 3D view draws this case as a generic round case (with a fluted bezel and no strap); only the NOREL has its own 3D case.

Also in 3.5.0: on opening, simple mode is chosen before the page is drawn,
so a phone no longer shows the full editor for a moment first.

## The bracelet to the supplier's sheet (v3.4.1)

The 3D bracelet now follows Blue Creations' variant sheet for the
B6098G-A1 (R3, 29 Oct): **21.0 mm at the lugs narrowing to 16.0 at the
clasp**, 48.0 lug to lug, outer links **brushed along the bracelet**
("Vertical Brushed") and polished centre links ("Shiny"), closing on a
**concealed clasp** under the watch on the 6 side. The clasp's cover is
fluted lengthwise with the NOREL shield over the NOREL lettering, the
lettering **9.0 mm wide**. On the sheet that dimension's lines stop at the N
and the L, so it measures the lettering, not the cover. The cover takes the
band's 16.0 width.

What the sheet does not dimension was measured off the supplier's renders
(the V1 watch on the sheet and the R4 photograph), scaled by the 21.0 band:
- centre link: 9.1 mm wide (0.433 of the band);
- link pitch: 4.9 mm (4.65 on the sheet, 5.15 on the photograph);
- gap between rows: 0.35 mm;
- taper: 0.14 mm per mm until the band reaches 16.0;
- clasp cover proportions: 33 flutes, about 1.1 times as long as wide.

`BRACELET` in `src/relief-model.js` lists each number and its source. Link
thickness (2.7 mm) is still an estimate. The 3D view also has
`WatchRelief3D.view(position, target)`, which the screenshots use to frame
the clasp.

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

Every step has a **More** button: beside the tabs on a phone,
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

Simple mode can be used in Arabic. The switch is at the top of the Case step
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

A design names the case it is drawn for. **Case → Case** offers these, each fixed
to its factory drawings (the Time Keeper × Nivada to Nivada's sheet, with a few estimates):

| case | what it is |
|---|---|
| Vernoy cushion · RD26-0172 | the original 36 mm cushion case, with its photograph template |
| NOREL B6098G-A1 · R3 | Blue Creations' 41 mm round case as drawn: 40.0 / 34.8 fluted bezel (72 V flutes 0.41 mm deep, taken from their STEP; the photograph uses that bezel), Ø32.5 opening, President bracelet, Sellita SW240-1 day-date |
| NOREL B6098G-A1 · Concept D | the proposal: a 41.0 bezel flush with the case, 33.8 inside (3.6 mm of flutes and land a side), Ø31.4 opening, 2.5× cyclops |
| NOREL B6098G-A1 · R4 (3 Nov) | Blue Creations' assembly drawing of 2026.11.03, Concept D taken up: Ø41 bezel flush, (3.40) ring to Ø34.2, Ø33.5 glass, Ø31.4 opening, Ø32.5 dial, 11.2 mm; a Ø7.0 × 5.5 cut-circle cyclops centred 10.0 mm out (date at 9.95) |
| Time Keeper × Nivada · F77 | Nivada Grenchen F77, Time Keeper edition, from Nivada's sheet 103277_3: 38 mm, 46.2 lug to lug, 22.8 across the lug blocks, 14.3 between them, 12.2 high, Ø28.0 opening, flat bezel with eight Ø1.5 screws, Ø6.0 crown, Soprod P024 without date, rubber strap; glass, dial blank and heights estimated; no calendar |

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
