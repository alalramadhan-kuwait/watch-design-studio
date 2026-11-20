"""Build the FPJ figures from the outlines lifted off the reference photograph.

usage: build.py outlines.json base.woff2 out.woff2

Each figure: its rings (photo pixels, upright) become a shape; any lean left
is taken out (TURN); it is scaled to the figure height on the baseline; its
stroke is brought to the set's own weight (the 7 and 8 were printed small with
the same pen, so brought up to height their strokes would be heavier); the
outline is smoothed through a signed distance field so no wedge or step of
the photograph is left; round and pointed edges dip OVER units past the lines.
The 3, which the dial does not have, comes from base.woff2 at the same weight.
"""
import sys, json
sys.path.insert(0, '/home/user/watch-design-studio/tools/fpj-font')
import numpy as np
from scipy import ndimage
import contourpy
from fontTools.ttLib import TTFont
from fontTools.pens.ttGlyphPen import TTGlyphPen
from shapely.geometry import Polygon
from shapely.geometry.polygon import orient
from shapely import affinity
from glyphs import glyph_geom, raster, strokes

H = 700; OVER = 10; PX = 2.0; RSB = 96
SIGMA = 5.0                 # field smoothing, font units: light, so thin serif tips survive; the outline pass smooths the rest
ROUND_TOP = set('012346789')     # the 2's and 3's arches, the bowls; the 1's flag, the 4's apex, the 5's bar and the 7's bar sit on the line
ROUND_BOTTOM = set('0235689')
TURN = json.load(open('turn.json')) if __import__('os').path.exists('turn.json') else {}
WEIGHT_FULL = set('7 8'.split())    # brought fully to the set's weight
WEIGHT_PART = 0.0                   # the others: as printed on the watch, their own weight

outlines = json.load(open(sys.argv[1])); base = TTFont(sys.argv[2]); out_path = sys.argv[3]   # base: base-for-3.woff2
gs = base.getGlyphSet(); cmap = base.getBestCmap()

def shape(rings):
    g = Polygon()
    for r in rings:
        p = Polygon(r).buffer(0)
        if p.area < 4: continue                 # specks, in photo pixels squared
        g = g.symmetric_difference(p)
    return g.buffer(0)

def to_units(g, h_target):
    x0, y0, x1, y1 = g.bounds
    k = h_target / (y1 - y0)
    g = affinity.translate(g, -x0, -y0)
    return affinity.scale(g, k, k, origin=(0, 0)), k

def smooth_ring(c, step=3.0, sigma=9, corner=38.0):
    """a closed outline resampled every `step` units and smoothed along its
    length (sigma in samples), except at its corners (a turn over 12 units
    sharper than `corner` degrees), which keep their point"""
    c = np.asarray(c)[:-1]
    seg = np.r_[np.hypot(*np.diff(np.vstack([c, c[:1]]), axis=0).T)]
    s = np.r_[0, np.cumsum(seg)]; total = s[-1]
    t = np.arange(0, total, step)
    x = np.interp(t, s, np.r_[c[:, 0], c[0, 0]]); y = np.interp(t, s, np.r_[c[:, 1], c[0, 1]])
    P = np.c_[x, y]; n = len(P); k = 4
    a = P - np.roll(P, k, 0); b = np.roll(P, -k, 0) - P
    turn = np.degrees(np.abs(np.arctan2(a[:, 0] * b[:, 1] - a[:, 1] * b[:, 0], (a * b).sum(1))))
    keep = np.clip((turn - corner) / 25.0, 0, 1)
    keep = np.maximum(keep, ndimage.maximum_filter1d(keep, 5, mode='wrap'))
    keep = ndimage.gaussian_filter1d(keep, 1.5, mode='wrap')
    S = np.c_[ndimage.gaussian_filter1d(P[:, 0], sigma, mode='wrap'), ndimage.gaussian_filter1d(P[:, 1], sigma, mode='wrap')]
    return P * keep[:, None] + S * (1 - keep[:, None])

def smooth_shape(g):
    res = Polygon()
    for p in ([g] if g.geom_type == 'Polygon' else list(g.geoms)):
        q = Polygon(smooth_ring(p.exterior.coords), [smooth_ring(h.coords) for h in p.interiors]).buffer(0)
        res = res.union(q)
    return res

def sdf_trace(g, level):
    pad = 40; a = raster(g, PX, pad=pad)
    d = (ndimage.distance_transform_edt(a) - ndimage.distance_transform_edt(~a)) / PX
    d = ndimage.gaussian_filter(d, SIGMA * PX)
    x0, y0, x1, y1 = g.bounds
    gen = contourpy.contour_generator(z=d, line_type=contourpy.LineType.Separate)
    res = Polygon()
    for ln in gen.lines(level):
        if len(ln) < 8: continue
        p = Polygon([((c - pad) / PX + x0, y1 - (r - pad) / PX) for c, r in ln]).buffer(0)
        if p.area < 1500: continue
        res = res.symmetric_difference(p)
    return res.buffer(0)

# 1. every figure at the figure height, as lifted (or from the base font, the 3)
shapes = {}
for ch in '0123456789':
    g = shape(outlines[ch]) if ch in outlines else glyph_geom(gs, cmap[ord(ch)])
    if ch in TURN: g = affinity.rotate(g, TURN[ch], origin='centroid')
    shapes[ch], _ = to_units(g, H)

# 2. the set's weight: stems and hairlines of the figures printed at full size
meas = {ch: strokes(g) for ch, g in shapes.items()}
full = [c for c in '0124569']
T_STEM = float(np.median([meas[c][2] for c in full])); T_HAIR = float(np.median([meas[c][0] for c in full]))
print('set weight: stem %.0f hairline %.0f' % (T_STEM, T_HAIR))

font = TTFont(sys.argv[2])
report = {}
for ch in '0123456789':
    g = shapes[ch]; hair, med, stem = meas[ch]
    want = (T_STEM - stem) / 2                   # grow (+) or thin (-) each side, by the stems
    want_h = (T_HAIR - hair) / 2
    e = (want + want_h) / 2                      # stems and hairlines both count
    if hair > 0.8 * stem:                        # no hairlines (the 1): its stem alone, so its foot and flag keep their serifs
        e = want
    if ch not in WEIGHT_FULL: e *= WEIGHT_PART
    if hair + 2 * e < 0.8 * T_HAIR: e = (0.8 * T_HAIR - hair) / 2     # a hairline never thinner than 80 % of the set's
    out = sdf_trace(g, -e)                       # the field is + inside: a level of -e grows by e
    out = smooth_shape(out)                      # no wedge or wobble left along the strokes
    out = out.buffer(-4, join_style=1).buffer(4, join_style=1)     # spurs off (the 7's serif had some)
    out = out.buffer(4, join_style=1).buffer(-4, join_style=1)     # nicks filled
    out, _ = to_units(out, H)                    # true to height again after the weight change
    top, bot = ch in ROUND_TOP, ch in ROUND_BOTTOM
    if top or bot:
        sy = (H + OVER * (top + bot)) / H
        out = affinity.scale(out, 1, sy, origin=(0, H / 2 if top and bot else 0 if top else H))
    pen = TTGlyphPen(None)
    for p in ([out] if out.geom_type == 'Polygon' else list(out.geoms)):
        p = orient(p.simplify(0.3, preserve_topology=True), sign=-1.0)
        for ring in [p.exterior] + list(p.interiors):
            c = [(round(x), round(y)) for x, y in ring.coords[:-1]]
            c = [q for i, q in enumerate(c) if q != c[i - 1]]
            if len(c) < 3: continue
            pen.moveTo(c[0]); [pen.lineTo(q) for q in c[1:]]; pen.closePath()
    name = cmap[ord(ch)]
    font['glyf'][name] = pen.glyph()
    font['hmtx'][name] = (int(round(out.bounds[2] + RSB)), 0)
    h1, m1, s1 = strokes(out)
    report[ch] = dict(stem=[round(stem), round(s1)], hair=[round(hair), round(h1)], grow=round(e, 1), w=round(out.bounds[2]))
font.save(out_path)
for k, v in report.items(): print(k, v)
