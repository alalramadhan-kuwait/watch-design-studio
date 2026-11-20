import sys; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from fontTools.ttLib import TTFont
from glyphs import glyph_geom, raster
from PIL import Image, ImageDraw
f = TTFont(sys.argv[1]); gs = f.getGlyphSet(); cmap = f.getBestCmap()
o = Image.new('L', (2000, 215), 255); d = ImageDraw.Draw(o)
d.line((0, 195, 2000, 195), fill=170); d.line((0, 195 - 175, 2000, 195 - 175), fill=170)
for i, c in enumerate('0123456789'):
    g = glyph_geom(gs, cmap[ord(c)]); a = raster(g, 0.25, pad=0)
    im = Image.fromarray(((~a) * 255).astype('uint8'))
    y = 195 - int(g.bounds[3] * 0.25)
    o.paste(im, (i * 200 + 10, y), Image.fromarray((a * 255).astype('uint8')))
o.save(sys.argv[2])
