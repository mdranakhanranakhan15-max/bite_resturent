import './styles/theme.css';
import { store } from './store/syncStore.js';
import { renderPosView } from './views/posView.js';
import { renderMenuView } from './views/menuView.js';
import { renderKitchenView } from './views/kitchenView.js';
import { renderInventoryView, renderBillsView, renderStaffView } from './views/opsViews.js';
import { renderDoodles } from './views/doodles.js';
import { initials } from './utils/format.js';

const TAB_META = {
  pos: { crumb: '🍽 TABLES & POS', title: 'Tables & POS' },
  kitchen: { crumb: '🍳 KITCHEN KOT', title: 'Kitchen KOT' },
  menu: { crumb: '🍴 MENU & RECIPES', title: 'Food menu' },
  inventory: { crumb: '📦 INVENTORY', title: 'Inventory' },
  bills: { crumb: '🧾 BILLS & ANALYTICS', title: 'Bills & analytics' },
  staff: { crumb: '👥 STAFF & ROLES', title: 'Staff & Roles' }
};

const uiState = {
  activeTab: 'menu',
  selectedTableId: 'T-01',
  posCategory: 'All',
  discount: 0,
  menuSearch: '',
  menuCat: 'All',
  menuAvail: 'All'
};

const requestedTab = new URLSearchParams(window.location.search).get('tab');
if (requestedTab && TAB_META[requestedTab]) {
  uiState.activeTab = requestedTab;
}

/* Module access is driven by the per-user permissions array set in Staff & Roles. */
const ALL_TABS = Object.keys(TAB_META);
function allowedTabs(user) {
  if (!user) return ALL_TABS;
  return Array.isArray(user.permissions) ? user.permissions : ALL_TABS;
}

function updateHeader() {
  const meta = TAB_META[uiState.activeTab] || TAB_META.menu;
  const { currentUser } = store.state;
  document.getElementById('crumb').textContent = meta.crumb;
  document.getElementById('crumb-title').textContent = meta.title;
  const manageBtn = document.getElementById('header-manage-options');
  if (manageBtn) manageBtn.hidden = !(uiState.activeTab === 'menu' && currentUser && currentUser.role === 'Admin');
}

function updateSidebarChrome() {
  const { currentUser, pendingQueue, tables, inventory } = store.state;

  const tabs = allowedTabs(currentUser);
  document.querySelectorAll('#sidebar-nav .navlink').forEach((btn) => {
    const allowed = tabs.includes(btn.dataset.tab);
    btn.hidden = !allowed;
    btn.classList.toggle('active', allowed && btn.dataset.tab === uiState.activeTab);
  });

  const occupied = tables.filter((t) => t.status === 'Occupied' && t.id !== 'Takeaway').length;
  const lowStock = inventory.filter((item) => item.qty <= item.minAlert).length;
  const kitchenActive = tables.filter((t) => t.items.length > 0 && t.kotStatus !== 'Served').length;
  document.getElementById('tables-badge').textContent = String(occupied);
  document.getElementById('kitchen-badge').textContent = String(kitchenActive);
  document.getElementById('menu-badge').textContent = String(store.state.menu.length);
  document.getElementById('inventory-badge').textContent = String(lowStock);

  // Sync card + header pending pill
  const queued = pendingQueue.length;
  const countLabel = document.getElementById('sync-btn-count');
  const pendingBadge = document.getElementById('pending-sync-badge');
  if (countLabel) countLabel.textContent = String(queued);
  if (pendingBadge) pendingBadge.textContent = String(queued);

  const syncDot = document.getElementById('sync-dot');
  const syncTitle = document.getElementById('sync-title');
  const syncSubtitle = document.getElementById('sync-subtitle');
  const syncBtn = document.getElementById('sync-now-btn');

  if (queued > 0) {
    syncDot.style.background = '#f59e0b';
    syncDot.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.14)';
    syncTitle.textContent = 'Sync needs attention';
    syncSubtitle.textContent = `${queued} queued · not synced to server yet`;
    syncBtn.innerHTML = `<span class="text-[12px] leading-none">↻</span> Sync <span id="sync-btn-count">${queued}</span>`;
  } else {
    syncDot.style.background = '#5f8f6e';
    syncDot.style.boxShadow = '0 0 0 3px rgba(95,143,110,0.16)';
    syncTitle.textContent = 'Everything synced';
    syncSubtitle.textContent = 'Queue is clear · server up to date';
    syncBtn.innerHTML = `<span class="text-[12px] leading-none">↻</span> Synced`;
  }

  const offlineSwitch = document.getElementById('offline-sim-toggle');
  offlineSwitch.dataset.on = String(store.state.isOfflineSim);
  offlineSwitch.setAttribute('aria-checked', String(store.state.isOfflineSim));

  // Active operator card
  if (currentUser) {
    const role = currentUser.role;
    document.getElementById('user-avatar').textContent = initials(currentUser.name);
    document.getElementById('user-name').textContent = currentUser.name;
    document.getElementById('user-role').textContent = role === 'Admin' ? 'Admin · Full access' : `${role} · Evening`;
    document.getElementById('header-avatar').textContent = initials(currentUser.name);
  }
}


function renderActiveView() {
  const currentUser = store.state.currentUser;
  const shell = document.getElementById('app-shell');

  // Logged out: the entire app shell must not render — only the login page.
  if (shell) shell.hidden = !currentUser;
  if (!currentUser) {
    document.getElementById('app-viewport').innerHTML = '';
    renderLoginScreen();
    return;
  }

  const tabs = allowedTabs(currentUser);
  if (!tabs.includes(uiState.activeTab)) uiState.activeTab = tabs[0] || 'pos';

  document.getElementById('login-root').replaceChildren();
  updateHeader();
  updateSidebarChrome();

  const viewport = document.getElementById('app-viewport');
  switch (uiState.activeTab) {
    case 'pos':
      renderPosView(viewport, uiState, renderActiveView);
      break;
    case 'kitchen':
      renderKitchenView(viewport);
      break;
    case 'menu':
      renderMenuView(viewport, uiState, renderActiveView);
      break;
    case 'inventory':
      renderInventoryView(viewport);
      break;
    case 'bills':
      renderBillsView(viewport);
      break;
    case 'staff':
      renderStaffView(viewport);
      break;
    default:
      renderMenuView(viewport, uiState, renderActiveView);
  }
}

function tickClock() {
  const now = new Date();
  const hours24 = now.getHours();
  const hours12 = hours24 % 12 || 12;
  const minutes = String(now.getMinutes()).padStart(2, '0');
  document.getElementById('live-clock').textContent = `${hours12}:${minutes} ${hours24 >= 12 ? 'PM' : 'AM'}`;
  document.getElementById('live-date').textContent = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

function renderLoginScreen() {
  const root = document.getElementById('login-root');
  if (!root) return;
  const users = store.state.users.filter((user) => user.active);
  const keypad = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'];

  root.innerHTML = `
    <div class="login-screen">
      <div class="login-card">
        <div class="login-emblem">
          <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 3v7a2 2 0 0 0 2 2v9" /><path d="M10 3v7a2 2 0 0 1-2 2" /><path d="M6 3v7" />
            <path d="M17 3c1.6 1.4 2.4 3 2.4 4.8 0 1.9-1 3.2-2.4 4.2V21" />
          </svg>
        </div>
        <h1 class="login-title serif">Bite Restaurant POS</h1>
        <p class="login-sub">Sign in to open your shift</p>

        <form id="login-form" class="login-form" autocomplete="off">
          <div class="field">
            <label for="login-username">Username</label>
            <input id="login-username" required autocomplete="off" placeholder="Enter your username" />
          </div>
          <div class="field">
            <label for="login-pin">4-digit PIN</label>
            <input id="login-pin" required maxlength="4" inputmode="numeric" pattern="[0-9]{4}" placeholder="••••" />
          </div>
          <div class="login-keypad" role="group" aria-label="Touchscreen PIN keypad">
            ${keypad.map((key) => `<button type="button" data-pin-key="${key}">${key}</button>`).join('')}
          </div>
          <p id="login-error" class="login-error" role="alert"></p>
          <button type="submit" class="btn-primary login-submit">Sign In</button>
        </form>

        <p class="login-foot">Restricted access · authorised staff only</p>
      </div>
    </div>`;

  const pinInput = document.getElementById('login-pin');
  const errorBox = document.getElementById('login-error');

  root.querySelectorAll('[data-pin-key]').forEach((btn) => {
    btn.onclick = () => {
      const key = btn.dataset.pinKey;
      if (key === 'C') pinInput.value = '';
      else if (key === '⌫') pinInput.value = pinInput.value.slice(0, -1);
      else if (pinInput.value.length < 4) pinInput.value += key;
      errorBox.classList.remove('show');
    };
  });

  document.getElementById('login-form').onsubmit = (event) => {
    event.preventDefault();
    const username = document.getElementById('login-username').value.trim().toLowerCase();
    const pin = pinInput.value.trim();
    const user = users.find((entry) => {
      const handle = String(entry.username || entry.name).toLowerCase();
      return (handle === username || entry.name.toLowerCase() === username) && String(entry.pin) === pin;
    });
    if (!user) {
      errorBox.textContent = 'Invalid username or 4-digit PIN.';
      errorBox.classList.add('show');
      pinInput.value = '';
      return;
    }
    localStorage.setItem('bite_active_user', user.id);
    store.mutate('SWITCH_USER', (state) => { state.currentUser = state.users.find((entry) => entry.id === user.id); }, { userId: user.id });
  };
}

function handleLogout() {
  localStorage.removeItem('bite_active_user');
  store.mutate('LOGOUT', (state) => { state.currentUser = null; });
}

function bindGlobalControls() {
  document.querySelectorAll('#sidebar-nav .navlink').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (uiState.activeTab === btn.dataset.tab) return;
      uiState.activeTab = btn.dataset.tab;
      renderActiveView();
      document.getElementById('app-viewport').scrollTop = 0;
    });
  });

  document.getElementById('offline-sim-toggle').addEventListener('click', () => {
    store.setOfflineSim(!store.state.isOfflineSim);
  });

  document.getElementById('sync-now-btn').addEventListener('click', async () => {
    await store.syncNow();
  });

  ['logout-btn', 'header-logout-btn'].forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', handleLogout);
  });
}

store.subscribe(() => renderActiveView());
renderDoodles(document.getElementById('doodle-wall'));
bindGlobalControls();
tickClock();
setInterval(tickClock, 15000);
renderActiveView();
store.hydrateFromServer();

