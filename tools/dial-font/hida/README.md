# Hida Breguet Study

Naoya Hida & Co.'s Breguet figures, lifted from the maker's own photographs
of its Type 1 and Type 8A dials (the photographs are not kept here). Each
figure comes from the picture where it is whole and sharpest:

- 1, 2, 3, 4: the Type 1B macro;
- 5: the Type 1C close-up, where the thin stroke from its flag to its bowl shows;
- 6, 7: a front-on photograph of a Type 1;
- 8: the Type 1B header photograph, straightened (fitted to the hour positions);
- 0: the Type 8A press photograph (Monochrome Watches, April 2026). On every
  Type 1 the small seconds hides the foot of the 10. The 8A's hour hand
  crosses the 0's right stroke for about 3 px; that stretch is carried
  straight across, as the Type 1 photographs show it unbroken there.

The 9 is the 6 turned upside down (`derive` in `face.json`): Type 1 has no
9, and the Type 8A shows Hida's 9 is cut that way.

Figures are engraved and filled on the dials, so the lifts include the cut
walls; each keeps its own weight as photographed. Outlines are smoothed
through a distance field (`sigma` 5.5, `ring_sigma` 10) and fitted with
curves (`spline` 3). Built with `../build.py outlines.json ../lange/lange.woff2
hida.woff2 face.json`.
