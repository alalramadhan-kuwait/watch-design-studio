"""one figure at several turns, side by side on guides"""
import sys; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from fontTools.ttLib import TTFont
from shapely import affinity
from glyphs import glyph_geom, raster
from PIL import Image, ImageDraw
f = TTFont(sys.argv[1]); gs = f.getGlyphSet(); cmap = f.getBestCmap()
ch = sys.argv[3]; angles = [float(a) for a in sys.argv[4].split(',')]
S = 0.42; cw = 330; Hh = 380
o = Image.new('RGB', (cw * len(angles), Hh), 'white'); d = ImageDraw.Draw(o)
for i, t in enumerate(angles):
    g = affinity.rotate(glyph_geom(gs, cmap[ord(ch)]), t, origin='centroid')
    x0, y0, x1, y1 = g.bounds; cx = g.centroid.x
    X = lambda x: i * cw + cw / 2 + (x - cx) * S; Y = lambda y: Hh - 30 - (y - y0) * S
    for gx in range(-400, 400, 40): d.line((X(cx + gx), 10, X(cx + gx), Hh - 10), fill=(205, 222, 245))
    for gy in range(0, 760, 70): d.line((i * cw + 4, Y(y0 + gy), (i + 1) * cw - 4, Y(y0 + gy)), fill=(240, 215, 190))
    a = raster(g, 1.0, pad=0); m = Image.fromarray((a * 255).astype('uint8')).resize((int(a.shape[1] * S), int(a.shape[0] * S)), Image.LANCZOS)
    o.paste((20, 20, 20), (int(X(x0)), int(Y(y1))), m)
    d.line((X(cx), 10, X(cx), Hh - 10), fill=(60, 150, 60))
    d.text((i * cw + 8, 4), f'{ch}  {t:+.1f}°', fill=(200, 0, 0))
o.save(sys.argv[2])
