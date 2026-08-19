/* =====================================================================
   AUDIT PRACTICE MANAGER
   Single-file offline app. Data is stored in this browser's localStorage
   only — see Backup & Restore for exporting/importing your data.
   ===================================================================== */

/* ================= CONSTANTS ================= */
var STATUS = { ACTIVE:'active', EXPIRED:'expired', CANCELLED:'cancelled' };
var STATUS_LABELS = { active:'Ongoing', expired:'Overdue', cancelled:'Completed' };
var VISIT_STATUS = { SCHEDULED:'scheduled', COMPLETED:'completed', CANCELLED:'cancelled' };
var PAYMENT_STATUS = { PAID:'paid', PENDING:'pending', PARTIAL:'partial' };
var PIN_KEY = 'audit-pin-hash';
var LAST_EXPORT_KEY = 'audit-last-export';
var BACKUP_REMINDER_DAYS = 14;

var PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
var GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
var PHONE_REGEX = /^[+]?[0-9\s-]{7,15}$/;

var serviceOptions = ['Financial Statement Review','Statutory Compliance Check','Tax Computation','GST Reconciliation','Stock Verification','Internal Controls Review','ROC Filing','Bank Reconciliation','TDS Compliance','Report Drafting'];
var auditTypeOptions = ['Statutory Audit','Tax Audit','GST Audit','Internal Audit','Stock Audit','Concurrent Audit','Management Audit','Other'];

var DEFAULT_TEMPLATES = {
  reminder: 'Hi {client_name}, this is a reminder that our team will visit you on {visit_date} at {visit_time} for {purpose}. — {firm_name}',
  payment_due: 'Dear {client_name}, your professional fee of {amount} for {audit_type} (FY {fy}) is due on {due_date}. Kindly arrange payment at your earliest convenience. — {firm_name}',
  overdue: 'Dear {client_name}, this is a reminder that your payment of {amount} for {audit_type} (FY {fy}) was due on {due_date} and is currently overdue. Please contact us to settle this at the earliest. — {firm_name}',
  completed: 'Dear {client_name}, we are pleased to inform you that your {audit_type} for FY {fy} has been completed. Thank you for your continued trust in us. — {firm_name}',
  greeting: 'Dear {client_name}, warm greetings from {firm_name}! Wishing you continued success. Feel free to reach out anytime for your compliance needs.'
};
var templates = Object.assign({}, DEFAULT_TEMPLATES);
var bulkAudience = [];
var waQueue = [];
var waQueueIndex = 0;

/* ================= STATE ================= */
var clients = [];
var contracts = [];
var visits = [];
var business = { name:'My CA Practice', phone:'', address:'', gst:'', gstEnabled:false, gstRate:18 };
var currentModal = '';
var editingId = null;
var contractFilterStatus = 'all';
var lastFocusedEl = null;

document.addEventListener('DOMContentLoaded', function(){
  bindNav();
  bindFilters();
  bindSearchDebounce();
  bindGlobalKeyHandlers();
  var pinInput = document.getElementById('lock-pin-input');
  if (pinInput){
    pinInput.addEventListener('keydown', function(e){ if (e.key === 'Enter') attemptUnlock(); });
  }
  if (!showLockScreenIfNeeded()){
    initApp();
  }
});

function initApp(){
  loadData();
  refreshAll();
}

function esc(s){
  return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
}

function money(n){
  var v = parseFloat(n);
  if (isNaN(v)) v = 0;
  return '₹' + v.toLocaleString('en-IN');
}

function nowIso(){ return new Date().toISOString(); }

function debounce(fn, wait){
  var t;
  return function(){
    var args = arguments;
    var ctx = this;
    clearTimeout(t);
    t = setTimeout(function(){ fn.apply(ctx, args); }, wait);
  };
}

/* ================= TOAST ================= */
function toast(msg, type){
  var t = document.getElementById('toast');
  var icons = { success:'✅', error:'⛔', info:'ℹ️' };
  var cls = type === 'success' ? 'toast-success' : type === 'error' ? 'toast-error' : 'toast-info';
  t.className = 'toast show ' + cls;
  t.setAttribute('role', type === 'error' ? 'alert' : 'status');
  t.innerHTML = '<span class="t-icon" aria-hidden="true">' + (icons[type] || icons.info) + '</span><span>' + esc(msg) + '</span>';
  clearTimeout(t._timer);
  t._timer = setTimeout(function(){ t.classList.remove('show'); }, 2800);
}

/* ================= NAV / VIEWS ================= */
function bindNav(){
  var btns = document.querySelectorAll('#nav button');
  for (var i = 0; i < btns.length; i++){
    btns[i].addEventListener('click', function(){ showView(this.getAttribute('data-view')); });
  }
}
function showView(viewName){
  var views = document.querySelectorAll('.view');
  for (var i = 0; i < views.length; i++) views[i].classList.remove('active');
  var target = document.getElementById('view-' + viewName);
  if (target) target.classList.add('active');

  var btns = document.querySelectorAll('#nav button');
  for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active');
  var activeBtn = document.querySelector('#nav [data-view="' + viewName + '"]');
  if (activeBtn) activeBtn.classList.add('active');

  if (viewName === 'settings'){
    fillSettingsForm();
    renderSecurityForm();
  }
  if (viewName === 'whatsapp'){
    fillTemplatesForm();
    buildBulkAudience();
    document.getElementById('bulk-send-panel').style.display = 'none';
  }
}

function bindFilters(){
  var chips = document.querySelectorAll('#contract-filter-row .filter-chip');
  for (var i = 0; i < chips.length; i++){
    chips[i].addEventListener('click', function(){
      for (var j = 0; j < chips.length; j++){
        chips[j].classList.remove('active');
        chips[j].setAttribute('aria-pressed', 'false');
      }
      this.classList.add('active');
      this.setAttribute('aria-pressed', 'true');
      contractFilterStatus = this.getAttribute('data-filter');
      renderContracts();
    });
  }
}

function bindSearchDebounce(){
  var map = { 'client-search': renderClients, 'contract-search': renderContracts, 'visit-search': renderVisits };
  Object.keys(map).forEach(function(id){
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', debounce(map[id], 200));
  });
}

function bindGlobalKeyHandlers(){
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape'){
      if (document.getElementById('modal').classList.contains('active')) closeModal();
      if (document.getElementById('invoice-modal').classList.contains('active')) closeInvoice();
    }
    if (e.key === 'Tab'){
      var activeModal = document.querySelector('.modal.active');
      if (!activeModal) return;
      var focusable = activeModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
    }
  });
}

/* ================= STORAGE ================= */
function loadData(){
  clients = safeParseArray(localStorage.getItem('audit-clients'));
  contracts = safeParseArray(localStorage.getItem('audit-engagements'));
  visits = safeParseArray(localStorage.getItem('audit-visits'));
  var savedBiz = localStorage.getItem('audit-business');
  if (savedBiz){
    try {
      var parsed = JSON.parse(savedBiz);
      if (parsed && typeof parsed === 'object') business = Object.assign({}, business, parsed);
    } catch(e){ /* keep defaults if corrupted */ }
  }
  var savedTpl = localStorage.getItem('audit-templates');
  if (savedTpl){
    try {
      var parsedTpl = JSON.parse(savedTpl);
      if (parsedTpl && typeof parsedTpl === 'object') templates = Object.assign({}, DEFAULT_TEMPLATES, parsedTpl);
    } catch(e){ /* keep defaults if corrupted */ }
  }
  applyBusinessHeader();
}
function safeParseArray(raw){
  if (!raw) return [];
  try {
    var parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch(e){
    return [];
  }
}
function saveData(){
  try {
    localStorage.setItem('audit-clients', JSON.stringify(clients));
    localStorage.setItem('audit-engagements', JSON.stringify(contracts));
    localStorage.setItem('audit-visits', JSON.stringify(visits));
    localStorage.setItem('audit-business', JSON.stringify(business));
  } catch(e){
    toast('Could not save — browser storage may be full. Export a backup and remove old records.', 'error');
  }
}
function applyBusinessHeader(){
  document.getElementById('sb-foot-name').textContent = business.name || 'Audit Practice Manager';
  document.getElementById('sb-foot-phone').textContent = business.phone || '';
}
function fillSettingsForm(){
  document.getElementById('biz-name').value = business.name || '';
  document.getElementById('biz-phone').value = business.phone || '';
  document.getElementById('biz-address').value = business.address || '';
  document.getElementById('biz-gst').value = business.gst || '';
  document.getElementById('biz-gst-enabled').checked = !!business.gstEnabled;
  document.getElementById('biz-gst-rate').value = business.gstRate != null ? business.gstRate : 18;
}
function saveSettings(){
  business.name = document.getElementById('biz-name').value.trim();
  business.phone = document.getElementById('biz-phone').value.trim();
  business.address = document.getElementById('biz-address').value.trim();
  business.gst = document.getElementById('biz-gst').value.trim();
  business.gstEnabled = document.getElementById('biz-gst-enabled').checked;
  var rate = parseFloat(document.getElementById('biz-gst-rate').value);
  business.gstRate = isNaN(rate) ? 18 : rate;
  saveData();
  applyBusinessHeader();
  toast('Firm profile saved', 'success');
}

/* ================= WHATSAPP MESSAGING =================
   WhatsApp does not allow silent/automated sending from a browser page.
   These helpers build a "click-to-chat" wa.me link with a pre-filled
   message; the user still has to press Send inside WhatsApp. Bulk sends
   step through recipients one at a time for the same reason. */
function buildWhatsAppLink(phone, message){
  var digits = String(phone || '').replace(/[^\d+]/g, '');
  digits = digits.replace(/^\+/, '');
  if (/^\d{10}$/.test(digits)) digits = '91' + digits; /* assume Indian 10-digit numbers */
  return 'https://wa.me/' + digits + '?text=' + encodeURIComponent(message);
}
function renderTemplate(tpl, data){
  return String(tpl || '').replace(/\{(\w+)\}/g, function(m, key){
    return (data[key] !== undefined && data[key] !== null) ? data[key] : '';
  });
}
function requirePhone(phone, name){
  if (!phone){ toast('No phone number on file for ' + name, 'error'); return false; }
  return true;
}

function fillTemplatesForm(){
  document.getElementById('tpl-reminder').value = templates.reminder;
  document.getElementById('tpl-payment_due').value = templates.payment_due;
  document.getElementById('tpl-overdue').value = templates.overdue;
  document.getElementById('tpl-completed').value = templates.completed;
  document.getElementById('tpl-greeting').value = templates.greeting;
}
function saveTemplates(){
  templates.reminder = document.getElementById('tpl-reminder').value;
  templates.payment_due = document.getElementById('tpl-payment_due').value;
  templates.overdue = document.getElementById('tpl-overdue').value;
  templates.completed = document.getElementById('tpl-completed').value;
  templates.greeting = document.getElementById('tpl-greeting').value;
  try {
    localStorage.setItem('audit-templates', JSON.stringify(templates));
    toast('Templates saved', 'success');
  } catch(e){
    toast('Could not save templates — storage may be full', 'error');
  }
}

/* ---- Single-recipient sends (row action buttons) ---- */
function sendClientGreeting(clientId){
  var cl = clients.find(function(c){ return c.id === clientId; });
  if (!cl) return;
  if (!requirePhone(cl.phone, cl.name)) return;
  var msg = renderTemplate(templates.greeting, { client_name: cl.name, firm_name: business.name || '' });
  window.open(buildWhatsAppLink(cl.phone, msg), '_blank');
}

function sendEngagementMessage(contractId, type){
  var c = contracts.find(function(x){ return x.id === contractId; });
  if (!c) return;
  var cl = clients.find(function(x){ return x.id === c.clientId; });
  if (!cl){ toast('Client not found', 'error'); return; }
  if (!requirePhone(cl.phone, cl.name)) return;
  var msg = renderTemplate(templates[type], {
    client_name: cl.name, firm_name: business.name || '',
    audit_type: c.auditType || '', fy: c.fy || '',
    due_date: c.endDate ? new Date(c.endDate).toLocaleDateString() : '',
    amount: money(c.amount)
  });
  window.open(buildWhatsAppLink(cl.phone, msg), '_blank');
}

function sendVisitReminder(visitId){
  var v = visits.find(function(x){ return x.id === visitId; });
  if (!v) return;
  var c = contracts.find(function(x){ return x.id === v.contractId; });
  var cl = c ? clients.find(function(x){ return x.id === c.clientId; }) : null;
  if (!cl){ toast('Client not found', 'error'); return; }
  if (!requirePhone(cl.phone, cl.name)) return;
  var dt = new Date(v.date);
  var msg = renderTemplate(templates.reminder, {
    client_name: cl.name, firm_name: business.name || '',
    visit_date: dt.toLocaleDateString(),
    visit_time: dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    purpose: v.purpose || 'the scheduled visit'
  });
  window.open(buildWhatsAppLink(cl.phone, msg), '_blank');
}

/* ---- Bulk / sectional send ---- */
function buildBulkAudience(){
  var type = document.getElementById('bulk-type').value;
  document.getElementById('bulk-entity-filter-field').style.display = type === 'greeting' ? 'block' : 'none';
  var entityFilter = document.getElementById('bulk-entity-filter').value;
  bulkAudience = [];

  if (type === 'reminder'){
    var now = new Date();
    var weekAhead = new Date(); weekAhead.setDate(now.getDate() + 7);
    visits.filter(function(v){
      var d = new Date(v.date);
      return v.status === 'scheduled' && d >= now && d <= weekAhead;
    }).forEach(function(v){
      var c = contracts.find(function(x){ return x.id === v.contractId; });
      var cl = c ? clients.find(function(x){ return x.id === c.clientId; }) : null;
      if (!cl || !cl.phone) return;
      var dt = new Date(v.date);
      var msg = renderTemplate(templates.reminder, {
        client_name: cl.name, firm_name: business.name || '',
        visit_date: dt.toLocaleDateString(),
        visit_time: dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        purpose: v.purpose || 'the scheduled visit'
      });
      bulkAudience.push({ name: cl.name, phone: cl.phone, detail: dt.toLocaleDateString() + ' — ' + (v.purpose || ''), message: msg });
    });
  } else if (type === 'payment_due'){
    contracts.filter(function(c){ return c.status === 'active' && (c.paymentStatus === 'pending' || c.paymentStatus === 'partial'); }).forEach(function(c){
      var cl = clients.find(function(x){ return x.id === c.clientId; });
      if (!cl || !cl.phone) return;
      var msg = renderTemplate(templates.payment_due, {
        client_name: cl.name, firm_name: business.name || '',
        audit_type: c.auditType || '', fy: c.fy || '',
        due_date: new Date(c.endDate).toLocaleDateString(), amount: money(c.amount)
      });
      bulkAudience.push({ name: cl.name, phone: cl.phone, detail: money(c.amount) + ' due ' + new Date(c.endDate).toLocaleDateString(), message: msg });
    });
  } else if (type === 'overdue'){
    contracts.filter(function(c){ return c.status === 'expired'; }).forEach(function(c){
      var cl = clients.find(function(x){ return x.id === c.clientId; });
      if (!cl || !cl.phone) return;
      var msg = renderTemplate(templates.overdue, {
        client_name: cl.name, firm_name: business.name || '',
        audit_type: c.auditType || '', fy: c.fy || '',
        due_date: new Date(c.endDate).toLocaleDateString(), amount: money(c.amount)
      });
      bulkAudience.push({ name: cl.name, phone: cl.phone, detail: money(c.amount) + ' overdue since ' + new Date(c.endDate).toLocaleDateString(), message: msg });
    });
  } else if (type === 'completed'){
    contracts.filter(function(c){ return c.status === 'cancelled'; }).forEach(function(c){
      var cl = clients.find(function(x){ return x.id === c.clientId; });
      if (!cl || !cl.phone) return;
      var msg = renderTemplate(templates.completed, {
        client_name: cl.name, firm_name: business.name || '',
        audit_type: c.auditType || '', fy: c.fy || ''
      });
      bulkAudience.push({ name: cl.name, phone: cl.phone, detail: (c.auditType || '') + ' — FY ' + (c.fy || ''), message: msg });
    });
  } else if (type === 'greeting'){
    clients.filter(function(cl){ return cl.phone && (!entityFilter || cl.propertyType === entityFilter); }).forEach(function(cl){
      var msg = renderTemplate(templates.greeting, { client_name: cl.name, firm_name: business.name || '' });
      bulkAudience.push({ name: cl.name, phone: cl.phone, detail: cl.propertyType || '', message: msg });
    });
  }

  renderBulkAudience();
}

function renderBulkAudience(){
  var list = document.getElementById('bulk-audience-list');
  var selectAll = document.getElementById('bulk-select-all');
  if (bulkAudience.length === 0){
    list.innerHTML = '<tr><td colspan="3"><div class="empty">No matching recipients with a phone number on file</div></td></tr>';
    document.getElementById('bulk-preview').textContent = '';
    selectAll.checked = false;
    return;
  }
  var html = '';
  for (var i = 0; i < bulkAudience.length; i++){
    var r = bulkAudience[i];
    html += '<tr><td><input type="checkbox" class="bulk-check" data-idx="' + i + '" checked aria-label="Include ' + esc(r.name) + '" onchange="updateBulkPreview()"></td>' +
      '<td>' + esc(r.name) + '<br><span style="color:#5c5344;font-size:.8rem;">' + esc(r.phone) + '</span></td>' +
      '<td>' + esc(r.detail) + '</td></tr>';
  }
  list.innerHTML = html;
  selectAll.checked = true;
  updateBulkPreview();
}

function toggleBulkSelectAll(){
  var checked = document.getElementById('bulk-select-all').checked;
  document.querySelectorAll('.bulk-check').forEach(function(cb){ cb.checked = checked; });
  updateBulkPreview();
}

function updateBulkPreview(){
  var checks = document.querySelectorAll('.bulk-check');
  var firstChecked = null;
  for (var i = 0; i < checks.length; i++){
    if (checks[i].checked){ firstChecked = bulkAudience[parseInt(checks[i].getAttribute('data-idx'), 10)]; break; }
  }
  document.getElementById('bulk-preview').textContent = firstChecked ? firstChecked.message : 'No recipients selected';
}

function startBulkSend(){
  var checks = document.querySelectorAll('.bulk-check');
  var selected = [];
  for (var i = 0; i < checks.length; i++){
    if (checks[i].checked) selected.push(bulkAudience[parseInt(checks[i].getAttribute('data-idx'), 10)]);
  }
  if (selected.length === 0){ toast('Select at least one recipient', 'error'); return; }
  waQueue = selected;
  waQueueIndex = 0;
  var panel = document.getElementById('bulk-send-panel');
  panel.style.display = 'block';
  renderCurrentQueueItem();
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderCurrentQueueItem(){
  var progressText = document.getElementById('bulk-progress-text');
  var current = document.getElementById('bulk-current-recipient');
  if (waQueueIndex >= waQueue.length){
    progressText.textContent = 'All done — ' + waQueue.length + ' recipient(s) worked through.';
    current.innerHTML = '<div class="empty">No more recipients in this batch.</div>';
    return;
  }
  var r = waQueue[waQueueIndex];
  progressText.textContent = 'Recipient ' + (waQueueIndex + 1) + ' of ' + waQueue.length;
  current.innerHTML = '<div><div class="ri-name">' + esc(r.name) + '</div><div class="ri-sub">' + esc(r.phone) + ' &middot; ' + esc(r.detail) + '</div></div>';
}

function openCurrentWaChat(){
  if (waQueueIndex >= waQueue.length) return;
  var r = waQueue[waQueueIndex];
  window.open(buildWhatsAppLink(r.phone, r.message), '_blank');
}

function markSentAndNext(){
  if (waQueueIndex >= waQueue.length) return;
  waQueueIndex++;
  renderCurrentQueueItem();
  toast(waQueueIndex < waQueue.length ? 'Moved to next recipient' : 'Bulk send complete', waQueueIndex < waQueue.length ? 'info' : 'success');
}

function skipCurrent(){
  if (waQueueIndex >= waQueue.length) return;
  waQueueIndex++;
  renderCurrentQueueItem();
}

/* ================= BACKUP REMINDER ================= */
function checkBackupReminder(){
  var banner = document.getElementById('backup-reminder-banner');
  if (!banner) return;
  var last = localStorage.getItem(LAST_EXPORT_KEY);
  var daysSince = last ? (Date.now() - new Date(last).getTime()) / 86400000 : Infinity;
  var hasData = clients.length > 0 || contracts.length > 0 || visits.length > 0;
  banner.style.display = (hasData && daysSince > BACKUP_REMINDER_DAYS) ? 'block' : 'none';
}

/* ================= EXPORT / IMPORT ================= */
function exportData(){
  var payload = { clients: clients, contracts: contracts, visits: visits, business: business, exportedAt: nowIso() };
  var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'audit-backup-' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  URL.revokeObjectURL(url);
  localStorage.setItem(LAST_EXPORT_KEY, nowIso());
  checkBackupReminder();
  toast('Backup downloaded', 'success');
}

function importData(evt){
  var file = evt.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e){
    try {
      var data = JSON.parse(e.target.result);
      var okClients = Array.isArray(data.clients);
      var okContracts = Array.isArray(data.contracts);
      var okVisits = Array.isArray(data.visits);
      if (!okClients || !okContracts || !okVisits){
        toast('Backup file is missing expected data — import cancelled', 'error');
        evt.target.value = '';
        return;
      }
      if (!confirm('This will replace all current data with the backup. Continue?')){
        evt.target.value = '';
        return;
      }
      clients = data.clients;
      contracts = data.contracts;
      visits = data.visits;
      if (data.business && typeof data.business === 'object') business = Object.assign({}, business, data.business);
      saveData();
      applyBusinessHeader();
      refreshAll();
      toast('Data restored successfully', 'success');
    } catch(err) {
      toast('Invalid backup file', 'error');
    }
    evt.target.value = '';
  };
  reader.readAsText(file);
}

/* ================= CSV EXPORT ================= */
function toCSVValue(v){
  var s = String(v == null ? '' : v);
  if (/[",\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
  return s;
}
function downloadCSV(filename, headers, rows){
  var lines = [headers.map(toCSVValue).join(',')];
  rows.forEach(function(r){ lines.push(r.map(toCSVValue).join(',')); });
  var blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
function exportClientsCSV(){
  if (clients.length === 0){ toast('No clients to export', 'info'); return; }
  var headers = ['Name', 'Phone', 'Email', 'Address', 'PAN/GSTIN', 'Entity Type', 'Engagements'];
  var rows = clients.map(function(c){
    var count = contracts.filter(function(k){ return k.clientId === c.id; }).length;
    return [c.name, c.phone, c.email || '', c.address, c.pan || '', c.propertyType || '', count];
  });
  downloadCSV('clients-' + new Date().toISOString().slice(0, 10) + '.csv', headers, rows);
  toast('Clients exported to CSV', 'success');
}
function exportEngagementsCSV(){
  if (contracts.length === 0){ toast('No engagements to export', 'info'); return; }
  var headers = ['Client', 'Audit Type', 'Financial Year', 'Start Date', 'Due Date', 'Fee', 'Payment Status', 'Status', 'Scope of Work', 'Notes'];
  var rows = contracts.map(function(c){
    var cl = clients.find(function(x){ return x.id === c.clientId; });
    return [cl ? cl.name : 'Unknown', c.auditType || '', c.fy || '', c.startDate, c.endDate, c.amount, c.paymentStatus || '', STATUS_LABELS[c.status] || c.status, (c.services || []).join('; '), c.notes || ''];
  });
  downloadCSV('engagements-' + new Date().toISOString().slice(0, 10) + '.csv', headers, rows);
  toast('Engagements exported to CSV', 'success');
}

/* ================= AUTO STATUS UPDATE ================= */
function refreshContractStatuses(){
  var now = new Date();
  var changed = false;
  for (var i = 0; i < contracts.length; i++){
    var c = contracts[i];
    if (c.status === STATUS.ACTIVE && new Date(c.endDate) < now){
      c.status = STATUS.EXPIRED;
      changed = true;
    }
  }
  if (changed) saveData();
}

function refreshAll(){
  refreshContractStatuses();
  updateDashboard();
  renderClients();
  renderContracts();
  renderVisits();
  checkBackupReminder();
}

/* ================= FINANCIAL YEAR HELPERS ================= */
function currentFYStartYear(){
  var now = new Date();
  var y = now.getFullYear();
  return now.getMonth() >= 3 ? y : y - 1; /* Indian FY: Apr–Mar */
}
function buildFYOptions(selected){
  var start = currentFYStartYear() - 5;
  var end = currentFYStartYear() + 2;
  var opts = '';
  var found = false;
  for (var y = start; y <= end; y++){
    var label = y + '-' + String((y + 1) % 100).padStart(2, '0');
    if (label === selected) found = true;
    opts += '<option value="' + label + '"' + (label === selected ? ' selected' : '') + '>' + label + '</option>';
  }
  if (selected && !found){
    opts += '<option value="' + esc(selected) + '" selected>' + esc(selected) + '</option>';
  }
  return opts;
}
function incrementFY(fy){
  var m = /^(\d{4})-(\d{2})$/.exec(fy || '');
  if (!m) return fy || '';
  var y1 = parseInt(m[1], 10) + 1;
  var y2 = (y1 + 1) % 100;
  return y1 + '-' + String(y2).padStart(2, '0');
}
function addYearToDate(dstr){
  if (!dstr) return dstr;
  var d = new Date(dstr);
  if (isNaN(d.getTime())) return dstr;
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

/* ================= VALIDATION HELPERS ================= */
function isValidPanOrGstin(v){
  if (!v) return true;
  var upper = v.toUpperCase().replace(/\s/g, '');
  return PAN_REGEX.test(upper) || GSTIN_REGEX.test(upper);
}

/* ================= MODAL ================= */
function openModal(type, id){
  if (typeof id === 'undefined') id = null;
  lastFocusedEl = document.activeElement;
  currentModal = type;
  editingId = id;
  var modal = document.getElementById('modal');
  var title = document.getElementById('modal-title');
  var content = document.getElementById('modal-content');
  var submitBtn = document.getElementById('modal-submit');
  submitBtn.textContent = 'Save';

  title.textContent = (id ? 'Edit ' : 'Add ') + (type === 'contract' ? 'Engagement' : type.charAt(0).toUpperCase() + type.slice(1));

  if (type === 'client'){
    var client = id ? (clients.find(function(c){ return c.id === id; }) || {}) : {};
    content.innerHTML =
      '<div class="field"><label for="client-name">Name *</label>' +
      '<input type="text" id="client-name" value="' + esc(client.name || '') + '" placeholder="Client name" required aria-required="true"></div>' +
      '<div class="field"><label for="client-phone">Phone *</label>' +
      '<input type="tel" id="client-phone" value="' + esc(client.phone || '') + '" placeholder="Phone number" required aria-required="true"></div>' +
      '<div class="field"><label for="client-email">Email</label>' +
      '<input type="email" id="client-email" value="' + esc(client.email || '') + '" placeholder="Email"></div>' +
      '<div class="field"><label for="client-address">Address *</label>' +
      '<textarea id="client-address" rows="3" placeholder="Full address" required aria-required="true">' + esc(client.address || '') + '</textarea></div>' +
      '<div class="field"><label for="client-pan">PAN / GSTIN (optional)</label>' +
      '<input type="text" id="client-pan" value="' + esc(client.pan || '') + '" placeholder="PAN or GSTIN"></div>' +
      '<div class="field"><label for="client-property">Entity Type</label>' +
      '<select id="client-property">' +
      '<option value="individual"' + (client.propertyType === 'individual' ? ' selected' : '') + '>Individual</option>' +
      '<option value="proprietorship"' + (client.propertyType === 'proprietorship' ? ' selected' : '') + '>Proprietorship</option>' +
      '<option value="partnership"' + (client.propertyType === 'partnership' ? ' selected' : '') + '>Partnership Firm</option>' +
      '<option value="llp"' + (client.propertyType === 'llp' ? ' selected' : '') + '>LLP</option>' +
      '<option value="company"' + (client.propertyType === 'company' ? ' selected' : '') + '>Company</option>' +
      '<option value="trust"' + (client.propertyType === 'trust' ? ' selected' : '') + '>Trust / Society</option>' +
      '</select></div>';

  } else if (type === 'contract'){
    var contract = id ? (contracts.find(function(c){ return c.id === id; }) || {}) : {};
    var clientOptions = '<option value="">Select Client</option>';
    for (var i = 0; i < clients.length; i++){
      var c = clients[i];
      clientOptions += '<option value="' + c.id + '"' + (contract.clientId === c.id ? ' selected' : '') + '>' + esc(c.name) + ' - ' + esc(c.phone) + '</option>';
    }
    var serviceCheckboxes = '';
    for (var i = 0; i < serviceOptions.length; i++){
      var s = serviceOptions[i];
      var checked = contract.services && contract.services.indexOf(s) !== -1 ? ' checked' : '';
      serviceCheckboxes += '<div class="checkline"><input type="checkbox" value="' + esc(s) + '"' + checked + ' class="service-checkbox" id="svc-' + i + '"><label for="svc-' + i + '">' + esc(s) + '</label></div>';
    }
    var auditTypeSelect = '';
    for (var i = 0; i < auditTypeOptions.length; i++){
      var at = auditTypeOptions[i];
      auditTypeSelect += '<option value="' + esc(at) + '"' + (contract.auditType === at ? ' selected' : '') + '>' + esc(at) + '</option>';
    }
    content.innerHTML =
      '<div class="field"><label for="contract-client">Client *</label>' +
      '<select id="contract-client" required aria-required="true">' + clientOptions + '</select></div>' +
      '<div class="grid">' +
      '<div class="field"><label for="contract-audit-type">Audit Type *</label>' +
      '<select id="contract-audit-type">' + auditTypeSelect + '</select></div>' +
      '<div class="field"><label for="contract-fy">Financial Year *</label>' +
      '<select id="contract-fy" required aria-required="true">' + buildFYOptions(contract.fy) + '</select></div>' +
      '</div>' +
      '<div class="grid">' +
      '<div class="field"><label for="contract-start">Start Date *</label>' +
      '<input type="date" id="contract-start" value="' + esc(contract.startDate || '') + '" required aria-required="true"></div>' +
      '<div class="field"><label for="contract-end">Due Date *</label>' +
      '<input type="date" id="contract-end" value="' + esc(contract.endDate || '') + '" required aria-required="true"></div>' +
      '</div>' +
      '<div class="field"><label for="contract-amount">Fee Amount (₹) *</label>' +
      '<input type="number" id="contract-amount" min="1" step="1" value="' + esc(contract.amount || '') + '" placeholder="Amount" required aria-required="true"></div>' +
      '<div class="field"><label for="contract-payment">Payment Status</label>' +
      '<select id="contract-payment">' +
      '<option value="paid"' + (contract.paymentStatus === 'paid' ? ' selected' : '') + '>Paid</option>' +
      '<option value="pending"' + (contract.paymentStatus === 'pending' ? ' selected' : '') + '>Pending</option>' +
      '<option value="partial"' + (contract.paymentStatus === 'partial' ? ' selected' : '') + '>Partial</option>' +
      '</select></div>' +
      '<fieldset class="field"><legend>Scope of Work</legend>' +
      '<div class="service-grid">' + serviceCheckboxes + '</div></fieldset>' +
      '<div class="field"><label for="contract-status">Status</label>' +
      '<select id="contract-status">' +
      '<option value="active"' + (contract.status === 'active' ? ' selected' : '') + '>Ongoing</option>' +
      '<option value="expired"' + (contract.status === 'expired' ? ' selected' : '') + '>Overdue</option>' +
      '<option value="cancelled"' + (contract.status === 'cancelled' ? ' selected' : '') + '>Completed</option>' +
      '</select></div>' +
      '<div class="field"><label for="contract-notes">Notes</label>' +
      '<textarea id="contract-notes" rows="2" placeholder="Any special terms...">' + esc(contract.notes || '') + '</textarea></div>';

  } else if (type === 'visit'){
    var visit = id ? (visits.find(function(v){ return v.id === id; }) || {}) : {};
    var contractOptions = '<option value="">Select Engagement</option>';
    for (var i = 0; i < contracts.length; i++){
      var c = contracts[i];
      var cl = clients.find(function(x){ return x.id === c.clientId; });
      contractOptions += '<option value="' + c.id + '"' + (visit.contractId === c.id ? ' selected' : '') + '>' + esc(cl ? cl.name : 'Unknown') + ' - ' + esc(c.auditType || '') + '</option>';
    }
    content.innerHTML =
      '<div class="field"><label for="visit-contract">Engagement *</label>' +
      '<select id="visit-contract" required aria-required="true">' + contractOptions + '</select></div>' +
      '<div class="grid">' +
      '<div class="field"><label for="visit-date">Date &amp; Time *</label>' +
      '<input type="datetime-local" id="visit-date" value="' + esc(visit.date || '') + '" required aria-required="true"></div>' +
      '<div class="field"><label for="visit-purpose">Purpose</label>' +
      '<select id="visit-purpose">' +
      '<option value="Site Visit"' + (visit.purpose === 'Site Visit' ? ' selected' : '') + '>Site Visit</option>' +
      '<option value="Stock Verification"' + (visit.purpose === 'Stock Verification' ? ' selected' : '') + '>Stock Verification</option>' +
      '<option value="Document Collection"' + (visit.purpose === 'Document Collection' ? ' selected' : '') + '>Document Collection</option>' +
      '<option value="Client Meeting"' + (visit.purpose === 'Client Meeting' ? ' selected' : '') + '>Client Meeting</option>' +
      '<option value="Closing Meeting"' + (visit.purpose === 'Closing Meeting' ? ' selected' : '') + '>Closing Meeting</option>' +
      '<option value="Other"' + (visit.purpose === 'Other' ? ' selected' : '') + '>Other</option>' +
      '</select></div>' +
      '</div>' +
      '<div class="field"><label for="visit-status">Status</label>' +
      '<select id="visit-status">' +
      '<option value="scheduled"' + (visit.status === 'scheduled' ? ' selected' : '') + '>Scheduled</option>' +
      '<option value="completed"' + (visit.status === 'completed' ? ' selected' : '') + '>Completed</option>' +
      '<option value="cancelled"' + (visit.status === 'cancelled' ? ' selected' : '') + '>Cancelled</option>' +
      '</select></div>' +
      '<div class="field"><label for="visit-notes">Notes</label>' +
      '<textarea id="visit-notes" rows="3" placeholder="Visit notes">' + esc(visit.notes || '') + '</textarea></div>' +
      '<div class="field"><label for="visit-work">Observations</label>' +
      '<textarea id="visit-work" rows="3" placeholder="Observations / findings">' + esc(visit.workDone || '') + '</textarea></div>';
  }

  modal.classList.add('active');
  submitBtn.onclick = submitModal;
  setTimeout(function(){
    var firstField = content.querySelector('input, select, textarea');
    if (firstField) firstField.focus();
  }, 30);
}

function closeModal(){
  document.getElementById('modal').classList.remove('active');
  currentModal = '';
  editingId = null;
  if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') lastFocusedEl.focus();
}

function submitModal(){
  var ts = nowIso();

  if (currentModal === 'client'){
    var name = document.getElementById('client-name').value.trim();
    var phone = document.getElementById('client-phone').value.trim();
    var email = document.getElementById('client-email').value.trim();
    var address = document.getElementById('client-address').value.trim();
    var pan = document.getElementById('client-pan').value.trim();
    var propertyType = document.getElementById('client-property').value;
    if (!name || !phone || !address){ toast('Please fill in all required fields', 'error'); return; }
    if (!PHONE_REGEX.test(phone)){ toast('Please enter a valid phone number', 'error'); return; }
    if (pan && !isValidPanOrGstin(pan)){ toast('PAN/GSTIN format looks incorrect', 'error'); return; }
    var data = { name: name, phone: phone, email: email, address: address, pan: pan, propertyType: propertyType };
    if (editingId){
      var idx = clients.findIndex(function(c){ return c.id === editingId; });
      if (idx > -1) clients[idx] = Object.assign({}, clients[idx], data, { id: editingId, updatedAt: ts });
    } else {
      clients.push(Object.assign({}, data, { id: Date.now().toString(), createdAt: ts, updatedAt: ts }));
    }
    renderClients();
    toast(editingId ? 'Client updated' : 'Client added', 'success');

  } else if (currentModal === 'contract'){
    var clientId = document.getElementById('contract-client').value;
    var auditType = document.getElementById('contract-audit-type').value;
    var fy = document.getElementById('contract-fy').value;
    var startDate = document.getElementById('contract-start').value;
    var endDate = document.getElementById('contract-end').value;
    var amount = document.getElementById('contract-amount').value;
    var paymentStatus = document.getElementById('contract-payment').value;
    var status = document.getElementById('contract-status').value;
    var notes = document.getElementById('contract-notes').value;
    var boxes = document.querySelectorAll('.service-checkbox:checked');
    var services = [];
    for (var i = 0; i < boxes.length; i++) services.push(boxes[i].value);
    if (!clientId || !fy || !startDate || !endDate || !amount){ toast('Please fill in all required fields', 'error'); return; }
    if (new Date(startDate) > new Date(endDate)){ toast('Start date must be before the due date', 'error'); return; }
    if (parseFloat(amount) <= 0){ toast('Fee must be a positive amount', 'error'); return; }
    var data = { clientId: clientId, auditType: auditType, fy: fy, startDate: startDate, endDate: endDate, amount: amount, paymentStatus: paymentStatus, services: services, status: status, notes: notes };
    if (editingId){
      var idx = contracts.findIndex(function(c){ return c.id === editingId; });
      if (idx > -1) contracts[idx] = Object.assign({}, contracts[idx], data, { id: editingId, updatedAt: ts });
    } else {
      contracts.push(Object.assign({}, data, { id: Date.now().toString(), createdAt: ts, updatedAt: ts }));
    }
    renderContracts();
    toast(editingId ? 'Engagement updated' : 'Engagement created', 'success');

  } else if (currentModal === 'visit'){
    var contractId = document.getElementById('visit-contract').value;
    var date = document.getElementById('visit-date').value;
    var purpose = document.getElementById('visit-purpose').value;
    var status = document.getElementById('visit-status').value;
    var notes = document.getElementById('visit-notes').value;
    var workDone = document.getElementById('visit-work').value;
    if (!contractId || !date){ toast('Please fill in all required fields', 'error'); return; }
    var data = { contractId: contractId, date: date, purpose: purpose, status: status, notes: notes, workDone: workDone };
    if (editingId){
      var idx = visits.findIndex(function(v){ return v.id === editingId; });
      if (idx > -1) visits[idx] = Object.assign({}, visits[idx], data, { id: editingId, updatedAt: ts });
    } else {
      visits.push(Object.assign({}, data, { id: Date.now().toString(), createdAt: ts, updatedAt: ts }));
    }
    renderVisits();
    toast(editingId ? 'Visit updated' : 'Visit scheduled', 'success');
  }

  saveData();
  updateDashboard();
  closeModal();
}

function deleteItem(type, id){
  if (!confirm('Are you sure you want to delete this item? This cannot be undone.')) return;
  if (type === 'client'){ clients = clients.filter(function(c){ return c.id !== id; }); renderClients(); }
  else if (type === 'contract'){ contracts = contracts.filter(function(c){ return c.id !== id; }); renderContracts(); }
  else if (type === 'visit'){ visits = visits.filter(function(v){ return v.id !== id; }); renderVisits(); }
  saveData();
  updateDashboard();
  toast('Deleted', 'info');
}

function renewEngagement(id){
  var c = contracts.find(function(x){ return x.id === id; });
  if (!c) return;
  var ts = nowIso();
  var next = {
    clientId: c.clientId,
    auditType: c.auditType,
    fy: incrementFY(c.fy),
    startDate: addYearToDate(c.startDate),
    endDate: addYearToDate(c.endDate),
    amount: c.amount,
    paymentStatus: 'pending',
    services: (c.services || []).slice(),
    status: 'active',
    notes: ''
  };
  contracts.push(Object.assign({}, next, { id: Date.now().toString(), createdAt: ts, updatedAt: ts }));
  saveData();
  renderContracts();
  updateDashboard();
  toast('Engagement renewed for ' + next.fy, 'success');
}

function viewClientEngagements(clientId){
  var cl = clients.find(function(c){ return c.id === clientId; });
  if (!cl) return;
  showView('contracts');
  var searchBox = document.getElementById('contract-search');
  searchBox.value = cl.name;
  renderContracts();
  searchBox.focus();
}

/* ================= DASHBOARD ================= */
function updateDashboard(){
  var activeContracts = 0, totalRevenue = 0, pendingRevenue = 0;
  for (var i = 0; i < contracts.length; i++){
    var c = contracts[i];
    if (c.status === STATUS.ACTIVE) activeContracts++;
    totalRevenue += parseFloat(c.amount) || 0;
    if (c.paymentStatus === PAYMENT_STATUS.PENDING || c.paymentStatus === PAYMENT_STATUS.PARTIAL) pendingRevenue += parseFloat(c.amount) || 0;
  }
  var now = new Date();
  var weekAhead = new Date(); weekAhead.setDate(now.getDate() + 7);
  var upcomingCount = 0;
  for (var i = 0; i < visits.length; i++){
    if (visits[i].status === VISIT_STATUS.SCHEDULED && new Date(visits[i].date) >= now) upcomingCount++;
  }

  document.getElementById('stat-clients').textContent = clients.length;
  document.getElementById('stat-contracts').textContent = activeContracts;
  document.getElementById('stat-visits').textContent = upcomingCount;
  document.getElementById('stat-revenue').textContent = money(totalRevenue);
  document.getElementById('stat-pending').textContent = money(pendingRevenue);

  var upcomingList = document.getElementById('upcoming-visits-list');
  var scheduled = visits.filter(function(v){
    var d = new Date(v.date);
    return v.status === VISIT_STATUS.SCHEDULED && d >= now && d <= weekAhead;
  }).sort(function(a, b){ return new Date(a.date) - new Date(b.date); });

  if (scheduled.length === 0){
    upcomingList.innerHTML = '<div class="empty">No visits in the next 7 days</div>';
  } else {
    var html = '';
    for (var i = 0; i < scheduled.length; i++){
      var visit = scheduled[i];
      var contract = contracts.find(function(c){ return c.id === visit.contractId; });
      var client = contract ? clients.find(function(cl){ return cl.id === contract.clientId; }) : null;
      html += '<div class="row-item">' +
        '<div><div class="ri-name">' + esc(client ? client.name : 'Unknown') + '</div>' +
        '<div class="ri-sub">' + new Date(visit.date).toLocaleString() + (visit.purpose ? ' &middot; ' + esc(visit.purpose) : '') + '</div></div>' +
        (client && client.phone ? '<a href="tel:' + esc(client.phone) + '" class="ri-call" aria-label="Call ' + esc(client.name) + '">📞 Call</a>' : '') +
        '</div>';
    }
    upcomingList.innerHTML = html;
  }

  var expiringList = document.getElementById('expiring-contracts-list');
  var monthAhead = new Date(); monthAhead.setDate(now.getDate() + 30);
  var expiring = contracts.filter(function(c){
    var d = new Date(c.endDate);
    return c.status === STATUS.ACTIVE && d >= now && d <= monthAhead;
  }).sort(function(a, b){ return new Date(a.endDate) - new Date(b.endDate); });

  if (expiring.length === 0){
    expiringList.innerHTML = '<div class="empty">No engagements due soon</div>';
  } else {
    var html2 = '';
    for (var i = 0; i < expiring.length; i++){
      var c = expiring[i];
      var client = clients.find(function(cl){ return cl.id === c.clientId; });
      var daysLeft = Math.ceil((new Date(c.endDate) - now) / 86400000);
      html2 += '<div class="row-item">' +
        '<div><div class="ri-name">' + esc(client ? client.name : 'Unknown') + '</div>' +
        '<div class="ri-sub">Due ' + new Date(c.endDate).toLocaleDateString() + (c.auditType ? ' &middot; ' + esc(c.auditType) : '') + '</div></div>' +
        '<span class="status-pill status-expired">' + daysLeft + ' days left</span>' +
        '</div>';
    }
    expiringList.innerHTML = html2;
  }

  checkBackupReminder();
}

/* ================= RENDER CLIENTS ================= */
function renderClients(){
  var list = document.getElementById('clients-list');
  var searchTerm = document.getElementById('client-search').value.toLowerCase();
  var filtered = clients.filter(function(c){
    return c.name.toLowerCase().indexOf(searchTerm) !== -1 || c.phone.indexOf(searchTerm) !== -1;
  });

  if (filtered.length === 0){
    list.innerHTML = '<tr><td colspan="6"><div class="empty">No clients found</div></td></tr>';
    return;
  }

  var html = '';
  for (var i = 0; i < filtered.length; i++){
    var client = filtered[i];
    var contractCount = contracts.filter(function(c){ return c.clientId === client.id; }).length;
    html += '<tr>' +
      '<td><button type="button" class="name-link" onclick="viewClientEngagements(\'' + client.id + '\')" aria-label="View engagements for ' + esc(client.name) + '">' + esc(client.name) + '</button>' + (client.pan ? '<br><span style="color:#5c5344;font-size:.78rem;">' + esc(client.pan) + '</span>' : '') + '</td>' +
      '<td>📞 <a href="tel:' + esc(client.phone) + '">' + esc(client.phone) + '</a>' + (client.email ? '<br><span style="color:#5c5344;font-size:.8rem;">✉ ' + esc(client.email) + '</span>' : '') + '</td>' +
      '<td>' + esc(client.address) + '</td>' +
      '<td><span class="status-pill status-entity" style="text-transform:capitalize;">' + esc(client.propertyType || '') + '</span></td>' +
      '<td>' + contractCount + '</td>' +
      '<td><div class="row-actions">' +
      '<button class="icon-btn" onclick="sendClientGreeting(\'' + client.id + '\')" title="Send WhatsApp greeting" aria-label="Send WhatsApp greeting to ' + esc(client.name) + '">💬</button>' +
      '<button class="icon-btn" onclick="openModal(\'client\',\'' + client.id + '\')" title="Edit client" aria-label="Edit ' + esc(client.name) + '">✎</button>' +
      '<button class="icon-btn icon-danger" onclick="deleteItem(\'client\',\'' + client.id + '\')" title="Delete client" aria-label="Delete ' + esc(client.name) + '">🗑</button>' +
      '</div></td>' +
      '</tr>';
  }
  list.innerHTML = html;
}

/* ================= RENDER CONTRACTS (ENGAGEMENTS) ================= */
function renderContracts(){
  var list = document.getElementById('contracts-list');
  var searchTerm = document.getElementById('contract-search').value.toLowerCase();
  var filterStatus = contractFilterStatus;

  var filtered = contracts.filter(function(c){
    var client = clients.find(function(cl){ return cl.id === c.clientId; });
    var matchesSearch = client && (client.name.toLowerCase().indexOf(searchTerm) !== -1 || client.phone.indexOf(searchTerm) !== -1);
    var matchesFilter = filterStatus === 'all' || c.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (filtered.length === 0){
    list.innerHTML = '<tr><td colspan="8"><div class="empty">No engagements found</div></td></tr>';
    return;
  }

  var html = '';
  for (var i = 0; i < filtered.length; i++){
    var contract = filtered[i];
    var client = clients.find(function(c){ return c.id === contract.clientId; });

    var servicesHtml = '';
    if (contract.services && contract.services.length > 0){
      for (var j = 0; j < contract.services.length; j++){
        servicesHtml += '<span class="badge">' + esc(contract.services[j]) + '</span>';
      }
    }

    var waButton = '';
    if (contract.status === 'expired'){
      waButton = '<button class="icon-btn" onclick="sendEngagementMessage(\'' + contract.id + '\',\'overdue\')" title="Send overdue reminder via WhatsApp" aria-label="Send overdue reminder to ' + esc(client ? client.name : 'client') + '">⏰</button>';
    } else if (contract.status === 'cancelled'){
      waButton = '<button class="icon-btn" onclick="sendEngagementMessage(\'' + contract.id + '\',\'completed\')" title="Send completion message via WhatsApp" aria-label="Send completion message to ' + esc(client ? client.name : 'client') + '">✅</button>';
    } else if (contract.paymentStatus === 'pending' || contract.paymentStatus === 'partial'){
      waButton = '<button class="icon-btn" onclick="sendEngagementMessage(\'' + contract.id + '\',\'payment_due\')" title="Send payment due reminder via WhatsApp" aria-label="Send payment due reminder to ' + esc(client ? client.name : 'client') + '">💰</button>';
    }

    html += '<tr>' +
      '<td><strong>' + esc(client ? client.name : 'Unknown Client') + '</strong><br><span style="color:#5c5344;font-size:.8rem;">' + esc(client ? client.phone : '') + '</span></td>' +
      '<td>' + esc(contract.auditType || '&mdash;') + '</td>' +
      '<td>' + esc(contract.fy || '') + '<br><span style="color:#5c5344;font-size:.78rem;">' + new Date(contract.startDate).toLocaleDateString() + ' &ndash; ' + new Date(contract.endDate).toLocaleDateString() + '</span></td>' +
      '<td>' + money(contract.amount) + '</td>' +
      '<td><span class="status-pill status-' + esc(contract.paymentStatus || 'pending') + '">' + esc(contract.paymentStatus || 'unknown') + '</span></td>' +
      '<td><span class="status-pill status-' + esc(contract.status) + '">' + esc(STATUS_LABELS[contract.status] || contract.status) + '</span></td>' +
      '<td>' + (servicesHtml || '<span style="color:#7c7364;">&mdash;</span>') + (contract.notes ? '<div style="font-size:.78rem;color:#5c5344;margin-top:4px;"><em>' + esc(contract.notes) + '</em></div>' : '') + '</td>' +
      '<td><div class="row-actions">' +
      waButton +
      '<button class="icon-btn" onclick="viewInvoice(\'' + contract.id + '\')" title="View invoice" aria-label="View invoice for ' + esc(client ? client.name : 'client') + '">🧾</button>' +
      '<button class="icon-btn" onclick="renewEngagement(\'' + contract.id + '\')" title="Renew for next year" aria-label="Renew engagement for ' + esc(client ? client.name : 'client') + '">🔁</button>' +
      '<button class="icon-btn" onclick="openModal(\'contract\',\'' + contract.id + '\')" title="Edit engagement" aria-label="Edit engagement for ' + esc(client ? client.name : 'client') + '">✎</button>' +
      '<button class="icon-btn icon-danger" onclick="deleteItem(\'contract\',\'' + contract.id + '\')" title="Delete engagement" aria-label="Delete engagement for ' + esc(client ? client.name : 'client') + '">🗑</button>' +
      '</div></td>' +
      '</tr>';
  }
  list.innerHTML = html;
}

/* ================= RENDER VISITS ================= */
function renderVisits(){
  var list = document.getElementById('visits-list');
  var searchTerm = document.getElementById('visit-search').value.toLowerCase();

  var filtered = visits.filter(function(v){
    var contract = contracts.find(function(c){ return c.id === v.contractId; });
    if (!contract) return false;
    var client = clients.find(function(cl){ return cl.id === contract.clientId; });
    return client && client.name.toLowerCase().indexOf(searchTerm) !== -1;
  });

  filtered.sort(function(a, b){ return new Date(b.date) - new Date(a.date); });

  if (filtered.length === 0){
    list.innerHTML = '<tr><td colspan="5"><div class="empty">No visits found</div></td></tr>';
    return;
  }

  var html = '';
  for (var i = 0; i < filtered.length; i++){
    var visit = filtered[i];
    var contract = contracts.find(function(c){ return c.id === visit.contractId; });
    var client = contract ? clients.find(function(cl){ return cl.id === contract.clientId; }) : null;
    var dt = new Date(visit.date);

    var notesHtml = '';
    if (visit.purpose) notesHtml += '<div><strong>Purpose:</strong> ' + esc(visit.purpose) + '</div>';
    if (visit.notes) notesHtml += '<div><strong>Notes:</strong> ' + esc(visit.notes) + '</div>';
    if (visit.workDone) notesHtml += '<div><strong>Observations:</strong> ' + esc(visit.workDone) + '</div>';

    html += '<tr>' +
      '<td><strong>' + esc(client ? client.name : 'Unknown Client') + '</strong></td>' +
      '<td>' + dt.toLocaleDateString() + '<br>' + dt.toLocaleTimeString() + '</td>' +
      '<td><span class="status-pill status-' + esc(visit.status) + '">' + esc(visit.status) + '</span></td>' +
      '<td style="font-size:.82rem;">' + (notesHtml || '<span style="color:#7c7364;">&mdash;</span>') + '</td>' +
      '<td><div class="row-actions">' +
      (visit.status === 'scheduled' ? '<button class="icon-btn" onclick="sendVisitReminder(\'' + visit.id + '\')" title="Send reminder via WhatsApp" aria-label="Send visit reminder to ' + esc(client ? client.name : 'client') + '">💬</button>' : '') +
      '<button class="icon-btn" onclick="openModal(\'visit\',\'' + visit.id + '\')" title="Edit visit" aria-label="Edit visit for ' + esc(client ? client.name : 'client') + '">✎</button>' +
      '<button class="icon-btn icon-danger" onclick="deleteItem(\'visit\',\'' + visit.id + '\')" title="Delete visit" aria-label="Delete visit for ' + esc(client ? client.name : 'client') + '">🗑</button>' +
      '</div></td>' +
      '</tr>';
  }
  list.innerHTML = html;
}

/* ================= INVOICE ================= */
function viewInvoice(contractId){
  var contract = contracts.find(function(c){ return c.id === contractId; });
  if (!contract) return;
  var client = clients.find(function(c){ return c.id === contract.clientId; });
  lastFocusedEl = document.activeElement;

  var servicesHtml = '';
  if (contract.services && contract.services.length > 0){
    for (var i = 0; i < contract.services.length; i++){
      servicesHtml += '<div>' + esc(contract.services[i]) + '</div>';
    }
  }

  var fee = parseFloat(contract.amount) || 0;
  var gstBlock = '';
  var totalBlock = '<div class="bill-total"><span>Total Fee</span><span>' + money(fee) + '</span></div>';
  if (business.gstEnabled){
    var rate = business.gstRate != null ? parseFloat(business.gstRate) : 18;
    if (isNaN(rate)) rate = 18;
    var gstAmt = fee * (rate / 100);
    var grandTotal = fee + gstAmt;
    gstBlock =
      '<div class="bill-items">' +
      '<div><span>Professional Fee</span><span>' + money(fee) + '</span></div>' +
      '<div><span>GST (' + rate + '%)</span><span>' + money(gstAmt) + '</span></div>' +
      '</div>';
    totalBlock = '<div class="bill-total"><span>Total Payable</span><span>' + money(grandTotal) + '</span></div>';
  }

  var html =
    '<div class="bill-card">' +
    '<div class="bill-shop">' +
    '<div class="bill-name">' + esc(business.name || 'Audit Practice Manager') + '</div>' +
    (business.address ? '<div class="bill-tag">' + esc(business.address) + '</div>' : '') +
    (business.phone ? '<div class="bill-tag">Ph: ' + esc(business.phone) + '</div>' : '') +
    (business.gst ? '<div class="bill-tag">GSTIN: ' + esc(business.gst) + '</div>' : '') +
    '</div>' +
    '<hr class="rule">' +
    '<div class="bill-meta">' +
    '<div><span>Client</span><span>' + esc(client ? client.name : 'Unknown') + '</span></div>' +
    '<div><span>Phone</span><span>' + esc(client ? client.phone : '') + '</span></div>' +
    '<div><span>Address</span><span>' + esc(client ? client.address : '') + '</span></div>' +
    (client && client.pan ? '<div><span>PAN/GSTIN</span><span>' + esc(client.pan) + '</span></div>' : '') +
    '</div>' +
    '<hr class="rule">' +
    '<div class="bill-meta">' +
    '<div><span>Audit Type</span><span>' + esc(contract.auditType || '') + '</span></div>' +
    '<div><span>Financial Year</span><span>' + esc(contract.fy || '') + '</span></div>' +
    '<div><span>Period</span><span>' + new Date(contract.startDate).toLocaleDateString() + ' - ' + new Date(contract.endDate).toLocaleDateString() + '</span></div>' +
    '</div>' +
    (servicesHtml ? '<div class="bill-items" style="margin-top:8px;">' + servicesHtml + '</div>' : '') +
    '<hr class="rule">' +
    (gstBlock ? gstBlock + '<hr class="rule">' : '') +
    totalBlock +
    '<div class="bill-meta" style="margin-top:6px;"><div><span>Payment Status</span><span>' + esc((contract.paymentStatus || 'unknown').toUpperCase()) + '</span></div></div>' +
    (contract.notes ? '<div class="bill-note">Note: ' + esc(contract.notes) + '</div>' : '') +
    '<div class="bill-note">Generated on ' + new Date().toLocaleDateString() + '</div>' +
    '</div>';

  document.getElementById('invoice-print').innerHTML = html;
  document.getElementById('invoice-modal').classList.add('active');
  setTimeout(function(){
    var closeBtn = document.querySelector('#invoice-modal .btn-ghost');
    if (closeBtn) closeBtn.focus();
  }, 30);
}
function closeInvoice(){
  document.getElementById('invoice-modal').classList.remove('active');
  if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') lastFocusedEl.focus();
}

/* ================= PIN LOCK ================= */
function isPinSet(){ return !!localStorage.getItem(PIN_KEY); }

function showLockScreenIfNeeded(){
  if (isPinSet()){
    var screen = document.getElementById('lock-screen');
    screen.style.display = 'flex';
    var input = document.getElementById('lock-pin-input');
    if (input) input.focus();
    return true;
  }
  return false;
}

function sha256Hex(str){
  try {
    if (window.crypto && window.crypto.subtle){
      var enc = new TextEncoder().encode(str);
      return crypto.subtle.digest('SHA-256', enc).then(function(buf){
        return Array.prototype.map.call(new Uint8Array(buf), function(b){ return b.toString(16).padStart(2, '0'); }).join('');
      });
    }
  } catch(e){ /* fall through to fallback below */ }
  /* Fallback for browsers/contexts without SubtleCrypto (e.g. some file:// origins).
     This is a simple obfuscation, not cryptographically secure — the PIN lock is a
     deterrent against casual access, not a substitute for full device security. */
  var out = 0;
  for (var i = 0; i < str.length; i++){ out = (out * 31 + str.charCodeAt(i)) >>> 0; }
  return Promise.resolve('fb' + out.toString(16));
}

function attemptUnlock(){
  var input = document.getElementById('lock-pin-input');
  var errorEl = document.getElementById('lock-error');
  sha256Hex(input.value).then(function(hash){
    var stored = localStorage.getItem(PIN_KEY);
    if (hash === stored){
      document.getElementById('lock-screen').style.display = 'none';
      errorEl.textContent = '';
      initApp();
    } else {
      errorEl.textContent = 'Incorrect PIN. Try again.';
      input.value = '';
      input.focus();
    }
  });
}

function renderSecurityForm(){
  var statusText = document.getElementById('security-status-text');
  var form = document.getElementById('security-form');
  if (isPinSet()){
    statusText.textContent = 'A PIN is set. The app will ask for it each time it loads.';
    form.innerHTML =
      '<div class="field"><label for="pin-current">Current PIN</label><input type="password" id="pin-current" autocomplete="off"></div>' +
      '<div class="field"><label for="pin-new">New PIN (leave blank to remove the lock)</label><input type="password" id="pin-new" autocomplete="off"></div>' +
      '<button class="btn btn-primary btn-sm" onclick="changePin()">Update</button>';
  } else {
    statusText.textContent = 'No PIN set — anyone with access to this device can open the app. Client financial data is sensitive; a PIN is recommended.';
    form.innerHTML =
      '<div class="field"><label for="pin-new-setup">Choose a PIN (4+ digits)</label><input type="password" id="pin-new-setup" autocomplete="off"></div>' +
      '<div class="field"><label for="pin-new-setup-confirm">Confirm PIN</label><input type="password" id="pin-new-setup-confirm" autocomplete="off"></div>' +
      '<button class="btn btn-primary btn-sm" onclick="setupPin()">Set PIN</button>';
  }
}

function setupPin(){
  var p1 = document.getElementById('pin-new-setup').value;
  var p2 = document.getElementById('pin-new-setup-confirm').value;
  if (p1.length < 4){ toast('PIN must be at least 4 digits', 'error'); return; }
  if (p1 !== p2){ toast('PINs do not match', 'error'); return; }
  sha256Hex(p1).then(function(hash){
    localStorage.setItem(PIN_KEY, hash);
    toast('PIN set', 'success');
    renderSecurityForm();
  });
}

function changePin(){
  var cur = document.getElementById('pin-current').value;
  var next = document.getElementById('pin-new').value;
  var stored = localStorage.getItem(PIN_KEY);
  sha256Hex(cur).then(function(curHash){
    if (curHash !== stored){ toast('Current PIN is incorrect', 'error'); return; }
    if (next === ''){
      localStorage.removeItem(PIN_KEY);
      toast('PIN removed', 'success');
      renderSecurityForm();
      return;
    }
    if (next.length < 4){ toast('New PIN must be at least 4 digits', 'error'); return; }
    sha256Hex(next).then(function(newHash){
      localStorage.setItem(PIN_KEY, newHash);
      toast('PIN updated', 'success');
      renderSecurityForm();
    });
  });
}
