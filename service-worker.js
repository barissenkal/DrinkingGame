/// <reference lib="webworker" /> 
// @ts-check

// Dumb service worker for opening index.html offline

/** @type {ServiceWorkerGlobalScope} */
// @ts-ignore
const sw = self;

const CACHE_NAME = "main-cache-20190216";
const BASE_PATH = "/DrinkingGame"; // Github pages path for hosting
const CACHE_PATHS = [
	// Main single file page
	"/",
	// Just in case
	"/index.html",
	// Icons etc
	"/icons/android-chrome-144x144.png",
	"/icons/android-chrome-192x192.png",
	"/icons/android-chrome-36x36.png",
	"/icons/android-chrome-48x48.png",
	"/icons/android-chrome-72x72.png",
	"/icons/android-chrome-96x96.png",
	"/icons/apple-touch-icon-114x114.png",
	"/icons/apple-touch-icon-120x120.png",
	"/icons/apple-touch-icon-144x144.png",
	"/icons/apple-touch-icon-152x152.png",
	"/icons/apple-touch-icon-180x180.png",
	"/icons/apple-touch-icon-57x57.png",
	"/icons/apple-touch-icon-60x60.png",
	"/icons/apple-touch-icon-72x72.png",
	"/icons/apple-touch-icon-76x76.png",
	"/icons/apple-touch-icon-precomposed.png",
	"/icons/apple-touch-icon.png",
	"/icons/browserconfig.xml",
	"/icons/favicon-16x16.png",
	"/icons/favicon-32x32.png",
	"/icons/favicon-96x96.png",
	"/icons/favicon.ico",
	"/icons/manifest.json",
	"/icons/mstile-144x144.png",
	"/icons/mstile-150x150.png",
	"/icons/mstile-310x150.png",
	"/icons/mstile-310x310.png",
	"/icons/mstile-70x70.png",
	"/icons/safari-pinned-tab.svg",
	"/icons/startup_image_iPhone4s.png",
	"/icons/startup_image_iPhone5.png",
	"/icons/startup_image_iPhone6.png",
	"/icons/startup_image_iPhone6Plus.png"
].map((path) => BASE_PATH + path)

sw.addEventListener("install", (event) => {
	console.debug('[service-worker.js] install')
	event.waitUntil(caches.open(CACHE_NAME).then((cache) => {
		return cache.addAll(CACHE_PATHS).catch((error) => {
			console.debug('[service-worker.js] failed to cache', error)
		});
	}));
});

sw.addEventListener("activate", (event) => {
	console.debug('[service-worker.js] activate')
	event.waitUntil(caches.keys().then((cacheNames) => {
		return Promise.all(cacheNames.map((cacheName) => {
			if (cacheName != CACHE_NAME) caches.delete(cacheName)
		}));
	}));
});

sw.addEventListener("fetch", (event) => {
	console.debug('[service-worker.js] fetch', event.request.url)
	const cachePromise = caches.open(CACHE_NAME);
	event.respondWith(fetch(event.request).then((response) => {
		if (!response || response.status !== 200 || response.type !== 'basic') {
			return response;
		}

		const responseToCache = response.clone();
		cachePromise.then(cache => {
			return cache.put(event.request, responseToCache);
		})

		return response;
	}, (error) => {
		console.debug('[service-worker.js] fetch error', error)
		return cachePromise.then((cache) => {
			return cache.match(event.request).then((response) => {
				if (response) {
					return response
				} else {
					console.error('[service-worker.js] fetch error + cache miss')
					return new Response("Network error", {
						status: 408,
						headers: { "Content-Type": "text/plain" },
					});
				}
			})
		})
	}));
});