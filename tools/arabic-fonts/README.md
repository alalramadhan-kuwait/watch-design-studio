# Arabic numeral faces (v4.57.0)

Five faces from Google Fonts (github.com/google/fonts, `ofl/`), each under
the SIL Open Font License 1.1 (the licence files here):

| Face | Weights built in | Persian figures |
|---|---|---|
| Noto Kufi Arabic | 300, 400, 500, 600, 700 (from the variable font) | yes |
| IBM Plex Sans Arabic | 200, 300, 400, 500, 600, 700 | yes |
| Kufam | 400, 500, 600, 700 (from the variable font) | yes |
| Alexandria | 300, 400, 500, 600, 700 (from the variable font) | yes |
| Ruwudu | 400, 500, 600, 700 | no |

`subset.py` cuts each to the figures (0–9, ٠–٩, ۰–۹) as WOFF2, one file per
weight, and checks every weight has all ten Arabic-Indic figures; the
result is embedded in `BUILTIN_FONTS` in index.html (the regular weight as
`src`, the others under `weights`). Then run `python3 tools/font-outlines.py`
for the maker's artwork outlines.

DIN Next LT Arabic is a commercial Monotype face and is not included.
