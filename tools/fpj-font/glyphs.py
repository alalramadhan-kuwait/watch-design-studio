"""Shared helpers: glyph outlines <-> shapely geometry, raster stroke measures."""
from fontTools.pens.basePen import BasePen
from shapely.geometry import Polygon
from shapely.ops import unary_union
import numpy as np
from scipy import ndimage

class FlatPen(BasePen):
    def __init__(self, gs, steps=16):
        super().__init__(gs); self.rings = []; self.cur = None; self.steps = steps
    def _moveTo(self, p): self.cur = [p]
    def _lineTo(self, p): self.cur.append(p)
    def _qCurveToOne(self, p1, p2):
        p0 = self.cur[-1]
        for i in range(1, self.steps + 1):
            t = i / self.steps
            self.cur.append(((1-t)**2*p0[0] + 2*(1-t)*t*p1[0] + t*t*p2[0], (1-t)**2*p0[1] + 2*(1-t)*t*p1[1] + t*t*p2[1]))
    def _curveToOne(self, p1, p2, p3):
        p0 = self.cur[-1]
        for i in range(1, self.steps + 1):
            t = i / self.steps; u = 1 - t
            self.cur.append((u**3*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t**3*p3[0], u**3*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t**3*p3[1]))
    def _closePath(self):
        if self.cur and len(self.cur) > 2: self.rings.append(self.cur)
        self.cur = None
    _endPath = _closePath

def glyph_geom(gs, name):
    pen = FlatPen(gs); gs[name].draw(pen)
    g = Polygon()
    for r in pen.rings:
        p = Polygon(r).buffer(0)
        g = g.symmetric_difference(p)          # even-odd: counters cut out
    return g.buffer(0)

def raster(geom, scale=1.0, pad=20):
    """the geometry at `scale` px per unit, as a boolean image"""
    from PIL import Image, ImageDraw
    x0, y0, x1, y1 = geom.bounds
    W = int((x1 - x0) * scale) + 2 * pad; H = int((y1 - y0) * scale) + 2 * pad
    im = Image.new('L', (W, H), 0); d = ImageDraw.Draw(im)
    polys = [geom] if geom.geom_type == 'Polygon' else list(geom.geoms)
    tr = lambda c: [((x - x0) * scale + pad, (y1 - y) * scale + pad) for x, y in c]
    for p in polys:
        d.polygon(tr(p.exterior.coords), fill=255)
        for h in p.interiors: d.polygon(tr(h.coords), fill=0)
    return np.array(im) > 127

def strokes(geom, scale=1.0):
    """stroke widths in font units along the skeleton ridge: (hairline p15, median, stem p90)"""
    a = raster(geom, scale); dt = ndimage.distance_transform_edt(a)
    ridge = (dt >= ndimage.maximum_filter(dt, size=3)) & (dt > 1.5)
    v = 2 * dt[ridge] / scale
    return np.percentile(v, 15), np.median(v), np.percentile(v, 90)
