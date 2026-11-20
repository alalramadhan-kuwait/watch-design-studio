# FPJ figures, retraced from the watch

The figures are lifted again from a photograph of the F.P. Journe dial the
studio was asked to follow (the photograph itself is not kept here):

1. `extract.py`: the dial's centre and radius are fitted to its edge
   (`circle.txt`: 562.3, 840.0, r 400.6 px); each figure is found as a cream
   shape, resampled upright along its own radius at ten times the photograph's
   resolution, and outlined half way between the brown and the cream, so the
   edge falls between pixels. The 1 and 2 come from the 12 (upright at the top,
   no turning), the 0 from the 10, the rest from their own hours. The dial has
   no 3 (the power reserve stands there), so the 3 is the studio's own
   (`base-for-3.woff2`). The lifted outlines are in `outlines.json`.
2. `build.py outlines.json base-for-3.woff2 fpj.woff2`: each figure is brought
   to one height (700 units); its weight is kept as printed on the watch,
   except the 7 and 8, which Journe printed small beside the small seconds and
   which are thinned as they grow so their strokes match the set (stem 102,
   hairline 45); the 1, which Journe printed a little off its radius, is turned
   −2.6° and the 8 +1.8° (`turn.json`), measured with ../measure.py and judged
   with ../turns.py; the outline is smoothed lightly through a distance field
   and then along its length, keeping its corners (serif tips, bar ends), with
   spurs trimmed and nicks filled, so no wedge or step of the photograph is
   left; round and pointed edges dip 10 units past the lines.

    pip install fonttools brotli shapely contourpy scipy pillow
    python3 extract.py            # needs journe.jpg beside it
    python3 build.py outlines.json base-for-3.woff2 ../fpj.woff2
