/**
 * Site-wide visitor counter.
 *
 * Tracking remains GoatCounter (and respects visitors' ad/tracker blocking).
 * Display uses a same-origin JSON snapshot refreshed by GitHub Actions.
 * A blocked tracker does not prevent the published total from being displayed.
 */
const GOATCOUNTER_CODE = 'souravius1234';
const COUNT_SNAPSHOT_URL = '/data/visitor-count.json';

let initialized = false;

export function initVisitorCounter() {
  if (initialized || !/^[a-z0-9-]+$/.test(GOATCOUNTER_CODE)) return;
  if (location.protocol !== 'https:' || location.hostname !== 'souravius1234.github.io') return;
  initialized = true;

  // Tracking is optional: ad blockers may prevent it, and that choice is respected.
  const tracking = document.createElement('script');
  tracking.async = true;
  tracking.src = 'https://gc.zgo.at/count.js';
  tracking.dataset.goatcounter = `https://${GOATCOUNTER_CODE}.goatcounter.com/count`;
  document.head.appendChild(tracking);

  const counters = document.querySelectorAll('[data-visit-counter]');
  if (!counters.length) return;

  // Same-origin file: does not make any browser-side analytics API request.
  fetch(COUNT_SNAPSHOT_URL, { cache: 'no-cache' })
    .then((response) => {
      if (!response.ok) throw new Error(`Visitor count snapshot: HTTP ${response.status}`);
      return response.json();
    })
    .then((data) => {
      if (typeof data.count !== 'string' && typeof data.count !== 'number') return;
      const count = String(data.count);
      if (!/^[0-9][0-9,]*$/.test(count)) return;

      counters.forEach((counter) => {
        const value = counter.querySelector('[data-visit-count]');
        if (!value) return;
        value.textContent = count;
        counter.hidden = false;
      });
    })
    .catch(() => {
      // Do not show a made-up count if the published snapshot is unavailable.
    });
}
