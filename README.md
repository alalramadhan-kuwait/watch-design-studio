# Watch Design Studio

A parametric watch dial and case design studio. Engine, UI, artwork and the case
photograph all live inside a single `index.html`. No build step, no server, no
database — your designs stay on the visitor's own device and are never uploaded.

| file | what it does | required |
|---|---|---|
| `index.html` | the whole app | yes |
| `robots.txt` | keeps the site out of search results | no |
| `_headers` | security headers, and stops a stale copy being served after an update | no |
| `.nojekyll` | stops GitHub Pages stripping `_headers` | only on GitHub Pages |

## Putting it online

Nothing here needs building. Upload the folder and it works.

- **Netlify Drop** — drag the folder onto app.netlify.com/drop. Live in ~30s.
- **Cloudflare Pages** — Workers & Pages → Create → Pages → Upload assets.
- **Vercel** — vercel.com/new, drag the folder.
- **GitHub Pages** — push to a repo, then Settings → Pages → pick the branch.

All four are free at this size.

## Updating it

Replace `index.html` and upload again. `_headers` tells browsers not to cache
the page, so people get the new version on their next visit rather than an old
copy. On GitHub Pages `_headers` is ignored — a hard refresh clears a stale copy.

## Before sharing the link

**Anyone with the link can download everything** — the case photograph, the
traced numerals, the wordmark and the whole parametric engine are inside
`index.html`. `robots.txt` and the page's own `noindex` keep it out of search,
but that is obscurity, not access control.

For real protection use a host that can gate it:

- Cloudflare Pages → Access → self-hosted application → one-time PIN by email
- Netlify → Site settings → Access control → password protection

GitHub Pages has no access control on a free plan.

## Saved work lives in the browser

Every change is saved automatically to the browser's own storage and the app
reopens on your work in progress, so closing the tab costs nothing. Named
versions — Save version — are the points you deliberately return to.

That storage is per-device:

- It does **not** follow you between devices or browsers.
- Clearing browsing data deletes it. So does Private/Incognito browsing.
- iOS Safari clears it after about seven days of not visiting the site.

If the browser refuses to store anything, the app says so in red and warns you
once — take that seriously, because then edits really are lost on close.

**Export → Save design file (JSON)** is the only copy that leaves the device.
It is the reliable way to move a design between devices or to back one up.
Designs that sync by themselves would need accounts and a backend.

## Worth knowing

- First load is about 1.8 MB. Fine on wifi, noticeable on mobile data.
- The interface lettering is fetched from Google Fonts — the one request the
  page makes to anywhere. It no longer holds up the first paint, so the studio
  draws and is usable before it arrives, and falls back to system lettering if
  it never does. Every dial face is embedded, so artwork and exports are
  unaffected either way and work with no network at all.
- The renderer is CPU-heavy. Smooth on a current phone or laptop; an older
  Android will feel slower, especially while dragging a slider.
