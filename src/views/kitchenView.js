import { store } from '../store/syncStore.js';
import { money, escapeHtml } from '../utils/format.js';

const STATUSES = ['Pending', 'Cooking', 'Ready', 'Served'];

const STATUS_TONE = {
  Pending: 'badge-neutral',
  Cooking: 'badge-low',
  Ready: 'badge-ok',
  Served: 'badge-neutral'
};

const ICONS = {
  clock: `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`,
  flame: `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c4 0 7-2.7 7-6.5 0-3.5-2.4-5.4-4-7.5-.8-1-1.4-2-1.5-3.5-2 .8-3.2 2.5-3.2 4.2 0 1 .3 1.8.8 2.6-1.2-.4-2.1-1.3-2.7-2.4C6.7 10 6 12.4 6 14.5 6 18.3 8.6 22 12 22Z"/></svg>`,
  bell: `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>`,
  check: `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8.5 12.2 2.4 2.4 4.7-4.9"/></svg>`
};

function kpi({ label, value, note, tone, icon }) {
  return `
    <div class="kpi kpi--${tone}">
      <span class="kpi-blob"></span>
      <span class="kpi-watermark">${icon}</span>
      <p class="kpi-label">${label}</p>
      <p class="kpi-value serif">${value}</p>
      <p class="kpi-note">${note}</p>
    </div>
  `;
}

function ticketCard(table) {
  const ticketTotal = table.items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const itemCount = table.items.reduce((sum, item) => sum + item.qty, 0);
  const channel = table.id === 'Takeaway' ? 'Takeaway order' : 'Dine in';
  const isServed = table.kotStatus === 'Served';

  const itemsMarkup = table.items.map((item) => `
    <div class="flex items-start justify-between gap-2">
      <div class="flex min-w-0 items-start gap-2">
        <span class="serif shrink-0 text-[11px] font-bold text-[#1c1a17]">${item.qty}×</span>
        <div class="min-w-0">
          <p class="truncate text-[10px] font-semibold text-[#1c1a17]">${escapeHtml(item.name)}</p>
          <p class="text-[8px] uppercase tracking-[0.12em] text-[#a39c8d]">${escapeHtml(item.station)}</p>
        </div>
      </div>
      <span class="serif shrink-0 text-[10px] font-semibold text-[#4c473d]">${money(item.qty * item.price)}</span>
    </div>
  `).join('');

  return `
    <article class="warm-card flex flex-col p-4${isServed ? ' opacity-80' : ''}">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <p class="section-label">${table.id === 'Takeaway' ? 'TAKEAWAY KOT' : 'KOT · DINE IN'}</p>
          <h3 class="serif mt-0.5 text-[20px] font-bold leading-tight text-[#1c1a17]">${table.name}</h3>
          <p class="mt-0.5 truncate text-[9px] text-[#8a8578]">${escapeHtml(table.waiter)} · ${table.guests || 1} ${Number(table.guests) === 1 ? 'guest' : 'guests'} · ${itemCount} ${itemCount === 1 ? 'item' : 'items'}</p>
        </div>
        <span class="badge-pill ${STATUS_TONE[table.kotStatus] || 'badge-neutral'} shrink-0">${table.kotStatus}</span>
      </div>

      <div class="mt-3 flex-1 space-y-1.5 rounded-xl border border-[#ece4d6] bg-[#fffdf9] p-2.5">
        ${itemsMarkup}
      </div>

      <div class="mt-3 flex items-center justify-between border-t border-[#ece4d6] pt-2.5">
        <span class="text-[8.5px] uppercase tracking-[0.12em] text-[#a39c8d]">${channel}</span>
        <span class="serif text-[13px] font-bold text-[#1c1a17]">${money(ticketTotal)}</span>
      </div>

      <div class="mt-3">
        <p class="section-label mb-1.5">Bump ticket</p>
        <div class="grid grid-cols-4 gap-1">
          ${STATUSES.map((status) => `
            <button type="button" data-ticket-status="${status}" data-table-id="${table.id}" class="ticket-status${table.kotStatus === status ? ' is-active' : ''}">${status}</button>
          `).join('')}
        </div>
      </div>
    </article>
  `;
}


export function renderKitchenView(container) {
  const { tables } = store.state;
  const tickets = tables.filter((table) => table.items.length > 0);
  const countBy = (status) => tickets.filter((table) => table.kotStatus === status).length;
  const activeTickets = tickets.filter((table) => table.kotStatus !== 'Served').length;

  container.innerHTML = `
    <div class="pb-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="serif text-[30px] font-bold leading-[1.08] text-[#1c1a17]">Kitchen KOT</h2>
          <p class="mt-1.5 text-[11.5px] text-[#8a8578]">Live chef tickets from the floor · bump each ticket as plates leave the pass.</p>
        </div>
        <span class="badge-pill badge-neutral mt-1 shrink-0 border border-[#e6dec8] bg-[#faf6ee] px-2.5 py-1">
          <span class="h-1.5 w-1.5 rounded-full bg-[#ea580c]"></span> ${activeTickets} active on the pass
        </span>
      </div>

      <div class="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        ${kpi({ label: 'Pending', value: countBy('Pending'), note: 'Waiting to fire', tone: 'peach', icon: ICONS.clock })}
        ${kpi({ label: 'Cooking', value: countBy('Cooking'), note: 'On the line now', tone: 'mint', icon: ICONS.flame })}
        ${kpi({ label: 'Ready', value: countBy('Ready'), note: 'Waiting to be run', tone: 'pink', icon: ICONS.bell })}
        ${kpi({ label: 'Served', value: countBy('Served'), note: 'Delivered to tables', tone: 'blue', icon: ICONS.check })}
      </div>

      <div class="mt-5 flex items-center justify-between gap-3">
        <p class="section-label">Live tickets</p>
        <p class="text-[8.5px] uppercase tracking-[0.14em] text-[#a39c8d]">${tickets.length} on the rail</p>
      </div>

      <div class="mt-2 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        ${tickets.length ? tickets.map(ticketCard).join('') : `
          <div class="col-span-1 rounded-2xl border border-dashed border-[#ddd3bf] bg-[#faf6ee] px-6 py-14 text-center lg:col-span-2 xl:col-span-3">
            <p class="serif text-lg font-bold text-[#1c1a17]">The pass is clear</p>
            <p class="mt-1 text-[10.5px] text-[#8a8578]">New orders fired from Tables &amp; POS will appear here instantly.</p>
          </div>
        `}
      </div>
    </div>
  `;

  container.querySelectorAll('[data-ticket-status]').forEach((btn) => {
    btn.onclick = () => {
      const tableId = btn.dataset.tableId;
      const status = btn.dataset.ticketStatus;
      store.mutate('KOT_STATUS', (state) => {
        const table = state.tables.find((entry) => entry.id === tableId);
        if (!table) return;
        table.kotStatus = status;
        if (status === 'Cooking' && !table.kotDeducted) {
          store.deductRecipeForItems(table.items);
          table.kotDeducted = true;
        }
      }, { tableId, status });
    };
  });
}

