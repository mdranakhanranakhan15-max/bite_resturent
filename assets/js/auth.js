/**
 * Bite POS — authentication, sessions and staff administration.
 * PIN access is local (offline-first). The server stores hashed PINs on sync.
 */
import {
  getState, can, findUser, setSession, clearSession, getSession, saveState,
  roleMeta, ROLE_META, ROLES,
} from './store.js';
import { enqueue } from './sync.js';
import {
  $, $$, esc, icon, initials, openDialog, closeDialog, toast,
  confirmDialog, uid, roleBadge, emptyState,
} from './utils.js';

let currentUser = null;
let failedAttempts = 0;
let lockUntil = 0;
let lockTimer = null;

export function restoreSession() {
  const session = getSession();
  if (!session) return null;
  const user = findUser(session.userId);
  if (!user || user.active === false) {
    clearSession();
    return null;
  }
  currentUser = user;
  return user;
}

export function getUser() {
  return currentUser;
}

/** Re-read the signed-in profile after a pull/import changes user records. */
export function refreshSessionUser() {
  const session = getSession();
  if (!session) {
    currentUser = null;
    return null;
  }
  const user = findUser(session.userId);
  if (!user || user.active === false) {
    clearSession();
    currentUser = null;
    return null;
  }
  currentUser = user;
  return user;
}

export function loginAs(user, dialog = null) {
  if (!user || user.active === false) {
    toast('That profile is disabled. Ask an admin to re-enable it.', { type: 'error' });
    return false;
  }
  setSession(user.id);
  currentUser = user;
  failedAttempts = 0;
  if (dialog) closeDialog(dialog);
  toast(`Welcome back, ${String(user.name).split(' ')[0]}.`, {
    type: 'success',
    detail: `${roleMeta(user.role).label} · ${user.shift || 'Shift not set'}`,
  });
  document.dispatchEvent(new CustomEvent('bite:session', { detail: { user } }));
  return true;
}

export function logout() {
  clearSession();
  currentUser = null;
  document.dispatchEvent(new CustomEvent('bite:session', { detail: { user: null } }));
  showLogin();
}

const AVATAR_CLASS = {
  admin: 'role-admin', manager: 'role-manager', cashier: 'role-cashier',
  waiter: 'role-waiter', chef: 'role-chef',
};

function pinDots(pin) {
  return Array.from({ length: 4 }, (_, index) => {
    const filled = index < pin.length;
    const current = index === pin.length;
    return `<div class="pin-dot ${filled ? 'is-filled' : ''} ${current ? 'is-current' : ''}">${filled ? '•' : ''}</div>`;
  }).join('');
}

function quickUserMarkup(users) {
  return users.map((user) => {
    const meta = roleMeta(user.role);
    return `<button type="button" class="quick-user" data-quick-user="${esc(user.id)}" title="Sign in as ${esc(user.name)}">
      <span class="qu-ava ${AVATAR_CLASS[user.role] || 'role-cashier'}">${esc(initials(user.name))}</span>
      <span style="min-width:0">
        <span class="qu-name">${esc(user.name)}</span>
        <span class="qu-role">${esc(meta.label)}</span>
      </span>
    </button>`;
  }).join('');
}
function loginMarkup(users) {
  return `<div class="login-grid">
    <div class="login-brand">
      <div class="lb-kicker">Bite · Restaurant OS</div>
      <h2>Good service starts at a clean pass.</h2>
      <p>Take orders, fire the kitchen, settle bills and watch every gram of stock — even when the internet drops.</p>
      <svg class="login-sketch" viewBox="0 0 220 220" aria-hidden="true"><use href="#sk-burger"/></svg>
      <div class="lb-foot">
        <span>${icon('wifi-off')} Offline-first</span>
        <span>${icon('printer')} 80mm receipts</span>
        <span>${icon('lock')} Role access</span>
      </div>
    </div>
    <div class="login-main">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
        <div>
          <div class="quick-login-label">Staff sign in</div>
          <h2>Welcome back</h2>
        </div>
        <button class="icon-btn" type="button" data-dlg-close aria-label="Close sign in">${icon('x')}</button>
      </div>
      <p class="login-sub">Choose your profile for one-tap access, or enter your 4-digit PIN.</p>
      <div class="quick-login-label">Quick sign in</div>
      <div class="quick-users">${quickUserMarkup(users)}</div>
      <div class="pin-zone">
        <div class="pin-left">
          <div class="quick-login-label">PIN entry</div>
          <div class="pin-display" id="pin-dots" aria-label="PIN entry">${pinDots('')}</div>
          <div class="pin-message" id="pin-msg" role="status">Use the keypad or your keyboard.</div>
          <p class="pin-hint">Demo PINs — Admin 1234 · Manager 2345 · Cashier 3456 · Waiter 4567 · Chef 5678</p>
        </div>
        <div class="pin-keypad" id="pin-keypad">
          ${['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((key) => `<button type="button" class="keypad-btn" data-key="${key}">${key}</button>`).join('')}
          <button type="button" class="keypad-btn is-action" data-key="clear">Clear</button>
          <button type="button" class="keypad-btn" data-key="0">0</button>
          <button type="button" class="keypad-btn is-enter" data-key="enter">Sign in</button>
        </div>
      </div>
      <div class="login-foot">
        <span>Bite POS v1.0 · local workspace</span>
        <span style="display:inline-flex;align-items:center;gap:5px">
          <span class="status-dot ${navigator.onLine ? '' : 'is-offline'}" style="width:6px;height:6px"></span>
          ${navigator.onLine ? 'Online' : 'Offline'} ready
        </span>
      </div>
    </div>
  </div>`;
}
export function showLogin(options = {}) {
  const users = getState().users.filter((user) => user.active !== false);
  let pin = '';
  if (!users.length) {
    openDialog({
      id: 'login-dialog',
      title: 'No active staff',
      eyebrow: 'Access locked',
      body: emptyState('lock', 'No active staff profiles', 'Restore a backup or reseed the demo workspace to create an admin.'),
    });
    return null;
  }

  const dialog = openDialog({
    id: 'login-dialog',
    custom: true,
    className: 'login-dialog',
    dismissible: options.dismissible !== false,
    body: loginMarkup(users),
    focus: '#pin-keypad .keypad-btn',
  });

  $('#pin-keypad .keypad-btn', dialog)?.focus({ preventScroll: true });

  const message = $('#pin-msg', dialog);
  const dots = $('#pin-dots', dialog);
  const keypad = $('#pin-keypad', dialog);
  const buttons = $$('.keypad-btn', keypad);

  const setMessage = (text, tone = '') => {
    message.textContent = text;
    message.className = `pin-message ${tone ? `is-${tone}` : ''}`;
  };
  const refresh = () => { dots.innerHTML = pinDots(pin); };

  const lockPad = (seconds) => {
    lockUntil = Date.now() + seconds * 1000;
    clearInterval(lockTimer);
    buttons.forEach((button) => { button.disabled = true; });
    const tick = () => {
      const remaining = Math.ceil((lockUntil - Date.now()) / 1000);
      if (remaining > 0) {
        setMessage(`Too many attempts. Try again in ${remaining}s.`, 'error');
      } else {
        clearInterval(lockTimer);
        buttons.forEach((button) => { button.disabled = false; });
        if (dialog.open) setMessage('You can try again now.');
        failedAttempts = 0;
      }
    };
    tick();
    lockTimer = setInterval(tick, 1000);
  };

  const submit = () => {
    if (!dialog.open) return;
    if (Date.now() < lockUntil) return;
    if (pin.length !== 4) {
      setMessage('Enter all four digits.', 'error');
      return;
    }
    const match = users.find((user) => String(user.pin) === pin);
    if (!match) {
      failedAttempts += 1;
      pin = '';
      refresh();
      if (failedAttempts >= 5) {
        lockPad(30);
      } else {
        setMessage(`PIN not recognised. ${5 - failedAttempts} attempt${5 - failedAttempts === 1 ? '' : 's'} left.`, 'error');
        dialog.classList.add('shake');
        setTimeout(() => dialog.classList.remove('shake'), 350);
      }
      return;
    }
    loginAs(match, dialog);
  };

  const press = (key) => {
    if (Date.now() < lockUntil) return;
    if (key === 'clear') {
      pin = '';
      refresh();
      setMessage('Cleared.');
      return;
    }
    if (key === 'back') {
      pin = pin.slice(0, -1);
      refresh();
      return;
    }
    if (key === 'enter') {
      submit();
      return;
    }
    if (!/^[0-9]$/.test(key) || pin.length >= 4) return;
    pin += key;
    refresh();
    setMessage('Keep going…');
    if (pin.length === 4) setTimeout(submit, 140);
  };

  keypad.addEventListener('click', (event) => {
    const button = event.target.closest('[data-key]');
    if (button && !button.disabled) press(button.dataset.key);
  });

  dialog.addEventListener('keydown', (event) => {
    if (event.target.tagName === 'INPUT') return;
    if (/^[0-9]$/.test(event.key)) {
      event.preventDefault();
      press(event.key);
    } else if (event.key === 'Backspace') {
      event.preventDefault();
      press('back');
    } else if (event.key === 'Enter') {
      event.preventDefault();
      press('enter');
    }
  });

  $$('[data-quick-user]', dialog).forEach((button) => {
    button.addEventListener('click', () => {
      const user = users.find((entry) => entry.id === button.dataset.quickUser);
      if (user) loginAs(user, dialog);
    });
  });

  return dialog;
}

/* Session menu (topbar avatar / sidebar user chip) */
export function openSessionMenu() {
  const user = currentUser;
  if (!user) {
    showLogin();
    return;
  }
  const meta = roleMeta(user.role);
  const dialog = openDialog({
    id: 'session-dialog',
    size: 'dlg-sm',
    eyebrow: 'Signed in',
    title: `${user.name.split(' ')[0]}'s session`,
    subtitle: `${meta.label} · ${user.shift || 'Shift not set'}`,
    body: `
      <div class="backup-tile" style="margin-bottom:10px">
        <div class="bt-icon" style="background:${meta.avatar};font-weight:800">${esc(initials(user.name))}</div>
        <div style="min-width:0">
          <h4>${esc(user.name)}</h4>
          <p>${esc(meta.perms)} · PIN ••••</p>
        </div>
      </div>
      <div style="display:grid;gap:7px">
        ${can(user, 'view.staff') ? `<button class="btn w-full" type="button" data-session-action="staff">${icon('users')} Manage team</button>` : ''}
        <button class="btn w-full" type="button" data-session-action="switch">${icon('pos')} Switch user</button>
        <button class="btn w-full btn-danger" type="button" data-session-action="logout">${icon('logout')} Sign out</button>
      </div>`,
    footer: `<button class="btn" type="button" data-dlg-close>Close</button>`,
  });

  dialog.addEventListener('click', (event) => {
    const button = event.target.closest('[data-session-action]');
    if (!button) return;
    const action = button.dataset.sessionAction;
    if (action === 'staff') {
      closeDialog(dialog);
      document.dispatchEvent(new CustomEvent('bite:navigate', { detail: { hash: '#/staff' } }));
    } else if (action === 'switch') {
      closeDialog(dialog);
      currentUser = null;
      clearSession();
      showLogin();
    } else if (action === 'logout') {
      closeDialog(dialog);
      logout();
    }
  });
}
/* Staff management */
const SHIFTS = [
  'Morning · 8a–4p', 'Mid · 12p–8p', 'Evening · 4p–12a', 'Night · 10p–6a', 'Split · 11a–3p & 6p–11p',
];

function onShiftNow(shift = '') {
  const hour = new Date().getHours();
  if (shift.startsWith('Morning')) return hour >= 8 && hour < 16;
  if (shift.startsWith('Mid')) return hour >= 12 && hour < 20;
  if (shift.startsWith('Evening')) return hour >= 16 || hour < 1;
  if (shift.startsWith('Night')) return hour >= 22 || hour < 6;
  if (shift.startsWith('Split')) return (hour >= 11 && hour < 15) || (hour >= 18 && hour < 23);
  return false;
}

function staffCardMarkup(entry, currentUserId) {
  const meta = roleMeta(entry.role);
  const active = entry.active !== false;
  const isSelf = entry.id === currentUserId;
  return `<article class="staff-card ${active ? '' : 'is-disabled'}">
    <div class="sc-head">
      <div class="sc-ava ${AVATAR_CLASS[entry.role] || ''}" style="--av:${meta.avatar}">${esc(initials(entry.name))}</div>
      <div style="min-width:0;flex:1">
        <h3>${esc(entry.name)} ${isSelf ? '<span class="badge badge-neutral" style="margin-left:3px">You</span>' : ''}</h3>
        <div class="sc-role">${esc(entry.shift || 'Shift not set')}</div>
      </div>
      ${roleBadge(entry.role)}
    </div>
    <div class="sc-meta">
      <span class="sc-pin">PIN ••••</span>
      <span class="truncate" style="max-width:55%">${esc(entry.phone || entry.email || 'No contact')}</span>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-top:9px">
      <span class="badge ${active ? 'badge-sage' : 'badge-neutral'}">${active ? 'Active' : 'Disabled'}</span>
      <div class="ac-actions">
        <button class="btn btn-sm btn-icon" type="button" data-staff-edit="${esc(entry.id)}" title="Edit ${esc(entry.name)}" aria-label="Edit ${esc(entry.name)}">${icon('pencil')}</button>
        <button class="btn btn-sm ${active ? 'btn-danger' : ''}" type="button" data-staff-toggle="${esc(entry.id)}">${active ? 'Disable' : 'Enable'}</button>
        <button class="btn btn-sm btn-danger btn-icon" type="button" data-staff-delete="${esc(entry.id)}" aria-label="Delete ${esc(entry.name)}">${icon('trash')}</button>
      </div>
    </div>
  </article>`;
}

function roleMatrixMarkup(users) {
  const access = {
    admin: 'Everything — floor, menu, stock, billing, analytics, team',
    manager: 'Floor, menu, stock, billing, analytics, team',
    cashier: 'Orders, payments, analytics; menu and stock read-only',
    waiter: 'Tables, orders and kitchen board in read-only mode',
    chef: 'Kitchen board, menu availability and stock movements',
  };
  const rows = ROLES.map((role) => `<tr>
    <td>${roleBadge(role)}</td>
    <td class="tiny muted">${esc(ROLE_META[role].perms)}</td>
    <td class="tiny">${esc(access[role])}</td>
  </tr>`).join('');
  return `<div class="card" style="margin-top:14px">
    <div class="card-head">
      <div><h3>Role permissions</h3><p>Enforced in the interface; the API key protects sync.</p></div>
      <span class="badge badge-neutral">${users.length} profiles</span>
    </div>
    <div class="table-wrap">
      <table class="data">
        <thead><tr><th>Role</th><th>Focus</th><th>Can access</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>`;
}

export function renderStaffView(root) {
  const user = getUser();
  if (!can(user, 'view.staff')) {
    root.innerHTML = `<div class="card">${emptyState('lock', 'Restricted area', 'Only admins and managers can manage staff profiles.')}</div>`;
    return;
  }
  const s = getState();
  const admins = s.users.filter((entry) => entry.role === 'admin' && entry.active !== false).length;

  root.innerHTML = `
    <div class="page-head">
      <div>
        <h2>Team &amp; access</h2>
        <p>Create profiles, set four-digit PINs, assign shifts and control access to the register.</p>
      </div>
      <div class="page-actions">
        <button class="btn" type="button" data-staff-refresh>${icon('sync')} Refresh</button>
        <button class="btn btn-primary" type="button" data-staff-add>${icon('plus')} Add member</button>
      </div>
    </div>
    <div class="kpi-grid" style="grid-template-columns:repeat(3,minmax(0,1fr))">
      <div class="kpi" style="--tint:var(--saffron-wash)">
        <div class="kpi-label">Team size</div>
        <div class="kpi-value">${s.users.length}</div>
        <div class="kpi-foot">${s.users.filter((u) => u.active !== false).length} active profiles</div>
        <div class="kpi-icon">${icon('users')}</div>
      </div>
      <div class="kpi" style="--tint:var(--sage-wash)">
        <div class="kpi-label">On shift now</div>
        <div class="kpi-value">${s.users.filter((u) => u.active !== false && onShiftNow(u.shift)).length}</div>
        <div class="kpi-foot">Based on the current hour</div>
        <div class="kpi-icon">${icon('clock')}</div>
      </div>
      <div class="kpi" style="--tint:var(--amber-wash)">
        <div class="kpi-label">Admins</div>
        <div class="kpi-value">${admins}</div>
        <div class="kpi-foot">At least one must stay active</div>
        <div class="kpi-icon">${icon('lock')}</div>
      </div>
    </div>
    <div class="staff-grid">${s.users.map((entry) => staffCardMarkup(entry, user.id)).join('')}</div>
    ${roleMatrixMarkup(s.users)}`;

  $('[data-staff-add]', root)?.addEventListener('click', () => openStaffDialog());
  $('[data-staff-refresh]', root)?.addEventListener('click', () => {
    renderStaffView(root);
    toast('Staff list refreshed.', { type: 'info' });
  });
  $$('[data-staff-edit]', root).forEach((button) => {
    button.addEventListener('click', () => openStaffDialog(button.dataset.staffEdit));
  });
  $$('[data-staff-toggle]', root).forEach((button) => {
    button.addEventListener('click', () => toggleStaffActive(button.dataset.staffToggle));
  });
  $$('[data-staff-delete]', root).forEach((button) => {
    button.addEventListener('click', () => deleteStaff(button.dataset.staffDelete));
  });
}
function generatePin() {
  const users = getState().users;
  for (let i = 0; i < 60; i += 1) {
    const candidate = String(Math.floor(1000 + Math.random() * 9000));
    if (!users.some((user) => String(user.pin) === candidate)) return candidate;
  }
  return String(Date.now()).slice(-4);
}

export function openStaffDialog(userId = null) {
  const actor = getUser();
  if (!can(actor, 'staff.edit')) {
    toast('You do not have permission to edit staff.', { type: 'error' });
    return null;
  }
  const existing = userId ? findUser(userId) : null;
  if (existing?.role === 'admin' && actor.role !== 'admin') {
    toast('Only an admin can edit an admin profile.', { type: 'error' });
    return null;
  }
  const assignableRoles = actor.role === 'admin' ? ROLES : ROLES.filter((role) => role !== 'admin');
  let active = existing ? existing.active !== false : true;
  const pinValue = existing?.pin || generatePin();

  const dialog = openDialog({
    id: 'staff-dialog',
    eyebrow: existing ? 'Edit profile' : 'New profile',
    title: existing ? existing.name : 'Add a team member',
    subtitle: 'PINs work offline on this device and are hashed when synced to MySQL.',
    body: `<div class="form-grid">
      <div class="field span-2">
        <label for="sf-name">Full name</label>
        <input id="sf-name" class="input" maxlength="80" value="${esc(existing?.name || '')}" placeholder="e.g. Jamie Rivera" autocomplete="off">
      </div>
      <div class="field">
        <label for="sf-role">Role</label>
        <select id="sf-role" class="select">
          ${assignableRoles.map((role) => `<option value="${role}" ${(existing?.role || 'waiter') === role ? 'selected' : ''}>${ROLE_META[role].label}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label for="sf-shift">Shift</label>
        <select id="sf-shift" class="select">
          ${SHIFTS.map((shift) => `<option value="${esc(shift)}" ${(existing?.shift || SHIFTS[0]) === shift ? 'selected' : ''}>${esc(shift)}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label for="sf-pin">4-digit PIN</label>
        <div class="input-group">
          <input id="sf-pin" class="input" inputmode="numeric" maxlength="4" value="${esc(pinValue)}" autocomplete="off">
          <button class="input-addon" type="button" data-pin-gen style="cursor:pointer">Generate</button>
        </div>
      </div>
      <div class="field">
        <label for="sf-phone">Phone</label>
        <input id="sf-phone" class="input" maxlength="30" value="${esc(existing?.phone || '')}" placeholder="+1 555 0000">
      </div>
      <div class="field span-2">
        <label for="sf-email">Email</label>
        <input id="sf-email" class="input" type="email" maxlength="120" value="${esc(existing?.email || '')}" placeholder="name@restaurant.com">
      </div>
      <div class="span-2">
        <button type="button" class="availability-pill ${active ? 'is-on' : ''}" data-active-toggle>
          <span class="switch"></span>
          <span data-active-label>${active ? 'Active — can sign in' : 'Disabled — cannot sign in'}</span>
        </button>
      </div>
    </div>`,
    footer: `<span class="foot-note">Changes sync as USER_UPSERT.</span>
      <button class="btn" type="button" data-dlg-close>Cancel</button>
      <button class="btn btn-primary" type="button" data-staff-save>${icon('check')} Save member</button>`,
    focus: '#sf-name',
  });

  const pinInput = $('#sf-pin', dialog);
  pinInput?.addEventListener('input', () => {
    pinInput.value = pinInput.value.replace(/\D/g, '').slice(0, 4);
  });

  $('[data-pin-gen]', dialog)?.addEventListener('click', () => {
    pinInput.value = generatePin();
    pinInput.focus();
  });

  $('[data-active-toggle]', dialog)?.addEventListener('click', (event) => {
    active = !active;
    const button = event.currentTarget;
    button.classList.toggle('is-on', active);
    $('[data-active-label]', button).textContent = active ? 'Active — can sign in' : 'Disabled — cannot sign in';
  });

  $('[data-staff-save]', dialog)?.addEventListener('click', () => {
    const name = $('#sf-name', dialog).value.trim();
    const role = $('#sf-role', dialog).value;
    const shift = $('#sf-shift', dialog).value;
    const pin = pinInput.value.trim();
    const phone = $('#sf-phone', dialog).value.trim();
    const email = $('#sf-email', dialog).value.trim();

    if (name.length < 2) {
      toast('Enter the team member name.', { type: 'error' });
      $('#sf-name', dialog).focus();
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      toast('PIN must be exactly four digits.', { type: 'error' });
      pinInput.focus();
      return;
    }
    if (!assignableRoles.includes(role)) {
      toast('You cannot assign that role.', { type: 'error' });
      return;
    }
    const duplicate = getState().users.find((user) => user.id !== existing?.id && String(user.pin) === pin);
    if (duplicate) {
      toast('That PIN is already used by another profile.', { type: 'error', detail: duplicate.name });
      pinInput.focus();
      return;
    }

    const now = new Date().toISOString();
    let saved;
    if (existing) {
      Object.assign(existing, { name, role, shift, pin, phone, email, active, updatedAt: now });
      saved = existing;
    } else {
      saved = {
        id: uid('u'), name, role, shift, pin, phone, email, active,
        createdAt: now, updatedAt: now,
      };
      getState().users.push(saved);
    }

    enqueue('USER_UPSERT', 'user', { user: { ...saved } }, saved.id);
    saveState();
    closeDialog(dialog);
    toast(existing ? 'Staff profile updated.' : 'Team member added.', { type: 'success', detail: `${name} · ${ROLE_META[role].label}` });
    document.dispatchEvent(new CustomEvent('bite:data-changed', { detail: { reason: 'staff' } }));
    document.dispatchEvent(new CustomEvent('bite:refresh-header'));
  });

  return dialog;
}
export async function toggleStaffActive(userId) {
  const actor = getUser();
  const target = findUser(userId);
  if (!target) return;
  if (!can(actor, 'staff.edit')) {
    toast('You do not have permission to change staff access.', { type: 'error' });
    return;
  }
  if (target.id === actor.id) {
    toast('You cannot disable your own profile.', { type: 'error' });
    return;
  }
  const s = getState();
  const activeAdmins = s.users.filter((user) => user.role === 'admin' && user.active !== false).length;
  if (target.active !== false) {
    if (target.role === 'admin' && activeAdmins <= 1) {
      toast('Keep at least one active admin profile.', { type: 'error' });
      return;
    }
    const confirmed = await confirmDialog({
      title: `Disable ${target.name}?`,
      message: 'This profile will be blocked from signing in until it is enabled again. Existing orders and invoices stay untouched.',
      confirmText: 'Disable profile',
      danger: true,
      eyebrow: 'Access control',
    });
    if (!confirmed) return;
    target.active = false;
  } else {
    target.active = true;
  }
  target.updatedAt = new Date().toISOString();
  enqueue('USER_UPSERT', 'user', { user: { ...target } }, target.id);
  saveState();
  toast(`${target.name} ${target.active ? 'enabled' : 'disabled'}.`, {
    type: target.active ? 'success' : 'warn',
  });
  document.dispatchEvent(new CustomEvent('bite:data-changed', { detail: { reason: 'staff' } }));
  document.dispatchEvent(new CustomEvent('bite:refresh-header'));
}

export async function deleteStaff(userId) {
  const actor = getUser();
  const target = findUser(userId);
  if (!target) return;
  if (!can(actor, 'staff.edit')) {
    toast('You do not have permission to delete staff.', { type: 'error' });
    return;
  }
  if (target.id === actor.id) {
    toast('You cannot delete the profile you are signed in with.', { type: 'error' });
    return;
  }
  const s = getState();
  if (target.role === 'admin' && s.users.filter((user) => user.role === 'admin' && user.active !== false).length <= 1) {
    toast('Keep at least one active admin profile.', { type: 'error' });
    return;
  }
  const confirmed = await confirmDialog({
    title: `Delete ${target.name}?`,
    message: 'The profile and PIN will be removed from this device. Past orders and invoices are kept for reporting.',
    confirmText: 'Delete profile',
    danger: true,
    eyebrow: 'Remove staff',
  });
  if (!confirmed) return;
  s.users = s.users.filter((user) => user.id !== target.id);
  enqueue('USER_DELETE', 'user', { id: target.id }, target.id);
  saveState();
  toast(`${target.name} removed.`, { type: 'warn' });
  document.dispatchEvent(new CustomEvent('bite:data-changed', { detail: { reason: 'staff' } }));
}




