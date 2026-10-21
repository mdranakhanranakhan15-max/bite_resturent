import { SEED_DATA } from '../data/seed.js';

const STORAGE_KEY = 'bite_restaurant_erp_v1';
const LEGACY_STORAGE_KEY = 'bite_pos_v3';
const SESSION_USER_KEY = 'bite_current_user';

/** Session-only auth: the signed-in operator lives in sessionStorage, never localStorage. */
const readSessionUser = () => {
  try {
    const raw = typeof window !== 'undefined' ? sessionStorage.getItem(SESSION_USER_KEY) : null;
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
};

const QUEUE_ACTIONS = ['POS_ADD_ITEM', 'KOT_STATUS', 'STOCK_WASTE', 'SETTLE_INVOICE', 'EDIT_DISH', 'STOCK_BUY'];

/**
 * Sync endpoint. `index.html` sets window.BITE_CONFIG.serverApiUrl = '/api/sync'
 * so the request stays relative and resolves on Vercel (and in local dev) alike.
 */
export const SYNC_ENDPOINT = '/api/sync';

function resolveEndpoint() {
  const configured =
    (typeof window !== 'undefined' && window.BITE_CONFIG && window.BITE_CONFIG.serverApiUrl) ||
    (typeof globalThis !== 'undefined' && globalThis.BITE_CONFIG && globalThis.BITE_CONFIG.serverApiUrl);
  return typeof configured === 'string' && configured.trim() ? configured.trim() : SYNC_ENDPOINT;
}

const seedPendingQueue = () =>
  Array.from({ length: 18 }, (_, index) => ({
    id: `ACT-SEED-${String(index + 1).padStart(2, '0')}`,
    actionType: QUEUE_ACTIONS[index % QUEUE_ACTIONS.length],
    payload: { seed: true },
    timestamp: new Date(Date.now() - (18 - index) * 45000).toISOString()
  }));


class SyncStore {
  constructor() {
    this.listeners = [];
    this.pushTimer = null;
    this.suppressNotify = false;
    this.state = this.loadState();
    window.addEventListener('online', () => {
      if (!this.state.isOfflineSim) this.syncNow();
      this.notify();
    });
    window.addEventListener('offline', () => this.notify());
  }

  loadState() {
    // Auth is session-scoped: a fresh tab (or a closed one) always starts signed out.
    const sessionUser = readSessionUser();
    try {
      // Prefer the current key, but migrate any pre-existing legacy cache.
      const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // CRITICAL: never replace edited staff with the bundled seed data.
        const users = Array.isArray(parsed.users) && parsed.users.length > 0
          ? parsed.users
          : SEED_DATA.users;
        const currentUser = sessionUser
          ? users.find((user) => user.id === sessionUser.id) || sessionUser
          : null;
        return {
          ...SEED_DATA,
          ...parsed,
          users,
          isOfflineSim: Boolean(parsed.isOfflineSim),
          pendingQueue: Array.isArray(parsed.pendingQueue) ? parsed.pendingQueue : [],
          currentUser
        };
      }
    } catch (e) {
      console.warn('Local state load fallback:', e);
    }
    const initial = structuredClone(SEED_DATA);
    initial.isOfflineSim = false;
    initial.pendingQueue = seedPendingQueue();
    initial.currentUser = sessionUser;
    const fresh = JSON.stringify({ ...initial, currentUser: null });
    localStorage.setItem(STORAGE_KEY, fresh);
    localStorage.setItem(LEGACY_STORAGE_KEY, fresh);
    return initial;
  }

  /**
   * Persist the restaurant state.
   *
   * @param {boolean} immediate  When true the state is pushed to MongoDB right
   *                             away instead of waiting for the debounce.
   * @param {string}  reason     Label sent to the server for auditability.
   * @returns {Promise|null}     Resolves with the push result when immediate.
   */
  saveState(immediate = false, reason = 'STATE_SYNC') {
    // Restaurant data persists; the operator identity is stored in sessionStorage only.
    const persisted = JSON.stringify({ ...this.state, currentUser: null });
    localStorage.setItem(STORAGE_KEY, persisted);
    localStorage.setItem(LEGACY_STORAGE_KEY, persisted);
    this.syncSessionUser(this.state.currentUser);
    this.notify();

    if (!immediate) return null;

    // Flush the debounce so an immediate save is never superseded by a later one.
    if (this.pushTimer) {
      clearTimeout(this.pushTimer);
      this.pushTimer = null;
    }
    if (this.isOffline()) return Promise.resolve({ ok: false, offline: true });
    return this.pushStateToServer(reason);
  }

  /**
   * Force an immediate staff-profile save: localStorage is already written by
   * saveState(); this refreshes the session user and pushes to MongoDB now
   * instead of waiting for the debounce.
   */
  persistUserUpdate(reason = 'USER_UPDATED') {
    return this.saveState(true, reason);
  }

  /** Mirror the signed-in operator into sessionStorage (cleared on tab close). */
  syncSessionUser(user) {
    try {
      if (user) sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
      else sessionStorage.removeItem(SESSION_USER_KEY);
    } catch (_) {
      // Storage may be unavailable (private mode) — the in-memory state still works.
    }
  }

  isOffline() {
    return this.state.isOfflineSim || !navigator.onLine;
  }

  setOfflineSim(flag) {
    this.state.isOfflineSim = Boolean(flag);
    this.saveState();
    if (!this.state.isOfflineSim && navigator.onLine) {
      this.syncNow();
    }
  }

  mutate(actionType, mutatorFn, payload = {}) {
    mutatorFn(this.state);
    if (this.isOffline()) {
      this.state.pendingQueue.push({
        id: 'ACT-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        actionType,
        payload,
        timestamp: new Date().toISOString()
      });
    }
    this.saveState();
    this.schedulePush();
  }

  deductRecipeForItems(items) {
    items.forEach((orderItem) => {
      const dish = this.state.menu.find((m) => m.id === orderItem.dishId || m.name === orderItem.name);
      if (dish && Array.isArray(dish.recipe)) {
        dish.recipe.forEach((r) => {
          const ing = this.state.inventory.find((i) => i.id === (r.ingredientId ?? r.ingId));
          if (ing) {
            ing.qty = Math.max(0, Number((ing.qty - r.qty * orderItem.qty).toFixed(2)));
          }
        });
      }
    });
  }

  async syncNow() {
    if (this.isOffline()) {
      // Keep the queue intact — the local cache remains the source of truth.
      this.notify();
      return { synced: 0, offline: true };
    }

    const batch = [...this.state.pendingQueue];
    const pushed = await this.pushStateToServer();

    if (!pushed.ok) {
      if (!batch.length) this.notify();
      return { synced: 0, offline: true };
    }

    this.state.pendingQueue = [];
    this.saveState();
    return { synced: batch.length };
  }

  /** Snapshot of the collections mirrored to MongoDB. */
  serverState() {
    const { users, categories, kitchenStations, inventory, menu, tables, invoices } = this.state;
    return { users, categories, kitchenStations, inventory, menu, tables, invoices };
  }

  /** Push the full state to the server. Local storage stays authoritative when offline. */
  async pushStateToServer(reason = 'STATE_SYNC') {
    const endpoint = resolveEndpoint();
    try {
      // No origin check here: a relative '/api/sync' must still be POSTed so the
      // state reaches MongoDB on Vercel.
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: this.serverState(), reason })
      });
      return { ok: response.ok };
    } catch (_) {
      // Graceful local fallback when no API/server is reachable
      return { ok: false, offline: true };
    }
  }

  /** Debounced background save so rapid edits collapse into one request. */
  schedulePush() {
    if (this.isOffline()) return;
    if (this.pushTimer) clearTimeout(this.pushTimer);
    this.pushTimer = setTimeout(() => {
      this.pushTimer = null;
      this.pushStateToServer();
    }, 900);
  }

  /**
   * Pull the initial state from MongoDB on startup.
   * A fresh/empty database is seeded from the local offline cache instead.
   */
  async hydrateFromServer() {
    const keys = Object.keys(this.serverState());
    const endpoint = resolveEndpoint();
    try {
      const response = await fetch(endpoint, { headers: { Accept: 'application/json' }, cache: 'no-store' });
      if (!response.ok) return { hydrated: false };
      const payload = await response.json();
      const remote = payload && payload.state;
      if (!remote || typeof remote !== 'object') return { hydrated: false };

      const hasRemoteData = keys.some((key) => Array.isArray(remote[key]) && remote[key].length);
      if (!hasRemoteData) {
        // Nothing stored yet — push the local seed so the database is populated.
        const seeded = await this.pushStateToServer();
        return { hydrated: false, seeded: seeded.ok };
      }

      keys.forEach((key) => {
        if (Array.isArray(remote[key]) && remote[key].length) this.state[key] = remote[key];
      });

      // Re-bind the signed-in operator to the refreshed records.
      const rememberedId = this.state.currentUser?.id;
      this.state.currentUser = rememberedId
        ? this.state.users.find((user) => user.id === rememberedId) || this.state.users[0] || null
        : null;

      // Hydration must not trigger a re-render mid-boot; the app renders once
      // the persisted state is in place.
      this.suppressNotify = true;
      try {
        this.saveState();
      } finally {
        this.suppressNotify = false;
      }
      return { hydrated: true };
    } catch (_) {
      return { hydrated: false, offline: true };
    }
  }

  subscribe(fn) {
    this.listeners.push(fn);
  }

  notify() {
    if (this.suppressNotify) return;
    this.listeners.forEach((fn) => fn(this.state));
  }
}

export const store = new SyncStore();

