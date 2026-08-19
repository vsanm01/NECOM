/* =====================================================================
   TAILORMAIN.JS
   Self-contained module: injects all CSS + page markup for the
   Tailor Order & Billing Manager app into the host page. Load this
   BEFORE tailorapp.js (which supplies the app's behavior/logic).

   All CSS rules are scoped under the ".tailor-app-scope" class so
   they can never leak out and restyle the host page's own elements
   (e.g. a host page's own .card, main, or body styles are left
   untouched). The mount element receives this class automatically.

   This module also loads its external dependencies (Google Fonts and
   the html2canvas library used for "download bill as image") if they
   are not already present on the page.

   Usage:
     <div id="tailor-app-root"></div>
     <script src="tailormain.js"></script>
     <script src="tailorapp.js"></script>

   Mount point resolution (first match wins):
     1. an element with id "tailor-app-root"
     2. an element with id "main-content" (lets a host page's existing
        "main content" placeholder — e.g. a landing page template —
        receive this app without any extra markup)
     3. a new <div id="tailor-app-root"> appended to <body>
   Whichever element is used, the ".tailor-app-scope" class is added
   to it so the scoped CSS above applies correctly.
   ===================================================================== */
(function () {
  var TAILOR_CSS = `
.tailor-app-scope{
    --ink:#2b2620;
    --paper:#e7ded0;
    --card:#faf6ec;
    --red:#9c3b3b;
    --red-dim:#c98f8f;
    --marigold:#d9932e;
    --marigold-dim:#f1c988;
    --teal:#2f6e63;
    --line:#c9bda1;
    --shadow: 0 1px 0 rgba(43,38,32,.06), 0 8px 24px -12px rgba(43,38,32,.25);
  }
  .tailor-app-scope *{box-sizing:border-box;}
  .tailor-app-scope{margin:0;padding:0;}
  .tailor-app-scope{
    background:
      repeating-linear-gradient(0deg, transparent 0 27px, rgba(156,59,59,.06) 27px 28px),
      var(--paper);
    color:var(--ink);
    font-family:'Inter',sans-serif;
    min-height:100vh;
  }
  .tailor-app-scope #app{display:flex; min-height:100vh;}
  /* ---------- Sidebar ---------- */
  .tailor-app-scope aside{
    width:220px; flex-shrink:0;
    background:var(--ink);
    color:var(--card);
    padding:28px 0;
    display:flex; flex-direction:column;
    position:sticky; top:0; height:100vh;
  }
  .tailor-app-scope .sb-logo{
    display:block; max-width:64px; max-height:64px; margin:0 22px 12px;
    border-radius:4px; object-fit:contain; background:rgba(255,255,255,.05);
  }
  .tailor-app-scope .brand{
    font-family:'Bitter',serif; font-weight:800;
    font-size:1.35rem; line-height:1.15;
    padding:0 22px 6px;
    letter-spacing:.01em;
  }
  .tailor-app-scope .brand small{
    display:block; font-family:'Inter'; font-weight:500;
    font-size:.68rem; letter-spacing:.14em; text-transform:uppercase;
    color:var(--marigold-dim); margin-top:6px;
  }
  .tailor-app-scope nav{margin-top:26px; display:flex; flex-direction:column;}
  .tailor-app-scope nav button{
    all:unset; cursor:pointer;
    padding:13px 22px; font-family:'Inter'; font-weight:500; font-size:.92rem;
    color:#cfc6b6; border-left:3px solid transparent;
    display:flex; align-items:center; gap:12px;
  }
  .tailor-app-scope nav button .nav-icon{ width:18px; height:18px; flex-shrink:0; }
  .tailor-app-scope nav button .nav-icon svg{ width:100%; height:100%; display:block; }
  .tailor-app-scope nav button:hover{color:#fff; background:rgba(255,255,255,.04);}
  .tailor-app-scope nav button.active{
    color:#fff; background:rgba(217,147,46,.14);
    border-left-color:var(--marigold);
  }
  .tailor-app-scope .side-foot{
    margin-top:auto; padding:16px 22px 0; font-size:.7rem; color:#8b8172;
    border-top:1px solid rgba(255,255,255,.08); padding-top:16px; line-height:1.5;
  }
  .tailor-app-scope .side-foot .powered-by{
    display:block; margin-top:10px; font-size:.64rem; letter-spacing:.04em; color:#655c4c;
  }
  /* ---------- Main ---------- */
  .tailor-app-scope main{flex:1; padding:40px 44px 80px; max-width:none;}
  .tailor-app-scope h2.page-title{
    font-family:'Bitter',serif; font-weight:800; font-size:1.6rem; margin:0 0 4px;
  }
  .tailor-app-scope p.page-sub{margin:0 0 20px; color:#6b6255; font-size:.92rem;}
  .tailor-app-scope .tape{
    height:14px; margin:26px 0;
    background-image: repeating-linear-gradient(to right, var(--red) 0 2px, transparent 2px 11px);
    background-position: bottom; background-size:100% 55%; background-repeat:repeat-x;
    opacity:.5;
  }
  .tailor-app-scope .card{
    background:var(--card); border:1px solid var(--line); border-radius:3px;
    box-shadow:var(--shadow); padding:26px 28px; margin-bottom:22px;
  }
  .tailor-app-scope label{display:block; font-size:.78rem; font-weight:600; color:#5a5245; margin:0 0 5px; letter-spacing:.01em;}
  .tailor-app-scope input, .tailor-app-scope select{
    width:100%; font-family:'Inter'; font-size:.94rem; color:var(--ink);
    background:#fff; border:1px solid var(--line); border-radius:2px;
    padding:9px 11px; outline:none;
  }
  .tailor-app-scope input:focus, .tailor-app-scope select:focus{border-color:var(--marigold); box-shadow:0 0 0 3px rgba(217,147,46,.15);}
  .tailor-app-scope .grid{display:grid; grid-template-columns:1fr 1fr; gap:16px 20px;}
  .tailor-app-scope .grid .full{grid-column:1 / -1;}
  .tailor-app-scope .field{margin-bottom:14px;}
  .tailor-app-scope .btn{
    all:unset; cursor:pointer; display:inline-flex; align-items:center; gap:8px;
    font-family:'Inter'; font-weight:600; font-size:.88rem;
    padding:11px 20px; border-radius:2px; letter-spacing:.01em;
  }
  .tailor-app-scope .btn-primary{background:var(--marigold); color:#2b2004;}
  .tailor-app-scope .btn-primary:hover{background:#c88323;}
  .tailor-app-scope .btn-ghost{background:transparent; color:var(--red); border:1px solid var(--red-dim);}
  .tailor-app-scope .btn-ghost:hover{background:rgba(156,59,59,.08);}
  .tailor-app-scope .btn-teal{background:var(--teal); color:#eafff9;}
  .tailor-app-scope .btn-teal:hover{background:#245a51;}
  .tailor-app-scope .btn-whatsapp{background:#25D366; color:#06341c;}
  .tailor-app-scope .btn-whatsapp:hover{background:#1fbd5a;}
  .tailor-app-scope .btn-whatsapp.is-loading{opacity:.6; pointer-events:none;}
  .tailor-app-scope .btn-payment{background:#2e6dc9; color:#fff;}
  .tailor-app-scope .btn-payment:hover{background:#2559a3;}
  .tailor-app-scope .toast{
    position:fixed; top:20px; right:20px; background:var(--ink); color:#fff;
    font-size:.88rem; padding:12px 18px; border-radius:3px; box-shadow:var(--shadow);
    border-left:4px solid var(--marigold); z-index:50; max-width:320px;
    font-family:'Inter'; opacity:0; transform:translateY(-6px); transition:all .25s ease;
    pointer-events:none; display:flex; align-items:center; gap:8px;
  }
  .tailor-app-scope .toast.show{opacity:1; transform:translateY(0);}
  .tailor-app-scope .toast.toast-success{border-left-color:var(--teal);}
  .tailor-app-scope .toast.toast-error{border-left-color:var(--red);}
  .tailor-app-scope .toast.toast-info{border-left-color:var(--marigold);}
  .tailor-app-scope .toast .icon{width:17px; height:17px; flex-shrink:0;}
  /* ---------- Modal ---------- */
  .modal-overlay{
    position:fixed; inset:0; background:rgba(43,38,32,.45); z-index:100;
    display:flex; align-items:center; justify-content:center; padding:20px;
  }
  .tailor-app-scope .modal-box{
    background:#fff; border-radius:8px; max-width:380px; width:100%;
    box-shadow:0 20px 50px -12px rgba(0,0,0,.35); padding:22px 24px;
    font-family:'Inter';
  }
  .tailor-app-scope .modal-box h3{font-family:'Bitter',serif; font-size:1.1rem; font-weight:800; margin:0 0 10px; color:var(--ink);}
  .tailor-app-scope .modal-box p{font-size:.9rem; color:#4a4438; margin:0 0 16px; line-height:1.45;}
  .tailor-app-scope .modal-box input{
    width:100%; font-family:'Inter'; font-size:.94rem; color:var(--ink);
    background:#fff; border:1px solid var(--line); border-radius:4px;
    padding:9px 11px; outline:none; margin-bottom:16px;
  }
  .tailor-app-scope .modal-box input:focus{border-color:var(--marigold); box-shadow:0 0 0 3px rgba(217,147,46,.15);}
  .tailor-app-scope .modal-actions{display:flex; justify-content:flex-end; gap:10px;}
  .tailor-app-scope .modal-btn{
    all:unset; cursor:pointer; font-family:'Inter'; font-weight:600; font-size:.88rem;
    padding:9px 18px; border-radius:5px; text-align:center;
  }
  .tailor-app-scope .modal-btn.cancel{background:#eee8db; color:var(--ink);}
  .tailor-app-scope .modal-btn.cancel:hover{background:#e2dac9;}
  .tailor-app-scope .modal-btn.confirm{background:var(--teal); color:#fff;}
  .tailor-app-scope .modal-btn.confirm:hover{filter:brightness(1.08);}
  .tailor-app-scope .modal-btn.confirm.danger{background:var(--red);}
  /* ---------- Toggle switch ---------- */
  .tailor-app-scope .lock-toggle-row{display:flex; align-items:center; gap:10px;}
  .tailor-app-scope .toggle-switch{
    position:relative; display:inline-block; width:42px; height:24px; flex-shrink:0; cursor:pointer;
  }
  .tailor-app-scope .toggle-switch input{position:absolute; opacity:0; width:100%; height:100%; margin:0; cursor:pointer;}
  .tailor-app-scope .toggle-slider{
    position:absolute; inset:0; background:#d8cfbd; border-radius:999px; transition:background .18s ease;
  }
  .tailor-app-scope .toggle-slider::before{
    content:''; position:absolute; width:18px; height:18px; left:3px; top:3px;
    background:#fff; border-radius:50%; transition:transform .18s ease; box-shadow:0 1px 2px rgba(0,0,0,.25);
  }
  .tailor-app-scope .toggle-switch input:checked + .toggle-slider{background:var(--teal);}
  .tailor-app-scope .toggle-switch input:checked + .toggle-slider::before{transform:translateX(18px);}
  .tailor-app-scope .lock-status-text{display:flex; align-items:center; gap:7px; font-size:.88rem; color:#6b6255;}
  .tailor-app-scope .lock-status-text .icon{width:16px; height:16px;}
  /* ---------- Table ---------- */
  .tailor-app-scope .tailor-app-scope table{width:100%; border-collapse:collapse; font-size:.9rem;}
  .tailor-app-scope thead th{
    text-align:left; font-weight:600; font-size:.72rem; letter-spacing:.06em; text-transform:uppercase;
    color:#6b6255; padding:8px 10px; border-bottom:2px solid var(--ink);
  }
  .tailor-app-scope tbody td{padding:11px 10px; border-bottom:1px solid var(--line);}
  .tailor-app-scope tbody tr:hover{background:rgba(217,147,46,.06);}
  .tailor-app-scope .id-mono{font-family:'Courier Prime',monospace; font-weight:700;}
  .tailor-app-scope .status-pill{
    font-size:.72rem; font-weight:600; padding:3px 9px; border-radius:12px; text-transform:capitalize;
    display:inline-block;
  }
  .tailor-app-scope .status-new{background:#e5e0d3; color:#6b6255;}
  .tailor-app-scope .status-process{background:#f1dcae; color:#7a5410;}
  .tailor-app-scope .status-ready{background:#cfe6df; color:#1c5245;}
  .tailor-app-scope .status-delivered{background:#c9e2b8; color:#33531d;}
  .tailor-app-scope .status-customer_due{background:#f0c8c8; color:#7a2020;}
  .tailor-app-scope .status-other{background:#dcd4e8; color:#453168;}
  .tailor-app-scope select.status-select{
    width:auto; font-size:.8rem; padding:5px 7px; border-radius:12px; font-weight:600;
    text-transform:capitalize; border:1px solid transparent;
  }
  .tailor-app-scope .row-actions button{font-size:.8rem;}
  .tailor-app-scope .row-actions button.btn-paid{color:var(--teal); border-color:var(--teal);}
  .tailor-app-scope .balance-zero{color:#6b6255;}
  .tailor-app-scope .balance-due{color:var(--red); font-weight:700;}
  .tailor-app-scope .overdue{color:var(--red); font-weight:700;}
  .tailor-app-scope .overdue::after{content:' ⚠'; font-weight:400;}
  .tailor-app-scope .filter-row{display:flex; gap:8px; flex-wrap:wrap; margin:2px 0 18px;}
  .tailor-app-scope .filter-chip{
    all:unset; cursor:pointer; font-size:.78rem; font-weight:600; padding:6px 13px;
    border-radius:14px; border:1px solid var(--line); color:#6b6255; background:var(--card);
  }
  .tailor-app-scope .filter-chip:hover{border-color:var(--marigold);}
  .tailor-app-scope .filter-chip.active{background:var(--ink); color:#fff; border-color:var(--ink);}
  .tailor-app-scope .hint{font-size:.8rem; color:var(--teal); margin:-8px 0 14px; padding:0 2px;}
  .tailor-app-scope textarea{
    width:100%; font-family:'Inter'; font-size:.94rem; color:var(--ink);
    background:#fff; border:1px solid var(--line); border-radius:2px;
    padding:9px 11px; outline:none; resize:vertical;
  }
  .tailor-app-scope textarea:focus{border-color:var(--marigold); box-shadow:0 0 0 3px rgba(217,147,46,.15);}
  .tailor-app-scope .checkline{ display:flex; align-items:center; gap:9px; margin:6px 0 14px; }
  .tailor-app-scope .checkline input[type="checkbox"]{ width:auto; accent-color:var(--marigold); }
  .tailor-app-scope .checkline label{ margin:0; font-size:.86rem; color:var(--ink); font-weight:500; }
  .tailor-app-scope .price-row-label{display:flex; align-items:center; justify-content:space-between; gap:6px; margin:0 0 5px;}
  .tailor-app-scope .icon-btn{
    all:unset; cursor:pointer; line-height:1; padding:4px 6px;
    border-radius:3px; color:#948a7b; display:inline-flex; align-items:center;
  }
  .tailor-app-scope .icon-btn .icon{width:15px; height:15px;}
  .tailor-app-scope .icon-btn:hover{background:rgba(43,38,32,.08); color:var(--ink);}
  .tailor-app-scope .icon-btn.icon-danger:hover{color:var(--red); background:rgba(156,59,59,.1);}
  /* ---------- Product cards (Price List) ---------- */
  .tailor-app-scope .product-grid{display:grid; grid-template-columns:1fr 1fr; gap:16px;}
  .tailor-app-scope .product-card{
    background:#fff; border:1px solid var(--line); border-radius:6px; padding:14px;
  }
  .tailor-app-scope .product-card-head{display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:10px;}
  .tailor-app-scope .product-card-head .prod-title{font-weight:700; font-size:.96rem; color:var(--ink);}
  /* image field — mirrors preview-box + controls-column pattern */
  .tailor-app-scope .image-field{display:flex; gap:12px; align-items:flex-start; background:#faf6ec; border:1px solid var(--line); border-radius:6px; padding:10px; margin-bottom:12px;}
  .tailor-app-scope .image-field__preview{
    width:60px; height:60px; border-radius:5px; flex-shrink:0; overflow:hidden;
    background:#eee8db; border:1px dashed #d8cfbd;
    display:flex; align-items:center; justify-content:center;
    font-family:'Bitter',serif; font-weight:800; font-size:1.3rem; color:#a86a1c;
  }
  .tailor-app-scope .image-field__preview img{width:100%; height:100%; object-fit:cover; display:block;}
  .tailor-app-scope .image-field__placeholder{font-size:.62rem; color:#948a7b; text-align:center; padding:0 3px;}
  .tailor-app-scope .image-field__controls{flex:1; display:flex; flex-direction:column; gap:6px; min-width:0;}
  .tailor-app-scope .image-field__row{display:flex; gap:8px; flex-wrap:wrap;}
  .tailor-app-scope .image-field__btn{
    all:unset; cursor:pointer; font-size:.74rem; font-weight:600; color:#5a5245;
    background:#eee8db; border-radius:3px; padding:6px 10px; white-space:nowrap;
    display:inline-flex; align-items:center; gap:5px;
  }
  .tailor-app-scope .image-field__btn:hover{background:#e2dac9;}
  .tailor-app-scope .image-field__btn.is-disabled{opacity:.5; pointer-events:none;}
  .tailor-app-scope .image-field__btn.danger{color:var(--red);}
  .tailor-app-scope .image-field__url{font-size:.78rem; padding:6px 9px;}
  .tailor-app-scope .image-field__status{font-size:.7rem; color:#948a7b; min-height:14px;}
  .tailor-app-scope .image-field__status.is-success{color:var(--teal);}
  .tailor-app-scope .image-field__status.is-error{color:var(--red);}
  .tailor-app-scope .rate-row{display:flex; align-items:center; gap:6px;}
  .tailor-app-scope .rate-row input[type="number"]{text-align:center; flex:1; min-width:96px; font-size:1.05rem; padding:9px 6px; letter-spacing:.02em;}
  .tailor-app-scope .qty-step-btn{
    all:unset; cursor:pointer; width:28px; height:28px; border-radius:50%; flex-shrink:0;
    display:flex; align-items:center; justify-content:center; color:#fff;
  }
  .tailor-app-scope .qty-step-btn svg{width:14px; height:14px;}
  .tailor-app-scope .qty-step-btn.minus{background:#c0392b;}
  .tailor-app-scope .qty-step-btn.minus:hover{filter:brightness(1.1);}
  .tailor-app-scope .qty-step-btn.plus{background:#2e9e4f;}
  .tailor-app-scope .qty-step-btn.plus:hover{filter:brightness(1.1);}
  .tailor-app-scope .qty-step-btn:disabled{opacity:.4; pointer-events:none;}
  /* generic svg icon helper — sits inline with text via currentColor */
  .tailor-app-scope .icon{width:15px; height:15px; vertical-align:-3px; flex-shrink:0;}
  .tailor-app-scope .icon svg{width:100%; height:100%; display:block;}
  .tailor-app-scope .btn .icon{margin-right:5px;}
  /* ---------- Dashboard ---------- */
  .tailor-app-scope .stat-grid{display:grid; grid-template-columns:repeat(auto-fit, minmax(160px,1fr)); gap:14px; margin-bottom:22px;}
  .tailor-app-scope .stat-card{
    background:var(--card); border:1px solid var(--line); border-radius:3px;
    box-shadow:var(--shadow); padding:16px 18px;
  }
  .tailor-app-scope .stat-card .stat-label{font-size:.72rem; text-transform:uppercase; letter-spacing:.06em; color:#6b6255; margin-bottom:6px;}
  .tailor-app-scope .stat-card .stat-value{font-family:'Bitter',serif; font-weight:800; font-size:1.5rem;}
  .tailor-app-scope .stat-card.accent-red .stat-value{color:var(--red);}
  .tailor-app-scope .stat-card.accent-teal .stat-value{color:var(--teal);}
  .tailor-app-scope .stat-card.accent-marigold .stat-value{color:#a86a1c;}
  .tailor-app-scope .dash-section-title{font-family:'Bitter',serif; font-weight:800; font-size:1.05rem; margin:26px 0 10px;}
  .tailor-app-scope .dash-list{list-style:none; margin:0; padding:0;}
  .tailor-app-scope .dash-list li{
    display:flex; justify-content:space-between; gap:10px; padding:10px 0;
    border-bottom:1px solid var(--line); font-size:.88rem;
  }
  .tailor-app-scope .dash-list li:last-child{border-bottom:none;}
  /* ---------- Analytics ---------- */
  .tailor-app-scope .bar-chart{display:flex; align-items:flex-end; gap:10px; height:160px; padding:10px 4px 0;}
  .tailor-app-scope .bar-chart .bar-col{flex:1; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; height:100%;}
  .tailor-app-scope .bar-chart .bar{width:60%; background:var(--marigold); border-radius:3px 3px 0 0; min-height:2px;}
  .tailor-app-scope .bar-chart .bar-amt{font-size:.68rem; color:#6b6255; margin-bottom:4px;}
  .tailor-app-scope .bar-chart .bar-label{font-size:.72rem; color:#6b6255; margin-top:8px;}
  .tailor-app-scope .hbar-row{display:flex; align-items:center; gap:10px; margin:9px 0; font-size:.86rem;}
  .tailor-app-scope .hbar-row .hbar-label{width:110px; flex-shrink:0; text-transform:capitalize; color:var(--ink);}
  .tailor-app-scope .hbar-track{flex:1; height:12px; background:#eee8db; border-radius:6px; overflow:hidden;}
  .tailor-app-scope .hbar-fill{height:100%; background:var(--teal); border-radius:6px;}
  .tailor-app-scope .hbar-row .hbar-value{width:64px; text-align:right; flex-shrink:0; font-size:.8rem; color:#6b6255;}
  /* ---------- Order summary box (live totals) ---------- */
  .tailor-app-scope .summary-box{
    background:#faf6ec; border:1px solid var(--line); border-radius:6px;
    padding:14px 16px; margin:4px 0 18px;
  }
  .tailor-app-scope .summary-box .sr{display:flex; justify-content:space-between; font-size:.88rem; padding:5px 0; color:#5a5245;}
  .tailor-app-scope .summary-box .sr.total{
    border-top:1px solid var(--line); margin-top:4px; padding-top:9px;
    font-weight:800; font-size:1rem; color:var(--ink);
  }
  /* ---------- Address section ---------- */
  .tailor-app-scope .addr-card{background:#faf6ec; border:1px solid var(--line); border-radius:6px; padding:18px 20px; margin-bottom:20px;}
  /* ---------- Charges (flat amounts on order form) ---------- */
  .tailor-app-scope .charges-list{list-style:none; margin:0 0 4px; padding:0;}
  .tailor-app-scope .charges-list li{display:flex; align-items:center; gap:8px; margin-bottom:4px;}
  .tailor-app-scope .charges-list .chg-add-row{display:flex; align-items:center; gap:8px;}
  .tailor-app-scope .empty{
    text-align:center; padding:40px 10px; color:#948a7b; font-size:.9rem;
    border:1px dashed var(--line); border-radius:3px;
  }
  /* ---------- Bill / receipt ---------- */
  .tailor-app-scope .bill-wrap{display:flex; gap:14px; align-items:flex-end; margin-bottom:18px; flex-wrap:wrap;}
  .tailor-app-scope .bill-wrap input{max-width:220px;}
  .tailor-app-scope .bill-card{
    max-width:420px; margin:0 auto; background:var(--card);
    font-family:'Courier Prime', monospace; color:var(--ink);
    padding:26px 24px 42px; border:1px solid var(--line);
    box-shadow:var(--shadow);
    clip-path: polygon(0% 0%,100% 0%,100% 100%, 97% 90%, 94% 100%, 91% 90%, 88% 100%, 85% 90%, 82% 100%, 79% 90%, 76% 100%, 73% 90%, 70% 100%, 67% 90%, 64% 100%, 61% 90%, 58% 100%, 55% 90%, 52% 100%, 49% 90%, 46% 100%, 43% 90%, 40% 100%, 37% 90%, 34% 100%, 31% 90%, 28% 100%, 25% 90%, 22% 100%, 19% 90%, 16% 100%, 13% 90%, 10% 100%, 7% 90%, 4% 100%, 1% 90%, 0% 100%);
  }
  .tailor-app-scope .bill-shop{text-align:center; margin-bottom:12px; position:relative;}
  .tailor-app-scope .bill-phone{font-weight:700; font-size:1rem; display:block;}
  .tailor-app-scope .bill-since{position:absolute; top:2px; right:0; font-size:.72rem;}
  .tailor-app-scope .bill-name{font-family:'Bitter',serif; font-weight:800; font-size:1.15rem; margin:6px 0 2px; letter-spacing:.01em;}
  .tailor-app-scope .bill-tag{font-size:.72rem;}
  .tailor-app-scope .bill-addr{font-size:.72rem; margin-top:2px;}
  .tailor-app-scope .rule{border:none; border-top:1px dashed var(--ink); margin:12px 0;}
  .tailor-app-scope .bill-meta div{display:flex; justify-content:space-between; font-size:.8rem; margin:3px 0;}
  .tailor-app-scope .bill-items div{display:flex; justify-content:space-between; font-size:.82rem; margin:5px 0;}
  .tailor-app-scope .bill-items .item-price{color:#6b6255;}
  .tailor-app-scope .bill-total{display:flex; justify-content:space-between; font-weight:700; font-size:1rem; margin-top:10px;}
  .tailor-app-scope .bill-note{font-size:.68rem; text-align:center; margin-top:16px; color:#6b6255; line-height:1.5;}
  .tailor-app-scope .bill-thanks{text-align:center; font-size:.85rem; margin:14px 0 6px;}
  @media print{
  .tailor-app-scope aside, .tailor-app-scope .no-print{display:none !important;}
  .tailor-app-scope main{padding:0; max-width:none;}
  .tailor-app-scope{background:#fff;}
  .tailor-app-scope .bill-card{box-shadow:none; border:none; margin:0;}
}

  @media (max-width:760px){
  .tailor-app-scope #app{flex-direction:column;}
  .tailor-app-scope aside{width:100%; height:auto; position:relative; flex-direction:row; align-items:center; padding:14px 10px; overflow-x:auto;}
  .tailor-app-scope .brand{padding:0 12px; font-size:1rem;}
  .tailor-app-scope .brand small{display:none;}
  .tailor-app-scope nav{flex-direction:row; margin-top:0;}
  .tailor-app-scope nav button{padding:10px 12px; border-left:none; border-bottom:3px solid transparent; white-space:nowrap;}
  .tailor-app-scope nav button.active{border-left-color:transparent; border-bottom-color:var(--marigold);}
  .tailor-app-scope .side-foot{display:none;}
  .tailor-app-scope main{padding:24px 18px 60px;}
  .tailor-app-scope .grid{grid-template-columns:1fr;}
  .tailor-app-scope .product-grid{grid-template-columns:1fr;}
}
</style>`;

  var TAILOR_HTML = `
<div id="app">
  <aside>
    <img id="sb-logo" class="sb-logo" src="" alt="Shop logo" style="display:none;">
    <div class="brand"><span id="sb-brand-name">Santi Ledger</span><small id="sb-brand-tag">Order &amp; Bill Book</small></div>
    <nav id="nav">
      <button data-view="dashboard" class="active" aria-label="Dashboard — overview and stats" title="Dashboard">
        <span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg></span> Dashboard
      </button>
      <button data-view="order" aria-label="Create a new order" title="New Order">
        <span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg></span> New Order
      </button>
      <button data-view="orders" aria-label="View and manage all orders" title="Orders">
        <span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg></span> Orders
      </button>
      <button data-view="bill" aria-label="Look up and print a bill" title="Print Bill">
        <span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h9l3 3v17l-3-2-3 2-3-2-3 2V2z"/><path d="M9 7h6M9 11h6M9 15h4"/></svg></span> Print Bill
      </button>
      <button data-view="dues" aria-label="View pending dues" title="Dues">
        <span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12M6 8h12M9 3v18M6 13c4 0 4 3 0 3s-4 3 0 3M15 13h3M15 19h3"/></svg></span> Dues
      </button>
      <button data-view="prices" aria-label="View and edit price list" title="Price List">
        <span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 12.6L12 21.2a2 2 0 0 1-2.8 0l-7-7a2 2 0 0 1 0-2.8L10.8 2.8a2 2 0 0 1 1.4-.6H19a2 2 0 0 1 2 2v6.4a2 2 0 0 1-.4 1.4z"/><circle cx="15.5" cy="7.5" r="1.5"/></svg></span> Price List
      </button>
      <button data-view="analytics" aria-label="View analytics" title="Analytics">
        <span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 16l4-6 3 3 5-8"/></svg></span> Analytics
      </button>
      <button data-view="settings" aria-label="Edit shop settings" title="Shop Settings">
        <span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.56V21a2 2 0 0 1-4 0v-.09A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.04H3a2 2 0 0 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1.04-1.56V3a2 2 0 0 1 4 0v.09A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.56 1.04H21a2 2 0 0 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15z"/></svg></span> Shop Settings
      </button>
    </nav>
    <div class="side-foot">
      <span id="sb-foot-name">Santi Ladies Wear</span><br>
      <span id="sb-foot-addr">Jayanagar 9th Block, Bengaluru</span>
      <span class="powered-by">Powered by WAGS</span>
    </div>
  </aside>

  <main>

    <!-- DASHBOARD -->
    <section id="view-dashboard" class="view">
      <h2 class="page-title">Dashboard</h2>
      <p class="page-sub">Today's snapshot — orders, deliveries and dues at a glance.</p>
      <div class="stat-grid" id="dash-stats"></div>
      <h3 class="dash-section-title">Deliveries due today &amp; this week</h3>
      <ul class="dash-list" id="dash-deliveries"></ul>
      <h3 class="dash-section-title">Recent orders</h3>
      <ul class="dash-list" id="dash-recent"></ul>
    </section>

    <!-- NEW ORDER -->
    <section id="view-order" class="view" style="display:none;">
      <h2 class="page-title" id="order-form-title">New Order</h2>
      <p class="page-sub" id="order-form-sub">Enter customer and stitching details. An order number is assigned automatically.</p>
      <form id="order-form" class="card">
        <input type="hidden" id="f-edit-id" value="">
        <div class="grid">
          <div class="field"><label>Customer name</label><input required id="f-name" type="text" placeholder="e.g. Radha Kumar"></div>
          <div class="field"><label>Mobile number</label><input required id="f-mobile" type="tel" inputmode="numeric" maxlength="10" placeholder="e.g. 9880012345"></div>
        </div>
        <div id="customer-hint" class="hint" style="display:none;"></div>
        <div class="tape"></div>
        <h3 class="dash-section-title" style="margin-top:0;">Work items</h3>
        <div class="grid" id="order-qty-grid"></div>
        <h3 class="dash-section-title" id="order-charges-title" style="display:none;">Charges</h3>
        <div class="grid" id="order-charges-grid"></div>
        <div class="grid">
          <div class="field"><label>Discount (₹, optional)</label><input id="f-discount" type="number" min="0" value="0" placeholder="0"></div>
          <div class="field"><label>Advance paid (₹)</label><input id="f-advance" type="number" min="0" value="0" placeholder="0"></div>
          <div class="field"><label>Delivery date</label><input id="f-delivery" type="date"></div>
        </div>
        <div class="field"><label>Order notes (optional)</label><textarea id="f-notes" rows="2" placeholder="e.g. match old blouse colour, extra loose fit"></textarea></div>
        <div class="checkline" id="f-tax-row" style="display:none;">
          <input type="checkbox" id="f-tax">
          <label for="f-tax" id="f-tax-label">Apply tax</label>
        </div>

        <div class="summary-box" id="order-summary-box">
          <div class="sr"><span id="sum-count-label">Subtotal</span><span id="sum-subtotal">₹ 0</span></div>
          <div class="sr" id="sum-discount-row" style="display:none;"><span>Discount</span><span id="sum-discount">− ₹ 0</span></div>
          <div class="sr" id="sum-tax-row" style="display:none;"><span id="sum-tax-label">Tax</span><span id="sum-tax">₹ 0</span></div>
          <div class="sr total"><span>Estimated total</span><span id="sum-estimated">₹ 0</span></div>
        </div>

        <div class="tape"></div>
        <button type="submit" class="btn btn-primary" id="order-submit-btn" aria-label="Save this order"><span class="icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg></span>Save order</button>
        <button type="button" class="btn btn-ghost" id="order-cancel-edit-btn" style="display:none; margin-left:10px;" aria-label="Cancel editing this order">Cancel edit</button>
      </form>
    </section>

    <!-- ORDERS LIST -->
    <section id="view-orders" class="view" style="display:none;">
      <h2 class="page-title">Orders</h2>
      <p class="page-sub">Track delivery status and jump to a bill for printing.</p>
      <div class="no-print" style="display:flex; align-items:flex-end; justify-content:space-between; gap:14px; flex-wrap:wrap;">
        <div class="field" style="max-width:340px; margin-bottom:14px;">
          <label>Search orders</label>
          <input id="orders-search" type="text" placeholder="Search by name, mobile or order #" aria-label="Search orders by name, mobile or order number">
        </div>
        <button type="button" class="btn btn-ghost" id="orders-export-btn" style="margin-bottom:14px;" aria-label="Export all orders as a CSV file" title="Export all orders as CSV"><span class="icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg></span>Export CSV</button>
      </div>
      <div class="filter-row no-print" id="orders-filter-row"></div>
      <div class="card" style="padding:0; overflow-x:auto;">
        <table id="orders-table">
          <thead>
            <tr><th>Order #</th><th>Date</th><th>Delivery</th><th>Customer</th><th>Mobile</th><th>Balance</th><th>Status</th><th></th></tr>
          </thead>
          <tbody id="orders-tbody"></tbody>
        </table>
        <div id="orders-empty" class="empty" style="display:none; margin:20px;">No orders yet — save one from "New Order".</div>
      </div>
    </section>

    <!-- DUES -->
    <section id="view-dues" class="view" style="display:none;">
      <h2 class="page-title">Dues</h2>
      <p class="page-sub">Orders with money still owed, oldest first — nothing here should be forgotten.</p>
      <div class="card" style="padding:0; overflow-x:auto;">
        <table id="dues-table">
          <thead>
            <tr><th>Order #</th><th>Customer</th><th>Mobile</th><th>Delivery</th><th>Balance</th><th>Status</th><th></th></tr>
          </thead>
          <tbody id="dues-tbody"></tbody>
        </table>
        <div id="dues-empty" class="empty" style="display:none; margin:20px;">No pending dues 🎉</div>
      </div>
    </section>

    <!-- BILL -->
    <section id="view-bill" class="view" style="display:none;">
      <h2 class="page-title">Print Bill</h2>
      <p class="page-sub">Look up an order number to generate a printable receipt.</p>
      <div class="bill-wrap no-print">
        <div class="field" style="margin:0;"><label>Order number</label><input id="bill-lookup" type="text" placeholder="e.g. 0001" aria-label="Order number to look up"></div>
        <button class="btn btn-primary" id="bill-find-btn" aria-label="Find bill for this order number">Find bill</button>
        <button class="btn btn-teal" id="bill-print-btn" style="display:none;" aria-label="Print this bill" title="Print"><span class="icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg></span>Print</button>
        <button class="btn btn-teal" id="bill-download-btn" style="display:none;" aria-label="Download this bill as an image" title="Download as image"><span class="icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg></span>Download</button>
        <a class="btn btn-whatsapp" id="bill-whatsapp-btn" href="#" target="_blank" rel="noopener" style="display:none;" aria-label="Send this bill on WhatsApp" title="Send on WhatsApp"><span class="icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.6 6.3A8.9 8.9 0 0 0 4 17.4L3 22l4.7-1a9 9 0 0 0 4.3 1.1A8.9 8.9 0 0 0 17.6 6.3zm-5.6 13.7a7.4 7.4 0 0 1-3.8-1l-.3-.2-2.8.7.7-2.7-.2-.3a7.4 7.4 0 1 1 13.8-3.7 7.4 7.4 0 0 1-7.4 7.2zm4.1-5.5c-.2-.1-1.3-.7-1.6-.7-.2-.1-.4-.1-.5.1s-.6.7-.7.9-.3.2-.5.1a6 6 0 0 1-1.8-1.1 6.6 6.6 0 0 1-1.2-1.5c-.1-.2 0-.4.1-.5l.4-.4.2-.3a.5.5 0 0 0 0-.4c-.1-.1-.5-1.3-.7-1.7-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.6.3 2.7 2.7 0 0 0-.9 2 4.7 4.7 0 0 0 1 2.5 10.7 10.7 0 0 0 4.1 3.6c.6.2 1 .4 1.4.5a3.3 3.3 0 0 0 1.5.1 2.5 2.5 0 0 0 1.6-1.1 1.9 1.9 0 0 0 .2-1.1c-.1-.1-.3-.2-.5-.3z"/></svg></span>Send WhatsApp</a>
        <a class="btn btn-payment" id="bill-payment-btn" href="#" target="_blank" rel="noopener" style="display:none;" aria-label="Open payment link for this bill" title="Collect payment"><span class="icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/></svg></span>Payment</a>
      </div>
      <div id="bill-result"></div>
    </section>

    <!-- PRICES -->
    <section id="view-prices" class="view" style="display:none;">
      <h2 class="page-title">Price List</h2>
      <p class="page-sub">Rates used to calculate bill totals from quantities entered on orders. Same rates apply to every order.</p>

      <h3 class="dash-section-title" style="margin-top:0;">Currency</h3>
      <div class="card no-print" style="display:flex; align-items:center; justify-content:space-between; gap:14px; flex-wrap:wrap;">
        <div class="lock-status-text" id="currency-lock-status"></div>
        <label class="toggle-switch" aria-label="Unlock currency settings for editing">
          <input type="checkbox" id="currency-unlock-toggle">
          <span class="toggle-slider"></span>
        </label>
      </div>
      <form id="currency-form" class="card">
        <div class="grid">
          <div class="field"><label>Currency symbol</label><input type="text" id="currency-symbol" maxlength="4" placeholder="₹" disabled aria-label="Currency symbol shown throughout the app and on bills"></div>
          <div class="field"><label>Symbol position</label>
            <select id="currency-position" disabled aria-label="Whether the currency symbol appears before or after the amount">
              <option value="before">Before amount — ₹ 100</option>
              <option value="after">After amount — 100 ₹</option>
            </select>
          </div>
        </div>
        <button type="submit" class="btn btn-primary" id="currency-save-btn" disabled aria-label="Save currency settings">Save currency settings</button>
      </form>

      <h3 class="dash-section-title">Tax</h3>
      <div class="card no-print" style="display:flex; align-items:center; justify-content:space-between; gap:14px; flex-wrap:wrap;">
        <div class="lock-status-text" id="tax-lock-status"></div>
        <label class="toggle-switch" aria-label="Unlock tax settings for editing">
          <input type="checkbox" id="tax-unlock-toggle">
          <span class="toggle-slider"></span>
        </label>
      </div>
      <form id="tax-form" class="card">
        <div class="grid">
          <div class="field"><label>Tax rate (%)</label><input type="number" min="0" step="0.01" id="tax-rate" value="0" placeholder="0" disabled aria-label="Tax rate percentage applied to bills"></div>
          <div class="field"><label>Tax label (shown on bill)</label><input type="text" id="tax-label" value="GST" placeholder="GST" disabled aria-label="Label shown on the bill for tax, e.g. GST"></div>
          <div class="field"><label>Tax option on orders</label>
            <select id="tax-enabled" disabled aria-label="Whether staff can apply tax on individual orders">
              <option value="no">Off — hide the tax checkbox on orders</option>
              <option value="yes">On — let staff tick "Apply tax" per order</option>
            </select>
          </div>
        </div>
        <button type="submit" class="btn btn-primary" id="tax-save-btn" disabled aria-label="Save tax settings">Save tax settings</button>
      </form>

      <h3 class="dash-section-title">Work items</h3>
      <div class="card no-print" style="display:flex; align-items:center; justify-content:space-between; gap:14px; flex-wrap:wrap;">
        <div class="lock-status-text" id="prices-lock-status"></div>
        <div style="display:flex; gap:14px; align-items:center;">
          <button type="button" class="btn btn-ghost" id="prices-add-product-btn" style="display:none;" aria-label="Add a new work item to the price list">
            <span class="icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg></span>Add work item
          </button>
          <button type="button" class="btn btn-ghost" id="prices-change-pw-btn" style="display:none;" aria-label="Change the shared password">Change password</button>
          <label class="toggle-switch" aria-label="Unlock price list for editing">
            <input type="checkbox" id="prices-unlock-toggle">
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
      <form id="prices-form" class="card">
        <div class="product-grid" id="prices-grid"></div>
        <div class="tape"></div>
        <button type="submit" class="btn btn-primary" id="prices-save-btn" disabled aria-label="Save price list">Save prices</button>
      </form>

      <h3 class="dash-section-title">Charges</h3>
      <p class="page-sub" style="margin-top:-4px;">Flat, named ₹ amounts (like "Other stitching" or delivery charges) that staff can fill in per order — not multiplied by a quantity.</p>
      <div class="card no-print" style="display:flex; align-items:center; justify-content:space-between; gap:14px; flex-wrap:wrap;">
        <div class="lock-status-text" id="charges-lock-status"></div>
        <label class="toggle-switch" aria-label="Unlock charges for editing">
          <input type="checkbox" id="charges-unlock-toggle">
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div class="card">
        <ul class="charges-list" id="charges-list"></ul>
        <div class="chg-add-row no-print" id="charges-add-row" style="display:none;">
          <input type="text" id="charge-new-name" placeholder="e.g. Delivery charge">
          <button type="button" class="btn btn-ghost" id="charge-add-btn" aria-label="Add a new charge"><span class="icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg></span>Add</button>
        </div>
      </div>
    </section>

    <!-- SETTINGS -->
    <section id="view-settings" class="view" style="display:none;">
      <h2 class="page-title">Shop Settings</h2>
      <p class="page-sub">These details appear on every printed and WhatsApp bill, and in the sidebar.</p>
      <div class="card no-print" style="display:flex; align-items:center; justify-content:space-between; gap:14px; flex-wrap:wrap;">
        <div class="lock-status-text" id="settings-lock-status"></div>
        <label class="toggle-switch" aria-label="Unlock shop settings for editing">
          <input type="checkbox" id="settings-unlock-toggle">
          <span class="toggle-slider"></span>
        </label>
      </div>
      <form id="settings-form" class="card">
        <div class="grid">
          <div class="field"><label>Shop name</label><input id="s-name" type="text" placeholder="e.g. Santi Ladies Wear" disabled></div>
          <div class="field"><label>Tagline</label><input id="s-tag" type="text" placeholder="e.g. Exclusive in Ladies Tailoring" disabled></div>
          <div class="field"><label>Phone</label><input id="s-phone" type="text" placeholder="e.g. 98809 98255" disabled></div>
          <div class="field"><label>Since / established</label><input id="s-since" type="text" placeholder="e.g. Since 1993" disabled></div>
          <div class="field full"><label>Logo image URL</label><input id="s-logo" type="url" placeholder="https://…" disabled></div>
        </div>
        <div class="tape"></div>

        <h3 class="dash-section-title" style="margin-top:0;">Address</h3>
        <div class="addr-card">
          <div class="grid">
            <div class="field full"><label>Block, Apartment, Flat, House, Unit, Suite, Office, PO Box No. and Name</label><input id="s-addr-block-no" type="text" placeholder="e.g. Flat 12B, Shree Apartments" disabled></div>
            <div class="field full"><label>Area, Sector, Village</label><input id="s-addr-block-name" type="text" placeholder="e.g. Jayanagar 9th Block" disabled></div>
            <div class="field full"><label>Road / Street / Lane</label><input id="s-addr-road" type="text" placeholder="e.g. 40th Cross Road" disabled></div>
            <div class="field full"><label>Landmark (optional)</label><input id="s-addr-landmark" type="text" placeholder="e.g. Near Temple" disabled></div>
            <div class="field"><label>Town / City</label><input id="s-addr-city" type="text" placeholder="e.g. Bengaluru" disabled></div>
            <div class="field"><label>State</label><input id="s-addr-state" type="text" placeholder="e.g. Karnataka" disabled></div>
            <div class="field"><label>Country</label><input id="s-addr-country" type="text" placeholder="e.g. India" disabled></div>
            <div class="field"><label>State code (2-letter)</label><input id="s-addr-statecode" type="text" maxlength="2" placeholder="e.g. KA" disabled></div>
            <div class="field"><label>Pincode / Zipcode</label><input id="s-addr-pincode" type="text" placeholder="e.g. 560069" disabled></div>
          </div>
        </div>
        <div class="tape"></div>

        <div class="grid">
          <div class="field"><label>Hours / holiday note</label><input id="s-hours" type="text" placeholder="e.g. Lunch 2:00–4:00 · Sunday holiday" disabled></div>
          <div class="field"><label>Delivery timings note</label><input id="s-delivery-note" type="text" placeholder="e.g. Delivery timings: 5:30 PM – 8:30 PM" disabled></div>
          <div class="field full"><label>Liability note</label><input id="s-liability" type="text" placeholder="e.g. Our liability for delivery ends 30 days after the due date." disabled></div>
          <div class="field full"><label>Thank you / greeting message</label><input id="s-thanks" type="text" placeholder="e.g. Thank you! Welcome again" disabled></div>
        </div>
        <div class="tape"></div>
        <button type="submit" class="btn btn-primary" id="settings-save-btn" disabled aria-label="Save shop details">Save shop details</button>
      </form>

      <h3 class="dash-section-title">Payments</h3>
      <div class="card no-print" style="display:flex; align-items:center; justify-content:space-between; gap:14px; flex-wrap:wrap;">
        <div class="lock-status-text" id="payments-lock-status"></div>
        <label class="toggle-switch" aria-label="Unlock payment settings for editing">
          <input type="checkbox" id="payments-unlock-toggle">
          <span class="toggle-slider"></span>
        </label>
      </div>
      <form id="payments-form" class="card">
        <div class="grid">
          <div class="field"><label>Enable payments</label>
            <select id="pay-enabled" disabled aria-label="Whether the Payment button appears on bills">
              <option value="no">Off — hide Payment button on bills</option>
              <option value="yes">On — show Payment button on bills</option>
            </select>
          </div>
          <div class="field"><label>Payment link</label><input id="pay-link" type="url" placeholder="https://…" disabled aria-label="Payment link opened when Payment button is clicked"></div>
        </div>
        <button type="submit" class="btn btn-primary" id="payments-save-btn" disabled aria-label="Save payment settings">Save payment settings</button>
      </form>
    </section>

    <!-- ANALYTICS -->
    <section id="view-analytics" class="view" style="display:none;">
      <h2 class="page-title">Analytics</h2>
      <p class="page-sub">Trends across all saved orders.</p>
      <div class="stat-grid" id="an-stats"></div>
      <h3 class="dash-section-title" style="margin-top:0;">Revenue — last 6 months</h3>
      <div class="card"><div class="bar-chart" id="an-bar-chart"></div></div>
      <h3 class="dash-section-title">Orders by status</h3>
      <div class="card" id="an-status-breakdown"></div>
      <h3 class="dash-section-title">Top products</h3>
      <div class="card" id="an-top-products"></div>
      <h3 class="dash-section-title">By customer</h3>
      <div class="card" style="padding:0; overflow-x:auto;">
        <table id="an-customer-table">
          <thead><tr><th>Customer</th><th>Mobile</th><th>Orders</th><th>Revenue</th><th>Dues</th></tr></thead>
          <tbody id="an-customer-tbody"></tbody>
        </table>
      </div>
    </section>

  </main>
</div>

<div id="toast" class="toast" role="status" aria-live="polite"></div>
`;

  function injectFonts() {
    if (document.getElementById('tailor-fonts-preconnect')) return;
    var preconnect = document.createElement('link');
    preconnect.id = 'tailor-fonts-preconnect';
    preconnect.rel = 'preconnect';
    preconnect.href = 'https://fonts.googleapis.com';
    document.head.appendChild(preconnect);

    var fontLink = document.createElement('link');
    fontLink.id = 'tailor-fonts-stylesheet';
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Bitter:wght@600;800&family=Inter:wght@400;500;600;700&family=Courier+Prime:wght@400;700&display=swap';
    document.head.appendChild(fontLink);
  }

  function injectHtml2Canvas() {
    if (window.html2canvas || document.getElementById('tailor-html2canvas-script')) return;
    var script = document.createElement('script');
    script.id = 'tailor-html2canvas-script';
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    document.head.appendChild(script);
  }

  function injectCss() {
    var style = document.createElement('style');
    style.setAttribute('data-source', 'tailormain.js');
    style.textContent = TAILOR_CSS;
    document.head.appendChild(style);
  }

  function injectMarkup() {
    var root = document.getElementById('tailor-app-root') ||
               document.getElementById('main-content');
    if (!root) {
      root = document.createElement('div');
      root.id = 'tailor-app-root';
      document.body.appendChild(root);
    }
    root.classList.add('tailor-app-scope');
    root.innerHTML = TAILOR_HTML;
  }

  injectFonts();
  injectHtml2Canvas();
  injectCss();
  injectMarkup();
})();
