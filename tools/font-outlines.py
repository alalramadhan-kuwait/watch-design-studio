#!/usr/bin/env python3
"""The studio's built-in fonts as outlines, for the numerals artwork PDF.

The fonts in index.html (BUILTIN_FONTS) are small WOFF2 subsets: the digits,
the Arabic and Persian digits, and the Roman letters. A browser cannot hand
a glyph's outline to the page, so the maker's vector artwork reads them from
app/font-outlines.json, written here with fontTools.

Each glyph is an SVG path in em units (1 = the font size), y down, the
origin on the baseline at the glyph's left side bearing, with its advance
and its ink box. Run from the repository root after adding or changing a
built-in font:  python3 tools/font-outlines.py
"""
import base64, io, json, re, sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.transformPen import TransformPen

src = open("index.html", encoding="utf-8").read()
i = src.index("const BUILTIN_FONTS = {")
j = src.index("\n};", i)
def num(v):
    t = ("%.4f" % v).rstrip("0").rstrip(".")
    return "0" if t in ("", "-0") else t

out = {}
for m in re.finditer(r'\n  "([^"]+)":\{family:"[^"]+",[^}]*?src:"data:font/[a-z0-9]+;base64,([A-Za-z0-9+/=]+)"', src[i:j]):
    name, data = m.group(1), m.group(2)
    f = TTFont(io.BytesIO(base64.b64decode(data)))
    upm = f["head"].unitsPerEm
    gs, cmap = f.getGlyphSet(), f.getBestCmap()
    k = 1.0 / upm
    glyphs = {}
    for code, gname in sorted(cmap.items()):
        g = gs[gname]
        pen = SVGPathPen(gs, ntos=num)
        g.draw(TransformPen(pen, (k, 0, 0, -k, 0, 0)))
        bp = BoundsPen(gs)
        g.draw(bp)
        b = bp.bounds
        glyphs[chr(code)] = {"a": round(g.width * k, 4), "d": pen.getCommands(),
                             "b": [round(b[0] * k, 4), round(-b[3] * k, 4), round(b[2] * k, 4), round(-b[1] * k, 4)] if b else [0, 0, 0, 0]}
    out[name] = {"g": glyphs}
json.dump(out, open("app/font-outlines.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print(len(out), "fonts,", sum(len(v["g"]) for v in out.values()), "glyphs", file=sys.stderr)
