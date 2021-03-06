---
layout: compress-js
---
(function() {
  'use strict';

  const CACHE_NAME_PREFIX = '{{ site.title | slugify }}-{{ site.lang | slugify }}-cache-';
  const CACHE_NAME = `${CACHE_NAME_PREFIX}{{ site.time | date: "%s" }}`;

  const filesToCache = [
    {% for page in site.pages %}
    {% if page.url == '/' or page.url contains '/amp/' or page.url contains '/page/' %}
    '{{ page.url | prepend: site.baseurl }}',
    {% elsif page.url != '/sw.js' %}
    '{{ page.url | prepend: site.baseurl_root }}',
    {% endif %}
    {% endfor %}

    {% for post in site.posts %}
    '{{ post.url | prepend: site.baseurl }}',
    {% endfor %}

    {% for file in site.static_files %}
    {% unless file.path contains '/assets/' %}
    '{{ file.path | prepend: site.baseurl_root }}',
    {% endunless %}
    {% endfor %}
  ];

  self.addEventListener('install', (e) => {
    self.skipWaiting();
    e.waitUntil(caches
      .open(CACHE_NAME)
      .then(cache => Promise.all(filesToCache.map(file => cache.add(file))))
    );
  });

  self.addEventListener('activate', (e) => {
    e.waitUntil(caches
      .keys()
      .then(cacheNames => Promise.all(cacheNames
        .filter(cacheName => cacheName.startsWith(CACHE_NAME_PREFIX) && cacheName !== CACHE_NAME)
        .map(cacheName => caches.delete(cacheName))
      ))
    );
  });

  // Network falling back to the cache strategy
  self.addEventListener('fetch', (e) => {
    e.respondWith(fetch(e.request)
      .catch(err => caches
        .match(e.request)
        .then(response => response || Promise.reject(err))
      ));
  });

  self.addEventListener('push', (e) => {
    {% if site.lang == 'fr' %}
      const title = 'Un nouvel article est disponible sur le blog d\'Eleven-labs';
      const body = 'Rendez-vous sur notre site';
    {% elsif site.lang == 'en' %}
      const title = 'New article in Eleven-labs blog';
      const body = 'Go to the web site';
    {% endif %}

    e.waitUntil(
      self.registration.showNotification(title, { body, icon: 'img/icons/icon-512x512.png' })
    );
  });

  self.addEventListener('notificationclick', (e) => {
    e.notification.close();
    e.waitUntil(
      clients.openWindow('{{ site.url }}')
    );
  });
})();
