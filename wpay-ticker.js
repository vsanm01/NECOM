/*!
 * wpay-ticker.js
 * Standalone, self-mounting scrolling "ticker" marquee bar extracted from the
 * WPay Blogger theme. Injects its own CSS and renders the ticker markup, so it
 * can be dropped into any page with a single <script src="wpay-ticker.js" defer></script> tag.
 *
 * Usage:
 *   1) Drop this file next to your page (or host it on a CDN / jsDelivr).
 *   2) Add: <div id="wpayTicker"></div>  where you want the bar to appear
 *      (or omit it — the script will create one right after <body> opens).
 *   3) Add: <script src="wpay-ticker.js" defer></script>
 *   4) Optional: override the default items before this script runs:
 *        <script>window.WPAY_TICKER_ITEMS = [ { icon: '<i class="fa-solid fa-star"></i>', label: 'Hi', desc: 'Custom item' } ];</script>
 *
 * Requires Font Awesome (or similar) loaded separately for the <i class="fa-..."> icons
 * used in the default item set — the ticker itself works fine without it, icons just won't render.
 *
 * Everything (HTML + CSS) is self-contained in this one file — no external
 * stylesheet is required, and it respects prefers-reduced-motion automatically.
 */
(function () {
  'use strict';

  var MOUNT_ID = 'wpayTicker';
  var TRACK_ID = 'wpayTickerTrack';
  var STYLE_ID = 'wpay-ticker-styles';

  var DEFAULT_ITEMS = [
    { icon: '<i class="fa-solid fa-heart" aria-hidden="true"></i>', label: 'Support Us', desc: 'Your contribution makes a difference.' },
    { icon: '<i class="fa-solid fa-credit-card" aria-hidden="true"></i>', label: 'Payment Options', desc: 'We accept PayPal, Dodo, Wise, Razorpay, Bitcoin, and QRpay (UPI, Gpay, Phonepe, AmazonPay, Paytm).' },
    { icon: '<i class="fa-solid fa-link" aria-hidden="true"></i>', label: 'Community', desc: 'Join our community by following our social channels and sharing the platform with your network' },
    { icon: '<i class="fa-solid fa-sparkles" aria-hidden="true"></i>', label: 'Why WAGS', desc: 'Simple to use.' },
    { icon: '<i class="fa-solid fa-gift" aria-hidden="true"></i>', label: 'Free Forever', desc: 'Free Forever' },
    { icon: '<i class="fa-solid fa-rocket" aria-hidden="true"></i>', label: 'Our Mission', desc: 'Built for entrepreneurs.' },
    { icon: '<i class="fa-solid fa-screwdriver-wrench" aria-hidden="true"></i>', label: 'What We Build', desc: 'Building applications in our pipeline to help solopreneurs' },
    { icon: '<i class="fa-solid fa-hand-holding-heart" aria-hidden="true"></i>', label: 'Support WAGS Studio', desc: 'WAGS Studio - Worldwide Action Great Solution.' }
  ];

  var CSS = ""
    + ":root{"
    + "  --wpay-ticker-bg:#e5383b;"
    + "  --wpay-ticker-text:#ffffff;"
    + "  --wpay-ticker-border:#ffd400;"
    + "}"
    + ".wpay-ticker-bar{"
    + "  background:var(--wpay-ticker-bg);"
    + "  border-top:1px solid var(--wpay-ticker-border);"
    + "  border-bottom:1px solid var(--wpay-ticker-border);"
    + "  overflow:hidden;"
    + "  height:34px;"
    + "  display:flex;"
    + "  align-items:center;"
    + "  flex-shrink:0;"
    + "  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;"
    + "}"
    + ".wpay-ticker-track{"
    + "  display:flex;"
    + "  white-space:nowrap;"
    + "  gap:0;"
    + "}"
    + "@media (prefers-reduced-motion:no-preference){"
    + "  .wpay-ticker-track{animation:wpay-ticker-scroll 50s linear infinite;}"
    + "  .wpay-ticker-track:hover{animation-play-state:paused;}"
    + "}"
    + ".wpay-ticker-item{"
    + "  display:inline-flex;"
    + "  align-items:center;"
    + "  gap:8px;"
    + "  padding:0 32px;"
    + "  font-size:12px;"
    + "  font-weight:700;"
    + "  color:var(--wpay-ticker-text);"
    + "  text-transform:uppercase;"
    + "  letter-spacing:0.3px;"
    + "  white-space:nowrap;"
    + "  flex-shrink:0;"
    + "}"
    + ".wpay-ticker-sep{"
    + "  color:rgba(255,255,255,0.55);"
    + "  font-size:16px;"
    + "  line-height:1;"
    + "}"
    + "@keyframes wpay-ticker-scroll{"
    + "  0%{transform:translateX(0);}"
    + "  100%{transform:translateX(-50%);}"
    + "}"
    + ".wpay-ticker-track.wpay-ticker-paused{"
    + "  animation-play-state:paused;"
    + "}";

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function getOrCreateMount() {
    var mount = document.getElementById(MOUNT_ID);
    if (!mount) {
      mount = document.createElement('div');
      mount.id = MOUNT_ID;
      document.body.insertBefore(mount, document.body.firstChild);
    }
    return mount;
  }

  function renderTicker(items) {
    var track = document.getElementById(TRACK_ID);
    if (!track) return;
    var itemHtml = items.map(function (item) {
      return '<span class="wpay-ticker-item">' + item.icon + ' ' + item.label +
        ' \u2014 ' + item.desc + '</span><span class="wpay-ticker-sep">\u2022</span>';
    }).join('');
    // Duplicated so the marquee loops seamlessly (translateX(-50%) lands on the copy).
    track.innerHTML = itemHtml + itemHtml;
  }

  function applyReducedMotion() {
    var track = document.getElementById(TRACK_ID);
    if (!track || !window.matchMedia) return;
    var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    var sync = function () { track.classList.toggle('wpay-ticker-paused', mq.matches); };
    sync();
    if (typeof mq.addEventListener === 'function') mq.addEventListener('change', sync);
  }

  function render() {
    injectStyles();
    var mount = getOrCreateMount();
    mount.className = (mount.className ? mount.className + ' ' : '') + 'wpay-ticker-bar';
    mount.setAttribute('aria-hidden', 'true');
    mount.innerHTML = '<div class="wpay-ticker-track" id="' + TRACK_ID + '"></div>';

    var items = (window.WPAY_TICKER_ITEMS && window.WPAY_TICKER_ITEMS.length)
      ? window.WPAY_TICKER_ITEMS
      : DEFAULT_ITEMS;

    renderTicker(items);
    applyReducedMotion();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
