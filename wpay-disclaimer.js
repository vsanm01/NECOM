/*!
 * wpay-disclaimer.js
 * Standalone, self-mounting "disclaimer" box extracted from the WPay Blogger theme.
 * Injects its own CSS and renders the disclaimer markup, so it can be dropped into
 * any page with a single <script src="wpay-disclaimer.js" defer></script> tag.
 *
 * Usage:
 *   1) Drop this file next to your page (or host it on a CDN / jsDelivr).
 *   2) Add: <div id="wpayDisclaimer"></div>  where you want the box to appear
 *      (or omit it — the script will append one to the end of <body> if missing).
 *   3) Add: <script src="wpay-disclaimer.js" defer></script>
 *
 * Everything (HTML + CSS) is self-contained in this one file — no external
 * stylesheet is required.
 */
(function () {
  'use strict';

  var MOUNT_ID = 'wpayDisclaimer';
  var STYLE_ID = 'wpay-disclaimer-styles';

  var CSS = ""
    + ":root{"
    + "  --wpay-disc-bg:#141d33;"
    + "  --wpay-disc-border:#2c3a5c;"
    + "  --wpay-disc-title:#f5f7fa;"
    + "  --wpay-disc-text:#7f9be0;"
    + "}"
    + ".wpay-disclaimer-box{"
    + "  background:var(--wpay-disc-bg);"
    + "  border:1px solid var(--wpay-disc-border);"
    + "  border-radius:10px;"
    + "  padding:18px 22px;"
    + "  max-width:960px;"
    + "  margin:24px auto;"
    + "  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;"
    + "  box-sizing:border-box;"
    + "}"
    + ".wpay-disclaimer-box *{box-sizing:border-box;}"
    + ".wpay-disclaimer-title{"
    + "  color:var(--wpay-disc-title);"
    + "  font-size:14px;"
    + "  font-weight:700;"
    + "  margin:0 0 8px;"
    + "}"
    + ".wpay-disclaimer-text{"
    + "  color:var(--wpay-disc-text);"
    + "  font-size:13px;"
    + "  line-height:1.6;"
    + "  margin:0;"
    + "}"
    + "@media (max-width:600px){"
    + "  .wpay-disclaimer-box{padding:14px 16px;margin:16px auto;}"
    + "  .wpay-disclaimer-title{font-size:13px;}"
    + "  .wpay-disclaimer-text{font-size:12px;}"
    + "}";

  var HTML = ""
    + '<p class="wpay-disclaimer-title">Disclaimer</p>'
    + '<p class="wpay-disclaimer-text">'
    +   'All contributions are voluntary and non-refundable. Payments are securely processed by third-party providers &mdash; '
    +   'PayPal, Dodo Payments, Wise, Razorpay, Bitcoin network transfers, and QR/UPI payments (Gpay, PhonePe, Paytm, AmazonPay) &mdash; '
    +   'under their own terms and privacy policies. We never store your payment details.'
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
      document.body.appendChild(mount);
    }
    return mount;
  }

  function render() {
    injectStyles();
    var mount = getOrCreateMount();
    mount.className = (mount.className ? mount.className + ' ' : '') + 'wpay-disclaimer-box';
    mount.setAttribute('role', 'note');
    mount.innerHTML = HTML;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
