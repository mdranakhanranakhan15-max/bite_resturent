/**
 * Bite Billing — payments, thermal receipts, backups and CSV exports.
 */
import {
  getState, can, findTable, findUser, computeTotals, allocateInvoiceNo,
  deductStockForLines, saveState, replaceState, resetState,
} from './store.js';
import { enqueue } from './sync.js';
import { getUser, logout } from './auth.js';
import {
  $, esc, icon, money, round2, openDialog, closeDialog, toast, confirmDialog,
  uid, fmtDate, fmtTime, fmtDateTime, dateKey, downloadFile, escapeCsv,
} from './utils.js';

function queueStock(results) {
  results.forEach(({ item, log }) => {
    enqueue('INVENTORY_PUSH', 'inventory', { item: { ...item }, log: { ...log } }, item.id);
  });
}

function paymentLine(line) {
  return `<div class="pay-line">
    <div class="pl-name">${esc(line.qty)} × ${esc(line.name)}
      ${line.notes ? `<div class="pl-meta">${esc(line.notes)}</div>` : ''}
      <div class="pl-meta">${money(line.price)} each</div>
    </div>
    <div class="pl-amt">${money(Number(line.price) * Number(line.qty))}</div>
  </div>`;
}

function paymentMarkup(order, table, settings) {
  const totals = computeTotals(order.items, {
    discount: order.discount || 0, vatPct: settings.vatPct, servicePct: settings.servicePct,
  });
  const waiter = findUser(order.waiterId);
  const symbol = settings.currency || '$';
  return `<div class="pay-grid">
    <div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px">
        <div style="display:flex;align-items:center;gap:9px;min-width:0">
          <div style="width:38px;height:38px;border-radius:11px;background:var(--saffron-wash);display:grid;place-items:center;flex:0 0 auto">${icon('receipt')}</div>
          <div style="min-width:0">
            <div style="font-weight:800;font-size:12px">${esc(table?.name || order.tableId)} · ${esc(order.orderNo)}</div>
            <div class="tiny muted">${esc(order.guests || 0)} guests · ${esc(waiter?.name || 'Unassigned')}</div>
          </div>
        </div>
        <span class="badge badge-neutral">${order.items.length} line${order.items.length === 1 ? '' : 's'}</span>
      </div>
      <div class="pay-lines">${order.items.map(paymentLine).join('')}</div>
      <div class="pay-summary">
        <div class="tot-row"><span>Subtotal</span><strong id="pay-subtotal">${money(totals.subtotal)}</strong></div>
        <div class="tot-row"><span>Discount</span><strong id="pay-discount-row">${totals.discount > 0 ? '−' : ''}${money(totals.discount)}</strong></div>
        <div class="tot-row"><span>VAT <span id="pay-vat-label">${totals.vatPct}</span>%</span><strong id="pay-vat-row">${money(totals.vat)}</strong></div>
        <div class="tot-row"><span>Service <span id="pay-service-label">${totals.servicePct}</span>%</span><strong id="pay-service-row">${money(totals.service)}</strong></div>
        <div class="ps-total"><span>Total</span><strong id="pay-total">${money(totals.total)}</strong></div>
      </div>
    </div>
    <div>
      <div class="field">
        <label>Payment method</label>
        <div style="display:flex;gap:6px" id="pay-methods">
          <button type="button" class="method-btn is-active" data-method="cash">${icon('cash')} Cash</button>
          <button type="button" class="method-btn" data-method="card">${icon('card')} Card</button>
          <button type="button" class="method-btn" data-method="mobile">${icon('bag')} Mobile</button>
        </div>
      </div>
      <div class="form-grid" style="margin-top:12px;gap:9px">
        <div class="field">
          <label for="pay-discount">Discount (${esc(symbol)})</label>
          <input id="pay-discount" class="input" type="number" min="0" step="0.01" value="${order.discount || 0}" inputmode="decimal">
        </div>
        <div class="field">
          <label for="pay-vat">VAT %</label>
          <input id="pay-vat" class="input" type="number" min="0" max="30" step="0.1" value="${totals.vatPct}" inputmode="decimal">
        </div>
        <div class="field">
          <label for="pay-service">Service %</label>
          <input id="pay-service" class="input" type="number" min="0" max="30" step="0.1" value="${totals.servicePct}" inputmode="decimal">
        </div>
        <div class="field">
          <label>Quick discount</label>
          <div class="cash-chips" style="margin:0">
            <button type="button" data-discount-pct="5">5%</button>
            <button type="button" data-discount-pct="10">10%</button>
            <button type="button" data-discount-pct="15">15%</button>
            <button type="button" data-discount-pct="0">Clear</button>
          </div>
        </div>
      </div>
      <div id="pay-cash-section" style="margin-top:12px">
        <div class="field">
          <label for="pay-cash">Cash received</label>
          <input id="pay-cash" class="input" type="number" min="0" step="0.01" value="${totals.total.toFixed(2)}" inputmode="decimal">
        </div>
        <div class="cash-chips" id="pay-cash-chips"></div>
        <div class="pay-change ok" id="pay-change"></div>
      </div>
      <p class="tiny muted" style="margin:12px 0 0;line-height:1.5">Totals recalculate on every keystroke. Stock already deducted at KOT is not taken twice.</p>
    </div>
  </div>`;
}
export function openSettleModal(orderId, options = {}) {
  const user = getUser();
  if (!can(user, 'bill.settle')) {
    toast('Only cashiers, managers and admins can settle bills.', { type: 'error' });
    return null;
  }
  const order = getState().orders.find((entry) => entry.id === orderId);
  if (!order || !order.items.length) {
    toast('This ticket is no longer open.', { type: 'warn' });
    return null;
  }
  const table = findTable(order.tableId);
  const settings = getState().settings;
  let method = 'cash';

  const dialog = openDialog({
    id: 'payment-dialog',
    size: 'dlg-wide',
    eyebrow: 'Settle bill',
    title: 'Checkout',
    subtitle: `${table?.name || order.tableId} · ${order.orderNo} · ${order.items.length} line(s)`,
    body: paymentMarkup(order, table, settings),
    footer: `<span class="foot-note">An invoice number is assigned when you take payment.</span>
      <button class="btn" type="button" data-dlg-close>Cancel</button>
      <button class="btn btn-primary" type="button" data-pay-complete>${icon('check')} Charge</button>`,
  });

  const completeButton = $('[data-pay-complete]', dialog);
  const changeEl = $('#pay-change', dialog);
  const cashSection = $('#pay-cash-section', dialog);

  const readValues = () => {
    const discount = Math.max(0, Number($('#pay-discount', dialog).value) || 0);
    const vatPct = Math.min(30, Math.max(0, Number($('#pay-vat', dialog).value) || 0));
    const servicePct = Math.min(30, Math.max(0, Number($('#pay-service', dialog).value) || 0));
    const totals = computeTotals(order.items, { discount, vatPct, servicePct });
    const cash = method === 'cash'
      ? Math.max(0, Number($('#pay-cash', dialog).value) || 0)
      : totals.total;
    return {
      totals,
      cash,
      change: round2(Math.max(0, cash - totals.total)),
      short: method === 'cash' && cash < totals.total,
      discount, vatPct, servicePct,
    };
  };

  const renderCashChips = (total) => {
    const chips = $('#pay-cash-chips', dialog);
    if (!chips) return;
    const values = [total, Math.ceil(total / 5) * 5, Math.ceil(total / 10) * 10, 50, 100]
      .map((value) => round2(value))
      .filter((value, index, list) => value >= total - 0.001 && list.indexOf(value) === index)
      .slice(0, 5);
    chips.innerHTML = values.map((value, index) => `<button type="button" data-cash="${value.toFixed(2)}">${index === 0 ? 'Exact' : money(value)}</button>`).join('');
  };

  const recompute = () => {
    const values = readValues();
    $('#pay-subtotal', dialog).textContent = money(values.totals.subtotal);
    $('#pay-discount-row', dialog).textContent = `${values.totals.discount > 0 ? '−' : ''}${money(values.totals.discount)}`;
    $('#pay-vat-label', dialog).textContent = values.totals.vatPct;
    $('#pay-service-label', dialog).textContent = values.totals.servicePct;
    $('#pay-vat-row', dialog).textContent = money(values.totals.vat);
    $('#pay-service-row', dialog).textContent = money(values.totals.service);
    $('#pay-total', dialog).textContent = money(values.totals.total);

    cashSection.style.display = method === 'cash' ? '' : 'none';
    if (method !== 'cash') $('#pay-cash', dialog).value = values.totals.total.toFixed(2);

    if (method === 'cash') {
      changeEl.textContent = values.short
        ? `Short by ${money(values.totals.total - values.cash)}`
        : `Change due ${money(values.change)}`;
      changeEl.className = `pay-change ${values.short ? 'short' : 'ok'}`;
    } else {
      changeEl.textContent = 'Exact payment — no change due.';
      changeEl.className = 'pay-change ok';
    }

    if (completeButton) {
      completeButton.disabled = values.short;
      completeButton.innerHTML = `${icon('check')} Charge ${money(values.totals.total)}`;
    }
    renderCashChips(values.totals.total);
    return values;
  };

  dialog.addEventListener('input', (event) => {
    if (['pay-discount', 'pay-vat', 'pay-service', 'pay-cash'].includes(event.target.id)) recompute();
  });

  dialog.addEventListener('click', (event) => {
    const methodButton = event.target.closest('[data-method]');
    if (methodButton) {
      method = methodButton.dataset.method;
      dialog.querySelectorAll('[data-method]').forEach((button) => {
        button.classList.toggle('is-active', button === methodButton);
      });
      recompute();
      return;
    }
    const percentButton = event.target.closest('[data-discount-pct]');
    if (percentButton) {
      const subtotal = computeTotals(order.items, {}).subtotal;
      const pct = Number(percentButton.dataset.discountPct) || 0;
      $('#pay-discount', dialog).value = (subtotal * pct / 100).toFixed(2);
      recompute();
      return;
    }
    const cashButton = event.target.closest('[data-cash]');
    if (cashButton) {
      $('#pay-cash', dialog).value = Number(cashButton.dataset.cash).toFixed(2);
      recompute();
      return;
    }
    if (event.target.closest('[data-pay-complete]')) {
      settleOrder(dialog, order, method, readValues(), options);
    }
  });

  recompute();
  return dialog;
}
const METHOD_LABELS = { cash: 'Cash', card: 'Card', mobile: 'Mobile' };

function methodLabel(method) {
  return METHOD_LABELS[method] || method || 'Payment';
}

function settleOrder(dialog, order, method, values, options = {}) {
  if (values.short) return;
  const state = getState();
  const user = getUser();
  const table = findTable(order.tableId);
  if (!can(user, 'bill.settle')) {
    toast('You no longer have permission to settle this bill.', { type: 'error' });
    return;
  }

  const now = new Date().toISOString();
  const invoiceNo = allocateInvoiceNo();
  const invoice = {
    id: uid('inv'),
    invoiceNo,
    at: now,
    createdAt: now,
    tableId: order.tableId,
    tableName: table?.name || order.tableId,
    guests: order.guests || 0,
    orderId: order.id,
    orderNo: order.orderNo,
    waiterId: order.waiterId || '',
    waiterName: findUser(order.waiterId)?.name || '',
    items: order.items.map((line) => ({
      lineId: line.lineId,
      menuId: line.menuId,
      name: line.name,
      price: Number(line.price),
      qty: Number(line.qty),
      notes: line.notes || '',
      categoryId: line.categoryId || '',
      lineTotal: round2(Number(line.price) * Number(line.qty)),
    })),
    subtotal: values.totals.subtotal,
    discount: values.totals.discount,
    vatPct: values.totals.vatPct,
    vat: values.totals.vat,
    servicePct: values.totals.servicePct,
    service: values.totals.service,
    total: values.totals.total,
    method,
    cashReceived: method === 'cash' ? values.cash : values.totals.total,
    change: method === 'cash' ? values.change : 0,
    cashierId: user.id,
    cashierName: user.name,
    note: '',
    synced: false,
  };

  const { results, warnings } = deductStockForLines(order.items, {
    ref: invoiceNo, reason: 'Bill settlement', user,
  });
  queueStock(results);
  state.invoices.unshift(invoice);
  state.orders = state.orders.filter((entry) => entry.id !== order.id);
  enqueue('INVOICE_CREATED', 'invoice', {
    invoice: { ...invoice, items: invoice.items.map((line) => ({ ...line })) },
  }, invoiceNo);
  enqueue('ORDER_CANCEL', 'order', {
    orderId: order.id, orderNo: order.orderNo, tableId: order.tableId,
  }, order.orderNo);
  saveState();
  closeDialog(dialog);

  toast(`Invoice ${invoiceNo} settled.`, {
    type: 'success',
    detail: `${methodLabel(method)} · ${money(invoice.total)}${invoice.change ? ` · change ${money(invoice.change)}` : ''}`,
  });
  options.onDone?.();
  document.dispatchEvent(new CustomEvent('bite:refresh-header'));
  openReceiptModal(invoice);

  if (warnings.length) {
    const unique = [...new Map(warnings.map((item) => [item.id, item])).values()];
    toast(`${unique.length} ingredient${unique.length === 1 ? '' : 's'} are running low.`, {
      type: 'warn', detail: unique.slice(0, 3).map((item) => item.name).join(', '),
    });
  }
}
function barcodeMarkup(text) {
  let seed = 2166136261;
  for (const char of String(text)) {
    seed ^= char.charCodeAt(0);
    seed = Math.imul(seed, 16777619) >>> 0;
  }
  let bars = '';
  for (let index = 0; index < 44; index += 1) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const width = (seed % 3) + 1;
    const height = 18 + ((seed >>> 4) % 15);
    bars += `<span style="width:${width}px;height:${height}px"></span>`;
  }
  return `<div class="r-barcode" style="align-items:flex-end;height:32px" aria-hidden="true">${bars}</div>`;
}

export function renderReceiptHTML(invoice) {
  const settings = getState().settings;
  const restaurant = settings.restaurant || {};
  const items = (invoice.items || []).map((line) => `<div class="r-item">
      <div class="r-line">
        <span class="r-l">${esc(line.qty)} × ${esc(line.name)}</span>
        <span class="r-r">${money(Number(line.price) * Number(line.qty))}</span>
      </div>
      ${line.notes ? `<div class="r-small" style="padding-left:10px">↳ ${esc(line.notes)}</div>` : ''}
    </div>`).join('');

  return `<div class="receipt">
    <div class="r-center">
      <div class="r-brand">${esc(restaurant.name || 'Bite')}</div>
      <div class="r-small">${esc(restaurant.tagline || '')}</div>
      <div class="r-small">${esc(restaurant.address || '')}</div>
      <div class="r-small">${esc(restaurant.phone || '')}</div>
      ${restaurant.taxId ? `<div class="r-small">Tax ID ${esc(restaurant.taxId)}</div>` : ''}
    </div>
    <div class="r-rule"></div>
    <div class="r-line"><span>Invoice</span><span>${esc(invoice.invoiceNo)}</span></div>
    <div class="r-line"><span>Date</span><span>${esc(fmtDate(invoice.at))} ${esc(fmtTime(invoice.at))}</span></div>
    <div class="r-line"><span>Table</span><span>${esc(invoice.tableName || invoice.tableId)}</span></div>
    <div class="r-line"><span>Cashier</span><span>${esc(invoice.cashierName || '')}</span></div>
    <div class="r-line"><span>Waiter</span><span>${esc(invoice.waiterName || '—')}</span></div>
    ${invoice.guests ? `<div class="r-line"><span>Guests</span><span>${esc(invoice.guests)}</span></div>` : ''}
    <div class="r-rule"></div>
    ${items}
    <div class="r-rule"></div>
    <div class="r-line"><span>Subtotal</span><span>${money(invoice.subtotal)}</span></div>
    ${Number(invoice.discount) > 0 ? `<div class="r-line"><span>Discount</span><span>−${money(invoice.discount)}</span></div>` : ''}
    <div class="r-line"><span>VAT ${esc(invoice.vatPct)}%</span><span>${money(invoice.vat)}</span></div>
    <div class="r-line"><span>Service ${esc(invoice.servicePct)}%</span><span>${money(invoice.service)}</span></div>
    <div class="r-line r-total"><span>TOTAL</span><span>${money(invoice.total)}</span></div>
    <div class="r-rule"></div>
    <div class="r-line"><span>Paid · ${methodLabel(invoice.method)}</span><span>${money(invoice.cashReceived)}</span></div>
    <div class="r-line"><span>Change</span><span>${money(invoice.change)}</span></div>
    <div class="r-rule"></div>
    <div class="r-center r-thanks">${esc(restaurant.receiptFooter || 'Thank you. See you soon!')}</div>
    <div class="r-center r-small" style="margin-top:4px">Keep this receipt for your records.</div>
    ${barcodeMarkup(invoice.invoiceNo || invoice.id)}
    <div class="r-center r-small" style="letter-spacing:.12em">${esc(invoice.invoiceNo)}</div>
    <div class="r-center r-small" style="margin-top:4px">Powered by Bite POS</div>
  </div>`;
}

export function printInvoice(invoice) {
  const root = document.getElementById('print-root');
  if (!root) return;
  root.innerHTML = renderReceiptHTML(invoice);
  setTimeout(() => {
    try { window.print(); } catch { toast('Printing is not available in this browser.', { type: 'error' }); }
  }, 80);
}

export function openReceiptModal(invoice) {
  const dialog = openDialog({
    id: 'receipt-dialog',
    size: 'dlg-sm',
    eyebrow: 'Payment complete',
    title: invoice.invoiceNo,
    subtitle: `${fmtDateTime(invoice.at)} · ${invoice.tableName} · ${methodLabel(invoice.method)}`,
    body: `<div class="receipt-wrap">${renderReceiptHTML(invoice)}</div>`,
    footer: `<button class="btn" type="button" data-dlg-close>Done</button>
      <button class="btn btn-primary" type="button" data-print-receipt>${icon('printer')} Print 80mm</button>`,
  });
  $('[data-print-receipt]', dialog)?.addEventListener('click', () => printInvoice(invoice));
  return dialog;
}
/* Exports & backups */
export function buildSalesCsv(invoices = getState().invoices) {
  const header = [
    'Invoice', 'Date', 'Time', 'Table', 'Guests', 'Lines', 'Subtotal', 'Discount',
    'VAT %', 'VAT', 'Service %', 'Service', 'Total', 'Method', 'Cashier', 'Waiter', 'Synced',
  ];
  const rows = [header.join(',')];
  [...invoices]
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
    .forEach((invoice) => {
      rows.push([
        invoice.invoiceNo,
        dateKey(invoice.at),
        fmtTime(invoice.at),
        invoice.tableName || invoice.tableId || '',
        invoice.guests || 0,
        (invoice.items || []).length,
        Number(invoice.subtotal || 0).toFixed(2),
        Number(invoice.discount || 0).toFixed(2),
        invoice.vatPct ?? '',
        Number(invoice.vat || 0).toFixed(2),
        invoice.servicePct ?? '',
        Number(invoice.service || 0).toFixed(2),
        Number(invoice.total || 0).toFixed(2),
        invoice.method || '',
        invoice.cashierName || '',
        invoice.waiterName || '',
        invoice.synced === false ? 'no' : 'yes',
      ].map(escapeCsv).join(','));
    });
  return rows.join('\n');
}

export function exportSalesCsv(invoices = getState().invoices) {
  downloadFile(`bite-sales-${dateKey()}.csv`, `\ufeff${buildSalesCsv(invoices)}`, 'text/csv;charset=utf-8');
  toast(`${invoices.length} invoice(s) exported to CSV.`, { type: 'success' });
}

function exportJsonBackup() {
  const state = getState();
  const stamp = new Date().toTimeString().slice(0, 5).replace(':', '');
  const payload = {
    app: 'Bite POS',
    format: 'bite-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    data: state,
  };
  downloadFile(
    `bite-backup-${dateKey()}-${stamp}.json`,
    JSON.stringify(payload, null, 2),
    'application/json',
  );
  toast('Full workspace backup downloaded.', {
    type: 'success', detail: `${state.invoices.length} invoices · ${state.menu.length} dishes · ${state.inventory.length} stock items`,
  });
}

function validateBackup(payload) {
  const data = payload?.data || payload?.state || payload;
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { ok: false, error: 'This file does not look like a Bite backup.' };
  }
  if (!data.settings || typeof data.settings !== 'object') {
    return { ok: false, error: 'Backup is missing restaurant settings.' };
  }
  for (const key of ['users', 'menu', 'inventory', 'categories', 'tables']) {
    if (!Array.isArray(data[key])) {
      return { ok: false, error: `Backup is missing the “${key}” collection.` };
    }
  }
  if (!Array.isArray(data.orders)) data.orders = [];
  if (!Array.isArray(data.invoices)) data.invoices = [];
  if (!Array.isArray(data.inventoryLogs)) data.inventoryLogs = [];
  if (!Array.isArray(data.syncQueue)) data.syncQueue = [];
  return { ok: true, data };
}

async function handleBackupFile(file, dialog) {
  if (!file) return;
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const result = validateBackup(parsed);
    if (!result.ok) {
      toast('Backup rejected.', { type: 'error', detail: result.error });
      return;
    }
    const data = result.data;
    const confirmed = await confirmDialog({
      title: 'Restore this backup?',
      message: `This replaces the local workspace with <strong>${data.users.length} staff</strong>, <strong>${data.menu.length} dishes</strong> and <strong>${(data.invoices || []).length} invoices</strong>. Uploaded orders that have not synced will be replaced by this file.`,
      confirmText: 'Restore workspace',
      danger: true,
      eyebrow: file.name,
    });
    if (!confirmed) return;
    replaceState(data);
    closeDialog(dialog);
    toast('Backup restored. Please sign in again.', { type: 'success' });
    logout();
  } catch (error) {
    toast('Could not read that backup file.', { type: 'error', detail: error.message });
  }
}
export function openBackupModal() {
  const user = getUser();
  if (!can(user, 'backup.manage')) {
    toast('Only managers and admins can manage backups.', { type: 'error' });
    return null;
  }
  const state = getState();
  const pending = state.syncQueue.filter((item) => item.status !== 'SYNCED').length;
  const sizeKb = Math.max(1, Math.round(JSON.stringify(state).length / 1024));
  const lastSync = state.settings.lastSyncAt
    ? fmtDateTime(state.settings.lastSyncAt)
    : 'Never synced';

  const dialog = openDialog({
    id: 'backup-dialog',
    size: 'dlg-wide',
    eyebrow: 'Data safety',
    title: 'Backup & exports',
    subtitle: 'Your register lives in this browser. Take a copy before clearing site data.',
    body: `<div class="sync-stats">
        <div class="sync-stat"><div class="ss-label">Invoices</div><div class="ss-val">${state.invoices.length}</div></div>
        <div class="sync-stat"><div class="ss-label">Open tickets</div><div class="ss-val">${state.orders.length}</div></div>
        <div class="sync-stat"><div class="ss-label">Workspace size</div><div class="ss-val">${sizeKb} KB</div></div>
      </div>
      <div>
        <div class="backup-tile">
          <div class="bt-icon">${icon('download')}</div>
          <div style="flex:1;min-width:0">
            <h4>Full workspace backup (.JSON)</h4>
            <p>Users, PINs, menu recipes, stock, open tickets, sync queue and invoice history.</p>
          </div>
          <button class="btn" type="button" data-export-json>${icon('download')} Export JSON</button>
        </div>
        <div class="backup-tile">
          <div class="bt-icon">${icon('upload')}</div>
          <div style="flex:1;min-width:0">
            <h4>Restore from backup</h4>
            <p>Replace this device with a saved .JSON. You will be signed out afterwards.</p>
          </div>
          <input id="backup-file" type="file" accept=".json,application/json" class="hidden">
          <button class="btn" type="button" data-import-json>${icon('upload')} Choose file</button>
        </div>
        <div class="backup-tile">
          <div class="bt-icon">${icon('receipt')}</div>
          <div style="flex:1;min-width:0">
            <h4>Sales export (.CSV)</h4>
            <p>${state.invoices.length} invoices with totals, tax, payment method and staff. Opens in Excel or Sheets.</p>
          </div>
          <button class="btn" type="button" data-export-csv>${icon('download')} Export CSV</button>
        </div>
        <div class="backup-tile" style="border-color:#efc8bd;background:var(--brick-wash)">
          <div class="bt-icon" style="color:var(--brick)">${icon('alert')}</div>
          <div style="flex:1;min-width:0">
            <h4>Reset demo workspace</h4>
            <p>Wipes local data and loads the sample restaurant, menus and 7 days of sales.</p>
          </div>
          <button class="btn btn-danger" type="button" data-reset-workspace>${icon('trash')} Reset</button>
        </div>
      </div>
      <p class="tiny muted" style="margin:12px 0 0;line-height:1.6">
        ${pending ? `${pending} queued change(s) have not reached the central database. ` : 'Everything is saved locally. '}
        Last successful sync: ${esc(lastSync)}. Backups contain staff PINs — store them privately.
      </p>`,
    footer: `<span class="foot-note">Server connection settings live in the Sync Center.</span>
      <button class="btn" type="button" data-dlg-close>Close</button>`,
  });

  $('[data-export-json]', dialog)?.addEventListener('click', exportJsonBackup);
  $('[data-export-csv]', dialog)?.addEventListener('click', () => exportSalesCsv(state.invoices));

  const fileInput = $('#backup-file', dialog);
  $('[data-import-json]', dialog)?.addEventListener('click', () => fileInput?.click());
  fileInput?.addEventListener('change', async () => {
    const [file] = fileInput.files || [];
    fileInput.value = '';
    await handleBackupFile(file, dialog);
  });

  $('[data-reset-workspace]', dialog)?.addEventListener('click', async () => {
    const confirmed = await confirmDialog({
      title: 'Reset the whole workspace?',
      message: 'All local orders, invoices, custom dishes and staff changes will be replaced by the demo seed. This cannot be undone unless you exported a backup.',
      confirmText: 'Reset workspace',
      danger: true,
      eyebrow: 'Destructive action',
    });
    if (!confirmed) return;
    resetState();
    closeDialog(dialog);
    toast('Demo workspace restored.', { type: 'success' });
    logout();
  });

  return dialog;
}





