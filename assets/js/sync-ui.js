/**
 * Bite Sync Center — queue visibility, connection test and endpoint settings.
 */
import { getState, saveState } from './store.js';
import {
  syncMeta, flushQueue, testConnection, pullMasterData, setOfflineSimulation,
  bootstrapMasterData,
} from './sync.js';
import { getUser } from './auth.js';
import {
  $, esc, icon, openDialog, closeDialog, toast, confirmDialog, timeAgo, fmtDateTime,
} from './utils.js';

const STATUS_LABEL = { PENDING_LOCAL: 'Queued', SYNCING: 'Sending', FAILED: 'Failed', SYNCED: 'Synced' };

function statusClass(status) {
  if (status === 'FAILED') return 'badge-brick';
  if (status === 'SYNCING') return 'badge-amber';
  if (status === 'SYNCED') return 'badge-sage';
  return 'badge-neutral';
}

function queueMarkup(meta) {
  if (!meta.queue.length) {
    return '<div class="q-empty">Queue is clear. New orders, KOTs, payments and stock edits appear here whenever the register is offline.</div>';
  }
  return meta.queue.slice(0, 14).map((item) => `<div class="queue-row" title="${esc(item.error || '')}">
    <span class="status-dot ${item.status === 'FAILED' ? 'is-error' : item.status === 'SYNCING' ? 'is-offline' : ''}" style="width:6px;height:6px;box-shadow:none"></span>
    <span class="q-type">${esc(item.type)}</span>
    <span class="q-ref">${esc(item.ref || item.entity || '')}</span>
    <span class="badge ${statusClass(item.status)}">${esc(STATUS_LABEL[item.status] || item.status)}</span>
    <span class="q-time" title="${esc(fmtDateTime(item.at))}">${esc(timeAgo(item.at))}</span>
  </div>
  ${item.error ? `<div class="tiny danger-text" style="margin:-2px 0 4px 16px">${esc(item.error)}</div>` : ''}`).join('');
}

function syncBody() {
  const meta = syncMeta();
  const settings = getState().settings;
  const lastSync = settings.lastSyncAt ? `${fmtDateTime(settings.lastSyncAt)} · ${timeAgo(settings.lastSyncAt)}` : 'Never synced';
  const secondary = !navigator.onLine
    ? 'The browser reports no connection. Everything continues locally.'
    : meta.simulate
      ? 'Simulation is on — changes stay queued until you turn it off.'
      : 'Changes are written locally and pushed automatically.';

  return `<div class="sync-stats">
      <div class="sync-stat">
        <div class="ss-label">Connection</div>
        <div class="ss-val" style="font-size:16px;display:flex;align-items:center;gap:6px">
          <span class="status-dot ${meta.offline ? 'is-offline' : ''}" style="width:7px;height:7px;box-shadow:none"></span>
          ${meta.offline ? 'Offline' : 'Online'}
        </div>
      </div>
      <div class="sync-stat"><div class="ss-label">Pending changes</div><div class="ss-val">${meta.pending}</div></div>
      <div class="sync-stat"><div class="ss-label">Failed</div><div class="ss-val ${meta.failed ? 'danger-text' : ''}">${meta.failed}</div></div>
    </div>

    <div class="backup-tile">
      <div class="bt-icon">${icon(meta.offline ? 'wifi-off' : 'cloud')}</div>
      <div style="flex:1;min-width:0">
        <h4>${meta.offline ? 'Offline mode active' : 'Connected and ready'}</h4>
        <p>${esc(secondary)} Last sync: ${esc(lastSync)}.</p>
        ${settings.lastSyncError ? `<p class="danger-text" style="font-weight:700">Last error: ${esc(settings.lastSyncError)}</p>` : ''}
      </div>
      <button class="availability-pill ${meta.simulate ? 'is-on' : ''}" type="button" data-sim-toggle>
        <span class="switch"></span><span>Simulate offline</span>
      </button>
    </div>

    <div class="card" style="margin-top:10px">
      <div class="card-head">
        <div><h3>PHP / MySQL endpoint</h3><p>The API key must match BITE_SYNC_KEY on the server.</p></div>
        <span class="badge ${meta.offline ? 'badge-amber' : 'badge-sage'}">${meta.offline ? 'Local only' : 'Auto-sync on'}</span>
      </div>
      <div class="card-pad">
        <div class="form-grid">
          <div class="field span-2">
            <label for="sync-endpoint">Sync endpoint</label>
            <input id="sync-endpoint" class="input" value="${esc(settings.syncEndpoint || 'api/sync.php')}" placeholder="api/sync.php" autocomplete="off">
          </div>
          <div class="field span-2">
            <label for="sync-key">API key</label>
            <input id="sync-key" class="input" type="password" value="${esc(settings.syncKey || '')}" placeholder="Shared key" autocomplete="off">
          </div>
        </div>
        <div class="flex items-center gap-2" style="margin-top:10px;flex-wrap:wrap">
          <button class="btn btn-sm" type="button" data-save-settings>${icon('check')} Save settings</button>
          <button class="btn btn-sm" type="button" data-test>${icon('wifi')} Test connection</button>
          <button class="btn btn-sm" type="button" data-pull>${icon('download')} Pull server data</button>
          <button class="btn btn-sm" type="button" data-push-master>${icon('upload')} Push master data</button>
          <span class="tiny muted" id="sync-test-result">Not tested</span>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:10px">
      <div class="card-head">
        <div><h3>Offline queue</h3><p>FIFO batch of local changes waiting for the server.</p></div>
        <span class="badge badge-neutral">${meta.pending} pending</span>
      </div>
      <div class="card-pad" style="display:grid;gap:8px">
        <div class="queue-list">${queueMarkup(meta)}</div>
        <div class="flex items-center gap-2" style="flex-wrap:wrap">
          ${meta.failed ? `<button class="btn btn-sm" type="button" data-retry-failed>${icon('sync')} Retry ${meta.failed} failed</button>` : ''}
          <button class="btn btn-sm btn-ghost" type="button" data-clear-synced>${icon('trash')} Prune synced history</button>
        </div>
      </div>
    </div>

    <p class="tiny muted" style="margin:11px 0 0;line-height:1.6">
      Bite saves locally first, then posts the queue to <code>api/sync.php</code> for idempotent MySQL upserts. Pulling master data merges menu, stock, categories and staff — local orders and invoices stay untouched.
    </p>`;
}
export function openSyncCenter() {
  const user = getUser();
  if (!user) {
    toast('Sign in to open the sync center.', { type: 'warn' });
    return null;
  }

  const dialog = openDialog({
    id: 'sync-dialog',
    size: 'dlg-wide',
    eyebrow: 'Hybrid sync',
    title: 'Sync center',
    subtitle: 'Local-first changes travel to MySQL whenever a connection is available.',
    body: `<div id="sync-body">${syncBody()}</div>`,
    footer: `<span class="foot-note">Browser network: ${navigator.onLine ? 'online' : 'offline'}</span>
      <button class="btn" type="button" data-dlg-close>Close</button>
      <button class="btn btn-primary" type="button" data-sync-now>${icon('sync')} Sync now</button>`,
  });

  const refresh = () => {
    const body = $('#sync-body', dialog);
    if (body) body.innerHTML = syncBody();
  };

  const readFields = () => {
    const endpointInput = $('#sync-endpoint', dialog);
    const keyInput = $('#sync-key', dialog);
    if (!endpointInput) return;
    const state = getState();
    state.settings.syncEndpoint = endpointInput.value.trim() || 'api/sync.php';
    state.settings.syncKey = keyInput ? keyInput.value.trim() : '';
    saveState({ silent: true });
    document.dispatchEvent(new CustomEvent('bite:refresh-header'));
  };

  const runSync = async () => {
    readFields();
    const button = $('[data-sync-now]', dialog);
    if (button) {
      button.disabled = true;
      button.innerHTML = `${icon('sync', 'spin')} Syncing…`;
    }
    const result = await flushQueue({ manual: true });
    if (button) {
      button.disabled = false;
      button.innerHTML = `${icon('sync')} Sync now`;
    }
    if (!result.ok && result.reason === 'offline') {
      toast('Still offline — the queue is safe on this device.', { type: 'warn' });
    }
    refresh();
  };

  dialog.addEventListener('click', async (event) => {
    const target = event.target;

    if (target.closest('[data-sim-toggle]')) {
      setOfflineSimulation(!getState().settings.simulateOffline);
      refresh();
      return;
    }

    if (target.closest('[data-save-settings]')) {
      readFields();
      toast('Sync settings saved on this device.', { type: 'success' });
      refresh();
      return;
    }

    if (target.closest('[data-push-master]')) {
      readFields();
      bootstrapMasterData(true);
      toast('Master data queued for the central database.', {
        type: 'info', detail: 'Categories, menu, stock and staff profiles.',
      });
      refresh();
      await runSync();
      return;
    }

    if (target.closest('[data-test]')) {
      readFields();
      const resultEl = $('#sync-test-result', dialog);
      if (resultEl) {
        resultEl.textContent = 'Testing connection…';
        resultEl.className = 'tiny muted';
      }
      const result = await testConnection();
      if (resultEl) {
        resultEl.textContent = result.ok
          ? `Connected · server ${result.data?.serverTime || 'ready'}`
          : `Failed · ${result.error}`;
        resultEl.className = `tiny ${result.ok ? 'success-text' : 'danger-text'}`;
      }
      toast(result.ok ? 'Sync server is reachable and the database responded.' : 'Connection test failed.', {
        type: result.ok ? 'success' : 'error',
        detail: result.ok ? (result.data?.serverTime || '') : result.error,
      });
      return;
    }

    if (target.closest('[data-pull]')) {
      const confirmed = await confirmDialog({
        title: 'Pull server master data?',
        message: 'Categories, menu items, inventory and staff from MySQL will be merged where the server copy is newer. Local open orders, invoices and queued changes are not touched.',
        confirmText: 'Pull data',
        eyebrow: 'Server → device',
      });
      if (!confirmed) return;
      const result = await pullMasterData();
      if (result.ok) {
        toast(`${result.merged} master record(s) merged from the server.`, { type: 'success' });
        document.dispatchEvent(new CustomEvent('bite:data-changed', { detail: { reason: 'pull' } }));
      } else {
        toast('Pull failed.', { type: 'error', detail: result.error });
      }
      refresh();
      return;
    }

    if (target.closest('[data-retry-failed]')) {
      const state = getState();
      let count = 0;
      state.syncQueue.forEach((item) => {
        if (item.status === 'FAILED') {
          item.status = 'PENDING_LOCAL';
          item.attempts = 0;
          item.error = '';
          count += 1;
        }
      });
      saveState({ silent: true });
      toast(`${count} failed change(s) queued for retry.`, { type: 'info' });
      refresh();
      if (count) await runSync();
      return;
    }

    if (target.closest('[data-clear-synced]')) {
      const state = getState();
      const before = state.syncQueue.length;
      state.syncQueue = state.syncQueue.filter((item) => item.status !== 'SYNCED');
      saveState({ silent: true });
      toast(`${before - state.syncQueue.length} synced event(s) pruned.`, { type: 'info' });
      refresh();
      return;
    }

    if (target.closest('[data-sync-now]')) {
      await runSync();
    }
  });

  return dialog;
}

