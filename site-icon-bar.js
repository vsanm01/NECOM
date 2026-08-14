/*!
 * site-icon-bar.js — standalone quick-links icon bar
 * Part of the WAGS Studio Blogger theme. Renders a row of icon+label links
 * into a container element, in this fixed order:
 *
 *   Wlogo, Donate, Home, Login, Search, Downloads, Share, Brand,
 *   New Update, Testimonial, Newsletter, User Guide, FAQ, Troubleshoot,
 *   Support, Contact us, Policy, Website, Follow us, Review, Suggestion,
 *   Trust, Video, More (3-dot menu with a dropdown)
 *
 * Self-contained: this single file injects its own <style> tag on load, so
 * no separate stylesheet is needed. Uses the host theme's --navy / --yellow
 * / --navy-deep custom properties when present, falling back to the WAGS
 * Studio palette values if they're not defined.
 *
 * Usage: provide a container element (default id "siteIconBar"), then load
 * this file — nothing else required:
 *
 *   <nav id="siteIconBar" aria-label="Quick links"
 *        data-home-url="https://example.blogspot.com/"></nav>
 *   <script src="site-icon-bar.js" defer></script>
 *
 * data-home-url is optional — if present (e.g. set by Blogger's
 * data:blog.homepageUrl at template-render time), the Home and Website
 * items link there instead of "#".
 *
 * Search calls window.wagsToggleHeaderSearch() if the host page defines
 * it (the WAGS Studio header exposes this hook), so the bar's Search
 * icon reuses the header's existing search box instead of duplicating one.
 */
(function () {
  "use strict";

  var CONTAINER_ID = "siteIconBar";
  var STYLE_ID = "site-icon-bar-styles";

  // TODO: replace these with the real destination pages once available.
  var PLACEHOLDER = "#";

  var CSS =
    "#" + CONTAINER_ID + "{" +
    "background:var(--navy,#1a2744);display:flex;flex-wrap:wrap;justify-content:center;" +
    "align-items:flex-start;gap:10px 6px;padding:8px 20px 6px;margin:0 0 8px;" +
    'font-family:var(--font-primary,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif)}' +
    ".site-icon-bar-item{position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;flex:0 0 auto}" +
    ".site-icon-bar-btn{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;" +
    "border-radius:50%;padding:0;border:none;background:transparent;color:#fff;text-decoration:none;" +
    "cursor:pointer;transition:color .2s ease,background-color .2s ease}" +
    ".site-icon-bar-btn svg{width:16px;height:16px;display:block}" +
    ".site-icon-bar-label{font-size:9px;font-weight:600;color:#fff;text-align:center;white-space:nowrap;transition:color .2s ease}" +
    ".site-icon-bar-btn:hover,.site-icon-bar-btn:focus-visible{color:var(--yellow,#ffd400);background:rgba(255,255,255,.1);outline:none}" +
    ".site-icon-bar-item:hover .site-icon-bar-label,.site-icon-bar-item:focus-within .site-icon-bar-label{color:var(--yellow,#ffd400)}" +
    ".site-icon-bar-dropdown{position:absolute;top:calc(100% + 8px);left:50%;transform:translateX(-50%);min-width:170px;" +
    "background:var(--navy-deep,#10192c);border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:6px;" +
    "box-shadow:0 10px 28px rgba(0,0,0,.4);z-index:40;display:flex;flex-direction:column;gap:2px}" +
    ".site-icon-bar-dropdown[hidden]{display:none}" +
    ".site-icon-bar-dropdown-item{position:relative;display:flex;align-items:center;gap:10px;padding:9px 12px 9px 16px;" +
    "border-radius:6px;color:#fff;text-decoration:none;font-size:13px;font-weight:500;white-space:nowrap}" +
    '.site-icon-bar-dropdown-item::before{content:"";position:absolute;left:0;top:4px;bottom:4px;width:3px;' +
    "border-radius:2px;background:transparent;transition:background-color .15s ease}" +
    ".site-icon-bar-dropdown-item svg{flex-shrink:0;width:18px;height:18px;color:rgba(255,255,255,.6);transition:color .15s ease}" +
    ".site-icon-bar-dropdown-item:hover,.site-icon-bar-dropdown-item:focus-visible{background:rgba(255,212,0,.14);" +
    "color:var(--yellow,#ffd400);outline:none}" +
    ".site-icon-bar-dropdown-item:hover::before,.site-icon-bar-dropdown-item:focus-visible::before{background:var(--yellow,#ffd400)}" +
    ".site-icon-bar-dropdown-item:hover svg,.site-icon-bar-dropdown-item:focus-visible svg{color:var(--yellow,#ffd400)}" +
    "@media (max-width:560px){#" + CONTAINER_ID + "{padding:8px 12px 6px;gap:8px 4px}" +
    ".site-icon-bar-btn{width:28px;height:28px}.site-icon-bar-btn svg{width:15px;height:15px}" +
    ".site-icon-bar-label{font-size:8.5px}}";

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function el(tag, attrs, html) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        if (attrs[key] !== null && attrs[key] !== undefined) {
          node.setAttribute(key, attrs[key]);
        }
      });
    }
    if (html) node.innerHTML = html;
    return node;
  }

  // ES5-compatible stand-in for Object.assign, kept consistent with the
  // rest of this file's older-browser-friendly style.
  function merge(base, extra) {
    var out = {};
    Object.keys(base).forEach(function (k) { out[k] = base[k]; });
    Object.keys(extra).forEach(function (k) { out[k] = extra[k]; });
    return out;
  }

  function icon(svgInner, viewBox) {
    return (
      '<svg viewBox="' + (viewBox || "0 0 24 24") + '" aria-hidden="true" focusable="false">' +
      svgInner +
      "</svg>"
    );
  }

  var ICONS = {
    wlogo:
      '<circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
      '<path d="M7.5 8.5 9.7 15 12 9.5 14.3 15 16.5 8.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle cx="7.5" cy="8.5" r="1" fill="currentColor"/><circle cx="9.7" cy="15" r="1" fill="currentColor"/>' +
      '<circle cx="12" cy="9.5" r="1" fill="currentColor"/><circle cx="14.3" cy="15" r="1" fill="currentColor"/>' +
      '<circle cx="16.5" cy="8.5" r="1" fill="currentColor"/>',
    donate:
      '<path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" d="M12 9.4c-.9-1.6-2.8-2.1-4.2-1.1-1.4 1-1.7 3-.5 4.4L12 17.3l4.7-4.6c1.2-1.4.9-3.4-.5-4.4-1.4-1-3.3-.5-4.2 1.1Z"/>' +
      '<path fill="currentColor" d="M4 18.4c0-1 .8-1.8 1.8-1.8h11.6c1.9 0 3.6-1.1 4.4-2.8.3-.6-.1-1.3-.8-1.3h-1a5.6 5.6 0 0 1-5-3.1.7.7 0 0 0-1.3.3v1.7H6c-1.1 0-2 .9-2 2v5Z"/>' +
      '<path fill="none" stroke="#1a2744" stroke-width="1.1" stroke-linecap="round" d="M9 16.6V13M11.6 16.6v-4M14.2 16.6v-3.3"/>',
    home:
      '<path d="M3 11.5 12 4l9 7.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M5 10v9a1 1 0 0 0 1 1h4v-5a2 2 0 1 1 4 0v5h4a1 1 0 0 0 1-1v-9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    login:
      '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
      '<circle cx="12" cy="10" r="3.2" fill="currentColor"/>' +
      '<path d="M5.5 19c1.4-3 4-4.4 6.5-4.4s5.1 1.4 6.5 4.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    search:
      '<circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/>' +
      '<line x1="16.65" y1="16.65" x2="21" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    downloads:
      '<circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
      '<path d="M12 7v7m0 0-3-3m3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M8 16.5h8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    share:
      '<circle cx="18" cy="5" r="2.6" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
      '<circle cx="6" cy="12" r="2.6" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
      '<circle cx="18" cy="19" r="2.6" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
      '<path d="m8.3 10.7 7.4-4.4M8.3 13.3l7.4 4.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    brand:
      '<path d="M11 3h-4a2 2 0 0 0-1.4.6L3 6.2A2 2 0 0 0 2.4 7.6v4a2 2 0 0 0 .6 1.4l8 8a2 2 0 0 0 2.8 0l6-6a2 2 0 0 0 0-2.8l-8-8A2 2 0 0 0 11 3Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<circle cx="7.5" cy="7.5" r="1.3" fill="currentColor"/>',
    newUpdate:
      '<path d="M4.5 5.5h15a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5h-6l-2.8 2.8v-2.8H4.5A1.5 1.5 0 0 1 3 15V7a1.5 1.5 0 0 1 1.5-1.5Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>' +
      '<path d="M12 8.3a2 2 0 0 0-2 2v1.3l-.8 1.2h5.6l-.8-1.2v-1.3a2 2 0 0 0-2-2Z" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>' +
      '<path d="M11 13.3a1 1 0 0 0 2 0" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>' +
      '<path d="M9 8.6c-.5.5-.8 1.1-.8 1.8M15 8.6c.5.5.8 1.1.8 1.8" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>',
    testimonial:
      '<circle cx="12" cy="7" r="2.6" fill="currentColor"/><circle cx="6.3" cy="8" r="2.2" fill="currentColor"/><circle cx="17.7" cy="8" r="2.2" fill="currentColor"/>' +
      '<path d="M12 10.6c-2.6 0-4.7 1.8-4.9 4.2h9.8c-.2-2.4-2.3-4.2-4.9-4.2Z" fill="currentColor"/>' +
      '<path d="M6.3 11c-2 .1-3.6 1.6-3.8 3.5h4.8c.1-1 .5-1.9 1.1-2.6-.6-.5-1.3-.8-2.1-.9Z" fill="currentColor"/>' +
      '<path d="M17.7 11c2 .1 3.6 1.6 3.8 3.5h-4.8c-.1-1-.5-1.9-1.1-2.6.6-.5 1.3-.8 2.1-.9Z" fill="currentColor"/>' +
      '<path d="m8 18 .4-.9.4.9.9.1-.7.6.2.9-.8-.5-.8.5.2-.9-.7-.6Z" fill="currentColor"/>' +
      '<path d="m12 18 .4-.9.4.9.9.1-.7.6.2.9-.8-.5-.8.5.2-.9-.7-.6Z" fill="currentColor"/>' +
      '<path d="m16 18 .4-.9.4.9.9.1-.7.6.2.9-.8-.5-.8.5.2-.9-.7-.6Z" fill="currentColor"/>',
    newsletter:
      '<rect x="3.5" y="7.5" width="17" height="12" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
      '<path d="m4 8 8 6.2L20 8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M9 4.5h6v3H9z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>' +
      '<path d="M10.2 6h3.6" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>',
    userGuide:
      '<path d="M5 4.5h11a2 2 0 0 1 2 2v11.5a1 1 0 0 1-1.4.9L15 18l-1.6.9a1 1 0 0 1-1 0L11 18l-1.4.9a1 1 0 0 1-1.5-.9V6.5A2 2 0 0 1 5 4.5Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>' +
      '<circle cx="11" cy="9" r="1.6" fill="none" stroke="currentColor" stroke-width="1.2"/>' +
      '<path d="M11 8.4v1.6M11 11.3h.01" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>',
    faq:
      '<path d="M4.5 6.5h15a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5H10l-3.6 3v-3H4.5A1.5 1.5 0 0 1 3 15V8a1.5 1.5 0 0 1 1.5-1.5Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>' +
      '<path d="M10.3 10c0-1 .8-1.7 1.8-1.7s1.8.6 1.8 1.6c0 .9-.7 1.3-1.3 1.7-.4.3-.6.5-.6 1" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>' +
      '<circle cx="12" cy="14.2" r="0.9" fill="currentColor"/>',
    troubleshoot:
      '<circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
      '<path d="m15.2 15.2 5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
      '<path d="M10.5 7.3v3.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
      '<circle cx="10.5" cy="13.3" r="0.9" fill="currentColor"/>' +
      '<path d="M10.5 4.5V3M10.5 16.5V18M4.5 10.5H3M16.5 10.5H18M14.7 6.3l1.1-1.1M6.3 6.3 5.2 5.2M14.7 14.7l1.1 1.1M6.3 14.7 5.2 15.8" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>',
    support:
      '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
      '<path d="M9.8 9.5c0-1.2 1-2.1 2.2-2.1s2.2.8 2.2 2c0 1.1-.9 1.6-1.6 2.1-.5.3-.8.6-.8 1.2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
      '<circle cx="12" cy="15.8" r="1" fill="currentColor"/>',
    contactUs:
      '<path d="M5.5 4.5c-1.1 0-2 .9-2 2 0 7.7 6.3 14 14 14 1.1 0 2-.9 2-2v-2.1c0-.5-.3-.9-.8-1l-3.1-.8a1 1 0 0 0-1 .3l-1 1.1a11 11 0 0 1-5.1-5.1l1.1-1a1 1 0 0 0 .3-1l-.8-3.1a1 1 0 0 0-1-.8Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>',
    policy:
      '<path d="M12 3.5 19 6v5.5c0 4.4-2.9 7.7-7 8.5-4.1-.8-7-4.1-7-8.5V6Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>' +
      '<path d="m9 12 2.1 2.1L15.2 10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
    website:
      '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
      '<ellipse cx="12" cy="12" rx="4" ry="9" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
      '<path d="M3 12h18M4.5 7.5h15M4.5 16.5h15" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>',
    followUs:
      '<path d="M4 11h2.5v8H4a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1Z" fill="currentColor"/>' +
      '<path d="M8 11.2 11.3 5c.4-.8 1.5-.9 2-.1.3.4.4.9.2 1.4l-1.2 3.2h4.8c1 0 1.7 1 1.4 1.9l-1.7 5.6c-.3.9-1.1 1.5-2 1.5H8.5c-.5 0-.9-.4-.9-.9v-6.4c0-.1 0-.2.1-.3Z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>',
    review:
      '<path d="M8 10.2 11.3 4c.4-.8 1.5-.9 2-.1.3.4.4.9.2 1.4l-1.2 3.2h4.8c1 0 1.7 1 1.4 1.9l-1.4 4.6c-.3.9-1.1 1.5-2 1.5H9v-6.3c0-.1 0-.2.1-.3Z" fill="currentColor"/>' +
      '<path d="M5 9.2h2.5v7H5a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1Z" fill="currentColor"/>' +
      '<path d="m6 18.2.5-1 .5 1 1.1.15-.8.75.2 1.1-1-.5-1 .5.2-1.1-.8-.75Z" fill="currentColor"/>' +
      '<path d="m11 18.2.5-1 .5 1 1.1.15-.8.75.2 1.1-1-.5-1 .5.2-1.1-.8-.75Z" fill="currentColor"/>' +
      '<path d="m16 18.2.5-1 .5 1 1.1.15-.8.75.2 1.1-1-.5-1 .5.2-1.1-.8-.75Z" fill="currentColor"/>',
    suggestion:
      '<path d="M4.5 5.5h13A1.5 1.5 0 0 1 19 7v7a1.5 1.5 0 0 1-1.5 1.5H12l-3 2.5v-2.5H4.5A1.5 1.5 0 0 1 3 13.5V7a1.5 1.5 0 0 1 1.5-1.5Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>' +
      '<path d="M6 8.5h8M6 11h6" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>' +
      '<circle cx="17" cy="6" r="2.6" fill="none" stroke="currentColor" stroke-width="1.3"/>' +
      '<path d="M17 8.6v1.4M15.7 10.6h2.6" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>',
    trust:
      '<path d="M12 3 19 5.5v6c0 5-3 8.5-7 9.5-4-1-7-4.5-7-9.5v-6Z" fill="currentColor"/>' +
      '<path d="m8.7 12.2 2.3 2.3 4.3-4.3" fill="none" stroke="#1a2744" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    video:
      '<rect x="2.5" y="5" width="19" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
      '<path d="M6.5 5v14M17.5 5v14" stroke="currentColor" stroke-width="1.5"/>' +
      '<path d="M4 7.3h1M4 10h1M4 12.7h1M4 15.4h1M19 7.3h1M19 10h1M19 12.7h1M19 15.4h1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
      '<path d="M10.5 9.3v5.4l4.3-2.7Z" fill="currentColor"/>',
    more:
      '<circle cx="12" cy="5" r="1.8" fill="currentColor"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/><circle cx="12" cy="19" r="1.8" fill="currentColor"/>',
    about:
      '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="8.2" r="1" fill="currentColor"/><path d="M12 11v5.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    contact:
      '<rect x="3" y="5.5" width="18" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m3.5 6.5 8.5 6 8.5-6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
    privacy:
      '<path d="M12 3.5 19 6v5.5c0 4.4-2.9 7.7-7 8.5-4.1-.8-7-4.1-7-8.5V6Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="m9 12 2.1 2.1L15.2 10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>'
  };

  // Full order, as specified: Wlogo, Donate, Home, Login, Search, Downloads,
  // Share, Brand, New Update, Testimonial, Newsletter, User Guide, FAQ,
  // Troubleshoot, Support, Contact us, Policy, Website, Follow us, Review,
  // Suggestion, Trust, Video, then More (3-dot menu) last.
  function buildItems(homeUrl) {
    return [
      { label: "Wlogo", icon: ICONS.wlogo, href: "https://wagsone.blogspot.com", external: true },
      { label: "Donate", icon: ICONS.donate, href: PLACEHOLDER },
      { label: "Home", icon: ICONS.home, href: homeUrl || PLACEHOLDER },
      { label: "Login", icon: ICONS.login, href: "https://www.blogger.com/go/signin" },
      { label: "Search", icon: ICONS.search, action: "search" },
      { label: "Downloads", icon: ICONS.downloads, href: PLACEHOLDER },
      { label: "Share", icon: ICONS.share, href: PLACEHOLDER },
      { label: "Brand", icon: ICONS.brand, href: PLACEHOLDER },
      { label: "New Update", icon: ICONS.newUpdate, href: PLACEHOLDER },
      { label: "Testimonial", icon: ICONS.testimonial, href: PLACEHOLDER },
      { label: "Newsletter", icon: ICONS.newsletter, href: PLACEHOLDER },
      { label: "User Guide", icon: ICONS.userGuide, href: PLACEHOLDER },
      { label: "FAQ", icon: ICONS.faq, href: PLACEHOLDER },
      { label: "Troubleshoot", icon: ICONS.troubleshoot, href: PLACEHOLDER },
      { label: "Support", icon: ICONS.support, href: PLACEHOLDER },
      { label: "Contact us", icon: ICONS.contactUs, href: PLACEHOLDER },
      { label: "Policy", icon: ICONS.policy, href: PLACEHOLDER },
      { label: "Website", icon: ICONS.website, href: homeUrl || PLACEHOLDER },
      { label: "Follow us", icon: ICONS.followUs, href: PLACEHOLDER },
      { label: "Review", icon: ICONS.review, href: PLACEHOLDER },
      { label: "Suggestion", icon: ICONS.suggestion, href: PLACEHOLDER },
      { label: "Trust", icon: ICONS.trust, href: PLACEHOLDER },
      { label: "Video", icon: ICONS.video, href: PLACEHOLDER }
    ];
  }

  var DROPDOWN_ITEMS = [
    { label: "About", icon: ICONS.about, href: PLACEHOLDER },
    { label: "Contact", icon: ICONS.contact, href: PLACEHOLDER },
    { label: "Privacy Policy", icon: ICONS.privacy, href: PLACEHOLDER }
  ];

  function renderLinkItem(item) {
    var wrap = el("div", { class: "site-icon-bar-item" });
    var attrs = {
      class: "site-icon-bar-btn",
      "aria-label": item.label,
      title: item.label
    };
    if (item.action === "search") {
      var btn = el("button", merge({ type: "button" }, attrs), icon(item.icon));
      btn.addEventListener("click", function () {
        if (typeof window.wagsToggleHeaderSearch === "function") {
          window.wagsToggleHeaderSearch();
        }
      });
      wrap.appendChild(btn);
    } else {
      var href = item.href || PLACEHOLDER;
      attrs.href = href;
      if (item.external) {
        attrs.target = "_blank";
        attrs.rel = "noopener noreferrer";
      }
      var link = el("a", attrs, icon(item.icon));
      // Placeholder links ("#") aren't wired to a real page yet — without
      // this, clicking one actually scrolls the page to the top, which
      // reads as a bug rather than an inert "coming soon" link.
      if (href === PLACEHOLDER) {
        link.addEventListener("click", function (e) {
          e.preventDefault();
        });
      }
      wrap.appendChild(link);
    }
    wrap.appendChild(el("span", { class: "site-icon-bar-label" }, item.label));
    return wrap;
  }

  function renderMoreItem() {
    var wrap = el("div", { class: "site-icon-bar-item" });
    var toggle = el(
      "button",
      {
        type: "button",
        class: "site-icon-bar-btn",
        "aria-label": "More options",
        title: "More options",
        "aria-haspopup": "menu",
        "aria-expanded": "false"
      },
      icon(ICONS.more)
    );
    var dropdown = el("div", {
      class: "site-icon-bar-dropdown",
      role: "menu",
      "aria-label": "More options",
      hidden: "hidden"
    });
    var menuItems = [];
    DROPDOWN_ITEMS.forEach(function (item) {
      var a = el(
        "a",
        {
          class: "site-icon-bar-dropdown-item",
          role: "menuitem",
          href: item.href,
          tabindex: "-1"
        },
        icon(item.icon) + item.label
      );
      // Same placeholder-link scroll-jump issue as the main icon list.
      if (item.href === PLACEHOLDER) {
        a.addEventListener("click", function (e) {
          e.preventDefault();
        });
      }
      dropdown.appendChild(a);
      menuItems.push(a);
    });

    function isOpen() {
      return !dropdown.hasAttribute("hidden");
    }
    function close(returnFocus) {
      dropdown.setAttribute("hidden", "hidden");
      toggle.setAttribute("aria-expanded", "false");
      if (returnFocus) toggle.focus();
    }
    function open() {
      dropdown.removeAttribute("hidden");
      toggle.setAttribute("aria-expanded", "true");
      if (menuItems[0]) menuItems[0].focus();
    }
    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      isOpen() ? close(false) : open();
    });
    document.addEventListener("click", function (e) {
      if (isOpen() && !wrap.contains(e.target)) close(false);
    });

    // role="menu" implies arrow-key navigation between items (WAI-ARIA
    // menu pattern) — wire that up so keyboard/screen-reader users get
    // the behavior the role promises, not just Escape-to-close.
    dropdown.addEventListener("keydown", function (e) {
      var currentIndex = menuItems.indexOf(document.activeElement);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        var next = menuItems[(currentIndex + 1) % menuItems.length];
        if (next) next.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        var prev = menuItems[(currentIndex - 1 + menuItems.length) % menuItems.length];
        if (prev) prev.focus();
      } else if (e.key === "Home") {
        e.preventDefault();
        if (menuItems[0]) menuItems[0].focus();
      } else if (e.key === "End") {
        e.preventDefault();
        if (menuItems[menuItems.length - 1]) menuItems[menuItems.length - 1].focus();
      } else if (e.key === "Escape" || e.key === "Esc") {
        close(true);
      }
    });
    document.addEventListener("keydown", function (e) {
      if (isOpen() && !dropdown.contains(e.target) && (e.key === "Escape" || e.key === "Esc")) {
        close(true);
      }
    });

    wrap.appendChild(toggle);
    wrap.appendChild(dropdown);
    wrap.appendChild(el("span", { class: "site-icon-bar-label" }, "More"));
    return wrap;
  }

  function init() {
    var container = document.getElementById(CONTAINER_ID);
    if (!container) return;

    injectStyles();

    var homeUrl = container.getAttribute("data-home-url") || "";
    var items = buildItems(homeUrl);

    var frag = document.createDocumentFragment();
    items.forEach(function (item) {
      frag.appendChild(renderLinkItem(item));
    });
    frag.appendChild(renderMoreItem());

    container.innerHTML = "";
    container.appendChild(frag);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
