/*
 * VedicSlokas service worker: makes the site installable and keeps favourite slokas readable
 * offline. Plain JavaScript on purpose (no build step, no dependencies).
 *
 * - Hashed build files (/_next/static), fonts and icons: from the cache first (they never change).
 * - Public pages (home, library, sloka pages, about, legal): from the network, saved as they
 *   load, and from the saved copy when offline.
 * - Favourite slokas: the page posts the list of favourites; each one's page (and the files it
 *   needs) is saved, so it opens with no connection at all.
 * - Never touched: the API, the dashboard, admin, sign-in pages and error reports. They always
 *   go to the network; offline, pages show /offline instead.
 */

const VERSION = "v1";
const STATIC = `vs-static-${VERSION}`;
const PAGES = `vs-pages-${VERSION}`;
const SAVED = `vs-saved-${VERSION}`;
const OFFLINE_URL = "/offline";

const PUBLIC_PAGE = /^\/($|library$|sloka\/[a-z0-9-]+$|about$|privacy$|terms$|translate$|offline$)/;
const NEVER = /^\/(api|dashboard|admin|login|signup|auth|check-email|unsubscribe|monitoring)(\/|$)/;
const STATIC_FILE = /^\/(_next\/static\/|fonts\/|icons\/)/;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      // The offline page and its own files, so it works (and lists saved slokas) with no connection.
      await savePage(PAGES, OFFLINE_URL);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([STATIC, PAGES, SAVED]);
      for (const key of await caches.keys()) if (key.startsWith("vs-") && !keep.has(key)) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});

/** A page's own files: its scripts, styles and fonts, so a saved page also works offline. */
async function saveAssets(html) {
  const urls = new Set();
  for (const m of html.matchAll(/(?:src|href)="(\/(?:_next\/static|fonts)\/[^"]+)"/g)) urls.add(m[1]);
  const cache = await caches.open(STATIC);
  await Promise.all(
    [...urls].map(async (url) => {
      if (await cache.match(url)) return;
      try {
        const res = await fetch(url);
        if (res.ok) await cache.put(url, res);
      } catch {
        // Offline right now: it will be saved next time.
      }
    }),
  );
}

async function savePage(cacheName, path) {
  const res = await fetch(path, { credentials: "same-origin" });
  if (!res.ok || res.redirected) return;
  const copy = res.clone();
  await (await caches.open(cacheName)).put(path, res);
  await saveAssets(await copy.text());
}

/** Keeps exactly the favourites saved for offline reading. */
async function syncFavourites(slugs) {
  const wanted = new Set(slugs.filter((s) => typeof s === "string" && /^[a-z0-9-]+$/.test(s)).map((s) => `/sloka/${s}`));
  const cache = await caches.open(SAVED);
  for (const req of await cache.keys()) {
    const path = new URL(req.url).pathname;
    if (!wanted.has(path)) await cache.delete(req);
  }
  for (const path of wanted) {
    if (await cache.match(path)) continue;
    try {
      await savePage(SAVED, path);
    } catch {
      // Offline: tried again on the next sync.
    }
  }
}

self.addEventListener("message", (event) => {
  if (event.origin && event.origin !== self.location.origin) return;
  const data = event.data;
  if (data && data.type === "favourites" && Array.isArray(data.slugs)) event.waitUntil(syncFavourites(data.slugs.slice(0, 500)));
});

async function fromCacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (res.ok) (await caches.open(STATIC)).put(request, res.clone());
  return res;
}

async function networkThenSaved(request, path) {
  try {
    const res = await fetch(request);
    if (res.ok && !res.redirected) (await caches.open(PAGES)).put(path, res.clone());
    return res;
  } catch {
    return (await caches.match(path, { cacheName: SAVED })) || (await caches.match(path, { cacheName: PAGES })) || (await caches.match(OFFLINE_URL));
  }
}

async function networkOrOffline(request) {
  try {
    return await fetch(request);
  } catch {
    return (await caches.match(OFFLINE_URL)) || Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const path = url.pathname;

  if (STATIC_FILE.test(path)) {
    event.respondWith(fromCacheFirst(request));
    return;
  }
  if (request.mode !== "navigate") return;
  // In-app navigations fetch data with ?_rsc; when that fails offline, the app falls back to a full page load, handled here.
  if (NEVER.test(path)) {
    event.respondWith(networkOrOffline(request));
    return;
  }
  // Saved by path: the library's filters (?theme=…) are read in the browser, so one copy serves them all.
  if (PUBLIC_PAGE.test(path)) {
    event.respondWith(networkThenSaved(request, path));
  }
});
