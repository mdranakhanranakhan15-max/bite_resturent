/**
 * Bite Analytics — sales charts, KPI cards and the invoice ledger.
 */
import {
  getState, can, findCategory,
} from './store.js';
import { getUser } from './auth.js';
import { openReceiptModal, exportSalesCsv } from './billing.js';
import {
  $, esc, icon, money, emptyState, lastNDays, fmtDate, fmtTime, round2, dateKey, isToday,
} from './utils.js';

let chartInstances = [];
let invoiceRange = '7';
let invoiceSearch = '';

const PALETTE = ['#e07a3f', '#14161c', '#4f7c66', '#b78524', '#b34a33', '#7a6a8a', '#8c7b63'];

function invoicesDesc() {
  return [...getState().invoices].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

function rangeInvoices() {
  const invoices = invoicesDesc();
  const term = invoiceSearch.trim().toLowerCase();
  let cutoff = null;
  if (invoiceRange !== 'all') {
    const days = invoiceRange === 'today' ? 1 : 7;
    cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - (days - 1));
  }
  return invoices.filter((invoice) => {
    if (cutoff && new Date(invoice.at).getTime() < cutoff.getTime()) return false;
    if (!term) return true;
    return [invoice.invoiceNo, invoice.tableName, invoice.cashierName, invoice.method]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(term));
  });
}

function invoiceRow(invoice) {
  const methodClass = invoice.method === 'cash' ? 'badge-amber' : invoice.method === 'card' ? 'badge-neutral' : 'badge-sage';
  return `<tr class="invoice-row" data-invoice-id="${esc(invoice.id)}">
    <td>
      <div class="inv-id">${esc(invoice.invoiceNo)}</div>
      <div class="tiny muted">${(invoice.items || []).length} line${(invoice.items || []).length === 1 ? '' : 's'}</div>
    </td>
    <td class="tiny">${esc(fmtDate(invoice.at))}<div class="muted">${esc(fmtTime(invoice.at))}</div></td>
    <td class="tiny">${esc(invoice.tableName || invoice.tableId || '—')}</td>
    <td class="num" style="font-weight:800">${money(invoice.total)}</td>
    <td><span class="badge ${methodClass}">${esc(invoice.method || '—')}</span></td>
    <td class="tiny">${esc(invoice.cashierName || '—')}</td>
    <td><button class="btn btn-sm" type="button" data-reprint="${esc(invoice.id)}">${icon('printer')} Receipt</button></td>
  </tr>`;
}

function invoiceTableMarkup() {
  const rows = rangeInvoices();
  if (!rows.length) {
    return `<tr><td colspan="7">${emptyState('receipt', 'No invoices in this range', 'Settle a table or change the date filter to see receipts here.')}</td></tr>`;
  }
  return rows.map((invoice) => invoiceRow(invoice)).join('');
}

function refreshInvoiceTable(root) {
  const tbody = $('#invoice-tbody', root);
  const count = $('#invoice-count', root);
  if (tbody) tbody.innerHTML = invoiceTableMarkup();
  if (count) count.textContent = `${rangeInvoices().length} invoice${rangeInvoices().length === 1 ? '' : 's'}`;
  root.querySelectorAll('[data-range]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.range === invoiceRange);
  });
}

function salesSeries() {
  const days = lastNDays(7);
  const invoices = getState().invoices;
  return days.map((day) => {
    const dayInvoices = invoices.filter((invoice) => dateKey(invoice.at) === day.key);
    return {
      ...day,
      revenue: round2(dayInvoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0)),
      orders: dayInvoices.length,
      covers: dayInvoices.reduce((sum, invoice) => sum + Number(invoice.guests || 0), 0),
    };
  });
}

function categoryMix() {
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - 6);
  const totals = new Map();
  getState().invoices
    .filter((invoice) => new Date(invoice.at).getTime() >= cutoff.getTime())
    .forEach((invoice) => {
      (invoice.items || []).forEach((line) => {
        const key = line.categoryId || 'uncat';
        const entry = totals.get(key) || { qty: 0, revenue: 0 };
        entry.qty += Number(line.qty || 0);
        entry.revenue += Number(line.price || 0) * Number(line.qty || 0);
        totals.set(key, entry);
      });
    });
  return [...totals.entries()].map(([key, value], index) => ({
    key,
    name: findCategory(key)?.name || 'Uncategorised',
    qty: value.qty,
    revenue: round2(value.revenue),
    color: PALETTE[index % PALETTE.length],
  })).sort((a, b) => b.revenue - a.revenue);
}

function paymentMix() {
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - 6);
  const totals = { cash: 0, card: 0, mobile: 0 };
  getState().invoices
    .filter((invoice) => new Date(invoice.at).getTime() >= cutoff.getTime())
    .forEach((invoice) => {
      const key = totals[invoice.method] === undefined ? 'cash' : invoice.method;
      totals[key] += Number(invoice.total || 0);
    });
  return totals;
}

function topSellers() {
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - 6);
  const totals = new Map();
  getState().invoices
    .filter((invoice) => new Date(invoice.at).getTime() >= cutoff.getTime())
    .forEach((invoice) => {
      (invoice.items || []).forEach((line) => {
        const entry = totals.get(line.name) || { qty: 0, revenue: 0 };
        entry.qty += Number(line.qty || 0);
        entry.revenue += Number(line.price || 0) * Number(line.qty || 0);
        totals.set(line.name, entry);
      });
    });
  return [...totals.entries()]
    .map(([name, value]) => ({ name, ...value, revenue: round2(value.revenue) }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 6);
}
function destroyCharts() {
  chartInstances.forEach((chart) => {
    try { chart.destroy(); } catch { /* already gone */ }
  });
  chartInstances = [];
}

function analyticsKpis(data) {
  return `<div class="kpi-grid">
    <div class="kpi" style="--tint:var(--saffron-wash)">
      <div class="kpi-label">Today's revenue</div>
      <div class="kpi-value">${money(data.todayRevenue)}</div>
      <div class="kpi-foot">${data.yesterdayRevenue > 0
        ? `<strong style="color:${data.delta >= 0 ? 'var(--sage)' : 'var(--brick)'}">${data.delta >= 0 ? '+' : ''}${data.delta}%</strong> vs yesterday`
        : (data.todayRevenue > 0 ? 'First sales today' : 'No sales yet today')}</div>
      <div class="kpi-icon">${icon('cash')}</div>
    </div>
    <div class="kpi" style="--tint:var(--sage-wash)">
      <div class="kpi-label">Today's bills</div>
      <div class="kpi-value">${data.todayInvoices.length}</div>
      <div class="kpi-foot">${data.covers} covers seated</div>
      <div class="kpi-icon">${icon('receipt')}</div>
    </div>
    <div class="kpi" style="--tint:var(--amber-wash)">
      <div class="kpi-label">Average ticket</div>
      <div class="kpi-value">${money(data.avgTicket)}</div>
      <div class="kpi-foot">Across today's paid bills</div>
      <div class="kpi-icon">${icon('spark')}</div>
    </div>
    <div class="kpi" style="--tint:var(--brick-wash)">
      <div class="kpi-label">Pending sync</div>
      <div class="kpi-value">${data.pending}</div>
      <div class="kpi-foot">${data.pending ? 'Queued on this device' : 'All changes synced'}</div>
      <div class="kpi-icon">${icon('cloud')}</div>
    </div>
  </div>`;
}

function analyticsCharts(data) {
  const paymentLegend = [
    { label: 'Cash', value: data.payments.cash, color: '#e07a3f' },
    { label: 'Card', value: data.payments.card, color: '#14161c' },
    { label: 'Mobile', value: data.payments.mobile, color: '#4f7c66' },
  ].map((row) => `<div class="legend-row">
      <span class="swatch" style="background:${row.color}"></span>
      <span class="lbl">${row.label}</span>
      <span class="val">${money(row.value)} · ${data.paymentTotal ? Math.round((row.value / data.paymentTotal) * 100) : 0}%</span>
    </div>`).join('');

  const categoryLegend = data.categories.length
    ? data.categories.slice(0, 5).map((category) => `<div class="legend-row">
        <span class="swatch" style="background:${category.color}"></span>
        <span class="lbl">${esc(category.name)}</span>
        <span class="val">${money(category.revenue)}</span>
      </div>`).join('')
    : '<div class="tiny muted">No category sales in the last 7 days.</div>';

  return `<div class="chart-grid">
      <div class="chart-box">
        <div class="cb-head">
          <div><h3>Revenue · last 7 days</h3><p>${esc(data.series[0].short)} – ${esc(data.series[data.series.length - 1].short)}</p></div>
          <span class="badge badge-accent">${money(data.weekRevenue)}</span>
        </div>
        <div class="chart-canvas-wrap"><canvas id="chart-revenue" aria-label="Revenue for the last seven days" role="img"></canvas></div>
      </div>
      <div class="chart-box">
        <div class="cb-head">
          <div><h3>Payment mix</h3><p>Collected in the last 7 days</p></div>
          <span class="badge badge-neutral">${money(data.paymentTotal)}</span>
        </div>
        <div class="chart-canvas-wrap short"><canvas id="chart-payment" aria-label="Payment method mix" role="img"></canvas></div>
        <div class="legend-list" style="margin-top:8px">${paymentLegend}</div>
      </div>
    </div>
    <div class="chart-grid" style="grid-template-columns:1fr 1.5fr">
      <div class="chart-box">
        <div class="cb-head"><div><h3>Category mix</h3><p>Revenue by menu category</p></div></div>
        <div class="chart-canvas-wrap short"><canvas id="chart-category" aria-label="Revenue by menu category" role="img"></canvas></div>
        <div class="legend-list" style="margin-top:6px">${categoryLegend}</div>
      </div>
      <div class="chart-box">
        <div class="cb-head"><div><h3>Top sellers</h3><p>Units sold in the last 7 days</p></div><span class="badge badge-neutral">${data.top.length} items</span></div>
        <div class="chart-canvas-wrap short"><canvas id="chart-top" aria-label="Top selling dishes" role="img"></canvas></div>
      </div>
    </div>`;
}

function invoiceCardMarkup() {
  return `<div class="card" style="margin-top:14px">
    <div class="card-head" style="flex-wrap:wrap;gap:8px">
      <div><h3>Invoice ledger</h3><p>Tap any row to reopen its 80mm thermal receipt.</p></div>
      <div class="flex items-center gap-2" style="flex-wrap:wrap">
        <div class="seg" role="group" aria-label="Invoice range">
          <button type="button" data-range="today" class="${invoiceRange === 'today' ? 'is-active' : ''}">Today</button>
          <button type="button" data-range="7" class="${invoiceRange === '7' ? 'is-active' : ''}">7 days</button>
          <button type="button" data-range="all" class="${invoiceRange === 'all' ? 'is-active' : ''}">All</button>
        </div>
        <div class="search" style="min-width:170px">
          ${icon('search')}
          <input id="invoice-search" class="input" placeholder="Invoice, table, cashier…" value="${esc(invoiceSearch)}" autocomplete="off" aria-label="Search invoices">
        </div>
        <span class="badge badge-neutral" id="invoice-count">${rangeInvoices().length} invoices</span>
      </div>
    </div>
    <div class="table-wrap">
      <table class="data" style="min-width:740px">
        <thead><tr><th>Invoice</th><th>When</th><th>Table</th><th class="num">Total</th><th>Method</th><th>Cashier</th><th></th></tr></thead>
        <tbody id="invoice-tbody">${invoiceTableMarkup()}</tbody>
      </table>
    </div>
  </div>`;
}
export function renderAnalytics(root) {
  const user = getUser();
  if (!can(user, 'analytics.view')) {
    root.innerHTML = `<div class="card">${emptyState('lock', 'Analytics access required', 'Your role does not include sales analytics.')}</div>`;
    return;
  }
  destroyCharts();

  const state = getState();
  const series = salesSeries();
  const todayInvoices = state.invoices.filter((invoice) => isToday(invoice.at));
  const todayRevenue = round2(todayInvoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0));
  const yesterdayRevenue = series[series.length - 2]?.revenue || 0;
  const delta = yesterdayRevenue > 0
    ? round2(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100)
    : (todayRevenue > 0 ? 100 : 0);
  const avgTicket = todayInvoices.length ? round2(todayRevenue / todayInvoices.length) : 0;
  const pending = state.syncQueue.filter((item) => item.status !== 'SYNCED').length;
  const weekRevenue = round2(series.reduce((sum, day) => sum + day.revenue, 0));
  const categories = categoryMix();
  const payments = paymentMix();
  const paymentTotal = round2(payments.cash + payments.card + payments.mobile);
  const top = topSellers();
  const data = {
    series, todayInvoices, todayRevenue, yesterdayRevenue, delta, avgTicket, pending,
    weekRevenue, categories, payments, paymentTotal, top,
    covers: series[series.length - 1]?.covers || 0,
  };

  const scrollTop = root.scrollTop;
  root.innerHTML = `<div class="view-enter">
    <div class="page-head">
      <div>
        <h2>Bills &amp; analytics</h2>
        <p>Seven days of revenue, payment mix and the busiest plates — calculated on this device.</p>
      </div>
      <div class="page-actions">
        <button class="btn" type="button" data-analytics-refresh>${icon('sync')} Refresh</button>
        <button class="btn btn-primary" type="button" data-export-sales>${icon('download')} Export sales</button>
      </div>
    </div>
    ${analyticsKpis(data)}
    ${analyticsCharts(data)}
    ${invoiceCardMarkup()}
  </div>`;
  root.scrollTop = scrollTop;

  $('#invoice-search', root)?.addEventListener('input', (event) => {
    invoiceSearch = event.target.value;
    refreshInvoiceTable(root);
  });

  if (!root.dataset.analyticsBound) {
    root.addEventListener('click', (event) => {
      const rangeButton = event.target.closest('[data-range]');
      if (rangeButton) {
        invoiceRange = rangeButton.dataset.range;
        refreshInvoiceTable(root);
        return;
      }
      if (event.target.closest('[data-analytics-refresh]')) {
        renderAnalytics(root);
        toast('Analytics refreshed.', { type: 'info', timeout: 1500 });
        return;
      }
      if (event.target.closest('[data-export-sales]')) {
        const rows = rangeInvoices();
        if (!rows.length) {
          toast('No invoices in this range to export.', { type: 'warn' });
          return;
        }
        exportSalesCsv(rows);
        return;
      }
      const row = event.target.closest('[data-invoice-id]');
      if (row) {
        const invoice = getState().invoices.find((entry) => entry.id === row.dataset.invoiceId);
        if (invoice) openReceiptModal(invoice);
      }
    });
    root.dataset.analyticsBound = '1';
  }

  requestAnimationFrame(() => renderCharts(data));
}
function renderCharts(data) {
  const ChartLib = window.Chart;
  if (!ChartLib) {
    document.querySelectorAll('.chart-canvas-wrap').forEach((wrap) => {
      wrap.innerHTML = '<div class="board-empty">Chart.js could not load. Reconnect once so the service worker can cache it.</div>';
    });
    return;
  }
  ChartLib.defaults.font.family = "'Manrope', ui-sans-serif, sans-serif";
  ChartLib.defaults.color = '#6f6a60';
  ChartLib.defaults.font.size = 10;
  renderRevenueChart(ChartLib, data);
  renderPaymentChart(ChartLib, data);
  renderCategoryChart(ChartLib, data);
  renderTopChart(ChartLib, data);
}

function renderRevenueChart(ChartLib, data) {
  const canvas = document.getElementById('chart-revenue');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 210);
  gradient.addColorStop(0, 'rgba(224,122,63,0.30)');
  gradient.addColorStop(1, 'rgba(224,122,63,0)');
  chartInstances.push(new ChartLib(ctx, {
    type: 'line',
    data: {
      labels: data.series.map((day) => day.label),
      datasets: [{
        data: data.series.map((day) => day.revenue),
        borderColor: '#e07a3f',
        backgroundColor: gradient,
        borderWidth: 2.5,
        fill: true,
        tension: 0.38,
        pointRadius: 2.5,
        pointHoverRadius: 5,
        pointBackgroundColor: '#fffdf9',
        pointBorderColor: '#e07a3f',
        pointBorderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#14161c', padding: 10, displayColors: false, cornerRadius: 8,
          callbacks: { label: (context) => ` ${money(context.parsed.y)} · ${data.series[context.dataIndex].orders} bills` },
        },
      },
      scales: {
        x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 9.5 } } },
        y: {
          beginAtZero: true,
          grid: { color: '#efe9dd' },
          border: { display: false },
          ticks: { maxTicksLimit: 5, font: { size: 9.5 }, callback: (value) => money(value, { decimals: 0 }) },
        },
      },
    },
  }));
}
function renderPaymentChart(ChartLib, data) {
  const canvas = document.getElementById('chart-payment');
  if (!canvas) return;
  if (data.paymentTotal <= 0) {
    canvas.parentElement.innerHTML = '<div class="board-empty">No payments collected in the last 7 days.</div>';
    return;
  }
  const centerText = {
    id: 'biteCenter',
    afterDraw(chart) {
      const { ctx, chartArea } = chart;
      if (!chartArea) return;
      const x = (chartArea.left + chartArea.right) / 2;
      const y = (chartArea.top + chartArea.bottom) / 2;
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = '#6f6a60';
      ctx.font = '700 8.5px Manrope, sans-serif';
      ctx.fillText('7-DAY SALES', x, y - 7);
      ctx.fillStyle = '#14161c';
      ctx.font = '600 19px Fraunces, Georgia, serif';
      ctx.fillText(money(data.paymentTotal), x, y + 14);
      ctx.restore();
    },
  };
  chartInstances.push(new ChartLib(canvas.getContext('2d'), {
    type: 'doughnut',
    data: {
      labels: ['Cash', 'Card', 'Mobile'],
      datasets: [{
        data: [data.payments.cash, data.payments.card, data.payments.mobile],
        backgroundColor: ['#e07a3f', '#14161c', '#4f7c66'],
        borderColor: '#fffdf9',
        borderWidth: 3,
        hoverOffset: 4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#14161c', padding: 10, cornerRadius: 8,
          callbacks: { label: (context) => ` ${context.label}: ${money(context.parsed)}` },
        },
      },
    },
    plugins: [centerText],
  }));
}

function renderCategoryChart(ChartLib, data) {
  const canvas = document.getElementById('chart-category');
  if (!canvas) return;
  if (!data.categories.length) {
    canvas.parentElement.innerHTML = '<div class="board-empty">No category sales yet.</div>';
    return;
  }
  chartInstances.push(new ChartLib(canvas.getContext('2d'), {
    type: 'doughnut',
    data: {
      labels: data.categories.map((category) => category.name),
      datasets: [{
        data: data.categories.map((category) => category.revenue),
        backgroundColor: data.categories.map((category) => category.color),
        borderColor: '#fffdf9',
        borderWidth: 3,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#14161c', padding: 10, cornerRadius: 8,
          callbacks: { label: (context) => ` ${context.label}: ${money(context.parsed)}` },
        },
      },
    },
  }));
}
function renderTopChart(ChartLib, data) {
  const canvas = document.getElementById('chart-top');
  if (!canvas) return;
  if (!data.top.length) {
    canvas.parentElement.innerHTML = '<div class="board-empty">No dishes sold yet.</div>';
    return;
  }
  chartInstances.push(new ChartLib(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels: data.top.map((item) => item.name),
      datasets: [{
        data: data.top.map((item) => item.qty),
        backgroundColor: '#e07a3f',
        hoverBackgroundColor: '#c4622c',
        borderRadius: 5,
        borderSkipped: false,
        barThickness: 15,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#14161c', padding: 10, cornerRadius: 8,
          callbacks: { label: (context) => ` ${context.parsed.x} sold · ${money(data.top[context.dataIndex].revenue)}` },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: '#efe9dd' },
          border: { display: false },
          ticks: { precision: 0, font: { size: 9 } },
        },
        y: {
          grid: { display: false },
          border: { display: false },
          ticks: {
            font: { size: 9.5, weight: '600' },
            callback(value) {
              const label = this.getLabelForValue(value);
              return label.length > 17 ? `${label.slice(0, 16)}…` : label;
            },
          },
        },
      },
    },
  }));
}




