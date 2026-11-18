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
def pair_kerning(f, cmap):
    """Pair kerning between the subset's characters, in em: GPOS pair
    adjustments (formats 1 and 2) and an old kern table, as a browser
    applies them between two neighbouring figures."""
    upm = f["head"].unitsPerEm
    rev = {}
    for code, g in cmap.items():
        rev.setdefault(g, []).append(chr(code))
    out = {}
    def put(g1, g2, v):
        if not v:
            return
        for a in rev.get(g1, []):
            for b in rev.get(g2, []):
                out[a + b] = out.get(a + b, 0) + v
    if "GPOS" in f and f["GPOS"].table.LookupList:
        gpos = f["GPOS"].table
        used = set()
        for fr in gpos.FeatureList.FeatureRecord:
            if fr.FeatureTag == "kern":
                used.update(fr.Feature.LookupListIndex)
        for li in sorted(used):
            lk = gpos.LookupList.Lookup[li]
            subs = lk.SubTable
            if lk.LookupType == 9:
                subs = [x.ExtSubTable for x in subs]
            for st in subs:
                if getattr(st, "LookupType", 2) != 2 and lk.LookupType != 9:
                    continue
                if not hasattr(st, "Format") or not hasattr(st, "Coverage"):
                    continue
                cov = st.Coverage.glyphs
                if st.Format == 1:
                    for i, g1 in enumerate(cov):
                        for pv in st.PairSet[i].PairValueRecord:
                            v = getattr(pv.Value1, "XAdvance", 0) if pv.Value1 else 0
                            put(g1, pv.SecondGlyph, v)
                elif st.Format == 2:
                    c1, c2 = st.ClassDef1.classDefs, st.ClassDef2.classDefs
                    for g1 in cov:
                        k1 = c1.get(g1, 0)
                        for g2 in rev:
                            k2 = c2.get(g2, 0)
                            r = st.Class1Record[k1].Class2Record[k2]
                            v = getattr(r.Value1, "XAdvance", 0) if r.Value1 else 0
                            put(g1, g2, v)
    elif "kern" in f:
        for t in f["kern"].kernTables:
            for (g1, g2), v in t.kernTable.items():
                put(g1, g2, v)
    return {k: round(v / upm, 4) for k, v in sorted(out.items()) if round(v / upm, 4)}

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
    entry = {"g": glyphs}
    kern = pair_kerning(f, cmap)
    if kern:
        entry["k"] = kern
    out[name] = entry
json.dump(out, open("app/font-outlines.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print(len(out), "fonts,", sum(len(v["g"]) for v in out.values()), "glyphs", file=sys.stderr)
