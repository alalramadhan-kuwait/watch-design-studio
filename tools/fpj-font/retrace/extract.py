"""Lift each figure off the reference photograph, upright, as an outline.

The dial's centre and radius come from circle.txt; each figure is a cream
component found by find (its centre's angle and radius). The photograph's
brightness is resampled upright along the figure's radius (turned by the
hour's angle) at UP times its resolution, with every other cream part masked
to the dial's brown, and the outline is the line half way between the brown
and the cream: an edge between pixels, not on their steps.

writes outlines.json: {digit: [[ring as [x, y] ...], ...]} in photo pixels,
y up, and sheet.png with every lifted figure.
"""
import json
import numpy as np
from PIL import Image
from scipy import ndimage
import contourpy

UP = 10
im = np.asarray(Image.open('journe.jpg').convert('RGB')).astype(float)
Hh, Ww, _ = im.shape
cx, cy, R = map(float, open('circle.txt').read().split())
L = 0.299 * im[..., 0] + 0.587 * im[..., 1] + 0.114 * im[..., 2]
mx = im.max(2); mn = im.min(2); sat = (mx - mn) / np.maximum(mx, 1)
cream = (L > 150) & (sat < 0.35)
lab, n = ndimage.label(cream)
yy, xx = np.mgrid[0:Hh, 0:Ww]

def comp_at(angle, rfrac):
    """the cream component nearest a point given as angle (deg from 12) and radius / R"""
    a = np.radians(angle); px = cx + rfrac * R * np.sin(a); py = cy - rfrac * R * np.cos(a)
    best = None
    for i in range(1, n + 1):
        ys, xs = np.nonzero(lab[max(0, int(py) - 60):int(py) + 60, max(0, int(px) - 60):int(px) + 60] == i)
        if len(xs) < 80: continue
        d = np.hypot(xs.mean() + max(0, int(px) - 60) - px, ys.mean() + max(0, int(py) - 60) - py)
        if best is None or d < best[0]: best = (d, i)
    return best[1]

# digit: (component's angle and radius, the hour the figure stands at)
SOURCES = {
    '1': ((353.1, 0.861), 0),     # the 1 of the 12, upright at the top
    '2': ((5.4, 0.870), 0),       # the 2 of the 12
    '0': ((305.4, 0.868), 300),   # the 0 of the 10
    '4': ((120.0, 0.849), 120),
    '5': ((150.0, 0.864), 150),
    '6': ((180.1, 0.864), 180),
    '7': ((210.0, 0.901), 210),
    '8': ((240.6, 0.886), 240),
    '9': ((270.6, 0.869), 270),
}

def lift(ci, hour):
    m = lab == ci
    keep = ndimage.binary_dilation(m, iterations=4)
    brown = np.median(L[(~cream) & keep])            # the dial right round it
    ink = np.percentile(L[m], 90)                     # the figure's cream
    f = np.where(keep, L, brown)
    f = (f - brown) / (ink - brown)
    ys, xs = np.nonzero(m); gx, gy = xs.mean(), ys.mean()
    # upright frame: u across, v up the figure, both in photo pixels, about the figure's middle
    a = np.radians(hour); ux, uy = np.cos(a), np.sin(a); vx, vy = np.sin(a), -np.cos(a)
    span = 60; N = int(2 * span * UP)
    s = np.linspace(-span, span, N)
    U, V = np.meshgrid(s, -s)                         # row 0 at the top
    X = gx + U * ux + V * vx; Y = gy + U * uy + V * vy
    F = ndimage.map_coordinates(f, [Y, X], order=3, mode='nearest')
    F = ndimage.gaussian_filter(F, UP * 0.35)          # the jpeg's block noise, below a pixel
    gen = contourpy.contour_generator(z=F, line_type=contourpy.LineType.Separate)
    rings = []
    for ln in gen.lines(0.5):
        if len(ln) < 12: continue
        # contour coords are (col, row) in the N x N grid -> u, v in photo pixels
        uv = [[-span + c / (N - 1) * 2 * span, span - r / (N - 1) * 2 * span] for c, r in ln]
        rings.append(uv)
    return rings, F

out, tiles = {}, []
for d, ((ang, rf), hour) in SOURCES.items():
    ci = comp_at(ang, rf)
    rings, F = lift(ci, hour)
    out[d] = rings
    t = Image.fromarray((np.clip(F, 0, 1) * 255).astype('uint8')).resize((300, 300), Image.LANCZOS)
    tiles.append(t)
json.dump(out, open('outlines.json', 'w'))
sheet = Image.new('L', (300 * len(tiles), 300), 0)
for i, t in enumerate(tiles): sheet.paste(t, (i * 300, 0))
sheet.save('sheet.png')
print({d: (len(r), sum(len(x) for x in r)) for d, r in out.items()})
