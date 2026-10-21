/**
 * Bite POS — live table floor, menu browser and running ticket.
 */
import {
  getState, can, findTable, findCategory, findMenu, getOrderForTable, tableStatus,
  orderTotals, allocateOrderNo, deductStockForLines, saveState,
} from './store.js';
import { enqueue } from './sync.js';
import { getUser, showLogin } from './auth.js';
import { openSettleModal } from './billing.js';
import {
  $, esc, icon, money, openDialog, closeDialog, toast, emptyState,
  statusBadge, initials, uid,
} from './utils.js';

const TABLE_KEY = 'bite.activeTable';
let activeTableId = localStorage.getItem(TABLE_KEY) || 'T-03';
let categoryId = 'all';
let search = '';

function ensureActiveTable() {
  if (!findTable(activeTableId)) activeTableId = getState().tables[0]?.id || 'T-01';
}

function defaultWaiterId() {
  const user = getUser();
  if (user?.role === 'waiter') return user.id;
  const state = getState();
  return state.users.find((entry) => entry.role === 'waiter' && entry.active !== false)?.id
    || user?.id || '';
}

function waiterOptions(selectedId) {
  return getState().users
    .filter((user) => user.active !== false && ['waiter', 'cashier', 'manager', 'admin'].includes(user.role))
    .map((user) => `<option value="${esc(user.id)}" ${user.id === selectedId ? 'selected' : ''}>${esc(user.name)} · ${esc(user.role)}</option>`)
    .join('');
}

function tableChips() {
  const state = getState();
  return state.tables.map((table) => {
    const order = getOrderForTable(table.id);
    const status = tableStatus(table.id);
    const active = table.id === activeTableId;
    const total = order ? orderTotals(order).total : 0;
    const waiter = order ? state.users.find((entry) => entry.id === order.waiterId) : null;
    let meta;
    if (order) {
      meta = table.kind === 'dinein'
        ? `${order.guests || 1} guest${Number(order.guests) === 1 ? '' : 's'}${waiter ? ` · ${initials(waiter.name)}` : ''}`
        : (order.customerName || 'Counter order');
    } else {
      meta = table.kind === 'dinein' ? `${table.seats} seats · Free` : 'Walk-in';
    }
    const kindIcon = table.kind === 'takeaway' ? 'bag' : table.kind === 'delivery' ? 'arrow-right' : 'table';
    const classes = ['table-chip'];
    if (active) classes.push('is-active');
    if (status === 'occupied') classes.push('is-occupied');
    if (status === 'ready') classes.push('is-ready');
    return `<button type="button" class="${classes.join(' ')}" data-table="${esc(table.id)}" aria-pressed="${active}">
      <div class="t-name"><span>${esc(table.name)}</span><span class="t-dot"></span></div>
      <div class="t-meta"><span>${icon(kindIcon, 't-icon')}</span>${esc(meta)}</div>
      <div class="t-total">${order ? money(total) : '<span class="muted" style="font-size:11px;font-family:var(--font-sans);font-weight:600">Tap to open</span>'}</div>
    </button>`;
  }).join('');
}

function visibleMenuItems() {
  const state = getState();
  const term = search.trim().toLowerCase();
  return state.menu
    .filter((item) => categoryId === 'all' || item.categoryId === categoryId)
    .filter((item) => {
      if (!term) return true;
      return [item.name, item.description, findCategory(item.categoryId)?.name, item.station]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    })
    .sort((a, b) => (findCategory(a.categoryId)?.sort || 99) - (findCategory(b.categoryId)?.sort || 99) || (a.sort || 0) - (b.sort || 0));
}

function categoryPills() {
  const state = getState();
  const categories = [...state.categories].sort((a, b) => (a.sort || 0) - (b.sort || 0));
  const all = `<button type="button" class="cat-pill ${categoryId === 'all' ? 'is-active' : ''}" data-cat="all">All menu · ${state.menu.length}</button>`;
  return all + categories.map((category) => {
    const count = state.menu.filter((item) => item.categoryId === category.id).length;
    return `<button type="button" class="cat-pill ${categoryId === category.id ? 'is-active' : ''}" data-cat="${esc(category.id)}">${esc(category.name)} · ${count}</button>`;
  }).join('');
}

function foodCards() {
  const user = getUser();
  const order = getOrderForTable(activeTableId);
  const canOrder = can(user, 'pos.order');
  const items = visibleMenuItems();
  if (!items.length) {
    return `<div style="grid-column:1/-1">${emptyState('search', 'Nothing on the pass', 'Try another search term or a different menu category.')}</div>`;
  }
  return items.map((item) => {
    const category = findCategory(item.categoryId);
    const soldOut = item.available === false;
    const inCart = (order?.items || [])
      .filter((line) => line.menuId === item.id)
      .reduce((sum, line) => sum + Number(line.qty || 0), 0);
    return `<div class="food-card ${soldOut ? 'is-soldout' : ''}" style="--cat-tint:${category?.tint || '#f6efe2'}">
      ${soldOut ? '<span class="fc-sold">Sold out</span>' : inCart ? `<span class="fc-qty">${inCart}</span>` : ''}
      <div class="fc-art" style="font-family:var(--font-display);font-size:15px;font-weight:600">${esc(category?.letter || 'B')}</div>
      <div>
        <div class="fc-cat">${esc(category?.name || 'Uncategorised')}</div>
        <div class="fc-name">${esc(item.name)}</div>
      </div>
      <div class="fc-desc">${esc(item.description || '')}</div>
      <div class="fc-foot">
        <span class="fc-price">${money(item.price)}</span>
        <button type="button" class="fc-add" data-add-item="${esc(item.id)}" ${soldOut || !canOrder ? 'disabled' : ''} aria-label="Add ${esc(item.name)}">
          ${icon('plus')}
        </button>
      </div>
    </div>`;
  }).join('');
}

function catalogMarkup() {
  return `<div class="category-pills" id="cat-pills">${categoryPills()}</div>
    <div class="food-grid" id="food-grid">${foodCards()}</div>`;
}
function orderPhase(order) {
  if (!order?.items.length) return { label: 'Free', cls: 'badge-neutral' };
  const items = order.items;
  if (items.some((line) => line.status === 'unsent')) return { label: 'Open', cls: 'badge-amber' };
  if (items.some((line) => line.status === 'cooking')) return { label: 'Cooking', cls: 'badge-accent' };
  if (items.every((line) => line.status === 'served')) return { label: 'Served', cls: 'badge-neutral' };
  return { label: 'Ready', cls: 'badge-sage' };
}

function cartLine(line, canEdit) {
  const locked = line.status !== 'unsent';
  return `<div class="cart-line">
    <div class="cl-main">
      <div class="cl-name">${esc(line.name)}</div>
      <div class="cl-price">${money(line.price)} each</div>
      ${line.notes ? `<div class="cl-note">${icon('pencil')} ${esc(line.notes)}</div>` : ''}
      <div class="cl-status">
        ${statusBadge(line.status)}
        ${!locked && canEdit ? `<button type="button" class="note-chip" data-note-line="${esc(line.lineId)}">+ note</button>` : ''}
      </div>
    </div>
    <div class="cl-controls">
      ${locked
        ? `<span class="cl-total">×${esc(line.qty)} · ${money(Number(line.price) * Number(line.qty))}</span>`
        : `<div class="qty-stepper">
             <button type="button" data-qty="-1" data-line="${esc(line.lineId)}" aria-label="Decrease quantity">${icon('minus')}</button>
             <span>${esc(line.qty)}</span>
             <button type="button" data-qty="1" data-line="${esc(line.lineId)}" aria-label="Increase quantity">${icon('plus')}</button>
           </div>
           <span class="cl-total">${money(Number(line.price) * Number(line.qty))}</span>
           <button type="button" class="cl-remove" data-remove-line="${esc(line.lineId)}" aria-label="Remove ${esc(line.name)}">${icon('trash')}</button>`}
    </div>
  </div>`;
}

function ticketMarkup() {
  const table = findTable(activeTableId);
  if (!table) return '';
  const user = getUser();
  const order = getOrderForTable(activeTableId);
  const phase = orderPhase(order);
  const totals = order ? orderTotals(order) : null;
  const items = order?.items || [];
  const unsent = items.filter((line) => line.status === 'unsent');
  const canEdit = can(user, 'pos.order');
  const kindIcon = table.kind === 'takeaway' ? 'bag' : table.kind === 'delivery' ? 'arrow-right' : 'table';
  const meta = table.kind === 'dinein' ? `${table.zone} · ${table.seats} seats` : table.zone;

  const guestField = table.kind === 'dinein'
    ? `<div class="field">
         <label>Guests</label>
         <div class="guest-stepper">
           <button type="button" data-guest="-1" aria-label="Fewer guests">−</button>
           <span>${order?.guests || 1}</span>
           <button type="button" data-guest="1" aria-label="More guests">+</button>
         </div>
       </div>`
    : `<div class="field">
         <label>Customer</label>
         <input id="ticket-customer" class="input" maxlength="60" value="${esc(order?.customerName || '')}" placeholder="Pickup name" autocomplete="off">
       </div>`;

  const header = `<div class="ticket-head">
    <div class="th-top">
      <div>
        <h3>${esc(table.name)}</h3>
        <div class="th-sub">${icon(kindIcon)} ${esc(meta)}${order ? ` · ${esc(order.orderNo)}` : ''}</div>
      </div>
      <span class="badge ${phase.cls}">${esc(phase.label)}</span>
    </div>
    ${order ? `<div class="ticket-meta">
      <div class="field">
        <label>Assigned waiter</label>
        <select class="select" id="ticket-waiter" aria-label="Assigned waiter">${waiterOptions(order.waiterId)}</select>
      </div>
      ${guestField}
    </div>` : ''}
  </div>`;

  if (!order) {
    return `${header}
      <div class="ticket-scroll">
        <div class="ticket-empty">
          ${icon('receipt')}
          <p>No open order</p>
          <span>Tap a dish to start a ticket for ${esc(table.name)}. Everything saves locally first.</span>
        </div>
      </div>
      <div class="ticket-actions">
        <button class="btn btn-primary btn-block" type="button" data-action="focus-menu">${icon('bag')} Browse the menu</button>
      </div>`;
  }

  return `${header}
    <div class="ticket-scroll">
      ${items.map((line) => cartLine(line, canEdit)).join('')}
    </div>
    <div class="ticket-totals">
      <div class="tot-row"><span>Subtotal · ${totals.qty} item${totals.qty === 1 ? '' : 's'}</span><strong>${money(totals.subtotal)}</strong></div>
      <div class="tot-row"><span>VAT ${totals.vatPct}%</span><strong>${money(totals.vat)}</strong></div>
      <div class="tot-row"><span>Service ${totals.servicePct}%</span><strong>${money(totals.service)}</strong></div>
      <div class="tot-row grand"><span>Total</span><strong>${money(totals.total)}</strong></div>
    </div>
    <div class="ticket-actions">
      <button class="btn btn-accent" type="button" data-action="send-kot" ${unsent.length && canEdit ? '' : 'disabled'}>
        ${icon('flame')} Send KOT${unsent.length ? ` · ${unsent.length}` : ''}
      </button>
      ${can(user, 'bill.settle')
        ? `<button class="btn btn-primary" type="button" data-action="settle">${icon('receipt')} Settle bill</button>`
        : `<button class="btn" type="button" disabled title="A cashier or manager settles payments">${icon('lock')} Cashier settles</button>`}
    </div>`;
}
function mobileTicketBar() {
  const table = findTable(activeTableId);
  const order = getOrderForTable(activeTableId);
  if (!table || !order?.items.length) return '';
  const totals = orderTotals(order);
  return `<button class="mobile-ticket-jump" type="button" data-action="scroll-ticket">
    <span>
      <span class="mtj-table">${esc(table.name)} · ${esc(order.orderNo)}</span>
      <span class="mtj-meta">${totals.qty} item${totals.qty === 1 ? '' : 's'} · ${money(totals.total)}</span>
    </span>
    <span class="mtj-cta">View ticket ${icon('arrow-right')}</span>
  </button>`;
}

function renderCatalog(root) {
  const pills = $('#cat-pills', root);
  const grid = $('#food-grid', root);
  const count = $('#menu-count', root);
  if (pills) pills.innerHTML = categoryPills();
  if (grid) grid.innerHTML = foodCards();
  if (count) count.textContent = `${visibleMenuItems().length} item${visibleMenuItems().length === 1 ? '' : 's'}`;
}

function refreshPOS(root) {
  const strip = $('#table-strip', root);
  const ticket = $('#ticket', root);
  const mobileBar = $('#mobile-ticket-bar', root);
  if (strip) strip.innerHTML = tableChips();
  if (ticket) ticket.innerHTML = ticketMarkup();
  if (mobileBar) mobileBar.innerHTML = mobileTicketBar();
  renderCatalog(root);
  document.dispatchEvent(new CustomEvent('bite:refresh-header'));
}

export function renderPOS(root) {
  ensureActiveTable();
  const user = getUser();
  if (!user) {
    root.innerHTML = `<div class="view-enter">
      <div class="card" style="margin-top:24px">
        ${emptyState('lock', 'Sign in to open the floor', 'Bite keeps every order on this device. Choose a staff profile to start service.')}
        <div style="display:flex;justify-content:center;padding-bottom:24px">
          <button class="btn btn-primary" type="button" data-login>${icon('lock')} Staff sign in</button>
        </div>
      </div>
    </div>`;
    root.querySelector('[data-login]')?.addEventListener('click', () => showLogin());
    return;
  }

  const scrollTop = root.scrollTop;
  const state = getState();
  const open = state.orders.filter((order) => order.items.length);
  const free = state.tables.filter((table) => tableStatus(table.id) === 'free').length;
  const onFloor = open.reduce((sum, order) => sum + orderTotals(order).total, 0);
  const table = findTable(activeTableId);

  root.innerHTML = `<div class="view-enter">
    <div class="pos-toolbar" style="justify-content:space-between;margin-bottom:10px">
      <div class="flex items-center gap-2" style="flex-wrap:wrap">
        <span class="badge badge-accent">${icon('flame')} Live floor</span>
        <span class="tiny muted">${open.length} open ticket${open.length === 1 ? '' : 's'} · ${free} tables free · ${money(onFloor)} on the floor</span>
      </div>
      <div class="page-actions">
        <button class="icon-btn" type="button" data-action="refresh" title="Refresh floor" aria-label="Refresh floor">${icon('sync')}</button>
        <button class="btn btn-sm" type="button" data-action="takeaway">${icon('bag')} Takeaway</button>
        <button class="btn btn-sm" type="button" data-action="delivery">${icon('arrow-right')} Delivery</button>
      </div>
    </div>
    <div class="table-strip-wrap">
      <div class="table-strip" id="table-strip">${tableChips()}</div>
    </div>
    <div class="pos-layout">
      <section class="menu-pane" aria-label="Menu">
        <div class="pos-toolbar">
          <div class="search">
            ${icon('search')}
            <input id="pos-search" class="input" placeholder="Search ${state.menu.length} dishes, drinks & snacks…" value="${esc(search)}" autocomplete="off" aria-label="Search menu">
          </div>
          <span class="badge badge-neutral" id="menu-count">${visibleMenuItems().length} items</span>
        </div>
        ${catalogMarkup()}
      </section>
      <aside class="ticket" id="ticket" aria-label="Current ticket">${ticketMarkup()}</aside>
    </div>
    <div id="mobile-ticket-bar">${mobileTicketBar()}</div>
  </div>`;

  root.scrollTop = scrollTop;

  const searchInput = $('#pos-search', root);
  searchInput?.addEventListener('input', (event) => {
    search = event.target.value;
    renderCatalog(root);
  });

  if (!root.dataset.posBound) {
    root.addEventListener('click', (event) => handleClick(event, root));
    root.addEventListener('change', (event) => handleChange(event, root));
    root.dataset.posBound = '1';
  }

  const activeChip = root.querySelector('.table-chip.is-active');
  if (activeChip?.parentElement) {
    const strip = activeChip.parentElement;
    strip.scrollLeft = Math.max(0, activeChip.offsetLeft - strip.clientWidth / 2 + activeChip.clientWidth / 2);
  }

  if (table) {
    document.dispatchEvent(new CustomEvent('bite:table-focus', { detail: { tableId: table.id } }));
  }
}
function setActiveTable(tableId, root) {
  if (!findTable(tableId)) return;
  activeTableId = tableId;
  localStorage.setItem(TABLE_KEY, tableId);
  const scrollTop = root.scrollTop;
  renderPOS(root);
  root.scrollTop = scrollTop;
}

function createOrder(table) {
  const now = new Date().toISOString();
  const order = {
    id: uid('ord'),
    orderNo: allocateOrderNo(),
    tableId: table.id,
    guests: table.kind === 'dinein' ? Math.max(1, Number(table.seats) || 2) : 0,
    waiterId: defaultWaiterId(),
    customerName: '',
    note: '',
    discount: 0,
    createdAt: now,
    updatedAt: now,
    sentAt: null,
    items: [],
  };
  getState().orders.push(order);
  return order;
}

function queueOrder(order, type = 'ORDER_UPSERT') {
  enqueue(type, 'order', {
    order: { ...order, items: order.items.map((line) => ({ ...line })) },
  }, order.orderNo);
}

function queueStock(results) {
  results.forEach(({ item, log }) => {
    enqueue('INVENTORY_PUSH', 'inventory', { item: { ...item }, log: { ...log } }, item.id);
  });
}

function dropOrder(order) {
  const state = getState();
  state.orders = state.orders.filter((entry) => entry.id !== order.id);
  enqueue('ORDER_CANCEL', 'order', {
    orderId: order.id, orderNo: order.orderNo, tableId: order.tableId,
  }, order.orderNo);
}

function addItem(menuId, root) {
  const user = getUser();
  if (!can(user, 'pos.order')) {
    toast('Your role cannot add items to an order.', { type: 'error' });
    return;
  }
  const item = findMenu(menuId);
  const table = findTable(activeTableId);
  if (!item || !table) return;
  if (item.available === false) {
    toast(`${item.name} is sold out.`, { type: 'warn' });
    return;
  }

  let order = getOrderForTable(activeTableId);
  let created = false;
  if (!order) {
    order = createOrder(table);
    created = true;
  }
  const existing = order.items.find((line) => line.menuId === menuId && line.status === 'unsent' && !line.notes);
  if (existing) {
    existing.qty = Number(existing.qty) + 1;
  } else {
    order.items.push({
      lineId: uid('line'), menuId, name: item.name, price: Number(item.price), qty: 1,
      notes: '', status: 'unsent', sentAt: null, stockDeducted: false, categoryId: item.categoryId,
    });
  }
  order.updatedAt = new Date().toISOString();
  queueOrder(order);
  saveState();
  refreshPOS(root);
  if (created) {
    toast(`Order ${order.orderNo} opened on ${table.name}.`, {
      type: 'success', detail: 'Add items, then fire the kitchen ticket.',
    });
  }
}
function changeLineQty(lineId, delta, root) {
  if (!can(getUser(), 'pos.order')) return;
  const order = getOrderForTable(activeTableId);
  const line = order?.items.find((entry) => entry.lineId === lineId);
  if (!order || !line) return;
  if (line.status !== 'unsent') {
    toast('This item is already in the kitchen. Ask a chef to void it.', { type: 'warn' });
    return;
  }
  const next = Number(line.qty) + delta;
  if (next <= 0) {
    removeLine(lineId, root);
    return;
  }
  line.qty = next;
  order.updatedAt = new Date().toISOString();
  queueOrder(order);
  saveState();
  refreshPOS(root);
}

function removeLine(lineId, root) {
  if (!can(getUser(), 'pos.order')) return;
  const order = getOrderForTable(activeTableId);
  const line = order?.items.find((entry) => entry.lineId === lineId);
  if (!order || !line) return;
  if (line.status !== 'unsent') {
    toast('Sent items cannot be removed from the ticket.', { type: 'warn' });
    return;
  }
  order.items = order.items.filter((entry) => entry.lineId !== lineId);
  if (!order.items.length) {
    dropOrder(order);
  } else {
    order.updatedAt = new Date().toISOString();
    queueOrder(order);
  }
  saveState();
  refreshPOS(root);
  toast(`${line.name} removed from the ticket.`, { type: 'info' });
}

function setGuests(delta, root) {
  if (!can(getUser(), 'pos.order')) return;
  const table = findTable(activeTableId);
  const order = getOrderForTable(activeTableId);
  if (!order || table?.kind !== 'dinein') return;
  order.guests = Math.max(1, Math.min(40, Number(order.guests || 1) + delta));
  order.updatedAt = new Date().toISOString();
  queueOrder(order);
  saveState();
  refreshPOS(root);
}

function editLineNote(lineId, root) {
  const order = getOrderForTable(activeTableId);
  const line = order?.items.find((entry) => entry.lineId === lineId);
  if (!order || !line || line.status !== 'unsent') return;
  const dialog = openDialog({
    id: 'line-note-dialog',
    size: 'dlg-sm',
    eyebrow: 'Kitchen note',
    title: `Note for ${line.name}`,
    subtitle: 'Notes print on the KOT and travel with the ticket.',
    body: `<div class="field">
        <label for="line-note">Instructions</label>
        <textarea id="line-note" class="textarea" maxlength="140" placeholder="No onions, sauce on the side, allergy…">${esc(line.notes || '')}</textarea>
      </div>
      <div class="quick-notes" style="padding:9px 0 0">
        ${['No onions', 'No pickles', 'Extra spicy', 'Sauce on the side', 'Gluten-free', 'Allergy note']
          .map((note) => `<button type="button" class="note-chip" data-note-quick="${esc(note)}">${esc(note)}</button>`).join('')}
      </div>`,
    footer: `<button class="btn" type="button" data-dlg-close>Cancel</button>
      <button class="btn btn-primary" type="button" data-note-save>${icon('check')} Save note</button>`,
    focus: '#line-note',
  });
  const area = $('#line-note', dialog);
  dialog.querySelectorAll('[data-note-quick]').forEach((button) => {
    button.addEventListener('click', () => {
      const note = button.dataset.noteQuick;
      area.value = area.value.trim() ? `${area.value.trim()}, ${note}` : note;
      area.focus();
    });
  });
  $('[data-note-save]', dialog)?.addEventListener('click', () => {
    line.notes = area.value.trim().slice(0, 140);
    order.updatedAt = new Date().toISOString();
    queueOrder(order);
    saveState();
    closeDialog(dialog);
    refreshPOS(root);
    toast('Kitchen note saved.', { type: 'success' });
  });
}

function handleChange(event, root) {
  if (event.target.id === 'ticket-waiter') {
    const order = getOrderForTable(activeTableId);
    if (!order) return;
    order.waiterId = event.target.value;
    order.updatedAt = new Date().toISOString();
    queueOrder(order);
    saveState();
    refreshPOS(root);
    toast('Waiter reassigned.', { type: 'info', timeout: 1600 });
  }
  if (event.target.id === 'ticket-customer') {
    const order = getOrderForTable(activeTableId);
    if (!order) return;
    order.customerName = event.target.value.trim().slice(0, 60);
    order.updatedAt = new Date().toISOString();
    queueOrder(order);
    saveState();
    refreshPOS(root);
  }
}
function sendKot(root) {
  const user = getUser();
  if (!can(user, 'pos.order')) {
    toast('Your role cannot fire kitchen tickets.', { type: 'error' });
    return;
  }
  const order = getOrderForTable(activeTableId);
  const unsent = order?.items.filter((line) => line.status === 'unsent') || [];
  if (!order || !unsent.length) {
    toast('Everything on this ticket is already with the kitchen.', { type: 'info' });
    return;
  }
  const now = new Date().toISOString();
  unsent.forEach((line) => {
    line.status = 'cooking';
    line.sentAt = now;
  });
  order.sentAt = now;
  order.updatedAt = now;

  const { results, warnings } = deductStockForLines(unsent, {
    ref: order.orderNo, reason: 'KOT deduction', user,
  });
  queueOrder(order, 'KOT_SENT');
  queueStock(results);
  saveState();
  refreshPOS(root);

  const table = findTable(order.tableId);
  toast(`KOT fired for ${table?.name || 'order'}.`, {
    type: 'success',
    detail: `${unsent.reduce((sum, line) => sum + Number(line.qty), 0)} item(s) · ${results.length} stock movement(s)`,
  });
  if (warnings.length) {
    const unique = [...new Map(warnings.map((item) => [item.id, item])).values()];
    toast(`${unique.length} ingredient${unique.length === 1 ? '' : 's'} now low.`, {
      type: 'warn', detail: unique.slice(0, 3).map((item) => item.name).join(', '),
    });
  }
}

function settleBill(root) {
  const order = getOrderForTable(activeTableId);
  if (!order?.items.length) {
    toast('There is nothing to settle on this table.', { type: 'info' });
    return;
  }
  if (!can(getUser(), 'bill.settle')) {
    toast('Ask a cashier or manager to settle this bill.', { type: 'warn' });
    return;
  }
  openSettleModal(order.id, { onDone: () => { renderPOS(root); } });
}

function handleAction(action, root) {
  switch (action) {
    case 'refresh':
      renderPOS(root);
      toast('Floor refreshed.', { type: 'info', timeout: 1500 });
      break;
    case 'takeaway':
      setActiveTable('TAKEAWAY', root);
      break;
    case 'delivery':
      setActiveTable('DELIVERY', root);
      break;
    case 'focus-menu':
      $('#pos-search', root)?.focus();
      $('#food-grid', root)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      break;
    case 'scroll-ticket':
      $('#ticket', root)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      break;
    case 'send-kot':
      sendKot(root);
      break;
    case 'settle':
      settleBill(root);
      break;
    default:
      break;
  }
}

function handleClick(event, root) {
  const target = event.target;
  const tableButton = target.closest('[data-table]');
  if (tableButton) {
    setActiveTable(tableButton.dataset.table, root);
    return;
  }
  const catButton = target.closest('[data-cat]');
  if (catButton) {
    categoryId = catButton.dataset.cat;
    renderCatalog(root);
    return;
  }
  const addButton = target.closest('[data-add-item]');
  if (addButton) {
    addItem(addButton.dataset.addItem, root);
    return;
  }
  const qtyButton = target.closest('[data-qty]');
  if (qtyButton) {
    changeLineQty(qtyButton.dataset.line, Number(qtyButton.dataset.qty), root);
    return;
  }
  const removeButton = target.closest('[data-remove-line]');
  if (removeButton) {
    removeLine(removeButton.dataset.removeLine, root);
    return;
  }
  const noteButton = target.closest('[data-note-line]');
  if (noteButton) {
    editLineNote(noteButton.dataset.noteLine, root);
    return;
  }
  const guestButton = target.closest('[data-guest]');
  if (guestButton) {
    setGuests(Number(guestButton.dataset.guest), root);
    return;
  }
  const actionButton = target.closest('[data-action]');
  if (actionButton) handleAction(actionButton.dataset.action, root);
}




