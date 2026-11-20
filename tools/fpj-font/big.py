"""each figure large on guides: baseline, top line, an overshoot band either side, and verticals every 50 units"""
import sys; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from fontTools.ttLib import TTFont
from glyphs import glyph_geom, raster
from PIL import Image, ImageDraw
f = TTFont(sys.argv[1]); gs = f.getGlyphSet(); cmap = f.getBestCmap(); chars = sys.argv[3]
S = 0.6; M = 40; cw = 470; Hh = int(760 * S) + 2 * M
o = Image.new('RGB', (cw * len(chars), Hh), 'white'); d = ImageDraw.Draw(o)
base = Hh - M - int(20 * S)
for i, c in enumerate(chars):
    g = glyph_geom(gs, cmap[ord(c)]); x0, y0, x1, y1 = g.bounds
    ox = i * cw + (cw - (x1 - x0) * S) / 2 - x0 * S
    X = lambda x: ox + x * S; Y = lambda y: base - y * S
    for gx in range(-100, 900, 50): d.line((X(gx), Y(-30), X(gx), Y(740)), fill=(200, 220, 245))
    d.rectangle((i * cw + 4, Y(0), (i + 1) * cw - 4, Y(-10)), fill=(255, 225, 225)); d.rectangle((i * cw + 4, Y(710), (i + 1) * cw - 4, Y(700)), fill=(255, 225, 225))
    for yy, col in [(0, (220, 60, 60)), (700, (220, 60, 60)), (350, (240, 190, 120))]: d.line((i * cw + 4, Y(yy), (i + 1) * cw - 4, Y(yy)), fill=col, width=1)
    a = raster(g, 1.0, pad=0); m = Image.fromarray((a * 255).astype('uint8')).resize((int(a.shape[1] * S), int(a.shape[0] * S)), Image.LANCZOS)
    o.paste((20, 20, 20), (int(X(x0)), int(Y(y1)), int(X(x0)) + m.size[0], int(Y(y1)) + m.size[1]), m)
    d.line((X((x0 + x1) / 2), Y(-30), X((x0 + x1) / 2), Y(740)), fill=(60, 140, 60), width=1)
    d.text((i * cw + 8, 6), c, fill=(200, 0, 0))
o.save(sys.argv[2])
