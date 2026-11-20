"""Rebuild the FPJ figures: one height for all ten, clean outlines, even weight.

Each digit is scaled to the common figure height on the baseline, turned into
a signed distance field, smoothed (which removes the ragged edges of the
photo trace without rounding the shapes away), and traced back at the level
that gives the stroke weight wanted. The outlines go back into the font as
TrueType contours; widths keep the font's 96-unit right side bearing.

usage: rebuild.py in.woff2 out.woff2 [weights.json]
"""
import sys, json
sys.path.insert(0, __file__.rsplit('/', 1)[0])
import numpy as np
from scipy import ndimage
import contourpy
from fontTools.ttLib import TTFont
from fontTools.pens.ttGlyphPen import TTGlyphPen
from shapely.geometry import Polygon
from shapely.geometry.polygon import orient
from shapely import affinity
from glyphs import glyph_geom, raster, strokes

H = 700          # the figure height, in font units (the tallest figure, the 2, as it was)
PX = 2.0         # raster pixels per font unit
SIGMA = 13.0     # smoothing of the distance field, font units
RSB = 96         # right side bearing every digit had

src, dst = sys.argv[1], sys.argv[2]
extra = json.load(open(sys.argv[3])) if len(sys.argv) > 3 else {}
f = TTFont(src); gs = f.getGlyphSet(); cmap = f.getBestCmap()

def sdf_of(geom):
    pad = 40
    a = raster(geom, PX, pad=pad)
    d = (ndimage.distance_transform_edt(a) - ndimage.distance_transform_edt(~a)) / PX
    return ndimage.gaussian_filter(d, SIGMA * PX), geom.bounds, pad

def trace(sdf, bounds, pad, level):
    x0, y0, x1, y1 = bounds
    rows = sdf.shape[0]
    gen = contourpy.contour_generator(z=sdf, line_type=contourpy.LineType.Separate)
    g = Polygon()
    for ln in gen.lines(level):
        if len(ln) < 8: continue
        pts = [((c - pad) / PX + x0, y1 - (r - pad) / PX) for c, r in ln]
        p = Polygon(pts).buffer(0)
        if p.area < 2500: continue          # specks left by the photo trace
        g = g.symmetric_difference(p)
    return g.buffer(0)

def to_glyph(geom):
    pen = TTGlyphPen(None)
    polys = [geom] if geom.geom_type == 'Polygon' else list(geom.geoms)
    for p in polys:
        p = orient(p.simplify(0.35, preserve_topology=True), sign=-1.0)   # TrueType: outer clockwise
        for ring in [p.exterior] + list(p.interiors):
            c = [(round(x), round(y)) for x, y in ring.coords[:-1]]
            c = [q for i, q in enumerate(c) if q != c[i - 1]]
            if len(c) < 3: continue
            pen.moveTo(c[0])
            for q in c[1:]: pen.lineTo(q)
            pen.closePath()
    return pen.glyph()

report = {}
for ch in '0123456789':
    name = cmap[ord(ch)]
    g0 = glyph_geom(gs, name)
    bx0, by0, bx1, by1 = g0.bounds
    h0 = by1 - by0
    hair0, med0, stem0 = strokes(g0)
    # the thinning that undoes the thickening a scale-up gives, plus any asked for
    k = H / h0
    for _ in range(3):
        e = (k - 1) / k * med0 * k / 2 + extra.get(ch, 0)          # erosion, font units (negative grows)
        hair_floor = min(hair0, 40)
        e = min(e, max(0.0, (hair0 * k - hair_floor) / 2)) if e > 0 else e
        k = (H + 2 * e) / h0
    g = affinity.scale(g0, k, k, origin=(bx0, by0))
    g = affinity.translate(g, -bx0, -by0)
    sdf, b, pad = sdf_of(g)
    out = trace(sdf, b, pad, e)
    ox0, oy0, ox1, oy1 = out.bounds
    out = affinity.translate(out, -ox0, -oy0)                    # on the baseline, no left bearing
    # a last true-up of the height, a fraction of a percent
    t = H / (out.bounds[3] - out.bounds[1])
    out = affinity.scale(out, t, t, origin=(0, 0))
    f['glyf'][name] = to_glyph(out)
    w = out.bounds[2]
    f['hmtx'][name] = (int(round(w + RSB)), 0)
    hair1, med1, stem1 = strokes(out)
    report[ch] = dict(h0=round(h0), k=round(k, 3), erode=round(e, 1), h=round(out.bounds[3] - out.bounds[1]),
                      hair=[round(hair0), round(hair1)], median=[round(med0), round(med1)], stem=[round(stem0), round(stem1)])

f['glyf'].compile(f)          # recompute bounds
f.save(dst)
print(json.dumps(report, indent=0))
