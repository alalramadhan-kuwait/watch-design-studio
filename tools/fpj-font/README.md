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
4. each figure is stood upright and seated one at a time (`TURN`, `OVER`,
   `ROUND_TOP`, `ROUND_BOTTOM`, `SEAT_ON_BASE`, `WIDTH`), judged on its own
   reference: the 0 by its counter and mirror symmetry (−13°), the 1 and 4 by
   their stems and bars (0° and +5.5°), the 2 by its base (+5°; its tail
   trimmed so the base, not the tail's point, stands on the line, and drawn
   to the 0's width), the 5 by its top bar (+2.5°), the 6 by its bowl (−2°),
   the 7 by its bar end to end (−2°), the 8 by its stacked counters (+1°),
   the 3 and 9 measured upright. Round and pointed edges dip 10 units past
   the baseline and the top line, as type does; flat feet and bars sit on
   them. `measure.py` gives every measure for a figure, `big.py` draws it
   large on guides, `turns.py` draws it at several turns side by side;
5. specks under 2500 square units are dropped, and the outlines go back in as
   TrueType contours with the font's 96-unit right side bearing.

    pip install fonttools brotli shapely contourpy scipy pillow
    python3 rebuild.py fpj-traced.woff2 fpj.woff2 > report.json
    python3 specimen.py fpj.woff2 specimen.png
    python3 guides.py fpj.woff2 guides.png 0123456789   # each figure on square guides
    python3 segs.py fpj.woff2 024                        # its long straight edges and their angles
    python3 measure.py fpj.woff2 2                       # every measure of one figure
    python3 big.py fpj.woff2 big.png 01234               # figures large on baseline, top line and dip band
    python3 turns.py fpj.woff2 t.png 6 -4,-2,0,2         # one figure at several turns

`fpj.woff2` is the font the studio carries (base64 in `index.html`, under
`BUILTIN_FONTS["FPJ"]`).
