/**
 * Bite Inventory — raw materials, movements and low-stock alerts.
 */
import {
  getState, can, saveState, UNITS, adjustStock, stockStatus, inventoryValue,
  inventoryUsage, lowStockItems, findInventory, findUser,
} from './store.js';
import { enqueue } from './sync.js';
import { getUser } from './auth.js';
import {
  $, esc, icon, money, openDialog, closeDialog, toast, confirmDialog, emptyState,
  uid, fmtDateTime, timeAgo, signedMoney, escapeCsv, downloadFile, dateKey,
} from './utils.js';

let invSearch = '';
let invFilter = 'all';

function qty(value, unit) {
  const n = Number(value) || 0;
  const formatted = n.toLocaleString('en-US', { maximumFractionDigits: 3 });
  return `${formatted}${unit ? ` ${unit}` : ''}`;
}

function filteredInventory() {
  const term = invSearch.trim().toLowerCase();
  return getState().inventory
    .filter((item) => {
      if (invFilter === 'low' && stockStatus(item) === 'ok') return false;
      if (invFilter === 'out' && stockStatus(item) !== 'out') return false;
      if (!term) return true;
      return [item.name, item.supplier, item.unit].filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    })
    .sort((a, b) => {
      const order = { out: 0, low: 1, ok: 2 };
      return order[stockStatus(a)] - order[stockStatus(b)] || String(a.name).localeCompare(String(b.name));
    });
}

function rowMarkup(item, canEdit) {
  const status = stockStatus(item);
  const usage = inventoryUsage(item.id);
  const percent = item.minStock > 0
    ? Math.min(100, Math.round((Number(item.stock) / (Number(item.minStock) * 2)) * 100))
    : (Number(item.stock) > 0 ? 100 : 0);
  const badge = status === 'out'
    ? '<span class="badge badge-brick">Out</span>'
    : status === 'low'
      ? '<span class="badge badge-amber">Low</span>'
      : '<span class="badge badge-sage">In stock</span>';
  return `<tr>
    <td>
      <div style="font-weight:800;font-size:12px">${esc(item.name)}</div>
      <div class="tiny muted">${esc(item.unit)} · ${esc(item.id)}</div>
    </td>
    <td style="min-width:120px">
      <div class="stock-num ${status === 'low' ? 'is-low' : status === 'out' ? 'is-out' : ''}">${qty(item.stock, item.unit)}</div>
      <div class="stock-bar ${status === 'low' ? 'is-low' : status === 'out' ? 'is-out' : ''}"><span style="width:${Math.max(3, percent)}%"></span></div>
    </td>
    <td>${badge}</td>
    <td class="num">${qty(item.minStock, item.unit)}</td>
    <td class="num">${money(item.unitCost)}</td>
    <td class="num">${money(Number(item.stock) * Number(item.unitCost))}</td>
    <td class="tiny">${esc(item.supplier || '—')}</td>
    <td><span class="badge badge-neutral">${usage.length} dish${usage.length === 1 ? '' : 'es'}</span></td>
    <td>
      <div class="ac-actions" style="justify-content:flex-end;flex-wrap:nowrap;gap:3px;min-width:206px">
        ${canEdit ? `<button class="btn btn-sm" type="button" data-buy="${esc(item.id)}" title="Receive 5 ${esc(item.unit)}">+5 Buy</button>
        <button class="btn btn-sm btn-danger" type="button" data-waste="${esc(item.id)}" title="Write off 1 ${esc(item.unit)}">−1 Waste</button>` : ''}
        <button class="btn btn-sm btn-icon" type="button" data-log-item="${esc(item.id)}" title="Movement history" aria-label="Movement history for ${esc(item.name)}">${icon('clock')}</button>
        <button class="btn btn-sm btn-icon" type="button" data-edit-inventory="${esc(item.id)}" ${canEdit ? '' : 'disabled'} title="Edit stock item" aria-label="Edit ${esc(item.name)}">${icon('pencil')}</button>
      </div>
    </td>
  </tr>`;
}
function tableMarkup(canEdit) {
  const items = filteredInventory();
  if (!items.length) {
    return `<tr><td colspan="9">${emptyState('box', 'No stock items match', 'Try another search, or add a new raw material.')}</td></tr>`;
  }
  return items.map((item) => rowMarkup(item, canEdit)).join('');
}

function refreshInventoryTable(root) {
  const tbody = $('#inventory-tbody', root);
  const count = $('#inventory-count', root);
  const canEdit = can(getUser(), 'inventory.edit');
  if (tbody) tbody.innerHTML = tableMarkup(canEdit);
  if (count) count.textContent = `${filteredInventory().length} item${filteredInventory().length === 1 ? '' : 's'}`;
  root.querySelectorAll('[data-filter]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.filter === invFilter);
  });
}

function queueInventory(item, log) {
  enqueue('INVENTORY_PUSH', 'inventory', {
    item: { ...item }, log: log ? { ...log } : null,
  }, item.id);
}

export function renderInventory(root) {
  const user = getUser();
  const canEdit = can(user, 'inventory.edit');
  if (!can(user, 'view.inventory')) {
    root.innerHTML = `<div class="card">${emptyState('lock', 'Inventory access required', 'Your role does not include inventory.')}</div>`;
    return;
  }
  const state = getState();
  const low = lowStockItems();
  const out = state.inventory.filter((item) => stockStatus(item) === 'out');
  const suppliers = new Set(state.inventory.map((item) => item.supplier).filter(Boolean));
  const scrollTop = root.scrollTop;

  root.innerHTML = `<div class="view-enter">
    <div class="page-head">
      <div>
        <h2>Inventory &amp; stock</h2>
        <p>${canEdit ? 'Every KOT and settled bill deducts linked ingredients automatically. Adjust for deliveries and waste here.' : 'Read-only stock view. Chefs, managers and admins can edit stock.'}</p>
      </div>
      <div class="page-actions">
        <button class="btn" type="button" data-open-logs>${icon('clock')} Movement log</button>
        ${canEdit ? `<button class="btn btn-primary" type="button" data-add-inventory>${icon('plus')} Add stock item</button>` : ''}
      </div>
    </div>
    <div class="kpi-grid">
      <div class="kpi" style="--tint:var(--saffron-wash)">
        <div class="kpi-label">Stock value</div>
        <div class="kpi-value">${money(inventoryValue())}</div>
        <div class="kpi-foot">${state.inventory.length} raw materials</div>
        <div class="kpi-icon">${icon('box')}</div>
      </div>
      <div class="kpi" style="--tint:var(--amber-wash)">
        <div class="kpi-label">Low stock</div>
        <div class="kpi-value">${low.filter((item) => stockStatus(item) === 'low').length}</div>
        <div class="kpi-foot">At or below minimum</div>
        <div class="kpi-icon">${icon('alert')}</div>
      </div>
      <div class="kpi" style="--tint:var(--brick-wash)">
        <div class="kpi-label">Out of stock</div>
        <div class="kpi-value">${out.length}</div>
        <div class="kpi-foot">${out.slice(0, 2).map((item) => esc(item.name)).join(', ') || 'Nothing empty'}</div>
        <div class="kpi-icon">${icon('alert')}</div>
      </div>
      <div class="kpi" style="--tint:var(--sage-wash)">
        <div class="kpi-label">Suppliers</div>
        <div class="kpi-value">${suppliers.size}</div>
        <div class="kpi-foot">Active purchasing partners</div>
        <div class="kpi-icon">${icon('users')}</div>
      </div>
    </div>
    <div class="inv-toolbar">
      <div class="search">
        ${icon('search')}
        <input id="inventory-search" class="input" placeholder="Search raw materials or suppliers…" value="${esc(invSearch)}" autocomplete="off" aria-label="Search inventory">
      </div>
      <div class="seg" role="group" aria-label="Stock filter">
        <button type="button" data-filter="all" class="${invFilter === 'all' ? 'is-active' : ''}">All</button>
        <button type="button" data-filter="low" class="${invFilter === 'low' ? 'is-active' : ''}">Low</button>
        <button type="button" data-filter="out" class="${invFilter === 'out' ? 'is-active' : ''}">Out</button>
      </div>
      <span class="badge badge-neutral" id="inventory-count">${filteredInventory().length} items</span>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table class="data" style="min-width:1060px">
          <thead><tr>
            <th>Raw material</th><th>On hand</th><th>Status</th><th class="num">Minimum</th>
            <th class="num">Unit cost</th><th class="num">Value</th><th>Supplier</th><th>Recipes</th><th></th>
          </tr></thead>
          <tbody id="inventory-tbody">${tableMarkup(canEdit)}</tbody>
        </table>
      </div>
    </div>
  </div>`;

  root.scrollTop = scrollTop;

  $('#inventory-search', root)?.addEventListener('input', (event) => {
    invSearch = event.target.value;
    refreshInventoryTable(root);
  });

  if (!root.dataset.inventoryBound) {
    root.addEventListener('click', (event) => handleInventoryClick(event, root));
    root.dataset.inventoryBound = '1';
  }
}
function handleInventoryClick(event, root) {
  const target = event.target;
  if (target.closest('[data-add-inventory]')) {
    openInventoryDialog(null, root);
    return;
  }
  if (target.closest('[data-open-logs]')) {
    openStockLog();
    return;
  }
  const filter = target.closest('[data-filter]');
  if (filter) {
    invFilter = filter.dataset.filter;
    refreshInventoryTable(root);
    return;
  }
  const buy = target.closest('[data-buy]');
  if (buy) {
    adjustInventory(buy.dataset.buy, 5, 'Purchase', root);
    return;
  }
  const waste = target.closest('[data-waste]');
  if (waste) {
    adjustInventory(waste.dataset.waste, -1, 'Waste', root);
    return;
  }
  const logButton = target.closest('[data-log-item]');
  if (logButton) {
    openStockLog(logButton.dataset.logItem);
    return;
  }
  const edit = target.closest('[data-edit-inventory]');
  if (edit) openInventoryDialog(edit.dataset.editInventory, root);
}

function adjustInventory(itemId, delta, reason, root) {
  if (!can(getUser(), 'inventory.edit')) {
    toast('Your role cannot adjust stock.', { type: 'error' });
    return;
  }
  const item = findInventory(itemId);
  if (!item) return;
  let change = Number(delta);
  if (change < 0) {
    const available = Math.max(0, Number(item.stock));
    const writable = Math.min(Math.abs(change), available);
    if (writable <= 0) {
      toast(`${item.name} is already empty.`, { type: 'warn' });
      return;
    }
    change = -writable;
  }
  const result = adjustStock(itemId, change, { reason, user: getUser() });
  if (!result) return;
  queueInventory(result.item, result.log);
  saveState();
  if (root?.isConnected) renderInventory(root);
  else document.dispatchEvent(new CustomEvent('bite:data-changed', { detail: { reason: 'inventory' } }));
  const status = stockStatus(result.item);
  toast(`${reason === 'Waste' ? '−' : '+'}${qty(Math.abs(change), result.item.unit)} ${reason.toLowerCase()} logged.`, {
    type: status === 'ok' ? 'success' : 'warn',
    detail: `${result.item.name} · ${qty(result.item.stock, result.item.unit)} on hand${status === 'ok' ? '' : status === 'out' ? ' · OUT OF STOCK' : ' · below minimum'}`,
  });
}

function openStockLog(itemId = null) {
  const state = getState();
  const item = itemId ? findInventory(itemId) : null;
  const logs = state.inventoryLogs
    .filter((log) => !itemId || log.inventoryId === itemId)
    .slice()
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 120);

  const increase = logs.filter((log) => Number(log.delta) > 0).reduce((sum, log) => sum + Number(log.delta), 0);
  const decrease = logs.filter((log) => Number(log.delta) < 0).reduce((sum, log) => sum + Math.abs(Number(log.delta)), 0);

  const rows = logs.map((log) => {
    const inventory = findInventory(log.inventoryId);
    const user = findUser(log.userId);
    const positive = Number(log.delta) > 0;
    return `<tr>
      <td class="tiny" title="${esc(fmtDateTime(log.at))}">${esc(timeAgo(log.at))}</td>
      <td>${esc(inventory?.name || 'Deleted item')}</td>
      <td class="num ${positive ? 'success-text' : 'danger-text'}" style="font-weight:800">${positive ? '+' : '−'}${esc(qty(Math.abs(Number(log.delta)), inventory?.unit || ''))}</td>
      <td class="num">${esc(qty(log.balance, inventory?.unit || ''))}</td>
      <td><span class="badge badge-neutral">${esc(log.reason || 'Adjustment')}</span></td>
      <td class="tiny muted">${esc(log.ref || '—')}</td>
      <td class="tiny muted">${esc(user?.name || '—')}</td>
    </tr>`;
  }).join('');

  const exportLogs = () => {
    const header = ['Time', 'Item', 'Change', 'Balance', 'Unit', 'Reason', 'Reference', 'Staff'];
    const lines = logs.map((log) => {
      const inventory = findInventory(log.inventoryId);
      const user = findUser(log.userId);
      return [
        new Date(log.at).toISOString(), inventory?.name || log.inventoryId, log.delta,
        log.balance, inventory?.unit || '', log.reason || '', log.ref || '', user?.name || '',
      ].map(escapeCsv).join(',');
    });
    downloadFile(`bite-stock-movements-${dateKey()}.csv`, [header.join(','), ...lines].join('\n'), 'text/csv;charset=utf-8');
    toast('Stock movements exported as CSV.', { type: 'success' });
  };

  openDialog({
    id: 'stock-log-dialog',
    size: 'dlg-wide',
    eyebrow: 'Audit trail',
    title: item ? `${item.name} movements` : 'Stock movements',
    subtitle: item ? `${qty(item.stock, item.unit)} on hand · minimum ${qty(item.minStock, item.unit)}` : 'Every recipe deduction, purchase and write-off, newest first.',
    body: `<div class="sync-stats">
        <div class="sync-stat"><div class="ss-label">Movements shown</div><div class="ss-val">${logs.length}</div></div>
        <div class="sync-stat"><div class="ss-label">Stock in</div><div class="ss-val success-text">+${increase.toLocaleString('en-US', { maximumFractionDigits: 2 })}</div></div>
        <div class="sync-stat"><div class="ss-label">Stock out</div><div class="ss-val danger-text">−${decrease.toLocaleString('en-US', { maximumFractionDigits: 2 })}</div></div>
      </div>
      <div class="table-wrap" style="border:1px solid var(--line);border-radius:10px">
        <table class="data" style="min-width:720px">
          <thead><tr><th>When</th><th>Item</th><th class="num">Change</th><th class="num">Balance</th><th>Reason</th><th>Ref</th><th>Staff</th></tr></thead>
          <tbody>${rows || `<tr><td colspan="7">${emptyState('clock', 'No movements yet', 'Firing a KOT or using Buy/Waste will create the first entry.')}</td></tr>`}</tbody>
        </table>
      </div>`,
    footer: `<button class="btn" type="button" data-export-log>${icon('download')} Export CSV</button>
      <button class="btn btn-primary" type="button" data-dlg-close>Done</button>`,
  }).addEventListener('click', (event) => {
    if (event.target.closest('[data-export-log]')) exportLogs();
  });
}
function openInventoryDialog(itemId = null, root = null) {
  if (!can(getUser(), 'inventory.edit')) {
    toast('Your role cannot edit stock items.', { type: 'error' });
    return null;
  }
  const existing = itemId ? findInventory(itemId) : null;
  const usage = existing ? inventoryUsage(existing.id) : [];

  const dialog = openDialog({
    id: 'inventory-dialog',
    eyebrow: existing ? 'Edit stock item' : 'New stock item',
    title: existing ? existing.name : 'Add a raw material',
    subtitle: 'Minimums drive low-stock alerts. Unit cost drives total stock value.',
    body: `<div class="form-grid">
      <div class="field span-2">
        <label for="si-name">Item name</label>
        <input id="si-name" class="input" maxlength="80" value="${esc(existing?.name || '')}" placeholder="e.g. Smoked brisket" autocomplete="off">
      </div>
      <div class="field">
        <label for="si-unit">Unit</label>
        <select id="si-unit" class="select">
          ${UNITS.map((unit) => `<option value="${unit}" ${(existing?.unit || 'piece') === unit ? 'selected' : ''}>${unit}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label for="si-supplier">Supplier</label>
        <input id="si-supplier" class="input" maxlength="80" value="${esc(existing?.supplier || '')}" placeholder="e.g. Harbor Meats">
      </div>
      <div class="field">
        <label for="si-stock">On hand</label>
        <input id="si-stock" class="input" type="number" min="0" step="0.001" inputmode="decimal" value="${existing?.stock ?? 0}">
      </div>
      <div class="field">
        <label for="si-min">Minimum alert</label>
        <input id="si-min" class="input" type="number" min="0" step="0.001" inputmode="decimal" value="${existing?.minStock ?? 0}">
      </div>
      <div class="field">
        <label for="si-cost">Unit cost (${esc(getState().settings.currency || '$')})</label>
        <input id="si-cost" class="input" type="number" min="0" step="0.01" inputmode="decimal" value="${existing?.unitCost ?? 0}">
      </div>
      <div class="field">
        <label>&nbsp;</label>
        <div class="badge badge-neutral" style="height:40px;justify-content:flex-start;padding:0 12px">${icon('box')} Recipe-linked stock</div>
      </div>
      ${existing ? `<div class="span-2 tiny muted" style="line-height:1.5">
        Used in ${usage.length ? `<strong>${usage.length}</strong> dish(es): ${esc(usage.slice(0, 4).map((item) => item.name).join(', '))}${usage.length > 4 ? '…' : ''}` : 'no recipes yet'}. Stock changes are written to the movement log.
      </div>` : ''}
    </div>`,
    footer: `${existing ? `<button class="btn btn-danger" type="button" data-inv-delete>${icon('trash')} Delete</button>` : ''}
      <span class="foot-note">Adjustments sync as INVENTORY_PUSH.</span>
      <button class="btn" type="button" data-dlg-close>Cancel</button>
      <button class="btn btn-primary" type="button" data-inv-save>${icon('check')} ${existing ? 'Save changes' : 'Add item'}</button>`,
    focus: '#si-name',
  });

  $('[data-inv-save]', dialog)?.addEventListener('click', () => {
    saveInventoryItem(dialog, existing, root);
  });

  $('[data-inv-delete]', dialog)?.addEventListener('click', () => {
    if (!existing) return;
    closeDialog(dialog);
    deleteInventoryItem(existing.id, root);
  });

  return dialog;
}
function saveInventoryItem(dialog, existing, root) {
  const state = getState();
  const name = $('#si-name', dialog).value.trim();
  const unit = $('#si-unit', dialog).value;
  const supplier = $('#si-supplier', dialog).value.trim();
  const stock = Number($('#si-stock', dialog).value);
  const minStock = Number($('#si-min', dialog).value);
  const unitCost = Number($('#si-cost', dialog).value);

  if (name.length < 2) {
    toast('Enter an item name.', { type: 'error' });
    $('#si-name', dialog).focus();
    return;
  }
  if (!UNITS.includes(unit)) return;
  if (!Number.isFinite(stock) || stock < 0 || !Number.isFinite(minStock) || minStock < 0) {
    toast('Stock and minimum must be zero or more.', { type: 'error' });
    return;
  }
  if (!Number.isFinite(unitCost) || unitCost < 0) {
    toast('Unit cost must be zero or more.', { type: 'error' });
    return;
  }

  const now = new Date().toISOString();
  const roundedStock = Math.round(stock * 1000) / 1000;
  let item;
  let log = null;

  if (existing) {
    const previous = Number(existing.stock);
    Object.assign(existing, {
      name, unit, supplier, minStock: Math.round(minStock * 1000) / 1000,
      unitCost: Math.round(unitCost * 100) / 100, stock: roundedStock, updatedAt: now,
    });
    if (previous !== roundedStock) {
      log = {
        id: uid('log'), inventoryId: existing.id,
        delta: Math.round((roundedStock - previous) * 1000) / 1000,
        balance: roundedStock, reason: 'Manual stock edit', ref: 'ADJUST',
        userId: getUser()?.id || '', at: now,
      };
      state.inventoryLogs.unshift(log);
    }
    item = existing;
  } else {
    item = {
      id: uid('inv'), name, unit, supplier, stock: roundedStock,
      minStock: Math.round(minStock * 1000) / 1000,
      unitCost: Math.round(unitCost * 100) / 100,
      createdAt: now, updatedAt: now,
    };
    state.inventory.push(item);
    if (roundedStock > 0) {
      log = {
        id: uid('log'), inventoryId: item.id, delta: roundedStock, balance: roundedStock,
        reason: 'New stock item', ref: 'SETUP', userId: getUser()?.id || '', at: now,
      };
      state.inventoryLogs.unshift(log);
    }
  }

  queueInventory(item, log);
  saveState();
  closeDialog(dialog);
  toast(existing ? 'Stock item updated.' : 'Raw material added.', {
    type: 'success', detail: `${name} · ${qty(item.stock, item.unit)} on hand`,
  });
  if (root?.isConnected) renderInventory(root);
  else document.dispatchEvent(new CustomEvent('bite:data-changed', { detail: { reason: 'inventory' } }));
}

async function deleteInventoryItem(itemId, root) {
  if (!can(getUser(), 'inventory.edit')) {
    toast('Your role cannot delete stock items.', { type: 'error' });
    return;
  }
  const item = findInventory(itemId);
  if (!item) return;
  const usage = inventoryUsage(itemId);
  if (usage.length) {
    toast('This ingredient is used by a recipe.', {
      type: 'error',
      detail: `${usage.slice(0, 3).map((entry) => entry.name).join(', ')}${usage.length > 3 ? '…' : ''} — unlink it from those dishes first.`,
    });
    return;
  }
  const confirmed = await confirmDialog({
    title: `Delete ${item.name}?`,
    message: 'The raw material and its movement history will be removed. Menu recipes are not affected because this item is not linked.',
    confirmText: 'Delete item',
    danger: true,
    eyebrow: 'Stock cleanup',
  });
  if (!confirmed) return;
  const state = getState();
  state.inventory = state.inventory.filter((entry) => entry.id !== itemId);
  state.inventoryLogs = state.inventoryLogs.filter((log) => log.inventoryId !== itemId);
  enqueue('INVENTORY_DELETE', 'inventory', { id: itemId }, itemId);
  saveState();
  if (root?.isConnected) renderInventory(root);
  else document.dispatchEvent(new CustomEvent('bite:data-changed', { detail: { reason: 'inventory' } }));
  toast(`${item.name} deleted from inventory.`, { type: 'warn' });
}



