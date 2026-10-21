import { store } from '../store/syncStore.js';
import { showReceiptModal } from './posView.js';
import { money, escapeHtml, initials } from '../utils/format.js';

const ICONS = {
  box: `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`,
  alert: `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2.8 20h18.4L12 3Z"/><path d="M12 9v4"/><circle cx="12" cy="16.6" r=".8"/></svg>`,
  coins: `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/><path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></svg>`,
  receipt: `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 2h14v20l-2.3-1.6-2.4 1.6-2.3-1.6L9.7 22 7.3 20.4 5 22V2Z"/><path d="M9 7h6M9 11h6M9 15h4"/></svg>`,
  trend: `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/></svg>`,
  users: `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  shield: `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z"/><path d="m9 12 2 2 4-4"/></svg>`,
  key: `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="15" r="4"/><path d="m11 12 9-9 2 2-3 3 2 2-3 3-2-2-3 3"/></svg>`
};

function kpi({ label, value, note, tone = 'peach', icon = '', small = false }) {
  return `
    <div class="kpi kpi--${tone}">
      <span class="kpi-blob"></span>
      <span class="kpi-watermark">${icon}</span>
      <p class="kpi-label">${label}</p>
      <p class="kpi-value serif${small ? ' small' : ''}">${value}</p>
      <p class="kpi-note">${note}</p>
    </div>
  `;
}

function openInventoryModal(item = null) {
  const modalRoot = document.getElementById('modal-root');
  const isEdit = Boolean(item);

  modalRoot.innerHTML = `
    <div class="modal-shell">
      <form id="inv-form" class="modal-panel space-y-3">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="modal-title serif">${isEdit ? 'Edit ingredient' : 'New ingredient'}</h3>
            <p class="modal-sub">${isEdit ? 'Adjust stock levels, cost and supplier.' : 'Register a raw material for recipe tracking.'}</p>
          </div>
          <button type="button" id="close-inv-x" class="mini-btn" aria-label="Close">✕</button>
        </div>

        <div class="field">
          <label for="inv-name">Ingredient name</label>
          <input id="inv-name" name="name" required value="${escapeHtml(item?.name || '')}" placeholder="e.g. Smoked Cheddar" />
        </div>

        <div class="grid grid-cols-3 gap-2">
          <div class="field">
            <label for="inv-qty">Stock qty</label>
            <input id="inv-qty" name="qty" type="number" step="0.1" min="0" required value="${item?.qty ?? 25}" />
          </div>
          <div class="field">
            <label for="inv-unit">Unit</label>
            <input id="inv-unit" name="unit" required value="${escapeHtml(item?.unit || 'pcs')}" />
          </div>
          <div class="field">
            <label for="inv-min">Min alert</label>
            <input id="inv-min" name="minAlert" type="number" min="0" required value="${item?.minAlert ?? 10}" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div class="field">
            <label for="inv-cost">Unit cost (৳)</label>
            <input id="inv-cost" name="unitCost" type="number" step="0.01" min="0" required value="${item?.unitCost ?? 1.5}" />
          </div>
          <div class="field">
            <label for="inv-supplier">Supplier</label>
            <input id="inv-supplier" name="supplier" required value="${escapeHtml(item?.supplier || 'Local Vendor')}" />
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-1">
          <button type="button" id="close-inv-modal" class="btn-cream">Cancel</button>
          <button type="submit" class="btn-primary">Save stock</button>
        </div>
      </form>
    </div>
  `;

  const close = () => { modalRoot.innerHTML = ''; };
  document.getElementById('close-inv-x').onclick = close;
  document.getElementById('close-inv-modal').onclick = close;

  document.getElementById('inv-form').onsubmit = (event) => {
    event.preventDefault();
    const fd = new FormData(event.target);
    const payload = {
      id: item?.id || 'ing' + Date.now(),
      name: String(fd.get('name') || '').trim(),
      qty: Number(fd.get('qty')),
      unit: String(fd.get('unit') || '').trim(),
      minAlert: Number(fd.get('minAlert')),
      unitCost: Number(fd.get('unitCost')),
      supplier: String(fd.get('supplier') || '').trim()
    };
    store.mutate(isEdit ? 'EDIT_INVENTORY' : 'ADD_INVENTORY', (state) => {
      if (isEdit) {
        const index = state.inventory.findIndex((entry) => entry.id === item.id);
        if (index > -1) state.inventory[index] = payload;
      } else {
        state.inventory.push(payload);
      }
    }, payload);
    modalRoot.innerHTML = '';
  };
}


export function renderInventoryView(container) {
  const { inventory } = store.state;
  const lowItems = inventory.filter((item) => item.qty <= item.minAlert);
  const totalValue = inventory.reduce((sum, item) => sum + item.qty * item.unitCost, 0);

  const rowsMarkup = inventory.map((item) => {
    const isLow = item.qty <= item.minAlert;
    return `
      <tr>
        <td class="font-semibold text-[#1c1a17]">${escapeHtml(item.name)}</td>
        <td class="text-[#8a8578]">${escapeHtml(item.supplier)}</td>
        <td class="serif text-[11.5px] font-semibold text-[#1c1a17]">${item.qty} <span class="text-[8px] uppercase tracking-[0.1em] text-[#a39c8d]">${escapeHtml(item.unit)}</span></td>
        <td class="serif">${money(item.unitCost, item.unitCost < 0.1 ? 3 : 2)}</td>
        <td><span class="badge-pill ${isLow ? 'badge-low' : 'badge-ok'}">${isLow ? 'Low stock' : 'Optimal'}</span></td>
        <td class="space-x-1 text-right">
          <button type="button" data-stock-adj="${item.id}" data-delta="5" class="mini-btn green">+5 Buy</button>
          <button type="button" data-stock-adj="${item.id}" data-delta="-1" class="mini-btn red">−1 Waste</button>
          <button type="button" data-edit-ing="${item.id}" class="mini-btn">Edit</button>
        </td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <div class="pb-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="serif text-[30px] font-bold leading-[1.08] text-[#1c1a17]">Inventory</h2>
          <p class="mt-1.5 text-[11.5px] text-[#8a8578]">Raw ingredients auto-deduct on KOT &amp; billing · purchase and waste logging included.</p>
        </div>
        <button type="button" id="add-ing-btn" class="btn-primary mt-1">+ New ingredient</button>
      </div>

      <div class="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        ${kpi({ label: 'Total SKUs', value: inventory.length, note: 'Tracked raw materials', tone: 'peach', icon: ICONS.box })}
        ${kpi({ label: 'Low stock alerts', value: lowItems.length, note: 'At or below minimum', tone: 'pink', icon: ICONS.alert })}
        ${kpi({ label: 'Stock value', value: money(totalValue), note: 'At current unit cost', tone: 'mint', icon: ICONS.coins, small: true })}
      </div>

      <div class="mt-4 warm-card overflow-x-auto">
        <table class="warm-table min-w-[640px]">
          <thead>
            <tr>
              <th>Ingredient</th>
              <th>Supplier</th>
              <th>On hand</th>
              <th>Unit cost</th>
              <th>Status</th>
              <th class="text-right">Quick actions</th>
            </tr>
          </thead>
          <tbody>${rowsMarkup}</tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('add-ing-btn').onclick = () => openInventoryModal();

  container.querySelectorAll('[data-stock-adj]').forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.stockAdj;
      const delta = Number(btn.dataset.delta);
      store.mutate(delta > 0 ? 'STOCK_BUY' : 'STOCK_WASTE', (state) => {
        const target = state.inventory.find((item) => item.id === id);
        if (target) target.qty = Math.max(0, Number((target.qty + delta).toFixed(2)));
      }, { id, delta });
    };
  });

  container.querySelectorAll('[data-edit-ing]').forEach((btn) => {
    btn.onclick = () => {
      const target = inventory.find((item) => item.id === btn.dataset.editIng);
      if (target) openInventoryModal(target);
    };
  });
}


export function renderBillsView(container) {
  const { invoices } = store.state;
  const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const totalVat = invoices.reduce((sum, invoice) => sum + invoice.vat, 0);
  const avgTicket = invoices.length ? totalRevenue / invoices.length : 0;

  const rowsMarkup = invoices.map((invoice) => `
    <tr>
      <td class="font-mono text-[10px] font-semibold text-[#1c1a17]">${invoice.id}</td>
      <td class="font-semibold text-[#4c473d]">${invoice.tableId}</td>
      <td class="text-[#8a8578]">${escapeHtml(invoice.cashier)}</td>
      <td class="font-mono text-[9.5px] text-[#a39c8d]">${invoice.createdAt}</td>
      <td><span class="badge-pill badge-neutral">${invoice.payMethod}</span></td>
      <td class="serif text-[12px] font-bold text-[#1c1a17]">${money(invoice.total)}</td>
      <td class="text-right">
        <button type="button" data-reprint="${invoice.id}" class="mini-btn">Reprint 80mm</button>
      </td>
    </tr>
  `).join('');

  container.innerHTML = `
    <div class="pb-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="serif text-[30px] font-bold leading-[1.08] text-[#1c1a17]">Bills &amp; analytics</h2>
          <p class="mt-1.5 text-[11.5px] text-[#8a8578]">Settled thermal receipts, VAT ledger and one-click CSV export.</p>
        </div>
        <button type="button" id="export-csv-btn" class="btn-dark mt-1">Export CSV</button>
      </div>

      <div class="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        ${kpi({ label: 'Gross revenue', value: money(totalRevenue), note: 'All settled invoices', tone: 'peach', icon: ICONS.trend, small: true })}
        ${kpi({ label: 'Settled invoices', value: invoices.length, note: 'Printed & archived', tone: 'mint', icon: ICONS.receipt })}
        ${kpi({ label: 'Average ticket', value: money(avgTicket), note: `VAT collected ${money(totalVat)}`, tone: 'pink', icon: ICONS.coins, small: true })}
      </div>

      <div class="mt-4 warm-card overflow-x-auto">
        <table class="warm-table min-w-[640px]">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Table</th>
              <th>Cashier</th>
              <th>Timestamp</th>
              <th>Payment</th>
              <th>Total</th>
              <th class="text-right">Receipt</th>
            </tr>
          </thead>
          <tbody>${rowsMarkup}</tbody>
        </table>
      </div>
    </div>
  `;

  container.querySelectorAll('[data-reprint]').forEach((btn) => {
    btn.onclick = () => {
      const invoice = invoices.find((entry) => entry.id === btn.dataset.reprint);
      if (invoice) showReceiptModal(invoice);
    };
  });

  document.getElementById('export-csv-btn').onclick = () => {
    const rows = [
      ['InvoiceID', 'Table', 'Cashier', 'Date', 'Subtotal', 'Discount', 'VAT', 'Service', 'Total'],
      ...invoices.map((invoice) => [
        invoice.id, invoice.tableId, invoice.cashier, invoice.createdAt,
        invoice.subtotal, invoice.discount, invoice.vat, invoice.service, invoice.total
      ])
    ];
    const csv = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(blob);
    anchor.download = 'bite-invoices.csv';
    anchor.click();
  };
}


const ROLES = ['Admin', 'Manager', 'Cashier', 'Waiter', 'Chef'];

const MODULES = [
  { key: 'pos', label: 'Tables & POS' },
  { key: 'kitchen', label: 'Kitchen KOT' },
  { key: 'menu', label: 'Food menu' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'bills', label: 'Bills & analytics' },
  { key: 'staff', label: 'Staff & Roles' }
];

function openStaffModal(user) {
  const modalRoot = document.getElementById('modal-root');
  const allowed = Array.isArray(user.permissions) ? user.permissions : MODULES.map((m) => m.key);

  modalRoot.innerHTML = `
    <div class="modal-shell">
      <form id="staff-edit-form" class="modal-panel space-y-3">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="modal-title serif">Edit Staff &amp; Access</h3>
            <p class="modal-sub">Update credentials, role and module permissions.</p>
          </div>
          <button type="button" id="close-staff-x" class="mini-btn" aria-label="Close">✕</button>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div class="field">
            <label for="staff-edit-name">Full Name</label>
            <input id="staff-edit-name" name="name" required value="${escapeHtml(user.name)}" />
          </div>
          <div class="field">
            <label for="staff-edit-username">Username</label>
            <input id="staff-edit-username" name="username" required autocomplete="off" value="${escapeHtml(user.username || '')}" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div class="field">
            <label for="staff-edit-pin">4-Digit PIN</label>
            <input id="staff-edit-pin" name="pin" required maxlength="4" inputmode="numeric" pattern="\\d{4}" value="${escapeHtml(String(user.pin || ''))}" />
          </div>
          <div class="field">
            <label for="staff-edit-role">Role</label>
            <select id="staff-edit-role" name="role">
              ${ROLES.map((role) => `<option value="${role}" ${user.role === role ? 'selected' : ''}>${role}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="field">
          <label>Module Access Permissions</label>
        </div>
        <div class="grid grid-cols-2 gap-1.5 rounded-xl border border-[#e4dbc9] bg-[#fffdf9] p-2.5">
          ${MODULES.map((m) => `
            <label class="flex items-center gap-2 text-[10px] text-[#4c473d]">
              <input type="checkbox" name="module" value="${m.key}" ${allowed.includes(m.key) ? 'checked' : ''} class="h-3.5 w-3.5 accent-[#ea580c]" />
              <span>${m.label}</span>
            </label>`).join('')}
        </div>

        <div class="flex justify-end gap-2 pt-1">
          <button type="button" id="close-staff-modal" class="btn-cream">Cancel</button>
          <button type="submit" class="btn-primary">Save changes</button>
        </div>
      </form>
    </div>`;

  const close = () => { modalRoot.innerHTML = ''; };
  document.getElementById('close-staff-x').onclick = close;
  document.getElementById('close-staff-modal').onclick = close;

  document.getElementById('staff-edit-form').onsubmit = (event) => {
    event.preventDefault();
    const name = document.getElementById('staff-edit-name').value.trim();
    const username = document.getElementById('staff-edit-username').value.trim().toLowerCase();
    const pin = document.getElementById('staff-edit-pin').value.trim();
    const role = document.getElementById('staff-edit-role').value;
    const permissions = Array.from(document.querySelectorAll('#staff-edit-form [name="module"]:checked')).map((input) => input.value);

    if (!name) return window.alert('Full name is required.');
    if (!username) return window.alert('Username is required.');
    if (!/^\d{4}$/.test(pin)) return window.alert('PIN must be exactly 4 digits.');
    const clash = store.state.users.find((entry) => entry.id !== user.id && String(entry.username || entry.name).toLowerCase() === username);
    if (clash) return window.alert('That username is already taken.');
    if (!permissions.length) return window.alert('Select at least one module for this account.');

    store.mutate('EDIT_USER', (state) => {
      const target = state.users.find((entry) => entry.id === user.id);
      if (!target) return;
      target.name = name;
      target.username = username;
      target.pin = pin;
      target.role = role;
      target.permissions = permissions;
      if (state.currentUser && state.currentUser.id === target.id) state.currentUser = target;
    }, { userId: user.id, username, permissions });

    close();
  };
}

export function renderStaffView(container) {
  const { users, currentUser } = store.state;
  const activeUsers = users.filter((user) => user.active).length;
  const adminUsers = users.filter((user) => user.role === 'Admin').length;
  const roleCount = new Set(users.map((user) => user.role)).size;

  const rowsMarkup = users.map((user) => {
    const isSelf = user.id === currentUser.id;
    return `
      <tr>
        <td>
          <div class="flex items-center gap-2">
            <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f1e7d6] text-[8.5px] font-bold text-[#1c1a17] ring-1 ring-[#e5dbc9]">${initials(user.name)}</span>
            <div class="min-w-0">
              <p class="truncate text-[10.5px] font-semibold text-[#1c1a17]">${escapeHtml(user.name)}</p>
              <p class="text-[8.5px] text-[#a39c8d]">${escapeHtml(user.username || '')} · ${isSelf ? 'Signed in' : user.active ? 'Can sign in' : 'Access paused'}</p>
            </div>
          </div>
        </td>
        <td>
          <select data-role-user="${user.id}" class="rounded-lg border border-[#e0d6c2] bg-[#fffdf9] px-1.5 py-1 text-[9.5px] text-[#4c473d] outline-none focus:border-[#f59e0b]">
            ${ROLES.map((role) => `<option value="${role}" ${user.role === role ? 'selected' : ''}>${role}</option>`).join('')}
          </select>
        </td>
        <td>
          <div class="flex items-center gap-1.5">
            <span class="font-mono text-[10px] tracking-[0.16em] text-[#6b665a]">••••</span>
            <button type="button" data-reset-pin="${user.id}" class="mini-btn">Reset PIN</button>
          </div>
        </td>
        <td><span class="badge-pill ${user.active ? 'badge-ok' : 'badge-neutral'}">${user.active ? 'Active' : 'Disabled'}</span></td>
        <td class="text-right">
          <div class="flex items-center justify-end gap-1.5 whitespace-nowrap">
            ${user.active ? `<button type="button" data-pin-login="${user.id}" class="mini-btn shrink-0">PIN login</button>` : ''}
            <button type="button" data-edit-user="${user.id}" class="mini-btn shrink-0">Edit</button>
            <button type="button" data-toggle-user="${user.id}" class="mini-btn shrink-0 ${user.active ? 'red' : 'green'}">${user.active ? 'Disable' : 'Enable'}</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <div class="pb-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="serif text-[30px] font-bold leading-[1.08] text-[#1c1a17]">Staff &amp; Roles</h2>
          <p class="mt-1.5 text-[11.5px] text-[#8a8578]">Manage logins, 4-digit PINs and role permissions for the whole team.</p>
        </div>
        <span class="badge-pill badge-neutral mt-1 shrink-0 border border-[#e6dec8] bg-[#faf6ee] px-2.5 py-1">
          <span class="h-1.5 w-1.5 rounded-full bg-[#5f8f6e]"></span> ${activeUsers} enabled
        </span>
      </div>

      <div class="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        ${kpi({ label: 'Team members', value: users.length, note: 'Registered staff accounts', tone: 'peach', icon: ICONS.users })}
        ${kpi({ label: 'Active logins', value: activeUsers, note: 'Enabled right now', tone: 'mint', icon: ICONS.shield })}
        ${kpi({ label: 'Admin access', value: adminUsers, note: `${roleCount} roles configured`, tone: 'pink', icon: ICONS.key })}
      </div>

      <div class="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div class="col-span-1 warm-card overflow-x-auto xl:col-span-8">
          <table class="warm-table min-w-[560px]">
            <thead>
              <tr>
                <th>Staff member</th>
                <th>Role permission</th>
                <th>4-digit PIN</th>
                <th>Status</th>
                <th class="text-right">Controls</th>
              </tr>
            </thead>
            <tbody>${rowsMarkup}</tbody>
          </table>
        </div>

        <form id="add-staff-form" class="col-span-1 warm-card h-fit space-y-3 p-4 xl:col-span-4">
          <div>
            <h3 class="serif text-[16px] font-bold text-[#1c1a17]">Add staff account</h3>
            <p class="mt-0.5 text-[8.5px] text-[#a39c8d]">Creates a new login with a 4-digit PIN.</p>
          </div>
          <div class="field">
            <label for="staff-name">Full name</label>
            <input id="staff-name" name="name" required placeholder="e.g. Nadia Islam" />
          </div>
          <div class="field">
            <label for="staff-username">Username</label>
            <input id="staff-username" name="username" required autocomplete="off" placeholder="e.g. nadia" />
          </div>
          <div class="field">
            <label for="staff-role">Role permission</label>
            <select id="staff-role" name="role">
              ${ROLES.map((role) => `<option value="${role}">${role}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label for="staff-pin">4-digit PIN</label>
            <input id="staff-pin" name="pin" required value="1234" maxlength="4" inputmode="numeric" pattern="\\d{4}" />
          </div>
          <button type="submit" class="btn-primary w-full">Create staff user</button>
        </form>
      </div>
    </div>
  `;

  container.querySelectorAll('[data-edit-user]').forEach((btn) => {
    btn.onclick = () => {
      const target = users.find((user) => user.id === btn.dataset.editUser);
      if (target) openStaffModal(target);
    };
  });

  container.querySelectorAll('[data-pin-login]').forEach((btn) => {
    btn.onclick = () => {
      const target = users.find((user) => user.id === btn.dataset.pinLogin);
      if (!target) return;
      const entered = window.prompt(`Enter 4-digit PIN for ${target.name} (${target.role}):`, '');
      if (entered === null) return;
      if (entered.trim() === target.pin) {
        store.mutate('SWITCH_USER', (state) => {
          const found = state.users.find((user) => user.id === target.id);
          if (found) state.currentUser = found;
        }, { userId: target.id });
      } else {
        window.alert('Invalid PIN. Try again.');
      }
    };
  });

  container.querySelectorAll('[data-reset-pin]').forEach((btn) => {
    btn.onclick = () => {
      const target = users.find((user) => user.id === btn.dataset.resetPin);
      if (!target) return;
      const entered = window.prompt(`Set a new 4-digit PIN for ${target.name}:`, '');
      if (entered === null) return;
      const pin = entered.trim();
      if (!/^\d{4}$/.test(pin)) {
        window.alert('PIN must be exactly 4 digits.');
        return;
      }
      store.mutate('RESET_PIN', (state) => {
        const found = state.users.find((user) => user.id === target.id);
        if (found) found.pin = pin;
      }, { userId: target.id });
    };
  });

  container.querySelectorAll('[data-role-user]').forEach((select) => {
    select.onchange = () => {
      const userId = select.dataset.roleUser;
      const role = select.value;
      store.mutate('UPDATE_USER_ROLE', (state) => {
        const user = state.users.find((entry) => entry.id === userId);
        if (user) user.role = role;
      }, { userId, role });
    };
  });

  container.querySelectorAll('[data-toggle-user]').forEach((btn) => {
    btn.onclick = () => {
      const userId = btn.dataset.toggleUser;
      if (userId === currentUser.id) {
        window.alert('Switch to another operator before disabling this account.');
        return;
      }
      store.mutate('TOGGLE_USER', (state) => {
        const user = state.users.find((entry) => entry.id === userId);
        if (user) user.active = !user.active;
      }, { userId });
    };
  });

  document.getElementById('add-staff-form').onsubmit = (event) => {
    event.preventDefault();
    const fd = new FormData(event.target);
    const pin = String(fd.get('pin') || '').trim();
    if (!/^\d{4}$/.test(pin)) {
      window.alert('PIN must be exactly 4 digits.');
      return;
    }
    const newUser = {
      id: 'u' + Date.now(),
      name: String(fd.get('name') || '').trim(),
      username: String(fd.get('username') || '').trim().toLowerCase(),
      role: fd.get('role'),
      pin,
      active: true,
      permissions: MODULES.map((m) => m.key)
    };
    store.mutate('ADD_USER', (state) => { state.users.push(newUser); }, newUser);
  };
}

