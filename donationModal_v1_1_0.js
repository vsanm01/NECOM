/*!
 * DonationModal.js  v1.1.0
 * Reusable "Support Us" donation links modal library.
 * Drop into any project — zero dependencies except Font Awesome 6.
 * Companion library to SocialMediaModal.js — same theme, architecture & safety model.
 *
 * ─── QUICK START ────────────────────────────────────────────────────────────
 *
 * 1. Add Font Awesome 6 to your page (skip if already included):
 *    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
 *
 * 2. Add this script before </body>:
 *    <script src="DonationModal.js"></script>
 *
 * 3. Add a trigger button anywhere in your HTML:
 *    <button id="donateBtn">Support Us</button>
 *
 * 4. Call init() once in your JS:
 *
 *    DonationModal.init({
 *      triggerSelector: '#donateBtn',        // CSS selector for the open trigger
 *      title:           'Support Us',        // optional — header title (default: 'Support - Donate')
 *      sectionLabel:    'Choose a Platform', // optional — label above the grid (default: 'Ways You Can Support Us')
 *      links: {
 *        github:   'https://github.com/sponsors/yourusername',
 *        kofi:     'https://ko-fi.com/yourusername',
 *        patreon:  'https://patreon.com/yourusername',
 *        razorpay: 'https://razorpay.me/@yourusername',
 *        paypal:   'https://www.paypal.com/paypalme/yourusername',
 *        dodo:     'https://checkout.dodopayments.com/buy/YOUR_PRODUCT_ID',
 *        wise:     'https://wise.com/pay/business/yourusername',
 *        btc:      '1YourBitcoinAddressGoesHere',   // plain address — rendered as tap-to-copy, not a link
 *      }
 *    });
 *
 * NOTE: Only the links you provide will appear in the modal.
 *       Any key you omit or leave empty is automatically hidden.
 *       URLs must begin with https://, http://, or mailto: — anything else is
 *       silently skipped for security. The `btc` key is the one exception:
 *       it's treated as a raw wallet address and rendered as a "tap to copy"
 *       button instead of a link, since addresses aren't URLs.
 *
 * ─── MANUAL CONTROL (no triggerSelector needed) ─────────────────────────────
 *
 *    DonationModal.open();    // open programmatically
 *    DonationModal.close();   // close programmatically
 *    DonationModal.update({ links: { ... }, title: '...' }); // update without re-init
 *    DonationModal.destroy(); // remove modal, styles, and all listeners
 *    DonationModal.version;   // '1.1.0'
 *
 * ─── ALL SUPPORTED LINK KEYS (v1.1.0) ───────────────────────────────────────
 *
 *  github    kofi     patreon   razorpay
 *  paypal    dodo     wise      btc
 *
 *  More platforms (e.g. Buy Me a Coffee, Open Collective, Liberapay) can be
 *  added later by extending the ICONS array below — the rest of the library
 *  (rendering, sanitising, styling hooks) is already generic and needs no
 *  other changes.
 *
 * ────────────────────────────────────────────────────────────────────────────
 */

(function (global) {
  'use strict';

  /* ─────────────────────────────────────────────────
     VERSION
  ───────────────────────────────────────────────── */
  var VERSION = '1.1.0';

  /* ─────────────────────────────────────────────────
     ICON REGISTRY
     [ key, label, iconHtml, brandClass, kind ]
     kind: 'link' (default) renders a normal <a href>.
           'copy' renders a tap-to-copy button instead —
           use this for raw values that aren't URLs
           (e.g. crypto wallet addresses).
     To add a new platform later: add one entry here
     and one matching `.dm-<brandClass>` rule in CSS.
  ───────────────────────────────────────────────── */
  var ICONS = [
    ['github',   'GitHub',    '<i class="fa-brands fa-github"></i>', 'dm-github'],
    ['kofi',     'Ko-fi',     '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 3h16.5a3.5 3.5 0 0 1 0 7H18a5 5 0 0 1-5 5H8a6 6 0 0 1-6-6V3zm2 2v6a4 4 0 0 0 4 4h5a3 3 0 0 0 3-3V5H4zm14.5 1H18v3h.5a1.5 1.5 0 0 0 0-3zM4 18h13v2H4v-2z"/></svg>', 'dm-kofi'],
    ['patreon',  'Patreon',   '<i class="fa-brands fa-patreon"></i>', 'dm-patreon'],
    ['razorpay', 'Razorpay',  '<i class="fa-solid fa-bolt"></i>', 'dm-razorpay'],
    ['paypal',   'PayPal',    '<i class="fa-brands fa-paypal"></i>', 'dm-paypal'],
    ['dodo',     'Dodo Pay',  '<i class="fa-solid fa-cart-shopping"></i>', 'dm-dodo'],
    ['wise',     'Wise',      '<i class="fa-solid fa-money-bill-transfer"></i>', 'dm-wise'],
    ['btc',      'Bitcoin',   '<i class="fa-brands fa-btc"></i>', 'dm-btc', 'copy'],
  ];

  /* ─────────────────────────────────────────────────
     URL SANITISER
     Allowlist of safe protocols. Anything else is
     silently skipped to prevent XSS via javascript:
     or data: URIs injected into href attributes.
  ───────────────────────────────────────────────── */
  var SAFE_PROTOCOLS = ['https:', 'http:', 'mailto:'];

  function _sanitiseURL(url) {
    if (!url || typeof url !== 'string') return null;
    var trimmed = url.trim();
    if (trimmed === '') return null;
    try {
      // Resolve relative URLs against the current origin so the protocol check
      // works even when a scheme-relative URL is accidentally supplied.
      var parsed = new URL(trimmed, global.location && global.location.href);
      if (SAFE_PROTOCOLS.indexOf(parsed.protocol) === -1) {
        console.warn('[DonationModal] Skipping URL with disallowed protocol:', trimmed);
        return null;
      }
      return trimmed; // Return the original string, not the parsed form
    } catch (e) {
      console.warn('[DonationModal] Skipping invalid URL:', trimmed);
      return null;
    }
  }

  /* Basic sanity check for raw "copy" values like wallet addresses —
     just needs to be a non-empty printable string, no protocol involved. */
  function _sanitiseCopyValue(val) {
    if (!val || typeof val !== 'string') return null;
    var trimmed = val.trim();
    return trimmed === '' ? null : trimmed;
  }

  /* ─────────────────────────────────────────────────
     STYLES — matches the SocialMediaModal navy/yellow theme
  ───────────────────────────────────────────────── */
  var CSS = [
    /* Overlay */
    '#dm-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:99999;align-items:center;justify-content:center;}',
    '#dm-overlay.dm-active{display:flex;}',
    /* Modal card */
    '#dm-modal{position:relative;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;width:440px;max-width:95vw;border-radius:14px;overflow:visible;box-shadow:0 8px 32px rgba(0,0,0,.28);}',
    /* Header */
    '#dm-header{background:#1a2744;border-bottom:3px solid #ffd400;border-radius:14px 14px 0 0;display:flex;align-items:center;justify-content:space-between;padding:6px 12px;overflow:hidden;}',
    '#dm-header-left{display:flex;align-items:center;gap:8px;}',
    '#dm-header-icon{color:#ffd400;font-size:15px;display:flex;align-items:center;}',
    '#dm-header-title{color:#fff;font-size:15px;font-weight:800;letter-spacing:.4px;}',
    '#dm-header-title span{font-weight:400;}',
    /* Close button — floats over the top-right corner of the modal */
    '#dm-close-btn{position:absolute;top:-14px;right:-14px;background:#ffd400;border:2.5px solid #1a2744;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;color:#1a2744;cursor:pointer;transition:background .25s ease,border-color .25s ease,color .25s ease;padding:0;z-index:10;box-shadow:0 2px 6px rgba(0,0,0,.25);}',
    '#dm-close-btn:hover,#dm-close-btn:focus-visible{background:#1a2744;border-color:#ffd400;color:#ffd400;}',
    '#dm-close-btn svg{width:15px;height:15px;transition:transform .25s ease;}',
    '#dm-close-btn svg line{stroke:currentColor;stroke-width:3;stroke-linecap:round;}',
    '#dm-close-btn:hover svg,#dm-close-btn:focus-visible svg{transform:rotate(60deg);}',
    /* Body */
    '#dm-body{background:#f0f2f5;padding:8px 8px 8px;border-radius:0 0 14px 14px;overflow:hidden;}',
    '#dm-section-label{text-align:center;font-size:11px;font-weight:700;color:#374151;letter-spacing:.3px;padding:4px 0 6px;}',
    /* Grid box */
    '#dm-grid-box{background:#fff;border:2.5px solid #1a2744;border-radius:12px;padding:10px 8px;}',
    '#dm-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px 6px;}',
    /* Responsive: collapse to fewer columns on very narrow viewports */
    '@media(max-width:340px){#dm-grid{grid-template-columns:repeat(3,1fr);}}',
    '@media(max-width:260px){#dm-grid{grid-template-columns:repeat(2,1fr);}}',
    '.dm-item{display:flex;flex-direction:column;align-items:center;gap:4px;text-decoration:none;background:none;border:none;font-family:inherit;cursor:pointer;padding:0;}',
    '.dm-item:hover .dm-item-label{color:#1a2744;text-decoration:underline;text-decoration-color:#ffd400;text-underline-offset:2px;text-decoration-thickness:2px;}',
    '.dm-icon{width:46px;height:46px;border-radius:50%;background:#fff;border:2px solid;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform .2s;margin:0 auto;}',
    '.dm-icon:hover{transform:scale(1.12);}',
    '.dm-icon i{font-size:19px;}',
    '.dm-icon svg{width:19px;height:19px;}',
    '.dm-item-label{font-size:9px;color:#374151;font-weight:600;text-align:center;line-height:1.2;text-decoration:none;}',
    /* Brand colors */
    '.dm-github{color:#181717;border-color:#181717}',
    '.dm-kofi{color:#ff5e5b;border-color:#ff5e5b}',
    '.dm-patreon{color:#ff424d;border-color:#ff424d}',
    '.dm-razorpay{color:#0c2451;border-color:#0c2451}',
    '.dm-paypal{color:#003087;border-color:#003087}',
    '.dm-dodo{color:#6d28d9;border-color:#6d28d9}',
    '.dm-wise{color:#163300;border-color:#9fe870}',
    '.dm-btc{color:#f7931a;border-color:#f7931a}',
    /* powered-by footer — matches SocialMediaModal */
    '.dm-powered{display:flex;align-items:center;justify-content:center;gap:6px;padding:8px 0 2px;font-family:Arial,sans-serif;}',
    '.dm-powered-label{font-size:11px;color:#b0b8cc;font-style:italic;}',
    '.dm-powered-badge{display:inline-flex;align-items:center;gap:3px;background:#ffd400;color:#1a2744;font-size:10px;font-weight:700;padding:1px 6px 1px 3px;border-radius:4px;text-decoration:none;transition:background .2s;}',
    '.dm-powered-badge:hover{background:#ffb700;}',
    '.dm-powered-badge img{width:13px;height:13px;border-radius:3px;object-fit:cover;display:block;}',
  ].join('');

  function injectFontAwesome() {
    if (document.querySelector('link[href*="font-awesome"]')) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css';
    document.head.appendChild(l);
  }

  /* ─────────────────────────────────────────────────
     INJECT CSS (once)
  ───────────────────────────────────────────────── */
  function injectCSS() {
    if (document.getElementById('dm-styles')) return;
    var s = document.createElement('style');
    s.id = 'dm-styles';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ─────────────────────────────────────────────────
     TITLE HTML HELPER
     Both default and custom titles are returned as
     consistently formatted HTML so styling stays uniform.
  ───────────────────────────────────────────────── */
  function _titleHTML(title) {
    if (title) {
      // Escape the custom title to prevent XSS via the title option
      var escaped = String(title)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
      return escaped;
    }
    return 'Support <span>- Donate</span>';
  }

  /* ─────────────────────────────────────────────────
     BUILD MODAL SHELL (once)
  ───────────────────────────────────────────────── */
  function buildModal(title, sectionLabel) {
    var existing = document.getElementById('dm-overlay');
    if (existing) existing.parentNode.removeChild(existing);

    var overlay = document.createElement('div');
    overlay.id = 'dm-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'dm-header-title');
    overlay.setAttribute('aria-hidden', 'true');

    overlay.innerHTML = [
      '<div id="dm-modal">',
        '<button id="dm-close-btn" type="button" aria-label="Close">',
          '<svg viewBox="0 0 24 24"><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/></svg>',
        '</button>',
        '<div id="dm-header">',
          '<div id="dm-header-left">',
            '<span id="dm-header-icon"><i class="fa-solid fa-heart"></i></span>',
            '<div id="dm-header-title">' + _titleHTML(title) + '</div>',
          '</div>',
        '</div>',
        '<div id="dm-body">',
          '<div id="dm-section-label">' + _escapeHTML(sectionLabel || 'Ways You Can Support Us') + '</div>',
          '<div id="dm-grid-box">',
            '<div id="dm-grid"></div>',
          '</div>',
          '<div class="dm-powered">' +
            '<span class="dm-powered-label">Powered by</span>' +
            '<a class="dm-powered-badge" href="https://wagsone.blogspot.com" target="_blank" rel="noopener noreferrer">' +
            '<img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbDpzcGFjZT0icHJlc2VydmUiIHZpZXdCb3g9IjE3NS45NiAzMTEuMjcgNjk5LjI4IDY5OC45NiI+PHBhdGggZmlsbD0iIzFhMjc0NCIgZD0iTTE3NiA2NzJWMzExLjNoNjk5LjJ2Njk5SDE3NnptNDI4LjItMzM4LjlhMjY3IDI2NyAwIDAgMC02OC05LjFjLTIyLjItLjctNDQuMiAxLjktNjUuOCA2LjZhMzMxIDMzMSAwIDAgMC05My4zIDM1LjggMzQxIDM0MSAwIDAgMC0xMDEuNiA4OCAzMzggMzM4IDAgMCAwLTU3LjggMTEzLjIgMjg2IDI4NiAwIDAgMC0xMi40IDcwLjRjLS42IDIwLjMuNCA0MC42IDEuOCA2MC44IDEuNSAyMi43IDcgNDQuNyAxNC4yIDY2LjJhMzQxIDM0MSAwIDAgMCAzOCA3OWMxIDEuNiAyIDQuMiAxLjQgNmE0MTYgNDE2IDAgMCAxLTcuNSAyMy41bC0xNy4xIDQ5cS02LjIgMTguOC0xMiAzNy41Yy0uNiAxLjYtLjUgMy41LS43IDUuMiAxLjguMiAzLjcuNyA1LjMuM2wxOC01LjQgMjUuMi04IDI5LjYtMTBjOS45LTMuMiAxOS45LTYgMjkuNy05LjMgNS0xLjcgOS4zLTIuMyAxMy45IDEuNXE3LjYgNS45IDE1LjkgMTFhMzA0IDMwNCAwIDAgMCA2NC41IDMyLjVBMjk0IDI5NCAwIDAgMCA1MzggOTk3LjJjMTAuNi0uOCAyMS4zLTEgMzEuOS0yLjNhMzE0IDMxNCAwIDAgMCAxMTUuOS0zOC41cTc1LjgtNDIuNSAxMjIuMy0xMTYuMWEzMjggMzI4IDAgMCAwIDUyLjEtMTg5LjcgMzM2IDMzNiAwIDAgMC0xMi4yLTc5LjhBMzM4IDMzOCAwIDAgMCA3NzIuMiA0MzRhMzM1IDMzNSAwIDAgMC0xNDQuOS05NC41Yy03LjQtMi41LTE1LTMuOS0yMi42LTUuN3oiLz48cGF0aCBmaWxsPSIjMTg5YzBmIiBkPSJNNTM3LjEgOTk3LjJoLTEyLjJjLTM0LjQtLjItNjcuMy03LjgtOTkuNC0xOS40YTMwNCAzMDQgMCAwIDEtNjQuNS0zMi40Yy01LjQtMy42LTExLTctMTYtMTEuMS00LjUtMy44LTguOC0zLjItMTMuOC0xLjUtOS44IDMuMy0xOS44IDYuMS0yOS43IDkuM2wtMjkuNiAxMC0yNS4zIDhxLTkgMi45LTE4IDUuNGMtMS41LjQtMy40LS4xLTUuMi0uMy4yLTEuNy4xLTMuNi42LTUuMnE1LjktMTguOCAxMi4xLTM3LjRsMTcuMS00OS4xcTQuMS0xMS43IDcuNS0yMy41Yy41LTEuOC0uNC00LjQtMS41LTZhMzQxIDM0MSAwIDAgMS0zOC03OWMtNy0yMS41LTEyLjYtNDMuNS0xNC4xLTY2LjFhNjAwIDYwMCAwIDAgMS0xLjgtNjAuOGMuOC0yNCA1LjYtNDcuNSAxMi40LTcwLjZhMzM4IDMzOCAwIDAgMSA1Ny44LTExM0EzNDEgMzQxIDAgMCAxIDM3NyAzNjYuM2EzMzEgMzMxIDAgMCAxIDkzLjQtMzUuOGMyMS42LTQuNyA0My42LTcuMyA2Ni4zLTZxLjYgNC43IDAgOC45aC02OVYzOTZoN3EzMSAwIDYyLjMuNi4xIDEuNi0uMiAyLjljLTEzLjcuNS0yNyAuMi00MC4yIDEuNS0yOC43IDIuNy01NiAxMS4xLTgyIDIzLjdBMjU1IDI1NSAwIDAgMCAzMTAgNTE3LjZhMjU5IDI1OSAwIDAgMC00MS42IDEyNCAyNTkgMjU5IDAgMCAwIDguNCA4Ny41QTI2MSAyNjEgMCAwIDAgMzU2IDg1Ny42YTI0NyAyNDcgMCAwIDAgNzMuNCA0NS42YzIxLjQgOC42IDQzLjMgMTUgNjYuNCAxNi45IDEzLjcgMSAyNy41IDEuMyA0MS4zIDIuM3EuMSAxLS40IDEuOC0zNC4yLjMtNjcuOC4ydjYyLjRoNi4zcTMxIDAgNjIgLjd6bS0yNDQuOC05OC44IDcuOC0xLjMuNi0yLjItOC02LjhjLS4zIDQtLjcgNy0uNCAxMC4zIi8+PHBhdGggZmlsbD0iI2ViNjMwZiIgZD0iTTUzNy4xIDkyNHEtLjEtLjUuNC0xLjdjOC40LTEuMSAxNi40LTEuNCAyNC4zLTIuNiA2OC0xMC43IDEyNC4xLTQyLjMgMTY2LjItOTcgNTIuMi02OCA2Ny4zLTE0NC41IDQ3LjMtMjI3LjRBMjUzIDI1MyAwIDAgMCA2OTQuNyA0NjNhMjQ4IDI0OCAwIDAgMC05Ny4zLTUzLjNjLTE0LjItNC0yOS02LjItNDMuNS05LjVhNiA2IDAgMCAwLTIuMy0uMSA2NCA2NCAwIDAgMS04LjctLjhsLTQuNS0zIDY2LjMtLjF2LTYyLjRjNy41IDEuOCAxNS4yIDMuMiAyMi42IDUuN0EzMzUgMzM1IDAgMCAxIDc3Mi4yIDQzNCAzMzggMzM4IDAgMCAxIDg0OCA1NzAuOGEzMzYgMzM2IDAgMCAxIDEyLjIgNzkuOCAzMjggMzI4IDAgMCAxLTUyLjEgMTg5LjcgMzM4IDMzOCAwIDAgMS0xMjIuMyAxMTYgMzE0IDMxNCAwIDAgMS0xMTYgMzguNmMtMTAuNSAxLjMtMjEuMiAxLjUtMzIuMiAyLjNhMzUgMzUgMCAwIDEgMC05LjhjMjIuOS0uNSA0NS4zLS41IDY4LS41di02Mi41aC02eiIvPjxwYXRoIGZpbGw9IiNmMmY5ZjEiIGQ9Ik02MDQuNyAzMzMuOFYzOTZoLTY2LjVsLTEuMS4zLTYyLjUtLjNoLTYuOXYtNjIuNUg1MzdsNjcuNi4ybS04MiAzNy4zaDUuNHE0LjkuNiA0LjMtNC4yYy0uMi0xLjYuMy0zLjQtLjEtNS0uMy0xLTEuNS0yLjQtMi4zLTIuNHEtMTEuNC0uMi0yMy42LS4xYzAgMi40LjIgNCAwIDUuNy0uNyA0LjYuOSA2LjcgNS44IDYgMy4xLS4zIDYuMyAwIDEwLjUgMG01Ny4yIDBoMTcuNGMyLjggMCA0LS44IDMuOC0zLjctLjEtMS44LjMtMy43LS4xLTUuNC0uMi0xLTEuNS0yLjUtMi4zLTIuNXEtMTEuNi0uMi0yMy42IDAgLjIgNC41IDAgOGMtLjMgMyAxLjIgMy45IDQuOCAzLjZNNTMyIDM0MC45Yy0uNy0uNi0xLjUtMS41LTIuMi0xLjYtNyAwLTE0LS4zLTIxIDAtNC43LjItMi4zIDQuMi0yLjYgNi42LS4zIDIuMi0uOCA1IDMgNC44aDE0YzEwLS4xIDguOCAxLjcgOC44LTkuOG0tNjAuOCA0LjZjLjMgMi0xLjEgNS4xIDIuNyA1LjJoMjNWMzQwcS0xLS41LTEuNi0uNi05LjUuMi0xOS0uMmMtNC4yLS4yLTUuNyAxLjQtNS4xIDYuM204Ni4xIDUuM2M5LjYgMCAxMC41LTEuMSA3LjctMTEuNWgtMjJjLTQuNS4yLTIuOCAzLjgtMyA2IDAgMi4zLTEuMSA1LjUgMyA1LjV6bTQyLjQtLjMgMS05YzAtLjctMS41LTItMi4zLTJxLTExLjYtLjItMjMuMy0uMXYxMS40YzguMSAwIDE2IDAgMjQuNi0uM20tMzcuNyA4LjloLTE0LjljLTcuNSAwLTcuNCAwLTcuMyA3LjdxLS4xIDQuMyA0LjEgNGwxNy40LS4xYzEuNiAwIDQuNS0xLjcgNC40LTIuMS0uNy0zLjIgMy03LjktMy43LTkuNW0tOTAuNyA5LjdjMS4zLjcgMi42IDEuOCA0IDEuOXE2LjUuMiAxMi45LjFjOS44IDAgOS44IDAgOS05LjhxLS4yLS44LS42LTEuNGwtMS40LS40cS03LjctLjItMTUuNC0uMWMtOS42IDAtOC42LTEuNC04LjUgOS43bTczLjMgMTFjLTYtLjktNC40IDMuNS00LjcgNi44LS40IDMuNyAxLjQgNC40IDQuNyA0LjNxOS0uMiAxOCAwYzUgMCAzLTMuNyAzLjMtNi4xcy43LTUuMi0zLjQtNXptMzcuOSAxMWM1IDAgMTAgLjMgMTUgMCAxLjEtLjIgMy4yLTIgMy4xLTMtLjEtMi43LTEtNy41LTEuOC03LjYtNy45LS42LTE1LjgtLjQtMjMuNi0uNHYxMXptLTUzLjQgMGM1LjctMS4yIDItNS42IDIuOC04LjUgMC0uNS0yLjctMi4zLTQuMi0yLjQtNi0uMy0xMiAwLTE4LS4yLTQuOCAwLTMuNSAzLjMtMy42IDUuOSAwIDIuNi0uOCA1LjUgMy43IDUuM3E4LjgtLjIgMTkuMyAwbS0zNSAwYzYtMS4xIDItNS42IDIuOS04LjUuMS0uNS0yLjYtMi40LTQtMi41LTUuOC0uMy0xMS42LjEtMTcuNC0uMi00LjgtLjMtNC40IDIuNi00LjQgNS43LS4xIDMuNCAwIDUuOCA0LjYgNS42IDUuOC0uNCAxMS42LS4xIDE4LjQtLjEiLz48cGF0aCBmaWxsPSIjZWI2MzBmIiBkPSJNNjA0LjQgMzMzLjVxLTMzIC4zLTY3IDBhNjggNjggMCAwIDEtLjMtOXEzNC4xLS40IDY3LjMgOSIvPjxwYXRoIGZpbGw9IiMxYTI3NDQiIGQ9Im01NDMgMzk5LjYgMTEgLjhjMTQuNSAzIDI5LjIgNS4zIDQzLjQgOS4zYTI0OCAyNDggMCAwIDEgOTcuMyA1My4zYzQwLjQgMzUuOCA2OCA3OS45IDgwLjYgMTMyLjMgMjAgODMgNSAxNTkuNC00Ny4zIDIyNy40LTQyIDU0LjctOTguMiA4Ni4zLTE2Ni4yIDk3LTcuOSAxLjItMTUuOSAxLjUtMjQuMyAyLjMtMTQuMi0uNi0yOC0uOC00MS43LTItMjMtMS43LTQ1LTguMi02Ni40LTE2LjhhMjQ3IDI0NyAwIDAgMS03My40LTQ1LjYgMjYxIDI2MSAwIDAgMS03OS4zLTEyOC41IDI1OSAyNTkgMCAwIDEtOC4zLTg3LjUgMjU5IDI1OSAwIDAgMSA0MS41LTEyNCAyNTUgMjU1IDAgMCAxIDEwNC43LTkyLjggMjQxIDI0MSAwIDAgMSA4Mi0yMy43YzEzLjItMS4zIDI2LjUtMSA0MC42LTEuNHptLTQ0LjcgMTk3LjFxLTEwLjUgNDAuNi0yMiA4MC41bC0zLTQuNS0zOS40LTY3LjhjLTQuNS03LjctMTAuNy0xMi42LTE5LjktMTIuOS05LS4yLTE2LjMgMy42LTIxIDExLjMtNSA4LjItNC40IDE2LjcuNCAyNWw0Ny40IDgxLjYgMjMuMyA0MGEyMiAyMiAwIDAgMCAyMy41IDEwLjZjMTEtMi40IDE3LjktOS40IDE5LjMtMTkuNiAxLjQtMyAzLjEtNiA0LTkgNy4xLTI2LjEgMTQtNTIuMyAyMS43LTc4LjJxMSAuOSAxLjYgMS45YzEwLjcgMTguMyAyMS43IDM2LjUgMzIgNTUgNS44IDEwLjMgMTUuNyAxMy43IDI2LjEgMTIuMSA4LTEuMiAxNS45LTEwLjEgMTgtMjAuMiAxLjItMi45IDMtNS42IDMuNy04LjZhMjAwMzkgMjAwMzkgMCAwIDAgMzYtMTM2LjIgMjMuMyAyMy4zIDAgMCAwLTIzLjYtMjkuNWMtOS40LjEtMTguNCA3LjEtMjEuMyAxNy40cS01LjEgMTguNS05LjkgMzctNy40IDI4LjYtMTUuOSA1Ni40LTEuOC0yLTMuMy00LjNMNTM2IDU2NmMtNi43LTExLjUtMTktMTQuOC0zMC45LTguNmEyMyAyMyAwIDAgMC0xMC4yIDMwLjMgNjcgNjcgMCAwIDEgMy40IDkuMSIvPjxwYXRoIGZpbGw9IiNmMmY5ZjEiIGQ9Ik01MzYuNyA5MjQuMnEzMS43IDAgNjIuOS4yaDZ2NjIuNUg0NjguOXYtNjIuNXptLTM4IDM0Ljh2LTlxLTExLjguMi0yMi4zIDBjLTQuNS0uMy00LjEgMi42LTQgNS40LjEgMy0xLjIgNi42IDQuMiA2LjRsMTcuOS0uMWMxLjQgMCAyLjctMS4yIDQuMS0yLjdtOC43LS45YzEuMSAxLjIgMi4yIDMuNCAzLjQgMy41cTkuOC40IDE5LjQgMGMxLjIgMCAzLTEuOCAzLjMtMyAuNS0yLjcuMS01LjUuMS04LjJoLTI2LjJ6TTQ5NyA5ODEuOHExLTMgMS43LTYuMmMuOC00LjItMS4xLTUuNS01LjItNS4zcS04LjUuNS0xNyAwYy01LS4xLTMuOSAzLjMtNCA2LjJzLS4zIDUuNiA0LjIgNS40YzYuNC0uMyAxMi45IDAgMjAuMy0uMW0xNS0xMS40Yy02LjQtLjYtNC4yIDQuMi00LjYgNy40LS41IDQgMiA0LjIgNSA0aDE3LjRjNC42LjMgMy44LTMgMy44LTUuNnMxLTYtMy43LTUuOHptMjkuMS0xNi43YzAgOCAwIDggOCA4aDguNWMxMC44IDAgMTAuOCAwIDkuMy0xMC44bC0uOS0uOS0yMi4yLjFjLTEgMC0xLjggMS43LTIuNyAzLjZtNTIuMyA4YzkuNiAwIDEwLjItLjggOC0xMS4zSDU3NnEuMiAzLjcgMCA2LjgtLjYgNSA0LjUgNC42YzQtLjIgOCAwIDEyLjkgMG0tOTUuNi0zMS4zcS0xMS4zLS40LTIyLjQtLjRjLTQuOCAwLTIuNiA0LTMgNi40LS4yIDIuNC0uMiA0LjggMy40IDQuNmgxNGM5LjYgMCA5LjYgMCA4LTEwLjZtNzguNSA5LjYgMjUuNyAxLjNjMC0zLjcuMi02LjIgMC04LjctLjItMS0xLjUtMi41LTIuMy0yLjVxLTExLjUtLjItMjMuNi0uMWMwIDMuNSAwIDYuMy4yIDEwbS05LjMgNDBjMC0yLjEuNC00LjMgMC02LjQtLjItMS4xLTEuNy0yLjktMi43LTNxLTEwLjItLjMtMjAuMy4xYy0xIDAtMi43IDIuNi0yLjcgNCAwIDIuNC0yIDYuNiAyLjMgNi44cTExLjUuNCAyMy40LTEuNG0yOC40LTkuNWgtMTl2MTEuMWgyM2MuOCAwIDItLjYgMi4xLTEgLjItMyAuNi02IDAtOC44IDAtLjctMy4zLTEtNi0xLjRNNTY1LjEgOTQxYzQtMy4xIDEuMS03IDEuOC0xMWgtMTcuMmMtOS4zIDAtOS4zIDAtOC41IDkuM3EuMS43LjggMS44ek01MTEgOTMwYy00IDEtNC43IDMuOC0yLjcgMTAuNmgyNS4xcS0uMi0zIDAtNS4zYy43LTQuNS0xLjMtNS43LTUuNS01LjQtNS4zLjMtMTAuNyAwLTE2LjkgMCIvPjxwYXRoIGZpbGw9IiMxODljMGYiIGQ9Ik0yOTIgODk4LjJjMC0zLjIuNC02IC44LTEwbDcuOSA2LjYtLjYgMi4zcS0zLjguNy04LjEgMSIvPjxwYXRoIGZpbGw9IiNlYjYzMGYiIGQ9Ik01NDIuOSAzOTkuM3EtMi4zLjQtNS4zLjNhNiA2IDAgMCAxLS42LTIuOXEuMy0uNS44LS40em0xMSAuOXEtLjYuMy0xLjcgMCAuNi0uMyAxLjcgMCIvPjxwYXRoIGZpbGw9IiMxODljMGYiIGQ9Ik01MjIgMzcxYy0zLjcgMC02LjkuMy0xMCAwLTQuOS43LTYuNS0xLjQtNS45LTYgLjMtMS43IDAtMy4zIDAtNS43aDIzLjdjLjguMSAyIDEuNiAyLjMgMi41LjQgMS42IDAgMy4zLjEgNXEuNiA0LjgtNC4zIDQuMnoiLz48cGF0aCBmaWxsPSIjMTg5YzBmIiBkPSJNNTc5LjIgMzcxYy0zLjEuMy00LjYtLjYtNC4zLTMuNnYtOC4xbDIzLjYuMWMuOCAwIDIgMS41IDIuMyAyLjUuNCAxLjcgMCAzLjYuMSA1LjQuMyAzLTEgMy44LTMuOCAzLjd6Ii8+PHBhdGggZmlsbD0iIzE4OWMwZiIgZD0iTTUzMi4yIDM0MS4zYzAgMTEgMS4xIDkuMy05IDkuNGgtMTMuOWMtMy44LjEtMy4zLTIuNy0zLTQuOC4zLTIuNC0yLTYuNCAyLjctNi42cTEwLjUtLjMgMjAuOSAwYy43IDAgMS41IDEgMi4zIDJtLTYxIDMuN2MtLjYtNC41IDEtNi4xIDUuMi01LjlxOS41LjQgMTkgLjIuNiAwIDEuNi42djEwLjhoLTIzYy0zLjggMC0yLjQtMy4yLTIuNy01LjdtODUuNiA1LjdINTQzYy00LjEgMC0zLTMuMy0zLTUuNS4xLTIuMy0xLjUtNS45IDMtNmgyMi4xYzIuNyAxMC40IDIgMTEuNS04LjIgMTEuNW00Mi40LS4xaC0yNHYtMTEuM2gyMy4yYy44IDAgMi4zIDEuNCAyLjIgMnEtLjEgNC41LTEuNCA5LjMiLz48cGF0aCBmaWxsPSIjMTg5YzBmIiBkPSJNNTYyLjYgMzU5LjNjNi4zIDEuNiAyLjUgNi4zIDMuMiA5LjUgMCAuMy0yLjggMi00LjQgMi01LjguMy0xMS42IDAtMTcuNC4yLTMgMC00LTEtNC00LS4yLTcuNy0uMy03LjcgNy4yLTcuOHptLTkxLjMgOS4yYzAtMTAuNi0xLTkuMSA4LjYtOS4yaDE1LjRxLjguMSAxLjQuNS40LjguNSAxLjRjLjkgOS44LjkgOS44LTkgOS44cS02LjMuMS0xMi44LS4xYy0xLjQtLjEtMi43LTEuMy00LTIuNCIvPjxwYXRoIGZpbGw9IiMxODljMGYiIGQ9Ik01NDUuMiAzODBoMTcuNGM0LjEtLjIgMy42IDIuNiAzLjQgNXMxLjYgNi4xLTMuNCA2bC0xNy45LjFjLTMuMy4xLTUuMS0uNi00LjctNC40LjMtMy4yLTEuMy03LjYgNS4yLTYuNyIvPjxwYXRoIGZpbGw9IiMxODljMGYiIGQ9Ik01ODIgMzkxaC02Ljd2LTExYzcuOCAwIDE1LjctLjIgMjMuNi40LjggMCAxLjcgNC45IDEuOCA3LjUgMCAxLTIgMy0zLjEgM3EtNy40LjMtMTUuNS4yIi8+PHBhdGggZmlsbD0iIzE4OWMwZiIgZD0iTTUyOC44IDM5MXEtOS45LS4xLTE5IC4xYy00LjQuMi0zLjYtMi44LTMuNi01LjMuMS0yLjYtMS4yLTYgMy43LTUuOSA2IC4yIDEyLS4xIDE3LjkuMiAxLjUgMCA0LjMgMS45IDQuMiAyLjQtLjcgMi45IDIuOSA3LjMtMy4zIDguNSIvPjxwYXRoIGZpbGw9IiMxODljMGYiIGQ9Ik00OTMuOCAzOTFxLTkuMy0uMi0xNy45LjJjLTQuNS4yLTQuNy0yLjItNC42LTUuNiAwLTMtLjQtNiA0LjQtNS43IDUuOC4zIDExLjYtLjEgMTcuNC4yIDEuNCAwIDQuMSAyIDQgMi41LS44IDIuOCAzIDcuNC0zLjMgOC41Ii8+PHBhdGggZmlsbD0iIzQxODNlZiIgZD0ibTU4MCA2MzkuNSAxNS4yLTU2LjdxNC44LTE4LjYgOS45LTM3YzMtMTAuMyAxMi0xNy40IDIxLjQtMTcuNCAxMSAwIDIwLjMgNi4yIDIzLjMgMTYuN2EyNSAyNSAwIDAgMSAuMiAxMi43QTIwMDM5IDIwMDM5IDAgMCAxIDYxNCA2OTRjLS44IDMtMi41IDUuNy00LjIgOS04LjYgOS4xLTE5LjggMTEtMjkuOCA1LjYtOS40LTUuMS0xMy43LTE1LjMtMTAuOS0yNi45em01Mi43LTgwLjZxLTEuNS0xLjMtMy4xLTIuNGMtNS44LTMtMTIuOS0xLjctMTYuNyAzLjJhMTQgMTQgMCAwIDAgLjcgMTcuOSAxMyAxMyAwIDAgMCAxNi44IDJjNi4zLTQuMSA3LjYtMTMgMi4zLTIwLjdtLTI1LjEgMTE4cS0uMi0xLjUtLjctM2MtMi01LjYtOC4xLTkuNC0xNC4xLTguOHMtMTAuNiA2LTExLjUgMTIuN2MtLjcgNS42IDMgMTEgOC42IDEzLjIgOCAzLjIgMTcuNy0yLjIgMTcuNy0xNC4xIi8+PHBhdGggZmlsbD0iI2U1NDIzNCIgZD0iTTUwNi42IDc0MS42Yy0xLjEgOS42LTggMTYuNi0xOSAxOS04LjcgMi0xOC43LTIuNC0yMy41LTEwLjVMNDQwLjggNzEwbC00Ny40LTgxLjZjLTQuOC04LjMtNS40LTE2LjgtLjMtMjVBMjMgMjMgMCAwIDEgNDE0IDU5MmM5LjIuMyAxNS41IDUuMiAyMCAxM3ExOS41IDMzLjggMzkuMyA2Ny43bDMuMyA1cS01LjQgMjItMTEgNDMuM2EyMyAyMyAwIDAgMCAxNi4zIDI3YzkuNiAyLjggMTcuNi0uMiAyNC43LTYuNW0tODgtOTguNmM1LjcgMS45IDEwLjMtLjMgMTMuOC00LjVxNS4yLTYuNyAxLTE0LjVhMTMgMTMgMCAwIDAtMTMuMS03LjJjLTYgLjUtMTAuNCA0LjYtMTEuNCAxMC43cS0xLjkgMTAuMiA5LjggMTUuNSIvPjxwYXRoIGZpbGw9IiMxODljMGYiIGQ9Ik01NzkuNiA2MzkuM3EtNS4xIDIxLjMtMTAuNSA0Mi40Yy0yLjggMTEuNiAxLjUgMjEuOCAxMC45IDI2LjkgMTAgNS41IDIxLjIgMy41IDI5LjctNS4yLTEuNSA5LjMtOS4zIDE4LjItMTcuMyAxOS40LTEwLjUgMS42LTIwLjQtMS44LTI2LjItMTJxLTE1LjYtMjcuOC0zMi01NS4xLS41LTEtMi0yLjNjLTMtNS40LTUuMy0xMC41LTguMS0xNS40bC0xOS4zLTMzYy0xLjktMy4xLTQuMy02LTYuNC05bC0zLjUtOC4zYTIzIDIzIDAgMCAxIDEwLjMtMzAuM2MxMS45LTYuMiAyNC4xLTIuOSAzMC45IDguNmw0MCA2OC44cTEuMyAyLjMgMy41IDQuNU01MzggNTk1cS4yLTIgMC00Yy0xLTcuMy03LTEyLjUtMTQtMTJhMTMgMTMgMCAwIDAtMTIuMSAxMy44Yy4xIDYuMiA0LjUgMTEuOSAxMC4zIDEzIDYuNSAxLjIgMTMuNi0yLjIgMTUuOC0xMC44Ii8+PHBhdGggZmlsbD0iI2UyYjk2MCIgZD0iTTQ5OC4zIDU5Ni40YTY1IDY1IDAgMCAxIDYuNSA4LjdsMTkuMyAzM3E0IDcuMyA3LjggMTUuMWwtMjEgNzguN2MtLjkgMy4yLTIuNiA2LjEtNC4xIDkuNC03LjQgNi42LTE1LjMgOS42LTI1IDYuOWEyMyAyMyAwIDAgMS0xNi4yLTI3cTUuNS0yMS41IDExLjMtNDMuMXptNSAxMTQuM3EtLjYtMS40LTEuNS0yLjZhMTMgMTMgMCAwIDAtMTQuNi00LjhjLTUuMiAxLjYtOS4yIDcuNS05LjIgMTMuNSAwIDUuNCAzLjYgMTAgOSAxMS45IDEwLjYgMy41IDE4LjgtNC45IDE2LjQtMTgiLz48cGF0aCBmaWxsPSIjMTg5YzBmIiBkPSJNNDk4LjYgOTU5LjVjLTEuNCAxLTIuOCAyLjEtNC4xIDIuMi02IC4yLTEyLS4xLTE3LjkuMS01LjQuMi00LTMuNS00LjItNi40LS4xLTIuOC0uNS01LjcgNC01LjUgNy4xLjMgMTQuMi4xIDIyLjIuMXoiLz48cGF0aCBmaWxsPSIjMTg5YzBmIiBkPSJNNTA3LjMgOTU3Ljd2LTcuM2gyNi4yYzAgMi43LjQgNS41LS4xIDguMi0uMyAxLjItMi4xIDMtMy4zIDNxLTkuOC40LTE5LjQgMGMtMS4yIDAtMi4zLTIuMy0zLjQtNCIvPjxwYXRoIGZpbGw9IiMxODljMGYiIGQ9Ik00OTYuNCA5ODEuOHEtMTAuMy0uMi0xOS45LjFjLTQuNC4yLTQuMi0yLjUtNC4xLTUuNHMtMS02LjMgNC02LjFxOC41LjQgMTcgMGM0LS4zIDYgMSA1LjIgNS4yYTI0IDI0IDAgMCAxLTIuMiA2LjIiLz48cGF0aCBmaWxsPSIjMTg5YzBmIiBkPSJNNTEyLjQgOTcwLjRxOSAuMiAxNy40IDBjNC42LS4xIDMuOCAzIDMuNyA1LjhzLjggNS45LTMuOSA1LjdxLTguNy0uMi0xNy40IDBjLTMgMC01LjQtLjItNC45LTQuMS40LTMuMi0xLjgtOCA1LjEtNy40Ii8+PHBhdGggZmlsbD0iIzE4OWMwZiIgZD0iTTU0MS4xIDk1My4yYzEtMS40IDEuOC0zIDIuNy0zcTExLjUtLjMgMjIuMi0uMi45LjkuOCAxYzEuNiAxMC43IDEuNiAxMC43LTkuMiAxMC43SDU0OWMtOCAwLTgtOC04LTguNSIvPjxwYXRoIGZpbGw9IiMxODljMGYiIGQ9Ik01OTIuOSA5NjEuOHEtNi42LS4yLTEyLjQgMC01LjEuNS00LjUtNC42LjItMy4xIDAtNi44aDI1LjNjMi4zIDEwLjUgMS43IDExLjMtOC40IDExLjMiLz48cGF0aCBmaWxsPSIjMTg5YzBmIiBkPSJNNDk4IDkzMC44YzEuNCAxMC4zIDEuNCAxMC4zLTguMyAxMC4zaC0xNGMtMy42LjEtMy41LTIuMy0zLjItNC42LjMtMi40LTEuOS02LjQgMy02LjRhMzAzIDMwMyAwIDAgMSAyMi41LjciLz48cGF0aCBmaWxsPSIjMTg5YzBmIiBkPSJtNTc2LjIgOTM5LjctLjEtOS42aDIzLjZjLjguMSAyIDEuNyAyLjIgMi42LjMgMi41LjEgNSAuMSA4LjdxLTEzLjEtLjUtMjUuOC0xLjdtLTkuMyA0MC45cS0xMS44IDEuMy0yMy4zIDFjLTQuMy0uMi0yLjItNC40LTIuMy02LjggMC0xLjQgMS42LTQgMi42LTRxMTAuMi0uNCAyMC40IDBjMSAwIDIuNCAxLjggMi43IDMgLjQgMiAwIDQuMi0uMSA2LjhtMjktMTBjMi4zLjUgNS41LjYgNS42IDEuNC42IDIuOC4yIDUuOSAwIDguOCAwIC40LTEuNCAxLTIgMWgtMjMuMXYtMTEuMnpNNTY0LjcgOTQxSDU0MnEtLjctMS0uNy0xLjdjLS44LTkuMy0uOC05LjMgOC41LTkuM0g1NjdjLS42IDQgMi40IDcuOS0yLjIgMTFtLTUzLjMtMTFjNS43IDAgMTEgLjMgMTYuNCAwIDQuMi0uMyA2LjMuOSA1LjYgNS40LS4zIDEuNiAwIDMuMyAwIDUuM2gtMjUuMmMtMi02LjgtMS4zLTkuNyAzLjItMTAuNyIvPjxwYXRoIGZpbGw9IiMwMDAwMDAiIGQ9Ik02MzIuOSA1NTkuMWM1IDcuNiAzLjcgMTYuNC0yLjYgMjAuNGExMyAxMyAwIDAgMS0xNi44LTIgMTQgMTQgMCAwIDEtLjctMTcuOGMzLjgtNC45IDExLTYuMyAxNi43LTMuMnExLjUgMSAzLjQgMi42Ii8+PHBhdGggZmlsbD0iIzAwMDAwMCIgZD0iTTYwNy41IDY3Ny4yYzAgMTEuNS05LjcgMTctMTcuNyAxMy44LTUuNi0yLjItOS4zLTcuNi04LjYtMTMuMi45LTYuOCA1LjYtMTIgMTEuNS0xMi43czEyLjIgMy4yIDE0LjEgOC44cS41IDEuNC43IDMuMyIvPjxwYXRoIGZpbGw9IiMwMDAwMDAiIGQ9Ik00MTguMyA2NDNxLTExLjEtNS4zLTkuNC0xNS41YzEtNiA1LjUtMTAuMiAxMS40LTEwLjdxOC44LS42IDEzIDcuMiA0LjMgNy44LTEgMTQuNWMtMy40IDQuMi04IDYuNC0xNCA0LjQiLz48cGF0aCBmaWxsPSIjMDAwMDAwIiBkPSJNNTM4IDU5NS40YTEzLjQgMTMuNCAwIDAgMS0xNS44IDEwLjRjLTUuOC0xLjEtMTAuMi02LjgtMTAuMy0xM2ExMyAxMyAwIDAgMSAxMi0xMy44YzcuMi0uNSAxMy4yIDQuNyAxNC4xIDEycS4yIDIgMCA0LjQiLz48cGF0aCBmaWxsPSIjMDAwMDAwIiBkPSJNNTAzLjYgNzExYzIuMiAxMi44LTYgMjEuMi0xNi42IDE3LjctNS40LTEuOC05LTYuNS05LTExLjkgMC02IDQtMTEuOSA5LjItMTMuNSA1LjQtMS43IDExLjIuMiAxNC42IDQuOHEuOCAxLjEgMS44IDMiLz48L3N2Zz4=" alt="WAGS">WAGS' +
            '</a>' +
          '</div>',
        '</div>',
      '</div>',
    ].join('');

    document.body.appendChild(overlay);

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) DonationModal.close();
    });
    document.getElementById('dm-close-btn').addEventListener('click', function () {
      DonationModal.close();
    });

    // Close on Escape key
    _keyHandler = function (e) {
      if ((e.key === 'Escape' || e.keyCode === 27) && overlay.classList.contains('dm-active')) {
        DonationModal.close();
      }
    };
    document.addEventListener('keydown', _keyHandler);

    // Basic focus trap — keep Tab/Shift+Tab within the modal
    overlay.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab' && e.keyCode !== 9) return;
      var focusable = overlay.querySelectorAll(
        'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      var first = focusable[0];
      var last  = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* Simple HTML escaper used for user-supplied text nodes */
  function _escapeHTML(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* Copy a raw value (e.g. a BTC address) to the clipboard, with a
     document.execCommand fallback for older/insecure contexts. */
  function _copyToClipboard(text) {
    if (global.navigator && navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  }

  /* ─────────────────────────────────────────────────
     RENDER ICONS FROM links {}
     URLs are sanitised before injection to prevent
     XSS via javascript: or data: schemes. 'copy' kind
     entries (like btc) are rendered as tap-to-copy
     buttons instead of links, since they're raw values.
  ───────────────────────────────────────────────── */
  function renderIcons(links) {
    var grid = document.getElementById('dm-grid');
    if (!grid) return;
    grid.innerHTML = '';

    ICONS.forEach(function (def) {
      var key = def[0], label = def[1], icon = def[2], cls = def[3], kind = def[4] || 'link';

      var iconEl = document.createElement('span');
      iconEl.className = 'dm-icon ' + cls;
      iconEl.setAttribute('aria-hidden', 'true');
      iconEl.innerHTML = icon; // safe: icon HTML comes from the internal ICONS registry

      var labelEl = document.createElement('span');
      labelEl.className = 'dm-item-label';
      labelEl.textContent = label;

      if (kind === 'copy') {
        var value = _sanitiseCopyValue(links[key]);
        if (!value) return; // skip empty addresses

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'dm-item';
        btn.title = 'Tap to copy: ' + value;
        btn.appendChild(iconEl);
        btn.appendChild(labelEl);
        btn.addEventListener('click', function () {
          _copyToClipboard(value).then(function () {
            var original = labelEl.textContent;
            labelEl.textContent = 'Copied!';
            setTimeout(function () { labelEl.textContent = original; }, 1500);
          }).catch(function () {
            console.warn('[DonationModal] Could not copy to clipboard. Address:', value);
          });
        });
        grid.appendChild(btn);
        return;
      }

      var href = _sanitiseURL(links[key]);
      if (!href) return; // skips empty, invalid, or unsafe URLs

      var item = document.createElement('a');
      item.href = href;
      item.className = 'dm-item';
      item.target = '_blank';
      item.rel = 'noopener noreferrer';
      item.appendChild(iconEl);
      var labelLink = document.createElement('a');
      labelLink.className = 'dm-item-label';
      labelLink.href = href;
      labelLink.target = '_blank';
      labelLink.rel = 'noopener noreferrer';
      labelLink.textContent = label;
      item.appendChild(labelLink);
      grid.appendChild(item);
    });

    if (!grid.children.length) {
      var msg = document.createElement('p');
      msg.style.cssText = 'text-align:center;padding:16px 0;font-size:13px;color:#6b7280;grid-column:1/-1';
      msg.textContent = 'No donation links configured.';
      grid.appendChild(msg);
    }
  }

  /* ─────────────────────────────────────────────────
     INTERNAL STATE
  ───────────────────────────────────────────────── */
  var _config     = null;
  var _keyHandler = null; // reference to the keydown listener for cleanup
  var _triggerHandlers = []; // array of { el, fn }, tracked for cleanup on re-init/destroy

  function _removeTriggerListeners() {
    _triggerHandlers.forEach(function (pair) {
      pair.el.removeEventListener('click', pair.fn);
    });
    _triggerHandlers = [];
  }

  function _bindTriggers(selector) {
    _removeTriggerListeners();
    if (!selector) return;
    var triggers = document.querySelectorAll(selector);
    if (!triggers.length) {
      console.warn('[DonationModal] triggerSelector "' + selector + '" matched no elements.');
      return;
    }
    triggers.forEach(function (el) {
      var fn = function () { DonationModal.open(); };
      el.addEventListener('click', fn);
      _triggerHandlers.push({ el: el, fn: fn });
    });
  }

  /* ─────────────────────────────────────────────────
     PUBLIC API
  ───────────────────────────────────────────────── */
  var DonationModal = {

    /** Semver string exposed for programmatic version checks. */
    version: VERSION,

    /**
     * Initialize the modal. Safe to call again to update options.
     *
     * @param {object} options
     * @param {string}   [options.triggerSelector]  CSS selector for button(s) that open the modal.
     * @param {string}   [options.title]            Custom header title. Default: 'Support - Donate'.
     * @param {string}   [options.sectionLabel]     Label above the icon grid. Default: 'Ways You Can Support Us'.
     * @param {object}   options.links              Donation URLs keyed by platform name
     *                                               (github, kofi, patreon, razorpay, paypal, dodo, wise, btc).
     */
    init: function (options) {
      if (!options || !options.links) {
        console.error('[DonationModal] init() requires options.links  e.g. { github: "https://..." }');
        return;
      }

      _config = options;
      injectCSS();
      injectFontAwesome();

      var ready = function () {
        buildModal(options.title, options.sectionLabel);
        // Always call renderIcons so re-init with new links is applied
        renderIcons(options.links);
        _bindTriggers(options.triggerSelector);
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ready);
      } else {
        ready();
      }
    },

    /**
     * Update links and/or title without a full re-init.
     * Partial updates are supported — omit any key to leave it unchanged.
     *
     * @param {object} changes
     * @param {object}   [changes.links]         Replacement links object.
     * @param {string}   [changes.title]         New header title.
     * @param {string}   [changes.sectionLabel]  New section label.
     */
    update: function (changes) {
      if (!_config) {
        console.error('[DonationModal] Call DonationModal.init() before update().');
        return;
      }
      if (changes.links)        _config.links        = changes.links;
      if (changes.title)        _config.title         = changes.title;
      if (changes.sectionLabel) _config.sectionLabel   = changes.sectionLabel;

      var t = document.getElementById('dm-header-title');
      if (t) t.innerHTML = _titleHTML(_config.title);
      var s = document.getElementById('dm-section-label');
      if (s) s.textContent = _config.sectionLabel || 'Ways You Can Support Us';
      renderIcons(_config.links);
    },

    /** Open the modal. */
    open: function () {
      if (!_config) {
        console.error('[DonationModal] Call DonationModal.init() before open().');
        return;
      }
      var overlay = document.getElementById('dm-overlay');
      if (!overlay) {
        console.warn('[DonationModal] Modal overlay element not found in DOM.');
        return;
      }
      overlay.classList.add('dm-active');
      // Move focus into the modal for accessibility
      var firstFocusable = overlay.querySelector('a[href],button:not([disabled])');
      if (firstFocusable) firstFocusable.focus();
      // Hide background content from screen readers
      document.body.setAttribute('aria-hidden', 'true');
      overlay.removeAttribute('aria-hidden');
    },

    /** Close the modal. */
    close: function () {
      var overlay = document.getElementById('dm-overlay');
      if (overlay) {
        overlay.classList.remove('dm-active');
        // Restore background content to screen readers
        document.body.removeAttribute('aria-hidden');
      }
    },

    /**
     * Completely remove the modal, styles, and all event listeners.
     * Useful in SPAs or when re-mounting with fresh options.
     */
    destroy: function () {
      // Remove Escape key listener
      if (_keyHandler) {
        document.removeEventListener('keydown', _keyHandler);
        _keyHandler = null;
      }
      // Remove trigger listeners
      _removeTriggerListeners();
      // Remove DOM nodes
      var overlay = document.getElementById('dm-overlay');
      if (overlay) overlay.parentNode.removeChild(overlay);
      var styles = document.getElementById('dm-styles');
      if (styles) styles.parentNode.removeChild(styles);
      // Restore aria-hidden if modal was open during destroy
      document.body.removeAttribute('aria-hidden');
      _config = null;
    },
  };

  global.DonationModal = DonationModal;

}(typeof window !== 'undefined' ? window : this));
