"""How far each figure leans: the turn that best squares its edges to the
vertical and the horizontal, and for the round figures the axis of the counter."""
import sys; sys.path.insert(0, __file__.rsplit('/', 1)[0])
import numpy as np
from scipy import ndimage
from fontTools.ttLib import TTFont
from glyphs import glyph_geom, raster

def edge_angle(a):
    im = ndimage.gaussian_filter(a.astype(float), 2.0)
    gx = ndimage.sobel(im, 1); gy = -ndimage.sobel(im, 0)
    w = np.hypot(gx, gy); phi = np.arctan2(gy, gx)
    z = (w * np.exp(4j * phi)).sum()
    return np.degrees(np.angle(z) / 4), abs(z) / w.sum()      # angle, how sure (0..1)

def counter_axis(geom):
    """the major axis of the largest counter, from vertical (deg, + leans right)"""
    polys = [geom] if geom.geom_type == 'Polygon' else list(geom.geoms)
    holes = [h for p in polys for h in p.interiors]
    if not holes: return None
    from shapely.geometry import Polygon
    h = max((Polygon(x) for x in holes), key=lambda p: p.area)
    c = np.array(h.exterior.coords) - np.array(h.centroid.coords[0])
    cov = np.cov(c.T); ev, vec = np.linalg.eigh(cov); v = vec[:, 1]
    if v[1] < 0: v = -v
    return np.degrees(np.arctan2(v[0], v[1])), ev[1] / ev[0]

if __name__ == '__main__':
    f = TTFont(sys.argv[1]); gs = f.getGlyphSet(); cmap = f.getBestCmap()
    for c in '0123456789':
        g = glyph_geom(gs, cmap[ord(c)]); a = raster(g, 1.0)
        ang, sure = edge_angle(a); ca = counter_axis(g)
        print(c, 'edges %+.1f° (sure %.2f)' % (ang, sure), 'counter %+.1f° elong %.2f' % ca if ca else '')
