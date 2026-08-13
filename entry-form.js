/**
 * entry-form.js
 *
 * Fully self-contained "Add your website details" form panel: injects its
 * own CSS and HTML markup into #entryFormMount, validates input, and submits
 * via window.App.addCustomer() (from google-sheets.js). After a successful
 * save it calls window.App.refreshTable() (registered by success-story.js).
 *
 * Load order: google-sheets.js, then success-story.js, then this file.
 */
(function(){

  // ---- Inject this panel's CSS ----
  if(!document.getElementById('entry-form-styles')){
    const style = document.createElement('style');
    style.id = 'entry-form-styles';
    style.textContent = `
      .form-panel{
        background: var(--panel);
        border: 1px solid var(--line-soft);
        border-radius: 16px;
        padding: 22px 22px 20px;
      }
      .form-panel h1{
        font-size: 18px;
        font-weight: 700;
        margin: 2px 2px 20px;
      }
      form{ display:flex; flex-direction:column; gap:16px; }
      .field{
        position: relative;
        border: 1.5px solid var(--line);
        border-radius: 10px;
        padding: 15px 12px 11px;
        transition: border-color .15s ease, box-shadow .15s ease;
      }
      .field:focus-within{
        border-color: var(--accent);
        box-shadow: 0 0 0 3px var(--accent-soft);
      }
      .field .flabel{
        position:absolute;
        top: -8px;
        left: 10px;
        display:flex;
        align-items:center;
        gap: 5px;
        background: var(--panel);
        padding: 0 5px;
        font-size: 10.5px;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--accent);
        line-height:1;
      }
      .field .flabel .connector{
        width: 12px;
        height: 1px;
        background: var(--accent);
        opacity: 0.55;
      }
      .field .req{ color: var(--danger); margin-left:1px; }
      .field input,
      .field select{
        width:100%;
        background: transparent;
        border: none;
        outline: none;
        color: var(--text);
        font-size: 13.5px;
        font-family: inherit;
        padding: 2px 2px 0;
        resize: none;
      }
      .field select{
        -webkit-appearance:none;
        appearance:none;
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='8'><path d='M0 0l7 8 7-8z' fill='%237d8299'/></svg>");
        background-repeat: no-repeat;
        background-position: right 2px center;
        padding-right: 20px;
      }
      .field select option{ background: var(--panel); color: var(--text); }
      .field input[type="date"]::-webkit-calendar-picker-indicator{ filter: invert(0.6); cursor:pointer; }
      .field.invalid{ border-color: var(--danger); }
      .field.invalid .flabel{ color: var(--danger); }
      .field.invalid .connector{ background: var(--danger); }
      .err{
        display:none;
        font-size: 10.5px;
        color: var(--danger);
        margin: 5px 2px 0;
      }
      .err.show{ display:block; }
      .row{ display:grid; gap: 12px; }
      .row-7{ grid-template-columns: repeat(7, 1fr); }
      .row-5{ grid-template-columns: repeat(5, 1fr); }
      .actions{
        display:flex;
        justify-content:flex-end;
        gap: 10px;
        margin-top: 4px;
        padding-top: 4px;
        border-top: 1px solid var(--line-soft);
      }
      button{
        font-family: inherit;
        font-size: 13px;
        font-weight: 700;
        border-radius: 9px;
        padding: 10px 22px;
        cursor:pointer;
        border: 1px solid transparent;
        transition: transform .05s ease, opacity .15s ease, border-color .15s ease;
      }
      button:active{ transform: scale(0.97); }
      button:disabled{ opacity:0.55; cursor:not-allowed; }
      .btn-submit{ background: var(--accent); color: #0b0d16; }
      .btn-submit:hover{ opacity: 0.9; }
      .btn-cancel{ background: transparent; border-color: var(--line); color: var(--text); }
      .btn-cancel:hover{ border-color: var(--muted); }
      @media (max-width: 1100px){
        .row-7{ grid-template-columns: repeat(4, 1fr); }
        .row-5{ grid-template-columns: repeat(3, 1fr); }
      }
      @media (max-width: 900px){
        .row-7{ grid-template-columns: repeat(2, 1fr); }
        .row-5{ grid-template-columns: repeat(2, 1fr); }
      }
    `;
    document.head.appendChild(style);
  }

  // ---- Inject this panel's HTML markup ----
  const mount = document.getElementById('entryFormMount');
  if(!mount) return;
  mount.innerHTML = `
    <div class="form-panel">
      <h1>Add your website details</h1>
      <form id="customerForm" novalidate>

        <div class="row row-5">
          <div class="field" data-field="website">
            <span class="flabel">Website<span class="req">*</span><span class="connector"></span></span>
            <input type="text" name="website" placeholder="https://yourbusiness.com" required maxlength="300">
          </div>
          <div class="field" data-field="description">
            <span class="flabel">Description<span class="connector"></span></span>
            <input type="text" name="description" placeholder="Small intro about your business details..." maxlength="500">
          </div>
          <div class="field" data-field="category">
            <span class="flabel">Category<span class="connector"></span></span>
            <input type="text" name="category" placeholder="Category" maxlength="100">
          </div>
          <div class="field" data-field="startdate">
            <span class="flabel">Start Date<span class="req">*</span><span class="connector"></span></span>
            <input type="date" name="startdate" required>
          </div>
          <div class="field" data-field="shipping">
            <span class="flabel">Shipping<span class="req">*</span><span class="connector"></span></span>
            <select name="shipping" required>
              <option value="" disabled selected hidden></option>
              <option value="global">Global</option>
              <option value="within-country">Within Country</option>
              <option value="state-only">State Only</option>
              <option value="city-only">City Only</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>
        <div class="err" id="basicErr" role="alert" aria-live="assertive">Website (a valid http/https link), start date, and shipping are required.</div>

        <div class="row row-7">
          <div class="field" data-field="country">
            <span class="flabel">Country<span class="req">*</span><span class="connector"></span></span>
            <input type="text" name="country" placeholder="Country" required maxlength="100">
          </div>
          <div class="field" data-field="state">
            <span class="flabel">State<span class="connector"></span></span>
            <input type="text" name="state" placeholder="State" maxlength="100">
          </div>
          <div class="field" data-field="city">
            <span class="flabel">City<span class="connector"></span></span>
            <input type="text" name="city" placeholder="City" maxlength="100">
          </div>
          <div class="field" data-field="zip">
            <span class="flabel">Zip<span class="connector"></span></span>
            <input type="text" name="zip" placeholder="Zip code" maxlength="20">
          </div>
          <div class="field" data-field="fullname">
            <span class="flabel">Full Name<span class="connector"></span></span>
            <input type="text" name="fullname" placeholder="Full name" maxlength="150">
          </div>
          <div class="field" data-field="email">
            <span class="flabel">Email<span class="connector"></span></span>
            <input type="email" name="email" placeholder="Email" maxlength="200">
          </div>
          <div class="field" data-field="phone">
            <span class="flabel">Phone<span class="connector"></span></span>
            <input type="tel" name="phone" placeholder="Phone" maxlength="30">
          </div>
        </div>
        <div class="err" id="contactErr" role="alert" aria-live="assertive">Country is required.</div>

        <div class="actions">
          <button type="button" class="btn-cancel" id="cancelBtn">Cancel</button>
          <button type="submit" class="btn-submit" id="submitBtn">Submit</button>
        </div>
      </form>
    </div>
  `;

  if(!window.App){
    console.error('entry-form.js requires google-sheets.js to be loaded first.');
    return;
  }
  const { showToast, isConfigured, addCustomer, isSafeUrl } = window.App;

  const form = document.getElementById('customerForm');
  const submitBtn = document.getElementById('submitBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const basicErr = document.getElementById('basicErr');
  const contactErr = document.getElementById('contactErr');

  function fieldWrap(el){ return el.closest('.field'); }

  const BASIC_FIELDS = ['website', 'startdate', 'shipping'];
  const CONTACT_FIELDS = ['country'];

  function validate(){
    let valid = true;
    let basicInvalid = false;
    let contactInvalid = false;

    form.querySelectorAll('[required]').forEach(el=>{
      const wrap = fieldWrap(el);
      const empty = !el.value || !el.value.trim();
      wrap.classList.toggle('invalid', empty);
      el.setAttribute('aria-invalid', empty ? 'true' : 'false');
      if(empty){
        valid = false;
        if(BASIC_FIELDS.includes(el.name)) basicInvalid = true;
        if(CONTACT_FIELDS.includes(el.name)) contactInvalid = true;
      }
    });

    // Extra rule: website must be a genuine http(s) URL.
    const websiteEl = form.querySelector('[name="website"]');
    if(websiteEl.value.trim() && !isSafeUrl(websiteEl.value.trim())){
      fieldWrap(websiteEl).classList.add('invalid');
      websiteEl.setAttribute('aria-invalid', 'true');
      basicInvalid = true;
      valid = false;
    }

    basicErr.classList.toggle('show', basicInvalid);
    contactErr.classList.toggle('show', contactInvalid);

    return valid;
  }

  form.querySelectorAll('[required]').forEach(el=>{
    const clear = ()=>{
      fieldWrap(el).classList.remove('invalid');
      el.setAttribute('aria-invalid', 'false');
      if(BASIC_FIELDS.includes(el.name)) basicErr.classList.remove('show');
      if(CONTACT_FIELDS.includes(el.name)) contactErr.classList.remove('show');
    };
    el.addEventListener('input', clear);
    el.addEventListener('change', clear);
  });

  form.addEventListener('submit', async function(e){
    e.preventDefault();
    if(!validate()){
      showToast('Please fill in all required fields.');
      return;
    }
    if(!isConfigured()) return;

    const data = Object.fromEntries(new FormData(form).entries());
    submitBtn.disabled = true;
    cancelBtn.disabled = true;
    submitBtn.textContent = 'Saving…';
    try{
      await addCustomer(data);
      form.reset();
      basicErr.classList.remove('show');
      contactErr.classList.remove('show');
      showToast('Customer added to Google Sheet.');
      if(window.App.refreshTable) await window.App.refreshTable();
    }catch(err){
      console.error(err);
      const msg = err.name === 'AbortError' ? 'Request timed out — please try again.' : 'Failed to save — check the Web App URL / deployment.';
      showToast(msg);
    }finally{
      submitBtn.disabled = false;
      cancelBtn.disabled = false;
      submitBtn.textContent = 'Submit';
    }
  });

  cancelBtn.addEventListener('click', function(){
    form.reset();
    form.querySelectorAll('.field').forEach(f=> f.classList.remove('invalid'));
    basicErr.classList.remove('show');
    contactErr.classList.remove('show');
  });

})();
