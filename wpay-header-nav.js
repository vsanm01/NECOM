/*!
 * wpay-header-nav.js
 * Standalone header nav bar extracted from the WPay Blogger theme:
 *   Projects · About · GitHub · Ko-fi · More Ways > · QR Pay · Social
 * Injects its own CSS, renders the nav links, and wires "More Ways" / "QR Pay" /
 * "Social" to open modals via UnifiedModal (loaded separately — see notes below).
 *
 * Usage:
 *   1) Drop this file next to your page (or host it on a CDN / jsDelivr).
 *   2) Add: <div id="wpayHeaderNav"></div>  where you want the nav row to appear
 *      (or omit it — the script will append one to the end of <body> if missing).
 *   3) Add: <script src="wpay-header-nav.js" defer></script>
 *
 * Dependencies (load these BEFORE this script, exactly like the original theme did):
 *   - UnifiedModal engine        (window.UnifiedModal)
 *   - DONATION_ICONS / SOCIAL_ICONS  (icon config)
 *   - donationLinks / socialLinks    (link config)
 *   - Font Awesome (for the icon grids the modals render)
 * If any of those aren't loaded, clicking "More Ways" / "QR Pay" / "Social" falls
 * back to a small inline notice instead of throwing an error.
 *
 * Optional config (set before this script runs):
 *   window.WPAY_NAV_LINKS = {
 *     projects: 'https://example.com/',
 *     about: 'https://example.com/about',
 *     github: 'https://github.com/your-org',
 *     kofi: 'https://ko-fi.com/your-page',
 *     qrImage: 'https://.../qr.png'
 *   };
 *
 * Everything (HTML + CSS) is self-contained in this one file — no external
 * stylesheet is required.
 */
(function () {
  'use strict';

  var MOUNT_ID = 'wpayHeaderNav';
  var MOUNT_CLASS = 'wpay-header-nav-mount';
  var STYLE_ID = 'wpay-header-nav-styles';

  var DEFAULTS = {
    projects: 'https://wagsone.blogspot.com/',
    about: 'https://wagsone.blogspot.com/',
    github: 'https://github.com/wags-studio',
    kofi: 'https://ko-fi.com/wagsstudio',
    qrImage: 'https://drive.google.com/thumbnail?id=1PP9K3Z0uGOIripp5zC6TdqCqApa3CRhL&sz=w1600'
  };
  var LINKS = Object.assign({}, DEFAULTS, window.WPAY_NAV_LINKS || {});

  var CSS = ""
    + ":root{"
    + "  --wpay-nav-text:#ffffff;"
    + "  --wpay-nav-hover:#ffd400;"
    + "  --wpay-nav-hover-bg:rgba(255,255,255,0.06);"
    + "  --wpay-nav-error-bg:#2a1414;"
    + "  --wpay-nav-error-text:#f5a3a3;"
    + "  --wpay-nav-error-border:#5c2323;"
    + "}"
    + ".wpay-header-nav{"
    + "  display:flex;"
    + "  align-items:center;"
    + "  gap:6px;"
    + "  flex-wrap:wrap;"
    + "  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;"
    + "}"
    + ".wpay-header-nav *{box-sizing:border-box;}"
    + ".wpay-nav-link{"
    + "  color:var(--wpay-nav-text);"
    + "  text-decoration:none;"
    + "  font-size:13px;"
    + "  font-weight:500;"
    + "  padding:6px 14px;"
    + "  border-radius:8px;"
    + "  cursor:pointer;"
    + "  transition:all 0.2s;"
    + "  background:none;"
    + "  border:none;"
    + "  display:inline-block;"
    + "}"
    + ".wpay-nav-link:hover,"
    + ".wpay-nav-link:focus-visible{"
    + "  color:var(--wpay-nav-hover);"
    + "  background:var(--wpay-nav-hover-bg);"
    + "  outline:none;"
    + "}"
    + ".wpay-nav-error{"
    + "  display:none;"
    + "  width:100%;"
    + "  margin-top:8px;"
    + "  padding:10px 14px;"
    + "  font-size:12.5px;"
    + "  line-height:1.5;"
    + "  color:var(--wpay-nav-error-text);"
    + "  background:var(--wpay-nav-error-bg);"
    + "  border:1px solid var(--wpay-nav-error-border);"
    + "  border-radius:8px;"
    + "}"
    + ".wpay-nav-error.wpay-nav-error-visible{display:block;}"
    + ".wpay-nav-error a{color:inherit;text-decoration:underline;}"
    + "@media (max-width:900px){"
    + "  .wpay-header-nav{flex-direction:column;align-items:flex-start;width:100%;}"
    + "  .wpay-nav-link{width:100%;padding:10px 14px;}"
    + "}";

  var HTML = ""
    + '<a class="wpay-nav-link" href="' + LINKS.projects + '" target="_blank" rel="noopener noreferrer">Projects</a>'
    + '<a class="wpay-nav-link" href="' + LINKS.about + '" target="_blank" rel="noopener noreferrer">About</a>'
    + '<a class="wpay-nav-link" href="' + LINKS.github + '" target="_blank" rel="noopener noreferrer">GitHub</a>'
    + '<a class="wpay-nav-link" href="' + LINKS.kofi + '" target="_blank" rel="noopener noreferrer">Ko-fi</a>'
    + '<span class="wpay-nav-link" data-action="moreways" role="button" tabindex="0" aria-haspopup="dialog">More Ways &gt;</span>'
    + '<span class="wpay-nav-link" data-action="qrpay" role="button" tabindex="0" aria-haspopup="dialog">QR Pay</span>'
    + '<span class="wpay-nav-link" data-action="social" role="button" tabindex="0" aria-haspopup="dialog">Social</span>'
    + '<div class="wpay-nav-error" role="status" aria-live="polite">'
    +   'That panel isn\'t available right now. In the meantime, find us on '
    +   '<a href="' + LINKS.github + '" target="_blank" rel="noopener noreferrer">GitHub</a> or '
    +   '<a href="' + LINKS.kofi + '" target="_blank" rel="noopener noreferrer">Ko-fi</a>.'
    + '</div>';

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  // Renders into every element with class "wpay-header-nav-mount" (lets you place
  // one instance in the desktop header row and another in a mobile nav drawer).
  // Falls back to #wpayHeaderNav for backwards compatibility, and creates one at
  // the end of <body> if nothing is found at all.
  function getMounts() {
    var mounts = Array.prototype.slice.call(document.querySelectorAll('.' + MOUNT_CLASS));
    var byId = document.getElementById(MOUNT_ID);
    if (byId && mounts.indexOf(byId) === -1) mounts.push(byId);
    if (mounts.length === 0) {
      var created = document.createElement('div');
      created.id = MOUNT_ID;
      document.body.appendChild(created);
      mounts.push(created);
    }
    return mounts;
  }

  function showError() {
    document.querySelectorAll('.wpay-header-nav .wpay-nav-error').forEach(function (el) {
      el.classList.add('wpay-nav-error-visible');
    });
  }

  function modalEngineReady() {
    return typeof window.UnifiedModal !== 'undefined'
      && typeof window.DONATION_ICONS !== 'undefined'
      && typeof window.SOCIAL_ICONS !== 'undefined'
      && typeof window.donationLinks !== 'undefined'
      && typeof window.socialLinks !== 'undefined';
  }

  function openMoreWays() {
    if (!modalEngineReady()) return showError();
    window.UnifiedModal.open({
      title: 'More Ways to Support',
      size: 'sm',
      content: { type: 'iconGrid', props: { items: window.DONATION_ICONS, links: window.donationLinks, columns: 3 } }
    });
  }

  function openQrPay() {
    if (!modalEngineReady()) return showError();
    window.UnifiedModal.open({
      title: 'Scan to Pay',
      size: 'sm',
      content: { type: 'gallery', props: { images: [LINKS.qrImage] } }
    });
  }

  function openSocial() {
    if (!modalEngineReady()) return showError();
    window.UnifiedModal.open({
      title: 'Find Us Online',
      size: 'sm',
      content: { type: 'iconGrid', props: { items: window.SOCIAL_ICONS, links: window.socialLinks, columns: 2 } }
    });
  }

  var ACTIONS = { moreways: openMoreWays, qrpay: openQrPay, social: openSocial };

  function onActivateKey(handler) {
    return function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handler(e);
      }
    };
  }

  function wireActions(mount) {
    mount.querySelectorAll('[data-action]').forEach(function (el) {
      var handler = ACTIONS[el.getAttribute('data-action')];
      if (!handler) return;
      el.addEventListener('click', handler);
      el.addEventListener('keydown', onActivateKey(handler));
    });
  }

  function render() {
    injectStyles();
    getMounts().forEach(function (mount) {
      mount.className = (mount.className ? mount.className + ' ' : '') + 'wpay-header-nav';
      mount.innerHTML = HTML;
      wireActions(mount);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
