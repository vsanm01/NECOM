/*!
 * donationLinksConfig.js
 * Drop-in links object for DonationModal.init({ links: ... }).
 *
 * All 8 supported keys are listed below with placeholder values.
 * Replace each placeholder with your real payment link (or wallet
 * address, for btc). Delete/empty any key you don't use —
 * DonationModal automatically hides any key that's missing or blank.
 *
 * NOTE: `btc` is the one exception — it takes a raw wallet address,
 * not a URL, and renders as a "tap to copy" button instead of a link.
 */

var donationLinks = {
  github:   'https://github.com/sponsors/yourusername',
  kofi:     'https://ko-fi.com/yourusername',
  patreon:  'https://patreon.com/yourusername',
  razorpay: 'https://razorpay.me/@WAGSstudio',                        // ✅ live
  paypal:   'https://www.paypal.com/paypalme/WAGSstudio',             // ✅ live
  dodo:     'https://checkout.dodopayments.com/buy/YOUR_PRODUCT_ID',  // ⚠️ placeholder
  wise:     'https://wise.com/pay/business/vasantharubans2',          // ✅ live
  btc:      '1LNPPjCXCZvCJruLPquNExC15Hu6nGKhi5'                      // ✅ live — tap to copy
};

// Works both as a plain global (for <script src="donationLinksConfig.js">)
// and as a CommonJS module if you bundle your JS.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = donationLinks;
}
