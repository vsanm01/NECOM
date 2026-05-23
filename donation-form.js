/*!
 * DonationForm.js — v1.0.0
 * Drop-in donation widget with multi-currency, recurring support,
 * smart payment routing (Razorpay / PayPal / Dodo / Wise) & EmailJS confirmation.
 *
 * Usage:
 *   <script src="donation-form.js"></script>
 *   <div id="my-donation-form"></div>
 *   <script>
 *     DonationForm.init({
 *       container: '#my-donation-form',   // CSS selector or DOM element
 *       orgName: 'Your Org',
 *       razorpayLink: 'https://rzp.io/l/your-link',
 *       paypalUsername: 'yourpaypal',
 *       dodoPaymentLink: 'https://pay.dodopayments.com/buy/PRODUCT_ID',
 *       wiseUsername: 'yourwise',
 *       emailjsServiceId: 'service_XXX',
 *       emailjsTemplateId: 'template_XXX',
 *       emailjsPublicKey: 'YOUR_KEY',
 *     });
 *   </script>
 *
 * Dependencies (auto-injected if not already present):
 *   - Google Fonts (Playfair Display, DM Sans, DM Mono)
 *   - EmailJS browser SDK
 */

(function (global) {
  'use strict';

  // ─── FONTS & EXTERNAL DEPS ────────────────────────────────────────────────
  function injectFonts() {
    if (document.querySelector('link[data-donation-fonts]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.dataset.donationFonts = '1';
    link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap';
    document.head.appendChild(link);
  }

  function injectEmailJS(cb) {
    if (typeof emailjs !== 'undefined') { cb(); return; }
    if (document.querySelector('script[data-emailjs]')) {
      // Already loading — wait
      const poll = setInterval(() => {
        if (typeof emailjs !== 'undefined') { clearInterval(poll); cb(); }
      }, 100);
      return;
    }
    const s = document.createElement('script');
    s.dataset.emailjs = '1';
    s.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
    s.onload = cb;
    document.head.appendChild(s);
  }

  // ─── STYLES ───────────────────────────────────────────────────────────────
  function injectStyles(uid) {
    if (document.querySelector(`style[data-donation-uid="${uid}"]`)) return;
    const css = `
/* DonationForm widget — scoped to [data-donation-uid="${uid}"] */
[data-donation-uid="${uid}"] {
  --df-bg: #0f1b2e;
  --df-surface: #1a2942;
  --df-surface2: #233047;
  --df-border: #2a3f5f;
  --df-border-active: #ffc107;
  --df-accent: #ffc107;
  --df-accent2: #ffb300;
  --df-gold: #ffc107;
  --df-text: #ffffff;
  --df-text2: #b0b9c3;
  --df-text3: #7a8699;
  --df-success: #4caf50;
  --df-locked: #0f1b2e;
  --df-locked-text: #5a6b85;
  --df-radius: 14px;
  --df-radius-sm: 8px;
  font-family: 'DM Sans', sans-serif;
  background: var(--df-bg);
  color: var(--df-text);
  min-height: 100px;
}
[data-donation-uid="${uid}"] *{box-sizing:border-box;margin:0;padding:0;}
[data-donation-uid="${uid}"] .df-wrap{max-width:640px;margin:0 auto;padding:40px 20px 80px;}

/* Progress */
[data-donation-uid="${uid}"] .df-progress-track{background:var(--df-surface2);border-radius:100px;height:4px;margin-bottom:36px;overflow:hidden;}
[data-donation-uid="${uid}"] .df-progress-fill{height:100%;background:linear-gradient(90deg,#ffc107,#ffb300);border-radius:100px;transition:width .5s cubic-bezier(.4,0,.2,1);width:0%;}

/* Section card */
[data-donation-uid="${uid}"] .df-section-card{background:var(--df-surface);border:1px solid var(--df-border);border-radius:var(--df-radius);margin-bottom:12px;overflow:hidden;transition:all .4s cubic-bezier(.4,0,.2,1);position:relative;}
[data-donation-uid="${uid}"] .df-section-card.active{border-color:rgba(255,193,7,.4);box-shadow:0 0 0 1px rgba(255,193,7,.15),0 8px 32px rgba(255,193,7,.12);}
[data-donation-uid="${uid}"] .df-section-card.completed{border-color:rgba(16,185,129,.3);}
[data-donation-uid="${uid}"] .df-section-card.locked{background:var(--df-locked);border-color:rgba(255,255,255,.04);}
[data-donation-uid="${uid}"] .df-section-header{display:flex;align-items:center;gap:14px;padding:18px 22px;cursor:default;}
[data-donation-uid="${uid}"] .df-section-card.completed .df-section-header{cursor:pointer;}
[data-donation-uid="${uid}"] .df-section-num{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;font-family:'DM Mono',monospace;flex-shrink:0;transition:all .3s;}
[data-donation-uid="${uid}"] .active .df-section-num{background:linear-gradient(135deg,#ffc107,#ffb300);color:#0f1b2e;box-shadow:0 2px 12px rgba(255,193,7,.5);}
[data-donation-uid="${uid}"] .completed .df-section-num{background:var(--df-success);color:white;}
[data-donation-uid="${uid}"] .locked .df-section-num{background:var(--df-surface2);color:var(--df-locked-text);border:1px solid var(--df-border);}
[data-donation-uid="${uid}"] .df-section-title-wrap{flex:1;}
[data-donation-uid="${uid}"] .df-section-title{font-weight:600;font-size:14px;color:var(--df-text);transition:color .3s;}
[data-donation-uid="${uid}"] .locked .df-section-title{color:var(--df-text3);}
[data-donation-uid="${uid}"] .df-section-subtitle{font-size:12px;color:var(--df-text2);margin-top:2px;transition:color .3s;}
[data-donation-uid="${uid}"] .locked .df-section-subtitle{color:var(--df-locked-text);}
[data-donation-uid="${uid}"] .df-section-preview{font-size:12px;font-weight:500;color:#ffc107;font-family:'DM Mono',monospace;text-align:right;flex-shrink:0;}
[data-donation-uid="${uid}"] .df-lock-icon{color:var(--df-text3);font-size:14px;}
[data-donation-uid="${uid}"] .df-section-body{padding:0 22px;max-height:0;overflow:hidden;transition:max-height .5s cubic-bezier(.4,0,.2,1),padding .3s;}
[data-donation-uid="${uid}"] .df-section-body.open{max-height:1500px;padding:0 22px 22px;}
[data-donation-uid="${uid}"] .df-section-divider{height:1px;background:var(--df-border);margin:0 22px;transition:opacity .3s;}
[data-donation-uid="${uid}"] .locked .df-section-divider{opacity:0;}

/* Currency / Toggle / Freq buttons */
[data-donation-uid="${uid}"] .df-btn-group{display:flex;gap:10px;padding-top:4px;}
[data-donation-uid="${uid}"] .df-toggle-btn{flex:1;padding:12px;border-radius:var(--df-radius-sm);border:1px solid var(--df-border);background:var(--df-surface2);color:var(--df-text2);font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;cursor:pointer;transition:all .2s;text-align:center;}
[data-donation-uid="${uid}"] .df-toggle-btn:hover{border-color:var(--df-accent);color:var(--df-text);}
[data-donation-uid="${uid}"] .df-toggle-btn.selected{border-color:var(--df-accent);background:rgba(255,193,7,.12);color:#ffc107;font-weight:600;}
[data-donation-uid="${uid}"] .df-freq-wrap{margin-top:12px;padding-top:12px;border-top:1px solid var(--df-border);max-height:0;overflow:hidden;opacity:0;transition:all .3s cubic-bezier(.4,0,.2,1);}
[data-donation-uid="${uid}"] .df-freq-wrap.show{max-height:200px;opacity:1;}
[data-donation-uid="${uid}"] .df-freq-label{font-size:12px;color:var(--df-text2);margin-bottom:8px;display:block;}
[data-donation-uid="${uid}"] .df-freq-group{display:flex;gap:8px;}
[data-donation-uid="${uid}"] .df-freq-btn{flex:1;padding:10px 12px;border-radius:var(--df-radius-sm);border:1px solid var(--df-border);background:var(--df-surface2);color:var(--df-text2);font-size:13px;font-weight:500;cursor:pointer;transition:all .2s;text-align:center;}
[data-donation-uid="${uid}"] .df-freq-btn:hover{border-color:var(--df-accent);color:var(--df-text);}
[data-donation-uid="${uid}"] .df-freq-btn.selected{border-color:var(--df-accent);background:rgba(255,193,7,.12);color:#ffc107;font-weight:600;}

/* Amount */
[data-donation-uid="${uid}"] .df-amount-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:12px;}
[data-donation-uid="${uid}"] .df-amount-btn{padding:16px;border-radius:var(--df-radius-sm);border:1px solid var(--df-border);background:var(--df-surface2);color:var(--df-text);font-size:18px;font-weight:600;font-family:'DM Mono',monospace;cursor:pointer;transition:all .2s;}
[data-donation-uid="${uid}"] .df-amount-btn:hover{border-color:var(--df-accent);transform:translateY(-2px);}
[data-donation-uid="${uid}"] .df-amount-btn.selected{border-color:var(--df-accent);background:rgba(255,193,7,.12);color:#ffc107;box-shadow:0 4px 16px rgba(255,193,7,.3);}
[data-donation-uid="${uid}"] .df-amount-btn:disabled{opacity:.4;cursor:not-allowed;pointer-events:none;}
[data-donation-uid="${uid}"] .df-custom-wrap{position:relative;}
[data-donation-uid="${uid}"] .df-currency-sym{position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:18px;font-weight:600;color:var(--df-text2);font-family:'DM Mono',monospace;pointer-events:none;}
[data-donation-uid="${uid}"] .df-custom-input{width:100%;padding:16px 14px 16px 38px;border-radius:var(--df-radius-sm);border:1px solid var(--df-border);background:var(--df-surface2);color:var(--df-text);font-size:18px;font-weight:600;font-family:'DM Mono',monospace;outline:none;transition:all .2s;}
[data-donation-uid="${uid}"] .df-custom-input::placeholder{color:var(--df-text3);}
[data-donation-uid="${uid}"] .df-custom-input:focus{border-color:var(--df-accent);background:rgba(255,193,7,.08);}
[data-donation-uid="${uid}"] .df-custom-input:disabled{opacity:.4;cursor:not-allowed;pointer-events:none;}

/* Fee toggle */
[data-donation-uid="${uid}"] .df-fee-section{background:rgba(255,193,7,.06);border:1px solid rgba(255,193,7,.2);border-radius:var(--df-radius-sm);padding:14px;margin-top:12px;}
[data-donation-uid="${uid}"] .df-checkbox-row{display:flex;align-items:flex-start;gap:12px;cursor:pointer;}
[data-donation-uid="${uid}"] .df-checkbox-box{width:20px;height:20px;border:2px solid var(--df-border-active);border-radius:5px;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;transition:all .2s;}
[data-donation-uid="${uid}"] .df-checkbox-box.checked{background:var(--df-accent);border-color:var(--df-accent);}
[data-donation-uid="${uid}"] .df-checkbox-text{flex:1;}
[data-donation-uid="${uid}"] .df-checkbox-label{font-size:13px;font-weight:600;color:var(--df-text);margin-bottom:3px;}
[data-donation-uid="${uid}"] .df-checkbox-desc{font-size:12px;color:var(--df-text2);line-height:1.5;}

/* Payment */
[data-donation-uid="${uid}"] .df-payment-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;}
[data-donation-uid="${uid}"] .df-payment-btn{padding:16px;border-radius:var(--df-radius-sm);border:1px solid var(--df-border);background:var(--df-surface2);color:var(--df-text);font-size:14px;font-weight:600;cursor:pointer;transition:all .2s;text-align:center;}
[data-donation-uid="${uid}"] .df-payment-btn:hover{border-color:var(--df-accent);transform:translateY(-2px);}
[data-donation-uid="${uid}"] .df-payment-btn.selected{border-color:var(--df-accent);background:rgba(255,193,7,.12);color:#ffc107;box-shadow:0 4px 16px rgba(255,193,7,.3);}
[data-donation-uid="${uid}"] .df-payment-btn.auto-selected{border-color:var(--df-gold);background:rgba(255,193,7,.12);position:relative;}
[data-donation-uid="${uid}"] .df-payment-btn.auto-selected::after{content:'Recommended';position:absolute;top:-8px;right:-8px;background:var(--df-gold);color:var(--df-bg);font-size:10px;font-weight:700;padding:2px 8px;border-radius:100px;letter-spacing:.5px;}

/* Form */
[data-donation-uid="${uid}"] .df-form-field{margin-bottom:14px;}
[data-donation-uid="${uid}"] .df-form-label{display:block;font-size:13px;font-weight:600;color:var(--df-text);margin-bottom:6px;}
[data-donation-uid="${uid}"] .df-form-input,[data-donation-uid="${uid}"] .df-form-select,[data-donation-uid="${uid}"] .df-form-textarea{width:100%;padding:12px 14px;border-radius:var(--df-radius-sm);border:1px solid var(--df-border);background:var(--df-surface2);color:var(--df-text);font-family:'DM Sans',sans-serif;font-size:14px;outline:none;transition:all .2s;}
[data-donation-uid="${uid}"] .df-form-input::placeholder,[data-donation-uid="${uid}"] .df-form-textarea::placeholder{color:var(--df-text3);}
[data-donation-uid="${uid}"] .df-form-input:focus,[data-donation-uid="${uid}"] .df-form-select:focus,[data-donation-uid="${uid}"] .df-form-textarea:focus{border-color:var(--df-accent);background:rgba(255,193,7,.08);}
[data-donation-uid="${uid}"] .df-form-input.error,[data-donation-uid="${uid}"] .df-form-select.error{border-color:#f87171;}
[data-donation-uid="${uid}"] .df-form-input.valid,[data-donation-uid="${uid}"] .df-form-select.valid{border-color:var(--df-success);}
[data-donation-uid="${uid}"] .df-form-textarea{min-height:80px;resize:vertical;}
[data-donation-uid="${uid}"] .df-field-error{font-size:12px;color:#f87171;margin-top:6px;opacity:0;max-height:0;overflow:hidden;transition:all .3s;}
[data-donation-uid="${uid}"] .df-field-error.visible{opacity:1;max-height:40px;}
[data-donation-uid="${uid}"] .df-anon-hidden{opacity:.4;pointer-events:none;}
[data-donation-uid="${uid}"] .df-form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;}

/* Summary */
[data-donation-uid="${uid}"] .df-summary-panel{background:var(--df-surface);border:1px solid var(--df-border);border-radius:var(--df-radius);padding:20px;}
[data-donation-uid="${uid}"] .df-summary-title{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;margin-bottom:18px;color:var(--df-text);}
[data-donation-uid="${uid}"] .df-summary-row{display:flex;justify-content:space-between;margin-bottom:12px;font-size:14px;}
[data-donation-uid="${uid}"] .df-summary-label{color:var(--df-text2);}
[data-donation-uid="${uid}"] .df-summary-value{font-weight:600;color:var(--df-text);font-family:'DM Mono',monospace;}
[data-donation-uid="${uid}"] .df-summary-divider{height:1px;background:var(--df-border);margin:16px 0;}
[data-donation-uid="${uid}"] .df-summary-total{display:flex;justify-content:space-between;font-size:18px;font-weight:700;}
[data-donation-uid="${uid}"] .df-summary-total .df-summary-value{color:#ffc107;font-size:22px;}
[data-donation-uid="${uid}"] .df-donate-btn{width:100%;padding:16px;border-radius:var(--df-radius-sm);border:none;background:linear-gradient(135deg,var(--df-accent),var(--df-accent2));color:white;font-family:'DM Sans',sans-serif;font-size:16px;font-weight:700;cursor:pointer;margin-top:20px;transition:all .3s;}
[data-donation-uid="${uid}"] .df-donate-btn:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(255,193,7,.4);}
[data-donation-uid="${uid}"] .df-donate-btn:disabled{opacity:.5;cursor:not-allowed;transform:none;}

/* Overlays */
[data-donation-uid="${uid}"] .df-overlay{position:fixed;inset:0;background:rgba(15,27,46,.95);display:flex;align-items:center;justify-content:center;z-index:9999;opacity:0;pointer-events:none;transition:opacity .5s;padding:20px;}
[data-donation-uid="${uid}"] .df-overlay.show{opacity:1;pointer-events:all;}
[data-donation-uid="${uid}"] .df-processing-inner{text-align:center;}
[data-donation-uid="${uid}"] .df-spinner{width:60px;height:60px;border:3px solid rgba(74,108,247,.3);border-top-color:var(--df-accent);border-radius:50%;margin:0 auto 20px;animation:df-spin .8s linear infinite;}
[data-donation-uid="${uid}"] .df-processing-msg{font-size:16px;font-weight:600;color:var(--df-text);}
[data-donation-uid="${uid}"] .df-success-card{background:var(--df-surface);border:1px solid var(--df-border);border-radius:var(--df-radius);padding:40px;max-width:500px;text-align:center;}
[data-donation-uid="${uid}"] .df-success-icon{width:80px;height:80px;background:linear-gradient(135deg,var(--df-accent),var(--df-accent2));border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 24px;font-size:40px;}
[data-donation-uid="${uid}"] .df-success-title{font-family:'Playfair Display',serif;font-size:28px;font-weight:700;margin-bottom:12px;}
[data-donation-uid="${uid}"] .df-success-msg{color:var(--df-text2);font-size:15px;line-height:1.6;margin-bottom:28px;}
[data-donation-uid="${uid}"] .df-success-btn{padding:14px 32px;border-radius:var(--df-radius-sm);border:none;background:linear-gradient(135deg,var(--df-accent),var(--df-accent2));color:white;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:600;cursor:pointer;transition:all .3s;}
[data-donation-uid="${uid}"] .df-success-btn:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(255,193,7,.4);}

@keyframes df-spin{to{transform:rotate(360deg);}}
@media(max-width:640px){
  [data-donation-uid="${uid}"] .df-amount-grid{grid-template-columns:repeat(2,1fr);}
  [data-donation-uid="${uid}"] .df-payment-grid{grid-template-columns:1fr;}
  [data-donation-uid="${uid}"] .df-form-row{grid-template-columns:1fr;}
}
    `;
    const style = document.createElement('style');
    style.dataset.donationUid = uid;
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ─── HTML TEMPLATE ────────────────────────────────────────────────────────
  function buildHTML(uid) {
    return `
<div data-donation-uid="${uid}">
<div class="df-wrap">
  <!-- Progress -->
  <div class="df-progress-track">
    <div class="df-progress-fill" id="df-progress-${uid}"></div>
  </div>

  <!-- Section 1: Currency -->
  <div class="df-section-card active" id="df-sec-1-${uid}">
    <div class="df-section-header">
      <div class="df-section-num">1</div>
      <div class="df-section-title-wrap">
        <div class="df-section-title">Choose Currency</div>
        <div class="df-section-subtitle">Select your preferred currency</div>
      </div>
      <span class="df-section-preview" id="df-prev-1-${uid}"></span>
    </div>
    <div class="df-section-divider"></div>
    <div class="df-section-body open" id="df-body-1-${uid}">
      <div class="df-btn-group" id="df-currency-group-${uid}">
        <button class="df-toggle-btn selected" data-currency="USD">USD $</button>
        <button class="df-toggle-btn" data-currency="EUR">EUR €</button>
        <button class="df-toggle-btn" data-currency="GBP">GBP £</button>
        <button class="df-toggle-btn" data-currency="INR">INR ₹</button>
      </div>
    </div>
  </div>

  <!-- Section 2: Donation Type -->
  <div class="df-section-card locked" id="df-sec-2-${uid}">
    <div class="df-section-header">
      <div class="df-section-num">2</div>
      <div class="df-section-title-wrap">
        <div class="df-section-title">Donation Type</div>
        <div class="df-section-subtitle">One-time or recurring support</div>
      </div>
      <span class="df-section-preview" id="df-prev-2-${uid}"></span>
      <span class="df-lock-icon" id="df-lock-2-${uid}">🔒</span>
    </div>
    <div class="df-section-divider"></div>
    <div class="df-section-body" id="df-body-2-${uid}">
      <div class="df-btn-group" id="df-type-group-${uid}">
        <button class="df-toggle-btn selected" data-type="One-time">One-time</button>
        <button class="df-toggle-btn" data-type="Recurring">Recurring</button>
      </div>
      <div class="df-freq-wrap" id="df-recurring-opts-${uid}">
        <label class="df-freq-label">Choose Frequency</label>
        <div class="df-freq-group" id="df-freq-group-${uid}">
          <button class="df-freq-btn selected" data-freq="Monthly">Monthly</button>
          <button class="df-freq-btn" data-freq="Quarterly">Quarterly</button>
          <button class="df-freq-btn" data-freq="Yearly">Yearly</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Section 3: Amount -->
  <div class="df-section-card locked" id="df-sec-3-${uid}">
    <div class="df-section-header">
      <div class="df-section-num">3</div>
      <div class="df-section-title-wrap">
        <div class="df-section-title">Choose Amount</div>
        <div class="df-section-subtitle">Select or enter custom amount</div>
      </div>
      <span class="df-section-preview" id="df-prev-3-${uid}"></span>
      <span class="df-lock-icon" id="df-lock-3-${uid}">🔒</span>
    </div>
    <div class="df-section-divider"></div>
    <div class="df-section-body" id="df-body-3-${uid}">
      <div class="df-amount-grid" id="df-amount-grid-${uid}"></div>
      <div class="df-custom-wrap">
        <span class="df-currency-sym" id="df-custom-sym-${uid}">$</span>
        <input type="number" class="df-custom-input" id="df-custom-amount-${uid}" placeholder="Custom amount">
      </div>
      <div class="df-fee-section">
        <div class="df-checkbox-row" id="df-fee-row-${uid}">
          <div class="df-checkbox-box" id="df-fee-toggle-${uid}"></div>
          <div class="df-checkbox-text">
            <div class="df-checkbox-label">Cover transaction fees (+4.5%)</div>
            <div class="df-checkbox-desc">Help us keep 100% of your donation</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Section 4: Payment Method -->
  <div class="df-section-card locked" id="df-sec-4-${uid}">
    <div class="df-section-header">
      <div class="df-section-num">4</div>
      <div class="df-section-title-wrap">
        <div class="df-section-title">Payment Method</div>
        <div class="df-section-subtitle">Recommended based on your selection</div>
      </div>
      <span class="df-section-preview" id="df-prev-4-${uid}"></span>
      <span class="df-lock-icon" id="df-lock-4-${uid}">🔒</span>
    </div>
    <div class="df-section-divider"></div>
    <div class="df-section-body" id="df-body-4-${uid}">
      <div class="df-payment-grid" id="df-payment-grid-${uid}"></div>
    </div>
  </div>

  <!-- Section 5: Donor Info -->
  <div class="df-section-card locked" id="df-sec-5-${uid}">
    <div class="df-section-header">
      <div class="df-section-num">5</div>
      <div class="df-section-title-wrap">
        <div class="df-section-title">Your Information</div>
        <div class="df-section-subtitle">Help us stay connected</div>
      </div>
      <span class="df-section-preview" id="df-prev-5-${uid}"></span>
      <span class="df-lock-icon" id="df-lock-5-${uid}">🔒</span>
    </div>
    <div class="df-section-divider"></div>
    <div class="df-section-body" id="df-body-5-${uid}">
      <div style="margin-bottom:16px;">
        <div class="df-checkbox-row" id="df-anon-row-${uid}">
          <div class="df-checkbox-box" id="df-anon-box-${uid}"></div>
          <div class="df-checkbox-text">
            <div class="df-checkbox-label">Make this donation anonymous</div>
            <div class="df-checkbox-desc" id="df-anon-hint-${uid}">Your information will be kept private</div>
          </div>
        </div>
      </div>
      <div id="df-donor-fields-${uid}">
        <div class="df-form-row">
          <div class="df-form-field">
            <label class="df-form-label">First Name</label>
            <input type="text" class="df-form-input" id="df-firstName-${uid}">
          </div>
          <div class="df-form-field">
            <label class="df-form-label">Last Name</label>
            <input type="text" class="df-form-input" id="df-lastName-${uid}">
          </div>
        </div>
        <div class="df-form-field">
          <label class="df-form-label">Email</label>
          <input type="email" class="df-form-input" id="df-email-${uid}">
          <div class="df-field-error" id="df-emailError-${uid}">Please enter a valid email address</div>
        </div>
        <div class="df-form-field">
          <label class="df-form-label">Phone (Optional)</label>
          <input type="tel" class="df-form-input" id="df-phone-${uid}" placeholder="+1 234 567 8900">
          <div class="df-field-error" id="df-phoneError-${uid}">Please enter a valid phone number</div>
        </div>
        <div class="df-form-field">
          <label class="df-form-label">Country</label>
          <select class="df-form-select" id="df-country-${uid}">
            <option value="">Select country</option>
            <option value="US">United States</option>
            <option value="GB">United Kingdom</option>
            <option value="CA">Canada</option>
            <option value="AU">Australia</option>
            <option value="IN">India</option>
            <option value="DE">Germany</option>
            <option value="FR">France</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div class="df-form-field">
          <label class="df-form-label">Message (Optional)</label>
          <textarea class="df-form-textarea" id="df-message-${uid}" placeholder="Share why you're supporting us..."></textarea>
        </div>
      </div>
    </div>
  </div>

  <!-- Section 6: Final Steps -->
  <div class="df-section-card locked" id="df-sec-6-${uid}">
    <div class="df-section-header">
      <div class="df-section-num">6</div>
      <div class="df-section-title-wrap">
        <div class="df-section-title">Final Steps</div>
        <div class="df-section-subtitle">Review and confirm</div>
      </div>
      <span class="df-section-preview" id="df-prev-6-${uid}"></span>
      <span class="df-lock-icon" id="df-lock-6-${uid}">🔒</span>
    </div>
    <div class="df-section-divider"></div>
    <div class="df-section-body" id="df-body-6-${uid}">
      <div style="margin-bottom:14px;">
        <div class="df-checkbox-row" id="df-updates-row-${uid}">
          <div class="df-checkbox-box" id="df-cb-updates-${uid}"></div>
          <div class="df-checkbox-text">
            <div class="df-checkbox-label">Send me updates</div>
            <div class="df-checkbox-desc">Receive email updates about our work</div>
          </div>
        </div>
      </div>
      <div>
        <div class="df-checkbox-row" id="df-terms-row-${uid}">
          <div class="df-checkbox-box" id="df-cb-terms-${uid}" style="border-color:#f87171"></div>
          <div class="df-checkbox-text">
            <div class="df-checkbox-label">I agree to the terms &amp; conditions</div>
            <div class="df-checkbox-desc">Required to complete your donation</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Section 7: Review & Donate -->
  <div class="df-section-card locked" id="df-sec-7-${uid}">
    <div class="df-section-header">
      <div class="df-section-num">7</div>
      <div class="df-section-title-wrap">
        <div class="df-section-title">Review &amp; Donate</div>
        <div class="df-section-subtitle">Complete your contribution</div>
      </div>
      <span class="df-lock-icon" id="df-lock-7-${uid}">🔒</span>
    </div>
    <div class="df-section-divider"></div>
    <div class="df-section-body" id="df-body-7-${uid}">
      <div class="df-summary-panel">
        <div class="df-summary-title">Donation Summary</div>
        <div class="df-summary-row">
          <span class="df-summary-label">Amount</span>
          <span class="df-summary-value" id="df-sum-amount-${uid}">—</span>
        </div>
        <div class="df-summary-row">
          <span class="df-summary-label">Frequency</span>
          <span class="df-summary-value" id="df-sum-freq-${uid}">—</span>
        </div>
        <div class="df-summary-row">
          <span class="df-summary-label">Payment Method</span>
          <span class="df-summary-value" id="df-sum-method-${uid}">—</span>
        </div>
        <div class="df-summary-row">
          <span class="df-summary-label">Transaction Fee</span>
          <span class="df-summary-value" id="df-sum-fee-${uid}">$0.00</span>
        </div>
        <div class="df-summary-divider"></div>
        <div class="df-summary-total">
          <span class="df-summary-label">Total</span>
          <span class="df-summary-value" id="df-sum-total-${uid}">$0.00</span>
        </div>
        <button class="df-donate-btn" id="df-donate-btn-${uid}">Complete Donation</button>
      </div>
    </div>
  </div>
</div>

<!-- Processing overlay -->
<div class="df-overlay" id="df-processing-${uid}" style="z-index:9998;">
  <div class="df-processing-inner">
    <div class="df-spinner"></div>
    <div class="df-processing-msg" id="df-processing-msg-${uid}">Processing payment…</div>
  </div>
</div>

<!-- Success overlay -->
<div class="df-overlay" id="df-success-${uid}">
  <div class="df-success-card">
    <div class="df-success-icon">✓</div>
    <div class="df-success-title">Thank You!</div>
    <div class="df-success-msg" id="df-success-msg-${uid}">Your donation has been received.</div>
    <button class="df-success-btn" id="df-success-btn-${uid}">Make Another Donation</button>
  </div>
</div>
</div>
    `;
  }

  // ─── INSTANCE LOGIC ───────────────────────────────────────────────────────
  function createInstance(container, config) {
    const uid = Math.random().toString(36).slice(2, 8);
    injectStyles(uid);
    container.innerHTML = buildHTML(uid);

    // Config defaults
    const CFG = Object.assign({
      orgName: 'Our Organization',
      razorpayLink: '',
      paypalUsername: '',
      dodoPaymentLink: '',
      wiseUsername: '',
      emailjsServiceId: '',
      emailjsTemplateId: '',
      emailjsPublicKey: '',
    }, config);

    // State
    const state = {
      currency: 'USD',
      donationType: 'One-time',
      recurringFrequency: 'Monthly',
      amount: null,
      customAmount: null,
      coverFee: false,
      paymentMethod: null,
      firstName: '', lastName: '', email: '', country: '',
      updates: false, terms: false, anon: false,
      completedSections: new Set()
    };

    const currencyData = {
      USD: { symbol: '$', presets: [2, 5, 10, 50, 100] },
      EUR: { symbol: '€', presets: [2, 5, 10, 50, 100] },
      GBP: { symbol: '£', presets: [2, 5, 10, 50, 100] },
      INR: { symbol: '₹', presets: [50, 100, 200, 500, 1000] }
    };

    // DOM helpers
    const $ = id => document.getElementById(id + '-' + uid);
    const $$ = sel => container.querySelectorAll(sel);

    function getSymbol() { return (currencyData[state.currency] || currencyData.USD).symbol; }
    function formatAmount(n) { return getSymbol() + n.toLocaleString(); }

    function updateProgress() {
      $('df-progress').style.width = (state.completedSections.size / 7 * 100) + '%';
    }

    function completeSection(n) {
      const card = $('df-sec-' + n);
      const num = card.querySelector('.df-section-num');
      const lock = $('df-lock-' + n);
      state.completedSections.add(n);
      card.classList.remove('active', 'locked');
      card.classList.add('completed');
      num.innerHTML = '<span style="color:white;font-size:16px">✓</span>';
      if (lock) lock.style.display = 'none';
      card.querySelector('.df-section-header').onclick = () => toggleSection(n);
      if (n < 7) {
        const next = $('df-sec-' + (n + 1));
        const nextBody = $('df-body-' + (n + 1));
        const nextLock = $('df-lock-' + (n + 1));
        next.classList.remove('locked');
        next.classList.add('active');
        nextBody.classList.add('open');
        if (nextLock) nextLock.style.display = 'none';
        if (n + 1 === 5 && !state.anon) setTimeout(initDonorFieldStates, 100);
      }
      updateProgress();
    }

    function reactivateSection(n) {
      const card = $('df-sec-' + n);
      const num = card.querySelector('.df-section-num');
      const lock = $('df-lock-' + n);
      state.completedSections.delete(n);
      card.classList.remove('completed');
      card.classList.add('active');
      num.textContent = n;
      if (lock) lock.style.display = 'block';
      const prev = $('df-prev-' + n);
      if (prev) prev.textContent = '';
      if (n === 2) updateAmountButtons();
      updateProgress();
    }

    function toggleSection(n) {
      if (!state.completedSections.has(n)) return;
      $('df-body-' + n).classList.toggle('open');
    }

    // ── Section 1: Currency ───────────────────────────────────────────────
    $('df-currency-group').querySelectorAll('.df-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.df-toggle-btn[data-currency]').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        state.currency = btn.dataset.currency;
        state.amount = null; state.customAmount = null;
        state.donationType = 'One-time'; state.paymentMethod = null;
        $('df-prev-1').textContent = btn.dataset.currency;
        $('df-custom-sym').textContent = getSymbol();
        updateAmountButtons();
        $$('[data-type]').forEach((b, i) => b.classList.toggle('selected', i === 0));
        $('df-prev-2').textContent = '';
        $('df-recurring-opts').classList.remove('show');
        $('df-custom-amount').value = '';
        $('df-prev-3').textContent = '';
        $$('[data-method]').forEach(b => b.classList.remove('selected'));
        if (state.completedSections.has(2)) reactivateSection(2);
        if (state.completedSections.has(3)) reactivateSection(3);
        if (state.completedSections.has(4)) reactivateSection(4);
        completeSection(1);
        updatePaymentOptions();
        updateSummary();
      });
    });

    // ── Section 2: Donation Type ──────────────────────────────────────────
    $('df-type-group').querySelectorAll('.df-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('[data-type]').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        state.donationType = btn.dataset.type;
        state.amount = null; state.customAmount = null; state.paymentMethod = null;
        $$('.df-amount-btn').forEach(b => b.classList.remove('selected'));
        $('df-custom-amount').value = '';
        $('df-prev-3').textContent = '';
        $$('[data-method]').forEach(b => b.classList.remove('selected'));
        $('df-prev-4').textContent = '';
        const ro = $('df-recurring-opts');
        if (btn.dataset.type === 'Recurring') {
          ro.classList.add('show');
          state.recurringFrequency = 'Monthly';
          $$('.df-freq-btn').forEach((b, i) => b.classList.toggle('selected', i === 0));
          updateDonationTypePreview();
          completeSection(2);
        } else {
          ro.classList.remove('show');
          state.recurringFrequency = 'Monthly';
          $('df-prev-2').textContent = btn.dataset.type;
          completeSection(2);
        }
        if (state.completedSections.has(3)) reactivateSection(3);
        if (state.completedSections.has(4)) reactivateSection(4);
        updateAmountButtons();
        updatePaymentOptions();
        updateSummary();
      });
    });

    $('df-freq-group').querySelectorAll('.df-freq-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.df-freq-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        state.recurringFrequency = btn.dataset.freq;
        updateDonationTypePreview();
        updateSummary();
      });
    });

    function updateDonationTypePreview() {
      $('df-prev-2').textContent = state.donationType === 'Recurring'
        ? state.recurringFrequency + ' Recurring'
        : state.donationType;
    }

    // ── Section 3: Amount ─────────────────────────────────────────────────
    function updateAmountButtons() {
      const grid = $('df-amount-grid');
      const presets = (currencyData[state.currency] || currencyData.USD).presets;
      const disabled = !state.completedSections.has(2);
      grid.innerHTML = presets.map(amt =>
        `<button class="df-amount-btn" data-amt="${amt}" ${disabled ? 'disabled' : ''}>${formatAmount(amt)}</button>`
      ).join('');
      grid.querySelectorAll('.df-amount-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (!state.completedSections.has(2)) return;
          $$('.df-amount-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          state.amount = parseFloat(btn.dataset.amt);
          state.customAmount = null;
          $('df-custom-amount').value = '';
          $('df-prev-3').textContent = formatAmount(state.amount);
          completeSection(3);
          updatePaymentOptions();
          updateSummary();
        });
      });
      $('df-custom-amount').disabled = disabled;
    }

    $('df-custom-amount').addEventListener('input', function () {
      if (!state.completedSections.has(2)) { this.value = ''; return; }
      const val = parseFloat(this.value);
      if (!val || val <= 0) {
        if (state.completedSections.has(3)) reactivateSection(3);
        $('df-prev-3').textContent = '';
        state.amount = null; state.customAmount = null;
        updatePaymentOptions(); updateSummary(); return;
      }
      $$('.df-amount-btn').forEach(b => b.classList.remove('selected'));
      state.amount = val; state.customAmount = val;
      $('df-prev-3').textContent = formatAmount(val);
      completeSection(3);
      updatePaymentOptions();
      updateSummary();
    });

    $('df-fee-row').addEventListener('click', () => {
      const toggle = $('df-fee-toggle');
      state.coverFee = !state.coverFee;
      toggle.classList.toggle('checked', state.coverFee);
      toggle.innerHTML = state.coverFee ? '<span style="color:white;font-size:11px;font-weight:700">✓</span>' : '';
      updateSummary();
    });

    // ── Section 4: Payment Method ─────────────────────────────────────────
    function getPaymentOptions() {
      const { currency, donationType, amount } = state;
      const amt = amount || 0;
      if (currency === 'INR') return ['Razorpay'];
      if (donationType === 'Recurring') return ['Dodo Payments'];
      const threshold = currency === 'GBP' ? 40 : 50;
      return amt < threshold ? ['PayPal'] : ['Wise'];
    }

    function updatePaymentOptions() {
      const options = getPaymentOptions();
      const allMethods = {
        'Razorpay':       { icon: '🇮🇳', name: 'Razorpay' },
        'Wise':           { icon: '🌍', name: 'Wise' },
        'Dodo Payments':  { icon: '💳', name: 'Dodo Payments' },
        'PayPal':         { icon: '🌐', name: 'PayPal' }
      };
      const grid = $('df-payment-grid');
      grid.innerHTML = '';
      options.forEach(method => {
        const d = allMethods[method];
        const btn = document.createElement('button');
        btn.className = 'df-payment-btn';
        btn.dataset.method = method;
        btn.textContent = d.icon + ' ' + d.name;
        btn.addEventListener('click', () => selectPayment(btn));
        grid.appendChild(btn);
      });
      if (options.length === 1) {
        setTimeout(() => {
          const btn = grid.querySelector('.df-payment-btn');
          if (btn) selectPayment(btn);
        }, 100);
      }
    }

    function selectPayment(btn) {
      $$('.df-payment-btn').forEach(b => b.classList.remove('selected', 'auto-selected'));
      btn.classList.add('selected');
      state.paymentMethod = btn.dataset.method;
      $('df-prev-4').textContent = state.paymentMethod;
      completeSection(4);
      updateSummary();
    }

    // ── Section 5: Donor Info ─────────────────────────────────────────────
    function isValidEmail(em) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em); }

    function setFieldState(el, fstate) {
      el.classList.remove('error', 'valid');
      if (fstate === 'error') el.classList.add('error');
      else if (fstate === 'valid') el.classList.add('valid');
    }

    function initDonorFieldStates() {
      if (state.anon) return;
      ['df-firstName', 'df-lastName', 'df-country'].forEach(id => {
        const el = $(id);
        if (el && !el.value.trim()) setFieldState(el, 'error');
      });
      const emailEl = $('df-email');
      if (!emailEl.value.trim()) setFieldState(emailEl, 'error');
    }

    $('df-email').addEventListener('input', function () {
      const val = this.value.trim();
      const errEl = $('df-emailError');
      if (!val) { setFieldState(this, 'error'); errEl.classList.remove('visible'); }
      else if (isValidEmail(val)) { setFieldState(this, 'valid'); errEl.classList.remove('visible'); }
      else { setFieldState(this, 'error'); if (val.length > 4) errEl.classList.add('visible'); else errEl.classList.remove('visible'); }
      validateDonorInfo();
    });

    $('df-email').addEventListener('blur', function () {
      const val = this.value.trim();
      const errEl = $('df-emailError');
      if (!val) { setFieldState(this, 'error'); errEl.classList.remove('visible'); }
      else if (isValidEmail(val)) { setFieldState(this, 'valid'); errEl.classList.remove('visible'); }
      else { setFieldState(this, 'error'); errEl.classList.add('visible'); }
      validateDonorInfo();
    });

    ['df-firstName', 'df-lastName'].forEach(id => {
      $(id).addEventListener('input', function () {
        setFieldState(this, this.value.trim() ? 'valid' : 'error');
        validateDonorInfo();
      });
    });

    $('df-country').addEventListener('change', function () {
      setFieldState(this, this.value ? 'valid' : 'error');
      validateDonorInfo();
    });

    $('df-phone').addEventListener('input', function () {
      const val = this.value.trim();
      const errEl = $('df-phoneError');
      if (!val) { this.classList.remove('error', 'valid'); errEl.classList.remove('visible'); return; }
      if (/^[+\d\s\-().]{6,20}$/.test(val)) {
        this.classList.remove('error'); this.classList.add('valid'); errEl.classList.remove('visible');
      } else {
        this.classList.remove('valid'); this.classList.add('error');
        if (val.length > 3) errEl.classList.add('visible');
      }
    });

    function validateDonorInfo() {
      if (state.anon) return;
      const fn = $('df-firstName').value.trim();
      const ln = $('df-lastName').value.trim();
      const em = $('df-email').value.trim();
      const co = $('df-country').value;
      if (fn && ln && em && isValidEmail(em) && co) {
        state.firstName = fn; state.lastName = ln; state.email = em; state.country = co;
        $('df-prev-5').textContent = fn + ' ' + ln;
        if (!state.completedSections.has(5)) completeSection(5);
      } else {
        if (state.completedSections.has(5)) reactivateSection(5);
      }
    }

    $('df-anon-row').addEventListener('click', () => {
      state.anon = !state.anon;
      const box = $('df-anon-box');
      const fields = $('df-donor-fields');
      const hint = $('df-anon-hint');
      if (state.anon) {
        box.style.background = 'var(--df-accent)';
        box.style.borderColor = 'var(--df-accent)';
        box.innerHTML = '<span style="color:white;font-size:11px;font-weight:700">✓</span>';
        fields.classList.add('df-anon-hidden');
        hint.textContent = 'Fields below are not required for anonymous donations';
        ['df-firstName','df-lastName','df-email','df-country'].forEach(id => {
          $(''+id).classList.remove('error','valid');
        });
        $('df-emailError').classList.remove('visible');
        $('df-prev-5').textContent = 'Anonymous';
        if (!state.completedSections.has(5)) completeSection(5);
      } else {
        box.style.background = ''; box.style.borderColor = '';
        box.innerHTML = '';
        fields.classList.remove('df-anon-hidden');
        hint.textContent = 'Your information will be kept private';
        $('df-prev-5').textContent = '';
        if (state.completedSections.has(5)) reactivateSection(5);
        setTimeout(initDonorFieldStates, 50);
        validateDonorInfo();
      }
    });

    // ── Section 6: Options & Terms ────────────────────────────────────────
    function toggleOpt(key) {
      state[key] = !state[key];
      const box = $('df-cb-' + key);
      if (state[key]) {
        box.style.background = 'var(--df-accent)';
        box.style.borderColor = 'var(--df-accent)';
        box.innerHTML = '<span style="color:white;font-size:11px;font-weight:700">✓</span>';
      } else {
        box.style.background = '';
        box.style.borderColor = key === 'terms' ? '#f87171' : 'var(--df-border-active)';
        box.innerHTML = '';
      }
      if (state.terms) {
        $('df-prev-6').textContent = 'Agreed';
        if (!state.completedSections.has(6)) completeSection(6);
        if (!state.completedSections.has(7)) {
          state.completedSections.add(7);
          const card7 = $('df-sec-7');
          const num7 = card7.querySelector('.df-section-num');
          const body7 = $('df-body-7');
          card7.classList.remove('active','locked');
          card7.classList.add('completed');
          num7.innerHTML = '<span style="color:white;font-size:16px">✓</span>';
          body7.classList.add('open');
          const lock7 = $('df-lock-7');
          if (lock7) lock7.style.display = 'none';
          card7.querySelector('.df-section-header').onclick = () => toggleSection(7);
          updateProgress();
          setTimeout(() => card7.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
        }
        updateSummary();
      } else {
        $('df-prev-6').textContent = '';
        if (state.completedSections.has(6)) reactivateSection(6);
        if (state.completedSections.has(7)) {
          state.completedSections.delete(7);
          const card7 = $('df-sec-7');
          card7.classList.remove('completed');
          card7.classList.add('locked');
          card7.querySelector('.df-section-header').onclick = null;
          card7.querySelector('.df-section-num').textContent = '7';
          $('df-body-7').classList.remove('open');
          const lock7 = $('df-lock-7');
          if (lock7) lock7.style.display = 'block';
          updateProgress();
        }
      }
    }

    $('df-updates-row').addEventListener('click', () => toggleOpt('updates'));
    $('df-terms-row').addEventListener('click', () => toggleOpt('terms'));

    // ── Summary ───────────────────────────────────────────────────────────
    function getTotal() {
      const base = state.amount || 0;
      const fee = state.coverFee ? base * 0.045 : 0;
      return Math.round((base + fee) * 100) / 100;
    }
    function getFee() {
      const base = state.amount || 0;
      return state.coverFee ? Math.round(base * 0.045 * 100) / 100 : 0;
    }
    function updateSummary() {
      const sym = getSymbol();
      const base = state.amount || 0;
      $('df-sum-amount').textContent = base ? formatAmount(base) : '—';
      $('df-sum-freq').textContent = state.donationType === 'Recurring'
        ? state.recurringFrequency + ' Recurring'
        : (state.donationType || '—');
      $('df-sum-method').textContent = state.paymentMethod || '—';
      $('df-sum-fee').textContent = getFee() ? formatAmount(getFee()) : sym + '0.00';
      $('df-sum-total').textContent = getTotal() ? formatAmount(getTotal()) : sym + '0.00';
    }

    // ── Payment gateways ──────────────────────────────────────────────────
    function initiateRazorpay() {
      return new Promise(resolve => {
        const url = CFG.razorpayLink;
        if (!url) { resolve({ success: false, error: 'Razorpay link not configured.' }); return; }
        const w = window.open(url, '_blank');
        if (!w) window.location.href = url;
        resolve({ success: true, transactionId: 'razorpay-pending', pending: true });
      });
    }
    function initiatePayPal(payload) {
      return new Promise(resolve => {
        if (!CFG.paypalUsername) { resolve({ success: false, error: 'PayPal username not configured.' }); return; }
        const cur = ['USD','EUR','GBP'].includes(payload.currency) ? payload.currency : 'USD';
        const url = `https://paypal.me/${CFG.paypalUsername}/${payload.amount.toFixed(2)}${cur}`;
        const w = window.open(url, '_blank');
        if (!w) window.location.href = url;
        resolve({ success: true, transactionId: 'paypal-pending', pending: true });
      });
    }
    function initiateDodo(payload) {
      return new Promise(resolve => {
        const params = new URLSearchParams({ quantity: 1, email: payload.email || '', redirect_url: window.location.href });
        const url = `${CFG.dodoPaymentLink}?${params}`;
        const w = window.open(url, '_blank');
        if (!w) window.location.href = url;
        resolve({ success: true, transactionId: 'dodo-pending', pending: true });
      });
    }
    function initiateWise() {
      return new Promise(resolve => {
        const url = `https://wise.com/pay/${CFG.wiseUsername}`;
        const w = window.open(url, '_blank');
        if (!w) window.location.href = url;
        resolve({ success: true, transactionId: 'wise-pending', pending: true });
      });
    }
    async function initiatePayment(payload) {
      try {
        if (payload.method === 'Razorpay')      return await initiateRazorpay(payload);
        if (payload.method === 'PayPal')        return await initiatePayPal(payload);
        if (payload.method === 'Dodo Payments') return await initiateDodo(payload);
        if (payload.method === 'Wise')          return await initiateWise(payload);
        return { success: false, error: 'Unknown payment method' };
      } catch(err) {
        return { success: false, error: err.message || 'Unexpected error' };
      }
    }

    // ── EmailJS ───────────────────────────────────────────────────────────
    async function sendConfirmationEmail({ to, name, amount, currency, frequency, method, wantsUpdates, transactionId }) {
      if (typeof emailjs === 'undefined' || !to) return;
      if (!CFG.emailjsServiceId || !CFG.emailjsTemplateId) return;
      try {
        await emailjs.send(CFG.emailjsServiceId, CFG.emailjsTemplateId, {
          to_email: to, to_name: name || 'Donor',
          amount: formatAmount(amount), currency, frequency,
          payment_method: method, transaction_id: transactionId || 'N/A',
          org_name: CFG.orgName
        });
        if (wantsUpdates) console.log('[Newsletter] Subscribed:', to);
      } catch(err) { console.error('EmailJS error:', err); }
    }

    async function onPaymentSuccess(transactionId, pending) {
      const name = state.anon ? 'Anonymous' : (state.firstName + ' ' + state.lastName).trim();
      if (!state.anon && state.email) {
        sendConfirmationEmail({
          to: state.email, name: state.firstName,
          amount: getTotal(), currency: state.currency,
          frequency: state.donationType === 'Recurring' ? state.recurringFrequency : 'One-time',
          method: state.paymentMethod, wantsUpdates: state.updates, transactionId
        });
      }
      const freqText = state.donationType === 'Recurring' ? ` (${state.recurringFrequency})` : '';
      let msg = `Thank you${name ? ', ' + name : ''}! Your ${formatAmount(getTotal())}${freqText} donation`;
      if (pending) {
        msg += ' is being processed. Please complete the payment in the new tab — we\'ll send a confirmation once received.';
      } else {
        msg += ' has been received. Together we\'re making a difference.';
        if (!state.anon && state.email) msg += ` A confirmation has been sent to ${state.email}.`;
      }
      $('df-success-msg').textContent = msg;
      $('df-success').classList.add('show');
    }

    // ── Complete Donation ─────────────────────────────────────────────────
    $('df-donate-btn').addEventListener('click', async () => {
      if (!state.amount || state.amount <= 0) { alert('Please enter a valid donation amount'); return; }
      const required = [1,2,3,4,5,6];
      if (!required.every(n => state.completedSections.has(n))) {
        const names = {1:'Choose Currency',2:'Donation Type',3:'Choose Amount',4:'Payment Method',5:'Your Information',6:'Terms & Conditions'};
        const missing = required.find(n => !state.completedSections.has(n));
        alert('Please complete: ' + names[missing]);
        return;
      }
      const btn = $('df-donate-btn');
      btn.disabled = true; btn.textContent = 'Processing…';
      const result = await initiatePayment({
        method: state.paymentMethod, amount: getTotal(), currency: state.currency,
        name: state.anon ? 'Anonymous' : (state.firstName + ' ' + state.lastName).trim(),
        email: state.email, phone: $('df-phone').value.trim(),
        recurring: state.donationType === 'Recurring', frequency: state.recurringFrequency
      });
      btn.disabled = false; btn.textContent = 'Complete Donation';
      if (result.success) {
        $('df-processing').classList.remove('show');
        await onPaymentSuccess(result.transactionId || 'demo', result.pending || false);
      } else {
        $('df-processing').classList.remove('show');
        if (result.error && result.error !== 'Payment cancelled') alert('Payment failed: ' + result.error);
      }
    });

    // ── Reset ─────────────────────────────────────────────────────────────
    $('df-success-btn').addEventListener('click', () => {
      $('df-success').classList.remove('show');
      Object.assign(state, {
        currency:'USD', donationType:'One-time', recurringFrequency:'Monthly',
        amount:null, customAmount:null, coverFee:false, paymentMethod:null,
        firstName:'', lastName:'', email:'', country:'',
        updates:false, terms:false, anon:false,
        completedSections: new Set()
      });
      $('df-recurring-opts').classList.remove('show');
      $$('.df-freq-btn').forEach((b,i) => b.classList.toggle('selected', i===0));
      $$('[data-currency]').forEach((b,i) => b.classList.toggle('selected', i===0));
      $$('[data-type]').forEach((b,i) => b.classList.toggle('selected', i===0));
      updateAmountButtons();
      const feeToggle = $('df-fee-toggle');
      feeToggle.classList.remove('checked'); feeToggle.innerHTML = '';
      $$('[data-method]').forEach(b => b.classList.remove('selected','auto-selected'));
      ['df-firstName','df-lastName','df-email','df-phone','df-message'].forEach(id => {
        const el = $(id);
        if (el) { el.value=''; el.classList.remove('error','valid'); }
      });
      $('df-phoneError').classList.remove('visible');
      $('df-country').value = '';
      ['df-firstName','df-lastName','df-email','df-country'].forEach(id => {
        $(id).classList.remove('error','valid');
      });
      const anonBox = $('df-anon-box');
      anonBox.innerHTML = ''; anonBox.style = '';
      $('df-donor-fields').classList.remove('df-anon-hidden');
      $('df-anon-hint').textContent = 'Your information will be kept private';
      $('df-emailError').classList.remove('visible');
      ['updates','terms'].forEach(k => {
        const box = $('df-cb-' + k);
        box.innerHTML = ''; box.style = '';
        if (k === 'terms') box.style.borderColor = '#f87171';
      });
      for (let n = 1; n <= 7; n++) {
        const card = $('df-sec-' + n);
        const num = card.querySelector('.df-section-num');
        const body = $('df-body-' + n);
        const lock = $('df-lock-' + n);
        const prev = $('df-prev-' + n);
        num.textContent = n;
        if (prev) prev.textContent = '';
        card.querySelector('.df-section-header').onclick = null;
        if (n === 1) {
          card.className = 'df-section-card active';
          body.classList.add('open');
          if (lock) lock.style.display = 'none';
        } else {
          card.className = 'df-section-card locked';
          body.classList.remove('open');
          if (lock) lock.style.display = 'block';
        }
      }
      $('df-custom-sym').textContent = '$';
      updateProgress(); updateSummary();
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // ── Init ──────────────────────────────────────────────────────────────
    updateAmountButtons();
    updateSummary();
    updateProgress();

    // Init EmailJS
    injectEmailJS(() => {
      if (CFG.emailjsPublicKey && typeof emailjs !== 'undefined') {
        emailjs.init({ publicKey: CFG.emailjsPublicKey });
      }
    });
  }

  // ─── PUBLIC API ───────────────────────────────────────────────────────────
  const DonationForm = {
    /**
     * Initialize a donation form widget.
     * @param {Object} options
     * @param {string|Element} options.container  - CSS selector or DOM element
     * @param {string} [options.orgName]          - Organization name (for emails)
     * @param {string} [options.razorpayLink]     - Razorpay payment link URL
     * @param {string} [options.paypalUsername]   - PayPal.me username
     * @param {string} [options.dodoPaymentLink]  - Dodo Payments hosted checkout URL
     * @param {string} [options.wiseUsername]     - Wise pay username
     * @param {string} [options.emailjsServiceId]  - EmailJS service ID
     * @param {string} [options.emailjsTemplateId] - EmailJS template ID
     * @param {string} [options.emailjsPublicKey]  - EmailJS public key
     */
    init(options) {
      if (!options || !options.container) {
        console.error('[DonationForm] options.container is required');
        return;
      }
      injectFonts();
      const el = typeof options.container === 'string'
        ? document.querySelector(options.container)
        : options.container;
      if (!el) { console.error('[DonationForm] Container not found:', options.container); return; }
      createInstance(el, options);
    }
  };

  // Expose globally
  global.DonationForm = DonationForm;

  // Support CommonJS / ES module bundlers too
  if (typeof module !== 'undefined' && module.exports) module.exports = DonationForm;
  if (typeof define === 'function' && define.amd) define([], () => DonationForm);

}(typeof window !== 'undefined' ? window : this));
