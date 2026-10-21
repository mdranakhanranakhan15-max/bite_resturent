/**
 * Bite Kitchen — live KOT board. Cooking → Ready → Served.
 */
import {
  getState, STATIONS, can, findMenu, findTable, findUser, saveState,
} from './store.js';
import { enqueue } from './sync.js';
import { getUser, showLogin } from './auth.js';
import {
  esc, icon, toast, emptyState, statusBadge, minutesSince, durationLabel, initials,
} from './utils.js';

let station = 'all';
let tickTimer = null;
let boundRoot = null;

function matchesStation(line) {
  if (station === 'all') return true;
  const menu = findMenu(line.menuId);
  return (menu?.station || 'Kitchen') === station;
}

function orderLines(order, status) {
  return order.items.filter((line) => line.status === status && matchesStation(line));
}

function openBoardOrders() {
  return getState().orders
    .filter((order) => order.items.length)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

function orderWait(order, lines) {
  const stamps = lines.map((line) => line.sentAt).filter(Boolean);
  if (!stamps.length) return minutesSince(order.createdAt);
  const oldest = stamps.map((stamp) => new Date(stamp).getTime()).sort((a, b) => a - b)[0];
  return Math.max(0, Math.floor((Date.now() - oldest) / 60000));
}

function kotCard(order, status) {
  const lines = orderLines(order, status);
  if (!lines.length) return '';
  const table = findTable(order.tableId);
  const waiter = findUser(order.waiterId);
  const wait = orderWait(order, lines);
  const late = status === 'cooking' && wait >= 15;
  const canBump = can(getUser(), 'kitchen.bump');
  const nextStatus = status === 'cooking' ? 'ready' : status === 'ready' ? 'served' : null;
  const nextLabel = status === 'cooking' ? 'Mark ready' : status === 'ready' ? 'Mark served' : '';
  const nextIcon = status === 'cooking' ? 'check' : 'receipt';

  return `<article class="kot ${status === 'ready' ? 'is-ready' : status === 'served' ? 'is-served' : ''}">
    <div class="kot-head">
      <div>
        <div class="kot-table">${esc(table?.name || order.tableId)}</div>
        <div class="kot-sub">
          <span>${esc(order.orderNo)}</span>
          ${table?.kind === 'dinein' ? `<span>· ${esc(order.guests || 1)} guests</span>` : `<span>· ${esc(order.customerName || 'Counter')}</span>`}
          ${waiter ? `<span>· ${esc(initials(waiter.name))}</span>` : ''}
        </div>
      </div>
      <div class="kot-time ${late ? 'is-late' : ''}" data-elapsed="${esc(lines[0].sentAt || order.createdAt)}">${durationLabel(wait)}</div>
    </div>
    <div class="kot-items">
      ${lines.map((line) => `<div class="kot-item">
        <span class="qty">×${esc(line.qty)}</span>
        <span class="nm">${esc(line.name)}</span>
        <span class="st">${statusBadge(line.status)}</span>
      </div>
      ${line.notes ? `<div class="kot-note">${icon('pencil')} ${esc(line.notes)}</div>` : ''}`).join('')}
    </div>
    <div class="kot-foot">
      ${canBump && nextStatus
        ? `<button class="btn ${status === 'cooking' ? 'btn-accent' : 'btn-primary'}" type="button" data-bump data-order="${esc(order.id)}" data-from="${status}" data-to="${nextStatus}">
             ${icon(nextIcon)} ${nextLabel} · ${lines.length}
           </button>`
        : canBump && status === 'served'
          ? `<span class="badge badge-neutral">${icon('check')} Passed</span>`
          : `<span class="badge badge-neutral">${icon('lock')} Read-only</span>`}
    </div>
  </article>`;
}

function columnMarkup(status, orders) {
  const cards = orders
    .filter((order) => orderLines(order, status).length)
    .map((order) => kotCard(order, status))
    .join('');
  const count = orders.filter((order) => orderLines(order, status).length).length;
  const titles = { cooking: 'Cooking', ready: 'Ready to pass', served: 'Served' };
  const dots = { cooking: 'st-cooking', ready: 'st-ready', served: 'st-served' };
  return `<section class="board-col" aria-label="${titles[status]}">
    <div class="board-col-head">
      <h3><span class="st-dot ${dots[status]}"></span>${titles[status]}</h3>
      <span class="count">${count}</span>
    </div>
    ${cards || `<div class="board-empty">No tickets ${status === 'cooking' ? 'cooking' : status === 'ready' ? 'ready yet' : 'served yet'}${station === 'all' ? '' : ` at ${esc(station)}`}.</div>`}
  </section>`;
}

function stationChips(orders) {
  const allCount = orders.reduce((sum, order) => sum + order.items.filter((line) => ['cooking', 'ready'].includes(line.status)).length, 0);
  const chips = [`<button type="button" class="cat-pill ${station === 'all' ? 'is-active' : ''}" data-station="all">All stations · ${allCount}</button>`];
  STATIONS.forEach((name) => {
    const count = orders.reduce((sum, order) => sum + order.items.filter((line) => line.status !== 'served' && (findMenu(line.menuId)?.station || 'Kitchen') === name).length, 0);
    chips.push(`<button type="button" class="cat-pill ${station === name ? 'is-active' : ''}" data-station="${esc(name)}">${esc(name)} · ${count}</button>`);
  });
  return chips.join('');
}
export function renderKitchen(root) {
  const user = getUser();
  if (!user) {
    root.innerHTML = `<div class="card" style="margin-top:24px">${emptyState('lock', 'Sign in for the kitchen board', 'Staff profiles control who can fire and bump kitchen tickets.')}
      <div style="display:flex;justify-content:center;padding-bottom:24px"><button class="btn btn-primary" type="button" data-login>${icon('lock')} Staff sign in</button></div></div>`;
    root.querySelector('[data-login]')?.addEventListener('click', () => showLogin());
    return;
  }
  if (!can(user, 'view.kitchen')) {
    root.innerHTML = `<div class="card">${emptyState('lock', 'Kitchen access required', 'Your role does not include the kitchen display. Ask an admin to update your profile.')}</div>`;
    return;
  }

  const orders = openBoardOrders();
  const scrollTop = root.scrollTop;
  const cooking = orders.reduce((sum, order) => sum + orderLines(order, 'cooking').length, 0);
  const ready = orders.reduce((sum, order) => sum + orderLines(order, 'ready').length, 0);
  const served = orders.reduce((sum, order) => sum + orderLines(order, 'served').length, 0);

  root.innerHTML = `<div class="view-enter">
    <div class="page-head">
      <div>
        <h2>Kitchen display</h2>
        <p>Fire, plate and pass. One tap moves a ticket forward — no reload, no lost tickets.</p>
      </div>
      <div class="page-actions">
        ${can(user, 'kitchen.bump') ? '' : '<span class="badge badge-neutral">Read-only — chefs bump</span>'}
        <button class="btn" type="button" data-kitchen-refresh>${icon('sync')} Refresh</button>
        <button class="btn" type="button" data-fullscreen>${icon('eye')} Full screen</button>
      </div>
    </div>
    <div class="kitchen-toolbar">
      <div class="category-pills" style="padding-bottom:0">${stationChips(orders)}</div>
      <span class="tiny muted" style="margin-left:auto">${cooking} cooking · ${ready} ready · ${served} served</span>
    </div>
    <div class="board">
      ${columnMarkup('cooking', orders)}
      ${columnMarkup('ready', orders)}
      ${columnMarkup('served', orders)}
    </div>
  </div>`;

  root.scrollTop = scrollTop;

  if (!root.dataset.kitchenBound) {
    root.addEventListener('click', (event) => handleKitchenClick(event, root));
    root.dataset.kitchenBound = '1';
  }

  startTicker();
}

function startTicker() {
  clearInterval(tickTimer);
  tickTimer = setInterval(() => {
    const nodes = document.querySelectorAll('[data-elapsed]');
    if (!nodes.length || !document.querySelector('.board')) {
      clearInterval(tickTimer);
      return;
    }
    nodes.forEach((node) => {
      const mins = minutesSince(node.dataset.elapsed);
      node.textContent = durationLabel(mins);
      node.classList.toggle('is-late', mins >= 15);
    });
  }, 30000);
}

function bumpOrder(orderId, from, to, root) {
  const user = getUser();
  if (!can(user, 'kitchen.bump')) {
    toast('Only chefs, managers and admins can bump tickets.', { type: 'warn' });
    return;
  }
  const state = getState();
  const order = state.orders.find((entry) => entry.id === orderId);
  if (!order) return;
  const lines = order.items.filter((line) => line.status === from && matchesStation(line));
  if (!lines.length) return;

  const now = new Date().toISOString();
  lines.forEach((line) => {
    line.status = to;
    if (to === 'served') line.servedAt = now;
  });
  order.updatedAt = now;

  enqueue('ORDER_STATUS', 'order', {
    order: { ...order, items: order.items.map((line) => ({ ...line })) },
    from,
    to,
  }, order.orderNo);
  saveState();
  renderKitchen(root);

  const table = findTable(order.tableId);
  toast(`${lines.length} item${lines.length === 1 ? '' : 's'} marked ${to}.`, {
    type: 'success', detail: `${table?.name || order.tableId} · ${order.orderNo}`,
  });
}

async function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    else await document.exitFullscreen();
  } catch {
    toast('Full screen is unavailable in this browser.', { type: 'warn' });
  }
}

function handleKitchenClick(event, root) {
  const target = event.target;
  const stationButton = target.closest('[data-station]');
  if (stationButton) {
    station = stationButton.dataset.station;
    renderKitchen(root);
    return;
  }
  const bumpButton = target.closest('[data-bump]');
  if (bumpButton) {
    bumpOrder(bumpButton.dataset.order, bumpButton.dataset.from, bumpButton.dataset.to, root);
    return;
  }
  if (target.closest('[data-kitchen-refresh]')) {
    renderKitchen(root);
    toast('Kitchen board refreshed.', { type: 'info', timeout: 1600 });
    return;
  }
  if (target.closest('[data-fullscreen]')) toggleFullscreen();
}

