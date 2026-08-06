/*!
 * donationIcons.js
 * Icon/platform registry for DonationModal.js — data only, no logic.
 * Each entry: { key, label, icon, color, kind }
 *   key   matches the property name you use in DonationModal's `links` object
 *   icon  trusted HTML (Font Awesome tag or inline SVG) — never end-user input
 *   color hex color used for the icon ring/fill and label hover accent
 *   kind  'link' (default, omit it) or 'copy' for raw values like wallet addresses
 *
 * To add a new platform (e.g. Buy Me a Coffee, Open Collective, Liberapay):
 * just add one object below. No other file needs to change.
 */

(function (global) {
  'use strict';

  var DONATION_ICONS = [
    { key: 'github',   label: 'GitHub',   icon: '<i class="fa-brands fa-github"></i>', color: '#181717' },
    { key: 'kofi',     label: 'Ko-fi',    icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 3h16.5a3.5 3.5 0 0 1 0 7H18a5 5 0 0 1-5 5H8a6 6 0 0 1-6-6V3zm2 2v6a4 4 0 0 0 4 4h5a3 3 0 0 0 3-3V5H4zm14.5 1H18v3h.5a1.5 1.5 0 0 0 0-3zM4 18h13v2H4v-2z"/></svg>', color: '#ff5e5b' },
    { key: 'patreon',  label: 'Patreon',  icon: '<i class="fa-brands fa-patreon"></i>', color: '#ff424d' },
    { key: 'razorpay', label: 'Razorpay', icon: '<i class="fa-solid fa-bolt"></i>', color: '#0c2451' },
    { key: 'paypal',   label: 'PayPal',   icon: '<i class="fa-brands fa-paypal"></i>', color: '#003087' },
    { key: 'dodo',     label: 'Dodo Pay', icon: '<i class="fa-solid fa-cart-shopping"></i>', color: '#6d28d9' },
    { key: 'wise',     label: 'Wise',     icon: '<i class="fa-solid fa-money-bill-transfer"></i>', color: '#9fe870' },
    { key: 'btc',      label: 'Bitcoin',  icon: '<i class="fa-brands fa-btc"></i>', color: '#f7931a', kind: 'copy' },
  ];

  global.DONATION_ICONS = DONATION_ICONS;

}(typeof window !== 'undefined' ? window : this));
