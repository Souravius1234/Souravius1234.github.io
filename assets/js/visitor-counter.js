/**
 * Site-wide visitor counter (GoatCounter).
 *
 * One-time activation:
 * 1. Create a GoatCounter site for https://souravius1234.github.io/
 * 2. Replace the empty code below with your GoatCounter subdomain code.
 * 3. In GoatCounter Site settings, enable "Allow adding visitor counts on your website".
 *
 * This intentionally does nothing until configured; it never displays a fake count.
 */
const GOATCOUNTER_CODE = 'souravius1234';

let initialized = false;

export function initVisitorCounter() {
  if (initialized || !/^[a-z0-9-]+$/.test(GOATCOUNTER_CODE)) return;
  if (location.protocol !== 'https:' || location.hostname !== 'souravius1234.github.io') return;
  initialized = true;

  const base = `https://${GOATCOUNTER_CODE}.goatcounter.com`;

  // Tracking covers every HTML page loading this module, not just the homepage.
  const tracking = document.createElement('script');
  tracking.async = true;
  tracking.src = 'https://gc.zgo.at/count.js';
  tracking.dataset.goatcounter = `${base}/count`;
  document.head.appendChild(tracking);

  // The TOTAL endpoint returns a site-wide count across all tracked paths.
  const counters = document.querySelectorAll('[data-visit-counter]');
  if (!counters.length) return;

  fetch(`${base}/counter/TOTAL.json`, { mode: 'cors' })
    .then((response) => {
      if (!response.ok) throw new Error(`GoatCounter: HTTP ${response.status}`);
      return response.json();
    })
    .then((data) => {
      if (typeof data.count !== 'string' && typeof data.count !== 'number') return;
      const count = String(data.count);
      if (!/^[0-9][0-9, .]*$/.test(count)) return;
      counters.forEach((counter) => {
        const value = counter.querySelector('[data-visit-count]');
        if (!value) return;
        value.textContent = count;
        counter.hidden = false;
      });
    })
    .catch(() => {
      // Keep the counter hidden if public counts aren't enabled or the service is unavailable.
    });
}
