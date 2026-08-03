/**
 * GDrive Image Handler v3.1.0
 * A utility for converting Google Drive URLs to thumbnail/direct image URLs
 * with built-in watermarking support (text + logo) via Canvas API.
 *
 * NEW in v3.1.0 (patch over v3.0.0 — see full notes at bottom of file):
 *  - FIX: video-frame capture could hang forever when seekTime is 0 (default)
 *  - FIX: SVG watermark placement was wrong for percentage-sized SVGs (width="100%")
 *  - FIX: tainted-canvas (CORS) failures now surface a clear, actionable error
 *         instead of a generic "SecurityError"
 *  - SECURITY: fetched/injected SVG markup is now sanitized (script tags and
 *    on*-event-handler attributes stripped) before being added to the live DOM
 *  - SECURITY: the Lottie CDN script is now loaded with Subresource Integrity
 *    (integrity + crossorigin) — see the LOTTIE_SRI note below before deploying
 *  - SECURITY: network calls (SVG/Lottie fetch, video load) now time out
 *    instead of hanging indefinitely
 *  - RELIABILITY: concurrent calls to load the Lottie CDN script no longer race
 *    (the in-flight load promise is now cached, not just the loaded global)
 *  - ACCESSIBILITY: generated <img>/<svg>/<iframe> elements now get alt text,
 *    aria-label/role, and a title; the CSS watermark overlay is aria-hidden;
 *    the Drive video iframe now has a sandbox attribute
 *  - BEHAVIOR CHANGE: applyWatermark() and downloadWatermarked() now re-throw
 *    after logging instead of silently swallowing the error — if you were
 *    relying on these resolving quietly on failure, wrap calls in try/catch
 *  - Magic numbers (padding, radius, gap, offscreen offset, text-width estimate ratio)
 *    pulled into named constants for readability
 *  - FIX: applyWatermarkVideo() was silently broken — it called renderVideo() with a
 *    hardcoded `null` selector, so document.querySelector(null) never matched anything
 *    and the actual <video>/<iframe> was never inserted (only the watermark overlay
 *    <div> ever appeared). renderVideo() now accepts either a selector string or a
 *    DOM element directly, and applyWatermarkVideo() passes its wrapper element.
 *
 * NEW in v3.0.0:
 *  - SVG support  : renderSVG / applyWatermarkSVG
 *  - Video support: MP4, WebM frame capture + watermark via renderVideo / applyWatermarkVideo
 *  - Lottie support: JSON animations via renderLottie / applyLottie
 *
 * Dependencies (optional, loaded automatically if not present):
 *  - lottie-web  (for Lottie support)  https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js
 *
 * Usage:
 * <script src="path/to/gdrive-image-handler.js"></script>
 * <script>
 *
 * // ── Raster (unchanged) ──────────────────────────────────────────────────
 * const imageUrl = GDriveImageHandler.convert(driveUrl);
 * GDriveImageHandler.applyWatermark(driveUrl, '#outputImg', { text: '© MyBrand' });
 *
 * // ── SVG ─────────────────────────────────────────────────────────────────
 * // Render an SVG (Drive URL or raw SVG string) into a container with optional watermark
 * GDriveImageHandler.renderSVG(svgUrlOrString, '#container');
 *
 * // Watermark an SVG (injects a <text> node, preserving interactivity)
 * GDriveImageHandler.applyWatermarkSVG(svgUrlOrString, '#container', {
 *   text: '© MyBrand',
 *   position: 'bottom-left',  // same position keys as raster
 *   opacity: 0.75,
 *   textColor: '#ffffff',
 *   fontSize: 18,
 *   padding: 12
 * });
 *
 * // Flatten SVG to a PNG data URL (for download / raster pipeline)
 * GDriveImageHandler.svgToDataUrl(svgUrlOrString, width, height).then(dataUrl => { ... });
 *
 * // ── Video (MP4 / WebM) ──────────────────────────────────────────────────
 * // Render a video player into a container
 * GDriveImageHandler.renderVideo(driveUrlOrDirectUrl, '#container', {
 *   autoplay: false,
 *   controls: true,
 *   muted: false,
 *   loop: false,
 *   poster: optionalPosterUrl  // Drive URL or direct URL
 * });
 *
 * // Capture a specific frame and watermark it (returns data URL)
 * GDriveImageHandler.captureVideoFrame(videoUrl, {
 *   seekTime: 2.5,           // seconds, default: 0
 *   watermark: { text: '© MyBrand', position: 'bottom-right' }
 * }).then(dataUrl => { ... });
 *
 * // Apply watermark overlay (CSS) onto a live video element
 * GDriveImageHandler.applyWatermarkVideo(driveUrl, '#container', {
 *   text: '© MyBrand',
 *   position: 'bottom-left',
 *   opacity: 0.75,
 *   textColor: '#ffffff',
 *   fontSize: 16,
 *   padding: 10
 * });
 *
 * // ── Lottie (.json) ──────────────────────────────────────────────────────
 * // Render a Lottie animation into a container
 * GDriveImageHandler.renderLottie(jsonUrlOrObject, '#container', {
 *   autoplay: true,
 *   loop: true,
 *   renderer: 'svg',          // 'svg' | 'canvas' | 'html'
 *   speed: 1,
 *   width: '100%',
 *   height: '300px'
 * });
 *
 * // Capture a specific Lottie frame as a PNG data URL
 * GDriveImageHandler.captureLottieFrame(jsonUrlOrObject, frameNumber, {
 *   width: 800, height: 600,
 *   watermark: { text: '© MyBrand' }
 * }).then(dataUrl => { ... });
 *
 * // Control a previously rendered Lottie animation
 * const ctrl = GDriveImageHandler.getLottieInstance('#container');
 * ctrl.play(); ctrl.pause(); ctrl.stop(); ctrl.setSpeed(2); ctrl.destroy();
 *
 * </script>
 */

(function (global) {
  'use strict';

  /* ═══════════════════════════════════════════════════════════════════════════
   * CONSTANTS
   * ═══════════════════════════════════════════════════════════════════════════ */

  var LOTTIE_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js';

  /**
   * SRI hash for the pinned Lottie CDN version above.
   * ⚠ VERIFY BEFORE PRODUCTION USE: this hash was sourced from a third-party
   * reference, not fetched and hashed directly from cdnjs in this environment
   * (the build sandbox this patch was produced in cannot reach cdnjs.cloudflare.com
   * to compute it independently). Before shipping, confirm it against the
   * official listing at https://cdnjs.com/libraries/bodymovin/5.12.2 — cdnjs
   * shows the correct integrity attribute directly on that page. If it doesn't
   * match, update LOTTIE_SRI or set it to null to fall back to no-SRI loading.
   */
  var LOTTIE_SRI = 'sha512-jEnuDt6jfecCjthQAJ+ed0MTVA++5ZKmlUcmDGBv2vUI/REn6FuIdixLNnQT+vKusE2hhTk2is3cFvv5wA+Sgg==';

  var DEFAULT_FETCH_TIMEOUT_MS = 15000;
  var DEFAULT_VIDEO_LOAD_TIMEOUT_MS = 15000;

  // Watermark layout constants (previously magic numbers scattered through the code)
  var WM_PILL_PAD_X = 10;
  var WM_PILL_PAD_Y = 6;
  var WM_PILL_RADIUS = 6;
  var WM_LOGO_TEXT_GAP = 8;
  var WM_SVG_TEXT_WIDTH_ESTIMATE_EM = 0.6; // rough char-width estimate as a fraction of font size
  var OFFSCREEN_RENDER_OFFSET_PX = 9999;   // how far off-canvas to park hidden render containers

  /* ═══════════════════════════════════════════════════════════════════════════
   * INTERNAL HELPERS (shared)
   * ═══════════════════════════════════════════════════════════════════════════ */

  /** Reject a promise if it doesn't settle within `ms` milliseconds. */
  function withTimeout(promise, ms, message) {
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () {
        reject(new Error(message || ('Operation timed out after ' + ms + 'ms')));
      }, ms);
      promise.then(
        function (val) { clearTimeout(timer); resolve(val); },
        function (err) { clearTimeout(timer); reject(err); }
      );
    });
  }

  /** fetch() wrapper with a timeout via AbortController. */
  function fetchWithTimeout(url, ms) {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, ms || DEFAULT_FETCH_TIMEOUT_MS);
    return fetch(url, { signal: controller.signal }).finally(function () {
      clearTimeout(timer);
    });
  }

  function extractFileId(url) {
    if (!url || typeof url !== 'string' || !url.includes('drive.google.com')) return null;
    var m1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (m1) return m1[1];
    var m2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (m2) return m2[1];
    var m3 = url.match(/\/open\?id=([a-zA-Z0-9_-]+)/);
    if (m3) return m3[1];
    return null;
  }

  function toDriveThumb(url, size) {
    size = size || 400;
    if (!url || typeof url !== 'string' || !url.includes('drive.google.com')) return url;
    var id = extractFileId(url);
    return id ? ('https://drive.google.com/thumbnail?id=' + id + '&sz=s' + size) : url;
  }

  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload  = function () { resolve(img); };
      // NOTE: this only rejects on a hard load failure. If the image loads but the
      // server didn't send CORS headers, the image is still usable for on-screen
      // display but will THROW when you later call canvas.toDataURL()/getImageData()
      // ("tainted canvas"). See safeToDataUrl() below for where that's surfaced clearly.
      img.onerror = function () { reject(new Error('Failed to load image: ' + src)); };
      img.src = src;
    });
  }

  /**
   * canvas.toDataURL() wrapper that turns a generic tainted-canvas SecurityError
   * into an actionable message (v3.0.0 threw an opaque browser error here).
   */
  function safeToDataUrl(canvas, type) {
    try {
      return canvas.toDataURL(type || 'image/png');
    } catch (e) {
      if (e && e.name === 'SecurityError') {
        throw new Error(
          'GDriveImageHandler: could not read pixel data back from the canvas because the ' +
          'source image was loaded without CORS permission (a "tainted canvas"). This commonly ' +
          'happens with Google Drive thumbnail URLs, which do not always send ' +
          'Access-Control-Allow-Origin. Host the image somewhere that sends CORS headers, or ' +
          'use renderVideo()/renderSVG() (DOM-based, no canvas) instead of the watermark/capture ' +
          'functions if you don\'t control the source.'
        );
      }
      throw e;
    }
  }

  /**
   * Parse an SVG width/height attribute as a plain unitless number.
   * Returns null (not a guessed number) for percentages or other CSS units,
   * since those can't be resolved without the element being laid out in the DOM.
   */
  function parseSvgLength(attr) {
    if (!attr) return null;
    var trimmed = String(attr).trim();
    if (!/^[0-9.]+$/.test(trimmed)) return null; // e.g. "100%", "10em", "auto" — not a safe raw number
    var n = parseFloat(trimmed);
    return isNaN(n) ? null : n;
  }

  function computeOrigin(position, cw, ch, bw, bh, pad) {
    switch ((position || 'bottom-left').toLowerCase()) {
      case 'bottom-right': return { x: cw - bw - pad, y: ch - bh - pad };
      case 'top-left':     return { x: pad,            y: pad };
      case 'top-right':    return { x: cw - bw - pad,  y: pad };
      case 'center':       return { x: (cw - bw) / 2,  y: (ch - bh) / 2 };
      case 'bottom-left':
      default:             return { x: pad,            y: ch - bh - pad };
    }
  }

  /** Normalise watermark options with defaults */
  function defaultWmOpts(opts) {
    return Object.assign({
      text: null, logoUrl: null, position: 'bottom-left',
      opacity: 0.75, textColor: '#ffffff',
      fontFamily: 'Arial, sans-serif', fontSize: 18,
      logoSize: 40, padding: 12,
      shadowColor: 'rgba(0,0,0,0.55)', shadowBlur: 4
    }, opts || {});
  }

  /** Lazy-load an external script; resolves when window[globalName] is available. */
  var _scriptLoadPromises = {}; // keyed by src — avoids injecting the same <script> twice on concurrent calls

  function loadScript(src, globalName, integrity) {
    if (global[globalName]) { return Promise.resolve(global[globalName]); }
    // FIX: previously only the *loaded* global was cached, so two calls made before the
    // first <script> finished loading would each inject their own <script> tag and race.
    if (_scriptLoadPromises[src]) { return _scriptLoadPromises[src]; }

    var promise = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      if (integrity) {
        // SECURITY: Subresource Integrity — the browser refuses to execute the script
        // if its bytes don't match this hash, protecting against a compromised/MITM'd CDN.
        s.integrity = integrity;
        s.crossOrigin = 'anonymous';
        s.referrerPolicy = 'no-referrer';
      }
      s.onload  = function () { resolve(global[globalName]); };
      s.onerror = function () {
        delete _scriptLoadPromises[src];
        reject(new Error('Failed to load script: ' + src));
      };
      document.head.appendChild(s);
    });

    _scriptLoadPromises[src] = promise;
    return promise;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
   * RASTER WATERMARK RENDERER  (unchanged core from v2)
   * ═══════════════════════════════════════════════════════════════════════════ */

  async function renderWatermark(srcImg, opts) {
    var options = defaultWmOpts(opts);
    var canvas  = document.createElement('canvas');
    canvas.width  = srcImg.naturalWidth  || srcImg.width;
    canvas.height = srcImg.naturalHeight || srcImg.height;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(srcImg, 0, 0, canvas.width, canvas.height);

    var pad      = options.padding;
    var logoH    = options.logoSize;
    var fontSize = options.fontSize;
    var gap      = (options.logoUrl && options.text) ? WM_LOGO_TEXT_GAP : 0;

    ctx.font = 'bold ' + fontSize + 'px ' + options.fontFamily;
    var textW = options.text ? ctx.measureText(options.text).width : 0;
    var textH = options.text ? fontSize * 1.2 : 0;

    var logoImg = null, logoW = 0;
    if (options.logoUrl) {
      try {
        logoImg = await loadImage(options.logoUrl);
        logoW = Math.round(logoImg.naturalWidth * (logoH / logoImg.naturalHeight));
      } catch (e) { console.warn('GDriveImageHandler: logo load failed —', e.message); }
    }

    var blockW = logoW + (logoImg && options.text ? gap : 0) + textW;
    var blockH = Math.max(logoImg ? logoH : 0, textH);
    var origin = computeOrigin(options.position, canvas.width, canvas.height, blockW, blockH, pad);

    // Pill background
    if (options.text || logoImg) {
      var px = WM_PILL_PAD_X, py = WM_PILL_PAD_Y;
      ctx.save();
      ctx.globalAlpha = Math.max(0, options.opacity - 0.3);
      ctx.fillStyle   = 'rgba(0,0,0,0.35)';
      var rx = origin.x - px, ry = origin.y - py,
          rw = blockW + px * 2, rh = blockH + py * 2, r = WM_PILL_RADIUS;
      ctx.beginPath();
      ctx.moveTo(rx + r, ry);
      ctx.lineTo(rx + rw - r, ry); ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + r);
      ctx.lineTo(rx + rw, ry + rh - r); ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - r, ry + rh);
      ctx.lineTo(rx + r, ry + rh); ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - r);
      ctx.lineTo(rx, ry + r); ctx.quadraticCurveTo(rx, ry, rx + r, ry);
      ctx.closePath(); ctx.fill(); ctx.restore();
    }

    ctx.globalAlpha = options.opacity;
    var cursorX = origin.x;
    if (logoImg) {
      ctx.drawImage(logoImg, cursorX, origin.y + (blockH - logoH) / 2, logoW, logoH);
      cursorX += logoW + gap;
    }
    if (options.text) {
      ctx.font        = 'bold ' + fontSize + 'px ' + options.fontFamily;
      ctx.fillStyle   = options.textColor;
      ctx.shadowColor = options.shadowColor;
      ctx.shadowBlur  = options.shadowBlur;
      ctx.textBaseline = 'middle';
      ctx.fillText(options.text, cursorX, origin.y + blockH / 2);
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    return canvas;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
   * SVG SUPPORT
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Fetch SVG markup from a URL or pass through a raw SVG string.
   * Handles Google Drive sharing URLs by converting them first.
   * @param {string} urlOrString
   * @returns {Promise<string>} SVG markup string
   */
  async function fetchSVGMarkup(urlOrString) {
    if (!urlOrString) throw new Error('No SVG source provided');

    // Inline SVG string
    if (urlOrString.trim().startsWith('<svg') || urlOrString.trim().startsWith('<?xml')) {
      return urlOrString;
    }

    // Convert Drive share URL → direct download URL
    var fetchUrl = urlOrString;
    if (urlOrString.includes('drive.google.com')) {
      var id = extractFileId(urlOrString);
      if (id) fetchUrl = 'https://drive.google.com/uc?export=download&id=' + id;
    }

    var resp = await withTimeout(
      fetchWithTimeout(fetchUrl, DEFAULT_FETCH_TIMEOUT_MS),
      DEFAULT_FETCH_TIMEOUT_MS,
      'SVG fetch timed out: ' + fetchUrl
    );
    if (!resp.ok) throw new Error('SVG fetch failed: ' + resp.status + ' ' + fetchUrl);
    var text = await resp.text();
    if (!text.includes('<svg')) throw new Error('Response does not appear to be SVG: ' + fetchUrl);
    return text;
  }

  /**
   * SECURITY (v3.1.0): remove <script> elements and any on*-event-handler / javascript:
   * attributes from a parsed SVG tree before it's injected into the live DOM. SVG markup
   * can carry executable content, so any source that could ultimately trace back to user
   * input (a pasted share link, a query param, etc.) is otherwise a real XSS vector.
   * This is a pragmatic denylist, not a full sanitizer (e.g. DOMPurify) — for SVGs coming
   * from an untrusted source, prefer a dedicated sanitization library.
   */
  function sanitizeSVG(root) {
    var scripts = root.querySelectorAll ? root.querySelectorAll('script') : [];
    for (var i = 0; i < scripts.length; i++) {
      scripts[i].parentNode.removeChild(scripts[i]);
    }
    var all = root.querySelectorAll ? root.querySelectorAll('*') : [];
    for (var j = 0; j < all.length; j++) {
      var el = all[j];
      for (var k = el.attributes.length - 1; k >= 0; k--) {
        var attr = el.attributes[k];
        var name = attr.name.toLowerCase();
        var value = (attr.value || '').trim().toLowerCase();
        if (name.indexOf('on') === 0 || value.indexOf('javascript:') === 0) {
          el.removeAttribute(attr.name);
        }
      }
    }
    return root;
  }

  /**
   * Parse SVG markup into a sanitized SVGElement.
   * @param {string} markup
   * @returns {SVGSVGElement}
   */
  function parseSVG(markup) {
    var parser = new DOMParser();
    var doc    = parser.parseFromString(markup, 'image/svg+xml');
    var errNode = doc.querySelector('parsererror');
    if (errNode) throw new Error('SVG parse error: ' + errNode.textContent.slice(0, 120));
    return sanitizeSVG(doc.documentElement);
  }

  /**
   * Inject a watermark <text> (and optional pill <rect>) directly into an SVG DOM tree.
   * This preserves all SVG interactivity and animations.
   *
   * @param {SVGSVGElement} svgEl
   * @param {object}        opts   watermark options
   * @returns {SVGSVGElement} mutated svgEl
   */
  function injectSVGWatermark(svgEl, opts) {
    if (!opts || (!opts.text && !opts.logoUrl)) return svgEl;
    var options = defaultWmOpts(opts);
    if (!options.text) return svgEl; // logo-only not supported in SVG injection; use canvas path

    var NS  = 'http://www.w3.org/2000/svg';
    var vb  = svgEl.viewBox && svgEl.viewBox.baseVal;
    // FIX (v3.1.0): svgEl is not yet attached to the DOM at this point, so getBoundingClientRect()
    // isn't an option, and a raw parseFloat() on a percentage width (e.g. width="100%") used to
    // silently return 100 — treating a responsive SVG as if it were only 100 units wide, which
    // threw the watermark placement off. Percentage/unit-suffixed values are now rejected in
    // favor of the viewBox (when present) or a sane fallback.
    var cw  = (vb && vb.width)  || parseSvgLength(svgEl.getAttribute('width'))  || 500;
    var ch  = (vb && vb.height) || parseSvgLength(svgEl.getAttribute('height')) || 500;
    var pad = options.padding, fs = options.fontSize;

    // Approximate text width (SVG has no measureText; use an em-ratio estimate)
    var approxTextW = options.text.length * fs * WM_SVG_TEXT_WIDTH_ESTIMATE_EM;
    var blockH = fs * 1.4;
    var origin = computeOrigin(options.position, cw, ch, approxTextW, blockH, pad);

    // Group wrapper
    var g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'gdrive-watermark');
    g.setAttribute('opacity', options.opacity);

    // Pill background rect
    var rect = document.createElementNS(NS, 'rect');
    rect.setAttribute('x',      origin.x - 10);
    rect.setAttribute('y',      origin.y - 4);
    rect.setAttribute('width',  approxTextW + 20);
    rect.setAttribute('height', blockH + 4);
    rect.setAttribute('rx',     6);
    rect.setAttribute('fill',   'rgba(0,0,0,0.35)');
    g.appendChild(rect);

    // Text node
    var txt = document.createElementNS(NS, 'text');
    txt.setAttribute('x',            origin.x);
    txt.setAttribute('y',            origin.y + blockH * 0.72);
    txt.setAttribute('font-family',  options.fontFamily);
    txt.setAttribute('font-size',    fs);
    txt.setAttribute('font-weight',  'bold');
    txt.setAttribute('fill',         options.textColor);
    txt.setAttribute('filter',       'url(#gdrive-wm-shadow)');
    txt.textContent = options.text;
    g.appendChild(txt);

    // Drop-shadow filter (inject once)
    if (!svgEl.querySelector('#gdrive-wm-shadow')) {
      var defs = svgEl.querySelector('defs') || document.createElementNS(NS, 'defs');
      if (!svgEl.querySelector('defs')) svgEl.insertBefore(defs, svgEl.firstChild);
      var filter = document.createElementNS(NS, 'filter');
      filter.setAttribute('id', 'gdrive-wm-shadow');
      filter.innerHTML = '<feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="rgba(0,0,0,0.6)"/>';
      defs.appendChild(filter);
    }

    svgEl.appendChild(g);
    return svgEl;
  }

  /**
   * Serialise an SVGElement back to a string.
   * @param {SVGSVGElement} svgEl
   * @returns {string}
   */
  function serialiseSVG(svgEl) {
    return new XMLSerializer().serializeToString(svgEl);
  }

  /**
   * Convert SVG markup (or URL) to a PNG data URL via canvas.
   * @param {string} urlOrString
   * @param {number} [width]
   * @param {number} [height]
   * @returns {Promise<string>}
   */
  async function svgToDataUrl(urlOrString, width, height) {
    var markup = await fetchSVGMarkup(urlOrString);
    var blob   = new Blob([markup], { type: 'image/svg+xml;charset=utf-8' });
    var objUrl = URL.createObjectURL(blob);
    try {
      var img    = await loadImage(objUrl);
      var canvas = document.createElement('canvas');
      canvas.width  = width  || img.naturalWidth  || 500;
      canvas.height = height || img.naturalHeight || 500;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      return safeToDataUrl(canvas, 'image/png');
    } finally {
      URL.revokeObjectURL(objUrl);
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
   * VIDEO SUPPORT  (MP4 / WebM)
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Resolve a video URL: convert Drive share URLs to a streamable direct URL.
   * Note: Drive video streaming often requires the user to be authenticated;
   * for fully public videos use direct hosting or a proxy.
   * @param {string} url
   * @returns {string}
   */
  function resolveVideoUrl(url) {
    if (!url) return url;
    if (!url.includes('drive.google.com')) return url;
    var id = extractFileId(url);
    // Drive preview embed URL – works for public videos without needing a download token
    return id ? ('https://drive.google.com/file/d/' + id + '/preview') : url;
  }

  /**
   * Build a CSS watermark overlay element for a video container.
   * @param {object} opts  watermark options
   * @returns {HTMLElement}
   */
  function buildVideoWatermarkOverlay(opts) {
    var options = defaultWmOpts(opts);
    var el = document.createElement('div');
    el.className = 'gdrive-video-watermark';
    // ACCESSIBILITY: this is a decorative brand mark, not content — hide it from screen readers.
    el.setAttribute('aria-hidden', 'true');

    // Position mapping
    var pos = (options.position || 'bottom-left').toLowerCase();
    var posStyles = {
      'bottom-left':  'bottom:' + options.padding + 'px;left:'  + options.padding + 'px;',
      'bottom-right': 'bottom:' + options.padding + 'px;right:' + options.padding + 'px;',
      'top-left':     'top:'    + options.padding + 'px;left:'  + options.padding + 'px;',
      'top-right':    'top:'    + options.padding + 'px;right:' + options.padding + 'px;',
      'center':       'top:50%;left:50%;transform:translate(-50%,-50%);'
    };

    el.style.cssText = [
      'position:absolute;z-index:10;pointer-events:none;',
      'background:rgba(0,0,0,0.35);border-radius:6px;',
      'padding:4px 10px;',
      'font-family:' + options.fontFamily + ';',
      'font-size:' + options.fontSize + 'px;',
      'font-weight:bold;',
      'color:' + options.textColor + ';',
      'opacity:' + options.opacity + ';',
      'text-shadow:0 1px 3px rgba(0,0,0,0.6);',
      posStyles[pos] || posStyles['bottom-left']
    ].join('');

    el.textContent = options.text || '';
    return el;
  }

  /**
   * Capture a single video frame from a URL and return a canvas.
   * @param {string} videoUrl
   * @param {object} opts  { seekTime, watermark }
   * @returns {Promise<HTMLCanvasElement>}
   */
  function captureVideoFrameCanvas(videoUrl, opts) {
    opts = opts || {};
    var op = new Promise(function (resolve, reject) {
      var video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted       = true;
      video.preload     = 'auto';
      var settled = false;

      video.addEventListener('error', function () {
        if (settled) return;
        settled = true;
        reject(new Error('Video load error: ' + videoUrl));
      });

      async function captureCurrentFrame() {
        if (settled) return;
        settled = true;
        var canvas = document.createElement('canvas');
        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        video.src = ''; // release

        try {
          if (opts.watermark) {
            var img = await loadImage(safeToDataUrl(canvas));
            canvas = await renderWatermark(img, opts.watermark);
          }
          resolve(canvas);
        } catch (e) {
          reject(e);
        }
      }

      video.addEventListener('seeked', captureCurrentFrame);

      video.addEventListener('loadedmetadata', function () {
        var t = typeof opts.seekTime === 'number' ? opts.seekTime : 0;
        var target = Math.min(t, video.duration || 0);
        // FIX (v3.1.0): if the requested time is already where the video's playhead sits
        // (most commonly seekTime: 0, the default — video.currentTime already starts at 0),
        // setting video.currentTime to the same value does not reliably fire 'seeked' in
        // every browser, so the promise used to hang forever. Capture immediately instead.
        if (Math.abs(video.currentTime - target) < 0.01) {
          captureCurrentFrame();
        } else {
          video.currentTime = target;
        }
      });

      video.src = videoUrl;
    });

    // Safety net: even with the fix above, a stalled network/codec issue could still hang.
    return withTimeout(op, DEFAULT_VIDEO_LOAD_TIMEOUT_MS, 'Video frame capture timed out: ' + videoUrl);
  }

  /* ═══════════════════════════════════════════════════════════════════════════
   * LOTTIE SUPPORT
   * ═══════════════════════════════════════════════════════════════════════════ */

  /** Registry: containerEl → lottie animation instance */
  var _lottieInstances = new WeakMap();

  /**
   * Fetch Lottie JSON from a URL or return the object as-is.
   * Handles Google Drive share URLs.
   * @param {string|object} urlOrObject
   * @returns {Promise<object>}
   */
  async function fetchLottieData(urlOrObject) {
    if (urlOrObject && typeof urlOrObject === 'object') return urlOrObject;
    var fetchUrl = urlOrObject;
    if (typeof urlOrObject === 'string' && urlOrObject.includes('drive.google.com')) {
      var id = extractFileId(urlOrObject);
      if (id) fetchUrl = 'https://drive.google.com/uc?export=download&id=' + id;
    }
    var resp = await withTimeout(
      fetchWithTimeout(fetchUrl, DEFAULT_FETCH_TIMEOUT_MS),
      DEFAULT_FETCH_TIMEOUT_MS,
      'Lottie JSON fetch timed out: ' + fetchUrl
    );
    if (!resp.ok) throw new Error('Lottie fetch failed: ' + resp.status);
    return resp.json();
  }

  /* ═══════════════════════════════════════════════════════════════════════════
   * PUBLIC API
   * ═══════════════════════════════════════════════════════════════════════════ */

  var GDriveImageHandler = {
    version: '3.1.0',

    /* ── URL helpers ──────────────────────────────────────────────────────── */

    convert: function (url, size) {
      return toDriveThumb(url, size);
    },

    toDownload: function (url) {
      if (!url || !url.includes('drive.google.com')) return url;
      var id = extractFileId(url);
      return id ? ('https://drive.google.com/uc?export=download&id=' + id) : url;
    },

    extractFileId: function (url) { return extractFileId(url); },

    convertBatch: function (urls, size) {
      if (!Array.isArray(urls)) return [];
      return urls.map(function (u) { return toDriveThumb(u, size); });
    },

    /* ── Raster watermark (v2 API, unchanged) ─────────────────────────────── */

    applyWatermark: async function (driveUrl, targetSelector, options) {
      var imgUrl = this.convert(driveUrl);
      var target = document.querySelector(targetSelector);
      // BEHAVIOR CHANGE (v3.1.0): "target not found" now throws instead of logging and
      // returning silently, matching renderSVG()/renderLottie() — a bad selector is a
      // programmer error, and a caller relying on a null return could easily miss it.
      if (!target) throw new Error('GDriveImageHandler: target not found — ' + targetSelector);
      var altText = (options && options.text) ? options.text : 'Watermarked image';
      try {
        var srcImg = await loadImage(imgUrl);
        var canvas = await renderWatermark(srcImg, options);
        if (target.tagName === 'CANVAS') {
          target.width = canvas.width; target.height = canvas.height;
          target.getContext('2d').drawImage(canvas, 0, 0);
          target.setAttribute('role', 'img');
          target.setAttribute('aria-label', altText);
        } else if (target.tagName === 'IMG') {
          target.src = safeToDataUrl(canvas, 'image/png');
          if (!target.alt) target.alt = altText; // ACCESSIBILITY: don't clobber a caller-provided alt
        } else {
          canvas.style.maxWidth = '100%';
          canvas.setAttribute('role', 'img');
          canvas.setAttribute('aria-label', altText);
          target.innerHTML = ''; target.appendChild(canvas);
        }
      } catch (err) {
        // BEHAVIOR CHANGE (v3.1.0): previously logged and resolved quietly on failure,
        // which meant a caller had no way to know the watermark didn't apply. Now it
        // re-throws after logging — wrap calls in try/catch if you need to handle this.
        console.error('GDriveImageHandler: applyWatermark failed —', err);
        throw err;
      }
    },

    applyWatermarkBatch: function (items, options) {
      var self = this;
      if (!Array.isArray(items)) return Promise.resolve();
      return Promise.all(items.map(function (item) {
        return self.applyWatermark(item.url, item.selector, options);
      }));
    },

    getWatermarkedDataUrl: async function (driveUrl, options) {
      var imgUrl = this.convert(driveUrl);
      var srcImg = await loadImage(imgUrl);
      var canvas = await renderWatermark(srcImg, options);
      return safeToDataUrl(canvas, 'image/png');
    },

    downloadWatermarked: async function (driveUrl, options, filename) {
      try {
        var dataUrl = await this.getWatermarkedDataUrl(driveUrl, options);
        var a = document.createElement('a');
        a.href = dataUrl; a.download = filename || 'watermarked.png';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      } catch (err) {
        // BEHAVIOR CHANGE (v3.1.0): see applyWatermark() above — now re-throws after logging.
        console.error('GDriveImageHandler: downloadWatermarked failed —', err);
        throw err;
      }
    },

    /* ── SVG ──────────────────────────────────────────────────────────────── */

    /**
     * Render an SVG into a container element (preserves interactivity).
     * @param {string} urlOrString  Drive URL, any SVG URL, or raw SVG markup
     * @param {string} selector     CSS selector for target container
     * @returns {Promise<SVGSVGElement>}
     */
    renderSVG: async function (urlOrString, selector) {
      var target = document.querySelector(selector);
      if (!target) throw new Error('GDriveImageHandler: target not found — ' + selector);
      var markup = await fetchSVGMarkup(urlOrString);
      var svgEl  = parseSVG(markup);
      svgEl.style.maxWidth  = '100%';
      svgEl.style.height    = 'auto';
      // ACCESSIBILITY: only set role/aria-label if the source SVG didn't already provide
      // its own <title>/aria-label — don't clobber markup that's already accessible.
      if (!svgEl.hasAttribute('role') && !svgEl.querySelector('title')) {
        svgEl.setAttribute('role', 'img');
        svgEl.setAttribute('aria-label', 'Image');
      }
      target.innerHTML = '';
      target.appendChild(svgEl);
      return svgEl;
    },

    /**
     * Render an SVG with an injected watermark text node (interactivity preserved).
     * For logo watermarks or pixel-perfect rendering, use svgToDataUrl + applyWatermark.
     * @param {string} urlOrString
     * @param {string} selector
     * @param {object} [options]  watermark options (text supported; logoUrl uses canvas path)
     * @returns {Promise<SVGSVGElement>}
     */
    applyWatermarkSVG: async function (urlOrString, selector, options) {
      var target = document.querySelector(selector);
      if (!target) throw new Error('GDriveImageHandler: target not found — ' + selector);

      var markup = await fetchSVGMarkup(urlOrString);
      var svgEl  = parseSVG(markup);
      svgEl.style.maxWidth = '100%';
      svgEl.style.height   = 'auto';
      var altText = (options && options.text) ? options.text : 'Watermarked image';

      // If logoUrl present, fall back to canvas pipeline for full fidelity
      if (options && options.logoUrl) {
        var dataUrl = await svgToDataUrl(serialiseSVG(svgEl));
        var img     = await loadImage(dataUrl);
        var canvas  = await renderWatermark(img, options);
        var output  = document.createElement('img');
        output.src  = safeToDataUrl(canvas, 'image/png');
        output.alt  = altText; // ACCESSIBILITY
        output.style.maxWidth = '100%';
        target.innerHTML = '';
        target.appendChild(output);
        return null;
      }

      injectSVGWatermark(svgEl, options);
      if (!svgEl.hasAttribute('role') && !svgEl.querySelector('title')) {
        svgEl.setAttribute('role', 'img');
        svgEl.setAttribute('aria-label', altText); // ACCESSIBILITY
      }
      target.innerHTML = '';
      target.appendChild(svgEl);
      return svgEl;
    },

    /**
     * Convert an SVG (URL or markup) to a PNG data URL.
     * @param {string} urlOrString
     * @param {number} [width]
     * @param {number} [height]
     * @returns {Promise<string>} PNG data URL
     */
    svgToDataUrl: async function (urlOrString, width, height) {
      return svgToDataUrl(urlOrString, width, height);
    },

    /**
     * Download an SVG rendered as PNG.
     * @param {string} urlOrString
     * @param {number} [width]
     * @param {number} [height]
     * @param {string} [filename]
     * @returns {Promise<void>}
     */
    downloadSVGAsPng: async function (urlOrString, width, height, filename) {
      var dataUrl = await svgToDataUrl(urlOrString, width, height);
      var a = document.createElement('a');
      a.href = dataUrl; a.download = filename || 'image.png';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    },

    /* ── Video ────────────────────────────────────────────────────────────── */

    /**
     * Render a video player inside a container.
     * For Google Drive URLs, uses the embed preview iframe (most reliable for public files).
     * For direct MP4/WebM URLs, uses a native <video> element.
     *
     * @param {string} urlOrDriveUrl
     * @param {string|HTMLElement} selectorOrEl  CSS selector, OR a DOM element directly
     * @param {object} [options]
     * @param {boolean} [options.autoplay=false]
     * @param {boolean} [options.controls=true]
     * @param {boolean} [options.muted=false]
     * @param {boolean} [options.loop=false]
     * @param {string}  [options.poster]       poster image URL (Drive URL or direct)
     * @param {string}  [options.width='100%']
     * @param {string}  [options.height='auto']
     * @returns {HTMLIFrameElement|HTMLVideoElement}
     */
    renderVideo: function (urlOrDriveUrl, selectorOrEl, options) {
      options = options || {};
      // FIX (v3.1.0): now accepts an element directly, not just a selector string.
      // applyWatermarkVideo() below used to call this with `null` as the selector —
      // document.querySelector(null) never matches anything, so the video element
      // was silently never inserted; only the watermark overlay ever appeared.
      var target = (typeof selectorOrEl === 'string') ? document.querySelector(selectorOrEl) : selectorOrEl;
      if (!target) throw new Error('GDriveImageHandler: target not found — ' + selectorOrEl);
      target.innerHTML = '';

      var isDrive = urlOrDriveUrl && urlOrDriveUrl.includes('drive.google.com');
      var w = options.width  || '100%';
      var h = options.height || 'auto';

      if (isDrive) {
        // Drive: use iframe embed (handles auth + streaming)
        var id = extractFileId(urlOrDriveUrl);
        if (!id) throw new Error('GDriveImageHandler: could not extract Drive file ID from ' + urlOrDriveUrl);
        var iframe = document.createElement('iframe');
        iframe.src    = 'https://drive.google.com/file/d/' + id + '/preview';
        iframe.width  = w;
        iframe.height = h === 'auto' ? '480' : h;
        iframe.style.border = 'none';
        iframe.allow  = 'autoplay';
        // ACCESSIBILITY: an unlabeled iframe fails every automated a11y check (axe, Lighthouse).
        iframe.title  = options.title || 'Embedded video';
        // SECURITY: defense-in-depth even though this points at Google's own domain — restricts
        // what the embedded document can do to just what Drive's preview player needs.
        iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation');
        if (options.autoplay) iframe.src += '?autoplay=1';
        target.appendChild(iframe);
        return iframe;
      }

      // Direct MP4 / WebM
      var video = document.createElement('video');
      video.src      = urlOrDriveUrl;
      video.controls = options.controls !== false;
      video.autoplay = !!options.autoplay;
      video.muted    = !!options.muted;
      video.loop     = !!options.loop;
      video.style.width  = w;
      video.style.height = h;
      if (options.ariaLabel) video.setAttribute('aria-label', options.ariaLabel);
      if (options.poster) {
        video.poster = options.poster.includes('drive.google.com')
          ? toDriveThumb(options.poster, 800)
          : options.poster;
      }
      // ACCESSIBILITY: hook for captions — pass options.captionsUrl (a VTT file) if you have one.
      // Not fetched/generated automatically; this library has no captioning capability of its own.
      if (options.captionsUrl) {
        var track = document.createElement('track');
        track.kind = 'captions';
        track.src  = options.captionsUrl;
        track.srclang = options.captionsLang || 'en';
        track.default = true;
        video.appendChild(track);
      }
      target.appendChild(video);
      return video;
    },

    /**
     * Apply a CSS watermark overlay on top of a video container.
     * Wraps the target in a positioned wrapper if needed, then injects the overlay div.
     *
     * @param {string} urlOrDriveUrl
     * @param {string} selector
     * @param {object} [options]     watermark options (text, position, opacity, etc.)
     * @returns {HTMLElement} the wrapper container
     */
    applyWatermarkVideo: function (urlOrDriveUrl, selector, options) {
      var target = document.querySelector(selector);
      if (!target) throw new Error('GDriveImageHandler: target not found — ' + selector);

      // Wrap in a positioned container if the target is not already
      var wrapper;
      if (target.classList.contains('gdrive-video-wrapper')) {
        wrapper = target;
      } else {
        wrapper = document.createElement('div');
        wrapper.className = 'gdrive-video-wrapper';
        wrapper.style.cssText = 'position:relative;display:inline-block;width:100%;';
        target.parentNode.insertBefore(wrapper, target);
        wrapper.appendChild(target);
      }

      // Render the video inside the wrapper.
      // FIX (v3.1.0): this used to pass `null` here, which meant renderVideo's internal
      // document.querySelector(null) never matched anything and the video element was
      // never actually inserted — only the overlay below ever rendered. Now passes the
      // wrapper element directly (renderVideo accepts either a selector or an element).
      this.renderVideo(urlOrDriveUrl, wrapper, options);

      // Remove any existing watermark overlay
      var existing = wrapper.querySelector('.gdrive-video-watermark');
      if (existing) existing.remove();

      // Inject watermark overlay
      var overlay = buildVideoWatermarkOverlay(options);
      wrapper.appendChild(overlay);
      return wrapper;
    },

    /**
     * Capture a specific frame from a video URL and return it as a PNG data URL.
     * Note: subject to CORS — the video server must allow cross-origin requests.
     *
     * @param {string} videoUrl      direct video URL (MP4/WebM); Drive URLs may fail CORS
     * @param {object} [options]
     * @param {number} [options.seekTime=0]    time in seconds to seek to
     * @param {object} [options.watermark]     optional watermark options
     * @returns {Promise<string>} PNG data URL
     */
    captureVideoFrame: async function (videoUrl, options) {
      var canvas = await captureVideoFrameCanvas(videoUrl, options || {});
      return safeToDataUrl(canvas, 'image/png');
    },

    /**
     * Capture a video frame and trigger a browser download.
     * @param {string} videoUrl
     * @param {object} [options]  { seekTime, watermark, filename }
     * @returns {Promise<void>}
     */
    downloadVideoFrame: async function (videoUrl, options) {
      options = options || {};
      var dataUrl = await this.captureVideoFrame(videoUrl, options);
      var a = document.createElement('a');
      a.href = dataUrl; a.download = options.filename || 'frame.png';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    },

    /* ── Lottie ───────────────────────────────────────────────────────────── */

    /**
     * Render a Lottie JSON animation into a container element.
     * Automatically loads lottie-web from CDN if not already present.
     *
     * @param {string|object} jsonUrlOrObject   Drive URL, any URL, or parsed JSON object
     * @param {string}        selector          CSS selector for target container
     * @param {object}        [options]
     * @param {boolean}       [options.autoplay=true]
     * @param {boolean}       [options.loop=true]
     * @param {string}        [options.renderer='svg']   'svg' | 'canvas' | 'html'
     * @param {number}        [options.speed=1]
     * @param {string}        [options.width]            CSS value, e.g. '100%'
     * @param {string}        [options.height]           CSS value, e.g. '300px'
     * @returns {Promise<object>} lottie animation instance
     */
    renderLottie: async function (jsonUrlOrObject, selector, options) {
      options = options || {};
      var target = document.querySelector(selector);
      if (!target) throw new Error('GDriveImageHandler: target not found — ' + selector);

      // Ensure lottie-web is available
      var lottie = await loadScript(LOTTIE_CDN, 'lottie', LOTTIE_SRI);
      if (!lottie) throw new Error('GDriveImageHandler: lottie-web failed to load');

      var animData = await fetchLottieData(jsonUrlOrObject);

      // Destroy existing instance on this container if any
      var existing = _lottieInstances.get(target);
      if (existing) { try { existing.destroy(); } catch (e) {} }

      // Style the container
      if (options.width)  target.style.width  = options.width;
      if (options.height) target.style.height = options.height;
      target.innerHTML = '';

      var anim = lottie.loadAnimation({
        container:    target,
        renderer:     options.renderer || 'svg',
        loop:         options.loop     !== false,
        autoplay:     options.autoplay !== false,
        animationData: animData
      });

      if (typeof options.speed === 'number' && options.speed !== 1) {
        anim.setSpeed(options.speed);
      }

      _lottieInstances.set(target, anim);
      return anim;
    },

    /**
     * Retrieve the lottie animation instance bound to a container (if any).
     * @param {string} selector
     * @returns {object|null} lottie animation instance
     */
    getLottieInstance: function (selector) {
      var target = document.querySelector(selector);
      return target ? (_lottieInstances.get(target) || null) : null;
    },

    /**
     * Destroy the lottie animation bound to a container.
     * @param {string} selector
     */
    destroyLottie: function (selector) {
      var inst = this.getLottieInstance(selector);
      if (inst) { inst.destroy(); }
    },

    /**
     * Capture a specific Lottie frame as a PNG data URL.
     * Renders the animation off-screen on a canvas renderer, seeks to the frame,
     * then captures. Optionally applies a raster watermark.
     *
     * @param {string|object} jsonUrlOrObject
     * @param {number}        frame            0-based frame number
     * @param {object}        [options]
     * @param {number}        [options.width=800]
     * @param {number}        [options.height=600]
     * @param {object}        [options.watermark]   optional watermark options
     * @returns {Promise<string>} PNG data URL
     */
    captureLottieFrame: async function (jsonUrlOrObject, frame, options) {
      options = options || {};
      var w = options.width  || 800;
      var h = options.height || 600;

      var lottie   = await loadScript(LOTTIE_CDN, 'lottie', LOTTIE_SRI);
      var animData = await fetchLottieData(jsonUrlOrObject);

      // Off-screen container
      var offscreen = document.createElement('div');
      offscreen.style.cssText = 'position:fixed;left:-' + OFFSCREEN_RENDER_OFFSET_PX + 'px;top:-' + OFFSCREEN_RENDER_OFFSET_PX + 'px;width:' + w + 'px;height:' + h + 'px;';
      document.body.appendChild(offscreen);

      try {
        var canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        offscreen.appendChild(canvas);

        var anim = lottie.loadAnimation({
          container:     offscreen,
          renderer:      'canvas',
          loop:          false,
          autoplay:      false,
          animationData: animData,
          rendererSettings: { context: canvas.getContext('2d'), clearCanvas: true }
        });

        await new Promise(function (resolve) {
          anim.addEventListener('DOMLoaded', function () {
            anim.goToAndStop(frame, true);
            // Allow one rAF for canvas flush
            requestAnimationFrame(resolve);
          });
        });

        anim.destroy();

        if (options.watermark) {
          var img  = await loadImage(safeToDataUrl(canvas));
          canvas   = await renderWatermark(img, options.watermark);
        }
        return safeToDataUrl(canvas, 'image/png');
      } finally {
        document.body.removeChild(offscreen);
      }
    },

    /**
     * Download a specific Lottie frame as PNG.
     * @param {string|object} jsonUrlOrObject
     * @param {number}        frame
     * @param {object}        [options]  { width, height, watermark, filename }
     * @returns {Promise<void>}
     */
    downloadLottieFrame: async function (jsonUrlOrObject, frame, options) {
      options = options || {};
      var dataUrl = await this.captureLottieFrame(jsonUrlOrObject, frame, options);
      var a = document.createElement('a');
      a.href = dataUrl; a.download = options.filename || 'lottie-frame.png';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    }
  };

  /* ═══════════════════════════════════════════════════════════════════════════
   * MODULE EXPORT
   * ═══════════════════════════════════════════════════════════════════════════ */
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = GDriveImageHandler;
  } else if (typeof define === 'function' && define.amd) {
    define([], function () { return GDriveImageHandler; });
  } else {
    global.GDriveImageHandler = GDriveImageHandler;
  }

})(typeof window !== 'undefined' ? window : this);
