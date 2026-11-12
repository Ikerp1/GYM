// Service worker de GYM: guarda una copia de la app para que se abra sin cobertura.
// - Al instalarse descarga todos los archivos de la app (versión __VERSION__).
// - Página principal: primero intenta internet (para recibir cambios) y, si no hay o tarda, usa la copia.
// - Archivos con versión y librerías: se sirven desde la copia (no cambian nunca).
// - Las peticiones de datos de Firebase NO pasan por aquí (Firebase tiene su propia caché sin conexión).
const VERSION = "__VERSION__";
const CACHE = "gym-" + VERSION;
const V = "?v=" + VERSION;

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon.svg",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png",
  "./app.js" + V,
  "./db.js" + V,
  "./exercises.js" + V,
  "./figures.js" + V,
  "./figure-engine.js" + V,
  "./firebase-config.js" + V,
];
const LIBS = [
  "https://cdn.jsdelivr.net/npm/htm@3.1.1/preact/standalone.module.js",
  "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js",
  "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js",
  "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js",
  "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Barlow:wght@400;500;600;700&display=swap",
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(APP_FILES);
    // Las librerías externas, una a una: si alguna falla, la instalación sigue.
    await Promise.all(LIBS.map((url) => cache.add(new Request(url, { mode: "cors" })).catch(() => {})));
    // Los archivos de los tipos de letra vienen indicados dentro del CSS de Google Fonts.
    try {
      const css = await (await cache.match(LIBS.at(-1))).text();
      const fonts = [...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)].map((m) => m[1]);
      await Promise.all(fonts.map((f) => cache.add(new Request(f, { mode: "cors" })).catch(() => {})));
    } catch {}
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key.startsWith("gym-") && key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});

const isLib = (url) =>
  url.startsWith("https://cdn.jsdelivr.net/npm/") ||
  url.startsWith("https://www.gstatic.com/firebasejs/") ||
  url.startsWith("https://fonts.googleapis.com/") ||
  url.startsWith("https://fonts.gstatic.com/");

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  // 1) Abrir la app (página principal): internet primero con límite de tiempo; si no, la copia.
  if (req.mode === "navigate" && sameOrigin) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const net = await Promise.race([
          fetch(req),
          new Promise((_, reject) => setTimeout(() => reject(new Error("lento")), 4000)),
        ]);
        if (net.ok) cache.put("./index.html", net.clone());
        return net;
      } catch {
        return (await cache.match("./index.html")) || (await cache.match("./")) || Response.error();
      }
    })());
    return;
  }

  // 2) Archivos de la app y librerías: la copia primero; si no está, internet (y se guarda).
  if (sameOrigin || isLib(req.url)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(req, { ignoreVary: true });
      if (hit) return hit;
      try {
        const net = await fetch(req);
        if (net.ok || net.type === "opaque") cache.put(req, net.clone());
        return net;
      } catch {
        // Sin conexión y sin copia: si es un archivo nuestro con otra versión, servir el que tengamos.
        if (sameOrigin) {
          const loose = await cache.match(req, { ignoreSearch: true });
          if (loose) return loose;
        }
        return Response.error();
      }
    })());
  }
  // 3) Todo lo demás (Firebase, fotos de perfil...) pasa directo a internet.
});
