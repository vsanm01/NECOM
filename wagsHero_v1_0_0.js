/*
  wagsHero_v1_0_0.js
  ------------------------------------------------------------------
  Standalone hero widget extracted from wags-studio_blog_v1_1_2.txt.

  What this does:
    - Injects the hero markup (heading + subtext) into a target element.
    - Injects the CSS needed to style it (scoped under .wags-hero-root
      so it won't clash with other page styles).
    - Falls back to sensible default values for --navy-deep / --yellow
      / --muted if those design-token CSS variables aren't already
      defined on the page (e.g. when this widget is dropped into a
      page that isn't running the full WAGS Studio theme).

  Usage:
    1. Add a mount point anywhere in your page:
         <div id="wags-hero"></div>
    2. Include this script (defer recommended):
         <script src="wagsHero_v1_0_0.js" defer></script>
    3. That's it — the widget finds #wags-hero and renders into it.
       If no #wags-hero element exists, it appends itself to <body>.

  Customizing text:
    Edit the CONFIG object below, or set window.WAGS_HERO_CONFIG
    before this script runs, e.g.:
         <script>
           window.WAGS_HERO_CONFIG = {
             title: 'Building tools that <span>Start</span>, Improve, and Grow',
             text: 'This is your page content area — drop in whatever your product, portfolio, or pitch needs here.'
           };
         </script>
  ------------------------------------------------------------------
*/
(function () {
  'use strict';

  var CONFIG = Object.assign(
    {
      mountSelector: '#wags-hero',
      title: 'Building tools that <span>Start</span>, Improve, and Grow',
      text: 'This is your page content area — drop in whatever your product, portfolio, or pitch needs here.'
    },
    window.WAGS_HERO_CONFIG || {}
  );

  var CSS = [
    '.wags-hero-root {',
    '  --wh-navy-deep: var(--navy-deep, #1a2744);',
    '  --wh-yellow: var(--yellow, #ffd400);',
    '  --wh-muted: var(--muted, #55637a);',
    '  flex: 1;',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  padding: 80px 24px;',
    '  text-align: center;',
    '  box-sizing: border-box;',
    '}',
    '.wags-hero-root * { box-sizing: border-box; }',
    '.wags-hero-root .hero {',
    '  max-width: 560px;',
    '}',
    '.wags-hero-root .hero h1 {',
    '  font-family: Arial, Helvetica, sans-serif;',
    '  font-size: clamp(28px, 4vw, 40px);',
    '  font-weight: 700;',
    '  color: var(--wh-navy-deep);',
    '  margin: 0 0 14px;',
    '}',
    '.wags-hero-root .hero h1 span {',
    '  color: var(--wh-yellow);',
    '  -webkit-text-stroke: 0.5px var(--wh-navy-deep);',
    '}',
    '.wags-hero-root .hero p {',
    '  font-family: Arial, Helvetica, sans-serif;',
    '  color: #55637a;',
    '  font-size: 15.5px;',
    '  line-height: 1.6;',
    '  margin: 0;',
    '}'
  ].join('\n');

  function injectStyles() {
    if (document.getElementById('wags-hero-style')) return;
    var style = document.createElement('style');
    style.id = 'wags-hero-style';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function buildMarkup() {
    var root = document.createElement('div');
    root.className = 'wags-hero-root';
    root.setAttribute('aria-label', 'Main content');
    root.setAttribute('role', 'main');

    var hero = document.createElement('div');
    hero.className = 'hero';

    var h1 = document.createElement('h1');
    h1.innerHTML = CONFIG.title; // trusted, developer-supplied config

    var p = document.createElement('p');
    p.textContent = CONFIG.text;

    hero.appendChild(h1);
    hero.appendChild(p);
    root.appendChild(hero);

    return root;
  }

  function mount() {
    injectStyles();
    var target = document.querySelector(CONFIG.mountSelector) || document.body;
    target.appendChild(buildMarkup());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
