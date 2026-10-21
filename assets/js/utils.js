/**
 * Bite POS — shared formatting helpers, DOM utilities, toasts and dialogs.
 * Dependency-free ES module. Safe to import from every feature module.
 */

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

export function uid(prefix = 'id') {
  let rand;
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    rand = globalThis.crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  } else {
    rand = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }
  return `${prefix}_${rand}`;
}

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ESCAPES[ch]);

export const num = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export const round2 = (value) => Math.round((num(value) + Number.EPSILON) * 100) / 100;
export const round3 = (value) => Math.round((num(value) + Number.EPSILON) * 1000) / 1000;
export const clamp = (value, min, max) => Math.min(max, Math.max(min, num(value)));

let currencySymbol = '$';
export function setCurrency(symbol) {
  currencySymbol = symbol || '$';
}
export function getCurrency() {
  return currencySymbol;
}
export function money(value, options = {}) {
  const amount = num(value);
  const decimals = options.decimals ?? 2;
  const sign = amount < 0 ? '−' : '';
  const abs = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${sign}${options.plain ? '' : currencySymbol}${abs}`;
}
export function signedMoney(value) {
  const amount = num(value);
  return `${amount > 0 ? '+' : amount < 0 ? '−' : ''}${currencySymbol}${Math.abs(amount).toFixed(2)}`;
}

/* Dates */
export const dateKey = (value = new Date()) => {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const isToday = (value) => dateKey(value) === dateKey(new Date());

export function fmtTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function fmtDate(value, options = {}) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', options.long
    ? { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
    : { month: 'short', day: 'numeric' });
}

export function fmtDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return `${fmtDate(d)} · ${fmtTime(d)}`;
}

export function minutesSince(value) {
  if (!value) return 0;
  const d = new Date(value).getTime();
  if (Number.isNaN(d)) return 0;
  return Math.max(0, Math.floor((Date.now() - d) / 60000));
}

export function timeAgo(value) {
  if (!value) return 'just now';
  const secs = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  if (!Number.isFinite(secs) || secs < 45) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  if (secs < 172800) return 'yesterday';
  return fmtDate(value);
}

export function durationLabel(mins) {
  const m = Math.max(0, Math.floor(num(mins)));
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${String(m % 60).padStart(2, '0')}m`;
}

export function lastNDays(count = 7) {
  const out = [];
  const today = new Date();
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push({
      key: dateKey(d),
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      short: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    });
  }
  return out;
}
/* Markup helpers */
export function icon(name, className = '') {
  return `<svg class="${className}" width="16" height="16" aria-hidden="true" focusable="false"><use href="#i-${name}"/></svg>`;
}

export function initials(name = '') {
  return String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || '?';
}

export function emptyState(iconName, title, text) {
  return `<div class="empty-state">${icon(iconName)}<h3>${esc(title)}</h3><p>${esc(text)}</p></div>`;
}

export function statusBadge(status) {
  const labels = { cooking: 'Cooking', ready: 'Ready', served: 'Served', unsent: 'Not sent' };
  return `<span class="st-badge ${esc(status)}">${esc(labels[status] || status)}</span>`;
}

export function roleBadge(role) {
  const map = {
    admin: 'badge-ink', manager: 'badge-accent', cashier: 'badge-sage',
    waiter: 'badge-amber', chef: 'badge-brick',
  };
  return `<span class="badge ${map[role] || 'badge-neutral'}">${esc(role)}</span>`;
}

export function debounce(fn, wait = 220) {
  let timer;
  return function debounced(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function escapeCsv(value) {
  const str = String(value ?? '');
  return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function downloadFile(filename, content, mime = 'application/octet-stream') {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/* Toasts */
const TOAST_ICONS = { info: 'info', success: 'check', error: 'alert', warn: 'alert' };

export function toast(message, options = {}) {
  const stack = document.getElementById('toast-stack');
  if (!stack) return null;
  const type = options.type || 'info';
  while (stack.children.length >= 4) stack.firstElementChild.remove();
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `${icon(options.icon || TOAST_ICONS[type] || 'info')}
    <div>${esc(message)}${options.detail ? `<small>${esc(options.detail)}</small>` : ''}</div>`;
  stack.appendChild(el);
  const ttl = options.timeout ?? (type === 'error' ? 5200 : 3200);
  const timer = setTimeout(() => {
    el.classList.add('is-out');
    setTimeout(() => el.remove(), 220);
  }, ttl);
  el.addEventListener('click', () => {
    clearTimeout(timer);
    el.remove();
  });
  return el;
}

/* Dialogs */
let dialogSeq = 0;

export function openDialog(options = {}) {
  const id = options.id || `dlg-${++dialogSeq}`;
  document.querySelectorAll('dialog[data-dialog-id]').forEach((d) => {
    if (d.dataset.dialogId === id) d.remove();
  });

  const dlg = document.createElement('dialog');
  dlg.className = `bite-dialog ${options.size || ''} ${options.className || ''}`.trim();
  dlg.dataset.dialogId = id;

  const header = options.custom ? '' : `
    <div class="dlg-head">
      <div>
        ${options.eyebrow ? `<div class="dlg-eyebrow">${esc(options.eyebrow)}</div>` : ''}
        <h2>${esc(options.title || '')}</h2>
        ${options.subtitle ? `<p>${esc(options.subtitle)}</p>` : ''}
      </div>
      <button class="icon-btn dlg-close" type="button" data-dlg-close aria-label="Close dialog">${icon('x')}</button>
    </div>`;

  const footer = options.footer ? `<div class="dlg-foot">${options.footer}</div>` : '';

  dlg.innerHTML = options.custom
    ? options.body || ''
    : `<div class="dlg-shell">${header}<div class="dlg-body ${options.bodyClass || ''}">${options.body || ''}</div>${footer}</div>`;

  document.body.appendChild(dlg);

  dlg.addEventListener('click', (event) => {
    if (event.target.closest('[data-dlg-close]')) {
      event.preventDefault();
      closeDialog(dlg);
      return;
    }
    if (event.target === dlg && options.dismissible !== false) closeDialog(dlg);
  });

  dlg.addEventListener('cancel', (event) => {
    if (options.dismissible === false) event.preventDefault();
  });

  dlg.addEventListener('close', () => {
    try { options.onClose?.(dlg); } finally { dlg.remove(); }
  });

  dlg.showModal();
  options.onMount?.(dlg);
  if (options.focus) {
    setTimeout(() => {
      const target = dlg.querySelector(options.focus);
      if (target) target.focus();
    }, 40);
  }
  return dlg;
}

export function closeDialog(dlg) {
  if (!dlg) return;
  if (dlg.open) dlg.close();
  else dlg.remove();
}

export function confirmDialog(options = {}) {
  const {
    title = 'Are you sure?',
    message = '',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    danger = false,
    eyebrow = 'Please confirm',
  } = options;

  return new Promise((resolve) => {
    let settled = false;
    const done = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const dlg = openDialog({
      id: 'confirm-dialog',
      size: 'dlg-sm',
      eyebrow,
      title,
      body: `<p style="font-size:12.5px;line-height:1.65;color:var(--muted);margin:0">${message}</p>`,
      footer: `<button class="btn" type="button" data-confirm-cancel>${esc(cancelText)}</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" type="button" data-confirm-ok>${esc(confirmText)}</button>`,
      onClose: () => done(false),
    });
    dlg.querySelector('[data-confirm-cancel]').addEventListener('click', () => {
      done(false);
      closeDialog(dlg);
    });
    dlg.querySelector('[data-confirm-ok]').addEventListener('click', () => {
      done(true);
      closeDialog(dlg);
    });
  });
}

