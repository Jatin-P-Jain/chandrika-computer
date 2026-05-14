const CACHE_NAME = "chandrika-pwa-v1";
const APP_SHELL = [
  "/",
  "/site.webmanifest",
  "/icons/web-app-manifest-192x192.png",
  "/icons/web-app-manifest-512x512.png",
  "/icons/apple-touch-icon.png",
  "/icons/favicon.ico",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheKeys = await caches.keys();
      await Promise.all(
        cacheKeys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isDailyAccountRoute =
    url.pathname === "/daily-accounts" ||
    url.pathname.startsWith("/daily-accounts/");
  const isDailyAccountDataEndpoint =
    url.pathname.startsWith("/_next/data/") &&
    url.pathname.includes("/daily-accounts");

  // Never serve daily account pages/data from SW cache.
  // These views are sensitive to stale financial readings.
  if (isDailyAccountRoute || isDailyAccountDataEndpoint) {
    event.respondWith(fetch(request));
    return;
  }

  // Network-first for page navigations keeps app data fresh.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, fresh.clone());
          return fresh;
        } catch {
          const cached = await caches.match(request);
          return cached || caches.match("/");
        }
      })(),
    );
    return;
  }

  // Stale-while-revalidate for same-origin static requests.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      const networkPromise = fetch(request)
        .then((response) => {
          if (response.ok) {
            cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkPromise;
    })(),
  );
});
