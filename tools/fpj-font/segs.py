import sys; sys.path.insert(0, __file__.rsplit('/', 1)[0])
import numpy as np
from fontTools.ttLib import TTFont
from glyphs import glyph_geom
def segments(geom, tol=5, minlen=120):
    polys = [geom] if geom.geom_type == 'Polygon' else list(geom.geoms)
    out = []
    for p in polys:
        for ring in [p.exterior] + list(p.interiors):
            c = np.array(ring.simplify(tol).coords)
            for a, b in zip(c[:-1], c[1:]):
                d = b - a; L = np.hypot(*d)
                if L >= minlen:
                    ang = np.degrees(np.arctan2(d[1], d[0])) % 180     # 0 = horizontal, 90 = vertical
                    out.append((round(L), round(ang, 1), [round(v) for v in (a + b) / 2]))
    return sorted(out, reverse=True)
if __name__ == '__main__':
    f = TTFont(sys.argv[1]); gs = f.getGlyphSet(); cmap = f.getBestCmap()
    for c in sys.argv[2] if len(sys.argv) > 2 else '0123456789':
        g = glyph_geom(gs, cmap[ord(c)]); print(c, g.bounds and [round(v) for v in g.bounds], segments(g)[:6])
