/* Watch Design Studio — offline shell.

   The studio is one self-contained file: the interface fonts, the numeral
   faces, the case photograph and every texture are carried inside it as data
   URIs, and nothing is fetched while you work. That makes the cache unusually
   simple — hold index.html and the icons, and the whole application is
   offline, not merely its frame.

   Cache-first, deliberately. A design tool that pauses on a slow train to ask
   the network whether it may open is worse than one that opens instantly on
   what it already has; the page checks for a newer version in the background
   and offers it rather than imposing it, so an update never lands in the
   middle of an edit.

   BUILD is replaced with the commit during deployment. That is what makes the
   file differ from the one the browser already has, which is the only signal
   a browser uses to decide a worker has changed. */
const BUILD = "__BUILD__";
const CACHE = "wds-" + BUILD;

/* Everything the app needs to start with no network at all. */
const SHELL = [
  /* Not "./" as well: it is the same 1.9 MB file under a second name, and the
     navigation handler below answers every way in from this one copy. */
  "./index.html",
  "./manifest.webmanifest",
  "./app/icon-192.png",
  "./app/icon-512.png",
  "./app/icon-maskable-512.png",
  "./app/apple-touch-icon.png"
];

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    /* cache:"reload" so a stale copy in the HTTP cache cannot be installed as
       the new version — the whole point of this install is to get the new one. */
    await Promise.all(SHELL.map(async u => {
      try{ await c.put(u, await fetch(new Request(u, {cache:"reload"}))); }
      catch(err){ /* one missing icon must not fail the install */ }
    }));
  })());
  /* No skipWaiting here on purpose: the running page is asked first, so an
     update cannot replace the app underneath someone mid-edit. */
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith("wds-") && k !== CACHE)
                          .map(k => caches.delete(k)));
    if(self.registration.navigationPreload) await self.registration.navigationPreload.disable();
    await self.clients.claim();
  })());
});

/* The page says when it is ready to take the update. */
self.addEventListener("message", e => {
  if(e.data && e.data.type === "SKIP_WAITING") self.skipWaiting();
  if(e.data && e.data.type === "BUILD" && e.source) e.source.postMessage({type:"BUILD", build:BUILD});
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if(req.method !== "GET") return;
  let url;
  try{ url = new URL(req.url); }catch(err){ return; }
  if(url.origin !== self.location.origin) return;

  /* Opening the app: the cached shell, always, with the network only as the
     fallback for a first run. */
  if(req.mode === "navigate"){
    e.respondWith((async () => {
      const shell = await caches.match("./index.html");
      if(shell) return shell;
      try{ return await fetch(req); }
      catch(err){ return new Response("Offline and not yet installed.",
        {status:503, headers:{"Content-Type":"text/plain"}}); }
    })());
    return;
  }

  /* Everything else — icons, the manifest, the launch images iOS asks for —
     is served from the cache if it is there and added to it if it is not. */
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const hit = await c.match(req);
    if(hit) return hit;
    try{
      const res = await fetch(req);
      if(res && res.ok && res.type === "basic") c.put(req, res.clone());
      return res;
    }catch(err){
      return hit || new Response("", {status:504});
    }
  })());
});
