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
  event.respondWith(
    fetch(event.request)
      .then(function (response) {
        event.waitUntil(updateCache(event.request, response.clone()));
        return response;
      })
      .catch(function (error) {
        return fromCache(event.request);
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
