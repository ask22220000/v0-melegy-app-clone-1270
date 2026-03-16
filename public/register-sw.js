// Melegy PWA — Service Worker Registration with instant auto-update
(function () {
  if (!('serviceWorker' in navigator)) return;

  var refreshing = false;

  // When a new SW takes control → reload the page immediately to get fresh code
  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });

  window.addEventListener('load', function () {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .then(function (registration) {

        // Check for a new SW version on every page load
        registration.update();

        // When a new SW is found — skip waiting immediately (no user prompt)
        registration.addEventListener('updatefound', function () {
          var newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', function () {
            if (newWorker.state === 'installed') {
              // Whether or not there was a previous controller, activate now
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });

        // Also handle the case where a waiting SW already exists on load
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

      })
      .catch(function () {
        // SW registration failed silently — app still works without it
      });
  });
})();
