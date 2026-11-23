"""Digit-only WOFF2 subsets of the five new numeral faces, one per weight."""
import io, json, base64
from fontTools.ttLib import TTFont
from fontTools import subset
from fontTools.varLib import instancer
S='src/'   # the fonts from github.com/google/fonts (ofl/...), downloaded here
U=[0x30+i for i in range(10)]+[0x660+i for i in range(10)]+[0x6F0+i for i in range(10)]+[0x20]
FONTS={
 'Noto Kufi Arabic':      ('wdsnotokufi',   S+'notokufiarabic__NotoKufiArabic[wght].ttf', [300,400,500,600,700]),
 'IBM Plex Sans Arabic':  ('wdsplexarabic', {200:S+'ibmplexsansarabic__IBMPlexSansArabic-ExtraLight.ttf',300:S+'ibmplexsansarabic__IBMPlexSansArabic-Light.ttf',400:S+'ibmplexsansarabic__IBMPlexSansArabic-Regular.ttf',500:S+'ibmplexsansarabic__IBMPlexSansArabic-Medium.ttf',600:S+'ibmplexsansarabic__IBMPlexSansArabic-SemiBold.ttf',700:S+'ibmplexsansarabic__IBMPlexSansArabic-Bold.ttf'}, None),
 'Kufam':                 ('wdskufam',      S+'kufam__Kufam[wght].ttf', [400,500,600,700]),
 'Alexandria':            ('wdsalexandria', S+'alexandria__Alexandria[wght].ttf', [300,400,500,600,700]),
 'Ruwudu':                ('wdsruwudu',     {400:S+'ruwudu__Ruwudu-Regular.ttf',500:S+'ruwudu__Ruwudu-Medium.ttf',600:S+'ruwudu__Ruwudu-SemiBold.ttf',700:S+'ruwudu__Ruwudu-Bold.ttf'}, None),
}
def sub(font):
    o=subset.Options(); o.flavor='woff2'; o.layout_features=['kern','mark','mkmk']; o.name_IDs=[0,1,2,3,4,5,6,13,14]; o.notdef_outline=True
    s=subset.Subsetter(o); s.populate(unicodes=U); s.subset(font)
    b=io.BytesIO(); font.flavor='woff2'; font.save(b); return b.getvalue()
out={}
for name,(fam,src,ws) in FONTS.items():
    files={}
    if isinstance(src,dict):
        for w,p in src.items(): files[w]=sub(TTFont(p))
    else:
        for w in ws: files[w]=sub(instancer.instantiateVariableFont(TTFont(src),{'wght':w}))
    cm=TTFont(io.BytesIO(files[400])).getBestCmap()
    assert all((0x660+i) in cm for i in range(10)), name
    out[name]={'family':fam,'weights':{w:base64.b64encode(v).decode() for w,v in files.items()},'persian':all((0x6F0+i) in cm for i in range(10))}
    print(f"{name:22s} weights {sorted(files)}  bytes per weight {[len(files[w]) for w in sorted(files)]}  persian {out[name]['persian']}")
json.dump(out,open('newfonts.json','w'))
