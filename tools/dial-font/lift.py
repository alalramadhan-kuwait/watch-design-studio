"""Lift upright figures off a straightened dial (dial.rectify_affine), as outlines.

usage: lift.py face.png lab.npy spec.json outlines.json sheet.png

spec.json: {"dark": true, "up": 5, "digits": {"1": {"comp": 8}, "0": {"comp": 32, "mirror": "left", "cut_x": 640}}}
  comp     the component id in lab.npy (dial.figures)
  cut_x    keep only ink left of this x (a hand touching the figure)
  mirror   "left": the figure rebuilt from its left half mirrored about its centre line
           (a symmetric figure, part of whose right side a hand covers)

The outline is the line half way between the dial and the ink, from the
brightness resampled UP times finer: between pixels, not on their steps.
"""
import sys, json
import numpy as np
from PIL import Image
from scipy import ndimage
import contourpy

face_p, lab_p, spec_p, out_p, sheet_p = sys.argv[1:6]
spec = json.load(open(spec_p)); UP = spec.get('up', 5); dark = spec.get('dark', True)
a = np.asarray(Image.open(face_p).convert('RGB')).astype(float); L = a.mean(2)
lab = np.load(lab_p)
out, tiles = {}, []
for d, s in spec['digits'].items():
    m = lab == s['comp']
    if 'cut_x' in s: m[:, int(s['cut_x']):] = False
    if 'box' in s:      # the figure's own place, where it is joined to a hand
        bx0, by0, bx1, by1 = s['box']; keepb = np.zeros_like(m); keepb[by0:by1, bx0:bx1] = True; m &= keepb
    ys, xs = np.nonzero(m); x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    pad = 25; X0, X1, Y0, Y1 = x0 - pad, x1 + pad, y0 - pad, y1 + pad
    keep = ndimage.binary_dilation(m, iterations=s.get('keep_px', 6))[Y0:Y1, X0:X1]
    w = L[Y0:Y1, X0:X1]
    bgv = np.median(w[~ndimage.binary_dilation(m, iterations=10)[Y0:Y1, X0:X1]])
    inkv = np.percentile(w[m[Y0:Y1, X0:X1]], 10 if dark else 90)
    f = (bgv - w) / (bgv - inkv) if dark else (w - bgv) / (inkv - bgv)
    f = np.where(keep, f, 0)
    if s.get('local_norm'):
        # a hand's shadow dims the ink under it: each edge is judged against the ink's
        # own brightness nearby (its local maximum), not one level for the whole figure
        lm = ndimage.grey_dilation(f, size=(s['local_norm'], s['local_norm']))
        lm = ndimage.uniform_filter(lm, size=s['local_norm'])
        f = np.clip(f / np.maximum(lm, 0.35), 0, 1.2)
    sp = spec.get('speck_px', 0)
    if sp:      # dust: specks of dial inside the ink, and of ink on the dial, smaller than `sp` px
        f = ndimage.grey_closing(ndimage.grey_opening(f, size=(sp, sp)), size=(sp, sp)) if not dark else ndimage.grey_opening(ndimage.grey_closing(f, size=(sp, sp)), size=(sp, sp))
    if 'cut_x' in s: f[:, int(s['cut_x']) - X0:] = 0
    if 'box' in s:
        bx0, by0, bx1, by1 = s['box']; fb = np.zeros_like(f); fb[max(0, by0 - Y0):by1 - Y0, max(0, bx0 - X0):bx1 - X0] = 1; f = f * fb
    if 'boost' in s:
        # a hand's shadow on part of the figure: that part brightened back, feathered
        (bx0, by0, bx1, by1), gain = s['boost']
        wgt = np.zeros_like(f); wgt[max(0, by0 - Y0):by1 - Y0, max(0, bx0 - X0):bx1 - X0] = 1
        wgt = ndimage.gaussian_filter(wgt, 6)
        f = f * (1 + (gain - 1) * wgt)
    if 'cut_line' in s:
        # a wide hand passing beside the figure: everything on its side of the line (through two points) taken off
        (lx0, ly0), (lx1, ly1) = s['cut_line']
        yy, xx = np.mgrid[Y0:Y1, X0:X1]
        side = (xx - lx0) * (ly1 - ly0) - (yy - ly0) * (lx1 - lx0)
        f = np.where(side * s.get('cut_side', 1) > 0, 0, f)
    if 'unline' in s:
        # a thin hand across the figure: along its path only, whatever is thinner than
        # `w` px is taken away (an opening), so the figure's own wider strokes stay
        (lx0, ly0), (lx1, ly1), lw = s['unline']
        yy, xx = np.mgrid[Y0:Y1, X0:X1]
        dx, dy = lx1 - lx0, ly1 - ly0; nrm = np.hypot(dx, dy)
        dist = np.abs((xx - lx0) * dy - (yy - ly0) * dx) / nrm
        band = dist < lw * s.get('unline_band', 1.6)
        g2 = ndimage.grey_opening(f, size=(lw, lw))
        if s.get('unline_fill'):        # the seam the hand leaves across a bar, filled along the bar
            g2 = ndimage.grey_closing(g2, size=tuple(s['unline_fill']))
        f = np.where(band, g2, f)
    F = ndimage.zoom(f, UP, order=3); F = ndimage.gaussian_filter(F, UP * 0.4)
    gen = contourpy.contour_generator(z=F, line_type=contourpy.LineType.Separate)
    rings = [[[X0 + c / UP, -(Y0 + r / UP)] for c, r in ln] for ln in gen.lines(0.5) if len(ln) >= 12]   # y up
    if s.get('mirror') == 'left':
        from shapely.geometry import Polygon, box
        from shapely import affinity
        g = Polygon()
        for r in rings: g = g.symmetric_difference(Polygon(r).buffer(0))
        gx0, gy0, gx1, gy1 = g.bounds
        b0, b1 = s.get('mirror_band', [0.3, 0.7])        # a band of the figure clear of the hand (y up: 0 the foot)
        mid = g.intersection(box(gx0 - 5, gy0 + b0 * (gy1 - gy0), gx1 + 5, gy0 + b1 * (gy1 - gy0)))
        ax = (mid.bounds[0] + mid.bounds[2]) / 2
        left = g.intersection(box(gx0 - 5, gy0 - 5, ax, gy1 + 5))
        g = left.union(affinity.scale(left, -1, 1, origin=(ax, 0))).buffer(0.3).buffer(-0.3)
        polys = [g] if g.geom_type == 'Polygon' else list(g.geoms)
        rings = []
        for p in polys:
            rings.append([list(c) for c in p.exterior.coords]); rings += [[list(c) for c in h.coords] for h in p.interiors]
    out[d] = rings
    t = Image.fromarray((np.clip(f, 0, 1) * 255).astype('uint8')); t.thumbnail((240, 240)); tiles.append(t)
json.dump(out, open(out_p, 'w'))
sheet = Image.new('L', (250 * len(tiles), 250), 0)
for i, t in enumerate(tiles): sheet.paste(t, (i * 250 + 5, 5))
sheet.save(sheet_p)
print({d: len(r) for d, r in out.items()})
