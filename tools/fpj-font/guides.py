import sys; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from fontTools.ttLib import TTFont
from glyphs import glyph_geom, raster
from PIL import Image, ImageDraw
f = TTFont(sys.argv[1]); gs = f.getGlyphSet(); cmap = f.getBestCmap(); chars = sys.argv[3] if len(sys.argv) > 3 else '0123456789'
S = 0.32; cw = 260; o = Image.new('RGB', (cw * len(chars), 280), 'white'); d = ImageDraw.Draw(o)
for i, c in enumerate(chars):
    g = glyph_geom(gs, cmap[ord(c)]); a = raster(g, 1.0, pad=0)
    im = Image.fromarray(((~a) * 255).astype('uint8')).resize((int(a.shape[1] * S), int(a.shape[0] * S)), Image.LANCZOS)
    x = i * cw + (cw - im.size[0]) // 2; y = 250 - im.size[1]
    o.paste(im.convert('RGB'), (x, y))
    for gx in range(i * cw + 10, (i + 1) * cw, 30): d.line((gx, 15, gx, 255), fill=(120, 170, 235), width=1)
    for gy in range(25, 256, 30): d.line((i * cw, gy, (i + 1) * cw - 6, gy), fill=(235, 170, 120), width=1)
    d.text((i * cw + 6, 2), c, fill=(200, 0, 0))
# draw the glyph again over the guides so the guides sit behind it
for i, c in enumerate(chars):
    g = glyph_geom(gs, cmap[ord(c)]); a = raster(g, 1.0, pad=0)
    m = Image.fromarray((a * 255).astype('uint8')).resize((int(a.shape[1] * S), int(a.shape[0] * S)), Image.LANCZOS)
    x = i * cw + (cw - m.size[0]) // 2; y = 250 - m.size[1]
    o.paste((0, 0, 0), (x, y, x + m.size[0], y + m.size[1]), m)
o.save(sys.argv[2])
