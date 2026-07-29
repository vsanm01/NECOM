/**
 * donation-panel.js
 * -------------------------------------------------------
 * Self-contained donation panel module for WAGS Studio.
 * Injects its own <style>, its own markup, and all of its
 * interactive logic. Drop this file in via a single
 * <script src="donation-panel.js"></script> tag.
 *
 * Expects one mount point in the host page:
 *   <div id="donationPanelMount"></div>
 * placed where the donation panel should appear (inside
 * the `.main` grid, as a sibling of `.hero`).
 *
 * Overlays (processing / success) are appended to <body>
 * automatically and don't need a mount point.
 * -------------------------------------------------------
 */

/* ============================================================
   1. STYLES — injected into <head>
   ============================================================ */
(function injectDonationPanelStyles() {
  const style = document.createElement('style');
  style.id = 'donation-panel-styles';
  style.textContent = `
/* ===== DONATION PANEL (RIGHT) ===== */
.donation-panel {
  background: var(--bg);
  border-left: none;
  overflow-y: auto;
  max-height: calc(100vh - var(--panel-offset, 94px) - 56px); /* ticker + navbar + fixed footer */
  position: sticky;
  top: 60px; /* navbar height */
  margin: 24px 40px 24px 0;
  border-radius: 16px;
  box-shadow: 0 4px 32px rgba(0,0,0,0.18);
}
/* scrollbar styling */
.donation-panel::-webkit-scrollbar { width: 4px; }
.donation-panel::-webkit-scrollbar-track { background: transparent; }
.donation-panel::-webkit-scrollbar-thumb { background: rgba(255,212,0,0.25); border-radius: 4px; }

/* ===== DONATION WIDGET STYLES (all scoped) ===== */
.page-wrap {
  max-width: 100%;
  margin: 0;
  padding: 20px 24px 36px 24px;
}
.page-header {
  text-align: center;
  margin-bottom: 14px;
  padding-left: 0;
}
.page-header .badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255,212,0,0.1);
  border: 1px solid rgba(255,212,0,0.3);
  color: #b08800;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  padding: 3px 10px;
  border-radius: 100px;
  margin-bottom: 6px;
}
.page-header h1 {
  font-family: 'Playfair Display', serif;
  font-size: clamp(18px, 3.5vw, 24px);
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 4px;
  color: var(--text);
  background: linear-gradient(135deg, #1a1a1a 0%, #7a5c00 60%, #ffd400 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.page-header p {
  color: var(--text2);
  font-size: 12px;
  line-height: 1.4;
}
.progress-track {
  background: var(--surface2);
  border-radius: 100px;
  height: 3px;
  margin-bottom: 10px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffd400, #ffb700);
  border-radius: 100px;
  transition: width 0.5s cubic-bezier(0.4,0,0.2,1);
  width: 0%;
}
.section-card {
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: var(--radius);
  margin-bottom: 4px;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4,0,0.2,1);
  position: relative;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.section-card.active { border-color: var(--accent); box-shadow: 0 0 0 2px rgba(255,212,0,0.3), 0 8px 32px rgba(255,212,0,0.18); }
.section-card.completed { border-color: rgba(22,163,74,0.4); }
.section-card.locked { background: var(--locked); border-color: var(--border); box-shadow: none; }
.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  min-height: 48px;
  cursor: default;
}
.section-card.completed .section-header { cursor: pointer; }
.section-card.completed .section-header::after { content: 'Edit'; font-size: 11px; font-weight: 500; color: #7a8aaa; margin-left: auto; padding-right: 4px; text-transform: uppercase; letter-spacing: .4px; }
.section-num {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  font-family: 'DM Mono', monospace;
  flex-shrink: 0;
  transition: all 0.3s;
}
.active .section-num { background: linear-gradient(135deg, #ffd400, #ffb700); color: #1a1a1a; box-shadow: 0 2px 12px rgba(255,212,0,0.55); }
.completed .section-num { background: var(--success); color: white; }
.locked .section-num { background: #eeeeee; color: var(--locked-text); border: 1px solid var(--border); }
.section-title-wrap { flex: 1; }
.section-title { font-weight: 600; font-size: 13px; color: var(--text); transition: color 0.3s; }
.locked .section-title { color: var(--text3); }
.section-subtitle { font-size: 11px; color: var(--text2); margin-top: 1px; transition: color 0.3s; }
.locked .section-subtitle { color: var(--locked-text); }
.section-preview {
  font-size: 10px;
  font-weight: 600;
  color: #ffd400;
  font-family: 'DM Mono', monospace;
  text-align: right;
  flex-shrink: 0;
  background: #1a2744;
  border: 1px solid #ffd400;
  border-radius: 4px;
  padding: 1px 5px;
  line-height: 1.4;
  display: none;
}
.section-card.completed .section-preview:not(:empty) { display: inline-block; }
.section-card.locked .section-preview { display: none; }
.lock-icon { color: var(--text3); font-size: 14px; }
.section-body { padding: 0 12px; max-height: 0; overflow: hidden; transition: max-height 0.5s cubic-bezier(0.4,0,0.2,1), padding 0.3s; }
.section-body.open { max-height: 1500px; padding: 0 12px 12px; overflow: visible; }
.section-divider { height: 1px; background: var(--border); margin: 0 12px; transition: opacity 0.3s; }
.locked .section-divider { opacity: 0; }
.currency-group { display: flex; gap: 8px; padding-top: 2px; }
.currency-btn {
  flex: 1; padding: 7px; border-radius: var(--radius-sm); border: 1px solid #ffd400; background: #ffd400; color: #1a2744;
  font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; text-align: center;
}
.currency-btn:hover { background: #ffb700; border-color: #1a2744; color: #1a2744; }
.currency-btn.selected { border: 1px solid #1a2744; background: #ffd400; color: #1a2744; font-weight: 600; box-shadow: none; }
.toggle-group { display: flex; background: transparent; border-radius: var(--radius-sm); padding: 0; gap: 6px; margin-top: 2px; }
.toggle-btn {
  flex: 1; padding: 6px; border-radius: 6px; border: 1px solid #ffd400; background: #ffd400; color: #1a2744;
  font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s;
}
.toggle-btn:hover { background: #ffb700; border-color: #1a2744; color: #1a2744; }
.toggle-btn.selected { background: #ffd400; border: 1px solid #1a2744; color: #1a2744; font-weight: 600; box-shadow: none; }
.recurring-frequency {
  margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border);
  max-height: 0; overflow: hidden; opacity: 0; transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
}
.recurring-frequency.show { max-height: 200px; opacity: 1; }
.freq-label { font-size: 12px; color: var(--text2); margin-bottom: 8px; display: block; }
.freq-group { display: flex; gap: 8px; }
.freq-btn {
  flex: 1; padding: 7px 10px; border-radius: var(--radius-sm); border: 1px solid #ffd400; background: #ffd400; color: #1a2744;
  font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; text-align: center;
}
.freq-btn:hover { background: #ffb700; border-color: #1a2744; color: #1a2744; }
.freq-btn.selected { border: 1px solid #1a2744; background: #ffd400; color: #1a2744; font-weight: 600; box-shadow: none; }
/* tick marks added via JS only after user interaction */
.amount-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 10px; }
.amount-btn {
  padding: 9px; border-radius: var(--radius-sm); border: 1px solid #ffd400; background: #ffd400; color: #1a2744;
  font-size: 16px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.2s;
}
.amount-btn:hover { background: #ffb700; border-color: #1a2744; color: #1a2744; transform: translateY(-2px); }
.amount-btn.selected { border: 1px solid #1a2744; background: #ffd400; color: #1a2744; box-shadow: none; }
.custom-amount-wrap { position: relative; }
.currency-symbol { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 15px; font-weight: 600; color: var(--text2); font-family: 'DM Mono', monospace; pointer-events: none; }
.custom-amount {
  width: 100%; padding: 10px 12px 10px 32px; border-radius: var(--radius-sm); border: 1px solid var(--border);
  background: var(--surface2); color: var(--text); font-size: 15px; font-weight: 600; font-family: 'DM Mono', monospace; outline: none; transition: all 0.2s;
}
.custom-amount::placeholder { color: var(--text3); font-family: 'DM Sans', sans-serif; }
.custom-amount:focus { border-color: var(--accent); background: rgba(255,212,0,0.05); box-shadow: 0 0 0 3px rgba(255,212,0,0.15); }
.fee-section { background: rgba(255,212,0,0.05); border: 1px solid rgba(255,212,0,0.25); border-radius: var(--radius-sm); padding: 10px; margin-top: 8px; }
.fee-checkbox { display: flex; align-items: flex-start; gap: 12px; cursor: pointer; }
.checkbox-box { width: 20px; height: 20px; border: 2px solid #1a2744; border-radius: 5px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; transition: all 0.2s; }
.checkbox-toggle { width: 20px; height: 20px; border: 2px solid #1a2744; border-radius: 5px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; transition: all 0.2s; }
.checkbox-toggle.checked { background: #1a2744; border-color: #1a2744; }
.checkbox-text { flex: 1; }
.checkbox-label { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 3px; }
.checkbox-desc { font-size: 12px; color: var(--text2); line-height: 1.5; }
.payment-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; overflow: visible; padding-top: 6px; }
.payment-btn {
  padding: 16px 12px; border-radius: 16px; border: 2px solid #e5e5e5; background: #ffffff; color: #1a1a1a;
  cursor: pointer; transition: all 0.2s; text-align: center; position: relative;
  display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 78px; width: 100%;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.payment-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.12); }
.payment-btn.selected::before {
  content: '✓'; position: absolute; top: 8px; left: 10px; width: 20px; height: 20px; border-radius: 50%;
  background: #1a2744; color: #fff; font-size: 12px; font-weight: 800; line-height: 1;
  display: flex; align-items: center; justify-content: center;
}
.payment-btn.auto-selected { position: relative; }
.payment-btn.auto-selected::after { content: 'Recommended'; position: absolute; top: -9px; right: -9px; background: #1a2744; color: #ffd400; font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 100px; letter-spacing: 0.5px; font-family: 'DM Sans', sans-serif; }
.pm-logo { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; flex-wrap: nowrap; }
.pm-icon { flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.pm-word { line-height: 1.05; }

/* Razorpay: official logo, per razorpay.com branding */
.payment-btn[data-method="Razorpay"] { border-color: #e5e5e5; }
.payment-btn[data-method="Razorpay"] .pm-icon-razorpay { display: flex; align-items: center; height: 20px; width: auto; }
.payment-btn[data-method="Razorpay"] .pm-icon-razorpay svg { height: 20px; width: auto; display: block; }
.payment-btn[data-method="Razorpay"]:hover,
.payment-btn[data-method="Razorpay"].selected,
.payment-btn[data-method="Razorpay"].auto-selected { border-color: #0C2451; box-shadow: 0 0 0 2px rgba(12,36,81,0.15); }

/* Wise: official logo mark, matching wise.com branding */
.payment-btn[data-method="Wise"] { background: #9FE870; border-color: #9FE870; }
.payment-btn[data-method="Wise"] .pm-icon-wise { display: flex; align-items: center; height: 22px; width: auto; }
.payment-btn[data-method="Wise"] .pm-icon-wise svg { height: 22px; width: auto; display: block; }
.payment-btn[data-method="Wise"]:hover { background: #8FE05A; border-color: #8FE05A; }
.payment-btn[data-method="Wise"].selected,
.payment-btn[data-method="Wise"].auto-selected { border-color: #062603; box-shadow: 0 0 0 2px rgba(6,38,3,0.25); }
.payment-btn[data-method="Wise"].selected::before { background: #062603; }

/* Dodo Payments: official logo image */
.payment-btn[data-method="Dodo Payments"] { border-color: #e5e5e5; }
.payment-btn[data-method="Dodo Payments"] .pm-logo-img-dodo { height: 24px; width: auto; display: block; }
.payment-btn[data-method="Dodo Payments"]:hover,
.payment-btn[data-method="Dodo Payments"].selected,
.payment-btn[data-method="Dodo Payments"].auto-selected { border-color: #7ab800; box-shadow: 0 0 0 2px rgba(193,241,29,0.3); }

/* PayPal: official logo mark */
.payment-btn[data-method="PayPal"] { border-color: #ffc439; }
.payment-btn[data-method="PayPal"] .pm-icon-paypal { width: 100px; height: 28px; display: flex; align-items: center; }
.payment-btn[data-method="PayPal"] .pm-icon-paypal svg { width: 100px; height: 28px; }
.payment-btn[data-method="PayPal"]:hover,
.payment-btn[data-method="PayPal"].selected,
.payment-btn[data-method="PayPal"].auto-selected { border-color: #003087; box-shadow: 0 0 0 2px rgba(0,48,135,0.15); }
@media (max-width: 420px) {
  .payment-btn[data-method="Razorpay"] .pm-icon-razorpay, .payment-btn[data-method="Razorpay"] .pm-icon-razorpay svg { height: 16px; }
  .payment-btn[data-method="Wise"] .pm-icon-wise, .payment-btn[data-method="Wise"] .pm-icon-wise svg { height: 18px; }
  .payment-btn[data-method="Dodo Payments"] .pm-logo-img-dodo { height: 20px; }
  .payment-btn[data-method="PayPal"] .pm-icon-paypal { width: 84px; height: 24px; }
  .payment-btn[data-method="PayPal"] .pm-icon-paypal svg { width: 84px; height: 24px; }
}
.form-field { margin-bottom: 12px; position: relative; }
.form-label { position: absolute; top: -8px; left: 10px; background: var(--surface); padding: 0 4px; font-size: 11px; font-weight: 600; color: var(--text2); pointer-events: none; z-index: 1; transition: color 0.2s; }
.form-label .req { color: var(--error); margin-left: 2px; }
.form-field:focus-within .form-label { color: var(--accent); }
.form-field.has-error .form-label { color: var(--error); }
.form-input, .form-select, .form-textarea { width: 100%; padding: 10px 12px; border-radius: var(--radius-sm); border: 1.5px solid var(--border); background: #fff; color: var(--text); font-family: 'DM Sans', sans-serif; font-size: 16px; outline: none; transition: all 0.2s; }
.form-input::placeholder, .form-textarea::placeholder { color: var(--text3); font-family: 'DM Sans', sans-serif; }
.form-input:focus, .form-select:focus, .form-textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(255,212,0,0.15); }
.form-input.error, .form-select.error { border-color: var(--error); box-shadow: 0 0 0 3px rgba(220,38,38,0.1); }
.form-input.valid, .form-select.valid { border-color: var(--success); }
.form-textarea { min-height: 60px; resize: vertical; }
.email-error { font-size: 12px; color: var(--error); margin-top: 6px; opacity: 0; max-height: 0; overflow: hidden; transition: all 0.3s; display: flex; align-items: center; gap: 4px; }
.email-error::before { content: '⚠'; font-size: 11px; }
.email-error.visible { opacity: 1; max-height: 40px; }
.anon-hidden { opacity: 0.4; pointer-events: none; }
.summary-panel { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px; }
.summary-title { font-family: 'Playfair Display', serif; font-size: 16px; font-weight: 700; margin-bottom: 12px; color: var(--text); }
.summary-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
.summary-label { color: var(--text2); font-family: 'Playfair Display', serif; }
.summary-value { font-weight: 600; color: var(--text); font-family: 'Playfair Display', serif; }
.summary-divider { height: 1px; background: var(--border); margin: 10px 0; }
.summary-total { display: flex; justify-content: space-between; font-size: 16px; font-weight: 700; }
.summary-total .summary-value { color: #ffb700; font-size: 18px; }
.donate-btn { width: 100%; padding: 10px; border-radius: var(--radius-sm); border: 1px solid #ffd400; background: #ffd400; color: #1a2744; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 700; cursor: pointer; margin-top: 14px; transition: all 0.3s; }
.donate-btn:hover { background: #ffb700; border-color: #1a2744; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(255,212,0,0.45); }
.donate-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
.success-overlay { position: fixed; inset: 0; background: rgba(15,22,35,0.92); display: flex; align-items: center; justify-content: center; z-index: 9999; opacity: 0; pointer-events: none; transition: opacity 0.5s; padding: 20px; }
.success-overlay.show { opacity: 1; pointer-events: all; }
.success-card { background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--radius); padding: 40px; max-width: 460px; text-align: center; box-shadow: 0 8px 32px rgba(0,0,0,0.2); }
.success-icon { width: 72px; height: 72px; background: linear-gradient(135deg, #ffd400, #ffb700); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 34px; color: #1a1a1a; }
.success-title { font-family: 'Playfair Display', serif; font-size: 26px; font-weight: 700; margin-bottom: 10px; color: var(--text); }
.success-message { color: var(--text2); font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
.success-btn { padding: 10px 28px; border-radius: var(--radius-sm); border: 1px solid #ffd400; background: #ffd400; color: #1a2744; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.3s; }
.success-btn:hover { transform: translateY(-2px); background: #ffb700; border-color: #1a2744; box-shadow: 0 8px 24px rgba(255,212,0,0.4); }

/* ===== DONATION PANEL: SLIGHTLY LARGER TYPE ===== */
.donation-panel .page-header h1 { font-size: clamp(20px, 3.7vw, 26px); }
.donation-panel .page-header p { font-size: 13px; }
.donation-panel .section-title { font-size: 14px; }
.donation-panel .section-subtitle { font-size: 12px; }
.donation-panel .section-preview { font-size: 11px; }
.donation-panel .currency-btn { font-size: 14px; }
.donation-panel .toggle-btn { font-size: 15px; }
.donation-panel .freq-label { font-size: 13px; }
.donation-panel .freq-btn { font-size: 14px; }
.donation-panel .amount-btn { font-size: 17px; }
.donation-panel .currency-symbol { font-size: 16px; }
.donation-panel .custom-amount { font-size: 16px; }
.donation-panel .checkbox-label { font-size: 14px; }
.donation-panel .checkbox-desc { font-size: 13px; }
.donation-panel .payment-btn { font-size: 14px; }
.donation-panel .form-label { font-size: 12px; }
.donation-panel .form-input,
.donation-panel .form-select,
.donation-panel .form-textarea { font-size: 16px; }
.donation-panel .summary-title { font-size: 17px; }
.donation-panel .summary-row { font-size: 14px; }
.donation-panel .summary-total { font-size: 17px; }
.donation-panel .summary-total .summary-value { font-size: 19px; }
.donation-panel .donate-btn { font-size: 16px; }
.donation-panel .donation-notice { font-size: 13px; }

/* ===== PROCESSING OVERLAY ===== */
.processing-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; min-height: -webkit-fill-available; background: rgba(15,22,35,0.92); display: flex; align-items: center; justify-content: center; z-index: 9998; opacity: 0; pointer-events: none; transition: opacity 0.3s; }
.processing-overlay.show { opacity: 1; pointer-events: all; }
.processing-spinner { width: 56px; height: 56px; border: 3px solid rgba(255,212,0,0.2); border-top-color: #ffd400; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
.processing-msg { font-size: 15px; font-weight: 600; color: #e8eaf0; text-align: center; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ===== DONATION NOTICE ===== */
.donation-notice { background: rgba(244,63,94,0.08); border: 1.5px solid #f43f5e; border-radius: var(--radius-sm); padding: 12px 14px; margin-bottom: 14px; color: #f43f5e; font-size: 12px; line-height: 1.6; }
.donation-notice strong { display: block; font-weight: 700; margin-bottom: 6px; font-size: 13px; }


.summary-row { overflow-wrap: anywhere; word-break: break-word; }

/* ===== RESPONSIVE (donation panel rules) ===== */
@media (max-width: 900px) {
  .donation-panel {
    max-height: none;
    overflow-y: visible;
    position: static;
    border-left: none;
    border-top: 1px solid rgba(255,212,0,0.12);
    margin: 16px 16px 24px;
  }
}
@media (max-width: 480px) {
  .donation-panel { margin: 8px 8px 16px; border-radius: 12px; }
  .amount-grid { grid-template-columns: repeat(2, 1fr); }
  .payment-grid { grid-template-columns: 1fr; }
  .page-title { font-size: 16px; }
  .page-subtitle { font-size: 12px; }
  .page-header h1 { font-size: 18px; }
  .page-header p { font-size: 12px; }
  .donation-notice { font-size: 12px; padding: 10px 12px; }
  .summary-row { flex-direction: column; gap: 2px; }
}
@media (max-width: 360px) {
  .amount-grid { grid-template-columns: repeat(2, 1fr); gap: 6px; }
  .payment-grid { grid-template-columns: 1fr; }
  .section-header { padding: 10px; }
  .page-wrap { padding: 12px; }
}
`;
  document.head.appendChild(style);
})();

/* ============================================================
   2. MARKUP — injected into the page
   ============================================================ */
(function injectDonationPanelMarkup() {
  const panelHTML = `
  <div class="donation-panel">
    <div class="page-wrap">
      <!-- Header -->
      <div class="page-header">
        <div class="badge"><span>✦</span><span>Support Our Mission</span></div>
        <h1>Make a Donation</h1>
        <p>Your contribution helps us continue our work and make a lasting impact in our community.</p>
      </div>

      <!-- Progress -->
      <div class="progress-track">
        <div class="progress-fill" id="progressBar"></div>
      </div>

      <!-- Donation Notice -->
      <div class="donation-notice" id="donationNotice">
        <strong>⚠ Before You Donate — Please Read</strong>
        Complete all steps in order: choose your currency, donation type, amount, payment method, and fill in your details before submitting. All fields marked * are required. If paying via PayPal or Wise, you will be redirected to their site — do not close the tab until payment is confirmed.
      </div>

      <!-- Section 1 -->
      <div class="section-card active" id="sec-1">
        <div class="section-header">
          <div class="section-num">1</div>
          <div class="section-title-wrap">
            <div class="section-title">Choose Currency</div>
            <div class="section-subtitle">Select your preferred currency</div>
          </div>
          <span class="section-preview" id="prev-1"></span>
        </div>
        <div class="section-divider"></div>
        <div class="section-body open" id="body-1">
          <div class="currency-group">
            <button type="button" class="currency-btn selected" onclick="selectCurrency(this,'USD')">✓ USD $</button>
            <button type="button" class="currency-btn" onclick="selectCurrency(this,'EUR')">EUR €</button>
            <button type="button" class="currency-btn" onclick="selectCurrency(this,'GBP')">GBP £</button>
            <button type="button" class="currency-btn" onclick="selectCurrency(this,'INR')">INR ₹</button>
          </div>
        </div>
      </div>

      <!-- Section 2 -->
      <div class="section-card locked" id="sec-2">
        <div class="section-header">
          <div class="section-num">2</div>
          <div class="section-title-wrap">
            <div class="section-title">Donation Type</div>
            <div class="section-subtitle">One-time or recurring support</div>
          </div>
          <span class="section-preview" id="prev-2"></span>
          <span class="lock-icon" id="lock-2">🔒</span>
        </div>
        <div class="section-divider"></div>
        <div class="section-body" id="body-2">
          <div class="toggle-group">
            <button type="button" class="toggle-btn selected" onclick="selectDonationType(this,'One-time')">✓ One-time</button>
            <button type="button" class="toggle-btn" onclick="selectDonationType(this,'Recurring')">Recurring</button>
          </div>
          <div class="recurring-frequency" id="recurringOptions">
            <label class="freq-label">Choose Frequency</label>
            <div class="freq-group">
              <button type="button" class="freq-btn selected" onclick="selectFrequency(this,'Monthly')">✓ Monthly</button>
              <button type="button" class="freq-btn" onclick="selectFrequency(this,'Quarterly')">Quarterly</button>
              <button type="button" class="freq-btn" onclick="selectFrequency(this,'Yearly')">Yearly</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Section 3 -->
      <div class="section-card locked" id="sec-3">
        <div class="section-header">
          <div class="section-num">3</div>
          <div class="section-title-wrap">
            <div class="section-title">Choose Amount</div>
            <div class="section-subtitle">Select or enter custom amount</div>
          </div>
          <span class="section-preview" id="prev-3"></span>
          <span class="lock-icon" id="lock-3">🔒</span>
        </div>
        <div class="section-divider"></div>
        <div class="section-body" id="body-3">
          <div class="amount-grid" id="amountGrid"></div>
          <div class="custom-amount-wrap">
            <span class="currency-symbol" id="customSymbol">$</span>
            <input type="number" class="custom-amount" id="customAmount" placeholder="Custom amount" min="0.01" step="any" oninput="debouncedCustomAmount(this)">
          </div>
          <div class="fee-section">
            <div class="fee-checkbox" onclick="toggleFee()">
              <div class="checkbox-box" id="feeToggle" role="checkbox" aria-checked="false" tabindex="0" onkeydown="if(event.key===' '||event.key==='Enter'){event.preventDefault();toggleFee();}"></div>
              <div class="checkbox-text">
                <div class="checkbox-label">Cover transaction fees (+4.5%)</div>
                <div class="checkbox-desc">Help us keep 100% of your donation</div>
              </div>
            </div>
            <input type="checkbox" id="coverFee" style="display:none">
          </div>
        </div>
      </div>

      <!-- Section 4 -->
      <div class="section-card locked" id="sec-4">
        <div class="section-header">
          <div class="section-num">4</div>
          <div class="section-title-wrap">
            <div class="section-title">Payment Method</div>
            <div class="section-subtitle">Recommended based on your selection</div>
          </div>
          <span class="section-preview" id="prev-4"></span>
          <span class="lock-icon" id="lock-4">🔒</span>
        </div>
        <div class="section-divider"></div>
        <div class="section-body" id="body-4">
          <div class="payment-grid">
            <button type="button" class="payment-btn" data-method="Razorpay" onclick="selectPayment(this)">
              <span class="pm-logo">
                <span class="pm-icon-razorpay" aria-hidden="true"><svg viewBox="0 0 122.88 26.53" xmlns="http://www.w3.org/2000/svg"><g><polygon fill="#072654" points="11.19,9.03 7.94,21.47 0,21.47 1.61,15.35 11.19,9.03"/><path fill="#072654" d="M28.09,5.08C29.95,5.09,31.26,5.5,32,6.33s0.92,2.01,0.51,3.56c-0.27,1.06-0.82,2.03-1.59,2.8 c-0.8,0.8-1.78,1.38-2.87,1.68c0.83,0.19,1.34,0.78,1.5,1.79l0.03,0.22l0.6,5.09h-3.7l-0.62-5.48c-0.01-0.18-0.06-0.36-0.15-0.52 c-0.09-0.16-0.22-0.29-0.37-0.39c-0.31-0.16-0.65-0.24-1-0.25h-0.21h-2.28l-1.74,6.63h-3.46l4.3-16.38H28.09L28.09,5.08z M122.88,9.37l-4.4,6.34l-5.19,7.52l-0.04,0.04l-1.16,1.68l-0.04,0.06L112,25.09l-1,1.44h-3.44l4.02-5.67l-1.82-11.09h3.57 l0.9,7.23l4.36-6.19l0.06-0.09l0.07-0.1l0.07-0.09l0.54-1.15H122.88L122.88,9.37z M92.4,10.25c0.66,0.56,1.09,1.33,1.24,2.19 c0.18,1.07,0.1,2.18-0.21,3.22c-0.29,1.15-0.78,2.23-1.46,3.19c-0.62,0.88-1.42,1.61-2.35,2.13c-0.88,0.48-1.85,0.73-2.85,0.73 c-0.71,0.03-1.41-0.15-2.02-0.51c-0.47-0.28-0.83-0.71-1.03-1.22l-0.06-0.2l-1.77,6.75h-3.43l3.51-13.4l0.02-0.06l0.01-0.06 l0.86-3.25h3.35l-0.57,1.88l-0.01,0.08c0.49-0.7,1.15-1.27,1.91-1.64c0.76-0.4,1.6-0.6,2.45-0.6C90.84,9.43,91.7,9.71,92.4,10.25 L92.4,10.25z M88.26,12.11c-0.4-0.01-0.8,0.07-1.18,0.22c-0.37,0.15-0.71,0.38-1,0.66c-0.68,0.7-1.15,1.59-1.36,2.54 c-0.3,1.11-0.28,1.95,0.02,2.53c0.3,0.58,0.87,0.88,1.72,0.88c0.81,0.02,1.59-0.29,2.18-0.86c0.66-0.69,1.12-1.55,1.33-2.49 c0.29-1.09,0.27-1.96-0.03-2.57S89.08,12.11,88.26,12.11L88.26,12.11z M103.66,9.99c0.46,0.29,0.82,0.72,1.02,1.23l0.07,0.19 l0.44-1.66h3.36l-3.08,11.7h-3.37l0.45-1.73c-0.51,0.61-1.15,1.09-1.87,1.42c-0.7,0.32-1.45,0.49-2.21,0.49 c-0.88,0.04-1.76-0.21-2.48-0.74c-0.66-0.52-1.1-1.28-1.24-2.11c-0.18-1.06-0.12-2.14,0.19-3.17c0.3-1.15,0.8-2.24,1.49-3.21 c0.63-0.89,1.44-1.64,2.38-2.18c0.86-0.5,1.84-0.77,2.83-0.77C102.36,9.43,103.06,9.61,103.66,9.99L103.66,9.99z M101.92,12.14 c-0.41,0-0.82,0.08-1.19,0.24c-0.38,0.16-0.72,0.39-1.01,0.68c-0.67,0.71-1.15,1.59-1.36,2.55c-0.28,1.08-0.28,1.9,0.04,2.49 c0.31,0.59,0.89,0.87,1.75,0.87c0.4,0.01,0.8-0.07,1.18-0.22s0.71-0.38,1-0.66c0.59-0.63,1.02-1.38,1.26-2.22l0.08-0.31 c0.3-1.11,0.29-1.96-0.03-2.53C103.33,12.44,102.76,12.14,101.92,12.14L101.92,12.14z M81.13,9.63l0.22,0.09l-0.86,3.19 c-0.49-0.26-1.03-0.39-1.57-0.39c-0.82-0.03-1.62,0.24-2.27,0.75c-0.56,0.48-0.97,1.12-1.18,1.82l-0.07,0.27l-1.6,6.11h-3.42 l3.1-11.7h3.37l-0.44,1.72c0.42-0.58,0.96-1.05,1.57-1.4c0.68-0.39,1.44-0.59,2.22-0.59C80.51,9.48,80.83,9.52,81.13,9.63 L81.13,9.63z M68.5,10.19c0.76,0.48,1.31,1.24,1.52,2.12c0.25,1.06,0.21,2.18-0.11,3.22c-0.3,1.18-0.83,2.28-1.58,3.22 c-0.71,0.91-1.61,1.63-2.64,2.12c-1.05,0.49-2.19,0.74-3.35,0.73c-1.22,0-2.22-0.24-3-0.73c-0.77-0.48-1.32-1.24-1.54-2.12 c-0.24-1.06-0.2-2.18,0.11-3.22c0.3-1.17,0.83-2.27,1.58-3.22c0.71-0.9,1.62-1.63,2.66-2.12c1.06-0.49,2.22-0.75,3.39-0.73 C66.57,9.41,67.6,9.67,68.5,10.19L68.5,10.19z M64.84,12.1c-0.81-0.01-1.59,0.3-2.18,0.86c-0.61,0.58-1.07,1.43-1.36,2.57 c-0.6,2.29-0.02,3.43,1.74,3.43c0.8,0.02,1.57-0.29,2.15-0.85c0.6-0.57,1.04-1.43,1.34-2.58c0.3-1.13,0.31-1.98,0.01-2.57 C66.25,12.37,65.68,12.1,64.84,12.1L64.84,12.1z M57.89,9.76l-0.6,2.32l-7.55,6.67h6.06l-0.72,2.73H45.05l0.63-2.41l7.43-6.57 h-5.65l0.72-2.73H57.89L57.89,9.76z M40.96,9.99c0.46,0.29,0.82,0.72,1.02,1.23l0.07,0.19l0.44-1.66h3.37l-3.07,11.7h-3.37 l0.45-1.73c-0.51,0.6-1.14,1.08-1.85,1.41s-1.48,0.5-2.27,0.5c-0.88,0.04-1.74-0.22-2.45-0.74c-0.66-0.52-1.1-1.28-1.24-2.11 c-0.18-1.06-0.12-2.14,0.19-3.17c0.29-1.15,0.8-2.24,1.49-3.21c0.63-0.89,1.44-1.64,2.37-2.18c0.86-0.5,1.84-0.76,2.83-0.76 C39.66,9.44,40.36,9.62,40.96,9.99L40.96,9.99z M39.23,12.14c-0.41,0-0.81,0.08-1.19,0.24c-0.38,0.16-0.72,0.39-1.01,0.68 c-0.68,0.71-1.15,1.59-1.36,2.55c-0.28,1.08-0.27,1.9,0.04,2.49c0.31,0.59,0.89,0.87,1.75,0.87c0.4,0.01,0.8-0.07,1.18-0.22 c0.37-0.15,0.72-0.38,1-0.66c0.59-0.62,1.03-1.38,1.26-2.22l0.08-0.31c0.29-1.11,0.26-1.94-0.03-2.53 C40.64,12.44,40.06,12.14,39.23,12.14L39.23,12.14z M26.85,7.81h-3.21l-1.13,4.28h3.21c1.01,0,1.81-0.17,2.35-0.52 c0.57-0.37,0.98-0.95,1.13-1.63c0.2-0.72,0.11-1.27-0.27-1.62C28.55,7.99,27.86,7.81,26.85,7.81L26.85,7.81z"/><polygon fill="#3395FF" points="18.4,0 12.76,21.47 8.89,21.47 12.7,6.93 6.86,10.78 7.9,6.95 18.4,0"/></g></svg></span>
              </span>
            </button>
            <button type="button" class="payment-btn" data-method="Wise" onclick="selectPayment(this)">
              <span class="pm-logo">
                <span class="pm-icon-wise" aria-hidden="true"><svg viewBox="0 0 219.7 50" xmlns="http://www.w3.org/2000/svg"><g><path fill="#163300" d="M122.4,0.7h13.5l-6.8,48.6h-13.5L122.4,0.7L122.4,0.7z M105.3,0.7l-9.1,28l-4-28h-9.5l-12,27.9L69.3,0.8H56.1
		l4.6,48.6h10.9L85,18.6l4.7,30.7h10.7l17.7-48.6H105.3z M219,29h-32.1c0.2,6.3,3.9,10.5,9.5,10.5c4.2,0,7.5-2.2,10.1-6.5l10.9,4.9
		C213.5,45.2,205.7,50,196,50c-13.2,0-22-8.9-22-23.2C174,11.1,184.3,0,198.9,0c12.8,0,20.8,8.6,20.8,22.1
		C219.7,24.3,219.5,26.6,219,29z M206.9,19.7c0-5.6-3.2-9.2-8.2-9.2c-5.2,0-9.6,3.7-10.7,9.2H206.9L206.9,19.7z M13.8,15.4L0,31.5
		h24.7l2.8-7.6H16.9l6.5-7.5l0-0.2L19.2,9h18.9L23.4,49.3h10L51.1,0.7H5.4L13.8,15.4L13.8,15.4z M157.9,10.5c4.8,0,9,2.6,12.6,7
		l1.9-13.7c-3.4-2.3-8-3.7-14.1-3.7c-12.1,0-18.9,7.1-18.9,16.1c0,6.2,3.5,10.1,9.2,12.5l2.7,1.2c5.1,2.2,6.5,3.3,6.5,5.6
		c0,2.4-2.3,3.9-5.8,3.9c-5.8,0-10.5-2.9-14-8l-2,14c4,3.1,9.2,4.7,16,4.7c11.5,0,18.6-6.6,18.6-15.9c0-6.3-2.8-10.3-9.8-13.5
		l-3-1.4c-4.2-1.8-5.6-2.9-5.6-4.9C152.3,12.2,154.2,10.5,157.9,10.5z"/></g></svg></span>
              </span>
            </button>
            <button type="button" class="payment-btn" data-method="Dodo Payments" onclick="selectPayment(this)">
              <span class="pm-logo">
                <img class="pm-logo-img-dodo" src="data:image/webp;base64,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" alt="Dodo Payments" />
              </span>
            </button>
            <button type="button" class="payment-btn" data-method="PayPal" onclick="selectPayment(this)">
              <span class="pm-logo">
                <span class="pm-icon pm-icon-paypal" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 170 48"><path fill="#003087" d="M62.56 28.672a10.111 10.111 0 009.983-8.56c.78-4.967-3.101-9.303-8.6-9.303H55.08a.689.689 0 00-.69.585l-3.95 25.072a.643.643 0 00.634.742h4.69a.689.689 0 00.688-.585l1.162-7.365a.689.689 0 01.689-.586h4.257zm3.925-8.786c-.29 1.836-1.709 3.189-4.425 3.189h-3.474l1.053-6.68h3.411c2.81.006 3.723 1.663 3.435 3.496v-.005zm26.378-1.18H88.41a.69.69 0 00-.69.585l-.144.924s-3.457-3.775-9.575-1.225c-3.51 1.461-5.194 4.48-5.91 6.69 0 0-2.277 6.718 2.87 10.417 0 0 4.771 3.556 10.145-.22l-.093.589a.642.642 0 00.634.742h4.451a.689.689 0 00.69-.585l2.708-17.175a.643.643 0 00-.634-.742zm-6.547 9.492a4.996 4.996 0 01-4.996 4.276 4.513 4.513 0 01-1.397-.205c-1.92-.616-3.015-2.462-2.7-4.462a4.996 4.996 0 015.014-4.277c.474-.005.946.065 1.398.206 1.913.614 3.001 2.46 2.686 4.462h-.005z"/><path fill="#0070E0" d="M126.672 28.672a10.115 10.115 0 009.992-8.56c.779-4.967-3.101-9.303-8.602-9.303h-8.86a.69.69 0 00-.689.585l-3.962 25.079a.637.637 0 00.365.683.64.64 0 00.269.06h4.691a.69.69 0 00.689-.586l1.163-7.365a.688.688 0 01.689-.586l4.255-.007zm3.925-8.786c-.29 1.836-1.709 3.189-4.426 3.189h-3.473l1.054-6.68h3.411c2.808.006 3.723 1.663 3.434 3.496v-.005zm26.377-1.18h-4.448a.69.69 0 00-.689.585l-.146.924s-3.456-3.775-9.574-1.225c-3.509 1.461-5.194 4.48-5.911 6.69 0 0-2.276 6.718 2.87 10.417 0 0 4.772 3.556 10.146-.22l-.093.589a.637.637 0 00.365.683c.084.04.176.06.269.06h4.451a.686.686 0 00.689-.586l2.709-17.175a.657.657 0 00-.148-.518.632.632 0 00-.49-.224zm-6.546 9.492a4.986 4.986 0 01-4.996 4.276 4.513 4.513 0 01-1.399-.205c-1.921-.616-3.017-2.462-2.702-4.462a4.996 4.996 0 014.996-4.277c.475-.005.947.064 1.399.206 1.933.614 3.024 2.46 2.707 4.462h-.005z"/><path fill="#003087" d="M109.205 19.131l-5.367 9.059-2.723-8.992a.69.69 0 00-.664-.492h-4.842a.516.516 0 00-.496.689l4.88 15.146-4.413 7.138a.517.517 0 00.442.794h5.217a.858.858 0 00.741-.418l13.632-22.552a.516.516 0 00-.446-.789h-5.215a.858.858 0 00-.746.417z"/><path fill="#0070E0" d="M161.982 11.387l-3.962 25.079a.637.637 0 00.365.683c.084.04.176.06.269.06h4.689a.688.688 0 00.689-.586l3.963-25.079a.637.637 0 00-.146-.517.645.645 0 00-.488-.225h-4.69a.69.69 0 00-.689.585z"/><path fill="#001C64" d="M37.146 22.26c-1.006 5.735-5.685 10.07-11.825 10.07h-3.898c-.795 0-1.596.736-1.723 1.55l-1.707 10.835c-.099.617-.388.822-1.013.822h-6.27c-.634 0-.784-.212-.689-.837l.72-7.493-7.526-.389c-.633 0-.862-.345-.772-.977l5.135-32.56c.099-.617.483-.882 1.106-.882h13.023c6.269 0 10.235 4.22 10.72 9.692 3.73 2.52 5.474 5.873 4.72 10.168z"/><path fill="#0070E0" d="M12.649 25.075l-1.907 12.133-1.206 7.612a1.034 1.034 0 001.016 1.19h6.622a1.27 1.27 0 001.253-1.072l1.743-11.06a1.27 1.27 0 011.253-1.071h3.898A12.46 12.46 0 0037.617 22.26c.675-4.307-1.492-8.228-5.201-10.165a9.96 9.96 0 01-.12 1.37 12.461 12.461 0 01-12.295 10.54h-6.1a1.268 1.268 0 00-1.252 1.07z"/><path fill="#003087" d="M10.741 37.208H3.03a1.035 1.035 0 01-1.018-1.192L7.208 3.072A1.268 1.268 0 018.46 2H21.7c6.269 0 10.827 4.562 10.72 10.089a11.567 11.567 0 00-5.399-1.287H15.983a1.27 1.27 0 00-1.254 1.071l-2.08 13.202-1.908 12.133z"/></svg></span>
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- Section 5 -->
      <div class="section-card locked" id="sec-5">
        <div class="section-header">
          <div class="section-num">5</div>
          <div class="section-title-wrap">
            <div class="section-title">Your Information</div>
            <div class="section-subtitle">Help us stay connected</div>
          </div>
          <span class="section-preview" id="prev-5"></span>
          <span class="lock-icon" id="lock-5">🔒</span>
        </div>
        <div class="section-divider"></div>
        <div class="section-body" id="body-5">
          <div style="margin-bottom:12px;">
            <div class="fee-checkbox" onclick="toggleAnon()">
              <div class="checkbox-box" id="anonBox" role="checkbox" aria-checked="false" tabindex="0" onkeydown="if(event.key===' '||event.key==='Enter'){event.preventDefault();toggleAnon();}"></div>
              <div class="checkbox-text">
                <div class="checkbox-label">Make this donation anonymous</div>
                <div class="checkbox-desc" id="anonHint">Your information will be kept private</div>
              </div>
            </div>
          </div>
          <div id="donorFields">
            <div class="form-field">
              <label class="form-label">First Name <span class="req">*</span></label>
              <input type="text" class="form-input" id="firstName" placeholder="Enter your first name" oninput="onTextFieldInput('firstName')">
            </div>
            <div class="form-field">
              <label class="form-label">Last Name <span class="req">*</span></label>
              <input type="text" class="form-input" id="lastName" placeholder="Enter your last name" oninput="onTextFieldInput('lastName')">
            </div>
            <div class="form-field">
              <label class="form-label">Email ID <span class="req">*</span></label>
              <input type="email" class="form-input" id="email" placeholder="Enter your email address" oninput="onEmailInput()" onblur="onEmailBlur()">
              <div class="email-error" id="emailError" role="alert" aria-live="polite">Please enter a valid email address</div>
            </div>
            <div class="form-field">
              <label class="form-label">Phone (Optional)</label>
              <input type="tel" class="form-input" id="phone" placeholder="+1 234 567 8900" oninput="onPhoneInput(this)" onblur="onPhoneBlur(this)">
              <div class="email-error" id="phoneError" role="alert" aria-live="polite">Please enter a valid phone number</div>
            </div>
            <div class="form-field">
              <label class="form-label">Country <span class="req">*</span></label>
              <select class="form-select" id="country" onchange="onSelectChange('country')">
                <option value="">Select country</option>
                <option value="US">United States</option>
                <option value="GB">United Kingdom</option>
                <option value="CA">Canada</option>
                <option value="AU">Australia</option>
                <option value="IN">India</option>
                <option value="DE">Germany</option>
                <option value="FR">France</option>
                <option value="NL">Netherlands</option>
                <option value="SE">Sweden</option>
                <option value="NO">Norway</option>
                <option value="DK">Denmark</option>
                <option value="CH">Switzerland</option>
                <option value="JP">Japan</option>
                <option value="SG">Singapore</option>
                <option value="NZ">New Zealand</option>
                <option value="BR">Brazil</option>
                <option value="MX">Mexico</option>
                <option value="ZA">South Africa</option>
                <option value="NG">Nigeria</option>
                <option value="AE">United Arab Emirates</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div class="form-field">
              <label class="form-label">Message (Optional)</label>
              <textarea class="form-textarea" id="message" placeholder="Share why you're supporting us..."></textarea>
            </div>
          </div>
        </div>
      </div>

      <!-- Section 6 -->
      <div class="section-card locked" id="sec-6">
        <div class="section-header">
          <div class="section-num">6</div>
          <div class="section-title-wrap">
            <div class="section-title">Final Steps</div>
            <div class="section-subtitle">Review and confirm</div>
          </div>
          <span class="section-preview" id="prev-6"></span>
          <span class="lock-icon" id="lock-6">🔒</span>
        </div>
        <div class="section-divider"></div>
        <div class="section-body" id="body-6">
          <div style="margin-bottom:12px;">
            <div class="fee-checkbox" onclick="toggleOpt('updates')">
              <div class="checkbox-box" id="cb-updates" role="checkbox" aria-checked="false" tabindex="0" onkeydown="if(event.key===' '||event.key==='Enter'){event.preventDefault();toggleOpt('updates');}"></div>
              <div class="checkbox-text">
                <div class="checkbox-label">Send me updates</div>
                <div class="checkbox-desc">Receive email updates about our work</div>
              </div>
            </div>
          </div>
          <div>
            <div class="fee-checkbox" onclick="toggleOpt('terms')">
              <div class="checkbox-box" id="cb-terms" role="checkbox" aria-checked="false" tabindex="0" style="border-color:#f87171" onkeydown="if(event.key===' '||event.key==='Enter'){event.preventDefault();toggleOpt('terms');}"></div>
              <div class="checkbox-text">
                <div class="checkbox-label">I agree to the terms & conditions</div>
                <div class="checkbox-desc">Required to complete your donation</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Section 7 -->
      <div class="section-card locked" id="sec-7">
        <div class="section-header">
          <div class="section-num">7</div>
          <div class="section-title-wrap">
            <div class="section-title">Review & Donate</div>
            <div class="section-subtitle">Complete your contribution</div>
          </div>
          <span class="lock-icon" id="lock-7">🔒</span>
        </div>
        <div class="section-divider"></div>
        <div class="section-body" id="body-7">
          <div class="summary-panel">
            <div class="summary-title">Donation Summary</div>
            <div class="summary-row"><span class="summary-label">Amount</span><span class="summary-value" id="sum-amount">—</span></div>
            <div class="summary-row"><span class="summary-label">Frequency</span><span class="summary-value" id="sum-freq">—</span></div>
            <div class="summary-row"><span class="summary-label">Payment Method</span><span class="summary-value" id="sum-method">—</span></div>
            <div class="summary-row"><span class="summary-label">Transaction Fee</span><span class="summary-value" id="sum-fee">$0.00</span></div>
            <div class="summary-divider"></div>
            <div class="summary-total"><span class="summary-label">Total</span><span class="summary-value" id="sum-total">$0.00</span></div>
            <button type="button" class="donate-btn" onclick="completeDonation()">Complete Donation</button>
          </div>
        </div>
      </div>
    </div><!-- /page-wrap -->
  </div><!-- /donation-panel -->
`;

  const overlaysHTML = `
<div class="processing-overlay" id="processingOverlay">
  <div style="text-align:center;">
    <div class="processing-spinner"></div>
    <div class="processing-msg">Processing your donation…<br><span style="font-size:12px;font-weight:400;color:#9aa0b0;">Please do not close this window</span></div>
  </div>
</div>

<!-- Success Overlay -->
<div class="success-overlay" id="successOverlay">
  <div class="success-card">
    <div class="success-icon">✓</div>
    <div class="success-title">Thank You!</div>
    <div class="success-message" id="successMsg">Your donation has been received. Together we're making a difference.</div>
    <button type="button" class="success-btn" onclick="resetAll()">Make Another Donation</button>
  </div>
</div>
`;

  const mount = document.getElementById('donationPanelMount');
  if (mount) {
    mount.outerHTML = panelHTML;
  } else {
    // Fallback: no mount point found, append to end of <body>
    document.body.insertAdjacentHTML('beforeend', panelHTML);
    console.warn('donation-panel.js: #donationPanelMount not found, panel appended to <body>.');
  }

  document.body.insertAdjacentHTML('beforeend', overlaysHTML);
})();

/* ============================================================
   3. LOGIC — donation state, interactions, payment gateways
   ============================================================ */
const state = {
  currency: 'USD', donationType: 'One-time', recurringFrequency: 'Monthly',
  amount: null, customAmount: null, coverFee: false, paymentMethod: null,
  firstName: '', lastName: '', email: '', country: '',
  updates: false, terms: false, anon: false, completedSections: new Set()
};

const currencyData = {
  USD: { symbol: '$', presets: [25, 50, 100, 250, 500, 1000] },
  EUR: { symbol: '€', presets: [20, 40, 80, 200, 400, 800] },
  GBP: { symbol: '£', presets: [20, 40, 80, 200, 400, 800] },
  INR: { symbol: '₹', presets: [500, 1000, 2000, 5000, 10000, 20000] }
};

function getSymbol() { return currencyData[state.currency]?.symbol || '$'; }
function formatAmount(num) { return getSymbol() + num.toLocaleString(); }
function updateProgress() { document.getElementById('progressBar').style.width = Math.min(state.completedSections.size / 6 * 100, 100) + '%'; }

function completeSection(n) {
  const card = document.getElementById('sec-' + n);
  const num = card.querySelector('.section-num');
  const lock = document.getElementById('lock-' + n);
  state.completedSections.add(n);
  card.classList.remove('active', 'locked');
  card.classList.add('completed');
  num.innerHTML = '<span style="color:white;font-size:14px">✓</span>';
  if (lock) lock.style.display = 'none';
  card.querySelector('.section-header').onclick = () => toggleSection(n);
  if (n < 7) {
    const next = document.getElementById('sec-' + (n+1));
    const nextBody = document.getElementById('body-' + (n+1));
    const nextLock = document.getElementById('lock-' + (n+1));
    next.classList.remove('locked'); next.classList.add('active');
    nextBody.classList.add('open');
    if (nextLock) nextLock.style.display = 'none';
    if (n+1 === 5 && !state.anon) setTimeout(initDonorFieldStates, 100);
    if (n+1 === 7) {
      // Section 7 (review) unlocked — scroll it into view
      setTimeout(() => {
        const sec7 = document.getElementById('sec-7');
        if (sec7) sec7.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 200);
      // Also hide donation notice banner once all required steps done
      const notice = document.getElementById('donationNotice');
      if (notice) { notice.style.background = 'rgba(22,163,74,0.08)'; notice.style.borderColor = '#16a34a'; notice.style.color = '#16a34a'; notice.querySelector('strong').textContent = '✓ All steps complete — review and donate below'; }
    }
  }
  updateProgress();
}

function reactivateSection(n) {
  const card = document.getElementById('sec-' + n);
  const num = card.querySelector('.section-num');
  state.completedSections.delete(n);
  card.classList.remove('completed'); card.classList.add('active');
  num.textContent = n; updateProgress();
}

function toggleSection(n) {
  if (!state.completedSections.has(n)) return;
  document.getElementById('body-' + n).classList.toggle('open');
}

function selectCurrency(btn, cur) {
  document.querySelectorAll('.currency-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  setTick('currency-btn', btn);
  state.currency = cur; state.amount = null; state.customAmount = null; state.paymentMethod = null;
  document.getElementById('prev-1').textContent = cur;
  document.getElementById('customSymbol').textContent = getSymbol();
  document.getElementById('prev-4').textContent = '';
  document.querySelectorAll('.payment-btn').forEach(b => b.classList.remove('selected','auto-selected'));
  document.getElementById('prev-3').textContent = '';
  // Amount and payment method were just nulled above — reflect that in the stepper
  // so completed sections never show a stale checkmark for cleared state.
  if (state.completedSections.has(3)) reactivateSection(3);
  if (state.completedSections.has(4)) reactivateSection(4);
  updateAmountButtons(); completeSection(1); updateSummary();
}

function setTick(cls, activeBtn) {
  document.querySelectorAll('.' + cls).forEach(b => {
    b.textContent = b.textContent.replace(/^✓\s/, '');
  });
  activeBtn.textContent = '✓ ' + activeBtn.textContent.replace(/^✓\s/, '');
}

function selectDonationType(btn, type) {
  document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected'); state.donationType = type;
  setTick('toggle-btn', btn);
  const ro = document.getElementById('recurringOptions');
  if (type === 'Recurring') { ro.classList.add('show'); updateDonationTypePreview(); }
  else { ro.classList.remove('show'); state.recurringFrequency = 'Monthly'; document.getElementById('prev-2').textContent = type; }
  completeSection(2);
  if (state.amount) autoSelectPaymentMethod(state.amount);
  updateSummary();
}

function selectFrequency(btn, freq) {
  document.querySelectorAll('.freq-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected'); state.recurringFrequency = freq;
  setTick('freq-btn', btn);
  updateDonationTypePreview(); updateSummary();
}

function updateDonationTypePreview() {
  document.getElementById('prev-2').textContent = state.donationType === 'Recurring'
    ? state.recurringFrequency + ' Recurring' : state.donationType;
}

function updateAmountButtons() {
  const grid = document.getElementById('amountGrid');
  const presets = currencyData[state.currency]?.presets || [25,50,100,250,500,1000];
  grid.innerHTML = presets.map(amt => `<button type="button" class="amount-btn" onclick="selectAmount(this,${amt})">${formatAmount(amt)}</button>`).join('');
  document.getElementById('customAmount').value = '';
}

function selectAmount(btn, amt) {
  document.querySelectorAll('.amount-btn').forEach(b => { b.classList.remove('selected'); b.textContent = b.textContent.replace(/^✓\s/, ''); });
  btn.classList.add('selected'); state.amount = amt; state.customAmount = null;
  btn.textContent = '✓ ' + btn.textContent.replace(/^✓\s/, '');
  document.getElementById('customAmount').value = '';
  document.getElementById('prev-3').textContent = formatAmount(amt);
  completeSection(3); autoSelectPaymentMethod(amt); updateSummary();
}

let _customAmountTimer = null;
function debouncedCustomAmount(input) {
  clearTimeout(_customAmountTimer);
  _customAmountTimer = setTimeout(() => selectCustomAmount(input), 350);
}
function selectCustomAmount(input) {
  const val = parseFloat(input.value);
  if (!val || val <= 0 || isNaN(val)) {
    if (state.completedSections.has(3)) reactivateSection(3);
    document.getElementById('prev-3').textContent = '';
    state.amount = null; state.customAmount = null;
    clearAutoSelectedPayment(); updateSummary(); return;
  }
  if (val < 0.01) { input.value = 0.01; return; }
  document.querySelectorAll('.amount-btn').forEach(b => { b.classList.remove('selected'); b.textContent = b.textContent.replace(/^✓\s/, ''); });
  state.amount = val; state.customAmount = val;
  document.getElementById('prev-3').textContent = formatAmount(val);
  completeSection(3); autoSelectPaymentMethod(val); updateSummary();
}

function autoSelectPaymentMethod(amount) {
  document.querySelectorAll('.payment-btn').forEach(btn => btn.classList.remove('auto-selected','selected'));
  let rec = null;
  if (state.currency === 'INR') rec = 'Razorpay';
  else if (state.donationType === 'Recurring') rec = 'Dodo Payments';
  else {
    const threshold = state.currency === 'GBP' ? 40 : 50;
    rec = amount < threshold ? 'PayPal' : 'Wise';
  }
  document.querySelectorAll('.payment-btn').forEach(btn => { if (btn.dataset.method === rec) btn.classList.add('auto-selected'); });
  if (rec) {
    state.paymentMethod = rec;
    document.getElementById('prev-4').textContent = rec;
    if (!state.completedSections.has(4)) completeSection(4);
  }
}

function clearAutoSelectedPayment() {
  document.querySelectorAll('.payment-btn').forEach(btn => btn.classList.remove('auto-selected'));
}

function toggleFee() {
  const cb = document.getElementById('coverFee');
  const toggle = document.getElementById('feeToggle');
  cb.checked = !cb.checked; state.coverFee = cb.checked;
  toggle.setAttribute('aria-checked', cb.checked ? 'true' : 'false');
  if (cb.checked) {
    toggle.style.background = '#1a2744'; toggle.style.borderColor = '#1a2744';
    toggle.innerHTML = '<span style="color:#ffd400;font-size:11px;font-weight:700">✓</span>';
  } else {
    toggle.style.background = ''; toggle.style.borderColor = '';
    toggle.innerHTML = '';
  }
  updateSummary();
}

function selectPayment(btn) {
  document.querySelectorAll('.payment-btn').forEach(b => {
    b.classList.remove('selected','auto-selected');
  });
  btn.classList.add('selected'); state.paymentMethod = btn.dataset.method;
  document.getElementById('prev-4').textContent = state.paymentMethod;
  completeSection(4); updateSummary();
}

function isValidEmail(em) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em); }

function setFieldState(el, st) {
  el.classList.remove('error','valid');
  if (st === 'error') el.classList.add('error');
  else if (st === 'valid') el.classList.add('valid');
}

function initDonorFieldStates() {
  if (state.anon) return;
  ['firstName','lastName','country'].forEach(id => {
    const el = document.getElementById(id);
    if (!el.value.trim()) setFieldState(el, 'error');
  });
  const emailEl = document.getElementById('email');
  if (!emailEl.value.trim()) setFieldState(emailEl, 'error');
}

function onEmailInput() {
  const emailEl = document.getElementById('email');
  const val = emailEl.value.trim();
  if (val === '') { setFieldState(emailEl, 'error'); document.getElementById('emailError').classList.remove('visible'); }
  else if (isValidEmail(val)) { setFieldState(emailEl, 'valid'); document.getElementById('emailError').classList.remove('visible'); }
  else { setFieldState(emailEl, 'error'); if (val.length > 4) document.getElementById('emailError').classList.add('visible'); else document.getElementById('emailError').classList.remove('visible'); }
  validateDonorInfo();
}

function onEmailBlur() {
  const emailEl = document.getElementById('email');
  const val = emailEl.value.trim();
  if (!val) { setFieldState(emailEl, 'error'); document.getElementById('emailError').classList.remove('visible'); }
  else if (isValidEmail(val)) { setFieldState(emailEl, 'valid'); document.getElementById('emailError').classList.remove('visible'); }
  else { setFieldState(emailEl, 'error'); document.getElementById('emailError').classList.add('visible'); }
  validateDonorInfo();
}

function onTextFieldInput(id) {
  const el = document.getElementById(id);
  setFieldState(el, el.value.trim() ? 'valid' : 'error'); validateDonorInfo();
}

function onSelectChange(id) {
  const el = document.getElementById(id);
  setFieldState(el, el.value ? 'valid' : 'error'); validateDonorInfo();
}

function validateDonorInfo() {
  if (state.anon) return;
  const fn = document.getElementById('firstName').value.trim();
  const ln = document.getElementById('lastName').value.trim();
  const em = document.getElementById('email').value.trim();
  const co = document.getElementById('country').value;
  if (fn && ln && em && isValidEmail(em) && co) {
    state.firstName = fn; state.lastName = ln; state.email = em; state.country = co;
    document.getElementById('prev-5').textContent = fn + ' ' + ln;
    if (!state.completedSections.has(5)) completeSection(5);
  } else {
    if (state.completedSections.has(5)) reactivateSection(5);
  }
}

function toggleAnon() {
  state.anon = !state.anon;
  const box = document.getElementById('anonBox');
  const fields = document.getElementById('donorFields');
  const hint = document.getElementById('anonHint');
  if (state.anon) {
    box.setAttribute('aria-checked','true');
    box.style.background = '#1a2744'; box.style.borderColor = '#1a2744';
    box.innerHTML = '<span style="color:#ffd400;font-size:11px;font-weight:700">✓</span>';
    fields.classList.add('anon-hidden');
    hint.textContent = 'Fields below are not required for anonymous donations';
    ['firstName','lastName','email','country'].forEach(id => document.getElementById(id).classList.remove('error','valid'));
    document.getElementById('emailError').classList.remove('visible');
  const phoneEl = document.getElementById('phone'); if (phoneEl) { phoneEl.value=''; phoneEl.classList.remove('error','valid'); }
  const phoneErrEl = document.getElementById('phoneError'); if (phoneErrEl) phoneErrEl.classList.remove('visible');
    document.getElementById('prev-5').textContent = 'Anonymous';
    if (!state.completedSections.has(5)) completeSection(5);
  } else {
    box.setAttribute('aria-checked','false');
    box.style.background = ''; box.style.borderColor = '';
    box.innerHTML = ''; fields.classList.remove('anon-hidden');
    // Re-sync state from current field values after un-checking anon
    setTimeout(validateDonorInfo, 50);
    hint.textContent = 'Your information will be kept private';
    document.getElementById('prev-5').textContent = '';
    if (state.completedSections.has(5)) reactivateSection(5);
    setTimeout(initDonorFieldStates, 50); validateDonorInfo();
  }
}

function toggleOpt(key) {
  state[key] = !state[key];
  const box = document.getElementById('cb-' + key);
  box.setAttribute('aria-checked', state[key] ? 'true' : 'false');
  if (state[key]) { box.style.background = '#1a2744'; box.style.borderColor = '#1a2744'; box.innerHTML = '<span style="color:#ffd400;font-size:11px;font-weight:700">✓</span>'; }
  else { box.style.background = ''; box.style.borderColor = key === 'terms' ? '#f87171' : '#1a2744'; box.innerHTML = ''; }
  if (state.terms) { document.getElementById('prev-6').textContent = 'Agreed'; if (!state.completedSections.has(6)) completeSection(6); updateSummary(); }
  else { document.getElementById('prev-6').textContent = ''; if (state.completedSections.has(6)) reactivateSection(6); }
}

function updateSummary() {
  const sym = getSymbol();
  const base = state.amount || 0;
  const fee = state.coverFee ? base * 0.045 : 0;
  const total = base + fee;
  document.getElementById('sum-amount').textContent = base ? formatAmount(base) : '—';
  document.getElementById('sum-freq').textContent = state.donationType === 'Recurring' ? state.recurringFrequency + ' Recurring' : (state.donationType || '—');
  document.getElementById('sum-method').textContent = state.paymentMethod || '—';
  document.getElementById('sum-fee').textContent = fee ? formatAmount(Math.round(fee*100)/100) : sym+'0.00';
  document.getElementById('sum-total').textContent = total ? formatAmount(Math.round(total*100)/100) : sym+'0.00';
}


// ── CONFIG (fill in your keys) ────────────────────────────────────────────────
const CONFIG = {
  ORG_NAME:             'WAGS Studio',
  RAZORPAY_LINK:         'https://razorpay.me/@WAGSstudio',
  PAYPAL_ME_LINK:        'https://www.paypal.com/paypalme/WAGSstudio',
  DODO_PAYMENT_LINK:    'https://checkout.dodopayments.com/buy/YOUR_PRODUCT_ID',
  WISE_LINK:             'https://wise.com/pay/business/vasantharubans2',
  EMAILJS_PUBLIC_KEY:   'YOUR_EMAILJS_PUBLIC_KEY',
  EMAILJS_SERVICE_ID:   'YOUR_EMAILJS_SERVICE_ID',
  EMAILJS_TEMPLATE_ID:  'YOUR_EMAILJS_TEMPLATE_ID'
};

function getTotal() { return (state.amount || 0) * (state.coverFee ? 1.045 : 1); }

function initiateRazorpay(payload) {
  return new Promise((resolve) => {
    // Razorpay.me profile links don't have a documented amount-prefill query
    // parameter, so the donor enters/confirms the amount on Razorpay's page.
    const url = CONFIG.RAZORPAY_LINK;
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win) window.location.href = url;
    resolve({ success: true, transactionId: 'razorpay-pending', pending: true });
  });
}

function initiatePayPal(payload) {
  return new Promise((resolve) => {
    // PayPal.me format: paypal.me/username/AMOUNTCURRENCY
    const amountSuffix = `${payload.amount.toFixed(2)}${payload.currency}`;
    const url = `${CONFIG.PAYPAL_ME_LINK}/${amountSuffix}`;
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win) window.location.href = url;
    resolve({ success: true, transactionId: 'paypal-pending', pending: true });
  });
}
function initiateDodo(payload) {
  return new Promise((resolve) => {
    const params = new URLSearchParams({ quantity: 1, email: payload.email || '', redirect_url: window.location.href });
    const url = `${CONFIG.DODO_PAYMENT_LINK}?${params.toString()}`;
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win) window.location.href = url;
    resolve({ success: true, transactionId: 'dodo-pending', pending: true });
  });
}
function initiateWise(payload) {
  return new Promise((resolve) => {
    // Wise business pay link with amount/currency pre-filled for convenience
    const params = new URLSearchParams({ amount: payload.amount.toFixed(2), sourceCurrency: payload.currency, targetCurrency: payload.currency });
    const url = `${CONFIG.WISE_LINK}?${params.toString()}`;
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win) window.location.href = url;
    resolve({ success: true, transactionId: 'wise-pending', pending: true });
  });
}
async function initiatePayment(payload) {
  try {
    if (payload.method === 'Razorpay')       return await initiateRazorpay(payload);
    if (payload.method === 'PayPal')         return await initiatePayPal(payload);
    if (payload.method === 'Dodo Payments')  return await initiateDodo(payload);
    if (payload.method === 'Wise')           return await initiateWise(payload);
    return { success: false, error: 'Unknown payment method' };
  } catch(err) { return { success: false, error: err.message || 'Unexpected error' }; }
}

async function sendConfirmationEmail({ to, name, amount, currency, frequency, method, wantsUpdates, transactionId }) {
  if (typeof emailjs === 'undefined' || !to) return;
  try {
    await emailjs.send(CONFIG.EMAILJS_SERVICE_ID, CONFIG.EMAILJS_TEMPLATE_ID, {
      to_email: to, to_name: name || 'Donor',
      amount: formatAmount(amount), currency, frequency,
      payment_method: method, transaction_id: transactionId || 'N/A',
      org_name: CONFIG.ORG_NAME,
      donor_message: (document.getElementById('message') || {}).value || ''  // wire up the message field
    });
    if (wantsUpdates) console.warn('[Newsletter] Stub: wire up Mailchimp/ConvertKit API to subscribe:', to);
  } catch(err) { console.error('EmailJS error:', err); }
}

async function completeDonation() {
  if (!state.amount || state.amount <= 0) { showInlineError('Please enter a valid donation amount.'); return; }
  // Guard: INR must use Razorpay only
  if (state.currency === 'INR' && state.paymentMethod !== 'Razorpay') {
    showInlineError('Please select Razorpay for INR donations (other gateways do not support INR).'); return;
  }
  const required = [1,2,3,4,5,6];
  const missing = required.find(n => !state.completedSections.has(n));
  if (missing) {
    const names = {1:'Choose Currency',2:'Donation Type',3:'Choose Amount',4:'Payment Method',5:'Your Information',6:'Terms & Conditions'};
    const missingSection = document.getElementById('sec-' + missing);
    if (missingSection) { missingSection.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    showInlineError('Please complete: ' + names[missing]);
    return;
  }
  const btn = document.querySelector('.donate-btn');
  const overlay = document.getElementById('processingOverlay');
  btn.disabled = true; btn.textContent = 'Processing…';
  overlay.classList.add('show');
  const donationTotal = getTotal(); // capture once — avoids double-call inconsistency
  const result = await initiatePayment({
    method: state.paymentMethod, amount: donationTotal, currency: state.currency,
    name: state.anon ? 'Anonymous' : (state.firstName + ' ' + state.lastName).trim(),
    email: state.anon ? '' : state.email,
    phone: (document.getElementById('phone') || {}).value || '',
    recurring: state.donationType === 'Recurring', frequency: state.recurringFrequency
  });
  overlay.classList.remove('show');
  btn.disabled = false; btn.textContent = 'Complete Donation';
  if (result.success) {
    const name = state.anon ? 'Anonymous' : (state.firstName + ' ' + state.lastName).trim();
    // Only send confirmation email for completed (non-pending) payments
    if (!result.pending && !state.anon && state.email) {
      sendConfirmationEmail({ to: state.email, name: state.firstName, amount: donationTotal,
        currency: state.currency, frequency: state.donationType === 'Recurring' ? state.recurringFrequency : 'One-time',
        method: state.paymentMethod, wantsUpdates: state.updates, transactionId: result.transactionId });
    }
    const freqText = state.donationType === 'Recurring' ? ` (${state.recurringFrequency})` : '';
    const displayAmt = formatAmount(Math.round(donationTotal * 100) / 100);
    let msg = `Thank you${name ? ', ' + name : ''}! Your ${displayAmt}${freqText} donation`;
    if (result.pending) msg += ' is being processed — please complete payment in the new tab. A confirmation will be sent once payment is confirmed.';
    else { msg += ' has been received. Together we\'re making a difference.'; if (!state.anon && state.email) msg += ` A confirmation has been sent to ${state.email}.`; }
    document.getElementById('successMsg').textContent = msg;
    document.getElementById('successOverlay').classList.add('show');
    // Hide donation notice banner on success
    const notice = document.getElementById('donationNotice');
    if (notice) notice.style.display = 'none';
  } else if (result.error && result.error !== 'Payment cancelled') {
    showInlineError('Payment failed: ' + result.error);
  }
}

// Show inline error below the donate button instead of alert()
function showInlineError(msg) {
  let el = document.getElementById('donateError');
  if (!el) {
    el = document.createElement('div');
    el.id = 'donateError';
    el.setAttribute('role', 'alert');
    el.setAttribute('aria-live', 'assertive');
    el.style.cssText = 'color:#dc2626;font-size:12px;margin-top:8px;text-align:center;';
    const btn = document.querySelector('.donate-btn');
    if (btn) btn.parentNode.insertBefore(el, btn.nextSibling);
  }
  el.textContent = msg;
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.textContent = ''; }, 6000);
}

function onPhoneInput(input) {
  const val = input.value.trim();
  const err = document.getElementById('phoneError');
  const valid = /^\+?[\d\s\-().]{6,19}$/.test(val) && val.replace(/\D/g, '').length >= 6;
  input.classList.remove('error','valid');
  if (!val) { err.classList.remove('visible'); return; }
  if (valid) { input.classList.add('valid'); err.classList.remove('visible'); }
  else { input.classList.add('error'); if (val.length > 5) err.classList.add('visible'); }
}
function onPhoneBlur(input) {
  const val = input.value.trim();
  const err = document.getElementById('phoneError');
  if (!val) { input.classList.remove('error','valid'); err.classList.remove('visible'); return; }
  const valid = /^\+?[\d\s\-().]{6,19}$/.test(val) && val.replace(/\D/g, '').length >= 6;
  input.classList.remove('error','valid');
  if (valid) { input.classList.add('valid'); err.classList.remove('visible'); }
  else { input.classList.add('error'); err.classList.add('visible'); }
}

function resetAll() {
  document.getElementById('successOverlay').classList.remove('show');
  Object.assign(state, { currency:'USD', donationType:'One-time', recurringFrequency:'Monthly', amount:null, customAmount:null, coverFee:false, paymentMethod:null, firstName:'', lastName:'', email:'', country:'', updates:false, terms:false, anon:false, completedSections:new Set() });
  document.getElementById('recurringOptions').classList.remove('show');
  document.querySelectorAll('.freq-btn').forEach((b,i) => {
    const clean = b.dataset.origText || b.textContent.replace(/^✓\s/, '');
    b.dataset.origText = clean;
    b.classList.toggle('selected', i===0);
    b.textContent = i===0 ? '✓ ' + clean : clean;
  });
  document.querySelectorAll('.currency-btn').forEach((b,i) => {
    const clean = b.dataset.origText || b.textContent.replace(/^✓\s/, '');
    b.dataset.origText = clean;
    b.classList.toggle('selected', i===0);
    b.textContent = i===0 ? '✓ ' + clean : clean;
  });
  document.querySelectorAll('.toggle-btn').forEach((b,i) => {
    const clean = b.dataset.origText || b.textContent.replace(/^✓\s/, '');
    b.dataset.origText = clean;
    b.classList.toggle('selected', i===0);
    b.textContent = i===0 ? '✓ ' + clean : clean;
  });
  updateAmountButtons();
  document.getElementById('coverFee').checked = false;
  const feeToggleEl = document.getElementById('feeToggle');
  feeToggleEl.innerHTML = ''; feeToggleEl.style.background = ''; feeToggleEl.style.borderColor = '';
  document.querySelectorAll('.payment-btn').forEach(b => { b.classList.remove('selected','auto-selected'); });
  document.getElementById('prev-4').textContent = '';
  ['firstName','lastName','email','phone','message'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
  document.getElementById('country').value = '';
  ['firstName','lastName','email','country'].forEach(id => document.getElementById(id).classList.remove('error','valid'));
  document.getElementById('anonBox').innerHTML = ''; document.getElementById('anonBox').style = '';
  document.getElementById('donorFields').classList.remove('anon-hidden');
  document.getElementById('anonHint').textContent = 'Your information will be kept private';
  document.getElementById('emailError').classList.remove('visible');
  const phoneEl = document.getElementById('phone'); if (phoneEl) { phoneEl.value=''; phoneEl.classList.remove('error','valid'); }
  const phoneErrEl = document.getElementById('phoneError'); if (phoneErrEl) phoneErrEl.classList.remove('visible');
  ['updates','terms'].forEach(k => { const box = document.getElementById('cb-'+k); box.innerHTML=''; box.style=''; if(k==='terms') box.style.borderColor='#f87171'; });
  [1,2,3,4,5,6,7].forEach(n => {
    const card = document.getElementById('sec-'+n);
    const num = card.querySelector('.section-num');
    const prev = document.getElementById('prev-'+n);
    num.textContent = n;
    if (prev) prev.textContent = '';
    card.querySelector('.section-header').onclick = null;
    const body = document.getElementById('body-'+n);
    if (n===1) {
      card.className='section-card active';
      body.classList.add('open');
    } else {
      card.className='section-card locked';
      body.classList.remove('open');
      // Show lock icon (element always exists, just hidden when section completed)
      const lock = document.getElementById('lock-'+n);
      if (lock) lock.style.display = '';
    }
  });
  // Restore donation notice banner to red warning state
  const notice = document.getElementById('donationNotice');
  if (notice) {
    notice.style.display = '';
    notice.style.background = 'rgba(244,63,94,0.08)';
    notice.style.borderColor = '#f43f5e';
    notice.style.color = '#f43f5e';
    notice.querySelector('strong').textContent = '⚠ Before You Donate — Please Read';
  }
  // Hide inline donate error if visible
  const errEl = document.getElementById('donateError');
  if (errEl) errEl.textContent = '';
  updateProgress(); updateSummary();
  window.scrollTo({top:0, behavior:'smooth'});
}


// Init
updateAmountButtons();
updateSummary();
updateProgress();

// EmailJS — load lazily only when keys are configured
(function initEmailJS() {
  if (!CONFIG.EMAILJS_PUBLIC_KEY || CONFIG.EMAILJS_PUBLIC_KEY === 'YOUR_EMAILJS_PUBLIC_KEY') return;
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
  s.onload = () => { try { emailjs.init(CONFIG.EMAILJS_PUBLIC_KEY); } catch(e) {} };
  document.head.appendChild(s);
})();

