/**
 * Bite POS — hybrid sync engine.
 * Writes go to localStorage first, then to the PHP/MySQL API when possible.
 */
import {
  getState, saveState, pendingSyncCount,
} from './store.js';
import { toast, uid } from './utils.js';

const MAX_BATCH = 80;
let flushing = false;
let retryTimer = null;
let intervalTimer = null;

export function isOffline() {
  const s = getState();
  return !navigator.onLine || !!s.settings.simulateOffline;
}

export function syncMeta() {
  const s = getState();
  const pending = s.syncQueue.filter((item) => item.status !== 'SYNCED');
  return {
    offline: isOffline(),
    online: navigator.onLine,
    simulate: !!s.settings.simulateOffline,
    pending: pending.length,
    failed: pending.filter((item) => item.status === 'FAILED').length,
    syncing: flushing,
    lastSyncAt: s.settings.lastSyncAt,
    lastError: s.settings.lastSyncError || '',
    endpoint: s.settings.syncEndpoint || 'api/sync.php',
    queue: pending,
  };
}

function announce() {
  document.dispatchEvent(new CustomEvent('bite:refresh-header'));
}

export function enqueue(type, entity, payload, ref = '') {
  const s = getState();
  let clone = payload;
  try {
    clone = typeof structuredClone === 'function' ? structuredClone(payload) : JSON.parse(JSON.stringify(payload));
  } catch (error) {
    console.warn('[Bite] Could not clone sync payload', error);
  }
  s.syncQueue.push({
    id: uid('q'),
    type,
    entity,
    ref,
    payload: clone,
    at: new Date().toISOString(),
    status: 'PENDING_LOCAL',
    attempts: 0,
    error: '',
  });
  if (s.syncQueue.length > 800) {
    // Only prune acknowledged history — never discard unsynced work.
    const synced = s.syncQueue.filter((item) => item.status === 'SYNCED');
    if (synced.length) {
      const keep = new Set(synced.slice(-40).map((item) => item.id));
      s.syncQueue = s.syncQueue.filter((item) => item.status !== 'SYNCED' || keep.has(item.id));
    }
  }
  saveState({ silent: true });
  announce();
  if (!isOffline()) scheduleFlush(700);
}

export function scheduleFlush(delay = 600) {
  clearTimeout(retryTimer);
  retryTimer = setTimeout(() => {
    flushQueue().catch((error) => console.error('[Bite] sync error', error));
  }, Math.max(0, delay));
}

function markBatch(batch, status, message = '') {
  const s = getState();
  batch.forEach((queued) => {
    const item = s.syncQueue.find((entry) => entry.id === queued.id);
    if (!item) return;
    item.status = status;
    if (message) item.error = message.slice(0, 240);
    if (status === 'FAILED') item.attempts = (item.attempts || 0) + 1;
  });
}

function scheduleRetryAfterFailure(batch) {
  const attempts = Math.max(0, ...batch.map((item) => item.attempts || 0));
  if (attempts >= 8) return;
  const delay = Math.min(90000, 5000 * (2 ** Math.min(attempts, 4)));
  scheduleFlush(delay);
}
export async function flushQueue(options = {}) {
  const manual = !!options.manual;
  if (flushing) return { ok: false, reason: 'busy' };
  if (isOffline()) {
    if (manual) toast('You are offline. Changes are safe in the local queue.', { type: 'warn' });
    return { ok: false, reason: 'offline' };
  }

  const s = getState();
  const batch = s.syncQueue.filter((item) => item.status !== 'SYNCED').slice(0, MAX_BATCH);
  if (!batch.length) {
    if (manual) toast('Everything is already synced.', { type: 'success' });
    return { ok: true, applied: 0 };
  }

  flushing = true;
  markBatch(batch, 'SYNCING');
  saveState({ silent: true });
  announce();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  const endpoint = s.settings.syncEndpoint || 'api/sync.php';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Bite-Key': s.settings.syncKey || '' },
      credentials: 'same-origin',
      cache: 'no-store',
      signal: controller.signal,
      body: JSON.stringify({
        action: 'push',
        client: {
          name: 'Bite POS',
          version: 1,
          device: navigator.userAgent.slice(0, 180),
          queuedAt: new Date().toISOString(),
        },
        batch: batch.map((item) => ({
          id: item.id, type: item.type, entity: item.entity, ref: item.ref,
          at: item.at, payload: item.payload,
        })),
      }),
    });

    let data = null;
    try { data = await response.json(); } catch { data = null; }
    if (!response.ok || !data || data.ok !== true) {
      throw new Error(data?.error || `Server responded ${response.status}`);
    }

    const results = Array.isArray(data.results) ? data.results : [];
    const byId = new Map(results.map((result) => [result.id, result]));
    const state = getState();
    let synced = 0;

    batch.forEach((queued) => {
      const item = state.syncQueue.find((entry) => entry.id === queued.id);
      if (!item) return;
      const result = byId.get(queued.id);
      if (result?.status === 'synced') {
        item.status = 'SYNCED';
        item.syncedAt = new Date().toISOString();
        item.error = '';
        synced += 1;
      } else if (result?.status === 'failed') {
        item.status = 'FAILED';
        item.attempts = (item.attempts || 0) + 1;
        item.error = (result.error || 'Server rejected the change').slice(0, 240);
      } else if (!results.length) {
        // Older API revisions acknowledge the batch without per-item results.
        item.status = 'SYNCED';
        item.syncedAt = new Date().toISOString();
        item.error = '';
        synced += 1;
      } else {
        item.status = 'FAILED';
        item.attempts = (item.attempts || 0) + 1;
        item.error = 'No acknowledgement from server';
      }
    });

    state.settings.lastSyncAt = new Date().toISOString();
    state.settings.lastSyncError = '';
    const syncedItems = state.syncQueue.filter((item) => item.status === 'SYNCED');
    if (syncedItems.length > 80) {
      const keep = new Set(syncedItems.slice(-80).map((item) => item.id));
      state.syncQueue = state.syncQueue.filter((item) => item.status !== 'SYNCED' || keep.has(item.id));
    }
    saveState({ silent: true });

    if (manual) {
      const remaining = pendingSyncCount();
      toast(`${synced} change${synced === 1 ? '' : 's'} synced to the central database.`, {
        type: 'success',
        detail: remaining ? `${remaining} item(s) still queued.` : 'Everything is up to date.',
      });
    }

    const stillFailed = getState().syncQueue.filter((item) => item.status === 'FAILED');
    if (stillFailed.length) {
      scheduleRetryAfterFailure(stillFailed);
    } else if (pendingSyncCount() > 0 && !isOffline()) {
      // More than one batch queued — drain the rest right away.
      scheduleFlush(450);
    }
    return { ok: true, applied: synced };
  } catch (error) {
    const message = error.name === 'AbortError'
      ? 'Sync timed out after 15 seconds.'
      : (error.message || 'Could not reach the sync server.');
    markBatch(batch, 'FAILED', message);
    const state = getState();
    state.settings.lastSyncError = message;
    saveState({ silent: true });
    if (manual) {
      toast('Sync failed — work is still safe offline.', { type: 'error', detail: message });
    }
    scheduleRetryAfterFailure(getState().syncQueue.filter((item) => item.status === 'FAILED'));
    return { ok: false, reason: 'error', error: message };
  } finally {
    clearTimeout(timeout);
    flushing = false;
    announce();
  }
}
export async function testConnection() {
  const s = getState();
  if (!navigator.onLine) return { ok: false, error: 'This device has no network connection.' };
  const endpoint = s.settings.syncEndpoint || 'api/sync.php';
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(`${endpoint}?action=ping&t=${Date.now()}`, {
      headers: { 'X-Bite-Key': s.settings.syncKey || '' },
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timer);
    let data = null;
    try { data = await response.json(); } catch { data = null; }
    if (!response.ok || !data?.ok) {
      return { ok: false, error: data?.error || `HTTP ${response.status}` };
    }
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: error.name === 'AbortError' ? 'Connection timed out.' : (error.message || 'Network error'),
    };
  }
}

export async function pullMasterData() {
  if (isOffline()) return { ok: false, error: 'Offline' };
  const s = getState();
  const endpoint = s.settings.syncEndpoint || 'api/sync.php';
  const since = s.settings.lastPullAt || '1970-01-01T00:00:00Z';
  try {
    const response = await fetch(`${endpoint}?action=pull&since=${encodeURIComponent(since)}`, {
      headers: { 'X-Bite-Key': s.settings.syncKey || '' },
      cache: 'no-store',
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data?.error || `HTTP ${response.status}`);
    const incoming = data.data || {};
    let merged = 0;
    const mergeById = (target, list, preservePin = false) => {
      (list || []).forEach((row) => {
        if (!row?.id) return;
        const index = target.findIndex((item) => item.id === row.id);
        const next = { ...row };
        if (preservePin) {
          const existingPin = index !== -1 ? target[index].pin : '';
          if (existingPin) next.pin = existingPin;
        }
        if (index === -1) {
          target.push(next);
          merged += 1;
          return;
        }
        const localStamp = new Date(target[index].updatedAt || 0).getTime();
        const remoteStamp = new Date(next.updatedAt || 0).getTime();
        if (remoteStamp >= localStamp) {
          target[index] = next;
          merged += 1;
        }
      });
    };
    mergeById(s.categories, incoming.categories);
    mergeById(s.menu, incoming.menu);
    mergeById(s.inventory, incoming.inventory);
    mergeById(s.users, incoming.users, true);
    s.settings.lastPullAt = new Date().toISOString();
    saveState({ reason: 'pull' });
    document.dispatchEvent(new CustomEvent('bite:data-changed', { detail: { reason: 'pull' } }));
    return { ok: true, merged };
  } catch (error) {
    return { ok: false, error: error.message || 'Pull failed' };
  }
}

export function setOfflineSimulation(enabled) {
  const s = getState();
  s.settings.simulateOffline = !!enabled;
  saveState({ silent: true });
  announce();
  if (enabled) {
    toast('Offline simulation on — new orders are queued on this device.', { type: 'warn' });
  } else {
    toast('Back online — sending queued changes.', { type: 'success' });
    scheduleFlush(300);
  }
}

/**
 * Send the whole local master catalogue (categories, menu, stock, staff) in one
 * idempotent event. Runs once per workspace, or on demand from the Sync Center.
 */
export function bootstrapMasterData(force = false) {
  const s = getState();
  if (!force && s.settings.bootstrapAt) return false;
  enqueue('MASTER_BOOTSTRAP', 'workspace', {
    categories: s.categories.map((category) => ({ ...category })),
    inventory: s.inventory.map((item) => ({ ...item })),
    users: s.users.map((user) => ({ ...user })),
    menu: s.menu.map((item) => ({
      ...item,
      recipe: (item.recipe || []).map((line) => ({ ...line })),
    })),
  }, 'WORKSPACE');
  s.settings.bootstrapAt = new Date().toISOString();
  saveState({ silent: true });
  announce();
  return true;
}

export function initSync() {
  window.addEventListener('online', () => {
    announce();
    if (pendingSyncCount() > 0) {
      toast('Connection restored — syncing queued changes.', { type: 'success' });
      scheduleFlush(400);
    }
  });

  window.addEventListener('offline', () => {
    announce();
    toast('You are offline. Bite keeps billing and ticking locally.', { type: 'warn' });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && !isOffline() && pendingSyncCount() > 0) {
      scheduleFlush(500);
    }
  });

  clearInterval(intervalTimer);
  intervalTimer = setInterval(() => {
    if (!isOffline() && pendingSyncCount() > 0 && !flushing) {
      flushQueue().catch(() => {});
    }
  }, 60000);

  announce();
}


