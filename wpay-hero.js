/*!
 * wpay-hero.js
 * Standalone, self-mounting "hero" section extracted from the WPay Blogger theme.
 * Injects its own CSS and renders the hero markup, so it can be dropped into
 * any page with a single <script src="wpay-hero.js" defer></script> tag.
 *
 * Usage:
 *   1) Drop this file next to your page (or host it on a CDN / jsDelivr).
 *   2) Add: <div id="wpayHero"></div>  where you want the hero to appear
 *      (or omit it — the script will create one at the top of <body> if missing).
 *   3) Add: <script src="wpay-hero.js" defer></script>
 *
 * Everything (HTML + CSS) is self-contained in this one file — no external
 * stylesheet is required.
 */
(function () {
  'use strict';

  var MOUNT_ID = 'wpayHero';
  var STYLE_ID = 'wpay-hero-styles';

  var CSS = ""
    + ":root{"
    + "  --wpay-bg:#0b1220;"
    + "  --wpay-white:#f5f7fa;"
    + "  --wpay-yellow:#f5c518;"
    + "  --wpay-green:#3ddc84;"
    + "  --wpay-blue:#4f9dff;"
    + "  --wpay-muted:#aab2c0;"
    + "  --wpay-badge-border:#8a6d1f;"
    + "  --wpay-badge-text:#e8c563;"
    + "}"
    + ".wpay-hero{"
    + "  background:var(--wpay-bg);"
    + "  color:var(--wpay-white);"
    + "  padding:48px 32px 56px;"
    + "  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;"
    + "  max-width:760px;"
    + "  margin:0 auto;"
    + "  box-sizing:border-box;"
    + "}"
    + ".wpay-hero *{box-sizing:border-box;}"
    + ".wpay-hero-badges-row{"
    + "  display:flex;"
    + "  gap:12px;"
    + "  flex-wrap:wrap;"
    + "  margin-bottom:28px;"
    + "}"
    + ".wpay-hero-badge{"
    + "  display:inline-flex;"
    + "  align-items:center;"
    + "  gap:6px;"
    + "  border:1px solid var(--wpay-badge-border);"
    + "  color:var(--wpay-badge-text);"
    + "  background:rgba(232,197,99,0.06);"
    + "  border-radius:999px;"
    + "  padding:6px 16px;"
    + "  font-size:12px;"
    + "  font-weight:700;"
    + "  letter-spacing:0.03em;"
    + "  text-transform:uppercase;"
    + "  white-space:nowrap;"
    + "}"
    + ".wpay-hero h1{"
    + "  font-family:Georgia,'Times New Roman',serif;"
    + "  font-weight:700;"
    + "  font-size:44px;"
    + "  line-height:1.15;"
    + "  margin:0 0 20px;"
    + "  color:var(--wpay-white);"
    + "}"
    + ".wpay-hero h1 span{color:var(--wpay-yellow);}"
    + ".wpay-hero-text{"
    + "  font-weight:700;"
    + "  font-size:15px;"
    + "  line-height:1.5;"
    + "  margin:0 0 12px;"
    + "  max-width:640px;"
    + "}"
    + ".wpay-hero-text.yellow{color:var(--wpay-yellow);}"
    + ".wpay-hero-text.green{color:var(--wpay-green);}"
    + ".wpay-hero-text.blue{color:var(--wpay-blue);margin-bottom:0;}"
    + ".wpay-hero-desc{"
    + "  margin-top:28px;"
    + "  color:var(--wpay-muted);"
    + "  font-size:15px;"
    + "  line-height:1.7;"
    + "  max-width:640px;"
    + "}"
    + ".wpay-hero-highlight-1{"
    + "  color:var(--wpay-blue);"
    + "  font-weight:700;"
    + "}"
    + ".wpay-hero-highlight-2{"
    + "  color:var(--wpay-yellow);"
    + "  font-weight:700;"
    + "}"
    + "@media (max-width:600px){"
    + "  .wpay-hero{padding:36px 20px 44px;}"
    + "  .wpay-hero h1{font-size:32px;}"
    + "}";

  var HTML = ""
    + '<div class="wpay-hero-badges-row">'
    +   '<div class="wpay-hero-badge">&#10022; Simple to use</div>'
    +   '<div class="wpay-hero-badge">&#10022; Free Forever</div>'
    + '</div>'
    + '<h1>Build free tools<br>for <span>everyone.</span></h1>'
    + '<div class="wpay-hero-text yellow">our contribution makes a difference</div>'
    + '<div class="wpay-hero-text green">We accept PayPal, Dodo, Wise, Razorpay, Bitcoin, and QRpay (UPI, Gpay, Phonepe, AmazonPay, Paytm)</div>'
    + '<div class="wpay-hero-text blue">Join our community by following our social channels and sharing the platform with your network</div>'
    + '<p class="wpay-hero-desc">'
    +   '<span class="wpay-hero-highlight-1">Your contribution funds our next release.</span><br>'
    +   '<span class="wpay-hero-highlight-2">WAGS Studio - Worldwide Action Great Solution.</span><br>'
    +   'We are a small independent studio building applications and tools for startup entrepreneurs.<br><br>'
    +   "We believe the best software is built by entrepreneurs, for entrepreneurs. We're currently building applications in our pipeline to help solopreneurs tackle real startup challenges."
    + '</p>';

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

  function render() {
    injectStyles();
    var mount = getOrCreateMount();
    mount.className = (mount.className ? mount.className + ' ' : '') + 'wpay-hero';
    mount.innerHTML = HTML;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
