/* =====================================================================
   AUDITORMAIN.JS
   Self-contained module: injects all CSS + page markup for the
   Audit Practice Manager app into the host page. Load this BEFORE
   auditapp.js (which supplies the app's behavior/logic).

   All CSS rules are scoped under the ".auditor-app-scope" class so
   they can never leak out and restyle the host page's own elements
   (e.g. a host page's own .badge, main, or body styles are left
   untouched). The mount element receives this class automatically.

   Usage:
     <div id="auditor-app-root"></div>
     <script src="auditormain.js"></script>
     <script src="auditapp.js"></script>

   Mount point resolution (first match wins):
     1. an element with id "auditor-app-root"
     2. an element with id "main-content" (lets a host page's existing
        "main content" placeholder — e.g. a landing page template —
        receive this app without any extra markup)
     3. a new <div id="auditor-app-root"> appended to <body>
   Whichever element is used, the ".auditor-app-scope" class is added
   to it so the scoped CSS above applies correctly.
   ===================================================================== */
(function () {
  var AUDITOR_CSS = `
  .auditor-app-scope{
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
  .auditor-app-scope *{box-sizing:border-box;}
  .auditor-app-scope{margin:0;padding:0;}
  .auditor-app-scope{
    background:
      repeating-linear-gradient(0deg, transparent 0 27px, rgba(156,59,59,.06) 27px 28px),
      var(--paper);
    color:var(--ink);
    font-family:'Inter',sans-serif;
    min-height:100vh;
  }
  .auditor-app-scope #app{display:flex; min-height:100vh;}
  .auditor-app-scope a{color:var(--teal);}
  .auditor-app-scope :focus-visible{outline:2px solid var(--marigold); outline-offset:2px;}
  .auditor-app-scope .visually-hidden{position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap;}

  /* ---------- Sidebar ---------- */
  .auditor-app-scope aside{
    width:230px; flex-shrink:0;
    background:var(--ink);
    color:var(--card);
    padding:26px 0 0;
    display:flex; flex-direction:column;
    position:sticky; top:0; height:100vh;
  }
  .auditor-app-scope .brand{
    font-family:'Bitter',serif; font-weight:800;
    font-size:1.3rem; line-height:1.15;
    padding:0 22px 6px;
    letter-spacing:.01em;
  }
  .auditor-app-scope .brand small{
    display:block; font-family:'Inter'; font-weight:500;
    font-size:.68rem; letter-spacing:.14em; text-transform:uppercase;
    color:var(--marigold-dim); margin-top:6px;
  }
  .auditor-app-scope nav{margin-top:24px; display:flex; flex-direction:column;}
  .auditor-app-scope nav button{
    all:unset; cursor:pointer;
    padding:12px 22px; font-family:'Inter'; font-weight:500; font-size:.9rem;
    color:#cfc6b6; border-left:3px solid transparent;
    display:flex; align-items:center; gap:11px;
  }
  .auditor-app-scope nav button .nav-icon{ font-size:1rem; width:18px; text-align:center; flex-shrink:0; }
  .auditor-app-scope nav button:hover{color:#fff; background:rgba(255,255,255,.04);}
  .auditor-app-scope nav button.active{
    color:#fff; background:rgba(217,147,46,.14);
    border-left-color:var(--marigold);
  }
  .auditor-app-scope nav button:focus-visible{ outline:2px solid var(--marigold); outline-offset:-2px; }
  .auditor-app-scope .side-foot{
    margin-top:auto; padding:14px 22px 0; font-size:.72rem; color:#a89e8c;
    border-top:1px solid rgba(255,255,255,.08); padding-top:14px; line-height:1.5;
  }
  .auditor-app-scope .side-foot strong{ color:#e4dccb; display:block; font-size:.78rem; margin-bottom:1px; }
  .auditor-app-scope .powered-by{
    padding:12px 22px 20px; font-size:.66rem; letter-spacing:.03em;
    color:#655c4c; text-align:left;
  }
  .auditor-app-scope .powered-by b{ color:#8b8172; }
  .auditor-app-scope code{ background:#efe8d8; border:1px solid var(--line); border-radius:2px; padding:1px 5px; font-size:.78rem; font-family:'Courier Prime',monospace; }

  /* ---------- Main ---------- */
  .auditor-app-scope main{flex:1; padding:40px 44px 80px; max-width:1080px;}
  .auditor-app-scope .view{display:none;}
  .auditor-app-scope .view.active{display:block;}
  .auditor-app-scope h2.page-title{
    font-family:'Bitter',serif; font-weight:800; font-size:1.6rem; margin:0 0 4px;
    display:flex; align-items:center; gap:10px;
  }
  .auditor-app-scope p.page-sub{margin:0 0 20px; color:#5c5344; font-size:.92rem;}

  .auditor-app-scope .view-head{display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:12px; margin-bottom:4px;}
  .auditor-app-scope .view-head-actions{display:flex; gap:10px; flex-wrap:wrap;}

  .auditor-app-scope .card{
    background:var(--card); border:1px solid var(--line); border-radius:3px;
    box-shadow:var(--shadow); padding:26px 28px; margin-bottom:22px;
  }
  .auditor-app-scope .card h3.card-title{
    font-family:'Bitter',serif; font-size:1.02rem; font-weight:700; margin:0 0 14px;
    display:flex; align-items:center; gap:8px;
  }
  .auditor-app-scope .banner-card{ border-left:4px solid var(--red); }

  .auditor-app-scope label{display:block; font-size:.78rem; font-weight:600; color:#4d4638; margin:0 0 5px; letter-spacing:.01em;}
  .auditor-app-scope input, .auditor-app-scope select, .auditor-app-scope textarea{
    width:100%; font-family:'Inter'; font-size:.94rem; color:var(--ink);
    background:#fff; border:1px solid var(--line); border-radius:2px;
    padding:9px 11px; outline:none;
  }
  .auditor-app-scope textarea{resize:vertical;}
  .auditor-app-scope input:focus, .auditor-app-scope select:focus, .auditor-app-scope textarea:focus{border-color:var(--marigold); box-shadow:0 0 0 3px rgba(217,147,46,.15);}
  .auditor-app-scope .grid{display:grid; grid-template-columns:1fr 1fr; gap:16px 20px;}
  .auditor-app-scope .grid .full{grid-column:1 / -1;}
  .auditor-app-scope .field{margin-bottom:14px;}

  .auditor-app-scope .btn{
    all:unset; cursor:pointer; display:inline-flex; align-items:center; gap:8px;
    font-family:'Inter'; font-weight:600; font-size:.88rem;
    padding:11px 20px; border-radius:2px; letter-spacing:.01em;
    transition:filter .12s ease, transform .05s ease;
  }
  .auditor-app-scope .btn:active{ transform:translateY(1px); }
  .auditor-app-scope .btn-primary{background:var(--marigold); color:#2b2004;}
  .auditor-app-scope .btn-primary:hover{background:#c88323;}
  .auditor-app-scope .btn-ghost{background:transparent; color:var(--red); border:1px solid var(--red-dim);}
  .auditor-app-scope .btn-ghost:hover{background:rgba(156,59,59,.08);}
  .auditor-app-scope .btn-teal{background:var(--teal); color:#eafff9;}
  .auditor-app-scope .btn-teal:hover{background:#245a51;}
  .auditor-app-scope .btn-sm{padding:8px 14px; font-size:.82rem;}

  /* ---------- toasts ---------- */
  .auditor-app-scope .toast{
    position:fixed; top:20px; right:20px; background:var(--ink); color:#fff;
    font-size:.88rem; padding:12px 18px 12px 14px; border-radius:3px; box-shadow:var(--shadow);
    border-left:4px solid var(--marigold); z-index:2000; max-width:340px;
    font-family:'Inter'; opacity:0; transform:translateY(-6px); transition:all .25s ease;
    pointer-events:none; display:flex; align-items:flex-start; gap:9px;
  }
  .auditor-app-scope .toast.show{opacity:1; transform:translateY(0);}
  .auditor-app-scope .toast .t-icon{ font-size:1rem; line-height:1.3; }
  .auditor-app-scope .toast.toast-success{ border-left-color:var(--teal); }
  .auditor-app-scope .toast.toast-error{ border-left-color:var(--red); }
  .auditor-app-scope .toast.toast-info{ border-left-color:var(--marigold); }

  /* ---------- Table ---------- */
  .auditor-app-scope .table-wrap{overflow-x:auto;}
  .auditor-app-scope table{width:100%; border-collapse:collapse; font-size:.9rem;}
  .auditor-app-scope thead th{
    text-align:left; font-weight:600; font-size:.72rem; letter-spacing:.06em; text-transform:uppercase;
    color:#5c5344; padding:8px 10px; border-bottom:2px solid var(--ink); white-space:nowrap;
  }
  .auditor-app-scope tbody td{padding:11px 10px; border-bottom:1px solid var(--line); vertical-align:top;}
  .auditor-app-scope tbody tr:hover{background:rgba(217,147,46,.06);}
  .auditor-app-scope .status-pill{
    font-size:.72rem; font-weight:600; padding:3px 9px; border-radius:12px; text-transform:capitalize;
    display:inline-block; white-space:nowrap;
  }
  .auditor-app-scope .status-active, .auditor-app-scope .status-completed, .auditor-app-scope .status-paid{background:#c9e2b8; color:#2c4919;}
  .auditor-app-scope .status-expired, .auditor-app-scope .status-cancelled, .auditor-app-scope .status-pending{background:#f0c8c8; color:#6e1d1d;}
  .auditor-app-scope .status-scheduled, .auditor-app-scope .status-partial{background:#f1dcae; color:#6e4b0e;}
  .auditor-app-scope .status-entity{background:#e2dbc9; color:#514936;}
  .auditor-app-scope .row-actions{display:flex; gap:10px; white-space:nowrap;}

  .auditor-app-scope .icon-btn{
    all:unset; cursor:pointer; font-size:.9rem; line-height:1; padding:4px 6px;
    border-radius:3px; color:#5c5344;
  }
  .auditor-app-scope .icon-btn:hover{background:rgba(43,38,32,.08); color:var(--ink);}
  .auditor-app-scope .icon-btn:focus-visible{ outline:2px solid var(--marigold); outline-offset:1px; }
  .auditor-app-scope .icon-btn.icon-danger:hover{color:var(--red); background:rgba(156,59,59,.1);}

  .auditor-app-scope .name-link{ all:unset; cursor:pointer; font-weight:700; color:var(--ink); border-bottom:1px dashed var(--teal); }
  .auditor-app-scope .name-link:hover{ color:var(--teal); }

  .auditor-app-scope .badge{
    display:inline-block; font-size:.74rem; padding:3px 9px; border-radius:12px;
    background:rgba(47,110,99,.12); color:var(--teal); margin:2px 4px 2px 0; font-weight:600;
  }

  .auditor-app-scope .filter-row{display:flex; gap:8px; flex-wrap:wrap; margin:2px 0 0;}
  .auditor-app-scope .filter-chip{
    all:unset; cursor:pointer; font-size:.78rem; font-weight:600; padding:6px 13px;
    border-radius:14px; border:1px solid var(--line); color:#5c5344; background:var(--card);
  }
  .auditor-app-scope .filter-chip:hover{border-color:var(--marigold);}
  .auditor-app-scope .filter-chip.active{background:var(--ink); color:#fff; border-color:var(--ink);}
  .auditor-app-scope .filter-chip:focus-visible{ outline:2px solid var(--marigold); outline-offset:1px; }

  .auditor-app-scope .empty{
    text-align:center; padding:40px 10px; color:#7c7364; font-size:.9rem;
    border:1px dashed var(--line); border-radius:3px;
  }

  .auditor-app-scope .row-item{
    display:flex; align-items:center; justify-content:space-between; gap:10px;
    padding:11px 12px; border-radius:3px; background:#fff; border:1px solid var(--line); margin-bottom:8px;
  }
  .auditor-app-scope .row-item:last-child{margin-bottom:0;}
  .auditor-app-scope .row-item .ri-name{font-weight:700; font-size:.92rem;}
  .auditor-app-scope .row-item .ri-sub{font-size:.78rem; color:#5c5344; margin-top:2px;}
  .auditor-app-scope .row-item a.ri-call{color:var(--teal); font-weight:600; font-size:.82rem; text-decoration:none;}

  /* ---------- Dashboard ---------- */
  .auditor-app-scope .stat-grid{display:grid; grid-template-columns:repeat(5,1fr); gap:16px; margin-bottom:22px;}
  .auditor-app-scope .stat-card{
    background:var(--card); border:1px solid var(--line); border-radius:3px;
    box-shadow:var(--shadow); padding:20px 20px 18px;
  }
  .auditor-app-scope .stat-card .stat-icon{ font-size:1.15rem; margin-bottom:8px; }
  .auditor-app-scope .stat-card .stat-num{ font-family:'Bitter',serif; font-weight:800; font-size:1.6rem; line-height:1; }
  .auditor-app-scope .stat-card .stat-label{ font-size:.76rem; color:#5c5344; margin-top:6px; letter-spacing:.02em; }
  .auditor-app-scope .stat-card.accent-red .stat-num{ color:var(--red); }
  .auditor-app-scope .stat-card.accent-teal .stat-num{ color:var(--teal); }
  .auditor-app-scope .stat-card.accent-marigold .stat-num{ color:#8f5a10; }
  .auditor-app-scope .dash-sub-title{ font-family:'Bitter',serif; font-weight:700; font-size:1rem; margin:0 0 12px; }
  .auditor-app-scope .dash-cols{display:grid; grid-template-columns:1fr 1fr; gap:20px;}

  /* ---------- Modal ---------- */
  .auditor-app-scope .modal{display:none; position:fixed; inset:0; z-index:1000; background:rgba(43,38,32,.55); align-items:center; justify-content:center; padding:20px;}
  .auditor-app-scope .modal.active{display:flex;}
  .auditor-app-scope .modal-box{
    background:var(--card); border:1px solid var(--line); border-radius:3px; box-shadow:var(--shadow);
    max-width:640px; width:100%; max-height:88vh; overflow-y:auto; padding:26px 28px;
  }
  .auditor-app-scope .modal-box h3{font-family:'Bitter',serif; font-weight:800; font-size:1.2rem; margin:0 0 18px;}
  .auditor-app-scope .modal-actions{display:flex; justify-content:flex-end; gap:10px; margin-top:20px;}
  .auditor-app-scope .service-grid{display:grid; grid-template-columns:1fr 1fr; gap:8px; max-height:170px; overflow-y:auto; border:1px solid var(--line); border-radius:2px; padding:12px; background:#fff;}
  .auditor-app-scope .checkline{ display:flex; align-items:center; gap:9px; margin:0; }
  .auditor-app-scope .checkline input[type="checkbox"]{ width:auto; accent-color:var(--marigold); }
  .auditor-app-scope .checkline label{ margin:0; font-size:.86rem; color:var(--ink); font-weight:500; }
  .auditor-app-scope fieldset{border:none; margin:0; padding:0;}
  .auditor-app-scope legend{ padding:0; margin:0 0 5px; font-size:.78rem; font-weight:600; color:#4d4638; }

  /* ---------- Invoice / receipt ---------- */
  .auditor-app-scope .bill-card{
    max-width:400px; margin:0 auto; background:var(--card);
    font-family:'Courier Prime', monospace; color:var(--ink);
    padding:26px 24px 42px; border:1px solid var(--line);
    box-shadow:var(--shadow);
    clip-path: polygon(0% 0%,100% 0%,100% 100%, 97% 90%, 94% 100%, 91% 90%, 88% 100%, 85% 90%, 82% 100%, 79% 90%, 76% 100%, 73% 90%, 70% 100%, 67% 90%, 64% 100%, 61% 90%, 58% 100%, 55% 90%, 52% 100%, 49% 90%, 46% 100%, 43% 90%, 40% 100%, 37% 90%, 34% 100%, 31% 90%, 28% 100%, 25% 90%, 22% 100%, 19% 90%, 16% 100%, 13% 90%, 10% 100%, 7% 90%, 4% 100%, 1% 90%, 0% 100%);
  }
  .auditor-app-scope .bill-shop{text-align:center; margin-bottom:12px;}
  .auditor-app-scope .bill-name{font-family:'Bitter',serif; font-weight:800; font-size:1.1rem; margin:2px 0; letter-spacing:.01em;}
  .auditor-app-scope .bill-tag{font-size:.72rem;}
  .auditor-app-scope .rule{border:none; border-top:1px dashed var(--ink); margin:12px 0;}
  .auditor-app-scope .bill-meta div{display:flex; justify-content:space-between; font-size:.8rem; margin:3px 0;}
  .auditor-app-scope .bill-items div{display:flex; justify-content:space-between; font-size:.82rem; margin:5px 0;}
  .auditor-app-scope .bill-total{display:flex; justify-content:space-between; font-weight:700; font-size:1rem; margin-top:10px;}
  .auditor-app-scope .bill-note{font-size:.68rem; text-align:center; margin-top:16px; color:#5c5344; line-height:1.5;}

  /* ---------- Lock screen ---------- */
  .auditor-app-scope .lock-screen{position:fixed; inset:0; background:var(--ink); z-index:5000; display:flex; align-items:center; justify-content:center; padding:20px;}
  .auditor-app-scope .lock-box{background:#332c22; border:1px solid rgba(255,255,255,.1); border-radius:4px; padding:32px 28px; width:100%; max-width:340px; box-shadow:var(--shadow);}
  .auditor-app-scope .lock-box label{color:#d8cfbe;}
  .auditor-app-scope .lock-box .page-sub{color:#b6ab97;}

  @media print{
    .auditor-app-scope aside, .auditor-app-scope .no-print, .auditor-app-scope #lock-screen, .auditor-app-scope #backup-reminder-banner{display:none !important;}
    .auditor-app-scope main{padding:0; max-width:none;}
    .auditor-app-scope{background:#fff;}
    .auditor-app-scope #invoice-modal.active{position:static; background:none; display:block !important;}
    .auditor-app-scope #invoice-modal.active .modal-box{box-shadow:none; border:none; max-height:none;}
  }
  @supports selector(:has(*)){
    @media print{
      .auditor-app-scope:has(#invoice-modal.active) > *:not(#invoice-modal){display:none !important;}
    }
  }

  @media (max-width:760px){
    .auditor-app-scope #app{flex-direction:column;}
    .auditor-app-scope aside{width:100%; height:auto; position:relative; flex-direction:row; align-items:center; padding:14px 10px; overflow-x:auto;}
    .auditor-app-scope .brand{padding:0 12px; font-size:1rem;}
    .auditor-app-scope .brand small{display:none;}
    .auditor-app-scope nav{flex-direction:row; margin-top:0;}
    .auditor-app-scope nav button{padding:12px 14px; border-left:none; border-bottom:3px solid transparent; white-space:nowrap;}
    .auditor-app-scope nav button.active{border-left-color:transparent; border-bottom-color:var(--marigold);}
    .auditor-app-scope .side-foot, .auditor-app-scope .powered-by{display:none;}
    .auditor-app-scope main{padding:24px 18px 60px;}
    .auditor-app-scope .grid, .auditor-app-scope .stat-grid, .auditor-app-scope .dash-cols{grid-template-columns:1fr;}
    .auditor-app-scope .icon-btn{ padding:8px 9px; font-size:1rem; }
  }
`;

  var AUDITOR_HTML = `

<!-- LOCK SCREEN (only shown if a PIN has been set in Settings) -->
<div id="lock-screen" class="lock-screen" style="display:none;" role="dialog" aria-modal="true" aria-labelledby="lock-title">
  <div class="lock-box">
    <div id="lock-title" class="brand" style="color:var(--card); text-align:center; padding:0 0 18px;">🔒 Audit Practice Manager</div>
    <p class="page-sub" style="text-align:center;">Enter your PIN to continue</p>
    <div class="field">
      <label for="lock-pin-input">PIN</label>
      <input type="password" id="lock-pin-input" inputmode="numeric" autocomplete="off" aria-required="true">
    </div>
    <button class="btn btn-primary" style="width:100%; justify-content:center;" onclick="attemptUnlock()">Unlock</button>
    <p id="lock-error" class="page-sub" style="color:var(--red-dim); min-height:1.2em; margin:10px 0 0; text-align:center;" role="alert"></p>
  </div>
</div>

<div id="app">
  <aside>
    <div class="brand" id="sb-brand">Audit Practice Manager<small id="sb-tag">Client &amp; Engagement Tracker</small></div>
    <nav id="nav" aria-label="Main navigation">
      <button data-view="dashboard" class="active" title="Dashboard" aria-label="Dashboard"><span class="nav-icon" aria-hidden="true">📊</span> Dashboard</button>
      <button data-view="clients" title="Clients" aria-label="Clients"><span class="nav-icon" aria-hidden="true">👤</span> Clients</button>
      <button data-view="contracts" title="Audit Engagements" aria-label="Audit Engagements"><span class="nav-icon" aria-hidden="true">📋</span> Engagements</button>
      <button data-view="visits" title="Field Visits" aria-label="Field Visits"><span class="nav-icon" aria-hidden="true">🧳</span> Visits</button>
      <button data-view="whatsapp" title="WhatsApp Messaging" aria-label="WhatsApp Messaging"><span class="nav-icon" aria-hidden="true">💬</span> WhatsApp</button>
      <button data-view="backup" title="Backup and Restore" aria-label="Backup and Restore"><span class="nav-icon" aria-hidden="true">⬇️</span> Backup</button>
      <button data-view="settings" title="Firm Profile" aria-label="Firm Profile and Settings"><span class="nav-icon" aria-hidden="true">⚙️</span> Settings</button>
    </nav>
    <div class="side-foot"><strong id="sb-foot-name">My CA Practice</strong><span id="sb-foot-phone"></span></div>
    <div class="powered-by">Audit Practice <b>Manager</b></div>
  </aside>

  <main>

    <!-- DASHBOARD -->
    <section id="view-dashboard" class="view active" aria-labelledby="dash-heading">
      <h2 class="page-title" id="dash-heading"><span aria-hidden="true">📊</span> Dashboard</h2>
      <p class="page-sub">Overview of your clients, engagements, and upcoming work.</p>

      <div id="backup-reminder-banner" class="card banner-card" style="display:none;" role="status">
        <h3 class="card-title">⚠️ Backup reminder</h3>
        <p class="page-sub" style="margin-bottom:14px;">You haven't exported a backup recently. Your data only lives in this browser — clearing it or switching devices will lose everything.</p>
        <button class="btn btn-teal btn-sm" onclick="exportData()">⬇ Backup Now</button>
      </div>

      <div class="stat-grid">
        <div class="stat-card"><div class="stat-icon" aria-hidden="true">👤</div><div class="stat-num" id="stat-clients">0</div><div class="stat-label">Total Clients</div></div>
        <div class="stat-card accent-teal"><div class="stat-icon" aria-hidden="true">📋</div><div class="stat-num" id="stat-contracts">0</div><div class="stat-label">Ongoing Engagements</div></div>
        <div class="stat-card accent-marigold"><div class="stat-icon" aria-hidden="true">🧳</div><div class="stat-num" id="stat-visits">0</div><div class="stat-label">Upcoming Visits</div></div>
        <div class="stat-card accent-teal"><div class="stat-icon" aria-hidden="true">💰</div><div class="stat-num" id="stat-revenue">₹0</div><div class="stat-label">Total Fees Billed</div></div>
        <div class="stat-card accent-red"><div class="stat-icon" aria-hidden="true">⚠️</div><div class="stat-num" id="stat-pending">₹0</div><div class="stat-label">Pending Fees</div></div>
      </div>

      <div class="dash-cols">
        <div class="card">
          <h3 class="dash-sub-title">📅 Upcoming Visits (7 days)</h3>
          <div id="upcoming-visits-list"></div>
        </div>
        <div class="card">
          <h3 class="dash-sub-title">⚠️ Engagements Due Soon (30 days)</h3>
          <div id="expiring-contracts-list"></div>
        </div>
      </div>
    </section>

    <!-- CLIENTS -->
    <section id="view-clients" class="view" aria-labelledby="clients-heading">
      <div class="view-head">
        <div><h2 class="page-title" id="clients-heading"><span aria-hidden="true">👤</span> Clients</h2><p class="page-sub">All your customer records in one place.</p></div>
        <div class="view-head-actions">
          <button class="btn btn-teal btn-sm" onclick="exportClientsCSV()">⬇ CSV</button>
          <button class="btn btn-primary" onclick="openModal('client')">+ Add Client</button>
        </div>
      </div>
      <div class="card">
        <label for="client-search" class="visually-hidden">Search clients</label>
        <input type="text" id="client-search" placeholder="Search clients by name or phone..." aria-label="Search clients by name or phone">
      </div>
      <div class="card">
        <div class="table-wrap">
          <table>
            <caption class="visually-hidden">List of clients</caption>
            <thead><tr><th scope="col">Name</th><th scope="col">Contact</th><th scope="col">Address</th><th scope="col">Entity Type</th><th scope="col">Engagements</th><th scope="col">Actions</th></tr></thead>
            <tbody id="clients-list"></tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- ENGAGEMENTS -->
    <section id="view-contracts" class="view" aria-labelledby="engagements-heading">
      <div class="view-head">
        <div><h2 class="page-title" id="engagements-heading"><span aria-hidden="true">📋</span> Audit Engagements</h2><p class="page-sub">Audit assignments, deadlines, and fee status.</p></div>
        <div class="view-head-actions">
          <button class="btn btn-teal btn-sm" onclick="exportEngagementsCSV()">⬇ CSV</button>
          <button class="btn btn-primary" onclick="openModal('contract')">+ New Engagement</button>
        </div>
      </div>
      <div class="card">
        <label for="contract-search" class="visually-hidden">Search engagements</label>
        <input type="text" id="contract-search" placeholder="Search engagements by client name or phone..." aria-label="Search engagements by client name or phone" style="margin-bottom:10px;">
        <div class="filter-row" id="contract-filter-row" role="group" aria-label="Filter engagements by status">
          <button class="filter-chip active" data-filter="all" aria-pressed="true">All Status</button>
          <button class="filter-chip" data-filter="active" aria-pressed="false">Ongoing</button>
          <button class="filter-chip" data-filter="expired" aria-pressed="false">Overdue</button>
          <button class="filter-chip" data-filter="cancelled" aria-pressed="false">Completed</button>
        </div>
      </div>
      <div class="card">
        <div class="table-wrap">
          <table>
            <caption class="visually-hidden">List of audit engagements</caption>
            <thead><tr><th scope="col">Client</th><th scope="col">Audit Type</th><th scope="col">FY / Period</th><th scope="col">Fee</th><th scope="col">Payment</th><th scope="col">Status</th><th scope="col">Scope of Work</th><th scope="col">Actions</th></tr></thead>
            <tbody id="contracts-list"></tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- VISITS -->
    <section id="view-visits" class="view" aria-labelledby="visits-heading">
      <div class="view-head">
        <div><h2 class="page-title" id="visits-heading"><span aria-hidden="true">🧳</span> Field Visits</h2><p class="page-sub">Site visits, verifications, and client meetings.</p></div>
        <button class="btn btn-primary" onclick="openModal('visit')">+ Schedule Visit</button>
      </div>
      <div class="card">
        <label for="visit-search" class="visually-hidden">Search visits</label>
        <input type="text" id="visit-search" placeholder="Search visits by client name..." aria-label="Search visits by client name">
      </div>
      <div class="card">
        <div class="table-wrap">
          <table>
            <caption class="visually-hidden">List of field visits</caption>
            <thead><tr><th scope="col">Client</th><th scope="col">Date &amp; Time</th><th scope="col">Status</th><th scope="col">Notes / Observations</th><th scope="col">Actions</th></tr></thead>
            <tbody id="visits-list"></tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- WHATSAPP -->
    <section id="view-whatsapp" class="view" aria-labelledby="whatsapp-heading">
      <h2 class="page-title" id="whatsapp-heading"><span aria-hidden="true">💬</span> WhatsApp Messaging</h2>
      <p class="page-sub">Pre-fills a WhatsApp message for a client — you review and hit Send in WhatsApp. Browsers can't send WhatsApp messages silently, so bulk sends step through recipients one at a time.</p>

      <div class="card">
        <h3 class="card-title">✏️ Message Templates</h3>
        <p class="page-sub" style="margin-bottom:14px;">Placeholders: <code>{client_name}</code> <code>{firm_name}</code> <code>{audit_type}</code> <code>{fy}</code> <code>{due_date}</code> <code>{amount}</code> <code>{visit_date}</code> <code>{visit_time}</code> <code>{purpose}</code></p>
        <div class="field"><label for="tpl-reminder">Visit Reminder</label><textarea id="tpl-reminder" rows="2"></textarea></div>
        <div class="field"><label for="tpl-payment_due">Payment Due</label><textarea id="tpl-payment_due" rows="2"></textarea></div>
        <div class="field"><label for="tpl-overdue">Overdue</label><textarea id="tpl-overdue" rows="2"></textarea></div>
        <div class="field"><label for="tpl-completed">Engagement Completed</label><textarea id="tpl-completed" rows="2"></textarea></div>
        <div class="field"><label for="tpl-greeting">General Greeting</label><textarea id="tpl-greeting" rows="2"></textarea></div>
        <button class="btn btn-primary btn-sm" onclick="saveTemplates()">Save Templates</button>
      </div>

      <div class="card">
        <h3 class="card-title">📨 Bulk / Sectional Send</h3>
        <div class="grid">
          <div class="field">
            <label for="bulk-type">Message Type</label>
            <select id="bulk-type" onchange="buildBulkAudience()">
              <option value="reminder">Visit Reminder (upcoming 7 days)</option>
              <option value="payment_due">Payment Due (pending/partial)</option>
              <option value="overdue">Overdue engagements</option>
              <option value="completed">Completed engagements</option>
              <option value="greeting">General Greeting</option>
            </select>
          </div>
          <div class="field" id="bulk-entity-filter-field" style="display:none;">
            <label for="bulk-entity-filter">Filter by Entity Type</label>
            <select id="bulk-entity-filter" onchange="buildBulkAudience()">
              <option value="">All clients</option>
              <option value="individual">Individual</option>
              <option value="proprietorship">Proprietorship</option>
              <option value="partnership">Partnership Firm</option>
              <option value="llp">LLP</option>
              <option value="company">Company</option>
              <option value="trust">Trust / Society</option>
            </select>
          </div>
        </div>

        <div class="table-wrap">
          <table>
            <caption class="visually-hidden">Bulk message recipients</caption>
            <thead><tr>
              <th scope="col"><input type="checkbox" id="bulk-select-all" onchange="toggleBulkSelectAll()" aria-label="Select all recipients"></th>
              <th scope="col">Client</th>
              <th scope="col">Detail</th>
            </tr></thead>
            <tbody id="bulk-audience-list"></tbody>
          </table>
        </div>

        <div class="card" style="background:#fff; margin-top:16px; margin-bottom:0;">
          <h3 class="card-title" style="font-size:.9rem;">Preview (first selected recipient)</h3>
          <div id="bulk-preview" style="white-space:pre-wrap; font-size:.86rem; color:#4d4638;"></div>
        </div>

        <button class="btn btn-teal" style="margin-top:16px;" onclick="startBulkSend()">🚀 Start Sending</button>
      </div>

      <div class="card" id="bulk-send-panel" style="display:none;" role="status" aria-live="polite">
        <h3 class="card-title">Sending Queue</h3>
        <p class="page-sub" id="bulk-progress-text"></p>
        <div id="bulk-current-recipient" class="row-item" style="margin-bottom:14px;"></div>
        <div class="view-head-actions">
          <button class="btn btn-primary" onclick="openCurrentWaChat()">💬 Open WhatsApp Chat</button>
          <button class="btn btn-teal btn-sm" onclick="markSentAndNext()">✓ Sent — Next</button>
          <button class="btn btn-ghost btn-sm" onclick="skipCurrent()">Skip</button>
        </div>
      </div>
    </section>

    <!-- BACKUP -->
    <section id="view-backup" class="view" aria-labelledby="backup-heading">
      <h2 class="page-title" id="backup-heading"><span aria-hidden="true">⬇️</span> Backup &amp; Restore</h2>
      <p class="page-sub">Your data lives in this browser only — back it up regularly.</p>
      <div class="card">
        <h3 class="card-title">Export a backup</h3>
        <p class="page-sub" style="margin-bottom:16px;">Downloads a JSON file with all clients, engagements, visits and your firm profile.</p>
        <button class="btn btn-teal" onclick="exportData()">⬇ Download Backup (JSON)</button>
      </div>
      <div class="card">
        <h3 class="card-title">Export as spreadsheets</h3>
        <p class="page-sub" style="margin-bottom:16px;">CSV files you can open in Excel or Google Sheets, for reporting or sharing.</p>
        <div class="view-head-actions">
          <button class="btn btn-teal btn-sm" onclick="exportClientsCSV()">⬇ Clients CSV</button>
          <button class="btn btn-teal btn-sm" onclick="exportEngagementsCSV()">⬇ Engagements CSV</button>
        </div>
      </div>
      <div class="card">
        <h3 class="card-title">Restore from a backup</h3>
        <p class="page-sub" style="margin-bottom:16px;">This will replace all current data with the contents of the backup JSON file.</p>
        <label class="btn btn-primary" style="cursor:pointer;">
          ⬆ Choose Backup File
          <input type="file" accept=".json" onchange="importData(event)" style="display:none;">
        </label>
      </div>
    </section>

    <!-- SETTINGS -->
    <section id="view-settings" class="view" aria-labelledby="settings-heading">
      <h2 class="page-title" id="settings-heading"><span aria-hidden="true">⚙️</span> Firm Profile</h2>
      <p class="page-sub">Shown on your printed fee invoices and in the sidebar.</p>
      <div class="card" style="max-width:520px;">
        <div class="field"><label for="biz-name">Firm Name</label><input type="text" id="biz-name"></div>
        <div class="field"><label for="biz-phone">Phone</label><input type="text" id="biz-phone"></div>
        <div class="field"><label for="biz-address">Address</label><textarea id="biz-address" rows="2"></textarea></div>
        <div class="field"><label for="biz-gst">GSTIN / ICAI Firm Regn. No. (optional)</label><input type="text" id="biz-gst"></div>
        <div class="field checkline" style="margin-bottom:10px;">
          <input type="checkbox" id="biz-gst-enabled">
          <label for="biz-gst-enabled" style="margin:0;">Show GST breakup on fee invoices</label>
        </div>
        <div class="field" id="biz-gst-rate-field"><label for="biz-gst-rate">GST Rate (%)</label><input type="number" id="biz-gst-rate" min="0" max="28" step="0.5" value="18"></div>
        <button class="btn btn-primary" onclick="saveSettings()">Save Profile</button>
      </div>

      <div class="card" style="max-width:520px;" id="security-card">
        <h3 class="card-title">🔒 App Lock</h3>
        <p class="page-sub" id="security-status-text" style="margin-bottom:14px;"></p>
        <div id="security-form"></div>
      </div>
    </section>

  </main>
</div>

<!-- FORM MODAL -->
<div id="modal" class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <div class="modal-box">
    <h3 id="modal-title"></h3>
    <div id="modal-content"></div>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button id="modal-submit" class="btn btn-primary">Save</button>
    </div>
  </div>
</div>

<!-- INVOICE MODAL -->
<div id="invoice-modal" class="modal" role="dialog" aria-modal="true" aria-label="Fee invoice">
  <div class="modal-box" style="max-width:460px;">
    <div id="invoice-print"></div>
    <div class="modal-actions no-print">
      <button class="btn btn-ghost" onclick="closeInvoice()">Close</button>
      <button class="btn btn-primary" onclick="window.print()">🖨 Print</button>
    </div>
  </div>
</div>

<div class="toast" id="toast" role="status" aria-live="polite"></div>

`;

  function injectCss() {
    var style = document.createElement('style');
    style.setAttribute('data-source', 'auditormain.js');
    style.textContent = AUDITOR_CSS;
    document.head.appendChild(style);
  }

  function injectMarkup() {
    var root = document.getElementById('auditor-app-root') ||
               document.getElementById('main-content');
    if (!root) {
      root = document.createElement('div');
      root.id = 'auditor-app-root';
      document.body.appendChild(root);
    }
    root.classList.add('auditor-app-scope');
    root.innerHTML = AUDITOR_HTML;
  }

  injectCss();
  injectMarkup();
})();
