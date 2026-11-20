"""One figure at a time: every measure of its lean, and how it sits on the lines."""
import sys; sys.path.insert(0, __file__.rsplit('/', 1)[0])
import numpy as np
from fontTools.ttLib import TTFont
from shapely.geometry import Polygon
from shapely import affinity
from glyphs import glyph_geom
from segs import segments

def mirror_tilt(g):
    """the turn (deg, + anticlockwise) that makes the figure most like its mirror image"""
    best = None
    for t in np.arange(-15, 15.01, 0.5):
        r = affinity.rotate(g, t, origin='centroid'); cx = r.centroid.x
        m = affinity.scale(r, -1, 1, origin=(cx, r.centroid.y))
        iou = r.intersection(m).area / r.union(m).area
        if best is None or iou > best[1]: best = (t, iou)
    return best

def counters(g):
    polys = [g] if g.geom_type == 'Polygon' else list(g.geoms)
    return sorted([Polygon(h) for p in polys for h in p.interiors], key=lambda p: -p.area)

def axis(poly):
    c = np.array(poly.exterior.coords); c = c - c.mean(0); ev, vec = np.linalg.eigh(np.cov(c.T)); v = vec[:, 1]
    if v[1] < 0: v = -v
    return np.degrees(np.arctan2(v[0], v[1])), ev[1] / ev[0]

f = TTFont(sys.argv[1]); gs = f.getGlyphSet(); cmap = f.getBestCmap()
for ch in (sys.argv[2] if len(sys.argv) > 2 else '0123456789'):
    g = glyph_geom(gs, cmap[ord(ch)]); x0, y0, x1, y1 = g.bounds
    print(f'--- {ch}  box x {x0:.0f}..{x1:.0f}  y {y0:.0f}..{y1:.0f}')
    st = [s for s in segments(g, 4, 100) if abs(s[1] - 90) < 25]
    br = [s for s in segments(g, 4, 100) if min(s[1], 180 - s[1]) < 25]
    if st: print('   stems (len, angle, at):', st[:4], ' -> turn', round(np.average([90 - s[1] for s in st[:4]], weights=[s[0] for s in st[:4]]), 1))
    if br: print('   bars  (len, angle, at):', br[:4], ' -> turn', round(np.average([(-s[1] if s[1] < 90 else 180 - s[1]) for s in br[:4]], weights=[s[0] for s in br[:4]]), 1))
    cs = counters(g)
    for i, c in enumerate(cs[:2]):
        a, e = axis(c); print(f'   counter {i}: centre ({c.centroid.x:.0f},{c.centroid.y:.0f}) axis {a:+.1f}° elong {e:.2f}')
    if len(cs) >= 2:
        a, b = cs[0].centroid, cs[1].centroid; top, bot = (a, b) if a.y > b.y else (b, a)
        print('   counters stacked: lean %+.1f°' % np.degrees(np.arctan2(top.x - bot.x, top.y - bot.y)))
    t, iou = mirror_tilt(g); print(f'   mirror: best turn {t:+.1f}° (likeness {iou:.2f})')
    # where it touches the lines: how much of the top and bottom is flat
    c = np.vstack([np.array(p.exterior.coords) for p in ([g] if g.geom_type == 'Polygon' else g.geoms)])
    print('   width on the top line (y>%d): %.0f   on the baseline (y<%d): %.0f' % (y1 - 6, np.ptp(c[c[:, 1] > y1 - 6, 0]) if (c[:, 1] > y1 - 6).any() else 0, y0 + 6, np.ptp(c[c[:, 1] < y0 + 6, 0]) if (c[:, 1] < y0 + 6).any() else 0))
