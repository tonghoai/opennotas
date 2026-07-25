const CACHE = "opennotas";

const offlineFallbackPage = "/app";

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.add(offlineFallbackPage);
    })
  );
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;
  // Always hit the network for the app-version check — this endpoint's whole
  // purpose is detecting a fresher deploy than the one that shipped this SW,
  // so it must never be served from this (potentially stale) SW's own cache.
  if (event.request.url.includes("/api/app-version")) {
    event.respondWith(fetch(event.request));
    return;
  }
  event.respondWith(
    fromCache(event.request)
      .then(function (response) {
        event.waitUntil(
          fetch(event.request)
            .then(function (response) {
              return updateCache(event.request, response.clone());
            })
        );
        return response;
      })
      .catch(function () {
        return fetch(event.request)
          .then(function (response) {
            event.waitUntil(updateCache(event.request, response.clone()));
            return response;
          });
      })
  );
});

async function fromCache(request) {
  return caches.open(CACHE).then(function (cache) {
    request.url = request.url += request.url.endsWith("/") ? "" : "/"
    return cache.match(request).then(function (matching) {
      if (!matching || matching.status === 404) {
        return Promise.reject("no-match");
      }
      return matching;
    });
  });
}

async function updateCache(request, response) {
  return caches.open(CACHE).then(function (cache) {
    return cache.put(request, response);
  });
}
