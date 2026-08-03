/*!
 * SocialMediaModal.js  v2.2.0
 * Reusable social media links modal library.
 * Drop into any project — zero dependencies except Font Awesome 6.
 *
 * ─── QUICK START ────────────────────────────────────────────────────────────
 *
 * 1. Add Font Awesome 6 to your page (skip if already included):
 *    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
 *
 * 2. Add this script before </body>:
 *    <script src="SocialMediaModal.js"></script>
 *
 * 3. Add a trigger button anywhere in your HTML:
 *    <button id="followBtn">Follow Us</button>
 *
 * 4. Call init() once in your JS:
 *
 *    SocialMediaModal.init({
 *      triggerSelector: '#followBtn',        // CSS selector for the open trigger
 *      title:           'Social Media',      // optional — header title (default: 'Social - Media Links')
 *      sectionLabel:    'Find Us Online',    // optional — label above the grid (default: 'Our Social Media Channels')
 *      links: {
 *        websiteSocial:  'https://yourwebsite.com',
 *        blog:           'https://blog.yourwebsite.com',
 *        facebook:       'https://facebook.com/yourpage',
 *        instagram:      'https://instagram.com/yourprofile',
 *        youtube:        'https://youtube.com/yourchannel',
 *        tiktok:         'https://tiktok.com/@yourprofile',
 *        x:              'https://x.com/yourhandle',
 *        pinterest:      'https://pinterest.com/yourprofile',
 *        linkedin:       'https://linkedin.com/in/yourprofile',
 *        whatsappSocial: 'https://wa.me/919876543210',
 *        telegram:       'https://t.me/yourusername',
 *        arattai:        'https://arattai.com/yourprofile',
 *        discord:        'https://discord.gg/yourinvite',
 *        playstore:      'https://play.google.com/store/apps/details?id=com.your.app',
 *        googleBusiness: 'https://business.google.com/yourpage',
 *        wikipedia:      'https://wikipedia.org/wiki/YourPage',
 *        reddit:         'https://reddit.com/r/yourcommunity',
 *        quora:          'https://quora.com/profile/yourname',
 *        wechat:         'https://weixin.qq.com/yourpage',
 *        snapchat:       'https://snapchat.com/add/yourusername',
 *        tumblr:         'https://yourusername.tumblr.com',
 *        threads:        'https://threads.net/@yourusername',
 *        vk:             'https://vk.com/yourusername',
 *        ok:             'https://ok.ru/yourprofile',
 *        kakao:          'https://open.kakao.com/yourinvite',
 *        viber:          'viber://chat?number=+919876543210',
 *        threema:        'https://threema.id/yourthreemaid',
 *        signal:         'https://signal.me/#p/yoursignalid',
 *        messenger:      'https://m.me/yourusername',
 *        douyin:         'https://www.douyin.com/user/yourid',
 *      }
 *    });
 *
 * NOTE: Only the links you provide will appear in the modal.
 *       Any key you omit or leave empty is automatically hidden.
 *       URLs must begin with https://, http://, viber://, tg://, or mailto:.
 *       Any URL with a disallowed protocol is silently skipped for security.
 *
 * ─── MANUAL CONTROL (no triggerSelector needed) ─────────────────────────────
 *
 *    SocialMediaModal.open();    // open programmatically
 *    SocialMediaModal.close();   // close programmatically
 *    SocialMediaModal.update({ links: { ... }, title: '...' }); // update without re-init
 *    SocialMediaModal.destroy(); // remove modal, styles, and all listeners
 *    SocialMediaModal.version;   // '2.2.0'
 *
 * ─── ALL SUPPORTED LINK KEYS ────────────────────────────────────────────────
 *
 *  websiteSocial  blog           facebook       instagram
 *  youtube        tiktok         x              pinterest
 *  linkedin       whatsappSocial telegram       arattai
 *  discord        playstore      googleBusiness wikipedia
 *  reddit         quora          wechat         snapchat
 *  tumblr         threads        vk             ok
 *  kakao          viber          threema        signal
 *  messenger      douyin
 *
 * ────────────────────────────────────────────────────────────────────────────
 */

(function (global) {
  'use strict';

  /* ─────────────────────────────────────────────────
     VERSION
  ───────────────────────────────────────────────── */
  var VERSION = '2.2.0';

  /* ─────────────────────────────────────────────────
     ICON REGISTRY
     [ key, label, iconHtml, brandClass ]
  ───────────────────────────────────────────────── */
  var ICONS = [
    ['websiteSocial',  'Website',     '<i class="fa-solid fa-globe"></i>',               'smm-website'],
    ['blog',           'Blog',        '<i class="fa-solid fa-blog"></i>',                'smm-blog'],
    ['facebook',       'Facebook',    '<i class="fa-brands fa-facebook-f"></i>',         'smm-facebook'],
    ['instagram',      'Instagram',   '<i class="fa-brands fa-instagram"></i>',          'smm-instagram'],
    ['youtube',        'YouTube',     '<i class="fa-brands fa-youtube"></i>',            'smm-youtube'],
    ['tiktok',         'TikTok',      '<i class="fa-brands fa-tiktok"></i>',             'smm-tiktok'],
    ['x',              'X',           '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z"/></svg>', 'smm-x'],
    ['pinterest',      'Pinterest',   '<i class="fa-brands fa-pinterest-p"></i>',        'smm-pinterest'],
    ['linkedin',       'LinkedIn',    '<i class="fa-brands fa-linkedin-in"></i>',        'smm-linkedin'],
    ['whatsappSocial', 'WhatsApp',    '<i class="fa-brands fa-whatsapp"></i>',           'smm-whatsapp'],
    ['telegram',       'Telegram',    '<i class="fa-brands fa-telegram"></i>',           'smm-telegram'],
    ['discord',        'Discord',     '<i class="fa-brands fa-discord"></i>',            'smm-discord'],
    ['playstore',      'Play Store',  '<i class="fa-brands fa-google-play"></i>',        'smm-playstore'],
    ['googleBusiness', 'G. Business', '<i class="fa-brands fa-google"></i>',             'smm-google-biz'],
    ['wikipedia',      'Wikipedia',   '<i class="fa-brands fa-wikipedia-w"></i>',        'smm-wikipedia'],
    ['reddit',         'Reddit',      '<i class="fa-brands fa-reddit-alien"></i>',       'smm-reddit'],
    ['quora',          'Quora',       '<i class="fa-brands fa-quora"></i>',              'smm-quora'],
    ['arattai',        'Arattai',     '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.145 2 11.243c0 3.006 1.467 5.678 3.75 7.395L5 22l3.897-1.95A10.83 10.83 0 0 0 12 20.486c5.523 0 10-4.145 10-9.243C22 6.145 17.523 2 12 2z"/></svg>', 'smm-arattai'],
    ['wechat',         'WeChat',      '<i class="fa-brands fa-weixin"></i>',             'smm-wechat'],
    ['snapchat',       'Snapchat',    '<i class="fa-brands fa-snapchat"></i>',           'smm-snapchat'],
    ['tumblr',         'Tumblr',      '<i class="fa-brands fa-tumblr"></i>',             'smm-tumblr'],
    ['threads',        'Threads',     '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32L7.734 7.847c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388.108.046.216.094.321.142 1.49.7 2.58 1.761 3.154 3.07.797 1.82.871 4.79-1.548 7.158-1.85 1.81-4.094 2.628-7.277 2.65Zm1.003-11.69c-.242 0-.487.007-.739.021-1.836.103-2.98.946-2.916 2.143.067 1.256 1.452 1.839 2.784 1.767 1.224-.065 2.818-.543 3.086-3.71a10.5 10.5 0 0 0-2.215-.221z"/></svg>', 'smm-threads'],
    ['vk',             'VK',          '<i class="fa-brands fa-vk"></i>',                'smm-vk'],
    ['ok',             'OK',          '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 5a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-4.5 8.5c.793.793 1.88 1.22 3 1.42v1.08H9a1 1 0 1 0 0 2h2v1a1 1 0 1 0 2 0v-1h2a1 1 0 1 0 0-2h-1.5v-1.08a5.001 5.001 0 0 0 3-1.42 1 1 0 1 0-1.414-1.414A3 3 0 0 1 12 16a3 3 0 0 1-2.086-.914A1 1 0 1 0 8.5 16.5z"/></svg>', 'smm-ok'],
    ['kakao',          'KakaoTalk',   '<svg viewBox="0 0 24 24" fill="currentColor" style="color:#3c1e1e"><path d="M12 3C6.477 3 2 6.477 2 10.857c0 2.796 1.57 5.25 3.938 6.698l-.938 3.445 4.297-2.796A11.74 11.74 0 0 0 12 18.714c5.523 0 10-3.476 10-7.857S17.523 3 12 3z"/></svg>', 'smm-kakaotalk'],
    ['viber',          'Viber',       '<i class="fa-brands fa-viber"></i>',              'smm-viber'],
    ['threema',        'Threema',     '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1a5 5 0 0 0-5 5v2H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5zm0 2a3 3 0 0 1 3 3v2H9V6a3 3 0 0 1 3-3zm0 9a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"/></svg>', 'smm-threema'],
    ['signal',         'Signal',      '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0a1.794 1.794 0 0 0-.37.04l-.367.08A12.006 12.006 0 0 0 .04 11.63C-.3 14.145.342 16.64 1.68 18.74l-.04.01L.09 23.01l4.26-1.55.01-.04c2.1 1.34 4.59 1.98 7.1 1.64A12.003 12.003 0 0 0 23.96 12.37c.34-2.515-.3-5.01-1.64-7.11l.04-.01L23.91.99l-4.26 1.55-.01.04A11.98 11.98 0 0 0 12 0zm0 2.182a9.818 9.818 0 0 1 6.77 16.93A9.818 9.818 0 1 1 12 2.182z"/></svg>', 'smm-signal'],
    ['messenger',      'Messenger',   '<i class="fa-brands fa-facebook-messenger"></i>', 'smm-messenger'],
    ['douyin',         'Douyin',      '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>', 'smm-douyin'],
  ];

  /* ─────────────────────────────────────────────────
     URL SANITISER
     Allowlist of safe protocols. Anything else is
     silently skipped to prevent XSS via javascript:
     or data: URIs injected into href attributes.
  ───────────────────────────────────────────────── */
  var SAFE_PROTOCOLS = ['https:', 'http:', 'viber:', 'tg:', 'mailto:'];

  function _sanitiseURL(url) {
    if (!url || typeof url !== 'string') return null;
    var trimmed = url.trim();
    if (trimmed === '') return null;
    try {
      // Resolve relative URLs against the current origin so the protocol check
      // works even when a scheme-relative URL is accidentally supplied.
      var parsed = new URL(trimmed, global.location && global.location.href);
      if (SAFE_PROTOCOLS.indexOf(parsed.protocol) === -1) {
        console.warn('[SocialMediaModal] Skipping URL with disallowed protocol:', trimmed);
        return null;
      }
      return trimmed; // Return the original string, not the parsed form
    } catch (e) {
      console.warn('[SocialMediaModal] Skipping invalid URL:', trimmed);
      return null;
    }
  }

  /* ─────────────────────────────────────────────────
     STYLES
  ───────────────────────────────────────────────── */
  var CSS = [
    /* Overlay */
    '#smm-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:99999;align-items:center;justify-content:center;}',
    '#smm-overlay.smm-active{display:flex;}',
    /* Modal card */
    '#smm-modal{position:relative;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;width:440px;max-width:95vw;border-radius:14px;overflow:visible;box-shadow:0 8px 32px rgba(0,0,0,.28);}',
    /* Header */
    '#smm-header{background:#1a2744;border-bottom:3px solid #ffd400;border-radius:14px 14px 0 0;display:flex;align-items:center;justify-content:space-between;padding:6px 12px;overflow:hidden;}',
    '#smm-header-left{display:flex;align-items:center;gap:8px;}',
    '#smm-header-icon{color:#fff;font-size:15px;display:flex;align-items:center;}',
    '#smm-header-title{color:#fff;font-size:15px;font-weight:800;letter-spacing:.4px;}',
    '#smm-header-title span{font-weight:400;}',
    /* Close button — floats over the top-right corner of the modal */
    '#smm-close-btn{position:absolute;top:-14px;right:-14px;background:#ffd400;border:2.5px solid #1a2744;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;color:#1a2744;cursor:pointer;transition:background .25s ease,border-color .25s ease,color .25s ease;padding:0;z-index:10;box-shadow:0 2px 6px rgba(0,0,0,.25);}',
    '#smm-close-btn:hover,#smm-close-btn:focus-visible{background:#1a2744;border-color:#ffd400;color:#ffd400;}',
    '#smm-close-btn svg{width:15px;height:15px;transition:transform .25s ease;}',
    '#smm-close-btn svg line{stroke:currentColor;stroke-width:3;stroke-linecap:round;}',
    '#smm-close-btn:hover svg,#smm-close-btn:focus-visible svg{transform:rotate(60deg);}',
    /* Body */
    '#smm-body{background:#f0f2f5;padding:8px 8px 8px;border-radius:0 0 14px 14px;overflow:hidden;}',
    /* powered-by footer */
    '.smm-powered{display:flex;align-items:center;justify-content:center;gap:6px;padding:8px 0 2px;font-family:Arial,sans-serif;}',
    '.smm-powered-label{font-size:11px;color:#b0b8cc;font-style:italic;}',
    '.smm-powered-badge{display:inline-flex;align-items:center;gap:3px;background:#ffd400;color:#1a2744;font-size:10px;font-weight:700;padding:1px 6px 1px 3px;border-radius:4px;text-decoration:none;transition:background .2s;}',
    '.smm-powered-badge:hover{background:#ffb700;}',
    '.smm-powered-badge img{width:13px;height:13px;border-radius:3px;object-fit:cover;display:block;}',
    /* Grid box */
    '#smm-grid-box{background:#fff;border:2.5px solid #1a2744;border-radius:12px;padding:6px 5px;}',
    '#smm-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:6px 3px;}',
    /* Responsive: collapse to fewer columns on very narrow viewports */
    '@media(max-width:340px){#smm-grid{grid-template-columns:repeat(4,1fr);}}',
    '@media(max-width:280px){#smm-grid{grid-template-columns:repeat(3,1fr);}}',
    '.smm-item{display:flex;flex-direction:column;align-items:center;gap:2px;text-decoration:none;}',
    '.smm-item:hover .smm-item-label{color:#ffd400;text-decoration:underline;text-decoration-color:#ffd400;text-underline-offset:2px;text-decoration-thickness:1px;}',
    '.smm-icon{width:38px;height:38px;border-radius:50%;background:#fff;border:2px solid;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform .2s;margin:0 auto;}',
    '.smm-icon:hover{transform:scale(1.12);}',
    '.smm-icon i{font-size:16px;}',
    '.smm-icon svg{width:16px;height:16px;}',
    '.smm-item-label{font-size:8px;color:#374151;font-weight:600;text-align:center;line-height:1.2;text-decoration:none;}',
    /* Brand colors */
    '.smm-website{color:#3b82f6;border-color:#3b82f6}',
    '.smm-blog{color:#ff6b35;border-color:#ff6b35}',
    '.smm-facebook{color:#1877f2;border-color:#1877f2}',
    '.smm-instagram{color:#dc2743;border-color:#dc2743}',
    '.smm-instagram i::before{background:linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent}',
    '.smm-youtube{color:#ff0000;border-color:#ff0000}',
    '.smm-tiktok{color:#000;border-color:#000}',
    '.smm-x{color:#000;border-color:#000}',
    '.smm-pinterest{color:#bd081c;border-color:#bd081c}',
    '.smm-linkedin{color:#0a66c2;border-color:#0a66c2}',
    '.smm-whatsapp{color:#25d366;border-color:#25d366}',
    '.smm-telegram{color:#26a5e4;border-color:#26a5e4}',
    '.smm-arattai{color:#ff6b00;border-color:#ff6b00}',
    '.smm-discord{color:#5865f2;border-color:#5865f2}',
    '.smm-playstore{color:#34a853;border-color:#34a853}',
    '.smm-google-biz{color:#4285f4;border-color:#4285f4}',
    '.smm-wikipedia{color:#000;border-color:#000}',
    '.smm-reddit{color:#ff4500;border-color:#ff4500}',
    '.smm-quora{color:#b92b27;border-color:#b92b27}',
    '.smm-wechat{color:#07c160;border-color:#07c160}',
    '.smm-snapchat{background:#fffc00;border-color:#fffc00}',
    '.smm-snapchat i{color:#000!important}',
    '.smm-tumblr{color:#35465c;border-color:#35465c}',
    '.smm-threads{color:#000;border-color:#000}',
    '.smm-vk{color:#0077ff;border-color:#0077ff}',
    '.smm-ok{color:#f7931e;border-color:#f7931e}',
    '.smm-kakaotalk{background:#fae100;border-color:#fae100}',
    '.smm-kakaotalk i,.smm-kakaotalk svg{color:#3c1e1e!important}',
    '.smm-viber{color:#7360f2;border-color:#7360f2}',
    '.smm-threema{color:#3d3d3d;border-color:#3d3d3d}',
    '.smm-signal{color:#3a76f0;border-color:#3a76f0}',
    '.smm-messenger{color:#0084ff;border-color:#0084ff}',
    '.smm-messenger i::before{background:linear-gradient(45deg,#0084ff,#a033ff,#ff5f6d);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent}',
    '.smm-douyin{color:#000;border-color:#000}',
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
    if (document.getElementById('smm-styles')) return;
    var s = document.createElement('style');
    s.id = 'smm-styles';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ─────────────────────────────────────────────────
     TITLE HTML HELPER
     Fix #1: Both default and custom titles are
     returned as consistently formatted HTML so
     styling (bold vs normal weight) is always uniform.
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
    return 'Social <span>- Media Links</span>';
  }

  /* ─────────────────────────────────────────────────
     BUILD MODAL DOM (once)
     Fix #2: On re-init the modal now always re-renders
     icons so updated links are applied immediately.
     Fix #6: Trigger listeners are tracked and removed
     before adding new ones on each init() call.
  ───────────────────────────────────────────────── */
  function buildModal(title) {
    if (document.getElementById('smm-overlay')) {
      // Modal already exists — update title and section label only.
      // renderIcons() is called separately by the caller for link updates.
      var t = document.getElementById('smm-header-title');
      if (t) t.innerHTML = _titleHTML(title);
      return;
    }

    var overlay = document.createElement('div');
    overlay.id = 'smm-overlay';
    // Fix #9: Add ARIA role and labelling for screen readers
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'smm-header-title');
    overlay.innerHTML = [
      '<div id="smm-modal">',
        '<button id="smm-close-btn" type="button" aria-label="Close modal">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
          '<line x1="5" y1="5" x2="19" y2="19"></line>' +
          '<line x1="19" y1="5" x2="5" y2="19"></line>' +
          '</svg>' +
        '</button>',
        '<div id="smm-header">',
          '<div id="smm-header-left">',
            '<div id="smm-header-icon"><i class="fa-solid fa-share-nodes"></i></div>',
            '<div id="smm-header-title">' + _titleHTML(title) + '</div>',
          '</div>',
        '</div>',
        '<div id="smm-body">',
          '<div id="smm-grid-box">',
            '<div id="smm-grid"></div>',
          '</div>',
          '<div class="smm-powered">' +
            '<span class="smm-powered-label">Powered by</span>' +
            '<a class="smm-powered-badge" href="https://wagsone.blogspot.com" target="_blank" rel="noopener noreferrer">' +
            '<img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbDpzcGFjZT0icHJlc2VydmUiIHZpZXdCb3g9IjE3NS45NiAzMTEuMjcgNjk5LjI4IDY5OC45NiI+PHBhdGggZmlsbD0iIzFhMjc0NCIgZD0iTTE3NiA2NzJWMzExLjNoNjk5LjJ2Njk5SDE3NnptNDI4LjItMzM4LjlhMjY3IDI2NyAwIDAgMC02OC05LjFjLTIyLjItLjctNDQuMiAxLjktNjUuOCA2LjZhMzMxIDMzMSAwIDAgMC05My4zIDM1LjggMzQxIDM0MSAwIDAgMC0xMDEuNiA4OCAzMzggMzM4IDAgMCAwLTU3LjggMTEzLjIgMjg2IDI4NiAwIDAgMC0xMi40IDcwLjRjLS42IDIwLjMuNCA0MC42IDEuOCA2MC44IDEuNSAyMi43IDcgNDQuNyAxNC4yIDY2LjJhMzQxIDM0MSAwIDAgMCAzOCA3OWMxIDEuNiAyIDQuMiAxLjQgNmE0MTYgNDE2IDAgMCAxLTcuNSAyMy41bC0xNy4xIDQ5cS02LjIgMTguOC0xMiAzNy41Yy0uNiAxLjYtLjUgMy41LS43IDUuMiAxLjguMiAzLjcuNyA1LjMuM2wxOC01LjQgMjUuMi04IDI5LjYtMTBjOS45LTMuMiAxOS45LTYgMjkuNy05LjMgNS0xLjcgOS4zLTIuMyAxMy45IDEuNXE3LjYgNS45IDE1LjkgMTFhMzA0IDMwNCAwIDAgMCA2NC41IDMyLjVBMjk0IDI5NCAwIDAgMCA1MzggOTk3LjJjMTAuNi0uOCAyMS4zLTEgMzEuOS0yLjNhMzE0IDMxNCAwIDAgMCAxMTUuOS0zOC41cTc1LjgtNDIuNSAxMjIuMy0xMTYuMWEzMjggMzI4IDAgMCAwIDUyLjEtMTg5LjcgMzM2IDMzNiAwIDAgMC0xMi4yLTc5LjhBMzM4IDMzOCAwIDAgMCA3NzIuMiA0MzRhMzM1IDMzNSAwIDAgMC0xNDQuOS05NC41Yy03LjQtMi41LTE1LTMuOS0yMi42LTUuN3oiLz48cGF0aCBmaWxsPSIjMTg5YzBmIiBkPSJNNTM3LjEgOTk3LjJoLTEyLjJjLTM0LjQtLjItNjcuMy03LjgtOTkuNC0xOS40YTMwNCAzMDQgMCAwIDEtNjQuNS0zMi40Yy01LjQtMy42LTExLTctMTYtMTEuMS00LjUtMy44LTguOC0zLjItMTMuOC0xLjUtOS44IDMuMy0xOS44IDYuMS0yOS43IDkuM2wtMjkuNiAxMC0yNS4zIDhxLTkgMi45LTE4IDUuNGMtMS41LjQtMy40LS4xLTUuMi0uMy4yLTEuNy4xLTMuNi42LTUuMnE1LjktMTguOCAxMi4xLTM3LjRsMTcuMS00OS4xcTQuMS0xMS43IDcuNS0yMy41Yy41LTEuOC0uNC00LjQtMS41LTZhMzQxIDM0MSAwIDAgMS0zOC03OWMtNy0yMS41LTEyLjYtNDMuNS0xNC4xLTY2LjFhNjAwIDYwMCAwIDAgMS0xLjgtNjAuOGMuOC0yNCA1LjYtNDcuNSAxMi40LTcwLjZhMzM4IDMzOCAwIDAgMSA1Ny44LTExM0EzNDEgMzQxIDAgMCAxIDM3NyAzNjYuM2EzMzEgMzMxIDAgMCAxIDkzLjQtMzUuOGMyMS42LTQuNyA0My42LTcuMyA2Ni4zLTZxLjYgNC43IDAgOC45aC02OVYzOTZoN3EzMSAwIDYyLjMuNi4xIDEuNi0uMiAyLjljLTEzLjcuNS0yNyAuMi00MC4yIDEuNS0yOC43IDIuNy01NiAxMS4xLTgyIDIzLjdBMjU1IDI1NSAwIDAgMCAzMTAgNTE3LjZhMjU5IDI1OSAwIDAgMC00MS42IDEyNCAyNTkgMjU5IDAgMCAwIDguNCA4Ny41QTI2MSAyNjEgMCAwIDAgMzU2IDg1Ny42YTI0NyAyNDcgMCAwIDAgNzMuNCA0NS42YzIxLjQgOC42IDQzLjMgMTUgNjYuNCAxNi45IDEzLjcgMSAyNy41IDEuMyA0MS4zIDIuM3EuMSAxLS40IDEuOC0zNC4yLjMtNjcuOC4ydjYyLjRoNi4zcTMxIDAgNjIgLjd6bS0yNDQuOC05OC44IDcuOC0xLjMuNi0yLjItOC02LjhjLS4zIDQtLjcgNy0uNCAxMC4zIi8+PHBhdGggZmlsbD0iI2ViNjMwZiIgZD0iTTUzNy4xIDkyNHEtLjEtLjUuNC0xLjdjOC40LTEuMSAxNi40LTEuNCAyNC4zLTIuNiA2OC0xMC43IDEyNC4xLTQyLjMgMTY2LjItOTcgNTIuMi02OCA2Ny4zLTE0NC41IDQ3LjMtMjI3LjRBMjUzIDI1MyAwIDAgMCA2OTQuNyA0NjNhMjQ4IDI0OCAwIDAgMC05Ny4zLTUzLjNjLTE0LjItNC0yOS02LjItNDMuNS05LjVhNiA2IDAgMCAwLTIuMy0uMSA2NCA2NCAwIDAgMS04LjctLjhsLTQuNS0zIDY2LjMtLjF2LTYyLjRjNy41IDEuOCAxNS4yIDMuMiAyMi42IDUuN0EzMzUgMzM1IDAgMCAxIDc3Mi4yIDQzNCAzMzggMzM4IDAgMCAxIDg0OCA1NzAuOGEzMzYgMzM2IDAgMCAxIDEyLjIgNzkuOCAzMjggMzI4IDAgMCAxLTUyLjEgMTg5LjcgMzM4IDMzOCAwIDAgMS0xMjIuMyAxMTYgMzE0IDMxNCAwIDAgMS0xMTYgMzguNmMtMTAuNSAxLjMtMjEuMiAxLjUtMzIuMiAyLjNhMzUgMzUgMCAwIDEgMC05LjhjMjIuOS0uNSA0NS4zLS41IDY4LS41di02Mi41aC02eiIvPjxwYXRoIGZpbGw9IiNmMmY5ZjEiIGQ9Ik02MDQuNyAzMzMuOFYzOTZoLTY2LjVsLTEuMS4zLTYyLjUtLjNoLTYuOXYtNjIuNUg1MzdsNjcuNi4ybS04MiAzNy4zaDUuNHE0LjkuNiA0LjMtNC4yYy0uMi0xLjYuMy0zLjQtLjEtNS0uMy0xLTEuNS0yLjQtMi4zLTIuNHEtMTEuNC0uMi0yMy42LS4xYzAgMi40LjIgNCAwIDUuNy0uNyA0LjYuOSA2LjcgNS44IDYgMy4xLS4zIDYuMyAwIDEwLjUgMG01Ny4yIDBoMTcuNGMyLjggMCA0LS44IDMuOC0zLjctLjEtMS44LjMtMy43LS4xLTUuNC0uMi0xLTEuNS0yLjUtMi4zLTIuNXEtMTEuNi0uMi0yMy42IDAgLjIgNC41IDAgOGMtLjMgMyAxLjIgMy45IDQuOCAzLjZNNTMyIDM0MC45Yy0uNy0uNi0xLjUtMS41LTIuMi0xLjYtNyAwLTE0LS4zLTIxIDAtNC43LjItMi4zIDQuMi0yLjYgNi42LS4zIDIuMi0uOCA1IDMgNC44aDE0YzEwLS4xIDguOCAxLjcgOC44LTkuOG0tNjAuOCA0LjZjLjMgMi0xLjEgNS4xIDIuNyA1LjJoMjNWMzQwcS0xLS41LTEuNi0uNi05LjUuMi0xOS0uMmMtNC4yLS4yLTUuNyAxLjQtNS4xIDYuM204Ni4xIDUuM2M5LjYgMCAxMC41LTEuMSA3LjctMTEuNWgtMjJjLTQuNS4yLTIuOCAzLjgtMyA2IDAgMi4zLTEuMSA1LjUgMyA1LjV6bTQyLjQtLjMgMS05YzAtLjctMS41LTItMi4zLTJxLTExLjYtLjItMjMuMy0uMXYxMS40YzguMSAwIDE2IDAgMjQuNi0uM20tMzcuNyA4LjloLTE0LjljLTcuNSAwLTcuNCAwLTcuMyA3LjdxLS4xIDQuMyA0LjEgNGwxNy40LS4xYzEuNiAwIDQuNS0xLjcgNC40LTIuMS0uNy0zLjIgMy03LjktMy43LTkuNW0tOTAuNyA5LjdjMS4zLjcgMi42IDEuOCA0IDEuOXE2LjUuMiAxMi45LjFjOS44IDAgOS44IDAgOS05LjhxLS4yLS44LS42LTEuNGwtMS40LS40cS03LjctLjItMTUuNC0uMWMtOS42IDAtOC42LTEuNC04LjUgOS43bTczLjMgMTFjLTYtLjktNC40IDMuNS00LjcgNi44LS40IDMuNyAxLjQgNC40IDQuNyA0LjNxOS0uMiAxOCAwYzUgMCAzLTMuNyAzLjMtNi4xcy43LTUuMi0zLjQtNXptMzcuOSAxMWM1IDAgMTAgLjMgMTUgMCAxLjEtLjIgMy4yLTIgMy4xLTMtLjEtMi43LTEtNy41LTEuOC03LjYtNy45LS42LTE1LjgtLjQtMjMuNi0uNHYxMXptLTUzLjQgMGM1LjctMS4yIDItNS42IDIuOC04LjUgMC0uNS0yLjctMi4zLTQuMi0yLjQtNi0uMy0xMiAwLTE4LS4yLTQuOCAwLTMuNSAzLjMtMy42IDUuOSAwIDIuNi0uOCA1LjUgMy43IDUuM3E4LjgtLjIgMTkuMyAwbS0zNSAwYzYtMS4xIDItNS42IDIuOS04LjUuMS0uNS0yLjYtMi40LTQtMi41LTUuOC0uMy0xMS42LjEtMTcuNC0uMi00LjgtLjMtNC40IDIuNi00LjQgNS43LS4xIDMuNCAwIDUuOCA0LjYgNS42IDUuOC0uNCAxMS42LS4xIDE4LjQtLjEiLz48cGF0aCBmaWxsPSIjZWI2MzBmIiBkPSJNNjA0LjQgMzMzLjVxLTMzIC4zLTY3IDBhNjggNjggMCAwIDEtLjMtOXEzNC4xLS40IDY3LjMgOSIvPjxwYXRoIGZpbGw9IiMxYTI3NDQiIGQ9Im01NDMgMzk5LjYgMTEgLjhjMTQuNSAzIDI5LjIgNS4zIDQzLjQgOS4zYTI0OCAyNDggMCAwIDEgOTcuMyA1My4zYzQwLjQgMzUuOCA2OCA3OS45IDgwLjYgMTMyLjMgMjAgODMgNSAxNTkuNC00Ny4zIDIyNy40LTQyIDU0LjctOTguMiA4Ni4zLTE2Ni4yIDk3LTcuOSAxLjItMTUuOSAxLjUtMjQuMyAyLjMtMTQuMi0uNi0yOC0uOC00MS43LTItMjMtMS43LTQ1LTguMi02Ni40LTE2LjhhMjQ3IDI0NyAwIDAgMS03My40LTQ1LjYgMjYxIDI2MSAwIDAgMS03OS4zLTEyOC41IDI1OSAyNTkgMCAwIDEtOC4zLTg3LjUgMjU5IDI1OSAwIDAgMSA0MS41LTEyNCAyNTUgMjU1IDAgMCAxIDEwNC43LTkyLjggMjQxIDI0MSAwIDAgMSA4Mi0yMy43YzEzLjItMS4zIDI2LjUtMSA0MC42LTEuNHptLTQ0LjcgMTk3LjFxLTEwLjUgNDAuNi0yMiA4MC41bC0zLTQuNS0zOS40LTY3LjhjLTQuNS03LjctMTAuNy0xMi42LTE5LjktMTIuOS05LS4yLTE2LjMgMy42LTIxIDExLjMtNSA4LjItNC40IDE2LjcuNCAyNWw0Ny40IDgxLjYgMjMuMyA0MGEyMiAyMiAwIDAgMCAyMy41IDEwLjZjMTEtMi40IDE3LjktOS40IDE5LjMtMTkuNiAxLjQtMyAzLjEtNiA0LTkgNy4xLTI2LjEgMTQtNTIuMyAyMS43LTc4LjJxMSAuOSAxLjYgMS45YzEwLjcgMTguMyAyMS43IDM2LjUgMzIgNTUgNS44IDEwLjMgMTUuNyAxMy43IDI2LjEgMTIuMSA4LTEuMiAxNS45LTEwLjEgMTgtMjAuMiAxLjItMi45IDMtNS42IDMuNy04LjZhMjAwMzkgMjAwMzkgMCAwIDAgMzYtMTM2LjIgMjMuMyAyMy4zIDAgMCAwLTIzLjYtMjkuNWMtOS40LjEtMTguNCA3LjEtMjEuMyAxNy40cS01LjEgMTguNS05LjkgMzctNy40IDI4LjYtMTUuOSA1Ni40LTEuOC0yLTMuMy00LjNMNTM2IDU2NmMtNi43LTExLjUtMTktMTQuOC0zMC45LTguNmEyMyAyMyAwIDAgMC0xMC4yIDMwLjMgNjcgNjcgMCAwIDEgMy40IDkuMSIvPjxwYXRoIGZpbGw9IiNmMmY5ZjEiIGQ9Ik01MzYuNyA5MjQuMnEzMS43IDAgNjIuOS4yaDZ2NjIuNUg0NjguOXYtNjIuNXptLTM4IDM0Ljh2LTlxLTExLjguMi0yMi4zIDBjLTQuNS0uMy00LjEgMi42LTQgNS40LjEgMy0xLjIgNi42IDQuMiA2LjRsMTcuOS0uMWMxLjQgMCAyLjctMS4yIDQuMS0yLjdtOC43LS45YzEuMSAxLjIgMi4yIDMuNCAzLjQgMy41cTkuOC40IDE5LjQgMGMxLjIgMCAzLTEuOCAzLjMtMyAuNS0yLjcuMS01LjUuMS04LjJoLTI2LjJ6TTQ5NyA5ODEuOHExLTMgMS43LTYuMmMuOC00LjItMS4xLTUuNS01LjItNS4zcS04LjUuNS0xNyAwYy01LS4xLTMuOSAzLjMtNCA2LjJzLS4zIDUuNiA0LjIgNS40YzYuNC0uMyAxMi45IDAgMjAuMy0uMW0xNS0xMS40Yy02LjQtLjYtNC4yIDQuMi00LjYgNy40LS41IDQgMiA0LjIgNSA0aDE3LjRjNC42LjMgMy44LTMgMy44LTUuNnMxLTYtMy43LTUuOHptMjkuMS0xNi43YzAgOCAwIDggOCA4aDguNWMxMC44IDAgMTAuOCAwIDkuMy0xMC44bC0uOS0uOS0yMi4yLjFjLTEgMC0xLjggMS43LTIuNyAzLjZtNTIuMyA4YzkuNiAwIDEwLjItLjggOC0xMS4zSDU3NnEuMiAzLjcgMCA2LjgtLjYgNSA0LjUgNC42YzQtLjIgOCAwIDEyLjkgMG0tOTUuNi0zMS4zcS0xMS4zLS40LTIyLjQtLjRjLTQuOCAwLTIuNiA0LTMgNi40LS4yIDIuNC0uMiA0LjggMy40IDQuNmgxNGM5LjYgMCA5LjYgMCA4LTEwLjZtNzguNSA5LjYgMjUuNyAxLjNjMC0zLjcuMi02LjIgMC04LjctLjItMS0xLjUtMi41LTIuMy0yLjVxLTExLjUtLjItMjMuNi0uMWMwIDMuNSAwIDYuMy4yIDEwbS05LjMgNDBjMC0yLjEuNC00LjMgMC02LjQtLjItMS4xLTEuNy0yLjktMi43LTNxLTEwLjItLjMtMjAuMy4xYy0xIDAtMi43IDIuNi0yLjcgNCAwIDIuNC0yIDYuNiAyLjMgNi44cTExLjUuNCAyMy40LTEuNG0yOC40LTkuNWgtMTl2MTEuMWgyM2MuOCAwIDItLjYgMi4xLTEgLjItMyAuNi02IDAtOC44IDAtLjctMy4zLTEtNi0xLjRNNTY1LjEgOTQxYzQtMy4xIDEuMS03IDEuOC0xMWgtMTcuMmMtOS4zIDAtOS4zIDAtOC41IDkuM3EuMS43LjggMS44ek01MTEgOTMwYy00IDEtNC43IDMuOC0yLjcgMTAuNmgyNS4xcS0uMi0zIDAtNS4zYy43LTQuNS0xLjMtNS43LTUuNS01LjQtNS4zLjMtMTAuNyAwLTE2LjkgMCIvPjxwYXRoIGZpbGw9IiMxODljMGYiIGQ9Ik0yOTIgODk4LjJjMC0zLjIuNC02IC44LTEwbDcuOSA2LjYtLjYgMi4zcS0zLjguNy04LjEgMSIvPjxwYXRoIGZpbGw9IiNlYjYzMGYiIGQ9Ik01NDIuOSAzOTkuM3EtMi4zLjQtNS4zLjNhNiA2IDAgMCAxLS42LTIuOXEuMy0uNS44LS40em0xMSAuOXEtLjYuMy0xLjcgMCAuNi0uMyAxLjcgMCIvPjxwYXRoIGZpbGw9IiMxODljMGYiIGQ9Ik01MjIgMzcxYy0zLjcgMC02LjktLjMtMTAgMC00LjkuNy02LjUtMS40LTUuOS02IC4zLTEuNyAwLTMuMyAwLTUuN2gyMy43Yy44LjEgMiAxLjYgMi4zIDIuNS40IDEuNiAwIDMuMy4xIDVxLjYgNC44LTQuMyA0LjJ6Ii8+PHBhdGggZmlsbD0iIzE4OWMwZiIgZD0iTTU3OS4yIDM3MWMtMy4xLjMtNC42LS42LTQuMy0zLjZ2LTguMWwyMy42LjFjLjggMCAyIDEuNSAyLjMgMi41LjQgMS43IDAgMy42LjEgNS40LjMgMy0xIDMuOC0zLjggMy43eiIvPjxwYXRoIGZpbGw9IiMxODljMGYiIGQ9Ik01MzIuMiAzNDEuM2MwIDExIDEuMSA5LjMtOSA5LjRoLTEzLjljLTMuOC4xLTMuMy0yLjctMy00LjguMy0yLjQtMi02LjQgMi43LTYuNnExMC41LS4zIDIwLjkgMGMuNyAwIDEuNSAxIDIuMyAybS02MSAzLjdjLS42LTQuNSAxLTYuMSA1LjItNS45cTkuNS40IDE5IC4yLjYgMCAxLjYuNnYxMC44aC0yM2MtMy44IDAtMi40LTMuMi0yLjctNS43bTg1LjYgNS43SDU0M2MtNC4xIDAtMy0zLjMtMy01LjUuMS0yLjMtMS41LTUuOSAzLTZoMjIuMWMyLjcgMTAuNCAyIDExLjUtOC4yIDExLjVtNDIuNC0uMWgtMjR2LTExLjNoMjMuMmMuOCAwIDIuMyAxLjQgMi4yIDJxLS4xIDQuNS0xLjQgOS4zIi8+PHBhdGggZmlsbD0iIzE4OWMwZiIgZD0iTTU2Mi42IDM1OS4zYzYuMyAxLjYgMi41IDYuMyAzLjIgOS41IDAgLjMtMi44IDItNC40IDItNS44LjMtMTEuNiAwLTE3LjQuMi0zIDAtNC0xLTQtNC0uMi03LjctLjMtNy43IDcuMi03Ljh6bS05MS4zIDkuMmMwLTEwLjYtMS05LjEgOC42LTkuMmgxNS40cS44LjEgMS40LjUuNC44LjUgMS40Yy45IDkuOC45IDkuOC05IDkuOHEtNi4zLjEtMTIuOC0uMWMtMS40LS4xLTIuNy0xLjMtNC0yLjQiLz48cGF0aCBmaWxsPSIjMTg5YzBmIiBkPSJNNTQ1LjIgMzgwaDE3LjRjNC4xLS4yIDMuNiAyLjYgMy40IDVzMS42IDYuMS0zLjQgNmwtMTcuOS4xYy0zLjMuMS01LjEtLjYtNC43LTQuNC4zLTMuMi0xLjMtNy42IDUuMi02LjciLz48cGF0aCBmaWxsPSIjMTg5YzBmIiBkPSJNNTgyIDM5MWgtNi43di0xMWM3LjggMCAxNS43LS4yIDIzLjYuNC44IDAgMS43IDQuOSAxLjggNy41IDAgMS0yIDMtMy4xIDNxLTcuNC4zLTE1LjUuMiIvPjxwYXRoIGZpbGw9IiMxODljMGYiIGQ9Ik01MjguOCAzOTFxLTkuOS0uMS0xOSAuMWMtNC40LjItMy42LTIuOC0zLjYtNS4zLjEtMi42LTEuMi02IDMuNy01LjkgNiAuMiAxMi0uMSAxNy45LjIgMS41IDAgNC4zIDEuOSA0LjIgMi40LS43IDIuOSAyLjkgNy4zLTMuMyA4LjUiLz48cGF0aCBmaWxsPSIjMTg5YzBmIiBkPSJNNDkzLjggMzkxcS05LjMtLjItMTcuOS4yYy00LjUuMi00LjctMi4yLTQuNi01LjYgMC0zLS40LTYgNC40LTUuNyA1LjguMyAxMS42LS4xIDE3LjQuMiAxLjQgMCA0LjEgMiA0IDIuNS0uOCAyLjggMyA3LjQtMy4zIDguNSIvPjxwYXRoIGZpbGw9IiM0MTgzZWYiIGQ9Im01ODAgNjM5LjUgMTUuMi01Ni43cTQuOC0xOC42IDkuOS0zN2MzLTEwLjMgMTItMTcuNCAyMS40LTE3LjQgMTEgMCAyMC4zIDYuMiAyMy4zIDE2LjdhMjUgMjUgMCAwIDEgLjIgMTIuN0EyMDAzOSAyMDAzOSAwIDAgMSA2MTQgNjk0Yy0uOCAzLTIuNSA1LjctNC4yIDktOC42IDkuMS0xOS44IDExLTI5LjggNS42LTkuNC01LjEtMTMuNy0xNS4zLTEwLjktMjYuOXptNTIuNy04MC42cS0xLjUtMS4zLTMuMS0yLjRjLTUuOC0zLTEyLjktMS43LTE2LjcgMy4yYTE0IDE0IDAgMCAwIC43IDE3LjkgMTMgMTMgMCAwIDAgMTYuOCAyYzYuMy00LjEgNy42LTEzIDIuMy0yMC43bS0yNS4xIDExOHEtLjItMS41LS43LTNjLTItNS42LTguMS05LjQtMTQuMS04LjhzLTEwLjYgNi0xMS41IDEyLjdjLS43IDUuNiAzIDExIDguNiAxMy4yIDggMy4yIDE3LjctMi4yIDE3LjctMTQuMSIvPjxwYXRoIGZpbGw9IiNlNTQyMzQiIGQ9Ik01MDYuNiA3NDEuNmMtMS4xIDkuNi04IDE2LjYtMTkgMTktOC43IDItMTguNy0yLjQtMjMuNS0xMC41TDQ0MC44IDcxMGwtNDcuNC04MS42Yy00LjgtOC4zLTUuNC0xNi44LS4zLTI1QTIzIDIzIDAgMCAxIDQxNCA1OTJjOS4yLjMgMTUuNSA1LjIgMjAgMTNxMTkuNSAzMy44IDM5LjMgNjcuN2wzLjMgNXEtNS40IDIyLTExIDQzLjNhMjMgMjMgMCAwIDAgMTYuMyAyN2M5LjYgMi44IDE3LjYtLjIgMjQuNy02LjVtLTg4LTk4LjZjNS43IDEuOSAxMC4zLS4zIDEzLjgtNC41cTUuMi02LjcgMS0xNC41YTEzIDEzIDAgMCAwLTEzLjEtNy4yYy02IC41LTEwLjQgNC42LTExLjQgMTAuN3EtMS45IDEwLjIgOS44IDE1LjUiLz48cGF0aCBmaWxsPSIjMTg5YzBmIiBkPSJNNTc5LjYgNjM5LjNxLTUuMSAyMS4zLTEwLjUgNDIuNGMtMi44IDExLjYgMS41IDIxLjggMTAuOSAyNi45IDEwIDUuNSAyMS4yIDMuNSAyOS43LTUuMi0xLjUgOS4zLTkuMyAxOC4yLTE3LjMgMTkuNC0xMC41IDEuNi0yMC40LTEuOC0yNi4yLTEycS0xNS42LTI3LjgtMzItNTUuMS0uNS0xLTItMi4zYy0zLTUuNC01LjMtMTAuNS04LjEtMTUuNGwtMTkuMy0zM2MtMS45LTMuMS00LjMtNi02LjQtOWwtMy41LTguM2EyMyAyMyAwIDAgMSAxMC4zLTMwLjNjMTEuOS02LjIgMjQuMS0yLjkgMzAuOSA4LjZsNDAgNjguOHExLjMgMi4zIDMuNSA0LjVNNTM4IDU5NXEuMi0yIDAtNGMtMS03LjMtNy0xMi41LTE0LTEyYTEzIDEzIDAgMCAwLTEyLjEgMTMuOGMuMSA2LjIgNC41IDExLjkgMTAuMyAxMyA2LjUgMS4yIDEzLjYtMi4yIDE1LjgtMTAuOCIvPjxwYXRoIGZpbGw9IiNlMmI5NjAiIGQ9Ik00OTguMyA1OTYuNGE2NSA2NSAwIDAgMSA2LjUgOC43bDE5LjMgMzNxNCA3LjMgNy44IDE1LjFsLTIxIDc4LjdjLS45IDMuMi0yLjYgNi4xLTQuMSA5LjQtNy40IDYuNi0xNS4zIDkuNi0yNSA2LjlhMjMgMjMgMCAwIDEtMTYuMi0yN3E1LjUtMjEuNSAxMS4zLTQzLjF6bTUgMTE0LjNxLS42LTEuNC0xLjUtMi42YTEzIDEzIDAgMCAwLTE0LjYtNC44Yy01LjIgMS42LTkuMiA3LjUtOS4yIDEzLjUgMCA1LjQgMy42IDEwIDkgMTEuOSAxMC42IDMuNSAxOC44LTQuOSAxNi40LTE4Ii8+PHBhdGggZmlsbD0iIzE4OWMwZiIgZD0iTTQ5OC42IDk1OS41Yy0xLjQgMS0yLjggMi4xLTQuMSAyLjItNiAuMi0xMi0uMS0xNy45LjEtNS40LjItNC0zLjUtNC4yLTYuNC0uMS0yLjgtLjUtNS43IDQtNS41IDcuMS4zIDE0LjIuMSAyMi4yLjF6Ii8+PHBhdGggZmlsbD0iIzE4OWMwZiIgZD0iTTUwNy4zIDk1Ny43di03LjNoMjYuMmMwIDIuNy40IDUuNS0uMSA4LjItLjMgMS4yLTIuMSAzLTMuMyAzcS05LjguNC0xOS40IDBjLTEuMiAwLTIuMy0yLjMtMy40LTQiLz48cGF0aCBmaWxsPSIjMTg5YzBmIiBkPSJNNDk2LjQgOTgxLjhxLTEwLjMtLjItMTkuOS4xYy00LjQuMi00LjItMi41LTQuMS01LjRzLTEtNi4zIDQtNi4xcTguNS40IDE3IDBjNC0uMyA2IDEgNS4yIDUuMmEyNCAyNCAwIDAgMS0yLjIgNi4yIi8+PHBhdGggZmlsbD0iIzE4OWMwZiIgZD0iTTUxMi40IDk3MC40cTkgLjIgMTcuNCAwYzQuNi0uMSAzLjggMyAzLjcgNS44cy44IDUuOS0zLjkgNS43cS04LjctLjItMTcuNCAwYy0zIDAtNS40LS4yLTQuOS00LjEuNC0zLjItMS44LTggNS4xLTcuNCIvPjxwYXRoIGZpbGw9IiMxODljMGYiIGQ9Ik01NDEuMSA5NTMuMmMxLTEuNCAxLjgtMyAyLjctM3ExMS41LS4zIDIyLjItLjIuOS45LjggMWMxLjYgMTAuNyAxLjYgMTAuNy05LjIgMTAuN0g1NDljLTggMC04IDAtOC04LjUiLz48cGF0aCBmaWxsPSIjMTg5YzBmIiBkPSJNNTkyLjkgOTYxLjhxLTYuNi0uMi0xMi40IDAtNS4xLjUtNC41LTQuNi4yLTMuMSAwLTYuOGgyNS4zYzIuMyAxMC41IDEuNyAxMS4zLTguNCAxMS4zIi8+PHBhdGggZmlsbD0iIzE4OWMwZiIgZD0iTTQ5OCA5MzAuOGMxLjQgMTAuMyAxLjQgMTAuMy04LjMgMTAuM2gtMTRjLTMuNi4xLTMuNS0yLjMtMy4yLTQuNi4zLTIuNC0xLjktNi40IDMtNi40YTMwMyAzMDMgMCAwIDEgMjIuNS43Ii8+PHBhdGggZmlsbD0iIzE4OWMwZiIgZD0ibTU3Ni4yIDkzOS43LS4xLTkuNmgyMy42Yy44LjEgMiAxLjcgMi4yIDIuNi4zIDIuNS4xIDUgLjEgOC43cS0xMy4xLS41LTI1LjgtMS43bS05LjMgNDAuOXEtMTEuOCAxLjMtMjMuMyAxYy00LjMtLjItMi4yLTQuNC0yLjMtNi44IDAtMS40IDEuNi00IDIuNi00cTEwLjItLjQgMjAuNCAwYzEgMCAyLjQgMS44IDIuNyAzIC40IDIgMCA0LjItLjEgNi44bTI5LTEwYzIuMy41IDUuNS42IDUuNiAxLjQuNiAyLjguMiA1LjkgMCA4LjggMCAuNC0xLjQgMS0yIDFoLTIzLjF2LTExLjJ6TTU2NC43IDk0MUg1NDJxLS43LTEtLjctMS43Yy0uOC05LjMtLjgtOS4zIDguNS05LjNINTY3Yy0uNiA0IDIuNCA3LjktMi4yIDExbS01My4zLTExYzUuNyAwIDExIC4zIDE2LjQgMCA0LjItLjMgNi4zLjkgNS42IDUuNC0uMyAxLjYgMCAzLjMgMCA1LjNoLTI1LjJjLTItNi44LTEuMy05LjcgMy4yLTEwLjciLz48cGF0aCBmaWxsPSIjMDAwMDAwIiBkPSJNNjMyLjkgNTU5LjFjNSA3LjYgMy43IDE2LjQtMi42IDIwLjRhMTMgMTMgMCAwIDEtMTYuOC0yIDE0IDE0IDAgMCAxLS43LTE3LjhjMy44LTQuOSAxMS02LjMgMTYuNy0zLjJxMS41IDEgMy40IDIuNiIvPjxwYXRoIGZpbGw9IiMwMDAwMDAiIGQ9Ik02MDcuNSA2NzcuMmMwIDExLjUtOS43IDE3LTE3LjcgMTMuOC01LjYtMi4yLTkuMy03LjYtOC42LTEzLjIuOS02LjggNS42LTEyIDExLjUtMTIuN3MxMi4yIDMuMiAxNC4xIDguOHEuNSAxLjQuNyAzLjMiLz48cGF0aCBmaWxsPSIjMDAwMDAwIiBkPSJNNDE4LjMgNjQzcS0xMS4xLTUuMy05LjQtMTUuNWMxLTYgNS41LTEwLjIgMTEuNC0xMC43cTguOC0uNiAxMyA3LjIgNC4zIDcuOC0xIDE0LjVjLTMuNCA0LjItOCA2LjQtMTQgNC40Ii8+PHBhdGggZmlsbD0iIzAwMDAwMCIgZD0iTTUzOCA1OTUuNGExMy40IDEzLjQgMCAwIDEtMTUuOCAxMC40Yy01LjgtMS4xLTEwLjItNi44LTEwLjMtMTNhMTMgMTMgMCAwIDEgMTItMTMuOGM3LjItLjUgMTMuMiA0LjcgMTQuMSAxMnEuMiAyIDAgNC40Ii8+PHBhdGggZmlsbD0iIzAwMDAwMCIgZD0iTTUwMy42IDcxMWMyLjIgMTIuOC02IDIxLjItMTYuNiAxNy43LTUuNC0xLjgtOS02LjUtOS0xMS45IDAtNiA0LTExLjkgOS4yLTEzLjUgNS40LTEuNyAxMS4yLjIgMTQuNiA0LjhxLjggMS4xIDEuOCAzIi8+PC9zdmc+" alt="WAGS">WAGS' +
            '</a>' +
          '</div>',
        '</div>',
      '</div>',
    ].join('');

    document.body.appendChild(overlay);

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) SocialMediaModal.close();
    });
    document.getElementById('smm-close-btn').addEventListener('click', function () {
      SocialMediaModal.close();
    });

    // Fix #7: Close on Escape key
    _keyHandler = function (e) {
      if ((e.key === 'Escape' || e.keyCode === 27) && overlay.classList.contains('smm-active')) {
        SocialMediaModal.close();
      }
    };
    document.addEventListener('keydown', _keyHandler);

    // Fix #8: Basic focus trap — keep Tab/Shift+Tab within the modal
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

  /* ─────────────────────────────────────────────────
     RENDER ICONS FROM links {}
     Fix #3: URLs are sanitised before injection to
     prevent XSS via javascript: or data: schemes.
  ───────────────────────────────────────────────── */
  function renderIcons(links) {
    var grid = document.getElementById('smm-grid');
    if (!grid) return;
    grid.innerHTML = '';

    ICONS.forEach(function (def) {
      var key = def[0], label = def[1], icon = def[2], cls = def[3];
      var href = _sanitiseURL(links[key]);
      if (!href) return; // skips empty, invalid, or unsafe URLs

      var item = document.createElement('a');
      item.href = href;
      item.className = 'smm-item';
      item.target = '_blank';
      item.rel = 'noopener noreferrer';
      // Fix: avoid wrapping <a> inside a <div> and then having another <a> inside —
      // the icon IS the link. Build with DOM methods to avoid innerHTML injection.
      var iconEl = document.createElement('span');
      iconEl.className = 'smm-icon ' + cls;
      iconEl.setAttribute('aria-hidden', 'true');
      iconEl.innerHTML = icon; // safe: icon HTML comes from the internal ICONS registry
      var labelEl = document.createElement('a');
      labelEl.className = 'smm-item-label';
      labelEl.href = href;
      labelEl.target = '_blank';
      labelEl.rel = 'noopener noreferrer';
      labelEl.textContent = label;
      item.appendChild(iconEl);
      item.appendChild(labelEl);
      grid.appendChild(item);
    });

    if (!grid.children.length) {
      var msg = document.createElement('p');
      msg.style.cssText = 'text-align:center;padding:16px 0;font-size:13px;color:#6b7280;grid-column:1/-1';
      msg.textContent = 'No social links configured.';
      grid.appendChild(msg);
    }
  }

  /* ─────────────────────────────────────────────────
     INTERNAL STATE
  ───────────────────────────────────────────────── */
  var _config     = null;
  var _keyHandler = null; // reference to the keydown listener for cleanup
  // Fix #6: track trigger click handlers so they can be removed on re-init
  var _triggerHandlers = []; // array of { el, fn }

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
    // Fix #11: warn when selector matches nothing
    if (!triggers.length) {
      console.warn('[SocialMediaModal] triggerSelector "' + selector + '" matched no elements.');
      return;
    }
    triggers.forEach(function (el) {
      var fn = function () { SocialMediaModal.open(); };
      el.addEventListener('click', fn);
      _triggerHandlers.push({ el: el, fn: fn });
    });
  }

  /* ─────────────────────────────────────────────────
     PUBLIC API
  ───────────────────────────────────────────────── */
  var SocialMediaModal = {

    /** Semver string exposed for programmatic version checks. */
    version: VERSION,

    /**
     * Initialize the modal. Safe to call again to update options.
     *
     * @param {object} options
     * @param {string}   [options.triggerSelector]  CSS selector for button(s) that open the modal.
     * @param {string}   [options.title]            Custom header title. Default: 'Social - Media Links'.
     * @param {string}   [options.sectionLabel]     Label above the icon grid. Default: 'Our Social Media Channels'.
     * @param {object}   options.links              Social media URLs keyed by platform name.
     */
    init: function (options) {
      if (!options || !options.links) {
        console.error('[SocialMediaModal] init() requires options.links  e.g. { facebook: "https://..." }');
        return;
      }

      _config = options;
      injectCSS();
      injectFontAwesome();

      var ready = function () {
        buildModal(options.title);
        // Fix #2: always call renderIcons so re-init with new links is applied
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
        console.error('[SocialMediaModal] Call SocialMediaModal.init() before update().');
        return;
      }
      if (changes.links)  _config.links  = changes.links;
      if (changes.title)  _config.title  = changes.title;

      var t  = document.getElementById('smm-header-title');
      if (t)  t.innerHTML  = _titleHTML(_config.title);
      renderIcons(_config.links);
    },

    /** Open the modal. */
    open: function () {
      if (!_config) {
        console.error('[SocialMediaModal] Call SocialMediaModal.init() before open().');
        return;
      }
      var overlay = document.getElementById('smm-overlay');
      if (!overlay) {
        // Fix #4: warn clearly rather than silently do nothing
        console.warn('[SocialMediaModal] Modal overlay element not found in DOM.');
        return;
      }
      overlay.classList.add('smm-active');
      // Move focus into the modal for accessibility (#8)
      var firstFocusable = overlay.querySelector('a[href],button:not([disabled])');
      if (firstFocusable) firstFocusable.focus();
      // Hide background content from screen readers (#9)
      document.body.setAttribute('aria-hidden', 'true');
      overlay.removeAttribute('aria-hidden');
    },

    /** Close the modal. */
    close: function () {
      var overlay = document.getElementById('smm-overlay');
      if (overlay) {
        overlay.classList.remove('smm-active');
        // Restore background content to screen readers (#9)
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
      var overlay = document.getElementById('smm-overlay');
      if (overlay) overlay.parentNode.removeChild(overlay);
      var styles = document.getElementById('smm-styles');
      if (styles) styles.parentNode.removeChild(styles);
      // Restore aria-hidden if modal was open during destroy
      document.body.removeAttribute('aria-hidden');
      _config = null;
    },
  };

  global.SocialMediaModal = SocialMediaModal;

}(typeof window !== 'undefined' ? window : this));
