/*!
 * socialIcons.js
 * Icon/platform registry for a social-links modal built on IconGridModal.js
 * — data only, no logic. Mirrors the format of donationIcons.js.
 *
 * Each entry: { key, label, icon, color }
 *   key   matches the property name you use in the `links` object
 *   icon  trusted HTML (Font Awesome tag or inline SVG) — never end-user input
 *   color hex color used for the icon ring/fill and label hover accent
 *
 * To add a new platform: add one object below. No other file needs to change.
 *
 * ─── NOTE ON PROTOCOLS ──────────────────────────────────────────────────
 * The original SocialMediaModal.js allowed https:, http:, viber:, tg:, and
 * mailto: URLs (needed for entries like `viber` and `telegram` deep links).
 * IconGridModal.js's built-in sanitizer currently only allows https:, http:,
 * and mailto: — so a raw `viber://...` link would be silently dropped if you
 * wire this straight into IconGridModal today. If you plan to actually use
 * the `viber` entry (or any other non-http(s) scheme) with real links, the
 * engine's protocol allowlist needs to be made configurable first — happy
 * to add that if you want.
 *
 * ─── NOTE ON SPECIAL VISUAL TREATMENTS ─────────────────────────────────
 * The original had two effects IconGridModal.js can't currently reproduce
 * with a single `color` field:
 *   - Instagram / Messenger used a CSS gradient text-fill on the icon.
 *     Here they fall back to their solid brand color instead.
 *   - Snapchat / KakaoTalk used a colored circle *background* with a dark
 *     icon on top, rather than a colored icon on a white circle.
 *     Here they're approximated with a single brand-color outline instead.
 * Both are cosmetic-only simplifications — links and functionality are
 * unaffected. Let me know if you'd like the engine extended to support
 * per-item background colors and gradients.
 */

(function (global) {
  'use strict';

  var SOCIAL_ICONS = [
    { key: 'websiteSocial',  label: 'Website',     icon: '<i class="fa-solid fa-globe"></i>', color: '#3b82f6' },
    { key: 'blog',           label: 'Blog',        icon: '<i class="fa-solid fa-blog"></i>', color: '#ff6b35' },
    { key: 'facebook',       label: 'Facebook',    icon: '<i class="fa-brands fa-facebook-f"></i>', color: '#1877f2' },
    { key: 'instagram',      label: 'Instagram',   icon: '<i class="fa-brands fa-instagram"></i>', color: '#dc2743' },
    { key: 'youtube',        label: 'YouTube',     icon: '<i class="fa-brands fa-youtube"></i>', color: '#ff0000' },
    { key: 'tiktok',         label: 'TikTok',      icon: '<i class="fa-brands fa-tiktok"></i>', color: '#000000' },
    { key: 'x',              label: 'X',           icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z"/></svg>', color: '#000000' },
    { key: 'pinterest',      label: 'Pinterest',   icon: '<i class="fa-brands fa-pinterest-p"></i>', color: '#bd081c' },
    { key: 'linkedin',       label: 'LinkedIn',    icon: '<i class="fa-brands fa-linkedin-in"></i>', color: '#0a66c2' },
    { key: 'whatsappSocial', label: 'WhatsApp',    icon: '<i class="fa-brands fa-whatsapp"></i>', color: '#25d366' },
    { key: 'telegram',       label: 'Telegram',    icon: '<i class="fa-brands fa-telegram"></i>', color: '#26a5e4' },
    { key: 'arattai',        label: 'Arattai',     icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.145 2 11.243c0 3.006 1.467 5.678 3.75 7.395L5 22l3.897-1.95A10.83 10.83 0 0 0 12 20.486c5.523 0 10-4.145 10-9.243C22 6.145 17.523 2 12 2z"/></svg>', color: '#ff6b00' },
    { key: 'discord',        label: 'Discord',     icon: '<i class="fa-brands fa-discord"></i>', color: '#5865f2' },
    { key: 'playstore',      label: 'Play Store',  icon: '<i class="fa-brands fa-google-play"></i>', color: '#34a853' },
    { key: 'googleBusiness', label: 'G. Business', icon: '<i class="fa-brands fa-google"></i>', color: '#4285f4' },
    { key: 'wikipedia',      label: 'Wikipedia',   icon: '<i class="fa-brands fa-wikipedia-w"></i>', color: '#000000' },
    { key: 'reddit',         label: 'Reddit',      icon: '<i class="fa-brands fa-reddit-alien"></i>', color: '#ff4500' },
    { key: 'quora',          label: 'Quora',       icon: '<i class="fa-brands fa-quora"></i>', color: '#b92b27' },
    { key: 'wechat',         label: 'WeChat',      icon: '<i class="fa-brands fa-weixin"></i>', color: '#07c160' },
    { key: 'snapchat',       label: 'Snapchat',    icon: '<i class="fa-brands fa-snapchat"></i>', color: '#fffc00' }, // original: yellow circle bg, black icon
    { key: 'tumblr',         label: 'Tumblr',      icon: '<i class="fa-brands fa-tumblr"></i>', color: '#35465c' },
    { key: 'threads',        label: 'Threads',     icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32L7.734 7.847c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388.108.046.216.094.321.142 1.49.7 2.58 1.761 3.154 3.07.797 1.82.871 4.79-1.548 7.158-1.85 1.81-4.094 2.628-7.277 2.65Zm1.003-11.69c-.242 0-.487.007-.739.021-1.836.103-2.98.946-2.916 2.143.067 1.256 1.452 1.839 2.784 1.767 1.224-.065 2.818-.543 3.086-3.71a10.5 10.5 0 0 0-2.215-.221z"/></svg>', color: '#000000' },
    { key: 'vk',              label: 'VK',         icon: '<i class="fa-brands fa-vk"></i>', color: '#0077ff' },
    { key: 'ok',              label: 'OK',         icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 5a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-4.5 8.5c.793.793 1.88 1.22 3 1.42v1.08H9a1 1 0 1 0 0 2h2v1a1 1 0 1 0 2 0v-1h2a1 1 0 1 0 0-2h-1.5v-1.08a5.001 5.001 0 0 0 3-1.42 1 1 0 1 0-1.414-1.414A3 3 0 0 1 12 16a3 3 0 0 1-2.086-.914A1 1 0 1 0 8.5 16.5z"/></svg>', color: '#f7931e' },
    { key: 'kakao',           label: 'KakaoTalk',  icon: '<svg viewBox="0 0 24 24" fill="currentColor" style="color:#3c1e1e"><path d="M12 3C6.477 3 2 6.477 2 10.857c0 2.796 1.57 5.25 3.938 6.698l-.938 3.445 4.297-2.796A11.74 11.74 0 0 0 12 18.714c5.523 0 10-3.476 10-7.857S17.523 3 12 3z"/></svg>', color: '#fae100' }, // original: yellow circle bg, dark icon
    { key: 'viber',           label: 'Viber',      icon: '<i class="fa-brands fa-viber"></i>', color: '#7360f2' },
    { key: 'threema',         label: 'Threema',    icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1a5 5 0 0 0-5 5v2H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5zm0 2a3 3 0 0 1 3 3v2H9V6a3 3 0 0 1 3-3zm0 9a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"/></svg>', color: '#3d3d3d' },
    { key: 'signal',          label: 'Signal',     icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0a1.794 1.794 0 0 0-.37.04l-.367.08A12.006 12.006 0 0 0 .04 11.63C-.3 14.145.342 16.64 1.68 18.74l-.04.01L.09 23.01l4.26-1.55.01-.04c2.1 1.34 4.59 1.98 7.1 1.64A12.003 12.003 0 0 0 23.96 12.37c.34-2.515-.3-5.01-1.64-7.11l.04-.01L23.91.99l-4.26 1.55-.01.04A11.98 11.98 0 0 0 12 0zm0 2.182a9.818 9.818 0 0 1 6.77 16.93A9.818 9.818 0 1 1 12 2.182z"/></svg>', color: '#3a76f0' },
    { key: 'messenger',       label: 'Messenger',  icon: '<i class="fa-brands fa-facebook-messenger"></i>', color: '#0084ff' },
    { key: 'douyin',          label: 'Douyin',     icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>', color: '#000000' },
  ];

  global.SOCIAL_ICONS = SOCIAL_ICONS;

}(typeof window !== 'undefined' ? window : this));
