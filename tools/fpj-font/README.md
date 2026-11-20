# FPJ figures

The FPJ numeral font was traced from a photograph, and the trace came out with
its figures at different heights (the 7 at 499 units and the 8 at 549, against
700 for the 2), ragged edges, and a speck by the 7.

`rebuild.py` rebuilds the ten figures from that trace (`fpj-traced.woff2`):

1. each figure is scaled to one height, 700 units, on the baseline;
2. its outline becomes a signed distance field, smoothed (σ = 13 units), which
   takes away the trace's ragged edges without rounding the serifs away;
3. it is traced back at the level that undoes the thickening the scale-up
   gave, so a figure brought up to height keeps the weight it had;
4. specks under 2500 square units are dropped, and the outlines go back in as
   TrueType contours with the font's 96-unit right side bearing.

    pip install fonttools brotli shapely contourpy scipy pillow
    python3 rebuild.py fpj-traced.woff2 fpj.woff2 > report.json
    python3 specimen.py fpj.woff2 specimen.png

`fpj.woff2` is the font the studio carries (base64 in `index.html`, under
`BUILTIN_FONTS["FPJ"]`).
