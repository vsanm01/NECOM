/*!
 * header-cta.js — standalone header CTA group
 * Part of the WAGS Studio Blogger theme. Renders three things into a
 * container element (default id "headerCta"):
 *   1. A pill-shaped red Donate button (heart icon + label)
 *   2. A Search icon that opens an inline search box (posts to /search)
 *   3. A "Template" / "Template tagline" text block
 *
 * Self-contained: this single file injects its own <style> tag on load,
 * so no separate stylesheet is needed. Uses the host theme's --navy /
 * --navy-deep / --yellow / --donate-red custom properties when present,
 * falling back to the WAGS Studio palette values if they're not defined.
 *
 * ----------------------------------------------------------------------
 * Configuring Template / Template tagline
 * ----------------------------------------------------------------------
 * Two ways, either or both:
 *
 * A) Declarative, via data attributes on the container (read once at
 *    render time) — good for a value Blogger itself can fill in, or a
 *    value that's fixed for the life of the page:
 *
 *      <div id="headerCta"
 *           data-donate-url="https://wagspay.blogspot.com"
 *           data-template-title="Template"
 *           data-template-tagline="Template tagline"></div>
 *
 * B) Imperative JS API, for setting/changing values at runtime (e.g.
 *    after fetching them from your own backend) — call any time after
 *    this script has run:
 *
 *      window.WagsHeaderCTA.setTemplate("Order Management System",
 *        "Manage transactions, confirmations, shipping & invoices");
 *      window.WagsHeaderCTA.setDonateUrl("https://wagspay.blogspot.com");
 *      window.WagsHeaderCTA.getTemplate(); // -> { title, tagline }
 *
 *    Example wiring it to a real API:
 *      fetch("https://api.example.com/site-config")
 *        .then(function (r) { return r.json(); })
 *        .then(function (cfg) {
 *          window.WagsHeaderCTA.setTemplate(cfg.title, cfg.tagline);
 *        });
 *
 * ----------------------------------------------------------------------
 * Search integration
 * ----------------------------------------------------------------------
 * Exposes window.wagsToggleHeaderSearch() so other components (e.g. the
 * site icon bar's own Search item) can open/close this same search box
 * instead of duplicating one.
 */
(function () {
  "use strict";

  var CONTAINER_ID = "headerCta";
  var STYLE_ID = "wags-header-cta-styles";

  var DEFAULTS = {
    donateUrl: "https://wagspay.blogspot.com",
    templateTitle: "Template",
    templateTagline: "Template tagline"
  };

  var CSS =
    "#" + CONTAINER_ID + "{display:flex;align-items:center;gap:16px;margin-left:auto}" +
    ".wags-header-cta-group{display:flex;align-items:center;gap:10px;flex-shrink:0}" +
    ".wags-donate-pill{display:inline-flex;align-items:center;gap:8px;background:var(--donate-red,#e5342e);" +
    "color:#fff;font-weight:700;font-size:13px;letter-spacing:.02em;padding:8px 18px;border-radius:999px;" +
    "text-decoration:none;border:1.5px solid rgba(255,255,255,.5);transition:background-color .2s ease;white-space:nowrap}" +
    ".wags-donate-pill svg{width:16px;height:16px}" +
    ".wags-donate-pill:hover,.wags-donate-pill:focus-visible{background:#c92a25;outline:none}" +
    ".wags-cta-icon-btn{display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;" +
    "border-radius:50%;padding:0;border:none;background:transparent;color:#fff;text-decoration:none;" +
    "cursor:pointer;transition:color .2s ease,background-color .2s ease}" +
    ".wags-cta-icon-btn svg{width:24px;height:24px;display:block}" +
    ".wags-cta-icon-btn:hover,.wags-cta-icon-btn:focus-visible{color:var(--yellow,#ffd400);background:rgba(255,255,255,.1);outline:none}" +
    ".wags-search-wrap{position:relative}" +
    ".wags-header-search-form{position:absolute;top:calc(100% + 8px);right:0;display:flex;align-items:center;gap:4px;" +
    "background:var(--navy-deep,#10192c);border:1px solid rgba(255,255,255,.18);border-radius:999px;" +
    "padding:4px 4px 4px 14px;box-shadow:0 10px 28px rgba(0,0,0,.4);z-index:30}" +
    ".wags-header-search-form[hidden]{display:none}" +
    ".wags-header-search-form input[type=text]{background:transparent;border:none;color:#fff;font-size:13.5px;outline:none;width:160px}" +
    ".wags-header-search-form input[type=text]::placeholder{color:rgba(255,255,255,.55)}" +
    ".wags-search-submit-btn{width:34px;height:34px}.wags-search-submit-btn svg{width:18px;height:18px}" +
    ".wags-header-info{flex-shrink:0;text-align:right;line-height:1.25}" +
    ".wags-header-info-title{display:inline-flex;align-items:center;gap:6px;color:#fff;font-weight:700;font-size:13.5px;white-space:nowrap}" +
    ".wags-header-info-title svg{width:15px;height:15px;color:var(--yellow,#ffd400);flex-shrink:0}" +
    ".wags-header-info-tagline{display:block;color:var(--muted,#fff);font-size:11px;margin-top:2px;white-space:nowrap}" +
    ".wags-visually-hidden{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;" +
    "clip:rect(0,0,0,0);white-space:nowrap;border:0}" +
    "@media (max-width:560px){" +
    "#" + CONTAINER_ID + "{width:100%;justify-content:center;margin-left:0}" +
    ".wags-cta-icon-btn{width:40px;height:40px}.wags-cta-icon-btn svg{width:22px;height:22px}" +
    ".wags-header-search-form{right:auto;left:50%;transform:translateX(-50%)}" +
    ".wags-header-search-form input[type=text]{width:110px}" +
    ".wags-header-info{display:none}" +
    "}";

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

  var donateLink, templateTitleText, templateTaglineText, searchToggleBtn, searchForm, searchInput;

  function render(config) {
    var frag = document.createDocumentFragment();

    // Donate pill
    donateLink = el(
      "a",
      {
        class: "wags-donate-pill",
        href: config.donateUrl,
        target: "_blank",
        rel: "noopener noreferrer",
        "aria-label": "Donate",
        title: "Donate"
      },
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 20.5s-7.5-4.6-10-9.6C.6 7.7 2.3 4 6 4c2 0 3.6 1.1 4.5 2.7C11.4 5.1 13 4 15 4c3.7 0 5.4 3.7 4 6.9-2.5 5-10 9.6-10 9.6Z"/></svg><span>Donate</span>'
    );

    // Search
    var searchWrap = el("div", { class: "wags-search-wrap" });
    searchToggleBtn = el(
      "button",
      {
        type: "button",
        class: "wags-cta-icon-btn",
        id: "headerSearchToggle",
        "aria-label": "Search",
        title: "Search",
        "aria-haspopup": "true",
        "aria-expanded": "false",
        "aria-controls": "headerSearchForm"
      },
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><line x1="16.65" y1="16.65" x2="21" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
    );
    searchForm = el("form", {
      class: "wags-header-search-form",
      id: "headerSearchForm",
      action: "/search",
      method: "get",
      role: "search",
      hidden: "hidden"
    });
    searchForm.appendChild(
      el("label", { class: "wags-visually-hidden", for: "headerSearchInput" }, "Search this blog")
    );
    searchInput = el("input", {
      type: "text",
      id: "headerSearchInput",
      name: "q",
      placeholder: "Search…",
      autocomplete: "off"
    });
    searchForm.appendChild(searchInput);
    searchForm.appendChild(
      el(
        "button",
        {
          type: "submit",
          class: "wags-cta-icon-btn wags-search-submit-btn",
          "aria-label": "Submit search",
          title: "Submit search"
        },
        '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><line x1="16.65" y1="16.65" x2="21" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
      )
    );
    searchWrap.appendChild(searchToggleBtn);
    searchWrap.appendChild(searchForm);

    var ctaGroup = el("div", { class: "wags-header-cta-group" });
    ctaGroup.appendChild(donateLink);
    ctaGroup.appendChild(searchWrap);

    // Template info block
    var infoBlock = el("div", { class: "wags-header-info" });
    var titleSpan = el(
      "span",
      { class: "wags-header-info-title" },
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3 20 7v10l-8 4-8-4V7Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M4 7l8 4 8-4M12 11v10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/></svg>'
    );
    templateTitleText = document.createTextNode(config.templateTitle);
    titleSpan.appendChild(templateTitleText);
    templateTaglineText = el("span", { class: "wags-header-info-tagline" }, "");
    templateTaglineText.textContent = config.templateTagline;
    infoBlock.appendChild(titleSpan);
    infoBlock.appendChild(templateTaglineText);

    frag.appendChild(ctaGroup);
    frag.appendChild(infoBlock);
    return frag;
  }

  function wireSearchToggle() {
    function isOpen() {
      return !searchForm.hasAttribute("hidden");
    }
    function open() {
      searchForm.removeAttribute("hidden");
      searchToggleBtn.setAttribute("aria-expanded", "true");
      if (searchInput) searchInput.focus();
    }
    function close() {
      searchForm.setAttribute("hidden", "hidden");
      searchToggleBtn.setAttribute("aria-expanded", "false");
    }
    searchToggleBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      isOpen() ? close() : open();
    });
    document.addEventListener("click", function (e) {
      if (!isOpen()) return;
      var wrap = e.target.closest ? e.target.closest(".wags-search-wrap") : null;
      if (!wrap) close();
    });
    document.addEventListener("keydown", function (e) {
      if (isOpen() && (e.key === "Escape" || e.key === "Esc")) close();
    });

    // Shared hook so other components (e.g. the site icon bar's own
    // Search item) can open/close this same box.
    window.wagsToggleHeaderSearch = function () {
      isOpen() ? close() : open();
    };
  }

  function init() {
    var container = document.getElementById(CONTAINER_ID);
    if (!container) return;

    injectStyles();

    var config = {
      donateUrl: container.getAttribute("data-donate-url") || DEFAULTS.donateUrl,
      templateTitle: container.getAttribute("data-template-title") || DEFAULTS.templateTitle,
      templateTagline: container.getAttribute("data-template-tagline") || DEFAULTS.templateTagline
    };

    container.innerHTML = "";
    container.appendChild(render(config));
    wireSearchToggle();

    // Public JS API for updating Template / Donate values at runtime,
    // e.g. after fetching them from your own backend.
    window.WagsHeaderCTA = {
      setTemplate: function (title, tagline) {
        if (title !== undefined && templateTitleText) templateTitleText.textContent = title;
        if (tagline !== undefined && templateTaglineText) templateTaglineText.textContent = tagline;
      },
      setDonateUrl: function (url) {
        if (url && donateLink) donateLink.setAttribute("href", url);
      },
      getTemplate: function () {
        return {
          title: templateTitleText ? templateTitleText.textContent : "",
          tagline: templateTaglineText ? templateTaglineText.textContent : ""
        };
      }
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
