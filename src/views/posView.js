import { store } from '../store/syncStore.js';
import { money, escapeHtml } from '../utils/format.js';

export function showReceiptModal(inv) {
  const modalRoot = document.getElementById('modal-root');
  const printArea = document.getElementById('thermal-receipt-area');

  const receiptHtml = `
    <div class="font-mono text-[10px] leading-relaxed text-black">
      <div class="border-b border-dashed border-slate-400 pb-2 mb-2 text-center">
        <div class="text-[13px] font-extrabold tracking-wide">BITE RESTAURANT</div>
        <div>12 Artisan Ave • Tel: 01700-000000</div>
        <div>VAT Reg: #99410238</div>
      </div>
      <div class="flex justify-between"><span>Inv: ${inv.id}</span><span>Table: ${inv.tableId}</span></div>
      <div class="mb-2 flex justify-between border-b border-dashed border-slate-400 pb-2">
        <span>Cashier: ${escapeHtml(inv.cashier)}</span><span>${inv.createdAt}</span>
      </div>
      <div class="mb-2 space-y-1 border-b border-dashed border-slate-400 pb-2">
        ${inv.items.map((item) => `<div class="flex justify-between gap-2"><span>${item.qty}x ${escapeHtml(item.name)}</span><span>${money(item.qty * item.price)}</span></div>`).join('')}
      </div>
      <div class="space-y-0.5 text-right">
        <div>Subtotal: ${money(inv.subtotal)}</div>
        <div>Discount: -${money(inv.discount)}</div>
        <div>VAT (5%): ${money(inv.vat)}</div>
        <div>Service (5%): ${money(inv.service)}</div>
        <div class="border-t border-slate-400 pt-1 text-[11px] font-bold">TOTAL: ${money(inv.total)} (${inv.payMethod})</div>
      </div>
      <div class="mt-3 border-t border-dashed border-slate-400 pt-2 text-center text-[9px]">Thank you for dining with Bite!</div>
    </div>
  `;

  printArea.innerHTML = receiptHtml;

  modalRoot.innerHTML = `
    <div class="modal-shell">
      <div class="modal-panel space-y-3" style="max-width: 360px;">
        <div class="flex items-center justify-between">
          <h3 class="serif text-[18px] font-bold text-[#1c1a17]">Receipt</h3>
          <span class="badge-pill badge-neutral">80mm thermal</span>
        </div>
        <div class="rounded-xl border border-[#e8e0d1] bg-white p-3">${receiptHtml}</div>
        <div class="flex gap-2">
          <button type="button" id="print-receipt-btn" class="btn-primary flex-1">Print 80mm</button>
          <button type="button" id="close-receipt-btn" class="btn-cream">Close</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('print-receipt-btn').onclick = () => window.print();
  document.getElementById('close-receipt-btn').onclick = () => { modalRoot.innerHTML = ''; };
}


export function renderPosView(container, uiState, rerender) {
  const { tables, menu, categories, currentUser } = store.state;
  const activeTable = tables.find((table) => table.id === uiState.selectedTableId) || tables[0];
  const catFilter = uiState.posCategory || 'All';
  const discount = Number(uiState.discount || 0);

  const dishes = menu.filter((dish) => dish.available && (catFilter === 'All' || dish.category === catFilter));
  const subtotal = activeTable.items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const taxable = Math.max(0, subtotal - discount);
  const vat = Number((taxable * 0.05).toFixed(2));
  const service = activeTable.id === 'Takeaway' ? 0 : Number((taxable * 0.05).toFixed(2));
  const grandTotal = Number((taxable + vat + service).toFixed(2));

  const occupiedTables = tables.filter((table) => table.status === 'Occupied').length;
  const availableTables = tables.length - occupiedTables;
  const openItems = tables.reduce(
    (sum, table) => sum + table.items.reduce((count, item) => count + item.qty, 0),
    0
  );
  const runningTotal = tables.reduce(
    (sum, table) => sum + table.items.reduce((amount, item) => amount + item.price * item.qty, 0),
    0
  );

  const floorMarkup = tables.map((table) => {
    const isSelected = table.id === activeTable.id;
    const tableTotal = table.items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const itemsMarkup = table.items.length
      ? table.items.map((item) => `
          <div class="flex justify-between gap-2 text-[9px] text-[#6b665a]">
            <span class="truncate">${item.qty}× ${escapeHtml(item.name)}</span>
            <span class="serif shrink-0 text-[10px] font-semibold text-[#4c473d]">${money(item.qty * item.price)}</span>
          </div>
        `).join('')
      : '<div class="text-[9px] italic text-[#b0a997]">No active items</div>';

    return `
      <div data-table-id="${table.id}" class="table-card warm-card cursor-pointer p-3.5 ${isSelected ? 'is-active' : ''}">
        <div class="flex items-start justify-between gap-2">
          <span class="serif text-[15px] font-bold text-[#1c1a17]">${table.name}</span>
          <span class="badge-pill ${table.status === 'Occupied' ? 'badge-low' : 'badge-ok'}">${table.status} · ${table.kotStatus}</span>
        </div>
        <div class="mt-1 flex items-end justify-between gap-2">
          <span class="text-[9px] text-[#8a8578]">Waiter: ${escapeHtml(table.waiter)}</span>
          <span class="serif text-[13px] font-bold text-[#1c1a17]">${money(tableTotal)}</span>
        </div>
        <div class="scroll-thin mt-2 max-h-[66px] space-y-0.5 overflow-y-auto border-t border-[#ece4d6] pt-1.5">${itemsMarkup}</div>
      </div>
    `;
  }).join('');

  const categoryMarkup = ['All', ...categories].map((category) => {
    const active = catFilter === category;
    return `
      <button type="button" data-cat="${escapeHtml(category)}" class="pos-cat-btn whitespace-nowrap rounded-full border px-2.5 py-1 text-[9.5px] font-medium transition ${
        active
          ? 'border-[#1c1a17] bg-[#1c1a17] text-[#f6f1e7]'
          : 'border-[#e0d6c2] bg-[#fbf7f0] text-[#6b665a] hover:bg-[#f3ead9]'
      }">${category === 'All' ? 'All dishes' : escapeHtml(category)}</button>
    `;
  }).join('');

  const dishMarkup = dishes.map((dish) => `
    <button type="button" data-add-dish="${dish.id}" class="pos-dish">
      <div class="flex w-full items-start justify-between gap-2">
        <span class="text-[10.5px] font-semibold leading-tight text-[#1c1a17]">${escapeHtml(dish.name)}</span>
        <span class="badge-pill badge-neutral shrink-0">${escapeHtml(dish.station)}</span>
      </div>
      <div class="mt-2 flex w-full items-end justify-between">
        <span class="text-[8px] uppercase tracking-[0.12em] text-[#a39c8d]">${escapeHtml(dish.category)}</span>
        <span class="serif text-[12.5px] font-bold text-[#1c1a17]">${money(dish.price)}</span>
      </div>
    </button>
  `).join('');

  const cartItemMarkup = activeTable.items.length
    ? activeTable.items.map((item) => `
        <div class="flex items-center justify-between gap-2 rounded-xl border border-[#ece4d6] bg-[#fffdf9] px-2.5 py-2">
          <div class="min-w-0">
            <p class="truncate text-[10px] font-semibold text-[#1c1a17]">${escapeHtml(item.name)}</p>
            <p class="serif text-[9.5px] text-[#a39c8d]">${money(item.price)} each</p>
          </div>
          <div class="flex shrink-0 items-center gap-1.5">
            <button type="button" data-qty-dish="${item.dishId}" data-delta="-1" class="mini-btn px-2">−</button>
            <span class="w-4 text-center text-[10px] font-semibold text-[#1c1a17]">${item.qty}</span>
            <button type="button" data-qty-dish="${item.dishId}" data-delta="1" class="mini-btn px-2">+</button>
          </div>
        </div>
      `).join('')
    : '<p class="rounded-xl border border-dashed border-[#ddd3bf] px-3 py-8 text-center text-[10px] text-[#a39c8d]">Tap a dish to start this order</p>';


  const pageHeaderMarkup = `
    <div class="flex items-start justify-between gap-4">
      <div>
        <h2 class="serif text-[30px] font-bold leading-[1.08] text-[#1c1a17]">Tables &amp; POS</h2>
        <p class="mt-1.5 text-[11.5px] text-[#8a8578]">Select a table to take orders, fire the kitchen ticket or settle an 80 mm bill.</p>
      </div>
      <div class="flex shrink-0 items-center gap-2 pt-1">
        <span class="badge-pill badge-ok">● ${availableTables} available</span>
        <span class="badge-pill badge-low">● ${occupiedTables} occupied</span>
      </div>
    </div>
  `;

  const kpiMarkup = `
    <div class="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div class="kpi kpi--peach">
        <span class="kpi-blob"></span>
        <span class="kpi-watermark">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h12l1.5 14h-15L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>
        </span>
        <p class="kpi-label">Occupied tables</p>
        <p class="kpi-value serif">${occupiedTables}</p>
        <p class="kpi-note">In service right now</p>
      </div>
      <div class="kpi kpi--mint">
        <span class="kpi-blob"></span>
        <span class="kpi-watermark">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3v5.5a2.5 2.5 0 0 0 5 0V3"/><path d="M7.5 11v10"/><path d="M18 3c-1.5 1.6-2.3 3.8-2.3 6 0 1.9 1 2.9 2.3 2.9h1V3h-1Z"/><path d="M19 12v9"/></svg>
        </span>
        <p class="kpi-label">Open items</p>
        <p class="kpi-value serif">${openItems}</p>
        <p class="kpi-note">Across the floor</p>
      </div>
      <div class="kpi kpi--pink">
        <span class="kpi-blob"></span>
        <span class="kpi-watermark">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 2h14v20l-2.3-1.6-2.4 1.6-2.3-1.6L9.7 22 7.3 20.4 5 22V2Z"/><path d="M9 7h6M9 11h6M9 15h4"/></svg>
        </span>
        <p class="kpi-label">Running total</p>
        <p class="kpi-value serif small">${money(runningTotal)}</p>
        <p class="kpi-note">Unsettled tabs</p>
      </div>
    </div>
  `;

  const floorSection = `
    <div class="mt-5 flex items-center justify-between gap-3">
      <p class="section-label">Floor plan</p>
      <p class="text-[8.5px] uppercase tracking-[0.14em] text-[#a39c8d]">${activeTable.name} selected</p>
    </div>
    <div class="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" id="posTableStrip">${floorMarkup}</div>
  `;


  container.innerHTML = `
    <div class="pb-6">
      ${pageHeaderMarkup}
      ${kpiMarkup}
      ${floorSection}

      <div class="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div class="col-span-1 flex flex-col p-4 warm-card lg:col-span-7">
          <div class="flex items-center justify-between gap-2">
            <div>
              <p class="section-label">Order builder</p>
              <h3 class="serif mt-0.5 text-[16px] font-bold text-[#1c1a17]">Add to ${activeTable.name}</h3>
            </div>
            <span class="badge-pill badge-neutral">${dishes.length} dishes</span>
          </div>
          <div class="mt-3 flex flex-wrap gap-1.5">${categoryMarkup}</div>
          <div class="scroll-thin mt-3 grid max-h-[330px] grid-cols-2 gap-2.5 overflow-y-auto pr-1" id="posMenuGrid">${dishMarkup}</div>
        </div>

        <div class="col-span-1 flex flex-col justify-between p-4 warm-card lg:col-span-5" id="posBilling">
          <div>
            <div class="flex items-start justify-between gap-2 border-b border-[#ece4d6] pb-3">
              <div>
                <p class="section-label">Active order</p>
                <h3 class="serif mt-0.5 text-[16px] font-bold text-[#1c1a17]">${activeTable.name}</h3>
                <p class="mt-0.5 text-[9px] text-[#8a8578]">KOT · <span class="font-semibold text-[#c2410c]">${activeTable.kotStatus}</span> · ${escapeHtml(currentUser.name)}</p>
              </div>
              <select id="kot-status-select" class="rounded-lg border border-[#e0d6c2] bg-[#fffdf9] px-2 py-1 text-[9.5px] text-[#4c473d] outline-none focus:border-[#f59e0b]">
                ${['Pending', 'Cooking', 'Ready', 'Served'].map((status) => `<option value="${status}" ${activeTable.kotStatus === status ? 'selected' : ''}>${status}</option>`).join('')}
              </select>
            </div>

            <div class="scroll-thin mt-3 max-h-[200px] space-y-2 overflow-y-auto pr-1">${cartItemMarkup}</div>
          </div>

          <div class="mt-3 space-y-1.5 border-t border-[#ece4d6] pt-3 text-[10px] text-[#6b665a]">
            <div class="flex justify-between">
              <span>Subtotal</span>
              <span class="serif text-[11px] font-semibold text-[#1c1a17]">${money(subtotal)}</span>
            </div>
            <div class="flex items-center justify-between">
              <span>Discount</span>
              <input id="pos-discount-input" type="number" min="0" step="0.01" value="${discount}" class="w-16 rounded-md border border-[#e4dbc9] bg-[#fffdf9] px-1.5 py-0.5 text-right text-[10px] outline-none focus:border-[#f59e0b]" />
            </div>
            <div class="flex justify-between">
              <span>VAT (5%) + Service (${activeTable.id === 'Takeaway' ? '0%' : '5%'})</span>
              <span>${money(vat + service)}</span>
            </div>
            <div class="flex items-end justify-between border-t border-[#ece4d6] pt-2">
              <span class="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#8a8578]">Grand total</span>
              <span class="serif text-[20px] font-bold text-[#1c1a17]">${money(grandTotal)}</span>
            </div>
            <div class="grid grid-cols-2 gap-2 pt-1">
              <button type="button" id="fire-kot-btn" class="btn-dark">Fire KOT</button>
              <button type="button" id="settle-bill-btn" class="btn-primary">Settle &amp; print</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile quick checkout bar (sticky, phones only) -->
      <div class="pos-quick-checkout" id="posQuickCheckout">
        <div class="pos-quick-checkout__info">
          <span class="pos-quick-checkout__label">${escapeHtml(activeTable.name)} total</span>
          <span class="pos-quick-checkout__amount serif" id="posQuickTotal">${money(grandTotal)}</span>
        </div>
        <button type="button" class="btn-primary pos-quick-checkout__btn" id="posQuickCheckoutBtn">
          Go to billing
        </button>
      </div>
    </div>
  `;

  container.querySelectorAll('.table-card').forEach((el) => {
    el.onclick = () => {
      uiState.selectedTableId = el.dataset.tableId;
      rerender();
    };
  });

  container.querySelectorAll('.pos-cat-btn').forEach((btn) => {
    btn.onclick = () => {
      uiState.posCategory = btn.dataset.cat;
      rerender();
    };
  });

  container.querySelectorAll('[data-add-dish]').forEach((btn) => {
    btn.onclick = () => {
      const dish = menu.find((item) => item.id === btn.dataset.addDish);
      if (!dish) return;
      store.mutate('POS_ADD_ITEM', (state) => {
        const table = state.tables.find((item) => item.id === activeTable.id);
        const existing = table.items.find((item) => item.dishId === dish.id);
        if (existing) existing.qty += 1;
        else table.items.push({ dishId: dish.id, name: dish.name, price: dish.price, qty: 1, station: dish.station });
        table.status = 'Occupied';
      }, { tableId: activeTable.id, dishId: dish.id });
    };
  });

  container.querySelectorAll('[data-qty-dish]').forEach((btn) => {
    btn.onclick = () => {
      const dishId = btn.dataset.qtyDish;
      const delta = Number(btn.dataset.delta);
      store.mutate('POS_QTY_CHANGE', (state) => {
        const table = state.tables.find((item) => item.id === activeTable.id);
        const item = table.items.find((entry) => entry.dishId === dishId);
        if (item) {
          item.qty += delta;
          if (item.qty <= 0) table.items = table.items.filter((entry) => entry.dishId !== dishId);
        }
        if (!table.items.length) {
          table.status = 'Available';
          table.kotStatus = 'Pending';
        }
      }, { tableId: activeTable.id, dishId, delta });
    };
  });

  document.getElementById('kot-status-select').onchange = (event) => {
    store.mutate('KOT_STATUS', (state) => {
      const table = state.tables.find((item) => item.id === activeTable.id);
      table.kotStatus = event.target.value;
    }, { tableId: activeTable.id, status: event.target.value });
  };

  document.getElementById('pos-discount-input').onchange = (event) => {
    uiState.discount = Math.max(0, Number(event.target.value || 0));
    rerender();
  };

  const quickCheckoutBtn = document.getElementById('posQuickCheckoutBtn');
  if (quickCheckoutBtn) {
    quickCheckoutBtn.onclick = () => {
      const billing = document.getElementById('posBilling');
      if (!billing) return;
      billing.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
  }

  document.getElementById('fire-kot-btn').onclick = () => {
    if (!activeTable.items.length) return;
    store.mutate('FIRE_KOT', (state) => {
      const table = state.tables.find((item) => item.id === activeTable.id);
      table.kotStatus = 'Cooking';
      table.kotDeducted = true;
      store.deductRecipeForItems(table.items);
    }, { tableId: activeTable.id });
  };

  document.getElementById('settle-bill-btn').onclick = () => {
    if (!activeTable.items.length) return;
    let settledInvoice = null;
    store.mutate('SETTLE_INVOICE', (state) => {
      const table = state.tables.find((item) => item.id === activeTable.id);
      if (!table.kotDeducted) store.deductRecipeForItems(table.items);
      settledInvoice = {
        id: 'INV-' + (1001 + state.invoices.length),
        tableId: table.id,
        cashier: currentUser.name,
        payMethod: 'Cash',
        createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        items: structuredClone(table.items),
        subtotal,
        discount,
        vat,
        service,
        total: grandTotal
      };
      state.invoices.unshift(settledInvoice);
      table.items = [];
      table.status = 'Available';
      table.kotStatus = 'Pending';
      table.kotDeducted = false;
    }, { tableId: activeTable.id, grandTotal });
    uiState.discount = 0;
    if (settledInvoice) showReceiptModal(settledInvoice);
  };
}

