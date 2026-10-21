/**
 * Bite POS — application shell: boot, routing, role-aware nav and header.
 */
import {
  loadState, getState, can, lowStockItems, roleMeta,
} from './store.js';
import {
  initSync, syncMeta, flushQueue, setOfflineSimulation, bootstrapMasterData,
} from './sync.js';
import {
  restoreSession, getUser, showLogin, openSessionMenu, renderStaffView,
  refreshSessionUser, logout,
} from './auth.js';
import { renderPOS } from './pos.js';
import { renderKitchen } from './kitchen.js';
import { renderMenu } from './menu.js';
import { renderInventory } from './inventory.js';
import { renderAnalytics } from './analytics.js';
import { openBackupModal } from './billing.js';
import { openSyncCenter } from './sync-ui.js';
import {
  $, esc, icon, initials, toast, emptyState, timeAgo, setCurrency,
} from './utils.js';

const NAV = [
  { id: 'pos', hash: '#/pos', label: 'Tables & POS', icon: 'pos', perm: 'view.pos', title: 'Tables & Orders', eyebrow: 'Service floor' },
  { id: 'kitchen', hash: '#/kitchen', label: 'Kitchen KOT', icon: 'kitchen', perm: 'view.kitchen', title: 'Kitchen display', eyebrow: 'Back of house' },
  { id: 'menu', hash: '#/menu', label: 'Food menu', icon: 'menu', perm: 'view.menu', title: 'Food menu', eyebrow: 'Menu & recipes' },
  { id: 'inventory', hash: '#/inventory', label: 'Inventory', icon: 'box', perm: 'view.inventory', title: 'Inventory & stock', eyebrow: 'Stock control' },
  { id: 'billing', hash: '#/billing', label: 'Bills & analytics', icon: 'receipt', perm: 'view.billing', title: 'Bills & analytics', eyebrow: 'Money & insight' },
  { id: 'staff', hash: '#/staff', label: 'Staff & access', icon: 'users', perm: 'view.staff', title: 'Team & access', eyebrow: 'People' },
];

const ROUTES = {
  '#/pos': { render: renderPOS, perm: 'view.pos', title: 'Tables & Orders', eyebrow: 'Service floor' },
  '#/kitchen': { render: renderKitchen, perm: 'view.kitchen', title: 'Kitchen display', eyebrow: 'Back of house' },
  '#/menu': { render: renderMenu, perm: 'view.menu', title: 'Food menu', eyebrow: 'Menu & recipes' },
  '#/inventory': { render: renderInventory, perm: 'view.inventory', title: 'Inventory & stock', eyebrow: 'Stock control' },
  '#/billing': { render: renderAnalytics, perm: 'view.billing', title: 'Bills & analytics', eyebrow: 'Money & insight' },
  '#/staff': { render: renderStaffView, perm: 'view.staff', title: 'Team & access', eyebrow: 'People' },
};

function firstAllowed(user) {
  return NAV.find((item) => can(user, item.perm)) || NAV[0];
}

function navBadgeCounts() {
  const state = getState();
  const user = getUser();
  if (!user) return { pos: 0, kitchen: 0, inventory: 0 };
  return {
    pos: state.orders.length,
    kitchen: state.orders.reduce(
      (sum, order) => sum + order.items.filter((line) => line.status === 'cooking' || line.status === 'ready').length, 0,
    ),
    inventory: lowStockItems().length,
  };
}

function renderNav(activeHash = location.hash) {
  const nav = document.getElementById('nav');
  if (!nav) return;
  const user = getUser();
  const items = user ? NAV.filter((item) => can(user, item.perm)) : NAV;
  const counts = navBadgeCounts();
  const badgeIds = ['pos', 'kitchen', 'inventory'];

  nav.innerHTML = items.map((item) => {
    const badge = counts[item.id] || 0;
    const showBadge = badgeIds.includes(item.id);
    return `<a class="nav-item ${item.hash === activeHash ? 'is-active' : ''}" href="${item.hash}">
      ${icon(item.icon)}
      <span>${esc(item.label)}</span>
      ${showBadge ? `<span class="nav-badge" data-nav-badge="${item.id}" style="${badge > 0 ? '' : 'display:none'}">${badge > 99 ? '99+' : badge}</span>` : ''}
    </a>`;
  }).join('');
}
function tickClock() {
  const now = new Date();
  const timeEl = document.getElementById('clock-time');
  const dateEl = document.getElementById('clock-date');
  if (timeEl) timeEl.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  if (dateEl) dateEl.textContent = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function refreshHeader() {
  const user = getUser();
  const state = getState();
  const meta = syncMeta();

  const avatar = document.getElementById('avatar-btn');
  if (avatar) {
    avatar.textContent = user ? initials(user.name) : '—';
    avatar.style.background = user ? roleMeta(user.role).avatar : '#ece6da';
    avatar.title = user ? `${user.name} · ${roleMeta(user.role).label}` : 'Sign in';
  }

  const sideAvatar = document.getElementById('side-avatar');
  if (sideAvatar) {
    sideAvatar.textContent = user ? initials(user.name) : '—';
    sideAvatar.style.background = user ? roleMeta(user.role).avatar : '#2b2e37';
    sideAvatar.style.color = user ? '#241a12' : '#8f8a80';
  }
  const sideName = document.getElementById('side-user-name');
  const sideRole = document.getElementById('side-user-role');
  if (sideName) sideName.textContent = user ? user.name : 'Not signed in';
  if (sideRole) sideRole.textContent = user ? `${roleMeta(user.role).label} · ${user.shift || 'Shift not set'}` : 'Tap to sign in';

  const pendingEl = document.getElementById('pending-count');
  if (pendingEl) pendingEl.textContent = meta.pending;

  const pill = document.getElementById('sync-pill');
  if (pill) {
    pill.classList.toggle('is-offline', meta.offline);
    pill.classList.toggle('is-syncing', meta.syncing);
    pill.classList.toggle('is-clear', !meta.pending && !meta.offline);
    const label = pill.querySelector('.sp-label');
    if (label) {
      label.textContent = meta.syncing
        ? 'Syncing…'
        : meta.pending
          ? 'Pending sync'
          : meta.offline ? 'Offline' : 'Synced';
    }
    pill.title = meta.offline
      ? `Offline — ${meta.pending} change(s) queued locally`
      : `${meta.pending} pending · last sync ${meta.lastSyncAt ? timeAgo(meta.lastSyncAt) : 'never'}`;
  }

  const offlineToggle = document.getElementById('offline-toggle');
  if (offlineToggle) {
    offlineToggle.classList.toggle('is-on', !!state.settings.simulateOffline);
    offlineToggle.setAttribute('aria-pressed', state.settings.simulateOffline ? 'true' : 'false');
    offlineToggle.title = state.settings.simulateOffline
      ? 'Offline simulation is on — tap to reconnect'
      : 'Simulate an offline connection and queue changes';
  }

  const dot = document.getElementById('side-status-dot');
  if (dot) dot.className = `status-dot ${meta.failed ? 'is-error' : meta.offline ? 'is-offline' : ''}`;
  const statusText = document.getElementById('side-status-text');
  if (statusText) statusText.textContent = meta.failed ? 'Sync needs attention' : meta.offline ? 'Working offline' : 'Connected';
  const sideMeta = document.getElementById('side-sync-meta');
  if (sideMeta) {
    const last = meta.lastSyncAt ? `Last sync ${timeAgo(meta.lastSyncAt)}` : 'Not synced to server yet';
    sideMeta.textContent = `${meta.pending} queued · ${last}`;
  }
  const sideSync = document.getElementById('side-sync-btn');
  if (sideSync) {
    const busy = meta.syncing;
    sideSync.disabled = busy || meta.offline || meta.pending === 0;
    sideSync.innerHTML = busy
      ? `${icon('sync', 'spin')} Syncing…`
      : meta.offline
        ? `${icon('wifi-off')} Offline`
        : meta.pending === 0
          ? `${icon('check')} Up to date`
          : `${icon('sync')} Sync ${meta.pending}`;
  }

  const backupButton = document.getElementById('backup-btn');
  if (backupButton) backupButton.style.display = can(user, 'backup.manage') ? '' : 'none';

  const counts = navBadgeCounts();
  Object.entries(counts).forEach(([key, value]) => {
    const badge = document.querySelector(`[data-nav-badge="${key}"]`);
    if (!badge) return;
    badge.textContent = value > 99 ? '99+' : String(value);
    badge.style.display = value > 0 ? '' : 'none';
  });
}
function normalizeRoute(user) {
  if (!user) return;
  const allowed = NAV.filter((item) => can(user, item.perm));
  if (!allowed.length) return;
  if (!allowed.some((item) => item.hash === location.hash)) {
    history.replaceState(null, '', allowed[0].hash);
  }
}

function mountRoute(options = {}) {
  const user = getUser();
  if (user) normalizeRoute(user);

  let hash = location.hash;
  if (!ROUTES[hash]) {
    hash = user ? firstAllowed(user).hash : '#/pos';
    history.replaceState(null, '', hash);
  }
  if (!user && hash !== '#/pos') {
    hash = '#/pos';
    history.replaceState(null, '', hash);
  }

  let route = ROUTES[hash] || ROUTES['#/pos'];
  if (user && route.perm && !can(user, route.perm)) {
    const fallback = firstAllowed(user);
    hash = fallback.hash;
    history.replaceState(null, '', hash);
    route = ROUTES[hash] || ROUTES['#/pos'];
  }

  document.getElementById('page-title').textContent = route.title;
  document.getElementById('top-eyebrow').textContent = route.eyebrow;
  document.title = `Bite · ${route.title}`;

  const old = document.getElementById('main-view');
  const fresh = document.createElement('main');
  fresh.id = 'main-view';
  fresh.className = 'view';
  fresh.setAttribute('role', 'main');
  fresh.tabIndex = -1;
  old.replaceWith(fresh);

  try {
    route.render(fresh);
  } catch (error) {
    console.error('[Bite] view render failed', error);
    fresh.innerHTML = `<div class="card" style="margin-top:20px">
      ${emptyState('alert', 'This screen could not render', error.message || 'Unknown error')}
      <div style="display:flex;justify-content:center;padding-bottom:20px"><button class="btn btn-primary" type="button" data-reload-view>Reload view</button></div>
    </div>`;
    fresh.querySelector('[data-reload-view]')?.addEventListener('click', () => mountRoute());
  }

  if (!options.preserveScroll) fresh.scrollTop = 0;
  renderNav(hash);
}

let dataRefreshTimer = null;

function bindChrome() {
  $('#sync-pill')?.addEventListener('click', () => openSyncCenter());
  $('#backup-btn')?.addEventListener('click', () => openBackupModal());
  $('#offline-toggle')?.addEventListener('click', () => {
    setOfflineSimulation(!getState().settings.simulateOffline);
    refreshHeader();
  });
  $('#avatar-btn')?.addEventListener('click', openSessionMenu);
  $('#user-menu-btn')?.addEventListener('click', openSessionMenu);
  $('#side-sync-btn')?.addEventListener('click', async () => {
    await flushQueue({ manual: true });
    refreshHeader();
  });

  document.addEventListener('bite:refresh-header', refreshHeader);

  document.addEventListener('bite:navigate', (event) => {
    const hash = event.detail?.hash;
    if (!hash) return;
    if (location.hash === hash) mountRoute();
    else location.hash = hash;
  });

  document.addEventListener('bite:data-changed', () => {
    clearTimeout(dataRefreshTimer);
    dataRefreshTimer = setTimeout(() => {
      const user = getUser();
      if (user) {
        const refreshed = refreshSessionUser();
        if (!refreshed) {
          logout();
          return;
        }
        normalizeRoute(refreshed);
      }
      mountRoute({ preserveScroll: true });
      refreshHeader();
    }, 60);
  });

  document.addEventListener('bite:session', (event) => {
    const user = event.detail?.user || getUser();
    refreshHeader();
    if (!user) {
      history.replaceState(null, '', '#/pos');
      mountRoute();
      return;
    }
    normalizeRoute(user);
    bootstrapMasterData();
    mountRoute();
    refreshHeader();
  });

  window.addEventListener('hashchange', () => mountRoute());
  window.addEventListener('beforeunload', (event) => {
    const pending = syncMeta().pending;
    if (pending > 0) {
      event.preventDefault();
      event.returnValue = '';
    }
  });
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  try {
    const registration = await navigator.serviceWorker.register('sw.js', { scope: './' });
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          const el = toast('A new Bite build is ready.', {
            type: 'info', detail: 'Reload to apply the update.', timeout: 12000,
          });
          el?.addEventListener('click', () => location.reload());
        }
      });
    });
  } catch (error) {
    console.warn('[Bite] Service worker registration failed', error);
  }
}

function boot() {
  loadState();
  setCurrency(getState().settings.currency || '$');
  restoreSession();
  initSync();
  bindChrome();
  tickClock();
  setInterval(tickClock, 20000);

  const user = getUser();
  if (user) {
    normalizeRoute(user);
    bootstrapMasterData();
  } else {
    history.replaceState(null, '', '#/pos');
  }
  mountRoute();
  refreshHeader();

  if (!user) {
    setTimeout(() => {
      if (!getUser()) showLogin();
    }, 260);
  }

  if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
  registerServiceWorker();

  window.Bite = {
    version: '1.0.0',
    navigate(hash) {
      if (!hash) return;
      if (location.hash === hash) mountRoute();
      else location.hash = hash;
    },
    refresh: () => mountRoute({ preserveScroll: true }),
    getState,
  };
}

try {
  boot();
} catch (error) {
  console.error('[Bite] Boot failed', error);
  const main = document.getElementById('main-view');
  if (main) {
    main.innerHTML = `<div class="card" style="margin-top:20px">
      ${emptyState('alert', 'Bite could not start', error.message || 'Unknown error')}
      <div style="display:flex;justify-content:center;padding-bottom:20px"><button class="btn btn-primary" onclick="location.reload()">Reload Bite</button></div>
    </div>`;
  }
}


