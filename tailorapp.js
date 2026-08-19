/* =====================================================================
   TAILORAPP.JS
   Behavior/logic for the Tailor Order & Billing Manager app.
   Load this AFTER tailormain.js, which injects the CSS and markup
   this script queries and manipulates (via document.querySelector,
   using the element ids defined in tailormain.js's TAILOR_HTML).

   Data is stored via window.storage (shared:true) so all users of
   this artifact/app instance see the same orders, price list, shop
   settings, etc. — see the SKILL note in the storage calls below.
   ===================================================================== */

(function(){
  const DEFAULT_PRODUCTS = [
    {key:'chudidhar', label:'Chudidhar'},
    {key:'cottonBlouse', label:'Cotton Blouse'},
    {key:'cottonKotBlouse', label:'Cotton Kot. Blouse'},
    {key:'liningBlouse', label:'Lining Blouse'},
    {key:'liningKotBlouse', label:'Lining Kot. Blouse'},
    {key:'sareeFalls', label:'Saree Falls'},
  ];
  const DEFAULT_CHARGES = [
    {key:'other', label:'Other stitching'},
  ];
  const STATUSES = ['process','ready','delivered','customer_due','other'];
  const DEFAULT_SHOP = {
    phone:'98809 98255', since:'Since 1993', name:'Santi Ladies Wear',
    tag:'(Exclusive in Ladies Tailoring)',
    logo:'https://placehold.co/96x96/2b2620/f1c988?text=SLW',
    addrBlockNo:'1310', addrBlockName:'', addrRoad:'Jayanagar 9th Block', addrLandmark:'',
    addrCity:'Bengaluru', addrState:'Karnataka', addrCountry:'India', addrStateCode:'KA', addrPincode:'560069',
    thanks:'🙏 Thank you! Welcome again 🙏',
    liability:'Our liability for delivery ends 30 days after the due date.',
    hours:'Lunch 2:00–4:00 · Sunday holiday',
    deliveryNote:'Delivery timings: 5:30 PM – 8:30 PM'
  };

  const DEFAULT_PASSWORD = '1234';
  const DEFAULT_TAX = { enabled:false, rate:0, label:'GST' };
  const DEFAULT_PAYMENTS = { enabled:false, link:'' };
  const DEFAULT_CURRENCY = { symbol:'₹', position:'before' };

  let orders = [];
  let prices = {};
  let products = DEFAULT_PRODUCTS.map(p => ({...p}));
  let charges = DEFAULT_CHARGES.map(c => ({...c}));
  let shop = {...DEFAULT_SHOP};
  let tax = {...DEFAULT_TAX};
  let payments = {...DEFAULT_PAYMENTS};
  let currency = {...DEFAULT_CURRENCY};
  let settings = { password: DEFAULT_PASSWORD };
  let ordersFilter = '';
  products.forEach(p => prices[p.key] = 0);

  const $ = sel => document.querySelector(sel);
  const $$ = sel => document.querySelectorAll(sel);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const titleCase = s => String(s ?? '').replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

  function fullShopAddress(){
    return [
      shop.addrBlockNo,
      shop.addrBlockName,
      shop.addrRoad,
      shop.addrLandmark,
      shop.addrCity,
      [shop.addrState, shop.addrStateCode ? `(${shop.addrStateCode})` : ''].filter(Boolean).join(' '),
      shop.addrCountry,
      shop.addrPincode
    ].filter(Boolean).join(', ');
  }

  // ---------- icons (inline SVG, stroke uses currentColor) ----------
  const ICONS = {
    lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>`,
    unlock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.9-1"/></svg>`,
    success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-6"/></svg>`,
    error: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v5M12 16h.01"/></svg>`,
    info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-5M12 8h.01"/></svg>`,
    bill: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h9l3 3v17l-3-2-3 2-3-2-3 2V2z"/><path d="M9 7h6M9 11h6M9 15h4"/></svg>`,
    edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>`,
    trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>`,
    check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-6"/></svg>`,
    minus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/></svg>`,
    plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>`,
    upload: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>`,
  };
  const iconHtml = name => `<span class="icon" aria-hidden="true">${ICONS[name] || ''}</span>`;

  function toast(msg, type){
    type = ICONS[type] ? type : 'info';
    const t = $('#toast');
    t.className = 'toast toast-' + type;
    t.innerHTML = `${iconHtml(type)}<span>${esc(msg)}</span>`;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(()=>t.classList.remove('show'), 2600);
  }

  // ---------- custom modal (replaces window.confirm / window.prompt) ----------
  function showModal({ title, message, type='confirm', defaultValue='', confirmLabel='OK', cancelLabel='Cancel', danger=false, inputType='text' }){
    return new Promise(resolve => {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal-box" role="dialog" aria-modal="true" aria-label="${esc(title)}">
          <h3>${esc(title)}</h3>
          ${message ? `<p>${esc(message)}</p>` : ''}
          ${type === 'prompt' ? `<input type="${inputType}" id="modal-input" value="${esc(defaultValue)}">` : ''}
          <div class="modal-actions">
            <button type="button" class="modal-btn cancel" id="modal-cancel">${esc(cancelLabel)}</button>
            <button type="button" class="modal-btn confirm ${danger ? 'danger' : ''}" id="modal-confirm">${esc(confirmLabel)}</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      const input = overlay.querySelector('#modal-input');
      if(input){ input.focus(); input.select(); }
      const cleanup = (result) => { overlay.remove(); resolve(result); };
      overlay.querySelector('#modal-cancel').addEventListener('click', ()=> cleanup(type === 'prompt' ? null : false));
      overlay.querySelector('#modal-confirm').addEventListener('click', ()=> cleanup(type === 'prompt' ? (input ? input.value : '') : true));
      overlay.addEventListener('click', e => { if(e.target === overlay) cleanup(type === 'prompt' ? null : false); });
      overlay.addEventListener('keydown', e => {
        if(e.key === 'Escape') cleanup(type === 'prompt' ? null : false);
        if(e.key === 'Enter' && (e.target.id === 'modal-input' || e.target === overlay)) cleanup(type === 'prompt' ? (input ? input.value : '') : true);
      });
    });
  }
  function customConfirm(title, message, confirmLabel='Delete', danger=true){
    return showModal({ title, message, type:'confirm', confirmLabel, danger });
  }
  function customPrompt(title, message, defaultValue='', inputType='text'){
    return showModal({ title, message, type:'prompt', defaultValue, confirmLabel:'Save', inputType });
  }

  function fmtDate(d){
    d = new Date(d);
    const pad = n => String(n).padStart(2,'0');
    return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;
  }
  function addDays(d, n){
    const nd = new Date(d);
    nd.setDate(nd.getDate() + n);
    return nd;
  }
  function money(n){
    const amt = (Number(n)||0).toLocaleString('en-IN');
    const sym = currency.symbol || '₹';
    return currency.position === 'after' ? `${amt} ${sym}` : `${sym} ${amt}`;
  }

  // ---------- storage ----------
  async function loadData(){
    try{
      const o = await window.storage.get('orders', true);
      orders = o ? JSON.parse(o.value) : [];
    }catch(e){ orders = []; }
    try{
      const pr = await window.storage.get('products', true);
      products = pr ? JSON.parse(pr.value) : DEFAULT_PRODUCTS.map(p => ({...p}));
    }catch(e){ products = DEFAULT_PRODUCTS.map(p => ({...p})); }
    try{
      const p = await window.storage.get('prices', true);
      prices = p ? JSON.parse(p.value) : {};
    }catch(e){ prices = {}; }
    products.forEach(p => { if(!(p.key in prices)) prices[p.key] = 0; });
    try{
      const ch = await window.storage.get('charges', true);
      charges = ch ? JSON.parse(ch.value) : DEFAULT_CHARGES.map(c => ({...c}));
    }catch(e){ charges = DEFAULT_CHARGES.map(c => ({...c})); }
    try{
      const sh = await window.storage.get('shop', true);
      shop = sh ? {...DEFAULT_SHOP, ...JSON.parse(sh.value)} : {...DEFAULT_SHOP};
    }catch(e){ shop = {...DEFAULT_SHOP}; }
    try{
      const tx = await window.storage.get('tax', true);
      tax = tx ? {...DEFAULT_TAX, ...JSON.parse(tx.value)} : {...DEFAULT_TAX};
    }catch(e){ tax = {...DEFAULT_TAX}; }
    try{
      const pay = await window.storage.get('payments', true);
      payments = pay ? {...DEFAULT_PAYMENTS, ...JSON.parse(pay.value)} : {...DEFAULT_PAYMENTS};
    }catch(e){ payments = {...DEFAULT_PAYMENTS}; }
    try{
      const cur = await window.storage.get('currency', true);
      currency = cur ? {...DEFAULT_CURRENCY, ...JSON.parse(cur.value)} : {...DEFAULT_CURRENCY};
    }catch(e){ currency = {...DEFAULT_CURRENCY}; }
    try{
      const s = await window.storage.get('settings', true);
      settings = s ? JSON.parse(s.value) : settings;
      if(!settings || !settings.password) settings = { password: DEFAULT_PASSWORD };
    }catch(e){ settings = { password: DEFAULT_PASSWORD }; }
  }
  async function saveOrders(){
    try{ await window.storage.set('orders', JSON.stringify(orders), true); }
    catch(e){ toast('Could not save — try again.', 'error'); }
  }
  async function saveProducts(){
    try{ await window.storage.set('products', JSON.stringify(products), true); }
    catch(e){ toast('Could not save products — try again.', 'error'); }
  }
  async function saveCharges(){
    try{ await window.storage.set('charges', JSON.stringify(charges), true); }
    catch(e){ toast('Could not save charges — try again.', 'error'); }
  }
  async function savePrices(){
    try{ await window.storage.set('prices', JSON.stringify(prices), true); }
    catch(e){ toast('Could not save prices — try again.', 'error'); }
  }
  async function saveShop(){
    try{ await window.storage.set('shop', JSON.stringify(shop), true); }
    catch(e){ toast('Could not save shop details — try again.', 'error'); }
  }
  async function saveSettings(){
    try{ await window.storage.set('settings', JSON.stringify(settings), true); }
    catch(e){ toast('Could not save password — try again.', 'error'); }
  }
  async function saveTax(){
    try{ await window.storage.set('tax', JSON.stringify(tax), true); }
    catch(e){ toast('Could not save tax settings — try again.', 'error'); }
  }
  async function savePayments(){
    try{ await window.storage.set('payments', JSON.stringify(payments), true); }
    catch(e){ toast('Could not save payment settings — try again.', 'error'); }
  }
  async function saveCurrency(){
    try{ await window.storage.set('currency', JSON.stringify(currency), true); }
    catch(e){ toast('Could not save currency settings — try again.', 'error'); }
  }

  // Shared password gate — used by Price List edit, Order edit and Order delete.
  // Note: this is a shared password stored with the shop's data, meant to keep
  // casual users out, not a strong security boundary.
  async function checkPassword(actionLabel){
    const entered = await customPrompt('Password required', `Enter password to ${actionLabel}:`, '', 'password');
    if(entered === null) return false; // cancelled
    if(entered !== (settings.password || DEFAULT_PASSWORD)){
      toast('Incorrect password.', 'error');
      return false;
    }
    return true;
  }

  // ---------- navigation ----------
  $$('#nav button').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      $$('#nav button').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      $$('.view').forEach(v=>v.style.display='none');
      $('#view-' + btn.dataset.view).style.display='block';
      if(btn.dataset.view === 'dashboard') renderDashboard();
      if(btn.dataset.view === 'orders') renderOrders();
      if(btn.dataset.view === 'dues') renderDues();
      if(btn.dataset.view === 'settings'){ renderSettingsForm(); renderPaymentsForm(); }
      if(btn.dataset.view === 'prices') renderTaxForm();
      if(btn.dataset.view === 'analytics') renderAnalytics();
      if(btn.dataset.view === 'order') updateTaxCheckboxUI();
    });
  });

  // ---------- new order / edit order ----------
  function renderOrderQtyGrid(){
    const grid = $('#order-qty-grid');
    grid.innerHTML = products.map(p => `
      <div class="field"><label>${esc(p.label)} (qty)</label><input class="order-live-input" id="q-${p.key}" type="number" min="0" value="0"></div>
    `).join('');
    wireOrderLiveInputs();
  }

  function renderOrderChargesGrid(){
    const grid = $('#order-charges-grid');
    const title = $('#order-charges-title');
    if(!charges.length){
      grid.innerHTML = '';
      title.style.display = 'none';
      return;
    }
    title.style.display = 'block';
    grid.innerHTML = charges.map(c => `
      <div class="field"><label>${esc(c.label)} (₹)</label><input class="order-live-input" id="c-${c.key}" type="number" min="0" value="0" placeholder="0"></div>
    `).join('');
    wireOrderLiveInputs();
  }

  function wireOrderLiveInputs(){
    $$('.order-live-input').forEach(inp => inp.removeEventListener('input', updateOrderSummary));
    $$('.order-live-input').forEach(inp => inp.addEventListener('input', updateOrderSummary));
  }

  function updateTaxCheckboxUI(){
    const row = $('#f-tax-row');
    if(tax.enabled){
      row.style.display = 'flex';
      $('#f-tax-label').textContent = `Apply ${tax.label || 'tax'} (${tax.rate || 0}%)`;
    } else {
      row.style.display = 'none';
      $('#f-tax').checked = false;
    }
    updateOrderSummary();
  }

  // Live totals box on the order form — mirrors calcOrderTotals() but reads straight from the inputs.
  function updateOrderSummary(){
    const workTotal = products.reduce((sum,p)=>{
      const el = $('#q-' + p.key);
      return sum + (prices[p.key]||0) * (el ? Number(el.value)||0 : 0);
    }, 0);
    const chargesTotal = charges.reduce((sum,c)=>{
      const el = $('#c-' + c.key);
      return sum + (el ? Number(el.value)||0 : 0);
    }, 0);
    const subtotal = workTotal + chargesTotal;
    const rawDiscount = Number($('#f-discount').value) || 0;
    const discount = Math.min(rawDiscount, subtotal);
    const pretax = subtotal - discount;
    const applyTax = tax.enabled && $('#f-tax').checked;
    const taxAmount = applyTax ? Math.round(pretax * (Number(tax.rate)||0)) / 100 : 0;
    const estimated = pretax + taxAmount;

    const itemCount = products.reduce((n,p)=>{ const el = $('#q-'+p.key); return n + (el ? Number(el.value)||0 : 0); }, 0);
    $('#sum-count-label').textContent = `Subtotal (${itemCount} item${itemCount===1?'':'s'})`;
    $('#sum-subtotal').textContent = money(subtotal);
    if(discount > 0){
      $('#sum-discount-row').style.display = 'flex';
      $('#sum-discount').textContent = '− ' + money(discount);
    } else {
      $('#sum-discount-row').style.display = 'none';
    }
    if(applyTax && taxAmount > 0){
      $('#sum-tax-row').style.display = 'flex';
      $('#sum-tax-label').textContent = `${tax.label || 'Tax'} (${tax.rate || 0}%)`;
      $('#sum-tax').textContent = money(taxAmount);
    } else {
      $('#sum-tax-row').style.display = 'none';
    }
    $('#sum-estimated').textContent = money(estimated);
  }

  function defaultDeliveryDateStr(fromDate){
    return addDays(fromDate || new Date(), 10).toISOString().slice(0,10);
  }

  function resetOrderForm(){
    $('#f-edit-id').value = '';
    $('#order-form-title').textContent = 'New Order';
    $('#order-form-sub').textContent = 'Enter customer and stitching details. An order number is assigned automatically.';
    $('#order-submit-btn').textContent = 'Save order';
    $('#order-cancel-edit-btn').style.display = 'none';
    $('#order-form').reset();
    renderOrderQtyGrid();
    renderOrderChargesGrid();
    $('#f-discount').value = 0; $('#f-advance').value = 0;
    $('#f-delivery').value = defaultDeliveryDateStr();
    $('#f-notes').value = '';
    $('#customer-hint').style.display = 'none';
    updateTaxCheckboxUI();
  }

  function loadOrderIntoForm(order){
    $('#f-edit-id').value = order.id;
    $('#f-name').value = order.name;
    $('#f-mobile').value = order.mobile;
    renderOrderQtyGrid();
    renderOrderChargesGrid();
    products.forEach(p => { const el = $('#q-' + p.key); if(el) el.value = (order.qty && order.qty[p.key]) || 0; });
    charges.forEach(c => {
      const el = $('#c-' + c.key);
      if(!el) return;
      // 'other' keeps backward compatibility with older orders saved before Charges existed.
      const val = (order.charges && order.charges[c.key] != null) ? order.charges[c.key] : (c.key === 'other' ? (order.other || 0) : 0);
      el.value = val;
    });
    $('#f-discount').value = order.discount || 0;
    $('#f-advance').value = order.advance || 0;
    $('#f-delivery').value = order.deliveryDate ? order.deliveryDate.slice(0,10) : defaultDeliveryDateStr(order.date);
    $('#f-notes').value = order.notes || '';
    updateTaxCheckboxUI();
    $('#f-tax').checked = !!order.applyTax;
    $('#order-form-title').textContent = `Edit Order #${String(order.id).padStart(4,'0')}`;
    $('#order-form-sub').textContent = 'Update customer and stitching details, then save.';
    $('#order-submit-btn').textContent = 'Save changes';
    $('#order-cancel-edit-btn').style.display = 'inline-flex';
    $('#customer-hint').style.display = 'none';
    updateOrderSummary();
  }

  // Customer autocomplete: when the mobile number matches a past customer, offer to fill in the name.
  $('#f-mobile').addEventListener('input', ()=>{
    if($('#f-edit-id').value) return; // don't autofill while editing an existing order
    const digits = $('#f-mobile').value.replace(/\D/g,'');
    const hint = $('#customer-hint');
    if(digits.length < 10){ hint.style.display = 'none'; return; }
    const match = [...orders].reverse().find(o => (o.mobile || '').replace(/\D/g,'') === digits);
    if(match){
      if(!$('#f-name').value.trim()) $('#f-name').value = match.name;
      hint.textContent = `Existing customer — ${match.name}, last order #${String(match.id).padStart(4,'0')} (${fmtDate(match.date)}).`;
      hint.style.display = 'block';
    } else {
      hint.style.display = 'none';
    }
  });

  $('#f-discount').addEventListener('input', updateOrderSummary);
  $('#f-tax').addEventListener('change', updateOrderSummary);

  $('#order-cancel-edit-btn').addEventListener('click', ()=>{
    resetOrderForm();
    toast('Edit cancelled.', 'info');
  });

  function goToNewOrderView(){
    $$('#nav button').forEach(b=>b.classList.remove('active'));
    $('#nav button[data-view="order"]').classList.add('active');
    $$('.view').forEach(v=>v.style.display='none');
    $('#view-order').style.display='block';
  }

  $('#order-form').addEventListener('submit', async e => {
    e.preventDefault();
    const name = $('#f-name').value.trim();
    const mobile = $('#f-mobile').value.trim();
    if(!name || !mobile){ toast('Name and mobile are required.', 'error'); return; }
    const mobileDigits = mobile.replace(/\D/g,'');
    if(mobileDigits.length !== 10){ toast('Mobile number should be 10 digits.', 'error'); return; }

    const qty = {};
    products.forEach(p => qty[p.key] = Number($('#q-' + p.key).value) || 0);
    const chargeAmounts = {};
    charges.forEach(c => chargeAmounts[c.key] = Number($('#c-' + c.key).value) || 0);
    const discount = Number($('#f-discount').value) || 0;
    const advance = Number($('#f-advance').value) || 0;
    const deliveryDate = $('#f-delivery').value || defaultDeliveryDateStr();
    const notes = $('#f-notes').value.trim();
    const applyTax = tax.enabled && $('#f-tax').checked;

    const editId = $('#f-edit-id').value;
    if(editId){
      const order = orders.find(o => o.id === Number(editId));
      if(!order){ toast('Order not found.', 'error'); resetOrderForm(); return; }
      order.name = name; order.mobile = mobile;
      order.qty = qty; order.charges = chargeAmounts; order.discount = discount; order.advance = advance;
      order.deliveryDate = deliveryDate; order.notes = notes; order.applyTax = applyTax;
      delete order.other; // superseded by order.charges.other
      await saveOrders();
      toast(`Updated — Order #${String(order.id).padStart(4,'0')}`, 'success');
      resetOrderForm();
      renderOrders();
      return;
    }

    const nextId = orders.length ? Math.max(...orders.map(o=>o.id)) + 1 : 1;
    const order = {
      id: nextId,
      date: new Date().toISOString(),
      name, mobile, qty, charges: chargeAmounts, discount, advance, deliveryDate, notes, applyTax,
      status: ''
    };
    orders.push(order);
    await saveOrders();
    toast(`Saved — Order #${String(nextId).padStart(4,'0')}`, 'success');
    resetOrderForm();
  });

  // ---------- orders table ----------
  function statusLabel(s){ return s ? s.replace('_',' ') : 'new'; }
  function statusClass(s){ return 'status-' + (s || 'new'); }

  function orderDeliveryDate(o){
    return o.deliveryDate ? new Date(o.deliveryDate) : addDays(o.date, 10);
  }
  function calcOrderTotals(o){
    const workTotal = products.reduce((sum,p)=> sum + (prices[p.key]||0) * ((o.qty && o.qty[p.key]) || 0), 0);
    // order.other is kept only for orders saved before Charges existed.
    const chargesTotal = Number(o.other||0) + Object.values(o.charges || {}).reduce((s,v)=> s + (Number(v)||0), 0);
    const subtotal = workTotal + chargesTotal;
    const discount = Math.min(Number(o.discount||0), subtotal);
    const pretax = subtotal - discount;
    const taxAmount = (tax.enabled && o.applyTax) ? Math.round(pretax * (Number(tax.rate)||0)) / 100 : 0;
    const grandTotal = pretax + taxAmount;
    const balance = grandTotal - Number(o.advance||0);
    return { subtotal, discount, pretax, taxAmount, grandTotal, balance };
  }
  function isOverdue(o){
    if(o.status === 'delivered') return false;
    return orderDeliveryDate(o) < new Date(new Date().toDateString());
  }

  function renderFilterRow(){
    const row = $('#orders-filter-row');
    const defs = [
      {id:'all', label:'All'},
      {id:'new', label:'New'},
      ...STATUSES.map(s=>({id:s, label:s.replace('_',' ')}))
    ];
    row.innerHTML = defs.map(d=>`<button type="button" class="filter-chip ${(ordersFilter||'all')===d.id?'active':''}" data-filter="${d.id}" aria-label="Filter orders by status: ${esc(d.label)}">${esc(d.label)}</button>`).join('');
    row.querySelectorAll('.filter-chip').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        ordersFilter = btn.dataset.filter === 'all' ? '' : btn.dataset.filter;
        renderOrders();
      });
    });
  }

  function renderOrders(){
    renderFilterRow();
    const tbody = $('#orders-tbody');
    tbody.innerHTML = '';
    if(!orders.length){
      $('#orders-empty').style.display = 'block';
      $('#orders-empty').textContent = 'No orders yet — save one from "New Order".';
      return;
    }

    const q = ($('#orders-search').value || '').trim().toLowerCase();
    let list = [...orders].reverse();
    if(ordersFilter === 'new'){
      list = list.filter(o => !o.status);
    } else if(ordersFilter){
      list = list.filter(o => o.status === ordersFilter);
    }
    if(q){
      list = list.filter(o =>
        o.name.toLowerCase().includes(q) ||
        o.mobile.toLowerCase().includes(q) ||
        String(o.id).padStart(4,'0').includes(q) ||
        String(o.id).includes(q)
      );
    }

    if(!list.length){
      $('#orders-empty').style.display = 'block';
      $('#orders-empty').textContent = 'No orders match your search.';
      return;
    }
    $('#orders-empty').style.display = 'none';
    list.forEach(o => {
      const { balance } = calcOrderTotals(o);
      const overdue = isOverdue(o);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="id-mono">#${String(o.id).padStart(4,'0')}</td>
        <td>${fmtDate(o.date)}</td>
        <td class="${overdue ? 'overdue' : ''}">${fmtDate(orderDeliveryDate(o))}</td>
        <td>${esc(o.name)}</td>
        <td>${esc(o.mobile)}</td>
        <td class="${balance > 0 ? 'balance-due' : 'balance-zero'}">${money(balance)}</td>
        <td>
          <select class="status-select ${statusClass(o.status)}" data-id="${o.id}" aria-label="Change status for order #${String(o.id).padStart(4,'0')}">
            <option value="">New</option>
            ${STATUSES.map(s=>`<option value="${s}" ${o.status===s?'selected':''}>${s.replace('_',' ')}</option>`).join('')}
          </select>
        </td>
        <td class="row-actions" style="white-space:nowrap; display:flex; gap:6px;">
          <button class="btn btn-ghost" data-bill="${o.id}" aria-label="View bill for order #${String(o.id).padStart(4,'0')}" title="View bill">${iconHtml('bill')}Bill</button>
          <button class="btn btn-ghost" data-edit="${o.id}" aria-label="Edit order #${String(o.id).padStart(4,'0')}" title="Edit">${iconHtml('edit')}Edit</button>
          ${balance > 0 ? `<button class="btn btn-ghost btn-paid" data-paid="${o.id}" aria-label="Mark order #${String(o.id).padStart(4,'0')} as fully paid" title="Mark as paid">${iconHtml('check')}Paid</button>` : ''}
          <button class="btn btn-ghost" data-delete="${o.id}" aria-label="Delete order #${String(o.id).padStart(4,'0')}" title="Delete">${iconHtml('trash')}Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.status-select').forEach(sel=>{
      sel.addEventListener('change', async ()=>{
        const id = Number(sel.dataset.id);
        const order = orders.find(o=>o.id===id);
        if(order){
          order.status = sel.value;
          sel.className = 'status-select ' + statusClass(order.status);
          await saveOrders();
          toast(`Status updated for #${String(id).padStart(4,'0')}`, 'success');
        }
      });
    });
    tbody.querySelectorAll('[data-bill]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        $$('#nav button').forEach(b=>b.classList.remove('active'));
        $('#nav button[data-view="bill"]').classList.add('active');
        $$('.view').forEach(v=>v.style.display='none');
        $('#view-bill').style.display='block';
        $('#bill-lookup').value = String(btn.dataset.bill).padStart(4,'0');
        showBill(Number(btn.dataset.bill));
      });
    });
    tbody.querySelectorAll('[data-edit]').forEach(btn=>{
      btn.addEventListener('click', async ()=>{
        const id = Number(btn.dataset.edit);
        const order = orders.find(o=>o.id===id);
        if(!order) return;
        if(!await checkPassword(`edit order #${String(id).padStart(4,'0')}`)) return;
        goToNewOrderView();
        loadOrderIntoForm(order);
      });
    });
    tbody.querySelectorAll('[data-paid]').forEach(btn=>{
      btn.addEventListener('click', async ()=>{
        const id = Number(btn.dataset.paid);
        const order = orders.find(o=>o.id===id);
        if(!order) return;
        const { subtotal } = calcOrderTotals(order);
        const ok = await customConfirm('Mark as paid', `Mark order #${String(id).padStart(4,'0')} as fully paid (advance = ${money(subtotal)})?`, 'Mark paid', false);
        if(!ok) return;
        order.advance = subtotal;
        await saveOrders();
        toast(`Order #${String(id).padStart(4,'0')} marked as paid.`, 'success');
        renderOrders();
      });
    });
    tbody.querySelectorAll('[data-delete]').forEach(btn=>{
      btn.addEventListener('click', async ()=>{
        const id = Number(btn.dataset.delete);
        const order = orders.find(o=>o.id===id);
        if(!order) return;
        if(!await checkPassword(`delete order #${String(id).padStart(4,'0')}`)) return;
        const ok = await customConfirm('Delete order', `Delete order #${String(id).padStart(4,'0')} for ${order.name}? This cannot be undone.`, 'Delete');
        if(!ok) return;
        orders = orders.filter(o=>o.id!==id);
        await saveOrders();
        toast(`Deleted order #${String(id).padStart(4,'0')}`, 'success');
        renderOrders();
      });
    });
  }

  $('#orders-search').addEventListener('input', renderOrders);

  // ---------- CSV export ----------
  function toCsvField(v){
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
  }
  $('#orders-export-btn').addEventListener('click', ()=>{
    if(!orders.length){ toast('No orders to export.', 'info'); return; }
    const cols = ['Order #','Order Date','Delivery Date','Customer','Mobile',
      ...products.map(p=>p.label), ...charges.map(c=>c.label),
      'Discount (₹)','Subtotal (₹)','Advance (₹)','Balance (₹)','Status','Notes'];
    const rows = [...orders].sort((a,b)=>a.id-b.id).map(o=>{
      const { subtotal, discount, balance } = calcOrderTotals(o);
      return [
        String(o.id).padStart(4,'0'), fmtDate(o.date), fmtDate(orderDeliveryDate(o)),
        o.name, o.mobile,
        ...products.map(p=> (o.qty && o.qty[p.key]) || 0),
        ...charges.map(c=> (o.charges && o.charges[c.key]) || (c.key==='other' ? (o.other||0) : 0)),
        discount, subtotal, o.advance || 0, balance,
        statusLabel(o.status), o.notes || ''
      ];
    });
    const csv = [cols, ...rows].map(r => r.map(toCsvField).join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `santi-ledger-orders-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    toast('Orders exported.', 'success');
  });

  // ---------- dues ----------
  function renderDues(){
    const tbody = $('#dues-tbody');
    tbody.innerHTML = '';
    let list = orders
      .map(o => ({ o, ...calcOrderTotals(o) }))
      .filter(x => x.balance > 0 || x.o.status === 'customer_due')
      .sort((a,b) => orderDeliveryDate(a.o) - orderDeliveryDate(b.o));

    if(!list.length){
      $('#dues-empty').style.display = 'block';
      return;
    }
    $('#dues-empty').style.display = 'none';
    list.forEach(({o, balance}) => {
      const overdue = isOverdue(o);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="id-mono">#${String(o.id).padStart(4,'0')}</td>
        <td>${esc(o.name)}</td>
        <td>${esc(o.mobile)}</td>
        <td class="${overdue ? 'overdue' : ''}">${fmtDate(orderDeliveryDate(o))}</td>
        <td class="balance-due">${money(balance)}</td>
        <td><span class="status-pill ${statusClass(o.status)}">${statusLabel(o.status)}</span></td>
        <td class="row-actions" style="white-space:nowrap; display:flex; gap:6px;">
          <button class="btn btn-ghost" data-bill="${o.id}" aria-label="View bill for order #${String(o.id).padStart(4,'0')}" title="View bill">${iconHtml('bill')}Bill</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
    tbody.querySelectorAll('[data-bill]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        $$('#nav button').forEach(b=>b.classList.remove('active'));
        $('#nav button[data-view="bill"]').classList.add('active');
        $$('.view').forEach(v=>v.style.display='none');
        $('#view-bill').style.display='block';
        $('#bill-lookup').value = String(btn.dataset.bill).padStart(4,'0');
        showBill(Number(btn.dataset.bill));
      });
    });
  }

  // ---------- bill ----------
  function showBill(id){
    const order = orders.find(o => o.id === id || String(o.id).padStart(4,'0') === String(id).padStart(4,'0'));
    const result = $('#bill-result');
    if(!order){
      result.innerHTML = `<p class="empty">Order #${esc(id)} not found. Check the number and try again.</p>`;
      $('#bill-print-btn').style.display = 'none';
      $('#bill-download-btn').style.display = 'none';
      $('#bill-whatsapp-btn').style.display = 'none';
      $('#bill-payment-btn').style.display = 'none';
      return;
    }
    const lineItems = products
      .filter(p => order.qty && order.qty[p.key] > 0)
      .map(p => {
        const rate = prices[p.key] || 0;
        const lineTotal = rate * order.qty[p.key];
        return `<div><span>${esc(p.label)} × ${order.qty[p.key]}</span><span class="item-price">${money(lineTotal)}</span></div>`;
      }).join('');

    const chargeLines = charges
      .filter(c => order.charges && Number(order.charges[c.key]) > 0)
      .map(c => `<div><span>${esc(c.label)}</span><span class="item-price">${money(order.charges[c.key])}</span></div>`)
      .join('');
    const legacyOtherLine = (!order.charges && order.other) ? `<div><span>Other stitching</span><span class="item-price">${money(order.other)}</span></div>` : '';

    const { subtotal, discount, taxAmount, balance } = calcOrderTotals(order);
    const delivery = orderDeliveryDate(order);

    const waItems = products
      .filter(p => order.qty && order.qty[p.key] > 0)
      .map(p => `${p.label} x${order.qty[p.key]} - ${money((prices[p.key]||0) * order.qty[p.key])}`)
      .join('\n');
    const waCharges = charges
      .filter(c => order.charges && Number(order.charges[c.key]) > 0)
      .map(c => `${c.label} - ${money(order.charges[c.key])}`)
      .join('\n');
    const waMessage = [
      `*${shop.name}*`,
      `Bill #${String(order.id).padStart(4,'0')} | ${fmtDate(order.date)}`,
      `Name: ${order.name}`,
      '',
      waItems || 'No stitching items on this order',
      waCharges,
      (!order.charges && order.other) ? `Other stitching - ${money(order.other)}` : '',
      discount ? `Discount (-) - ${money(discount)}` : '',
      tax.enabled && taxAmount ? `${tax.label || 'Tax'} (${tax.rate}%) - ${money(taxAmount)}` : '',
      order.advance ? `Advance (-) - ${money(order.advance)}` : '',
      order.notes ? `Notes: ${order.notes}` : '',
      '',
      `*Balance due: ${money(balance)}*`,
      `Delivery date: ${fmtDate(delivery)}`,
      '',
      shop.thanks
    ].filter(Boolean).join('\n');

    result.innerHTML = `
      <div class="bill-card">
        <div class="bill-shop">
          <span class="bill-phone">${esc(shop.phone)}</span>
          <span class="bill-since">${esc(shop.since)}</span>
          <div class="bill-name">${esc(shop.name)}</div>
          <div class="bill-tag">${esc(shop.tag)}</div>
          <div class="bill-addr">${esc(fullShopAddress())}</div>
        </div>
        <hr class="rule">
        <div class="bill-meta">
          <div><span>Bill date</span><span>${fmtDate(order.date)}</span></div>
          <div><span>Bill no</span><span>#${String(order.id).padStart(4,'0')}</span></div>
          <div><span>Name</span><span>${esc(order.name)}</span></div>
          <div><span>Mobile</span><span>${esc(order.mobile)}</span></div>
          <div><span>Delivery date</span><span>${fmtDate(delivery)}</span></div>
        </div>
        <hr class="rule">
        <div class="bill-items">
          ${lineItems || '<div><span>No stitching items on this order</span></div>'}
          ${chargeLines}
          ${legacyOtherLine}
          ${discount ? `<div><span>Discount (–)</span><span class="item-price">−${money(discount)}</span></div>` : ''}
          ${tax.enabled && taxAmount ? `<div><span>${esc(tax.label || 'Tax')} (${tax.rate}%)</span><span class="item-price">${money(taxAmount)}</span></div>` : ''}
          ${order.advance ? `<div><span>Advance (–)</span><span class="item-price">−${money(order.advance)}</span></div>` : ''}
        </div>
        <hr class="rule">
        <div class="bill-total"><span>Balance due</span><span>${money(balance)}</span></div>
        ${order.notes ? `<div class="bill-note" style="text-align:left;">Note: ${esc(order.notes)}</div>` : ''}
        <div class="bill-thanks">${esc(shop.thanks)}</div>
        <div class="bill-note">
          ${esc(shop.liability)}<br>
          ${esc(shop.hours)}<br>
          ${esc(shop.deliveryNote)}<br>
          Powered by WAGS
        </div>
      </div>
    `;
    $('#bill-print-btn').style.display = 'inline-flex';
    $('#bill-download-btn').style.display = 'inline-flex';
    $('#bill-download-btn').dataset.orderId = String(order.id).padStart(4,'0');
    $('#bill-whatsapp-btn').style.display = 'inline-flex';
    $('#bill-whatsapp-btn').dataset.orderId = String(order.id).padStart(4,'0');
    $('#bill-whatsapp-btn').dataset.mobile = order.mobile || '';
    $('#bill-whatsapp-btn').dataset.message = waMessage;
    // set the href up-front so the anchor works even if JS below can't run for some reason
    const digitsInit = (order.mobile || '').replace(/\D/g,'');
    const waNumberInit = digitsInit.length === 10 ? '91' + digitsInit : digitsInit;
    $('#bill-whatsapp-btn').href = waNumberInit
      ? `https://wa.me/${waNumberInit}?text=${encodeURIComponent(waMessage)}`
      : `https://wa.me/?text=${encodeURIComponent(waMessage)}`;

    // Payment button — only shown when payments are enabled and a link is configured.
    if(payments.enabled && payments.link){
      $('#bill-payment-btn').style.display = 'inline-flex';
      $('#bill-payment-btn').href = payments.link;
    } else {
      $('#bill-payment-btn').style.display = 'none';
    }
  }

  $('#bill-find-btn').addEventListener('click', ()=>{
    const val = $('#bill-lookup').value.trim();
    if(!val){ toast('Enter an order number.', 'error'); return; }
    showBill(Number(val));
  });
  $('#bill-lookup').addEventListener('keydown', e=>{
    if(e.key === 'Enter'){ e.preventDefault(); $('#bill-find-btn').click(); }
  });
  $('#bill-print-btn').addEventListener('click', ()=> window.print());

  $('#bill-whatsapp-btn').addEventListener('click', async (e)=>{
    const card = $('#bill-result .bill-card');
    const btn = $('#bill-whatsapp-btn');
    if(!card){ e.preventDefault(); toast('Find a bill first.', 'error'); return; }

    // The anchor's href is already a working wa.me link (set in showBill), so if we
    // can't do anything smarter, we just let the browser follow it natively —
    // that's the most reliable path and can't be blocked by popup blockers.
    if(!(navigator.share && navigator.canShare && typeof html2canvas !== 'undefined')){
      return; // default anchor navigation proceeds
    }

    // Native share is available — try attaching the actual bill image instead.
    e.preventDefault();
    const message = btn.dataset.message || '';
    const linkUrl = btn.href;
    btn.classList.add('is-loading');
    try{
      const canvas = await html2canvas(card, { backgroundColor:'#faf6ec', scale:2 });
      const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
      const file = blob ? new File([blob], `bill-${btn.dataset.orderId || 'order'}.png`, { type:'image/png' }) : null;
      if(file && navigator.canShare({ files:[file] })){
        btn.classList.remove('is-loading');
        await navigator.share({ files:[file], text: message, title:'Bill' });
        toast('Bill shared.', 'success');
        return;
      }
    }catch(err){
      btn.classList.remove('is-loading');
      if(err && err.name === 'AbortError') return; // user cancelled share
      // otherwise fall through to opening the link below
    }
    btn.classList.remove('is-loading');
    window.open(linkUrl, '_blank', 'noopener');
    toast('Opened WhatsApp — attach the downloaded bill image if needed.', 'info');
  });

  $('#bill-download-btn').addEventListener('click', async ()=>{
    const card = $('#bill-result .bill-card');
    if(!card){ toast('Find a bill first.', 'error'); return; }
    if(typeof html2canvas === 'undefined'){ toast('Download tool failed to load.', 'error'); return; }
    const btn = $('#bill-download-btn');
    const origText = btn.textContent;
    btn.textContent = 'Preparing…';
    try{
      const canvas = await html2canvas(card, {
        backgroundColor: '#faf6ec',
        scale: 2
      });
      const link = document.createElement('a');
      link.download = `bill-${btn.dataset.orderId || 'order'}.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }catch(e){
      toast('Could not create image — try again.', 'error');
    }finally{
      btn.textContent = origText;
    }
  });

  // ---------- dashboard ----------
  function renderDashboard(){
    const now = new Date();
    const startOfToday = new Date(now.toDateString());
    const weekAhead = addDays(startOfToday, 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totals = orders.map(o => ({ o, ...calcOrderTotals(o) }));
    const newOrProcess = orders.filter(o => !o.status || o.status === 'process').length;
    const ready = orders.filter(o => o.status === 'ready').length;
    const overdueCount = orders.filter(o => isOverdue(o)).length;
    const pendingDues = totals.filter(t => t.balance > 0).reduce((s,t) => s + t.balance, 0);
    const monthOrders = totals.filter(t => new Date(t.o.date) >= startOfMonth);
    const monthRevenue = monthOrders.reduce((s,t) => s + t.grandTotal, 0);

    const stats = [
      { label:'Total Orders', value: orders.length },
      { label:'New / In Process', value: newOrProcess },
      { label:'Ready for Pickup', value: ready, accent:'teal' },
      { label:'Overdue', value: overdueCount, accent: overdueCount ? 'red' : '' },
      { label:'Pending Dues', value: money(pendingDues), accent: pendingDues ? 'red' : '' },
      { label:"This Month's Revenue", value: money(monthRevenue), accent:'marigold' },
    ];
    $('#dash-stats').innerHTML = stats.map(s => `
      <div class="stat-card ${s.accent ? 'accent-'+s.accent : ''}">
        <div class="stat-label">${esc(s.label)}</div>
        <div class="stat-value">${s.value}</div>
      </div>
    `).join('');

    const dueSoon = orders
      .filter(o => o.status !== 'delivered' && orderDeliveryDate(o) < weekAhead)
      .sort((a,b) => orderDeliveryDate(a) - orderDeliveryDate(b))
      .slice(0, 8);
    $('#dash-deliveries').innerHTML = dueSoon.length
      ? dueSoon.map(o => `
          <li>
            <span>#${String(o.id).padStart(4,'0')} — ${esc(o.name)}</span>
            <span class="${isOverdue(o) ? 'overdue' : ''}">${fmtDate(orderDeliveryDate(o))}</span>
          </li>
        `).join('')
      : `<li style="border-bottom:none; color:#948a7b;">Nothing due in the next 7 days.</li>`;

    const recent = [...orders].reverse().slice(0, 6);
    $('#dash-recent').innerHTML = recent.length
      ? recent.map(o => {
          const { balance } = calcOrderTotals(o);
          return `
            <li>
              <span>#${String(o.id).padStart(4,'0')} — ${esc(o.name)}</span>
              <span class="${balance > 0 ? 'balance-due' : 'balance-zero'}">${money(balance)}</span>
            </li>
          `;
        }).join('')
      : `<li style="border-bottom:none; color:#948a7b;">No orders yet.</li>`;
  }

  // shared helper for the three password-gated sections (tax, prices, settings)
  function setLockUI(toggleId, statusId, locked, lockedMsg, unlockedMsg){
    const toggle = $('#'+toggleId);
    if(toggle) toggle.checked = !locked;
    $('#'+statusId).innerHTML = `${iconHtml(locked ? 'lock' : 'unlock')}<span>${esc(locked ? lockedMsg : unlockedMsg)}</span>`;
  }

  // ---------- currency ----------
  let currencyUnlocked = false;

  function renderCurrencyForm(){
    $('#currency-symbol').value = currency.symbol || '₹';
    $('#currency-position').value = currency.position || 'before';
    setCurrencyLocked(!currencyUnlocked);
  }
  function setCurrencyLocked(locked){
    currencyUnlocked = !locked;
    $$('#currency-form input, #currency-form select').forEach(el => el.disabled = locked);
    $('#currency-save-btn').disabled = locked;
    setLockUI('currency-unlock-toggle', 'currency-lock-status', locked,
      'Locked — unlock with password to edit.',
      'Unlocked — applies everywhere in the app and on bills.');
  }
  $('#currency-unlock-toggle').addEventListener('change', async (e)=>{
    if(e.target.checked){
      if(!await checkPassword('unlock currency settings')){ e.target.checked = false; return; }
      setCurrencyLocked(false);
      toast('Currency settings unlocked.', 'info');
    } else {
      setCurrencyLocked(true);
    }
  });
  $('#currency-form').addEventListener('submit', async e=>{
    e.preventDefault();
    if(!currencyUnlocked){ toast('Unlock currency settings first.', 'error'); return; }
    currency = {
      symbol: $('#currency-symbol').value.trim() || '₹',
      position: $('#currency-position').value === 'after' ? 'after' : 'before'
    };
    await saveCurrency();
    setCurrencyLocked(true);
    renderOrders();
    toast('Currency settings saved.', 'success');
  });

  // ---------- tax ----------
  let taxUnlocked = false;

  function renderTaxForm(){
    renderCurrencyForm();
    $('#tax-rate').value = tax.rate || 0;
    $('#tax-label').value = tax.label || 'GST';
    $('#tax-enabled').value = tax.enabled ? 'yes' : 'no';
    setTaxLocked(!taxUnlocked);
    renderChargesList();
  }
  function setTaxLocked(locked){
    taxUnlocked = !locked;
    $$('#tax-form input, #tax-form select').forEach(el => el.disabled = locked);
    $('#tax-save-btn').disabled = locked;
    setLockUI('tax-unlock-toggle', 'tax-lock-status', locked,
      'Locked — unlock with password to edit.',
      'Unlocked — staff can now tick "Apply tax" per order.');
  }
  $('#tax-unlock-toggle').addEventListener('change', async (e)=>{
    if(e.target.checked){
      if(!await checkPassword('unlock tax settings')){ e.target.checked = false; return; }
      setTaxLocked(false);
      toast('Tax settings unlocked.', 'info');
    } else {
      setTaxLocked(true);
    }
  });
  $('#tax-form').addEventListener('submit', async e=>{
    e.preventDefault();
    if(!taxUnlocked){ toast('Unlock tax settings first.', 'error'); return; }
    tax = {
      rate: Number($('#tax-rate').value) || 0,
      label: $('#tax-label').value.trim() || 'GST',
      enabled: $('#tax-enabled').value === 'yes'
    };
    await saveTax();
    setTaxLocked(true);
    toast('Tax settings saved.', 'success');
  });

  // ---------- prices ----------
  let pricesUnlocked = false;

  function slugify(label){
    let key = label.trim().replace(/[^a-zA-Z0-9]+/g,' ').trim()
      .split(' ').map((w,i)=> i===0 ? w.toLowerCase() : w.charAt(0).toUpperCase()+w.slice(1).toLowerCase())
      .join('');
    if(!key) key = 'item';
    let unique = key, n = 1;
    while(products.some(p => p.key === unique)) unique = key + (++n);
    return unique;
  }

  function renderPricesForm(){
    const grid = $('#prices-grid');
    grid.innerHTML = products.map(p => `
      <div class="product-card">
        <div class="product-card-head">
          <span class="prod-title">${esc(p.label)}</span>
          <span class="no-print" data-editctrls="${p.key}" style="display:${pricesUnlocked?'inline-flex':'none'}; gap:2px;">
            <button type="button" class="icon-btn" title="Rename" aria-label="Rename ${esc(p.label)}" data-rename="${p.key}"><span class="icon" aria-hidden="true">${ICONS.edit}</span></button>
            <button type="button" class="icon-btn icon-danger" title="Remove product" aria-label="Remove ${esc(p.label)} from price list" data-remove-product="${p.key}"><span class="icon" aria-hidden="true">${ICONS.trash}</span></button>
          </span>
        </div>

        <div class="image-field" data-image-field="${p.key}">
          <div class="image-field__preview" id="thumb-${p.key}">
            ${p.image ? `<img src="${esc(p.image)}" alt="" onerror="this.parentElement.innerHTML='&lt;span class=&quot;image-field__placeholder&quot;&gt;No image&lt;/span&gt;';">` : `<span class="image-field__placeholder">No image</span>`}
          </div>
          <div class="image-field__controls">
            <div class="image-field__row">
              <label class="image-field__btn ${pricesUnlocked?'':'is-disabled'}" for="file-${p.key}"><span class="icon" aria-hidden="true">${ICONS.upload}</span>Upload image</label>
              <input type="file" accept="image/*" id="file-${p.key}" style="display:none;" ${pricesUnlocked?'':'disabled'}>
              <button type="button" class="image-field__btn danger" data-remove-image="${p.key}" ${p.image ? '' : 'hidden'} ${pricesUnlocked?'':'disabled'}>Remove image</button>
            </div>
            <input type="url" class="image-field__url" id="img-${p.key}" placeholder="or paste image URL" value="${(p.image||'').startsWith('data:') ? '' : esc(p.image || '')}" disabled>
            <span class="image-field__status" id="status-${p.key}"></span>
          </div>
        </div>

        <label style="margin:0 0 4px;">Rate (₹ each)</label>
        <div class="rate-row">
          <button type="button" class="qty-step-btn minus" data-step-minus="${p.key}" aria-label="Decrease ${esc(p.label)} rate" ${pricesUnlocked?'':'disabled'}><span class="icon" aria-hidden="true">${ICONS.minus}</span></button>
          <input type="number" min="0" id="p-${p.key}" value="${prices[p.key] || 0}" disabled>
          <button type="button" class="qty-step-btn plus" data-step-plus="${p.key}" aria-label="Increase ${esc(p.label)} rate" ${pricesUnlocked?'':'disabled'}><span class="icon" aria-hidden="true">${ICONS.plus}</span></button>
        </div>
      </div>
    `).join('');
    grid.querySelectorAll('[data-rename]').forEach(btn=>{
      btn.addEventListener('click', async ()=>{
        const key = btn.dataset.rename;
        const p = products.find(x=>x.key===key);
        if(!p) return;
        const next = await customPrompt('Rename product', 'New name for this item:', p.label);
        if(next === null) return;
        const trimmed = next.trim();
        if(!trimmed){ toast('Name cannot be empty.', 'error'); return; }
        p.label = trimmed;
        await saveProducts();
        renderPricesForm();
        renderOrderQtyGrid();
        toast('Product renamed.', 'success');
      });
    });
    grid.querySelectorAll('[data-remove-product]').forEach(btn=>{
      btn.addEventListener('click', async ()=>{
        const key = btn.dataset.removeProduct;
        const p = products.find(x=>x.key===key);
        if(!p) return;
        const ok = await customConfirm('Remove product', `Remove "${p.label}" from the price list? Existing orders keep their saved quantities, but this item will no longer appear on new orders.`, 'Remove');
        if(!ok) return;
        products = products.filter(x=>x.key!==key);
        await saveProducts();
        renderPricesForm();
        renderOrderQtyGrid();
        toast('Product removed.', 'success');
      });
    });
    // Rate +/- steppers (₹1 per click; unlocked only).
    grid.querySelectorAll('[data-step-minus], [data-step-plus]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        if(!pricesUnlocked) return;
        const key = btn.dataset.stepMinus || btn.dataset.stepPlus;
        const input = $('#p-' + key);
        const step = btn.dataset.stepMinus ? -1 : 1;
        input.value = Math.max(0, (Number(input.value) || 0) + step);
      });
    });
    // Pasting an image URL updates the preview live and saves immediately.
    grid.querySelectorAll('.image-field__url').forEach(input=>{
      input.addEventListener('change', async ()=>{
        const key = input.id.slice(4);
        const p = products.find(x=>x.key===key);
        if(!p) return;
        p.image = input.value.trim();
        await saveProducts();
        renderProductThumb(key);
        setImageStatus(key, p.image ? 'Image URL saved.' : '', 'is-success');
      });
    });
    // Uploading a file reads it as a data URL and saves it directly (no external host needed).
    grid.querySelectorAll('[id^="file-"]').forEach(input=>{
      input.addEventListener('change', async ()=>{
        const key = input.id.slice(5);
        const p = products.find(x=>x.key===key);
        const file = input.files && input.files[0];
        if(!p || !file) return;
        if(file.size > 1024 * 1024){
          setImageStatus(key, 'Image is over 1MB — pick a smaller file or use a URL instead.', 'is-error');
          input.value = '';
          return;
        }
        setImageStatus(key, 'Uploading…', '');
        const reader = new FileReader();
        reader.onload = async () => {
          p.image = reader.result;
          await saveProducts();
          renderProductThumb(key);
          const urlInput = $('#img-' + key);
          if(urlInput) urlInput.value = '';
          setImageStatus(key, 'Uploaded.', 'is-success');
        };
        reader.onerror = () => setImageStatus(key, 'Could not read that image — try again.', 'is-error');
        reader.readAsDataURL(file);
      });
    });
    // Remove the image only (keeps the product itself).
    grid.querySelectorAll('[data-remove-image]').forEach(btn=>{
      btn.addEventListener('click', async ()=>{
        if(!pricesUnlocked) return;
        const key = btn.dataset.removeImage;
        const p = products.find(x=>x.key===key);
        if(!p) return;
        p.image = '';
        await saveProducts();
        renderProductThumb(key);
        const urlInput = $('#img-' + key);
        if(urlInput) urlInput.value = '';
        btn.hidden = true;
        setImageStatus(key, 'Image removed.', 'is-success');
      });
    });
    setPricesLocked(!pricesUnlocked);
  }

  function renderProductThumb(key){
    const p = products.find(x=>x.key===key);
    const thumb = $('#thumb-' + key);
    if(!p || !thumb) return;
    thumb.innerHTML = p.image
      ? `<img src="${esc(p.image)}" alt="" onerror="this.parentElement.innerHTML='&lt;span class=&quot;image-field__placeholder&quot;&gt;No image&lt;/span&gt;';">`
      : `<span class="image-field__placeholder">No image</span>`;
    const removeBtn = document.querySelector(`[data-remove-image="${key}"]`);
    if(removeBtn) removeBtn.hidden = !p.image;
  }

  function setImageStatus(key, text, cls){
    const el = $('#status-' + key);
    if(!el) return;
    el.textContent = text;
    el.className = 'image-field__status ' + (cls || '');
  }

  function setPricesLocked(locked){
    pricesUnlocked = !locked;
    $$('#prices-grid input').forEach(inp => inp.disabled = locked);
    $$('#prices-grid .qty-step-btn').forEach(btn => btn.disabled = locked);
    $$('#prices-grid label.image-field__btn').forEach(lbl => lbl.classList.toggle('is-disabled', locked));
    $$('#prices-grid [data-remove-image]').forEach(btn => {
      btn.disabled = locked;
      btn.classList.toggle('is-disabled', locked);
    });
    $$('[data-editctrls]').forEach(el => el.style.display = locked ? 'none' : 'inline-flex');
    $('#prices-save-btn').disabled = locked;
    setLockUI('prices-unlock-toggle', 'prices-lock-status', locked,
      'Locked — unlock with password to edit rates.',
      'Unlocked — rates are editable. Applies to every order.');
    $('#prices-change-pw-btn').style.display = locked ? 'none' : 'inline-flex';
    $('#prices-add-product-btn').style.display = locked ? 'none' : 'inline-flex';
  }

  $('#prices-unlock-toggle').addEventListener('change', async (e)=>{
    if(e.target.checked){
      if(!await checkPassword('unlock the price list')){ e.target.checked = false; return; }
      setPricesLocked(false);
      toast('Price list unlocked.', 'info');
    } else {
      setPricesLocked(true);
    }
  });

  $('#prices-add-product-btn').addEventListener('click', async ()=>{
    if(!pricesUnlocked) return;
    const label = await customPrompt('Add product', 'New product name (e.g. "Salwar Set"):');
    if(label === null) return;
    const trimmed = label.trim();
    if(!trimmed){ toast('Name cannot be empty.', 'error'); return; }
    const key = slugify(trimmed);
    products.push({ key, label: trimmed, image: '' });
    prices[key] = 0;
    await saveProducts();
    await savePrices();
    renderPricesForm();
    renderOrderQtyGrid();
    toast(`Added "${trimmed}" to the price list.`, 'success');
  });

  $('#prices-change-pw-btn').addEventListener('click', async ()=>{
    const current = await customPrompt('Change password', 'Enter current password:', '', 'password');
    if(current === null) return;
    if(current !== (settings.password || DEFAULT_PASSWORD)){ toast('Incorrect password.', 'error'); return; }
    const next = await customPrompt('Change password', 'Enter new password:', '', 'password');
    if(next === null) return;
    if(!next.trim()){ toast('Password cannot be empty.', 'error'); return; }
    settings.password = next.trim();
    await saveSettings();
    toast('Password changed.', 'success');
  });

  $('#prices-form').addEventListener('submit', async e=>{
    e.preventDefault();
    if(!pricesUnlocked){ toast('Unlock the price list first.', 'error'); return; }
    products.forEach(p => prices[p.key] = Number($('#p-' + p.key).value) || 0);
    await savePrices();
    setPricesLocked(true);
    toast('Price list saved and locked.', 'success');
  });

  // ---------- charges (flat named amounts) ----------
  let chargesUnlocked = false;

  function chargeSlugify(label){
    let key = label.trim().replace(/[^a-zA-Z0-9]+/g,' ').trim()
      .split(' ').map((w,i)=> i===0 ? w.toLowerCase() : w.charAt(0).toUpperCase()+w.slice(1).toLowerCase())
      .join('');
    if(!key) key = 'charge';
    let unique = key, n = 1;
    while(charges.some(c => c.key === unique)) unique = key + (++n);
    return unique;
  }

  function renderChargesList(){
    const list = $('#charges-list');
    list.innerHTML = charges.length ? charges.map(c => `
      <li>
        <span style="flex:1;">${esc(c.label)}</span>
        <span class="no-print" data-chg-editctrls="${c.key}" style="display:${chargesUnlocked?'inline-flex':'none'}; gap:2px;">
          <button type="button" class="icon-btn" title="Rename" aria-label="Rename ${esc(c.label)}" data-chg-rename="${c.key}"><span class="icon" aria-hidden="true">${ICONS.edit}</span></button>
          <button type="button" class="icon-btn icon-danger" title="Remove" aria-label="Remove ${esc(c.label)} charge" data-chg-remove="${c.key}"><span class="icon" aria-hidden="true">${ICONS.trash}</span></button>
        </span>
      </li>
    `).join('') : `<li style="color:#948a7b;">No charges yet — add one below.</li>`;

    list.querySelectorAll('[data-chg-rename]').forEach(btn=>{
      btn.addEventListener('click', async ()=>{
        const key = btn.dataset.chgRename;
        const c = charges.find(x=>x.key===key);
        if(!c) return;
        const next = await customPrompt('Rename charge', 'New name for this charge:', c.label);
        if(next === null) return;
        const trimmed = next.trim();
        if(!trimmed){ toast('Name cannot be empty.', 'error'); return; }
        c.label = trimmed;
        await saveCharges();
        renderChargesList();
        renderOrderChargesGrid();
        toast('Charge renamed.', 'success');
      });
    });
    list.querySelectorAll('[data-chg-remove]').forEach(btn=>{
      btn.addEventListener('click', async ()=>{
        const key = btn.dataset.chgRemove;
        const c = charges.find(x=>x.key===key);
        if(!c) return;
        const ok = await customConfirm('Remove charge', `Remove "${c.label}"? It will no longer appear on new orders; past orders keep their saved amounts.`, 'Remove');
        if(!ok) return;
        charges = charges.filter(x=>x.key!==key);
        await saveCharges();
        renderChargesList();
        renderOrderChargesGrid();
        toast('Charge removed.', 'success');
      });
    });
    setChargesLocked(!chargesUnlocked);
  }

  function setChargesLocked(locked){
    chargesUnlocked = !locked;
    $$('[data-chg-editctrls]').forEach(el => el.style.display = locked ? 'none' : 'inline-flex');
    $('#charges-add-row').style.display = locked ? 'none' : 'flex';
    setLockUI('charges-unlock-toggle', 'charges-lock-status', locked,
      'Locked — unlock with password to edit.',
      'Unlocked — add, rename or remove charges below.');
  }
  $('#charges-unlock-toggle').addEventListener('change', async (e)=>{
    if(e.target.checked){
      if(!await checkPassword('unlock charges')){ e.target.checked = false; return; }
      setChargesLocked(false);
      toast('Charges unlocked.', 'info');
    } else {
      setChargesLocked(true);
    }
  });
  $('#charge-add-btn').addEventListener('click', async ()=>{
    if(!chargesUnlocked) return;
    const input = $('#charge-new-name');
    const trimmed = input.value.trim();
    if(!trimmed){ toast('Name cannot be empty.', 'error'); return; }
    charges.push({ key: chargeSlugify(trimmed), label: trimmed });
    await saveCharges();
    input.value = '';
    renderChargesList();
    renderOrderChargesGrid();
    toast(`Added "${trimmed}" charge.`, 'success');
  });

  // ---------- shop settings ----------
  let settingsUnlocked = false;

  const ADDR_TITLECASE_IDS = ['s-addr-block-no','s-addr-block-name','s-addr-road','s-addr-landmark','s-addr-city','s-addr-state','s-addr-country'];
  const ADDR_UPPERCASE_IDS = ['s-addr-statecode'];

  function renderSettingsForm(){
    $('#s-name').value = shop.name || '';
    $('#s-tag').value = shop.tag || '';
    $('#s-phone').value = shop.phone || '';
    $('#s-since').value = shop.since || '';
    $('#s-logo').value = shop.logo || '';
    $('#s-addr-block-no').value = shop.addrBlockNo || '';
    $('#s-addr-block-name').value = shop.addrBlockName || '';
    $('#s-addr-road').value = shop.addrRoad || '';
    $('#s-addr-landmark').value = shop.addrLandmark || '';
    $('#s-addr-city').value = shop.addrCity || '';
    $('#s-addr-state').value = shop.addrState || '';
    $('#s-addr-country').value = shop.addrCountry || '';
    $('#s-addr-statecode').value = shop.addrStateCode || '';
    $('#s-addr-pincode').value = shop.addrPincode || '';
    $('#s-hours').value = shop.hours || '';
    $('#s-delivery-note').value = shop.deliveryNote || '';
    $('#s-liability').value = shop.liability || '';
    $('#s-thanks').value = shop.thanks || '';
    setSettingsLocked(!settingsUnlocked);
  }

  // Address fields in English auto-capitalise as you leave them.
  ADDR_TITLECASE_IDS.forEach(id => {
    const el = $('#' + id);
    if(el) el.addEventListener('blur', () => { el.value = titleCase(el.value); });
  });
  ADDR_UPPERCASE_IDS.forEach(id => {
    const el = $('#' + id);
    if(el) el.addEventListener('blur', () => { el.value = el.value.toUpperCase(); });
  });

  function setSettingsLocked(locked){
    settingsUnlocked = !locked;
    $$('#settings-form input').forEach(inp => inp.disabled = locked);
    $('#settings-save-btn').disabled = locked;
    setLockUI('settings-unlock-toggle', 'settings-lock-status', locked,
      'Locked — unlock with password to edit.',
      'Unlocked — these details print on every bill.');
  }

  $('#settings-unlock-toggle').addEventListener('change', async (e)=>{
    if(e.target.checked){
      if(!await checkPassword('unlock shop settings')){ e.target.checked = false; return; }
      setSettingsLocked(false);
      toast('Shop settings unlocked.', 'info');
    } else {
      setSettingsLocked(true);
    }
  });

  $('#settings-form').addEventListener('submit', async e=>{
    e.preventDefault();
    if(!settingsUnlocked){ toast('Unlock shop settings first.', 'error'); return; }
    shop = {
      name: $('#s-name').value.trim() || DEFAULT_SHOP.name,
      tag: $('#s-tag').value.trim(),
      phone: $('#s-phone').value.trim(),
      since: $('#s-since').value.trim(),
      logo: $('#s-logo').value.trim(),
      addrBlockNo: titleCase($('#s-addr-block-no').value.trim()),
      addrBlockName: titleCase($('#s-addr-block-name').value.trim()),
      addrRoad: titleCase($('#s-addr-road').value.trim()),
      addrLandmark: titleCase($('#s-addr-landmark').value.trim()),
      addrCity: titleCase($('#s-addr-city').value.trim()),
      addrState: titleCase($('#s-addr-state').value.trim()),
      addrCountry: titleCase($('#s-addr-country').value.trim()),
      addrStateCode: $('#s-addr-statecode').value.trim().toUpperCase(),
      addrPincode: $('#s-addr-pincode').value.trim(),
      hours: $('#s-hours').value.trim(),
      deliveryNote: $('#s-delivery-note').value.trim(),
      liability: $('#s-liability').value.trim(),
      thanks: $('#s-thanks').value.trim(),
    };
    await saveShop();
    setSettingsLocked(true);
    renderSidebarBranding();
    toast('Shop details saved.', 'success');
  });

  // ---------- sidebar branding ----------
  function renderSidebarBranding(){
    const logoEl = $('#sb-logo');
    if(shop.logo){
      logoEl.src = shop.logo;
      logoEl.style.display = 'block';
      logoEl.onerror = () => { logoEl.style.display = 'none'; };
    } else {
      logoEl.style.display = 'none';
    }
    $('#sb-brand-name').textContent = shop.name || DEFAULT_SHOP.name;
    $('#sb-brand-tag').textContent = shop.tag || 'Order & Bill Book';
    $('#sb-foot-name').textContent = shop.name || DEFAULT_SHOP.name;
    $('#sb-foot-addr').textContent = fullShopAddress();
  }

  // ---------- payments (separate lock from the rest of Shop Settings) ----------
  let paymentsUnlocked = false;

  function renderPaymentsForm(){
    $('#pay-enabled').value = payments.enabled ? 'yes' : 'no';
    $('#pay-link').value = payments.link || '';
    setPaymentsLocked(!paymentsUnlocked);
  }
  function setPaymentsLocked(locked){
    paymentsUnlocked = !locked;
    $$('#payments-form input, #payments-form select').forEach(el => el.disabled = locked);
    $('#payments-save-btn').disabled = locked;
    setLockUI('payments-unlock-toggle', 'payments-lock-status', locked,
      'Locked — unlock with password to edit.',
      'Unlocked — controls the Payment button on bills.');
  }
  $('#payments-unlock-toggle').addEventListener('change', async (e)=>{
    if(e.target.checked){
      if(!await checkPassword('unlock payment settings')){ e.target.checked = false; return; }
      setPaymentsLocked(false);
      toast('Payment settings unlocked.', 'info');
    } else {
      setPaymentsLocked(true);
    }
  });
  $('#payments-form').addEventListener('submit', async e=>{
    e.preventDefault();
    if(!paymentsUnlocked){ toast('Unlock payment settings first.', 'error'); return; }
    payments = {
      enabled: $('#pay-enabled').value === 'yes',
      link: $('#pay-link').value.trim()
    };
    await savePayments();
    setPaymentsLocked(true);
    toast('Payment settings saved.', 'success');
  });

  // ---------- analytics ----------
  function renderAnalytics(){
    const totals = orders.map(o => ({ o, ...calcOrderTotals(o) }));
    const revenue = totals.reduce((s,t)=> s + t.grandTotal, 0);
    const collected = orders.reduce((s,o)=> s + Number(o.advance||0), 0);
    const outstanding = totals.reduce((s,t)=> s + Math.max(t.balance,0), 0);
    const avgOrder = orders.length ? revenue / orders.length : 0;

    $('#an-stats').innerHTML = [
      { label:'Total Revenue', value: money(revenue) },
      { label:'Collected', value: money(collected), accent:'teal' },
      { label:'Outstanding', value: money(outstanding), accent: outstanding ? 'red' : '' },
      { label:'Avg Order Value', value: money(avgOrder), accent:'marigold' },
    ].map(s => `
      <div class="stat-card ${s.accent ? 'accent-'+s.accent : ''}">
        <div class="stat-label">${esc(s.label)}</div>
        <div class="stat-value">${s.value}</div>
      </div>
    `).join('');

    // last 6 months revenue bar chart
    const now = new Date();
    const months = [];
    for(let i = 5; i >= 0; i--){
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleString('en-IN', { month:'short' }) });
    }
    const monthRevenue = months.map(m => {
      const sum = totals
        .filter(t => { const od = new Date(t.o.date); return od.getFullYear() === m.year && od.getMonth() === m.month; })
        .reduce((s,t)=> s + t.grandTotal, 0);
      return { ...m, sum };
    });
    const maxRev = Math.max(1, ...monthRevenue.map(m => m.sum));
    $('#an-bar-chart').innerHTML = monthRevenue.map(m => `
      <div class="bar-col">
        <div class="bar-amt">${m.sum ? money(m.sum) : ''}</div>
        <div class="bar" style="height:${Math.max(2, Math.round((m.sum / maxRev) * 130))}px;"></div>
        <div class="bar-label">${m.label}</div>
      </div>
    `).join('');

    // status breakdown
    const statusCounts = { new: orders.filter(o=>!o.status).length };
    STATUSES.forEach(s => statusCounts[s] = orders.filter(o=>o.status===s).length);
    const maxCount = Math.max(1, ...Object.values(statusCounts));
    $('#an-status-breakdown').innerHTML = orders.length
      ? Object.entries(statusCounts).map(([label,count]) => `
          <div class="hbar-row">
            <span class="hbar-label">${esc(label.replace('_',' '))}</span>
            <span class="hbar-track"><span class="hbar-fill" style="width:${Math.round((count/maxCount)*100)}%;"></span></span>
            <span class="hbar-value">${count}</span>
          </div>
        `).join('')
      : `<p class="empty">No orders yet.</p>`;

    // top products by revenue
    const productRevenue = products.map(p => {
      const qty = orders.reduce((s,o)=> s + ((o.qty && o.qty[p.key]) || 0), 0);
      const rev = qty * (prices[p.key] || 0);
      return { label: p.label, qty, rev };
    }).filter(p => p.qty > 0).sort((a,b) => b.rev - a.rev).slice(0, 6);
    const maxProdRev = Math.max(1, ...productRevenue.map(p => p.rev));
    $('#an-top-products').innerHTML = productRevenue.length
      ? productRevenue.map(p => `
          <div class="hbar-row">
            <span class="hbar-label" style="text-transform:none;">${esc(p.label)}</span>
            <span class="hbar-track"><span class="hbar-fill" style="width:${Math.round((p.rev/maxProdRev)*100)}%;"></span></span>
            <span class="hbar-value">${money(p.rev)}</span>
          </div>
        `).join('')
      : `<p class="empty">No stitching items sold yet.</p>`;

    // by-customer breakdown (grouped by mobile number)
    const byMobile = {};
    totals.forEach(({o, grandTotal, balance}) => {
      const key = (o.mobile || '').trim() || `unknown-${o.id}`;
      if(!byMobile[key]) byMobile[key] = { name: o.name, mobile: o.mobile, orders: 0, revenue: 0, dues: 0 };
      byMobile[key].orders += 1;
      byMobile[key].revenue += grandTotal;
      byMobile[key].dues += Math.max(balance, 0);
      byMobile[key].name = o.name; // keep most recent name for that number
    });
    const customerRows = Object.values(byMobile).sort((a,b) => b.revenue - a.revenue);
    $('#an-customer-tbody').innerHTML = customerRows.length
      ? customerRows.map(c => `
          <tr>
            <td>${esc(c.name)}</td>
            <td>${esc(c.mobile)}</td>
            <td>${c.orders}</td>
            <td>${money(c.revenue)}</td>
            <td class="${c.dues > 0 ? 'balance-due' : 'balance-zero'}">${money(c.dues)}</td>
          </tr>
        `).join('')
      : `<tr><td colspan="5" class="empty">No orders yet.</td></tr>`;
  }

  // ---------- init ----------
  (async function init(){
    await loadData();
    renderOrderQtyGrid();
    renderOrderChargesGrid();
    $('#f-delivery').value = defaultDeliveryDateStr();
    updateOrderSummary();
    renderSidebarBranding();
    renderPricesForm();
    renderChargesList();
    renderOrders();
    renderDashboard();
  })();
})();
